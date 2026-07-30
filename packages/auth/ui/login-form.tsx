"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getShellDesktopApi } from "@creezio/shell-ui";
import { Button, Input, isRemoteDesktopClient } from "@creezio/shell-ui/ui";

type Mode = "login" | "recover" | "factory";

export type LoginFormProps = {
  /** Redirect par défaut après login (défaut /dashboard). */
  defaultRedirect?: string;
  /** Endpoint login (défaut /api/v1/auth/login). */
  loginPath?: string;
  /**
   * Masquer recovery/factory sur client distant (défaut true).
   * Fidu historique montrait toujours si bridge présent — préférer true.
   */
  hideLocalRecoveryOnRemote?: boolean;
};

/**
 * Formulaire login / recovery / factory-reset.
 * Bridge desktop via configureShellUiBrand({ desktopApiGlobal }) — jamais un nom marque.
 */
export function LoginForm(props: LoginFormProps = {}) {
  const {
    defaultRedirect = "/dashboard",
    loginPath = "/api/v1/auth/login",
    hideLocalRecoveryOnRemote = true,
  } = props;
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [factoryConfirm, setFactoryConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const api = getShellDesktopApi();
    const hasApi = Boolean(api?.recoverPassword || api?.factoryReset);
    if (!hasApi) return;
    if (!hideLocalRecoveryOnRemote) {
      setDesktop(true);
      return;
    }
    // Client distant : le compte vit sur le serveur — recovery/factory locaux masqués.
    void isRemoteDesktopClient().then((remote) => setDesktop(!remote));
  }, [hideLocalRecoveryOnRemote]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(loginPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec connexion");
        return;
      }
      try {
        await getShellDesktopApi()?.setStayLoggedIn?.(stayLoggedIn);
      } catch {
        /* hors desktop */
      }
      const next = sp.get("next");
      router.push(!next || next === "/" ? defaultRedirect : next);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function onRecover(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const api = getShellDesktopApi();
    if (!api?.recoverPassword) {
      setError("Récupération disponible uniquement dans l'application desktop.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError("Nouveau mot de passe trop court (min. 6 caractères).");
      setLoading(false);
      return;
    }
    if (newPassword !== newPassword2) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    try {
      const r = await api.recoverPassword({ recoveryKey, newPassword });
      if (!r.ok) {
        setError(r.error || "Échec de la récupération");
        return;
      }
      setUsername(r.username || "");
      setPassword("");
      setRecoveryKey("");
      setNewPassword("");
      setNewPassword2("");
      setMode("login");
      setInfo(
        "Mot de passe réinitialisé. Connectez-vous avec le nouveau mot de passe.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function onFactoryReset(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const api = getShellDesktopApi();
    if (!api?.factoryReset) {
      setError("Remise à zéro disponible uniquement dans l'application desktop.");
      setLoading(false);
      return;
    }
    if (factoryConfirm.trim().toUpperCase() !== "SUPPRIMER") {
      setError("Tapez SUPPRIMER pour confirmer.");
      setLoading(false);
      return;
    }
    try {
      const r = await api.factoryReset();
      if (!r.ok) {
        setError(r.error || "Échec de la remise à zéro");
        setLoading(false);
        return;
      }
      // Le main relance le splash + /setup.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setLoading(false);
    }
  }

  if (mode === "recover") {
    return (
      <form onSubmit={(e) => void onRecover(e)} className="space-y-3">
        <p className="text-sm text-slate-600">
          Saisissez la clé de récupération affichée lors de la création du compte,
          puis choisissez un nouveau mot de passe. Les données métier locales ne
          sont pas effacées.
        </p>
        <Input
          type="text"
          autoComplete="off"
          placeholder="Clé de récupération (A1B2-C3D4-…)"
          value={recoveryKey}
          onChange={(e) => setRecoveryKey(e.target.value)}
          required
          disabled={loading}
          className="font-mono text-sm"
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={loading}
        />
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="Confirmer le nouveau mot de passe"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          required
          disabled={loading}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Réinitialisation…
            </>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-slate-500 underline"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          Retour à la connexion
        </button>
      </form>
    );
  }

  if (mode === "factory") {
    return (
      <form onSubmit={(e) => void onFactoryReset(e)} className="space-y-3">
        <p className="text-sm text-slate-600">
          Efface <strong>toutes</strong> les données locales (compte, base, index,
          tunnel token, cookies). Le DNS Cloudflare distant peut rester ; vous
          reconfigurerez un slug au prochain setup.
        </p>
        <Input
          type="text"
          placeholder="Tapez SUPPRIMER"
          value={factoryConfirm}
          onChange={(e) => setFactoryConfirm(e.target.value)}
          required
          disabled={loading}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          variant="destructive"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Effacement…
            </>
          ) : (
            "Tout effacer et repartir de zéro"
          )}
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm text-slate-500 underline"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          Annuler
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {info ? <p className="text-sm text-emerald-700">{info}</p> : null}
      <Input
        type="text"
        autoComplete="username"
        placeholder="Identifiant"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        type="password"
        autoComplete="current-password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={stayLoggedIn}
          onChange={(e) => setStayLoggedIn(e.target.checked)}
          className="rounded border-slate-300"
        />
        Rester connecté
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "…" : "Se connecter"}
      </Button>
      {desktop ? (
        <div className="space-y-1 pt-1 text-center text-sm">
          <button
            type="button"
            className="text-slate-600 underline"
            onClick={() => {
              setMode("recover");
              setError(null);
              setInfo(null);
            }}
          >
            J&apos;ai oublié mon mot de passe
          </button>
          <div>
            <button
              type="button"
              className="text-xs text-slate-400 underline"
              onClick={() => {
                setMode("factory");
                setError(null);
                setInfo(null);
              }}
            >
              Remise à zéro usine…
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
