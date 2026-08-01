/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [setup, setSetup] = useState<{
    username?: string | null;
    setupComplete?: boolean;
  } | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/os/setup`)
      .then((r) => r.json())
      .then(setSetup);
  }, [base]);

  return (
    <section>
      <h1>Collaborateurs</h1>
      <p>Comptes locaux OS (auth kit). Multi-users CRM = P1 kit.</p>
      <ul>
        <li>
          Compte local :{" "}
          <strong>{setup?.username || (setup?.setupComplete ? "—" : "non configuré")}</strong>
        </li>
        <li>
          Setup : {setup?.setupComplete ? "complet" : "incomplet"}
        </li>
      </ul>
      <p>
        <a href="/setup" style={{ color: "#0f3d32" }}>
          Configurer /setup
        </a>
      </p>
    </section>
  );
}
