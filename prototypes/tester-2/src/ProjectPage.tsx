import { useState } from "react";
import { Button } from "@helenhsong/ui";
import { CONTRACTOR, TODAY, formatDayLong, type Item, type Project } from "./data";
import { attentionFor, dueFor, projectHealth, type Computed, type Schedule } from "./schedule";
import { ListView } from "./ListView";
import { Timeline } from "./Timeline";
import { Badge, Icon, TONE_ICON } from "./ui";

type Filter = "all" | "blocked" | "week" | "permit" | "task" | "inspection";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "blocked", label: "Blocked" },
  { id: "week", label: "This week" },
  { id: "permit", label: "Permits" },
  { id: "task", label: "Tasks" },
  { id: "inspection", label: "Inspections" },
];

function matches(filter: Filter, item: Item, computed: Computed): boolean {
  if (filter === "all") return true;
  if (filter === "blocked") {
    if (item.type === "permit" && item.status !== "approved") return true;
    return !computed.complete && (computed.tone === "blocked" || computed.blockedBy.length > 0);
  }
  if (filter === "week") {
    const due = dueFor(item, computed);
    if (due && due.day >= TODAY && due.day <= TODAY + 4) return true;
    return !computed.complete && computed.start <= TODAY + 4 && computed.end > TODAY;
  }
  return item.type === filter;
}

interface Props {
  project: Project;
  schedule: Schedule;
  loading: boolean;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function ProjectPage({ project, schedule, loading, selectedId, onSelect }: Props) {
  const [view, setView] = useState<"timeline" | "list">("timeline");
  const [filter, setFilter] = useState<Filter>("all");

  if (loading) return <ProjectSkeleton name={project.name} />;

  const health = projectHealth(project, schedule);
  const attention = attentionFor(schedule);
  const visible = schedule.items.filter((item) => matches(filter, item, schedule.byId.get(item.id)!));
  const count = (id: Filter) =>
    schedule.items.filter((item) => matches(id, item, schedule.byId.get(item.id)!)).length;

  return (
    <div className="page">
      <header className="page-head">
        <p className="muted">
          {CONTRACTOR}, {project.location}
        </p>
        <h1>{project.name}</h1>
        <p className="muted">{project.scope}</p>
        <dl className="stats">
          <div>
            <dt>Phase</dt>
            <dd>{project.phase}</dd>
          </div>
          <div>
            <dt>Target completion</dt>
            <dd>{formatDayLong(project.targetDay)}</dd>
          </div>
          <div>
            <dt>Projected finish</dt>
            <dd>{formatDayLong(schedule.finishDay)}</dd>
          </div>
          <div>
            <dt>Schedule health</dt>
            <dd>
              <Badge tone={health.tone}>
                {health.label}: {health.detail}
              </Badge>
            </dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading">
          Needs attention <span className="muted">{attention.length}</span>
        </h2>
        {attention.length === 0 ? (
          <p className="empty">Nothing needs attention. Every open item has what it needs to move.</p>
        ) : (
          <ul className="attention">
            {attention.map((entry) => (
              <li key={entry.itemId}>
                <button type="button" className={`tone-${entry.tone}`} onClick={() => onSelect(entry.itemId)}>
                  <span className="attention-icon">
                    <Icon name={TONE_ICON[entry.tone]} />
                  </span>
                  <span className="attention-text">
                    <span className="strong">{entry.title}</span>
                    <span className="muted">{entry.detail}</span>
                  </span>
                  <Icon name="chevron" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="schedule-heading">
        <div className="toolbar">
          <h2 id="schedule-heading">Dependency timeline</h2>
          <div className="segmented" role="group" aria-label="View">
            <Button
              variant={view === "timeline" ? "default" : "ghost"}
              aria-pressed={view === "timeline"}
              onClick={() => setView("timeline")}
            >
              Timeline
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              List
            </Button>
          </div>
        </div>
        <div className="chips" role="group" aria-label="Filter items">
          {FILTERS.map((option) => (
            <Button
              key={option.id}
              className="chip"
              variant={filter === option.id ? "default" : "outline"}
              aria-pressed={filter === option.id}
              onClick={() => setFilter(option.id)}
            >
              {option.label} <span className="muted">{count(option.id)}</span>
            </Button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <p>No items match this filter.</p>
            <Button variant="outline" onClick={() => setFilter("all")}>
              Show all items
            </Button>
          </div>
        ) : view === "timeline" ? (
          <>
            <Legend />
            <Timeline schedule={schedule} visible={visible} selectedId={selectedId} onSelect={onSelect} />
          </>
        ) : (
          <ListView schedule={schedule} visible={visible} selectedId={selectedId} onSelect={onSelect} />
        )}
      </section>
    </div>
  );
}

function Legend() {
  return (
    <ul className="legend" aria-label="Legend">
      <li>
        <span className="swatch tone-done" /> Done
      </li>
      <li>
        <span className="swatch tone-progress" /> In progress or scheduled
      </li>
      <li>
        <span className="swatch tone-action" /> Ready
      </li>
      <li>
        <span className="swatch tone-waiting" /> Waiting
      </li>
      <li>
        <span className="swatch tone-blocked" /> Blocked
      </li>
      <li>
        <span className="swatch tone-neutral" /> Not started
      </li>
      <li>
        <span className="swatch is-critical" /> Critical path
      </li>
      <li>
        <span className="swatch is-held" /> Held by a blocker
      </li>
      <li>
        <span className="swatch is-diamond" /> Inspection
      </li>
    </ul>
  );
}

function ProjectSkeleton({ name }: { name: string }) {
  return (
    <div className="page" aria-busy="true">
      <p className="sr-only" role="status">
        Loading {name}
      </p>
      <div className="skeleton" style={{ width: 280, height: 28 }} />
      <div className="skeleton" style={{ width: 520, height: 22 }} />
      <div className="skeleton" style={{ height: 96 }} />
      <div className="skeleton" style={{ height: 420 }} />
    </div>
  );
}
