import { Collateral, Solution } from "@/hooks/useContent";
import { resolveFileUrl } from "@/lib/resolveUrl";
import { logActivity } from "@/lib/tracking";
import { Download, ExternalLink, Link2, Play } from "lucide-react";
import { getFileIconMeta } from "@/lib/fileIcon";

export const CollateralCard = ({
  collateral,
  solutions,
}: {
  collateral: Collateral;
  solutions?: Solution[];
}) => {
  
  const meta = getFileIconMeta(collateral.file_url, collateral.type);
  const linked = solutions?.find((s) => s.id === collateral.linked_solution_id);

  const open = async (download = false) => {
    try {
      const action =
        collateral.type === "video"
          ? "play_video"
          : download
            ? "download_collateral"
            : "view_collateral";
      await logActivity(action, collateral.id, "collateral");
      const resolvedUrl = resolveFileUrl(collateral.file_url);
      if (download) {
        const a = document.createElement("a");
        a.href = resolvedUrl;
        a.download = collateral.title;
        a.target = "_blank";
        a.rel = "noopener";
        a.click();
      } else {
        window.open(resolvedUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className="hover-lift flex flex-col overflow-hidden rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center">
          <img src={meta.src} alt={meta.alt} className="h-full w-full object-contain" />
        </div>
        
      </div>

      <h3 className="mb-2 font-sans text-sm font-semibold leading-tight">
        {collateral.title}
      </h3>

      {linked && (
        <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
          <Link2 className="h-3 w-3" /> {linked.title}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-3">
        <button
          onClick={() => open(false)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background transition hover:opacity-90"
        >
          {collateral.type === "video" ? (
            <>
              <Play className="h-3.5 w-3.5" /> Play
            </>
          ) : (
            <>
              <ExternalLink className="h-3.5 w-3.5" /> View
            </>
          )}
        </button>
        {collateral.type !== "video" && (
          <button
            onClick={() => open(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold transition hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
        )}
      </div>
    </div>
  );
};
