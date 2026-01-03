import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertProfile } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useProfile() {
  return useQuery({
    queryKey: [api.profiles.get.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.get.path, { credentials: "include" });
      if (res.status === 404) return null; // Handle 404 as "no profile yet"
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.get.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<InsertProfile>) => {
      const validated = api.profiles.update.input.parse(updates);
      const res = await fetch(api.profiles.update.path, {
        method: api.profiles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update profile");
      return api.profiles.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.profiles.get.path] });
      toast({
        title: "Profile Updated",
        description: "Your settings have been saved.",
      });
    },
  });
}

export function useRiskAssessment(userId?: string) {
  return useQuery({
    queryKey: [api.riskAssessment.getLatest.path, userId],
    queryFn: async () => {
      let url = api.riskAssessment.getLatest.path;
      if (userId) url += `?userId=${userId}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch risk assessment");
      
      return api.riskAssessment.getLatest.responses[200].parse(await res.json());
    },
  });
}
