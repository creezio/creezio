/**
 * Scénario de base générique — visite du socle OS Creezio (sidebar,
 * recherche, assistant). Sert de démo « jour 1 » à toute marque qui n'a pas
 * encore déclaré son scénario produit, et de fixture aux gates kit.
 *
 * Aucun texte métier marque : uniquement les surfaces OS communes.
 */

import type { DemoScenario } from "./types.js";

export type GenericOsTourOptions = {
  /** Nom du produit affiché dans les cartes (ex. « WinHub »). */
  productName: string;
  /** Route d'atterrissage de fin de visite (défaut `/`). */
  homeHref?: string;
};

/** Visite guidée générique du shell OS (nav, recherche, assistant, tâches). */
export function genericOsTourScenario(
  opts: GenericOsTourOptions,
): DemoScenario {
  const product = opts.productName;
  const home = opts.homeHref ?? "/";
  return {
    id: "os-tour",
    title: `Découvrir ${product}`,
    description: "Visite guidée des surfaces de base de l'application.",
    enabled: true,
    autoStart: false,
    steps: [
      {
        id: "welcome",
        kind: "say",
        title: `Bienvenue sur ${product}`,
        body: "Suivez le curseur : cette visite guidée vous présente l'application en direct. Vous pouvez la quitter à tout moment.",
      },
      {
        id: "sidebar",
        kind: "highlight",
        target: { selector: "aside, nav" },
        title: "Votre espace de travail",
        body: "La navigation regroupe toutes les sections de l'application. Chaque module y ajoute automatiquement son entrée.",
        optional: true,
      },
      {
        id: "tasks",
        kind: "click",
        target: { text: "Tâches" },
        title: "Tâches",
        body: "Un kanban intégré pour suivre le travail de l'équipe — l'IA peut y créer des missions.",
        optional: true,
      },
      {
        id: "mails",
        kind: "click",
        target: { text: "Mails" },
        title: "Mails",
        body: "La boîte de réception connectée de l'équipe, directement dans l'application.",
        optional: true,
      },
      {
        id: "assistant",
        kind: "highlight",
        target: { selector: "[data-creezio-assistant-ui]" },
        title: "Assistant IA",
        body: "L'assistant peut répondre, chercher dans vos données et même agir dans l'interface à votre place.",
        optional: true,
      },
      {
        id: "end",
        kind: "navigate",
        href: home,
        title: "À vous de jouer",
        body: "Vous pouvez relancer cette visite à tout moment depuis le bouton « Visite guidée ».",
      },
    ],
  };
}
