/**
 * Générateur UI — pages App Router minimales + renderer SPA métier.
 */
import type { ProductModel } from "../product-model.js";

export function renderNextLayoutTsx(model: ProductModel): string {
  return `import type { ReactNode } from "react";

export const metadata = {
  title: ${JSON.stringify(model.brandName)},
  description: ${JSON.stringify(model.tagline)},
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: '"Source Serif 4", "Iowan Old Style", Georgia, serif', background: "linear-gradient(165deg,#e7f0ec,#f6f3eb 50%,#e9eef5)", color: "#14201c", minHeight: "100vh" }}>
        <header style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(20,32,28,0.08)" }}>
          <strong style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>${model.brandName}</strong>
          <span style={{ marginLeft: "0.75rem", opacity: 0.7 }}>${model.tagline}</span>
        </header>
        <nav style={{ display: "flex", gap: "1rem", padding: "0.75rem 1.5rem", flexWrap: "wrap" }}>
${model.pages.map((p) => `          <a href="${p.path}">${p.title}</a>`).join("\n")}
        </nav>
        <main style={{ padding: "1.5rem", maxWidth: "56rem", margin: "0 auto" }}>{children}</main>
      </body>
    </html>
  );
}
`;
}

export function renderNextHomePage(model: ProductModel): string {
  return `export default function HomePage() {
  return (
    <section>
      <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>${model.brandName}</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>${model.tagline}</p>
      <ol>
${model.flows[0] ? model.flows[0].steps.map((s) => `        <li key="${s}">${s}</li>`).join("\n") : `        <li>notes</li>`}
      </ol>
    </section>
  );
}
`;
}

export function renderNextEntityPage(model: ProductModel, pageId: string): string {
  const page = model.pages.find((p) => p.id === pageId);
  const title = page?.title || pageId;
  const entityId = page?.entityId;

  if (page?.kind === "dashboard" || pageId === "dashboard") {
    return `async function loadDashboard() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(\`\${base}/api/v1/brand/dashboard\`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page() {
  const d = await loadDashboard() as {
    fournisseurs_actifs?: number;
    lignes_panier?: number;
    raccourcis?: { title: string; path: string }[];
  } | null;
  return (
    <section>
      <h1>${title}</h1>
      <p>Fournisseurs actifs : {d?.fournisseurs_actifs ?? "—"} · Panier : {d?.lignes_panier ?? "—"}</p>
      <ul>
        {(d?.raccourcis || []).map((r) => (
          <li key={r.path}><a href={r.path}>{r.title}</a></li>
        ))}
      </ul>
      <p>UI interactive : <code>resources/renderer/index.html#dashboard</code></p>
    </section>
  );
}
`;
  }

  if (!entityId || pageId === "optimiser") {
    return `export default function Page() {
  return (
    <section>
      <h1>${title}</h1>
      <p>Surface métier ${model.brandName} — utiliser le renderer SPA pour les actions.</p>
      <p><code>resources/renderer/index.html#${pageId}</code></p>
    </section>
  );
}
`;
  }

  return `/**
 * Page métier ${title} — générée --from-prd.
 * Liste réelle via API brand (plus un stub vide).
 */
async function loadItems() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(\`\${base}/api/v1/brand/${entityId}\`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Record<string, unknown>[] };
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const items = await loadItems();
  return (
    <section>
      <h1>${title}</h1>
      <p>Entité <code>${entityId}</code> — {items.length} élément(s).</p>
      <ul>
        {items.map((item) => (
          <li key={String(item.id)}>
            <code>{String(item.id).slice(0, 8)}</code>{" "}
            {String(item.nom || item.titre || item.statut || item.montant || item.libelle_fournisseur || "")}
          </li>
        ))}
      </ul>
      <p>UI interactive : <code>resources/renderer/index.html#${pageId}</code></p>
    </section>
  );
}
`;
}

