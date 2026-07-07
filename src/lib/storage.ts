import { uploadFile } from "@/lib/api";

/** Upload a file to the backend and return its public URL. */
export async function uploadPortalFile(file: File, _prefix = "uploads"): Promise<string> {
  const result = await uploadFile(file);
  return result.url;
}