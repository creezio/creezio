import { BrandCard } from "@/components/BrandCard";
import { loadParc } from "@/lib/parc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const parc = loadParc();
  const generatedAt = new Date().toISOString();

  return (
    <main>
      <header className="top">
        <div>
          <h1>Creezio Console</h1>
          <p>
            Pilotage du parc desktop — feeds Client + Serveur, versions live,
            statut build, dry-run remote-build.
          </p>
        </div>
        <div className="meta">généré {generatedAt}</div>
      </header>

      <div className="grid">
        {parc.map((row) => (
          <BrandCard key={row.brandId} row={row} />
        ))}
      </div>

      <footer className="foot">
        <p>
          Lecture seule des feeds publics (<code>latest.yml</code> via{" "}
          <code>@creezio/brand-config</code>). Les triggers destructifs
          (build/publish) restent CLI — voir{" "}
          <code>apps/console/README.md</code> et{" "}
          <code>docs/PHASE-C.md</code>.
        </p>
        <p>
          Suite prévue : <strong>Phase D (Factory new-app)</strong>.
        </p>
      </footer>
    </main>
  );
}
