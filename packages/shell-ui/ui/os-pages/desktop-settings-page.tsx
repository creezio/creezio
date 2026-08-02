"use client";

/**
 * Page OS réglages desktop — composition kit (pas de métier marque).
 * Les marques ne font que `export { DesktopSettingsPage as default }`.
 */
import { DesktopConnectionSettings } from "../settings/desktop-connection-settings";
import { DesktopHermesSettings } from "../settings/desktop-hermes-settings";
import { DesktopN8nSettings } from "../settings/desktop-n8n-settings";
import { DesktopTunnel } from "../settings/desktop-tunnel";
import { DesktopLlmKeys } from "../settings/desktop-llm-keys";
import { DesktopUpdateSettings } from "../settings/desktop-update-settings";
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
          <TabsTrigger value="updates">Mises à jour</TabsTrigger>
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
        <TabsContent value="updates">
          <DesktopUpdateSettings />
        </TabsContent>
      </Tabs>
    </section>
  );
}

export default DesktopSettingsPage;
