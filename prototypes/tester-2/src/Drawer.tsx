import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@helenhsong/ui";
import { FAIL_REASONS, TODAY, TYPE_LABEL, formatDay, formatDayLong, plural, type Item } from "./data";
import { downstream, dueFor, previewImpact, type Action, type Computed, type Schedule } from "./schedule";
import { Badge, Icon } from "./ui";

interface Props {
  item: Item;
  items: Item[];
  schedule: Schedule;
  onSelect: (id: string) => void;
  onClose: () => void;
  onAct: (action: Action, message: string) => void;
}

function lifecycle(item: Item, computed: Computed): { steps: string[]; current: number } {
  if (item.type === "permit") {
    const order = ["draft", "submitted", "review", "corrections", "approved", "expired"];
    return {
      steps: ["Draft", "Submitted", "Plan review", "Corrections", "Approved", "Expired or closed"],
      current: order.indexOf(item.status),
    };
  }
  if (item.type === "task") {
    const first = computed.state === "blocked" ? "Not started (blocked)" : "Not started";
    return { steps: [first, "In progress", "Done"], current: ["not_started", "in_progress", "done"].indexOf(item.status) };
  }
  const result = item.status === "failed" ? "Failed" : item.status === "passed" ? "Passed" : "Passed or failed";
  const current =
    item.status === "passed" || item.status === "failed"
      ? 3
      : item.status === "scheduled"
        ? 2
        : computed.state === "ready"
          ? 1
          : 0;
  return { steps: ["Not ready", "Ready to schedule", "Scheduled", result, "Reinspection"], current };
}

