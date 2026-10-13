---
"@creezio/auth": patch
"@creezio/app-runtime": patch
---

Reject previously issued cookie and bearer sessions immediately when the platform account is disabled or missing. Revalidate impersonation actors and current account roles on every request, fail closed if the account store is unavailable, and preserve standalone/legacy JWT compatibility through an injectable session guard.
