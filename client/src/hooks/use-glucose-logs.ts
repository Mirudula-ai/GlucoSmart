import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertGlucoseLog, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// === TYPES ===
// Inferring from schema for now, but strictly these should come from shared/schema exports if possible
// Re-defining briefly to match the expected usage in components
type GlucoseLog = z.infer<typeof api.glucoseLogs.list.responses[200]>[number];

// === QUERY KEYS ===
export const glucoseKeys = {
  all: ['glucose-logs'] as const,
  list: (filters: Record<string, string> = {}) => [...glucoseKeys.all, 'list', filters] as const,
};

// === HOOKS ===

export function useGlucoseLogs(filters?: { userId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: glucoseKeys.list(filters),
    queryFn: async () => {
      const url = buildUrl(api.glucoseLogs.list.path);
      // Construct query string manually since buildUrl only handles path params in this specific helper
      const queryParams = new URLSearchParams();
      if (filters?.userId) queryParams.append("userId", filters.userId);
      if (filters?.startDate) queryParams.append("startDate", filters.startDate);
      if (filters?.endDate) queryParams.append("endDate", filters.endDate);
      
      const fullUrl = `${url}?${queryParams.toString()}`;
      
      const res = await fetch(fullUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch glucose logs");
      
      // Validation with Zod
      return api.glucoseLogs.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGlucoseLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertGlucoseLog, 'userId'>) => {
      // Validate input before sending (client-side check)
      // We omit userId because the server will fill it from the session
      const res = await fetch(api.glucoseLogs.create.path, {
        method: api.glucoseLogs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          measuredAt: data.measuredAt instanceof Date ? data.measuredAt.toISOString() : data.measuredAt
        }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = errorSchemas.validation.parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create log");
      }
      
      return api.glucoseLogs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glucoseKeys.all });
      toast({
        title: "Log Added",
        description: "Your glucose reading has been saved successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useConfirmGlucoseLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.glucoseLogs.confirm.path, { id });
      const res = await fetch(url, {
        method: api.glucoseLogs.confirm.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to confirm log");
      return api.glucoseLogs.confirm.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glucoseKeys.all });
      toast({
        title: "Confirmed",
        description: "Glucose reading verified.",
      });
    },
  });
}

// === OCR HOOK ===
export function useOcrProcess() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(api.ocr.process.path, {
        method: api.ocr.process.method,
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to process image");
      
      return api.ocr.process.responses[200].parse(await res.json());
    },
    onError: () => {
      toast({
        title: "OCR Failed",
        description: "Could not read the report. Please try manual entry.",
        variant: "destructive",
      });
    }
  });
}
