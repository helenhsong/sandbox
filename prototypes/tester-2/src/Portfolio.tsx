import { PROJECTS, TODAY, formatDayLong, plural, type Item, type Project } from "./data";
import { downstream, dueFor, projectHealth, type Computed, type Schedule } from "./schedule";
import { Badge, hrefFor } from "./ui";

interface Row {
  project: Project;
  item: Item;
  computed: Computed;
  detail: string;
  day: number;
}

const WEEK_END = TODAY + 4;

export function Portfolio({ schedules }: { schedules: Map<string, Schedule> }) {
  const blocked: Row[] = [];
  const dueThisWeek: Row[] = [];
  const inspections: Row[] = [];

  for (const project of PROJECTS) {
    const schedule = schedules.get(project.id)!;
    for (const item of schedule.items) {
      const computed = schedule.byId.get(item.id)!;
      const due = dueFor(item, computed);
      if (!computed.complete && computed.tone === "blocked") {
        const upstream = item.dependsOn
          .map((dep) => schedule.itemById.get(dep)!)
          .filter((dep) => !schedule.byId.get(dep.id)!.complete);
        blocked.push({
          project,
          item,
          computed,
          day: computed.start,
          detail:
            item.type === "permit"
              ? `Blocking ${plural(downstream(schedule, item.id).length, "item")}`
              : `Waiting on ${upstream.map((dep) => dep.title).join(", ")}`,
        });
      }
      if (item.type === "inspection") {
        if (due && due.day <= WEEK_END) inspections.push({ project, item, computed, day: due.day, detail: due.label });
      } else if (due && due.day >= TODAY && due.day <= WEEK_END) {
        dueThisWeek.push({ project, item, computed, day: due.day, detail: due.label });
      }
    }
  }
  dueThisWeek.sort((a, b) => a.day - b.day);
  inspections.sort((a, b) => a.day - b.day);

  return (
    <div className="page">
      <header className="page-head">
        <p className="muted">Northline Builders</p>
        <h1>Portfolio</h1>
        <p className="muted">
          {plural(PROJECTS.length, "active project")}, week of {formatDayLong(TODAY)}
        </p>
      </header>

      <div className="triage">
        <TriageSection title="Blocked" rows={blocked} empty="Nothing is blocked across your projects." />
        <TriageSection title="Due this week" rows={dueThisWeek} empty="Nothing is due this week." />
        <TriageSection
          title="Inspections this week"
          rows={inspections}
          empty="No inspections are booked or ready to book this week."
        />
      </div>

      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading">Projects</h2>
        <div className="list-wrap">
          <table className="list">
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Phase</th>
                <th scope="col">Schedule health</th>
                <th scope="col">Projected finish</th>
                <th scope="col">Open items</th>
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((project) => {
                const schedule = schedules.get(project.id)!;
                const health = projectHealth(project, schedule);
                const open = schedule.items.filter((item) => !schedule.byId.get(item.id)!.complete).length;
                return (
                  <tr key={project.id}>
                    <th scope="row">
                      <a className="list-link" href={hrefFor({ view: "project", projectId: project.id })}>
                        {project.name}
                      </a>
                    </th>
                    <td>{project.phase}</td>
                    <td>
                      <Badge tone={health.tone}>
                        {health.label}: {health.detail}
                      </Badge>
                    </td>
                    <td>{formatDayLong(schedule.finishDay)}</td>
                    <td>{open}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TriageSection({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const headingId = `triage-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="triage-col" aria-labelledby={headingId}>
      <h2 id={headingId}>
        {title} <span className="muted">{rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul className="triage-list">
          {rows.map(({ project, item, computed, detail }) => (
            <li key={item.id}>
              <a href={hrefFor({ view: "project", projectId: project.id, itemId: item.id })}>
                <span className="strong">{item.title}</span>
                <span className="muted">{project.name}</span>
                <span className="triage-meta">
                  <Badge tone={computed.tone}>{computed.label}</Badge>
                  <span>{detail}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
