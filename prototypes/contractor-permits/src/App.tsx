import { useEffect, useRef, useState } from "react";
import { Button } from "@helenhsong/ui";
import { ClipboardCheck, FileText, HardHat, Inbox, Landmark, type LucideIcon } from "lucide-react";
import {
  ACTIONS,
  ACTION_LABEL,
  PERMITS,
  TODAY,
  addDays,
  formatDate,
  type Action,
  type Permit,
  type PermitStatus,
} from "./data";
import { PermitSheet, type Outcome } from "./PermitSheet";
import { PermitsPage, ShellPage, TodayPage } from "./pages";

type PageId = "today" | "permits" | "jobs" | "inspections" | "jurisdictions";
type Data = { permits: Permit[]; actions: Action[] };
type Toast = { id: number; message: string; undo: Data };

const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Today", icon: Inbox },
  { id: "permits", label: "Permits", icon: FileText },
  { id: "jobs", label: "Jobs", icon: HardHat },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
  { id: "jurisdictions", label: "Jurisdictions", icon: Landmark },
];

const pageFromHash = (): PageId => {
  const id = window.location.hash.slice(1);
  return NAV.some((item) => item.id === id) ? (id as PageId) : "today";
};

export function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [data, setData] = useState<Data>({ permits: PERMITS, actions: ACTIONS });
  const [openPermitId, setOpenPermitId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const actions = data.actions.filter((action) => !action.snoozed);
  const openPermit = data.permits.find((item) => item.id === openPermitId);
  const openAction = actions.find((action) => action.permitId === openPermitId);

  const openSheet = (permitId: string, trigger: HTMLElement) => {
    opener.current = trigger;
    setOpenPermitId(permitId);
  };

  const closeSheet = () => {
    setOpenPermitId(null);
    // The row may have left the list, so fall back to the page title.
    window.setTimeout(() => {
      const target = opener.current?.isConnected ? opener.current : document.getElementById("page-title");
      target?.focus();
    });
  };

  const completeAction = (action: Action, outcome: Outcome) => {
    const permit = data.permits.find((item) => item.id === action.permitId)!;
    const status: PermitStatus = outcome.status ?? (action.type === "correction" ? "In review" : permit.status);
    setData({
      actions: data.actions.filter((item) => item.id !== action.id),
      permits: data.permits.map((item) =>
        item.id === permit.id ? { ...item, status, nextDeadline: outcome.nextDate || null, lastChecked: 0 } : item,
      ),
    });
    const verb = action.type === "status" ? "status updated" : `${ACTION_LABEL[action.type].toLowerCase()} marked done`;
    setToast({ id: Date.now(), message: `${permit.number} ${verb}`, undo: data });
    closeSheet();
  };

  const snoozeAction = (action: Action) => {
    const permit = data.permits.find((item) => item.id === action.permitId)!;
    setData({
      ...data,
      actions: data.actions.map((item) => (item.id === action.id ? { ...item, snoozed: true } : item)),
    });
    setToast({ id: Date.now(), message: `${permit.number} snoozed until ${formatDate(addDays(TODAY, 1))}`, undo: data });
    closeSheet();
  };

  const undo = () => {
    if (!toast) return;
    setData(toast.undo);
    setToast(null);
  };

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__mark" aria-hidden="true" />
          Contractor Permits
        </div>
        <nav aria-label="Main">
          <ul className="nav">
            {NAV.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a className="nav__link" href={`#${id}`} aria-current={page === id ? "page" : undefined}>
                  <Icon size={16} aria-hidden="true" />
                  <span className="nav__label">{label}</span>
                  {id === "today" && actions.length > 0 && (
                    <span className="nav__count" aria-label={`${actions.length} ${actions.length === 1 ? "action" : "actions"}`}>
                      {actions.length}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar__account">
          <span className="avatar" aria-hidden="true">
            DW
          </span>
          <span>
            <span className="sidebar__name">Dana Whitfield</span>
            <span className="sidebar__role">Hollis &amp; Reyes Construction</span>
          </span>
        </div>
      </aside>

      <main className="main" id="main">
        {page === "today" && <TodayPage actions={actions} permits={data.permits} onOpen={openSheet} />}
        {page === "permits" && <PermitsPage actions={actions} permits={data.permits} onOpen={openSheet} />}
        {page !== "today" && page !== "permits" && (
          <ShellPage title={NAV.find((item) => item.id === page)!.label} />
        )}
      </main>

      {openPermit && (
        <PermitSheet
          key={openPermit.id}
          permit={openPermit}
          action={openAction}
          onClose={closeSheet}
          onComplete={completeAction}
          onSnooze={snoozeAction}
        />
      )}

      {toast && (
        <div className="toast" role="status" key={toast.id}>
          <span>{toast.message}</span>
          <Button variant="outline" size="sm" onClick={undo}>
            Undo
          </Button>
        </div>
      )}
    </div>
  );
}
