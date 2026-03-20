import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import OpenAI from "openai";
import { updateRiskAssessment } from "./services/risk";

const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client using Replit AI Integrations env vars
const openai = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  ? new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  })
  : null;

if (!openai) {
  console.warn("[AI] OpenAI API key not found. AI features will be disabled.");
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Protected middleware
  const requireAuth = isAuthenticated;

  app.get(api.profiles.get.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let profile = await storage.getProfile(userId);

    if (!profile) {
      // Auto-create base profile for GlucoSmart context
      profile = await storage.upsertProfile(userId, { role: "patient" });
    }

    res.json(profile);
  });

  app.patch(api.profiles.update.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.upsertProfile(userId, req.body);
    res.json(profile);
  });

  // === Logs ===
  app.get(api.glucoseLogs.list.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const logs = await storage.getGlucoseLogs(userId);
    res.json(logs);
  });

  app.post(api.glucoseLogs.create.path, requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Parse with coercion for dates/numbers
      const bodySchema = api.glucoseLogs.create.input.omit({ userId: true }).extend({
        measuredAt: z.coerce.date(),
        value: z.coerce.number(),
      });

      console.log("[POST /api/logs] Received:", req.body);
      const input = bodySchema.parse(req.body);

      const log = await storage.createGlucoseLog({
        ...input,
        userId,
      } as any);

      // Update risk assessment after new log
      try {
        await updateRiskAssessment(userId);
      } catch (err) {
        console.error("Failed to update risk assessment:", err);
        // Don't fail the request if risk calculation fails
      }

      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.warn("[POST /api/logs] Validation failed:", err.errors);
        return res.status(400).json({
          message: String(err.errors[0].message),
          field: String(err.errors[0].path[0] || ""),
        });
      }
      console.error("[POST /api/logs] Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.glucoseLogs.confirm.path, requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user.claims.sub;

      const log = await storage.confirmGlucoseLog(id);
      if (!log) return res.status(404).json({ message: "Log not found" });

      // Recalculate risk on confirmation
      try {
        await updateRiskAssessment(userId);
      } catch (err) {
        console.error("Failed to update risk assessment:", err);
      }

      res.json(log);
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // === Risk Assessment ===
  app.get(api.riskAssessment.getLatest.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const assessment = await storage.getLatestRiskAssessment(userId);
    if (!assessment) return res.status(404).json({ message: "No assessment found" });
    res.json(assessment);
  });

  // === OCR Processing ===
  app.post(api.ocr.process.path, requireAuth, upload.single('file'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Convert buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      console.log(`[OCR] Processing file: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);

      // Call OpenAI Vision
      if (!openai) {
        console.error("[OCR] OpenAI client not initialized. Check AI_INTEGRATIONS_OPENAI_API_KEY environment variable.");
        return res.status(503).json({
          message: "Clinical Intelligence (AI Vision) is currently disabled. Please provide an OpenAI API key to enable OCR features."
        });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an OCR assistant for medical lab reports. Extract glucose values (Fasting, Post Prandial, HbA1c) from the image. Return ONLY a JSON object with this structure: { extractedValues: [{ value: number, type: 'fasting' | 'post_prandial' | 'hba1c' | 'random', confidence: number }] }. If no values found, return empty array."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract glucose levels from this report." },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content || "{}");

      res.json(result);
    } catch (error) {
      console.error("OCR Error:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // === Patient Management (Doctor only) ===
  app.get(api.patients.list.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);

    if (!profile || profile.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can access patient lists" });
    }

    const patients = await storage.getPatients(userId);
    res.json(patients);
  });

  app.post(api.patients.add.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);

    if (!profile || profile.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can add patients" });
    }

    const { email } = api.patients.add.input.parse(req.body);

    // Find user by email
    const [patientUser] = await db.select().from(users).where(eq(users.email, email));
    if (!patientUser) {
      return res.status(404).json({ message: "User not found. Ask the patient to log in first." });
    }

    // Upsert profile with doctorId
    await storage.upsertProfile(patientUser.id, { doctorId: userId });

    res.json({ message: "Patient added successfully" });
  });

  return httpServer;
}
