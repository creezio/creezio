"use client";

import { useTransition } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./primitives/select";
import { SearchInput } from "search-input";

export type FacetOption = { value: string; c: number; label?: string };

export function FacetedFilters({
  facets,
  searchKey = "q",
  searchPlaceholder = "Rechercher…",
  showSearchSubmit = false,
}: {
  facets: {
    key: string;
    label: string;
    options: FacetOption[];
    allLabel?: string;
  }[];
  searchKey?: string;
  searchPlaceholder?: string;
  /** Bouton « Filtrer » (inutile avec le debounce par défaut). */
  showSearchSubmit?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    // Un changement de facette invalide le preset affiché
    next.delete("preset");
    // Période rapide et plage custom sont exclusives
    if (key === "period") {
      next.delete("dateFrom");
      next.delete("dateTo");
    }
    // Changer de famille invalide la catégorie feuille
    if (key === "famille") next.delete("categorie");
    const qs = next.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <SearchInput
        searchKey={searchKey}
        placeholder={searchPlaceholder}
        showSubmit={showSearchSubmit}
      />
      {facets.map((f) => {
        const current = params.get(f.key) || "all";
        return (
          <Select key={f.key} value={current} onValueChange={(v) => update(f.key, v)}>
            <SelectTrigger
              className="w-52"
              data-tf2-aid={`filter.${f.key}`}
              aria-label={`Filtre ${f.label}`}
            >
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.allLabel || `Tous — ${f.label}`}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {(o.label || o.value)} ({o.c})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
