import { API_URL } from "@/lib/api";

/** Resolves a stored file URL (relative or absolute) to a usable src/href. */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url; // legacy absolute
  return `${API_URL}${url}`; // relative path, prefixed only if API_URL is set
}