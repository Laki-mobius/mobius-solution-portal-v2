export type FileIconMeta = {
  src: string;
  alt: string;
};

function getExtension(url: string): string {
  try {
    const clean = url.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  } catch {
    return "";
  }
}

export function getFileIconMeta(
  fileUrl: string,
  type: "video" | "deck" | "document" | "landing_page",
): FileIconMeta {
  const ext = getExtension(fileUrl);
  const isYouTube = /youtube\.com|youtu\.be/.test(fileUrl);

  if (type === "landing_page") {
    return { src: "/icons/www.png", alt: "Landing Page" };
  }
  if (isYouTube || type === "video") {
    return { src: "/icons/youtube.png", alt: "YouTube" };
  }
  if (ext === "pdf") {
    return { src: "/icons/pdf.png", alt: "PDF" };
  }
  if (["doc", "docx"].includes(ext)) {
    return { src: "/icons/word.png", alt: "Word" };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return { src: "/icons/powerpoint.png", alt: "PowerPoint" };
  }
  if (type === "deck") {
    return { src: "/icons/powerpoint.png", alt: "PowerPoint" };
  }
  return { src: "/icons/pdf.png", alt: "Document" };
}