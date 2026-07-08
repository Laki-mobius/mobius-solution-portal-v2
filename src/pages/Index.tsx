import { Layout } from "@/components/Layout";
import { useCollaterals, useSolutions } from "@/hooks/useContent";
import { ArrowRight, Sparkles, Search, FileText, Layers, Play, ShieldCheck, Globe2, Boxes } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { logActivity } from "@/lib/tracking";
import { resolveFileUrl } from "@/lib/resolveUrl";
import { NetworkBackground } from "@/components/NetworkBackground";
import { getFileIconMeta } from "@/lib/fileIcon";



const Index = () => {
  const { data: solutions = [], isLoading } = useSolutions();
  const { data: collaterals = [] } = useCollaterals();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const featured = useMemo(() => solutions.slice(0, 4), [solutions]);
  const latestItems = useMemo(() => {
    const items = [
      ...solutions.map((s) => ({
        kind: "solution" as const,
        id: s.id,
        title: s.title,
        created_at: s.created_at,
        badge: s.solution_type,
        file_url: "",
      })),
      ...collaterals.map((c) => ({
        kind: "collateral" as const,
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        badge: c.type,
        file_url: c.file_url,
      })),
    ];
    return items
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [solutions, collaterals]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const openCollateral = async (fileUrl: string, id: string) => {
    await logActivity("view_collateral", id, "collateral");
    window.open(resolveFileUrl(fileUrl), "_blank", "noopener,noreferrer");
  };

  return (
    <Layout>
      {/* Hero — dark navy with animated network background */}
      <section className="relative overflow-hidden bg-hero">
        <NetworkBackground />
        <div className="container relative py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h1
              className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl"
              style={{ fontFamily: "sans-serif, 'Trebuchet MS', sans-serif" }}
            >
              Solutions, crafted by Mobius
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              Explore the internal tools and external solutions our team has shipped —
              plus the decks, videos, and documents behind them.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/solutions"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-95"
              >
                Explore Solutions <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/collaterals"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-transparent px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                View Collaterals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Solutions */}
      <section className="container py-10">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Portfolio</p>
            <h2 className="mt-1 font-display text-3xl font-bold">Featured Solutions</h2>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={onSearch}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search solutions…"
                  className="h-8 w-56 rounded-lg border border-input bg-secondary/60 pl-9 pr-3 text-xs outline-none ring-ring transition focus:bg-background focus:ring-2"
                />
              </div>
            </form>
            <Link to="/solutions" className="whitespace-nowrap text-sm font-semibold text-primary hover:underline">
              View All →
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-12 text-center">
            <p className="font-display text-lg font-semibold">No solutions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add your first solution from the admin panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s, i) => {
              const relevant = collaterals.filter((c) => c.linked_solution_id === s.id).slice(0, 3);
              return (
                <div
                  key={s.id}
                  className="hover-lift group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft"
                >
                  <button
                    onClick={() => window.open(s.target_url, "_blank", "noopener,noreferrer")}
                    className="relative aspect-[16/10] overflow-hidden bg-muted"
                  >
                    {s.thumbnail_url ? (
                      <img
                        src={resolveFileUrl(s.thumbnail_url)}
                        alt={s.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-internal">
                        <Sparkles className="h-8 w-8 text-primary-foreground/80" />
                      </div>
                    )}
                    {i === 0 && (
                      <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
                        Featured
                      </span>
                    )}
                  </button>

                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-sm font-semibold leading-tight">{s.title}</h3>
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {s.solution_type}
                      </span>
                    </div>
                    {s.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
                    )}

                    {relevant.length > 0 && (
                      <div className="mt-auto border-t border-border pt-3">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Relevant collaterals
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {relevant.map((c) => {
                            const meta = getFileIconMeta(c.file_url, c.type);
                            return (
                              <button
                                key={c.id}
                                onClick={() => openCollateral(c.file_url, c.id)}
                                className="inline-flex items-center justify-center rounded-md p-1 hover:bg-secondary"
                                title={c.title}
                              >
                                <img src={meta.src} alt={meta.alt} className="h-4 w-4 object-contain" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Latest Updates — real data, most recently added solutions/collaterals */}
      <section className="border-t border-border/60 bg-secondary/30 py-10">
        <div className="container">
          
          <h2 className="mt-1 font-display text-3xl font-bold">Latest Updates</h2>

          {latestItems.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nothing added yet.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {latestItems.map((item) => {
                const iconMeta =
                  item.kind === "solution"
                    ? null
                    : getFileIconMeta(item.file_url, item.badge as "video" | "deck" | "document");

                const handleClick = async () => {
                  if (item.kind === "collateral") {
                    await logActivity("view_collateral", item.id, "collateral");
                    window.open(resolveFileUrl(item.file_url), "_blank", "noopener,noreferrer");
                  } else {
                    const sol = solutions.find((s) => s.id === item.id);
                    if (sol) {
                      await logActivity("view_solution", sol.id, "solution");
                      window.open(sol.target_url, "_blank", "noopener,noreferrer");
                    }
                  }
                };

                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={handleClick}
                    className="hover-lift relative rounded-lg border border-border bg-card p-5 text-left shadow-soft"
                  >
                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center">
                      {iconMeta ? (
                        <img src={iconMeta.src} alt={iconMeta.alt} className="h-full w-full object-contain" />
                      ) : (
                        <img src="/icons/new.png" alt="New Solution" className="h-full w-full object-contain" />
                      )}
                    </div>
                    <div className="pr-12">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.kind === "solution" ? "New Solution" : "New Collateral"}
                      </p>
                      <h4 className="mt-0.5 font-sans text-sm font-semibold leading-tight">{item.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const EmptyState = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-12 text-center">
    <p className="font-display text-lg font-semibold">{title}</p>
    {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
  </div>
);

export default Index;
