import { useState, type ReactNode } from "react";
import { Button } from "@helenhsong/ui";
import { CircleCheck } from "lucide-react";
import {
  ACTION_LABEL,
  JOBS,
  JURISDICTIONS,
  STATUSES,
  TODAY,
  WEEK_END,
  daysFromToday,
  formatDate,
  formatLongDate,
  type Action,
  type ActionType,
  type Permit,
  type PermitStatus,
} from "./data";

type OpenSheet = (permitId: string, trigger: HTMLElement) => void;
type PageProps = { actions: Action[]; permits: Permit[]; onOpen: OpenSheet };

const jobName = (id: string) => JOBS.find((job) => job.id === id)!.name;
const jurisdictionName = (id: string) => JURISDICTIONS.find((item) => item.id === id)!.name;

const STATUS_TONE: Record<PermitStatus, string> = {
  "In review": "badge badge--neutral",
  Corrections: "badge badge--danger",
  Approved: "badge badge--success",
  "Expiring soon": "badge badge--warning",
};

// Action types are categories, so they stay plain. Only corrections carry color: missing one is the guardrail.
export function ActionBadge({ type }: { type: ActionType }) {
  return <span className={type === "correction" ? "badge badge--danger" : "badge"}>{ACTION_LABEL[type]}</span>;
}

export function StatusBadge({ status }: { status: PermitStatus }) {
  return <span className={STATUS_TONE[status]}>{status}</span>;
}

function PageHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <header className="page-header">
      <h1 id="page-title" tabIndex={-1}>
        {title}
      </h1>
      {meta && <p className="page-header__meta">{meta}</p>}
    </header>
  );
}

// Rows open on click anywhere; the button is the keyboard and screen reader path.
function rowProps(permitId: string, onOpen: OpenSheet) {
  return {
    onClick: (event: React.MouseEvent<HTMLTableRowElement>) =>
      onOpen(permitId, event.currentTarget.querySelector("button") ?? event.currentTarget),
  };
}

function OpenButton({ permit, onOpen }: { permit: Permit; onOpen: OpenSheet }) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`Open ${permit.number}`}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onOpen(permit.id, event.currentTarget);
      }}
    >
      Open
    </Button>
  );
}