export function Drawer({ item, items, schedule, onSelect, onClose, onAct }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const [dialog, setDialog] = useState<"result" | "schedule" | null>(null);
  const computed = schedule.byId.get(item.id)!;

  useEffect(() => {
    headingRef.current?.focus();
  }, [item.id]);

  const act = (action: Action, message: string) => {
    onAct(action, message);
    // The action buttons change with the new state, so park focus on the heading.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const upstream = item.dependsOn.map((id) => schedule.itemById.get(id)).filter((dep): dep is Item => !!dep);
  const unblocks = (schedule.dependents.get(item.id) ?? []).map((id) => schedule.itemById.get(id)!);
  const further = downstream(schedule, item.id).length - unblocks.filter((dep) => !schedule.byId.get(dep.id)!.complete).length;
  const roots = computed.blockedBy
    .filter((id) => !item.dependsOn.includes(id))
    .map((id) => schedule.itemById.get(id)!);
  const due = dueFor(item, computed);
  const { steps, current } = lifecycle(item, computed);
  const held = downstream(schedule, item.id).length;

  const actions: ReactNode[] = [];
  if (item.type === "permit") {
    if (item.status === "corrections") {
      actions.push(
        <Button
          key="resubmit"
          onClick={() =>
            act(
              { type: "resubmit", id: item.id },
              `${item.title} marked resubmitted. A decision is expected ${formatDayLong(TODAY + item.duration)}.`,
            )
          }
        >
          Mark corrections resubmitted
        </Button>,
      );
    }
    if (item.status === "review" || item.status === "submitted") {
      actions.push(
        <Button
          key="approve"
          onClick={() =>
            act(
              { type: "approve", id: item.id },
              `${item.title} approved. ${plural(held, "downstream item")} no longer blocked.`,
            )
          }
        >
          Simulate city approval
        </Button>,
      );
    }
    if (item.status === "expired" || computed.state === "expiring") {
      actions.push(
        <Button
          key="renew"
          onClick={() => act({ type: "renew", id: item.id }, `${item.title} renewed through ${formatDay(TODAY + 30)}.`)}
        >
          Request renewal
        </Button>,
      );
    }
  } else if (item.type === "task") {
    if (computed.state === "ready") {
      actions.push(
        <Button key="start" onClick={() => act({ type: "start", id: item.id }, `${item.title} started.`)}>
          Start task
        </Button>,
      );
    }
    if (item.status === "in_progress") {
      actions.push(
        <Button key="finish" onClick={() => act({ type: "finish", id: item.id }, `${item.title} marked done.`)}>
          Mark done
        </Button>,
      );
    }
  } else {
    if (item.status === "scheduled") {
      actions.push(
        <Button key="result" onClick={() => setDialog("result")}>
          Record result
        </Button>,
        <Button key="reschedule" variant="outline" onClick={() => setDialog("schedule")}>
          Reschedule
        </Button>,
      );
    }
    if (computed.state === "ready") {
      actions.push(
        <Button key="schedule" onClick={() => setDialog("schedule")}>
          Schedule inspection
        </Button>,
      );
    }
  }

  const dates =
    item.type === "inspection"
      ? `${formatDayLong(computed.start)}${item.status === "scheduled" ? `, ${item.window ?? "AM"} window` : ""}`
      : `${formatDayLong(computed.start)} to ${formatDayLong(computed.end - 1)}`;

  return (
    <aside className="drawer" aria-labelledby={headingId}>
      <header className="drawer-head">
        <div>
          <p className="muted">{TYPE_LABEL[item.type]}</p>
          <h2 id={headingId} ref={headingRef} tabIndex={-1}>
            {item.title}
          </h2>
        </div>
        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </header>

      <div className="drawer-badges">
        <Badge tone={computed.tone}>{computed.label}</Badge>
        {computed.critical && (
          <span className="badge tone-critical">
            <Icon name="path" />
            Critical path
          </span>
        )}
        {!computed.complete && !computed.critical && (
          <span className="muted">{plural(computed.float, "day")} of float</span>
        )}
      </div>

      {roots.length > 0 && (
        <p className="callout tone-blocked">
          Held up by{" "}
          {roots.map((root, index) => (
            <span key={root.id}>
              {index > 0 && ", "}
              <button type="button" className="text-link" onClick={() => onSelect(root.id)}>
                {root.title}
              </button>
            </span>
          ))}
          , further up the chain.
        </p>
      )}

      <dl className="facts">
        <div>
          <dt>Owner</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt>{computed.complete ? "Dates" : "Projected"}</dt>
          <dd>{dates}</dd>
        </div>
        {due && (
          <div>
            <dt>Next date</dt>
            <dd>{due.label}</dd>
          </div>
        )}
        {item.status === "in_progress" && (
          <div>
            <dt>Progress</dt>
            <dd>{item.progress ?? 0}% complete</dd>
          </div>
        )}
      </dl>

      {item.note && <p className="note">{item.note}</p>}
      {item.failReasons && item.failReasons.length > 0 && (
        <div className="note">
          <p>Corrections noted by the inspector:</p>
          <ul className="bullets">
            {item.failReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <section aria-label="Lifecycle">
        <h3>Lifecycle</h3>
        <ol className="stepper">
          {steps.map((step, index) => (
            <li
              key={step}
              className={index < current ? "is-past" : index === current ? "is-current" : undefined}
              aria-current={index === current ? "step" : undefined}
            >
              <span className="stepper-dot">{index < current && <Icon name="check" />}</span>
              {step}
              {index === current && <span className="sr-only"> (current)</span>}
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Actions">
        <h3>Actions</h3>
        {actions.length > 0 ? (
          <div className="actions">{actions}</div>
        ) : (
          <p className="muted">
            {computed.complete
              ? "Nothing left to do on this item."
              : "Nothing to do here yet. It opens up when the items below are complete."}
          </p>
        )}
        {item.type === "permit" && (item.status === "review" || item.status === "submitted") && (
          <p className="muted">Demo control: stands in for the city's response.</p>
        )}
      </section>

      <section aria-label="Waiting on">
        <h3>
          Waiting on <span className="muted">{upstream.length}</span>
        </h3>
        <RelatedList items={upstream} schedule={schedule} onSelect={onSelect} empty="Nothing upstream. This item starts a chain." />
      </section>

      <section aria-label="Unblocks">
        <h3>
          Unblocks <span className="muted">{unblocks.length}</span>
        </h3>
        <RelatedList items={unblocks} schedule={schedule} onSelect={onSelect} empty="Nothing downstream. This item ends a chain." />
        {further > 0 && <p className="muted">Plus {plural(further, "more item")} further downstream.</p>}
      </section>

      {dialog === "result" && (
        <ResultDialog item={item} items={items} schedule={schedule} onClose={() => setDialog(null)} onAct={act} />
      )}
      {dialog === "schedule" && (
        <ScheduleDialog item={item} schedule={schedule} onClose={() => setDialog(null)} onAct={act} />
      )}
    </aside>
  );
}

function RelatedList({
  items,
  schedule,
  onSelect,
  empty,
}: {
  items: Item[];
  schedule: Schedule;
  onSelect: (id: string) => void;
  empty: string;
}) {
  if (items.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="related">
      {items.map((related) => {
        const computed = schedule.byId.get(related.id)!;
        return (
          <li key={related.id}>
            <button type="button" onClick={() => onSelect(related.id)}>
              <span className="related-main">
                <span className="strong">{related.title}</span>
                <span className="muted">
                  {TYPE_LABEL[related.type]}, {related.owner}
                </span>
              </span>
              <Badge tone={computed.tone}>{computed.label}</Badge>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function closeDialog(within: Element) {
  within.closest("dialog")?.close();
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    if (node && !node.open) node.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" aria-labelledby={titleId} onClose={onClose}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </dialog>
  );
}

interface DialogProps {
  item: Item;
  schedule: Schedule;
  onClose: () => void;
  onAct: (action: Action, message: string) => void;
}

function ResultDialog({ item, items, schedule, onClose, onAct }: DialogProps & { items: Item[] }) {
  const [result, setResult] = useState<"passed" | "failed" | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const computed = schedule.byId.get(item.id)!;

  const impact = useMemo(
    () =>
      result === "failed" && reasons.length > 0
        ? previewImpact(items, { type: "fail", id: item.id, reasons }, schedule)
        : null,
    [items, item.id, reasons, result, schedule],
  );

  const toggle = (id: string) =>
    setReasons((list) => (list.includes(id) ? list.filter((reason) => reason !== id) : [...list, id]));

  const dependents = (schedule.dependents.get(item.id) ?? []).map((id) => schedule.itemById.get(id)!);
  const created = impact?.rows.filter((row) => row.isNew) ?? [];
  const existing = impact?.rows.filter((row) => !row.isNew) ?? [];
  const moved = existing.filter((row) => row.delta > 0);
  const finishDelta = impact ? impact.finishAfter - impact.finishBefore : 0;
  const holders = existing[0]
    ? schedule.byId
        .get(existing[0].item.id)!
        .blockedBy.map((id) => schedule.itemById.get(id)!.title)
        .join(", ")
    : "";

  return (
    <Modal title={`Record result: ${item.title}`} onClose={onClose}>
      <form
          onSubmit={(event) => {
            event.preventDefault();
            if (result === "passed") onAct({ type: "pass", id: item.id }, `${item.title} recorded as passed.`);
            else if (impact) {
              onAct(
                { type: "fail", id: item.id, reasons },
                `${item.title} recorded as failed. Added a correction task and a reinspection${
                  moved.length ? `, and moved ${plural(moved.length, "downstream item")}` : ""
                }.`,
              );
            }
            closeDialog(event.currentTarget);
          }}
        >
          <p className="muted">
            Booked for {formatDayLong(computed.start)}, {item.window ?? "AM"} window, with {item.owner}.
          </p>
          <fieldset>
            <legend>Result</legend>
            <label className="choice">
              <input type="radio" name="result" checked={result === "passed"} onChange={() => setResult("passed")} />
              Passed
            </label>
            <label className="choice">
              <input type="radio" name="result" checked={result === "failed"} onChange={() => setResult("failed")} />
              Failed
            </label>
          </fieldset>

          {result === "failed" && (
            <fieldset>
              <legend>What needs correcting?</legend>
              {FAIL_REASONS.map((reason) => (
                <label key={reason.id} className="choice">
                  <input type="checkbox" checked={reasons.includes(reason.id)} onChange={() => toggle(reason.id)} />
                  <span>{reason.label}</span>
                  <span className="muted">{plural(reason.days, "day")} to fix</span>
                </label>
              ))}
            </fieldset>
          )}

          <div className="impact" aria-live="polite">
            {result === "passed" && (
              <>
                <h3>What this unblocks</h3>
                <ul className="bullets">
                  {dependents.length === 0 && <li>Nothing else is waiting on this inspection.</li>}
                  {dependents.map((dependent) => {
                    const others = dependent.dependsOn
                      .filter((id) => id !== item.id && !schedule.byId.get(id)?.complete)
                      .map((id) => schedule.itemById.get(id)!.title);
                    return (
                      <li key={dependent.id}>
                        {dependent.title}{" "}
                        {others.length ? `still waits on ${others.join(" and ")}.` : "can start."}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            {result === "failed" && !impact && (
              <p className="muted">Pick at least one correction to see what moves before you confirm.</p>
            )}
            {impact && (
              <>
                <h3>If you confirm</h3>
                <p className={`callout ${finishDelta > 0 ? "tone-blocked" : "tone-waiting"}`}>
                  {finishDelta > 0
                    ? `Project finish moves from ${formatDayLong(impact.finishBefore)} to ${formatDayLong(impact.finishAfter)}, ${plural(finishDelta, "day")} later.`
                    : `Project finish stays ${formatDayLong(impact.finishAfter)}.${
                        moved.length === 0 && holders
                          ? ` The chain is already waiting on ${holders}, so this uses float instead of adding delay.`
                          : ""
                      }`}
                </p>
                <p className="strong">Added automatically</p>
                <ul className="impact-list">
                  {created.map((row) => (
                    <li key={row.item.id}>
                      <span>
                        {row.item.title}
                        <span className="muted">, {row.item.owner}</span>
                      </span>
                      <span>
                        {row.item.type === "inspection"
                          ? `Earliest ${formatDay(row.start)}`
                          : `${formatDay(row.start)} to ${formatDay(row.end - 1)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="strong">Downstream items</p>
                <table className="impact-table">
                  <thead>
                    <tr>
                      <th scope="col">Item</th>
                      <th scope="col">Was</th>
                      <th scope="col">Now</th>
                      <th scope="col">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existing.map((row) => (
                      <tr key={row.item.id}>
                        <th scope="row">{row.item.title}</th>
                        <td>{formatDay(row.start - row.delta)}</td>
                        <td>{formatDay(row.start)}</td>
                        <td className={row.delta > 0 ? "delta-late" : "muted"}>
                          {row.delta > 0 ? `+${plural(row.delta, "day")}` : "No change"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={(event: { currentTarget: Element }) => closeDialog(event.currentTarget)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={result === "failed" ? "destructive" : "default"}
              disabled={result === null || (result === "failed" && !impact)}
            >
              {result === "failed" ? "Confirm failed result" : "Confirm result"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}

function ScheduleDialog({ item, schedule, onClose, onAct }: DialogProps) {
  const earliest = Math.max(
    TODAY + 1,
    ...item.dependsOn.map((dep) => (schedule.byId.get(dep)?.end ?? TODAY) + (item.lead ?? 0)),
  );
  const slots: { day: number; window: "AM" | "PM" }[] = [
    { day: earliest, window: "AM" },
    { day: earliest, window: "PM" },
    { day: earliest + 1, window: "AM" },
    { day: earliest + 2, window: "PM" },
  ];
  const [choice, setChoice] = useState(0);
  const [phase, setPhase] = useState<"idle" | "checking" | "error">("idle");
  const attempts = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const slot = slots[choice];
  const slotLabel = `${formatDayLong(slot.day)}, ${slot.window}`;

  return (
    <Modal title={`Schedule: ${item.title}`} onClose={onClose}>
      <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setPhase("checking");
            timer.current = window.setTimeout(() => {
              attempts.current += 1;
              // The first request for the earliest window fails, to show the error path.
              if (choice === 0 && attempts.current === 1) {
                setPhase("error");
                return;
              }
              onAct(
                { type: "schedule", id: item.id, day: slot.day, window: slot.window },
                `${item.title} scheduled for ${slotLabel}.`,
              );
              closeDialog(form);
            }, 700);
          }}
        >
          <p className="muted">
            Earliest workable date is {formatDayLong(earliest)}, once the upstream work is done. Windows come from{" "}
            {item.owner}.
          </p>
          <fieldset disabled={phase === "checking"}>
            <legend>Inspection window</legend>
            {slots.map((option, index) => (
              <label key={`${option.day}-${option.window}`} className="choice">
                <input
                  type="radio"
                  name="slot"
                  checked={choice === index}
                  onChange={() => {
                    setChoice(index);
                    setPhase("idle");
                  }}
                />
                <span>{formatDayLong(option.day)}</span>
                <span className="muted">{option.window === "AM" ? "8 to 12" : "12 to 4"}</span>
              </label>
            ))}
          </fieldset>
          <div aria-live="assertive">
            {phase === "error" && (
              <p className="callout tone-blocked" role="alert">
                The city scheduler did not confirm {slotLabel}. Retry, or pick another window.
              </p>
            )}
          </div>
          <div className="modal-actions">
            <Button type="button" variant="outline" onClick={(event: { currentTarget: Element }) => closeDialog(event.currentTarget)}>
              Cancel
            </Button>
            <Button type="submit" disabled={phase === "checking"}>
              {phase === "checking" ? "Requesting window" : phase === "error" ? "Retry" : "Request window"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
