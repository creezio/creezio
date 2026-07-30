"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { entityLinkClass } from "./entity-links";
import {
  sourceLinkMatchers,
  type AssistantSource,
} from "../dist/brand/sources-shim.js";
import { cn } from "./primitives/cn";

type Props = {
  content: string;
  sources?: AssistantSource[];
  className?: string;
};

/** Lien CRM relatif uniquement (anti-XSS / pas d'URL externes). */
function safeCrmHref(href: string): string | null {
  let h = href.trim();
  // Réécrit les URLs absolues vers le CRM TempoFlow2 en chemins relatifs
  const abs = /^https?:\/\/(?:[\\w.-]+\\.creez\\.io)(\/[^?\s#]*)/i.exec(h);
  if (abs) h = abs[1] + (h.includes("?") ? h.slice(h.indexOf("?")) : "");
  if (!h.startsWith("/")) return null;
  if (h.startsWith("//")) return null;
  if (/[\s<>"'`]/.test(h)) return null;
  if (/^(javascript|data|vbscript):/i.test(h)) return null;
  return h;
}

function linkClass(type?: string) {
  return cn(
    entityLinkClass,
    "font-medium",
    type === "marketplace" && "text-emerald-700",
    type === "produit" && "text-sky-700",
    type === "releve" && "text-violet-700",
  );
}

/** Applique gras **…** (non imbriqué). */
function renderBold(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(
        <Fragment key={`${keyPrefix}-t-${i}`}>{text.slice(last, m.index)}</Fragment>,
      );
    }
    parts.push(
      <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-slate-900">
        {m[1]}
      </strong>,
    );
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) {
    parts.push(<Fragment key={`${keyPrefix}-t-end`}>{text.slice(last)}</Fragment>);
  }
  return parts.length ? parts : [<Fragment key={`${keyPrefix}-empty`}>{text}</Fragment>];
}

/**
 * Linkify guidé par sources : remplace les titres / plaques connus
 * par des Next Link, sans toucher au HTML brut.
 */
function linkifyGuided(
  text: string,
  matchers: { text: string; url: string; type?: string }[],
  keyPrefix: string,
): ReactNode[] {
  if (!text) return [];
  if (!matchers.length) return renderBold(text, keyPrefix);

  type Seg = { start: number; end: number; url: string; type?: string; label: string };
  const segs: Seg[] = [];

  const lower = text.toLowerCase();
  for (const m of matchers) {
    const needle = m.text;
    if (!needle) continue;
    // Variante gras markdown autour du jeton : **GA434EQ**
    const variants = [needle, `**${needle}**`];
    for (const variant of variants) {
      const nLower = variant.toLowerCase();
      let from = 0;
      while (from < text.length) {
        const idx = lower.indexOf(nLower, from);
        if (idx < 0) break;
        const end = idx + variant.length;
        const overlaps = segs.some((s) => idx < s.end && end > s.start);
        if (!overlaps) {
          const before = idx === 0 ? "" : text[idx - 1];
          const after = end >= text.length ? "" : text[end];
          const okBefore = !before || /[^A-Za-z0-9@._*-]/.test(before);
          const okAfter = !after || /[^A-Za-z0-9@._*-]/.test(after);
          if (okBefore && okAfter) {
            segs.push({
              start: idx,
              end,
              url: m.url,
              type: m.type,
              label: needle,
            });
          }
        }
        from = idx + Math.max(1, needle.length);
      }
    }
  }

  segs.sort((a, b) => a.start - b.start || b.end - a.end);

  // Filtrer overlaps résiduels (garder le plus long / premier)
  const kept: Seg[] = [];
  for (const s of segs) {
    if (kept.some((k) => s.start < k.end && s.end > k.start)) continue;
    kept.push(s);
  }

  if (!kept.length) return renderBold(text, keyPrefix);

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let i = 0;
  for (const s of kept) {
    if (s.start > cursor) {
      nodes.push(
        ...renderBold(text.slice(cursor, s.start), `${keyPrefix}-pre-${i}`),
      );
    }
    const href = safeCrmHref(s.url);
    if (href) {
      nodes.push(
        <Link
          key={`${keyPrefix}-l-${i}`}
          href={href}
          className={cn(linkClass(s.type), "font-semibold")}
        >
          {s.label}
        </Link>,
      );
    } else {
      nodes.push(...renderBold(s.label, `${keyPrefix}-fb-${i}`));
    }
    cursor = s.end;
    i += 1;
  }
  if (cursor < text.length) {
    nodes.push(...renderBold(text.slice(cursor), `${keyPrefix}-tail`));
  }
  return nodes;
}

/**
 * Rendu sûr du message assistant :
 * - gras `**x**`
 * - liens markdown `[label](/path)` → Next Link (paths relatifs `/` uniquement)
 * - linkify guidé par sources (plaques / titres)
 * - pas de HTML brut
 */
export function AssistantMessageContent({ content, sources, className }: Props) {
  const matchers = sourceLinkMatchers(sources);
  const text = content || "";

  // Découpe liens markdown (relatifs /… ou absolus justrent.*) pour ne pas re-linkify dedans
  const mdLinkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  const chunks: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = mdLinkRe.exec(text)) !== null) {
    if (m.index > last) {
      chunks.push(
        ...linkifyGuided(text.slice(last, m.index), matchers, `g-${i}`),
      );
    }
    const label = m[1];
    const href = safeCrmHref(m[2]);
    if (href) {
      chunks.push(
        <Link key={`md-${i}`} href={href} className={linkClass()}>
          {label}
        </Link>,
      );
    } else {
      chunks.push(...linkifyGuided(m[0], matchers, `mdfb-${i}`));
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) {
    chunks.push(...linkifyGuided(text.slice(last), matchers, `g-end`));
  }

  return (
    <div className={cn("whitespace-pre-wrap leading-relaxed", className)}>
      {chunks.length ? chunks : text}
    </div>
  );
}
