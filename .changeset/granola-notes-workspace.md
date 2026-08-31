---
"@creezio/granola": minor
---

Workspace notes Granola : liste filtrable (titre, dossier), fiche Sheet
(résumé + transcript paginé), sync bornée depuis l'API, et proxy
`GET notes/:id/transcript` (jamais d'appel Granola depuis le browser).
Migration `granola_002_note_transcript_folder` (folder_id / transcript_json).
Split UI : `granola-notes-panel` (GRANOLA-1) / `granola-connect-panel`
(GRANOLA-2).
