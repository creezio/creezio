import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="Fournisseurs"
      entity="fournisseurs"
      fields={[
        { name: "nom", label: "Nom", required: true },
        { name: "contact", label: "Contact" },
        { name: "email", label: "Email" },
        { name: "telephone", label: "Téléphone" },
        { name: "site_web", label: "Site web" },
      ]}
    />
  );
}
