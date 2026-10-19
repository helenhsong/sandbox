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

/**
 * Newest first, by the date each row shows. Projects created the same day keep the reverse of
 * their order in projects.json, where new projects are appended, so the later one comes first.
 */
function newestFirst(projects: Project[]) {
  return projects
    .map((project, order) => ({ project, order }))
    .sort((a, b) => b.project.createdAt.localeCompare(a.project.createdAt) || b.order - a.order)
    .map(({ project }) => project);
}

export function Home() {
  const projects = newestFirst(registry.projects as Project[]);

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
