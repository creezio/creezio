import type { ReactNode } from "react";

export const metadata = {
  title: "TempoFlow",
  description: "Prix fournisseurs, catalogue et commandes pour la restauration",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: '"Source Serif 4", "Iowan Old Style", Georgia, serif', background: "linear-gradient(165deg,#e7f0ec,#f6f3eb 50%,#e9eef5)", color: "#14201c", minHeight: "100vh" }}>
        <header style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(20,32,28,0.08)" }}>
          <strong style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>TempoFlow</strong>
          <span style={{ marginLeft: "0.75rem", opacity: 0.7 }}>Prix fournisseurs, catalogue et commandes pour la restauration</span>
        </header>
        <nav style={{ display: "flex", gap: "1rem", padding: "0.75rem 1.5rem", flexWrap: "wrap" }}>
          <a href="/dashboard">Dashboard</a>
          <a href="/fournisseurs">Fournisseurs</a>
          <a href="/produits">Produits</a>
          <a href="/prix">Prix</a>
          <a href="/panier">Panier</a>
          <a href="/commandes">Commandes</a>
        </nav>
        <main style={{ padding: "1.5rem", maxWidth: "56rem", margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
