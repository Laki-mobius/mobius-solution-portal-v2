import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type SolutionStatus = "live" | "upcoming" | "archived";

export type Solution = {
  id: string;
  title: string;
  description: string;
  icon_url: string | null;
  thumbnail_url: string | null;
  target_url: string;
  solution_type: "internal" | "external";
  practice: string | null;
  status: SolutionStatus;
  upcoming_eta: string | null;
  default_username: string | null;
  credentials_note: string | null;
  has_credentials: boolean;
  created_at: string;
};

export type Collateral = {
  id: string;
  title: string;
  type: "video" | "deck" | "document";
  file_url: string;
  linked_solution_id: string | null;
  created_at: string;
};

export const useSolutions = () =>
  useQuery({
    queryKey: ["solutions"],
    queryFn: () => api<Solution[]>("/api/solutions", { auth: true }),
  });

export const useCollaterals = () =>
  useQuery({
    queryKey: ["collaterals"],
    queryFn: () => api<Collateral[]>("/api/collaterals", { auth: true }),
  });