export function renderMetierRendererHtml(model: ProductModel): string {
  const nav = model.pages
    .map((p) => `<a href="#${p.id}" data-page="${p.id}">${p.title}</a>`)
    .join("\n          ");
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' http://127.0.0.1:*; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'" />
    <title>${model.brandName}</title>
    <style>
      :root { color-scheme: light; }
      body { margin: 0; min-height: 100vh; font-family: "Source Serif 4", "Iowan Old Style", Georgia, serif;
        background: linear-gradient(165deg, #e7f0ec, #f6f3eb 50%, #e9eef5); color: #14201c; }
      header { padding: 1.5rem; border-bottom: 1px solid rgba(20,32,28,.08); }
      h1 { margin: 0; font-size: 2rem; letter-spacing: -.02em; }
      .tag { opacity: .75; margin-top: .35rem; }
      nav { display: flex; gap: 1rem; padding: .85rem 1.5rem; flex-wrap: wrap; }
      nav a { color: #0f3d32; }
      main { padding: 1.5rem; max-width: 52rem; margin: 0 auto; }
      .panel { display: none; }
      .panel.active { display: block; }
      button, input { font: inherit; padding: .4rem .65rem; margin: .2rem 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      th, td { text-align: left; padding: .4rem; border-bottom: 1px solid rgba(0,0,0,.08); }
      .err { color: #8b1e1e; }
    </style>
  </head>
  <body>
    <header>
      <h1>${model.brandName}</h1>
      <p class="tag">${model.tagline}</p>
    </header>
    <nav>
          ${nav}
    </nav>
    <main id="app">
      <p>Chargement API métier…</p>
    </main>
    <script>
      const BASE = localStorage.getItem("METIER_BASE_URL") || "http://127.0.0.1:18791";
      const PAGES = ${JSON.stringify(model.pages)};
      const ENTITIES = ${JSON.stringify(model.entities.map((e) => e.id))};

      async function api(path, init) {
        const res = await fetch(BASE + path, {
          headers: { "content-type": "application/json" },
          ...init,
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || res.statusText);
        return body;
      }

      function fieldInput(f) {
        const type = f.type === "number" ? "number" : "text";
        return '<label>' + (f.label || f.name) +
          '<br/><input name="' + f.name + '" type="' + type + '" ' +
          (f.required ? "required" : "") + '/></label>';
      }

      async function renderPage(pageId) {
        const page = PAGES.find((p) => p.id === pageId) || PAGES[0];
        const entityId = page.entityId || page.id;
        const main = document.getElementById("app");
        try {
          const data = await api("/api/v1/modules/" + entityId);
          const entity = ${JSON.stringify(model.entities)}.find((e) => e.id === entityId);
          const fields = (entity && entity.fields) || [{ name: "nom", type: "text", required: true, label: "Nom" }];
          main.innerHTML =
            "<section class='panel active'><h2>" + page.title + "</h2>" +
            "<form id='create'>" + fields.map(fieldInput).join("") +
            "<div><button type='submit'>Ajouter</button></div></form>" +
            "<table><thead><tr><th>id</th>" + fields.map((f) => "<th>" + (f.label||f.name) + "</th>").join("") +
            "</tr></thead><tbody>" +
            (data.items || []).map((row) => "<tr><td>" + String(row.id).slice(0,8) + "</td>" +
              fields.map((f) => "<td>" + (row[f.name] ?? "") + "</td>").join("") + "</tr>").join("") +
            "</tbody></table></section>";
          document.getElementById("create").onsubmit = async (ev) => {
            ev.preventDefault();
            const fd = new FormData(ev.target);
            const payload = Object.fromEntries(fd.entries());
            for (const f of fields) {
              if (f.type === "number" && payload[f.name] !== "") payload[f.name] = Number(payload[f.name]);
            }
            await api("/api/v1/modules/" + entityId, { method: "POST", body: JSON.stringify(payload) });
            renderPage(page.id);
          };
        } catch (err) {
          main.innerHTML = "<p class='err'>API métier indisponible (" + err.message +
            "). Lancez <code>npm run metier:api</code>.</p>";
        }
      }

      document.querySelectorAll("nav a").forEach((a) => {
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          renderPage(a.getAttribute("data-page"));
        });
      });
      renderPage(PAGES[0] && PAGES[0].id);
    </script>
  </body>
</html>
`;
}