export function TodayPage({ actions, permits, onOpen }: PageProps) {
  const sorted = [...actions].sort((a, b) => a.due.localeCompare(b.due));
  const groups = [
    { label: "Overdue", rows: sorted.filter((action) => action.due < TODAY) },
    { label: "Today", rows: sorted.filter((action) => action.due === TODAY) },
    { label: "This week", rows: sorted.filter((action) => action.due > TODAY && action.due <= WEEK_END) },
  ];
  const stats = [
    { label: "Overdue", value: groups[0].rows.length },
    { label: "Due today", value: groups[1].rows.length },
    { label: "Due this week", value: groups[2].rows.length },
    { label: "Open corrections", value: actions.filter((action) => action.type === "correction").length },
  ];

  return (
    <>
      <PageHeader title="Today" meta={formatLongDate(TODAY)} />
      <dl className="stats">
        {stats.map((stat) => (
          <div className={stat.label === "Overdue" && stat.value > 0 ? "stat stat--overdue" : "stat"} key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      {actions.length === 0 ? (
        <div className="empty">
          <CircleCheck size={20} aria-hidden="true" />
          <h2>All clear</h2>
          <p>Nothing needs you this week. New actions show up here as deadlines approach.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Actions that need you, grouped by deadline</caption>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">Permit</th>
                <th scope="col">Type</th>
                <th scope="col">Job</th>
                <th scope="col">Jurisdiction</th>
                <th scope="col">Due</th>
                <th scope="col" className="num">
                  Days left
                </th>
                <th scope="col">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            {groups
              .filter((group) => group.rows.length > 0)
              .map((group) => (
                <tbody key={group.label}>
                  <tr className="group-row">
                    <th scope="rowgroup" colSpan={8}>
                      {group.label} <span className="count">{group.rows.length}</span>
                    </th>
                  </tr>
                  {group.rows.map((action) => {
                    const permit = permits.find((item) => item.id === action.permitId)!;
                    const days = daysFromToday(action.due);
                    return (
                      <tr
                        key={action.id}
                        className={action.type === "correction" ? "row row--flagged" : "row"}
                        {...rowProps(permit.id, onOpen)}
                      >
                        <td>
                          <ActionBadge type={action.type} />
                        </td>
                        <td className="strong">{permit.number}</td>
                        <td>{permit.type}</td>
                        <td>{jobName(permit.jobId)}</td>
                        <td>{jurisdictionName(permit.jurisdictionId)}</td>
                        <td>{formatDate(action.due)}</td>
                        <td className={days < 0 ? "num overdue" : "num"}>{days}</td>
                        <td className="cell-action">
                          <OpenButton permit={permit} onOpen={onOpen} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
          </table>
        </div>
      )}
    </>
  );
}

type Tab = "All" | PermitStatus;
type Column = { label: string; num?: boolean; cell: (permit: Permit, action?: Action) => ReactNode };

const nextDeadline = (permit: Permit, action?: Action) => action?.due ?? permit.nextDeadline;

const NEXT_DEADLINE: Column = { label: "Next deadline", cell: (permit, action) => formatDate(nextDeadline(permit, action)) };
const EXPIRES: Column = { label: "Expires", cell: (permit) => formatDate(permit.expires) };

// The All view carries only the shared columns plus Status; each status view adds what that stage needs.
const TAB_COLUMNS: Record<Tab, Column[]> = {
  All: [{ label: "Status", cell: (permit) => <StatusBadge status={permit.status} /> }, NEXT_DEADLINE],
  "In review": [
    { label: "Submitted", cell: (permit) => formatDate(permit.submitted) },
    { label: "Days since portal check", num: true, cell: (permit) => permit.lastChecked },
    NEXT_DEADLINE,
  ],
  Corrections: [
    { label: "Open comments", num: true, cell: (permit) => permit.comments.length },
    { label: "Response due", cell: (permit, action) => formatDate(nextDeadline(permit, action)) },
  ],
  Approved: [EXPIRES, NEXT_DEADLINE],
  "Expiring soon": [
    EXPIRES,
    { label: "Days left", num: true, cell: (permit) => (permit.expires ? daysFromToday(permit.expires) : "–") },
    { label: "Renew by", cell: (permit, action) => formatDate(nextDeadline(permit, action)) },
  ],
};

export function PermitsPage({ actions, permits, onOpen }: PageProps) {
  const [tab, setTab] = useState<Tab>("All");
  const tabs: Tab[] = ["All", ...STATUSES];
  const count = (item: Tab) => (item === "All" ? permits.length : permits.filter((p) => p.status === item).length);
  const rows = tab === "All" ? permits : permits.filter((item) => item.status === tab);
  const columns = TAB_COLUMNS[tab];

  return (
    <>
      <PageHeader title="Permits" />
      <div className="tabs" role="tablist" aria-label="Permit status">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            className="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
          >
            {item} <span className="count">{count(item)}</span>
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">{tab} permits</caption>
          <thead>
            <tr>
              <th scope="col">Permit</th>
              <th scope="col">Type</th>
              <th scope="col">Job</th>
              <th scope="col">Jurisdiction</th>
              {columns.map((column) => (
                <th scope="col" key={column.label} className={column.num ? "num" : undefined}>
                  {column.label}
                </th>
              ))}
              <th scope="col">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((permit) => {
              const action = actions.find((item) => item.permitId === permit.id);
              return (
                <tr key={permit.id} className="row" {...rowProps(permit.id, onOpen)}>
                  <td className="strong">{permit.number}</td>
                  <td>{permit.type}</td>
                  <td>{jobName(permit.jobId)}</td>
                  <td>{jurisdictionName(permit.jurisdictionId)}</td>
                  {columns.map((column) => (
                    <td key={column.label} className={column.num ? "num" : undefined}>
                      {column.cell(permit, action)}
                    </td>
                  ))}
                  <td className="cell-action">
                    <OpenButton permit={permit} onOpen={onOpen} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="table__empty" colSpan={columns.length + 5}>
                  No permits with this status
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ShellPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="ghost" aria-hidden="true">
        <div className="ghost__bar" />
        {Array.from({ length: 6 }, (_, index) => (
          <div className="ghost__row" key={index}>
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </>
  );
}
