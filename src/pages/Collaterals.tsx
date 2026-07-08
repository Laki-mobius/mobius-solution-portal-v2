import { Layout } from "@/components/Layout";
import { useCollaterals, useSolutions } from "@/hooks/useContent";
import { CollateralCard } from "@/components/CollateralCard";
import { useMemo, useState } from "react";
import { EmptyState } from "@/pages/Index";
import { Search } from "lucide-react";

const typeFilters = [
  { key: "all", label: "All" },
  { key: "video", label: "Video" },
  { key: "deck", label: "Deck" },
  { key: "document", label: "Document" },
] as const;

type TypeKey = (typeof typeFilters)[number]["key"];
type Mode = "type" | "practice" | "solution";

const Collaterals = () => {
  const { data: collaterals = [], isLoading } = useCollaterals();
  const { data: solutions = [] } = useSolutions();
  const [mode, setMode] = useState<Mode>("type");
  const [typeFilter, setTypeFilter] = useState<TypeKey>("all");
  const [practiceFilter, setPracticeFilter] = useState<string>("all");
  const [solutionFilter, setSolutionFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const solutionById = useMemo(() => {
    const map = new Map(solutions.map((s) => [s.id, s]));
    return map;
  }, [solutions]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: collaterals.length };
    for (const x of collaterals) c[x.type] = (c[x.type] ?? 0) + 1;
    return c;
  }, [collaterals]);

  const practices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of collaterals) {
      const sol = c.linked_solution_id ? solutionById.get(c.linked_solution_id) : null;
      if (sol?.practice) counts.set(sol.practice, (counts.get(sol.practice) ?? 0) + 1);
    }
    return Array.from(counts.entries()); // [practiceName, count][]
  }, [collaterals, solutionById]);

  const linkedSolutions = useMemo(() => {
    const map = new Map<string, { title: string; count: number }>();
    for (const c of collaterals) {
      if (c.linked_solution_id) {
        const sol = solutionById.get(c.linked_solution_id);
        if (sol) {
          const existing = map.get(sol.id);
          map.set(sol.id, { title: sol.title, count: (existing?.count ?? 0) + 1 });
        }
      }
    }
    return Array.from(map.entries()); // [id, { title, count }][]
  }, [collaterals, solutionById]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return collaterals.filter((c) => {
      if (mode === "type" && typeFilter !== "all" && c.type !== typeFilter) return false;

      if (mode === "practice" && practiceFilter !== "all") {
        const sol = c.linked_solution_id ? solutionById.get(c.linked_solution_id) : null;
        if (sol?.practice !== practiceFilter) return false;
      }

      if (mode === "solution" && solutionFilter !== "all") {
        if (c.linked_solution_id !== solutionFilter) return false;
      }

      if (!ql) return true;
      return c.title.toLowerCase().includes(ql);
    });
  }, [collaterals, mode, typeFilter, practiceFilter, solutionFilter, q, solutionById]);

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
                <button
                  onClick={() => setMode("solution")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    mode === "solution" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  By Linked Solution
                </button>
              </div>
            </div>

            <div className="flex w-fit flex-wrap gap-1">
            {mode === "type" &&
              typeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    typeFilter === f.key ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  {f.label} <span className="opacity-60">({counts[f.key] ?? 0})</span>
                </button>
              ))}

            {mode === "practice" && (
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

            {mode === "solution" && (
              <>
                <button
                  onClick={() => setSolutionFilter("all")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    solutionFilter === "all" ? "bg-foreground text-background" : "text-muted-foreground"
                  }`}
                >
                  All
                </button>
                {linkedSolutions.length === 0 ? (
                  <span className="px-2 py-1 text-xs text-muted-foreground">No linked solutions yet</span>
                ) : (
                  linkedSolutions.map(([id, { title, count }]) => (
                    <button
                      key={id}
                      onClick={() => setSolutionFilter(id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        solutionFilter === id ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}
                    >
                      {title} <span className="opacity-60">({count})</span>
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
              placeholder="Search collaterals…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none ring-ring focus:ring-2"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No collaterals found" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((c) => (
              <CollateralCard key={c.id} collateral={c} solutions={solutions} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Collaterals;