import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="agregateurs"
      entity="agregateurs"
      fields={[{ name: "nom", label: "Nom", required: true }]}
    />
  );
}
