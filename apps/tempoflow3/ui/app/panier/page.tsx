import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Panier"
      entity="panier_lignes"
      fields={[
        { name: "produit_id", label: "Produit id", required: true },
        { name: "fournisseur_id", label: "Fournisseur id", required: true },
        { name: "quantite", label: "Quantité", type: "number", required: true },
      ]}
    />
  );
}
