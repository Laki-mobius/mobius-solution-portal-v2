import { Layout } from "@/components/Layout";
import { useSolutions } from "@/hooks/useContent";
import { SolutionCard } from "@/components/SolutionCard";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/pages/Index";

type Mode = "type" | "practice";

const Solutions = () => {
  const { data: solutions = [], isLoading } = useSolutions();
  const [mode, setMode] = useState<Mode>("type");
  const [typeFilter, setTypeFilter] = useState<"all" | "internal" | "external">("all");
  const [practiceFilter, setPracticeFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: solutions.length, internal: 0, external: 0 };
    for (const s of solutions) c[s.solution_type] = (c[s.solution_type] ?? 0) + 1;
    return c;
  }, [solutions]);

  const practices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of solutions) {
      if (s.practice) counts.set(s.practice, (counts.get(s.practice) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [solutions]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return solutions.filter((s) => {
      if (mode === "type" && typeFilter !== "all" && s.solution_type !== typeFilter) return false;
      if (mode === "practice" && practiceFilter !== "all" && s.practice !== practiceFilter) return false;
      if (!ql) return true;
      return s.title.toLowerCase().includes(ql) || s.description.toLowerCase().includes(ql);
    });
  }, [solutions, mode, typeFilter, practiceFilter, q]);

  return (
    <Layout>
      <section className="container py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2">
            <div className="w-full border-b border-border pb-2">
              <div className="flex w-fit gap-1">
                <button
                  onClick={() => setMode("type")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    mode === "type" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  By Type
                </button>
                <button
                  onClick={() => setMode("practice")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    mode === "practice" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  By Practice
                </button>
              </div>
            </div>

            <div className="flex w-fit flex-wrap gap-1">
            {mode === "type" ? (
              <>
                {(["all", "internal", "external"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                      typeFilter === t ? "bg-foreground text-background" : "text-muted-foreground"
                    }`}
                  >
                    {t} <span className="opacity-60">({typeCounts[t] ?? 0})</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  onClick={() => setPracticeFilter("all")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    practiceFilter === "all" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  All
                </button>
                {practices.length === 0 ? (
                  <span className="px-2 py-1 text-xs text-muted-foreground">No practices tagged yet</span>
                ) : (
                  practices.map(([p, count]) => (
                    <button
                      key={p}
                      onClick={() => setPracticeFilter(p)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        practiceFilter === p ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}
                    >
                      {p} <span className="opacity-60">({count})</span>
                    </button>
                  ))
                )}
              </>
            )}
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter solutions…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none ring-ring focus:ring-2"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No matching solutions" hint="Try a different filter or search term." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((s) => (
              <SolutionCard key={s.id} solution={s} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Solutions;