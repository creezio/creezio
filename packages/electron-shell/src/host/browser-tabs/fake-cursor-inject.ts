/**
 * Script injectable (monde isolé fournisseur) — même curseur visuel que
 * `src/components/assistant/fake-cursor.ts` (SVG + badge IA + halo de clic).
 *
 * Nécessaire car la WebContentsView fournisseur est AU-DESSUS de la vue CRM :
 * le singleton DOM du chatbot ne peut pas peindre par-dessus. On réutilise
 * donc le même design / timing dans la page fournisseur avant le clic CDP.
 */

export const FAKE_CURSOR_INJECT = `
(() => {
  const g = globalThis;
  if (g.__tfFakeCursor) return;

  const CURSOR_ID = "tf2-fake-cursor";
  const HIDE_DELAY_MS = 3500;
  const CURSOR_SVG =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 2.5 L4 18.5 L8.2 14.8 L11 21 L13.6 19.8 L10.9 13.8 L16.5 13.3 Z" ' +
    'fill="#0284c7" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  class FakeCursor {
    constructor() {
      this.el = null;
      this.badge = null;
      this.x = 0;
      this.y = 0;
      this.hideTimer = null;
      this.currentAnim = null;
    }

    ensure() {
      if (this.el && document.documentElement.contains(this.el)) return this.el;
      const wrap = document.createElement("div");
      wrap.id = CURSOR_ID;
      wrap.style.cssText = [
        "position:fixed", "left:0", "top:0", "z-index:2147483000",
        "pointer-events:none", "opacity:0", "transition:opacity 220ms ease",
        "will-change:transform", "filter:drop-shadow(0 2px 5px rgba(2,132,199,.45))",
      ].join(";");
      wrap.innerHTML = CURSOR_SVG;
      const badge = document.createElement("div");
      badge.textContent = "IA";
      badge.style.cssText = [
        "position:absolute", "left:18px", "top:20px", "background:#0284c7",
        "color:white", "font:600 9px/1 system-ui,sans-serif", "letter-spacing:.06em",
        "padding:3px 6px", "border-radius:9999px", "border:1.5px solid white",
        "white-space:nowrap",
      ].join(";");
      wrap.appendChild(badge);
      (document.documentElement || document.body).appendChild(wrap);
      this.el = wrap;
      this.badge = badge;
      this.x = window.innerWidth / 2;
      this.y = window.innerHeight / 2;
      wrap.style.transform = "translate(" + this.x + "px, " + this.y + "px)";
      return wrap;
    }

    show() {
      const el = this.ensure();
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = null;
      el.style.opacity = "1";
    }

    hideSoon(delayMs) {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        if (this.el) this.el.style.opacity = "0";
      }, delayMs == null ? HIDE_DELAY_MS : delayMs);
    }

    moveTo(x, y) {
      const el = this.ensure();
      this.show();
      if (this.currentAnim) try { this.currentAnim.cancel(); } catch (e) { /* ignore */ }
      const dx = x - this.x;
      const dy = y - this.y;
      const dist = Math.hypot(dx, dy);
      const duration = Math.max(320, Math.min(1100, dist * 1.35));
      const fromX = this.x;
      const fromY = this.y;
      return new Promise((resolve) => {
        const anim = el.animate(
          [
            { transform: "translate(" + fromX + "px, " + fromY + "px)" },
            { transform: "translate(" + x + "px, " + y + "px)" },
          ],
          { duration: duration, easing: "cubic-bezier(.3,.9,.35,1)", fill: "forwards" },
        );
        this.currentAnim = anim;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          this.x = x;
          this.y = y;
          el.style.transform = "translate(" + x + "px, " + y + "px)";
          try { anim.cancel(); } catch (e) { /* ignore */ }
          resolve();
        };
        anim.onfinish = finish;
        anim.oncancel = finish;
        // Fenêtre occluse / arrière-plan : onfinish peut ne JAMAIS tirer
        // (compositeur throttlé) — garde-fou temporel obligatoire.
        setTimeout(finish, duration + 250);
      });
    }

    clickEffect() {
      this.ensure();
      const ripple = document.createElement("div");
      ripple.style.cssText = [
        "position:fixed",
        "left:" + (this.x - 16) + "px",
        "top:" + (this.y - 16) + "px",
        "width:32px", "height:32px", "border-radius:9999px",
        "border:2.5px solid #0284c7", "background:rgba(2,132,199,.18)",
        "z-index:2147482999", "pointer-events:none",
      ].join(";");
      (document.documentElement || document.body).appendChild(ripple);
      return new Promise((resolve) => {
        const anim = ripple.animate(
          [
            { transform: "scale(.4)", opacity: 1 },
            { transform: "scale(1.7)", opacity: 0 },
          ],
          { duration: 420, easing: "ease-out" },
        );
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          ripple.remove();
          resolve();
        };
        anim.onfinish = finish;
        anim.oncancel = finish;
        // Même garde-fou que moveTo (fenêtre occluse → pas de compositeur).
        setTimeout(finish, 700);
      });
    }
  }

  g.__tfFakeCursor = new FakeCursor();
})();
`;
