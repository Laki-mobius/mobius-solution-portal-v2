import { Solution } from "@/hooks/useContent";
import { ArrowUpRight, Sparkles, KeyRound, Copy, Check, Loader2 } from "lucide-react";

import { logActivity } from "@/lib/tracking";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Creds = { username: string | null; password: string | null; note: string | null };

export const SolutionCard = ({ solution }: { solution: Solution }) => {
  
  const [creds, setCreds] = useState<Creds | null>(null);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);

  const isInternal = solution.solution_type === "internal";
  const isUpcoming = solution.status === "upcoming";
  const isNew =
    solution.status === "live" &&
    Date.now() - new Date(solution.created_at).getTime() < 30 * 24 * 60 * 60 * 1000;
  const hasCreds =
    solution.status === "live" && (solution.has_credentials || !!solution.default_username);

  useEffect(() => () => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }, []);

  const openSolution = async () => {
    if (isUpcoming) return;
    try {
      await logActivity("view_solution", solution.id, "solution");
      window.open(solution.target_url, "_blank", "noopener,noreferrer");
    } catch {
      /* user cancelled gate */
    }
  };

  const revealCredentials = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoadingCreds(true);
      const data = await api<Creds>(`/api/solutions/${solution.id}/reveal-credentials`, {
        method: "POST",
      });
      setCreds(data);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setCreds(null), 30_000);
    } catch {
      /* gate cancelled */
    } finally {
      setLoadingCreds(false);
    }
  };

  const copy = async (label: string, value: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card text-left shadow-soft ${
        isUpcoming ? "opacity-90" : "hover-lift"
      }`}
    >
      <button
        type="button"
        onClick={openSolution}
        disabled={isUpcoming}
        className={`relative aspect-[16/10] overflow-hidden bg-muted ${
          isUpcoming ? "cursor-not-allowed" : ""
        }`}
      >
        {solution.thumbnail_url ? (
          <img
            src={solution.thumbnail_url}
            alt={solution.title}
            className={`h-full w-full object-cover transition-transform duration-500 ${
              isUpcoming ? "grayscale" : "group-hover:scale-105"
            }`}
            loading="lazy"
          />
        ) : (
          <div
            className={`h-full w-full ${
              isInternal ? "bg-gradient-internal" : "bg-gradient-external"
            } flex items-center justify-center ${isUpcoming ? "grayscale" : ""}`}
          >
            <Sparkles className="h-10 w-10 text-primary-foreground/80" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`glass inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isInternal ? "text-[hsl(var(--internal-from))]" : "text-[hsl(var(--external-from))]"
            }`}
          >
            {isInternal ? "Internal" : "External"}
          </span>
          {isUpcoming && (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow">
              Upcoming
            </span>
          )}
          {isNew && (
            <span className="inline-flex items-center rounded-full bg-gradient-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
              New
            </span>
          )}
        </div>
        {!isUpcoming && (
          <div className="absolute right-3 top-3 rounded-full bg-foreground/90 p-2 text-background opacity-0 transition-opacity group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start gap-3">
          {solution.icon_url && (
            <img
              src={solution.icon_url}
              alt=""
              className="h-9 w-9 rounded-lg border border-border object-cover"
              loading="lazy"
            />
          )}
          <h3 className="flex-1 font-sans text-sm font-semibold leading-tight">
            {solution.title}
          </h3>
        </div>
        {solution.description && (
          <p className="line-clamp-3 text-xs text-muted-foreground">{solution.description}</p>
        )}

        {isUpcoming && solution.upcoming_eta && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Coming{" "}
            {new Date(solution.upcoming_eta).toLocaleDateString(undefined, {
              month: "short",
              year: "numeric",
            })}
          </p>
        )}

        {hasCreds && (
          <div className="mt-auto pt-2">
            {!creds ? (
              <button
                type="button"
                onClick={revealCredentials}
                disabled={loadingCreds}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                {loadingCreds ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <KeyRound className="h-3 w-3" />
                )}
                Show credentials
              </button>
            ) : (
              <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 p-3 text-xs">
                {creds.username && (
                  <CredRow
                    label="Username"
                    value={creds.username}
                    copied={copied === "u"}
                    onCopy={() => copy("u", creds.username)}
                  />
                )}
                {creds.password && (
                  <CredRow
                    label="Password"
                    value={creds.password}
                    copied={copied === "p"}
                    onCopy={() => copy("p", creds.password)}
                    mono
                  />
                )}
                {creds.note && (
                  <p className="pt-1 text-[11px] text-muted-foreground">{creds.note}</p>
                )}
                <p className="pt-1 text-[10px] text-muted-foreground">
                  Hides automatically in 30s
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CredRow = ({
  label,
  value,
  copied,
  onCopy,
  mono,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-2">
    <div className="min-w-0 flex-1">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`truncate ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  </div>
);
