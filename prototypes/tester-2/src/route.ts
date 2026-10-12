import { useSyncExternalStore } from "react";

export type Route = { view: "portfolio" } | { view: "project"; projectId: string; itemId?: string };

export const HOME_PROJECT = "alder";

function parse(hash: string): Route {
  const [, section, projectId, itemId] = hash.split("/");
  if (section === "portfolio") return { view: "portfolio" };
  if (section === "p" && projectId) return { view: "project", projectId, itemId: itemId || undefined };
  return { view: "project", projectId: HOME_PROJECT };
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}
