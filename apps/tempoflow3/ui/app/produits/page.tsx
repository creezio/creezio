import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Produits"
      entity="produits"
      fields={[
        { name: "nom", label: "Nom", required: true },
        { name: "unite", label: "Unité" },
        { name: "categorie", label: "Catégorie" },
        { name: "fournisseur_id", label: "Fournisseur id", required: true },
      ]}
    />
  );
}
