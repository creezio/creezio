/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

const STEPS = [
  { href: "/setup", label: "Compte local + recovery" },
  { href: "/configuration", label: "Profil Héberger / Rejoindre" },
  { href: "/fournisseurs", label: "Premier fournisseur" },
  { href: "/produits", label: "Catalogue produits" },
  { href: "/panier", label: "Panier → commande" },
  { href: "/mcp", label: "Vérifier MCP" },
];

export default function Page() {
  const base = metierBase();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/os/setup`)
      .then((r) => r.json())
      .then((d) => setSetupComplete(Boolean(d.setupComplete)));
  }, [base]);

  return (
    <section>
      <h1>Onboarding</h1>
      <p>Parcours opérateur TempoFlow sur OS Creezio.</p>
      <p>
        Setup :{" "}
        {setupComplete == null
          ? "…"
          : setupComplete
            ? "complet"
            : "à faire"}
      </p>
      <ol>
        {STEPS.map((s) => (
          <li key={s.href} style={{ marginBottom: "0.35rem" }}>
            <a href={s.href} style={{ color: "#0f3d32" }}>
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
