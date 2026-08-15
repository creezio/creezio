---
"@creezio/electron-shell": patch
"@creezio/app-runtime": patch
---

**fix(tunnel) — superviseur cloudflared in-process (respawn borné).**

Si le process QUIC meurt, le kernel logguait `cloudflared exit` et ne le relançait pas → hostname public **525** alors que localhost restait 200 (recette / demo / admin, 15-16/08). `startCloudflared` respawn maintenant avec backoff (1 s → 30 s, 8 essais consécutifs, compteur remis à zéro après 60 s d'uptime sain). `stopCloudflared` / `forgetTunnel` annulent le timer. Le respawn **réutilise** le token et l'id persistés — aucun POST `cfd_tunnel` (pas de nouvel id). Fail-closed #84/#86/#87 inchangé. Prend effet au prochain bump/rebuild ; pas de redéploiement live dans ce tour.
