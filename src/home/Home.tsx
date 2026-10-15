import { buttonVariants } from "@helenhsong/ui";
import { Presentation } from "lucide-react";
import registry from "../../projects.json";

type Project = {
  name: string;
  slug: string;
  path?: string;
  repository?: string;
  createdAt: string;
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function href(project: Project) {
  if (project.path) return `${import.meta.env.BASE_URL}${project.slug}/`;
  return project.repository ?? "#";
}

/** When each project was last published and first added (ms), from git at build time; see vite.config.ts. */
declare const __PROJECT_PUBLISHED__: Record<string, { published: number; added: number }>;

/**
 * Most recently published first; projects not published yet come before all of them. Ties go to
 * the one added more recently, then the later creation date.
 */
function byLastPublished(a: Project, b: Project) {
  const times = __PROJECT_PUBLISHED__;
  const ta = times[a.slug] ?? { published: Infinity, added: Infinity };
  const tb = times[b.slug] ?? { published: Infinity, added: Infinity };
  if (ta.published !== tb.published) return tb.published > ta.published ? 1 : -1;
  if (ta.added !== tb.added) return tb.added > ta.added ? 1 : -1;
  return b.createdAt.localeCompare(a.createdAt);
}

export function Home() {
  const projects = [...(registry.projects as Project[])].sort(byLastPublished);

  return (
    <main className="home">
      <a
        className={buttonVariants({ variant: "outline", size: "sm", className: "home-tool" })}
        href={`${import.meta.env.BASE_URL}deck-builder/`}
      >
        <Presentation size={16} strokeWidth={2} aria-hidden />
        Create deck
      </a>
      <h1 className="home-heading">Index</h1>
      {projects.length === 0 ? (
        <p className="home-empty">No prototypes yet.</p>
      ) : (
        <ul className="home-list">
          {projects.map((project) => (
            <li key={project.slug}>
              <a href={href(project)}>{project.name}</a>
              <time dateTime={project.createdAt}>{dateFormat.format(new Date(project.createdAt))}</time>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
