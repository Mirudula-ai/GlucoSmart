import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import multer from "multer";
import OpenAI from "openai";

const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client using Replit AI Integrations env vars
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Protected middleware
  const requireAuth = isAuthenticated;

  // === Profile ===
  app.get(api.profiles.get.path, requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
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
    // TODO: implement doctor access to other patients if needed
    const logs = await storage.getGlucoseLogs(userId);
    res.json(logs);
  });

  app.post(api.glucoseLogs.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.glucoseLogs.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const log = await storage.createGlucoseLog({
        ...input,
        userId,
      });

      // After creating log, maybe update risk assessment?
      // For MVP, simplistic check:
      const recentLogs = await storage.getGlucoseLogs(userId);
      // Calculate basic risk
      // ... logic here or separate service
      
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
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

      // Call OpenAI Vision
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Or gpt-4.1 if available via Replit
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

  return httpServer;
}
