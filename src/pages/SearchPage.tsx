import { Layout } from "@/components/Layout";
import { useCollaterals, useSolutions } from "@/hooks/useContent";
import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { SolutionCard } from "@/components/SolutionCard";
import { CollateralCard } from "@/components/CollateralCard";
import { EmptyState } from "@/pages/Index";

const Search = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { data: solutions = [] } = useSolutions();
  const { data: collaterals = [] } = useCollaterals();

  const sols = useMemo(
    () =>
      !q
        ? []
        : solutions.filter(
            (s) =>
              s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
          ),
    [solutions, q],
  );

  const cols = useMemo(
    () => (!q ? [] : collaterals.filter((c) => c.title.toLowerCase().includes(q))),
    [collaterals, q],
  );

  return (
    <Layout>
      <section className="container space-y-12 py-10">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {q ? <>Results for "{q}"</> : "Search"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {q ? `${sols.length + cols.length} results across solutions and collaterals` : "Type a query in the header search."}
          </p>
        </div>
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold">Solutions ({sols.length})</h2>
          {sols.length === 0 ? (
            <EmptyState title="No matching solutions" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sols.map((s) => (
                <SolutionCard key={s.id} solution={s} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold">Collaterals ({cols.length})</h2>
          {cols.length === 0 ? (
            <EmptyState title="No matching collaterals" />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cols.map((c) => (
                <CollateralCard key={c.id} collateral={c} solutions={solutions} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Search;
