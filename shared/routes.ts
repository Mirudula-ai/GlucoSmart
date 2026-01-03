import { z } from 'zod';
import { insertGlucoseLogSchema, insertProfileSchema, glucoseLogs, riskAssessments, profiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/profile',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/profile',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
  },
  glucoseLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      input: z.object({
        userId: z.string().optional(), // For doctors
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof glucoseLogs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/logs',
      input: insertGlucoseLogSchema,
      responses: {
        201: z.custom<typeof glucoseLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    confirm: {
      method: 'PATCH' as const,
      path: '/api/logs/:id/confirm',
      responses: {
        200: z.custom<typeof glucoseLogs.$inferSelect>(),
      },
    },
  },
  riskAssessment: {
    getLatest: {
      method: 'GET' as const,
      path: '/api/risk/latest',
      input: z.object({ userId: z.string().optional() }).optional(),
      responses: {
        200: z.custom<typeof riskAssessments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ocr: {
    process: {
      method: 'POST' as const,
      path: '/api/ocr/process',
      // input is multipart/form-data, not strictly validated here by Zod middleware usually
      responses: {
        200: z.object({
          extractedValues: z.array(z.object({
            value: z.number(),
            type: z.enum(["fasting", "post_prandial", "hba1c", "random"]),
            confidence: z.number(),
          })),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
