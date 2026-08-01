/** creezio:owned-by-brand */
import { MetierCrud } from "@/components/MetierCrud";

export default function Page() {
  return (
    <MetierCrud
      title="secteurs"
      entity="secteurs"
      fields={[{ name: "nom", label: "Nom", required: true }]}
    />
  );
}
