import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Prix"
      entity="prix"
      fields={[
        { name: "produit_id", label: "Produit id", required: true },
        { name: "fournisseur_id", label: "Fournisseur id", required: true },
        { name: "montant", label: "Montant HT", type: "number", required: true },
        { name: "promo_label", label: "Libellé promo" },
      ]}
    />
  );
}
