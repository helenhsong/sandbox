import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@helenhsong/ui";
import { ExternalLink, TriangleAlert, X } from "lucide-react";
import {
  JOBS,
  JURISDICTIONS,
  STALE_AFTER_DAYS,
  STATUSES,
  daysFromToday,
  formatDate,
  type Action,
  type Permit,
  type PermitStatus,
} from "./data";
import { ActionBadge, StatusBadge } from "./pages";

export type Outcome = { confirmation: string; nextDate: string; status?: PermitStatus };

type Props = {
  permit: Permit;
  action?: Action;
  onClose: () => void;
  onComplete: (action: Action, outcome: Outcome) => void;
  onSnooze: (action: Action) => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const daysLabel = (days: number) => {
  if (days === 0) return "Due today";
  const unit = Math.abs(days) === 1 ? "day" : "days";
  return days < 0 ? `${-days} ${unit} overdue` : `${days} ${unit} left`;
};

const checkedLabel = (days: number) => (days === 0 ? "today" : `${days} ${days === 1 ? "day" : "days"} ago`);

export function PermitSheet({ permit, action, onClose, onComplete, onSnooze }: Props) {
  const [recording, setRecording] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [status, setStatus] = useState<PermitStatus>(permit.status);
  const [error, setError] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLInputElement & HTMLSelectElement>(null);

  const job = JOBS.find((item) => item.id === permit.jobId)!;
  const jurisdiction = JURISDICTIONS.find((item) => item.id === permit.jurisdictionId)!;
  const stale = permit.lastChecked >= STALE_AFTER_DAYS;
  const isStatusUpdate = action?.type === "status";
  const doneLabel = isStatusUpdate ? "Update status" : "Mark done";

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    if (recording) firstField.current?.focus();
  }, [recording]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !sheet.current) return;
    const items = [...sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!action) return;
    if (!isStatusUpdate && !confirmation.trim()) {
      setError(true);
      firstField.current?.focus();
      return;
    }
    onComplete(action, { confirmation: confirmation.trim(), nextDate, status: isStatusUpdate ? status : undefined });
  };

  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        ref={sheet}
        onKeyDown={onKeyDown}
      >
        <header className="sheet__header">
          <div>
            <h2 id="sheet-title">{permit.number}</h2>
            <p className="muted">
              {permit.type} · {job.name}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} ref={closeButton}>
            <X size={20} aria-hidden="true" />
          </Button>
        </header>

        <div className="sheet__body">
          <section aria-labelledby="sheet-status">
            <h3 id="sheet-status">Status and key dates</h3>
            <dl className="facts">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={permit.status} />
                </dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>{jurisdiction.name}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(permit.submitted)}</dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{formatDate(permit.expires)}</dd>
              </div>
              <div>
                <dt>Next deadline</dt>
                <dd>{formatDate(action?.due ?? permit.nextDeadline)}</dd>
              </div>
              <div>
                <dt>Job site</dt>
                <dd>{job.address}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="sheet-action">
            <h3 id="sheet-action">Action needed</h3>
            {action ? (
              <div className="action-card">
                <ActionBadge type={action.type} />
                <p className="strong">{action.task}</p>
                <dl className="facts">
                  <div>
                    <dt>Due</dt>
                    <dd>{formatDate(action.due)}</dd>
                  </div>
                  <div>
                    <dt>Days left</dt>
                    <dd className={daysFromToday(action.due) < 0 ? "overdue" : undefined}>
                      {daysLabel(daysFromToday(action.due))}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="muted">Nothing needs you on this permit.</p>
            )}
          </section>

          {permit.comments.length > 0 && (
            <section aria-labelledby="sheet-comments">
              <h3 id="sheet-comments">
                City correction comments <span className="count">{permit.comments.length}</span>
              </h3>
              <ol className="comments">
                {permit.comments.map((comment) => (
                  <li key={comment.id}>
                    <p className="comments__meta">
                      <span className="badge">{comment.discipline}</span>
                      <span>{comment.reviewer}</span>
                      <span>{formatDate(comment.date)}</span>
                    </p>
                    <p>{comment.text}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="sheet-portal">
            <h3 id="sheet-portal">City portal</h3>
            <div className="portal">
              <p className={stale ? "portal__checked portal__checked--stale" : "portal__checked"}>
                {stale && <TriangleAlert size={16} aria-hidden="true" />}
                Last checked in portal: {checkedLabel(permit.lastChecked)}
              </p>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={jurisdiction.portalUrl} target="_blank" rel="noreferrer" />}
              >
                Open city portal
                <ExternalLink size={16} aria-hidden="true" />
              </Button>
            </div>
            <p className="muted small">
              {jurisdiction.name} has no connection to this tool. Do the work in the portal, then record it here.
            </p>
          </section>

          {recording && action && (
            <section aria-labelledby="sheet-record">
              <h3 id="sheet-record">{isStatusUpdate ? "Record what the portal shows" : "Record the outcome"}</h3>
              <form id="record-form" className="form" onSubmit={submit} noValidate>
                {isStatusUpdate ? (
                  <label className="field">
                    <span>Status in portal</span>
                    <select
                      ref={firstField}
                      value={status}
                      onChange={(event) => setStatus(event.target.value as PermitStatus)}
                    >
                      {STATUSES.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="field">
                    <span>Confirmation number</span>
                    <input
                      ref={firstField}
                      type="text"
                      value={confirmation}
                      aria-invalid={error || undefined}
                      aria-describedby={error ? "confirmation-error" : undefined}
                      onChange={(event) => {
                        setConfirmation(event.target.value);
                        setError(false);
                      }}
                    />
                    {error && (
                      <span className="field__error" id="confirmation-error">
                        Enter the confirmation number from the portal
                      </span>
                    )}
                  </label>
                )}
                <label className="field">
                  <span>Next date (optional)</span>
                  <input type="date" value={nextDate} onChange={(event) => setNextDate(event.target.value)} />
                </label>
              </form>
            </section>
          )}
        </div>

        {action && (
          <footer className="sheet__footer">
            {/* Keys keep React from turning the clicked button into the submit button mid-click. */}
            {recording ? (
              <>
                <Button key="cancel" variant="outline" onClick={() => setRecording(false)}>
                  Cancel
                </Button>
                <Button key="confirm" type="submit" form="record-form">
                  {isStatusUpdate ? "Save status" : "Confirm done"}
                </Button>
              </>
            ) : (
              <>
                <Button key="snooze" variant="outline" onClick={() => onSnooze(action)}>
                  Snooze
                </Button>
                <Button key="done" onClick={() => setRecording(true)}>
                  {doneLabel}
                </Button>
              </>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
