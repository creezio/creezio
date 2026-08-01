import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Commandes"
      entity="commandes"
      fields={[
        { name: "fournisseur_id", label: "Fournisseur id", required: true },
        { name: "statut", label: "Statut", required: true },
        { name: "total_ht", label: "Total HT", type: "number" },
        { name: "notes", label: "Notes" },
      ]}
    />
  );
}
