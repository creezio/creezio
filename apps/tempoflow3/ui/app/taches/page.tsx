/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Task = { id: string; title: string; status?: string; body?: string };

const COLUMNS: Array<"open" | "done" | "cancelled"> = [
  "open",
  "done",
  "cancelled",
];

export default function Page() {
  const base = metierBase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/platform/platform-tasks/list`, {
      headers: { "x-creezio-user-id": "ui-user" },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setTasks(data.tasks || []);
    setError(null);
  }

  useEffect(() => {
    void reload();
  }, [base]);

  async function createTask(ev: React.FormEvent) {
    ev.preventDefault();
    const res = await fetch(`${base}/api/v1/platform/platform-tasks/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-creezio-user-id": "ui-user",
      },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setTitle("");
    await reload();
  }

  async function setStatus(id: string, status: Task["status"]) {
    const res = await fetch(
      `${base}/api/v1/platform/platform-tasks/${id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-creezio-user-id": "ui-user",
        },
        body: JSON.stringify({ status }),
      },
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || res.statusText);
      return;
    }
    await reload();
  }

  return (
    <section>
      <h1>Tâches</h1>
      <p>Kanban OS (`@creezio/tasks`) — colonnes open / done / cancelled.</p>
      <form onSubmit={(e) => void createTask(e)}>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche"
        />
        <button type="submit">Créer</button>
      </form>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        {COLUMNS.map((col) => (
          <div key={col}>
            <h2 style={{ textTransform: "capitalize" }}>{col}</h2>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {tasks
                .filter((t) => (t.status || "open") === col)
                .map((t) => (
                  <li
                    key={t.id}
                    style={{
                      marginBottom: "0.5rem",
                      padding: "0.5rem",
                      background: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <div>{t.title}</div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {COLUMNS.filter((c) => c !== col).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => void setStatus(t.id, c)}
                        >
                          → {c}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
