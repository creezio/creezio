/** creezio:owned-by-brand */
"use client";

import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Data mapping"
      entity="data-mapping"
      fields={[
        { name: "libelle_externe", label: "Libellé externe", required: true },
        { name: "produit_id", label: "Produit id", required: true },
      ]}
    />
  );
}
