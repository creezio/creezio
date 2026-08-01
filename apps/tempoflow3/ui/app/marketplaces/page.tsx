import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="marketplaces"
      entity="marketplaces"
      fields={[{ name: "nom", label: "Nom", required: true }]}
    />
  );
}
