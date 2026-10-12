import type { ReactNode } from "react";
import type { Tone } from "./schedule";
import type { Route } from "./route";

export type IconName = "check" | "progress" | "clock" | "block" | "circle" | "arrow" | "close" | "chevron" | "path";

const PATHS: Record<IconName, ReactNode> = {
  check: <path d="M3.5 8.5l3 3 6-7" />,
  progress: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.2l2 1.3" />
    </>
  ),
  block: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M4.2 11.8l7.6-7.6" />
    </>
  ),
  circle: <circle cx="8" cy="8" r="5.5" />,
  arrow: <path d="M3 8h9.5M9 4.5L12.5 8 9 11.5" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  chevron: <path d="M6 3.5L10.5 8 6 12.5" />,
  path: <path d="M2.5 11.5h3l2-7h3l2 7" />,
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export const TONE_ICON: Record<Tone, IconName> = {
  done: "check",
  progress: "progress",
  action: "arrow",
  waiting: "clock",
  blocked: "block",
  neutral: "circle",
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`badge tone-${tone}`}>
      <Icon name={TONE_ICON[tone]} />
      {children}
    </span>
  );
}

export function hrefFor(route: Route): string {
  if (route.view === "portfolio") return "#/portfolio";
  return `#/p/${route.projectId}${route.itemId ? `/${route.itemId}` : ""}`;
}
