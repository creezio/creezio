"use client";

/**
 * Page OS réglages desktop — composition kit (pas de métier marque).
 * Les marques ne font que `export { DesktopSettingsPage as default }`.
 *
 * Parité TF2 0.10.26 Configuration → Système :
 * arrière-plan (tray + lancer au démarrage) + factory reset.
 */
import { DesktopConnectionSettings } from "../settings/desktop-connection-settings";
import { DesktopHermesSettings } from "../settings/desktop-hermes-settings";
import { DesktopN8nSettings } from "../settings/desktop-n8n-settings";
import { DesktopTunnel } from "../settings/desktop-tunnel";
import { DesktopLlmKeys } from "../settings/desktop-llm-keys";
import { DesktopUpdateSettings } from "../settings/desktop-update-settings";
import { DesktopBackgroundSettings } from "../settings/desktop-background-settings";
import { FactoryResetSettings } from "../settings/factory-reset-settings";
import { OpsDiagnosticSettings } from "../settings/ops-diagnostic-settings";
import { SearchReindexSettings } from "../settings/search-reindex-settings";
import {
  HostManagedNotice,
  HostOnlySettings,
} from "../settings/host-only-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../primitives/tabs";

export function DesktopSettingsPage() {
  return (
    <section style={{ padding: "1rem 0", maxWidth: "56rem" }}>
      <h1 style={{ fontSize: "1.5rem", margin: "0 0 1rem" }}>Réglages</h1>
      <Tabs defaultValue="connection">
        <TabsList>
          <TabsTrigger value="connection">Connexion</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="systeme">Système</TabsTrigger>
        </TabsList>
        <TabsContent value="connection">
          <DesktopConnectionSettings />
        </TabsContent>
        <TabsContent value="hosts">
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <DesktopHermesSettings />
            <DesktopN8nSettings />
            <DesktopTunnel />
          </div>
        </TabsContent>
        <TabsContent value="llm">
          <DesktopLlmKeys />
        </TabsContent>
        <TabsContent value="systeme">
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <DesktopUpdateSettings />
            <DesktopBackgroundSettings />
            <HostOnlySettings
              fallback={
                <HostManagedNotice label="l'index de recherche et la remise à zéro" />
              }
            >
              <SearchReindexSettings />
              <OpsDiagnosticSettings />
              <FactoryResetSettings />
            </HostOnlySettings>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default DesktopSettingsPage;
