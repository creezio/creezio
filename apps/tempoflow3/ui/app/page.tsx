export default function HomePage() {
  return (
    <section>
      <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>TempoFlow</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        Application bureau pour surveiller les prix fournisseurs, préparer un
        panier et suivre les commandes — métier léger, OS Creezio.
      </p>
      <p>
        <a href="/dashboard">Ouvrir le dashboard</a>
      </p>
    </section>
  );
}
