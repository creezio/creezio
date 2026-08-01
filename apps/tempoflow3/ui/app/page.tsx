/** creezio:owned-by-brand */
export default function HomePage() {
  return (
    <section>
      <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>TempoFlow</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>Prix fournisseurs, catalogue et commandes pour la restauration</p>
      <ol>
        <li key="fournisseurs">fournisseurs</li>
        <li key="produits">produits</li>
        <li key="prix">prix</li>
        <li key="panier">panier</li>
        <li key="commandes">commandes</li>
      </ol>
    </section>
  );
}
