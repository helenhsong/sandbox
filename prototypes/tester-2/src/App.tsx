import { useEffect, useMemo, useState } from "react";
import { Button } from "@helenhsong/ui";
import { CONTRACTOR, ITEMS, PROJECTS, type Item } from "./data";
import { applyAction, computeSchedule, projectHealth, projectItems, type Action } from "./schedule";
import { Drawer } from "./Drawer";
import { Portfolio } from "./Portfolio";
import { ProjectPage } from "./ProjectPage";
import { useRoute } from "./route";
import { Badge, hrefFor } from "./ui";

interface Toast {
  id: number;
  message: string;
  /** Item list to restore on Undo. */
  previous?: Item[];
}

export function App() {
  const route = useRoute();
  const [items, setItems] = useState(ITEMS);
  const [toast, setToast] = useState<Toast | null>(null);

  const schedules = useMemo(
    () => new Map(PROJECTS.map((project) => [project.id, computeSchedule(projectItems(items, project.id))])),
    [items],
  );

  const projectId = route.view === "project" ? route.projectId : undefined;
  const project = PROJECTS.find((candidate) => candidate.id === projectId);
  const schedule = project ? schedules.get(project.id) : undefined;
  const selected = route.view === "project" && route.itemId ? schedule?.itemById.get(route.itemId) : undefined;

  // A short skeleton when switching projects, standing in for a fetch.
  const [readyId, setReadyId] = useState(projectId);
  const loading = projectId !== undefined && projectId !== readyId;
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setReadyId(projectId), 450);
    return () => window.clearTimeout(timer);
  }, [loading, projectId]);

  const pageKey = projectId ?? route.view;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pageKey]);

  const select = (id: string) => {
    if (project) window.location.hash = hrefFor({ view: "project", projectId: project.id, itemId: id });
  };
  const closeDrawer = () => {
    if (!project || !selected) return;
    const id = selected.id;
    window.location.hash = hrefFor({ view: "project", projectId: project.id });
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`.main [data-item="${id}"]`)?.focus());
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || document.querySelector("dialog[open]")) return;
      const id = selected.id;
      window.location.hash = hrefFor({ view: "project", projectId: selected.projectId });
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`.main [data-item="${id}"]`)?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const act = (action: Action, message: string) => {
    if (!schedule) return;
    setItems(applyAction(items, action, schedule));
    setToast({ id: Date.now(), message, previous: items });
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="rail" aria-label="Projects">
        <p className="rail-brand">{CONTRACTOR}</p>
        <a
          className="rail-link"
          href={hrefFor({ view: "portfolio" })}
          aria-current={route.view === "portfolio" ? "page" : undefined}
        >
          Portfolio
        </a>
        <p className="rail-heading muted">Projects</p>
        <ul>
          {PROJECTS.map((candidate) => {
            const health = projectHealth(candidate, schedules.get(candidate.id)!);
            return (
              <li key={candidate.id}>
                <a
                  className="rail-link"
                  href={hrefFor({ view: "project", projectId: candidate.id })}
                  aria-current={candidate.id === projectId ? "page" : undefined}
                >
                  <span>{candidate.name}</span>
                  <Badge tone={health.tone}>{health.label}</Badge>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <main id="main" className="main" tabIndex={-1}>
        {route.view === "portfolio" ? (
          <Portfolio schedules={schedules} />
        ) : project && schedule ? (
          <ProjectPage
            key={project.id}
            project={project}
            schedule={schedule}
            loading={loading}
            selectedId={selected?.id}
            onSelect={select}
          />
        ) : (
          <div className="page">
            <h1>Project not found</h1>
            <p className="muted">That link does not match one of your projects.</p>
            <Button render={<a href={hrefFor({ view: "portfolio" })} />} nativeButton={false} variant="outline">
              Go to portfolio
            </Button>
          </div>
        )}
      </main>

      {selected && schedule && (
        <Drawer
          key={selected.projectId}
          item={selected}
          items={items}
          schedule={schedule}
          onSelect={select}
          onClose={closeDrawer}
          onAct={act}
        />
      )}

      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.previous && (
              <Button
                variant="outline"
                onClick={() => {
                  setItems(toast.previous!);
                  setToast({ id: Date.now(), message: "Undone. The schedule is back to how it was." });
                }}
              >
                Undo
              </Button>
            )}
            <Button variant="ghost" onClick={() => setToast(null)}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
