/** creezio:owned-by-brand */
import type { ReactNode } from "react";

export const metadata = {
  title: "TempoFlow",
  description: "Prix fournisseurs, catalogue et commandes pour la restauration",
};

const NAV = [
  ["/dashboard", "Dashboard"],
  ["/fournisseurs", "Fournisseurs"],
  ["/produits", "Produits"],
  ["/prix", "Prix"],
  ["/panier", "Panier"],
  ["/commandes", "Commandes"],
  ["/optimiser", "Optimiser"],
  ["/dispatch", "Dispatch"],
  ["/stack", "Mes produits"],
  ["/likes", "Likes"],
  ["/releves", "Relevés"],
  ["/scan", "Scan"],
  ["/taches", "Tâches"],
  ["/mails", "Mails"],
  ["/setup", "Setup"],
  ["/configuration", "Config"],
  ["/parametres", "Paramètres"],
  ["/admin/plugins", "Plugins"],
  ["/developers", "MCP"],
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Source Serif 4", "Iowan Old Style", Georgia, serif',
          background:
            "linear-gradient(165deg,#e7f0ec,#f6f3eb 50%,#e9eef5)",
          color: "#14201c",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid rgba(20,32,28,0.08)",
          }}
        >
          <strong style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
            TempoFlow
          </strong>
          <span style={{ marginLeft: "0.75rem", opacity: 0.7 }}>
            Prix fournisseurs, catalogue et commandes pour la restauration
          </span>
        </header>
        <nav
          style={{
            display: "flex",
            gap: "0.85rem",
            padding: "0.75rem 1.5rem",
            flexWrap: "wrap",
          }}
        >
          {NAV.map(([href, label]) => (
            <a key={href} href={href} style={{ color: "#0f3d32" }}>
              {label}
            </a>
          ))}
        </nav>
        <main
          style={{ padding: "1.5rem", maxWidth: "56rem", margin: "0 auto" }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
