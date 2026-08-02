"use client";

import { Suspense } from "react";
import { LoginForm } from "@creezio/auth/ui";

export default function Page() {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <LoginForm defaultRedirect="/dashboard" />
    </Suspense>
  );
}
