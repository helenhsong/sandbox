import registry from "../../projects.json";

type Project = {
  name: string;
  slug: string;
  path?: string;
  repository?: string;
  purpose?: string;
  status: string;
  createdAt: string;
};

const purposeLabels: Record<string, string> = {
  "design-challenge": "Design challenge",
  "client-demo": "Client demo",
  exploration: "Exploration",
  other: "Other",
};

function href(project: Project) {
  if (project.path) return `${import.meta.env.BASE_URL}${project.path}`;
  return project.repository ?? "#";
}

export function Home() {
  const projects = [...(registry.projects as Project[])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="home">
      <h1>Sandbox</h1>
      <p className="home-intro">Standalone prototypes: design challenges, client demos, and explorations.</p>
      {projects.length === 0 ? (
        <p className="home-empty">No prototypes yet.</p>
      ) : (
        <ul className="home-list">
          {projects.map((project) => (
            <li key={project.slug}>
              <a href={href(project)}>{project.name}</a>
              <span className="home-meta">
                {[project.purpose && purposeLabels[project.purpose], project.status, project.createdAt]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
