import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePatients() {
    return useQuery({
        queryKey: [api.patients.list.path],
        queryFn: async () => {
            const res = await fetch(api.patients.list.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch patients");
            return api.patients.list.responses[200].parse(await res.json());
        },
    });
}

export function useAddPatient() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (email: string) => {
            const res = await fetch(api.patients.add.path, {
                method: api.patients.add.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
                credentials: "include",
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to add patient");
            }
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.patients.list.path] });
            toast({
                title: "Patient Added",
                description: "The patient has been linked to your account.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });
}
