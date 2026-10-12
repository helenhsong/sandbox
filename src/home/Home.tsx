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

export function Home() {
  const projects = [...(registry.projects as Project[])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="home">
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
