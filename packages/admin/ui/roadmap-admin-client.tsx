"use client";

/**
 * Module Roadmap — client UI kit générique (ROAD-2).
 *
 * Liste par statut / jalon, création et édition sur primitives kit
 * (Card, Button, Input, Select, Dialog, Textarea, Badge, DataTable).
 * Labels marque en props — aucune copie de style ad hoc côté app.
 *
 * API : /api/v1/modules/roadmap — dialecte `{ ok, items }`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@creezio/shell-ui/ui/kit";
import { DataTable } from "@creezio/shell-ui/ui";
import { Textarea } from "./textarea";

const API = "/api/v1/modules/roadmap";

export type RoadmapAdminLabels = {
  /** Titre de la page. Défaut « Roadmap produit ». */
  title?: string;
  /** Sous-titre. */
  subtitle?: string;
  /** Placeholder du champ titre à la création. */
  titrePlaceholder?: string;
  /**
   * Labels de statut (id technique → libellé affiché).
   * Défaut : idee / en_cours / fait / abandonne.
   */
  statutLabels?: Record<string, string>;
};

type RoadmapItem = {
  id: string;
  created_at: string;
  updated_at: string;
  titre: string;
  description: string | null;
  statut: string;
  jalon: string | null;
  position: number;
};

const DEFAULT_STATUT_LABELS: Record<string, string> = {
  idee: "Idée",
  en_cours: "En cours",
  fait: "Fait",
  abandonne: "Abandonné",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
    });
  } catch {
    return iso;
  }
}

type FormState = {
  titre: string;
  description: string;
  statut: string;
  jalon: string;
  position: string;
};

const emptyForm = (defaultStatut: string): FormState => ({
  titre: "",
  description: "",
  statut: defaultStatut,
  jalon: "",
  position: "0",
});

export function RoadmapAdminClient({
  labels,
}: {
  labels?: RoadmapAdminLabels;
}) {
  const title = labels?.title || "Roadmap produit";
  const subtitle =
    labels?.subtitle ||
    "Items de roadmap — liste par statut / jalon, création et édition.";
  const titrePlaceholder =
    labels?.titrePlaceholder || "Titre de l'item";
  const statutLabels = labels?.statutLabels || DEFAULT_STATUT_LABELS;
  const statutIds = useMemo(
    () => Object.keys(statutLabels),
    [statutLabels],
  );
  const defaultStatut = statutIds[0] || "idee";

  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [filterJalon, setFilterJalon] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RoadmapItem | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultStatut));
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(API, { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.items)) {
        setItems(j.items as RoadmapItem[]);
      } else if (Array.isArray(j?.items)) {
        setItems(j.items as RoadmapItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const jalons = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.jalon) set.add(it.jalon);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterStatut !== "all" && it.statut !== filterStatut) return false;
      if (filterJalon !== "all") {
        if (filterJalon === "__none__") {
          if (it.jalon) return false;
        } else if (it.jalon !== filterJalon) {
          return false;
        }
      }
      return true;
    });
  }, [items, filterStatut, filterJalon]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm(defaultStatut));
    setDialogOpen(true);
  }, [defaultStatut]);

  const openEdit = useCallback((it: RoadmapItem) => {
    setEditing(it);
    setForm({
      titre: it.titre,
      description: it.description || "",
      statut: it.statut || defaultStatut,
      jalon: it.jalon || "",
      position: String(it.position ?? 0),
    });
    setDialogOpen(true);
  }, [defaultStatut]);

  const save = useCallback(async () => {
    if (!form.titre.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        statut: form.statut || defaultStatut,
        jalon: form.jalon.trim() || null,
        position: Number(form.position) || 0,
      };
      const url = editing
        ? `${API}/${encodeURIComponent(editing.id)}`
        : API;
      const r = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || j?.ok === false) {
        setError(j?.error || `enregistrement KO (${r.status})`);
        return;
      }
      setDialogOpen(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [defaultStatut, editing, form, refresh]);

  const remove = useCallback(
    async (it: RoadmapItem) => {
      setError(null);
      const r = await fetch(`${API}/${encodeURIComponent(it.id)}`, {
        method: "DELETE",
      });
      if (!r.ok) {
        setError(`suppression KO (${r.status})`);
        return;
      }
      if (editing?.id === it.id) setDialogOpen(false);
      await refresh();
    },
    [editing, refresh],
  );

  const columns = useMemo<ColumnDef<RoadmapItem, unknown>[]>(
    () => [
      {
        accessorKey: "titre",
        header: "Titre",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.titre}</div>
            {row.original.description ? (
              <div className="line-clamp-2 text-xs text-muted-foreground">
                {row.original.description}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "statut",
        header: "Statut",
        cell: ({ getValue }) => {
          const id = String(getValue() || "");
          return (
            <Badge variant="outline">
              {statutLabels[id] || id || "—"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "jalon",
        header: "Jalon",
        cell: ({ getValue }) => (getValue() as string | null) || "—",
      },
      {
        accessorKey: "position",
        header: "Position",
      },
      {
        accessorKey: "updated_at",
        header: "Mis à jour",
        cell: ({ getValue }) => fmtDate(getValue() as string | null),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
            >
              Éditer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void remove(row.original)}
            >
              Supprimer
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, remove, statutLabels],
  );

  const byStatutCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      map.set(it.statut, (map.get(it.statut) || 0) + 1);
    }
    return map;
  }, [items]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button onClick={openCreate}>Nouvel item</Button>
      </div>

      {error ? (
        <Card className="border-destructive p-3 text-sm text-destructive">
          {error}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {statutIds.map((id) => (
          <Badge
            key={id}
            variant={filterStatut === id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() =>
              setFilterStatut((cur) => (cur === id ? "all" : id))
            }
          >
            {statutLabels[id] || id}
            {byStatutCounts.has(id)
              ? ` · ${byStatutCounts.get(id)}`
              : ""}
          </Badge>
        ))}
        {filterStatut !== "all" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFilterStatut("all")}
          >
            Tous les statuts
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label>Jalon</Label>
          <Select value={filterJalon} onValueChange={setFilterJalon}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tous les jalons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les jalons</SelectItem>
              <SelectItem value="__none__">Sans jalon</SelectItem>
              {jalons.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucun item de roadmap
            {filterStatut !== "all" || filterJalon !== "all"
              ? " pour ce filtre"
              : ""}
            .
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            searchPlaceholder="Rechercher un item…"
          />
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Éditer l'item" : "Nouvel item"}
            </DialogTitle>
            <DialogDescription>
              Les champs statut et jalon sont libres côté API — les labels
              affichés viennent des props marque.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="roadmap-titre">Titre</Label>
              <Input
                id="roadmap-titre"
                value={form.titre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titre: e.target.value }))
                }
                placeholder={titrePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roadmap-desc">Description</Label>
              <Textarea
                id="roadmap-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Contexte, critères, liens…"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select
                  value={form.statut}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, statut: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statutIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {statutLabels[id] || id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roadmap-jalon">Jalon</Label>
                <Input
                  id="roadmap-jalon"
                  value={form.jalon}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, jalon: e.target.value }))
                  }
                  placeholder="ex. Q3, v1.2…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roadmap-pos">Position</Label>
              <Input
                id="roadmap-pos"
                type="number"
                value={form.position}
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={() => void save()}
              disabled={saving || !form.titre.trim()}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
