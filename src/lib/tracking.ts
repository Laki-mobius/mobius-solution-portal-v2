import { api } from "@/lib/api";

export type ActivityAction =
  | "view_solution"
  | "view_collateral"
  | "play_video"
  | "download_collateral"
  | "reveal_credentials";

export async function logActivity(
  action: ActivityAction,
  target_id: string,
  target_type: "solution" | "collateral",
) {
  try {
    await api("/api/activity/log", {
      method: "POST",
      body: { action, target_id, target_type },
    });
  } catch {
    /* non-critical, don't block UI on logging failure */
  }
}