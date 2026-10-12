import { FAIL_REASONS, TODAY, formatDay, formatDayLong, plural, type Item, type Project } from "./data";

// Everything here is derived from the dependency graph: dates, float, the
// critical path, blocked chains, and each item's displayed state.

export type Tone = "done" | "progress" | "action" | "waiting" | "blocked" | "neutral";

export type StateKey =
  | "done"
  | "in_progress"
  | "ready"
  | "waiting"
  | "not_started"
  | "blocked"
  | "draft"
  | "submitted"
  | "review"
  | "corrections"
  | "approved"
  | "expiring"
  | "expired"
  | "not_ready"
  | "scheduled"
  | "conflict"
  | "passed"
  | "failed";

export interface Computed {
  start: number;
  end: number;
  /** Working days this item can slip before the project finish moves. */
  float: number;
  critical: boolean;
  complete: boolean;
  state: StateKey;
  label: string;
  tone: Tone;
  /** Unapproved permits upstream of this item. */
  blockedBy: string[];
}

export interface Schedule {
  items: Item[];
  byId: Map<string, Computed>;
  itemById: Map<string, Item>;
  dependents: Map<string, string[]>;
  /** Last working day of the project. */
  finishDay: number;
}

export function isComplete(item: Item): boolean {
  if (item.type === "permit") return item.status === "approved";
  if (item.type === "task") return item.status === "done";
  return item.status === "passed" || item.status === "failed";
}

function topoOrder(items: Item[], itemById: Map<string, Item>): Item[] {
  const seen = new Set<string>();
  const order: Item[] = [];
  const visit = (item: Item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    for (const dep of item.dependsOn) {
      const upstream = itemById.get(dep);
      if (upstream) visit(upstream);
    }
    order.push(item);
  };
  items.forEach(visit);
  return order;
}

export function computeSchedule(items: Item[], today = TODAY): Schedule {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const order = topoOrder(items, itemById);
  const byId = new Map<string, Computed>();
  const dependents = new Map<string, string[]>(items.map((item) => [item.id, []]));
  for (const item of items) {
    for (const dep of item.dependsOn) dependents.get(dep)?.push(item.id);
  }

  // Forward pass: earliest dates.
  for (const item of order) {
    const depsEnd = Math.max(today, ...item.dependsOn.map((dep) => byId.get(dep)?.end ?? today));
    let start = item.start ?? today;
    let end = item.end ?? start + item.duration;

    if (item.type === "permit") {
      if (item.status === "corrections") end = Math.max(today, item.resubmitDue ?? today) + 1 + item.duration;
      else if (item.status === "review") end = Math.max(today + 1, (item.resubmittedDay ?? start) + 1 + item.duration);
      else if (item.status === "expired") end = today + 1 + item.duration;
      else if (item.status !== "approved") end = Math.max(today + 1, start + item.duration);
    } else if (item.type === "task") {
      if (item.status === "in_progress") end = Math.max(start + item.duration, today + 1);
      else if (item.status === "not_started") {
        start = depsEnd;
        end = start + item.duration;
      }
    } else if (!isComplete(item)) {
      const earliest = Math.max(
        today,
        ...item.dependsOn.map((dep) => (byId.get(dep)?.end ?? today) + (item.lead ?? 0)),
      );
      start = item.status === "scheduled" ? Math.max(item.scheduledDay ?? earliest, earliest) : earliest;
      end = start + 1;
    }

    byId.set(item.id, {
      start,
      end,
      float: 0,
      critical: false,
      complete: isComplete(item),
      state: "not_started",
      label: "",
      tone: "neutral",
      blockedBy: [],
    });
  }

  // Backward pass: float and the critical path.
  const projectEnd = Math.max(today, ...[...byId.values()].map((computed) => computed.end));
  const latestStart = new Map<string, number>();
  for (const item of [...order].reverse()) {
    const computed = byId.get(item.id)!;
    const open = (dependents.get(item.id) ?? []).filter((id) => !byId.get(id)!.complete);
    const latestFinish = open.length ? Math.min(...open.map((id) => latestStart.get(id)!)) : projectEnd;
    const ls = latestFinish - (computed.end - computed.start);
    latestStart.set(item.id, ls);
    computed.float = Math.max(0, ls - computed.start);
    computed.critical = !computed.complete && ls - computed.start <= 0;
  }

  // Blocked chains: everything unfinished downstream of an unapproved permit.
  for (const root of items) {
    if (root.type !== "permit" || root.status === "approved") continue;
    const queue = [...(dependents.get(root.id) ?? [])];
    const visited = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const computed = byId.get(id)!;
      if (computed.complete) continue;
      computed.blockedBy.push(root.id);
      queue.push(...(dependents.get(id) ?? []));
    }
  }

  // Displayed state, upstream items first.
  for (const item of order) {
    const computed = byId.get(item.id)!;
    const openDeps = item.dependsOn
      .map((dep) => itemById.get(dep))
      .filter((dep): dep is Item => !!dep && !byId.get(dep.id)!.complete);
    const set = (state: StateKey, label: string, tone: Tone) => Object.assign(computed, { state, label, tone });

    if (item.type === "permit") {
      if (item.status === "approved") {
        const outlasted =
          item.expires !== undefined &&
          (dependents.get(item.id) ?? []).some((id) => {
            const dependent = byId.get(id)!;
            return !dependent.complete && dependent.end - 1 > item.expires!;
          });
        if (outlasted) set("expiring", `Approved, expires ${formatDay(item.expires!)}`, "waiting");
        else set("approved", "Approved", "done");
      } else if (item.status === "expired") set("expired", "Expired", "blocked");
      else if (item.status === "corrections") set("corrections", "Corrections requested", "blocked");
      else if (item.status === "review") set("review", "In plan review", "waiting");
      else if (item.status === "submitted") set("submitted", "Submitted", "waiting");
      else set("draft", "Draft", "neutral");
    } else if (item.type === "task") {
      if (item.status === "done") set("done", "Done", "done");
      else if (item.status === "in_progress") set("in_progress", "In progress", "progress");
      else if (openDeps.length === 0) set("ready", "Ready to start", "action");
      else if (openDeps.some((dep) => dep.type === "permit")) set("blocked", "Blocked", "blocked");
      else {
        const active = openDeps.filter((dep) =>
          ["scheduled", "ready", "in_progress"].includes(byId.get(dep.id)!.state),
        );
        if (active.length === 0) set("not_started", "Not started", "neutral");
        else if (active.every((dep) => dep.type === "inspection")) set("waiting", "Waiting on inspection", "waiting");
        else set("waiting", "Waiting on upstream", "waiting");
      }
    } else if (item.status === "passed") set("passed", "Passed", "done");
    else if (item.status === "failed") set("failed", "Failed", "blocked");
    else if (item.status === "scheduled") {
      const earliest = Math.max(today, ...item.dependsOn.map((dep) => byId.get(dep)?.end ?? today));
      if (item.scheduledDay !== undefined && earliest > item.scheduledDay) {
        set("conflict", "Needs a new date", "blocked");
      } else set("scheduled", "Scheduled", "progress");
    } else {
      const schedulable = openDeps.every(
        (dep) => dep.type === "task" && ["in_progress", "ready"].includes(byId.get(dep.id)!.state),
      );
      if (schedulable) set("ready", "Ready to schedule", "action");
      else set("not_ready", "Not ready", "neutral");
    }
  }

  return { items, byId, itemById, dependents, finishDay: projectEnd - 1 };
}

export function projectItems(items: Item[], projectId: string): Item[] {
  return items.filter((item) => item.projectId === projectId);
}

/** Unfinished items downstream of `id`, nearest first. */
export function downstream(schedule: Schedule, id: string): Item[] {
  const result: Item[] = [];
  const visited = new Set<string>([id]);
  const queue = [...(schedule.dependents.get(id) ?? [])];
  while (queue.length) {
    const next = queue.shift()!;
    if (visited.has(next)) continue;
    visited.add(next);
    if (!schedule.byId.get(next)!.complete) result.push(schedule.itemById.get(next)!);
    queue.push(...(schedule.dependents.get(next) ?? []));
  }
  return result;
}

/** Ids of everything upstream and downstream of `id`, including itself. */
export function chainOf(schedule: Schedule, id: string): Set<string> {
  const chain = new Set<string>([id]);
  const walk = (start: string, next: (id: string) => string[]) => {
    const queue = [...next(start)];
    while (queue.length) {
      const current = queue.shift()!;
      if (chain.has(current)) continue;
      chain.add(current);
      queue.push(...next(current));
    }
  };
  walk(id, (current) => schedule.itemById.get(current)?.dependsOn ?? []);
  walk(id, (current) => schedule.dependents.get(current) ?? []);
  return chain;
}

export interface Health {
  slip: number;
  tone: Tone;
  label: string;
  detail: string;
}

export function projectHealth(project: Project, schedule: Schedule): Health {
  const slip = schedule.finishDay - project.targetDay;
  if (slip >= 3) return { slip, tone: "blocked", label: "At risk", detail: `${plural(slip, "day")} late` };
  if (slip > 0) return { slip, tone: "waiting", label: "Watch", detail: `${plural(slip, "day")} late` };
  if (slip < 0) return { slip, tone: "done", label: "On track", detail: `${plural(-slip, "day")} ahead` };
  return { slip, tone: "done", label: "On track", detail: "on plan" };
}

export interface Due {
  day: number;
  label: string;
}

/** The next date someone has to hit for this item, if there is one. */
export function dueFor(item: Item, computed: Computed): Due | null {
  if (computed.complete && computed.state !== "expiring") return null;
  if (item.type === "permit") {
    if (item.status === "corrections" && item.resubmitDue !== undefined) {
      return { day: item.resubmitDue, label: `Resubmit by ${formatDayLong(item.resubmitDue)}` };
    }
    if (computed.state === "expiring") return { day: item.expires!, label: `Renew by ${formatDayLong(item.expires!)}` };
    if (item.status === "review") return { day: computed.end - 1, label: `Decision expected ${formatDayLong(computed.end - 1)}` };
    return null;
  }
  if (item.type === "task") {
    if (item.status === "in_progress") return { day: computed.end - 1, label: `Due ${formatDayLong(computed.end - 1)}` };
    return null;
  }
  if (item.status === "scheduled") {
    return { day: computed.start, label: `${formatDayLong(computed.start)}, ${item.window ?? "AM"}` };
  }
  if (computed.state === "ready") return { day: computed.start, label: `Earliest ${formatDayLong(computed.start)}` };
  return null;
}

export interface Attention {
  itemId: string;
  tone: Tone;
  title: string;
  detail: string;
}

const TONE_ORDER: Tone[] = ["blocked", "waiting", "action", "progress", "neutral", "done"];

/** The short list of things that need a decision, most urgent first. */
export function attentionFor(schedule: Schedule): Attention[] {
  const list: Attention[] = [];
  for (const item of schedule.items) {
    const computed = schedule.byId.get(item.id)!;
    const held = downstream(schedule, item.id);
    if (item.type === "permit") {
      if (item.status === "corrections") {
        list.push({
          itemId: item.id,
          tone: "blocked",
          title: `${item.title} corrections due ${formatDayLong(item.resubmitDue ?? TODAY)}`,
          detail: `Blocking ${plural(held.length, "downstream item")}${held[0] ? `, starting with ${held[0].title}` : ""}.`,
        });
      } else if (item.status === "expired") {
        list.push({
          itemId: item.id,
          tone: "blocked",
          title: `${item.title} expired${item.expires !== undefined ? ` ${formatDay(item.expires)}` : ""}`,
          detail: `Blocking ${plural(held.length, "downstream item")}. Renew it to restart work.`,
        });
      } else if (item.status === "review" || item.status === "submitted") {
        list.push({
          itemId: item.id,
          tone: "waiting",
          title: `${item.title} in plan review, decision expected ${formatDayLong(computed.end - 1)}`,
          detail: `Holding ${plural(held.length, "downstream item")} until the city responds.`,
        });
      } else if (computed.state === "expiring") {
        const outlasting = held.find((dependent) => schedule.byId.get(dependent.id)!.end - 1 > item.expires!);
        list.push({
          itemId: item.id,
          tone: "waiting",
          title: `${item.title} expires ${formatDayLong(item.expires!)}`,
          detail: outlasting
            ? `${outlasting.title} runs to ${formatDay(schedule.byId.get(outlasting.id)!.end - 1)}. Renew before it lapses.`
            : "Renew before it lapses.",
        });
      }
    } else if (item.type === "inspection") {
      if (computed.state === "conflict") {
        list.push({
          itemId: item.id,
          tone: "blocked",
          title: `${item.title} is booked before the work finishes`,
          detail: `Earliest workable date is now ${formatDayLong(computed.start)}. Reschedule it.`,
        });
      } else if (computed.state === "ready" && computed.start <= TODAY + 9) {
        list.push({
          itemId: item.id,
          tone: "action",
          title: `${item.title} is ready to schedule`,
          detail: `Earliest ${formatDayLong(computed.start)}. Booking it now protects the date.`,
        });
      } else if (computed.state === "scheduled" && computed.start <= TODAY + 4) {
        const work = item.dependsOn
          .map((dep) => schedule.itemById.get(dep))
          .find((dep) => dep?.type === "task" && dep.status === "in_progress");
        list.push({
          itemId: item.id,
          tone: "progress",
          title: `${item.title} on ${formatDayLong(computed.start)}, ${item.window ?? "AM"}`,
          detail: work
            ? `${work.title} is ${work.progress ?? 0}% done, due ${formatDayLong(schedule.byId.get(work.id)!.end - 1)}.`
            : "Upstream work is complete.",
        });
      }
    }
  }
  return list.sort((a, b) => TONE_ORDER.indexOf(a.tone) - TONE_ORDER.indexOf(b.tone));
}

export type Action =
  | { type: "resubmit" | "approve" | "renew" | "start" | "finish" | "pass"; id: string }
  | { type: "schedule"; id: string; day: number; window: "AM" | "PM" }
  | { type: "fail"; id: string; reasons: string[] };

/** Returns a new item list with the action applied. `schedule` is the acting project's. */
export function applyAction(items: Item[], action: Action, schedule: Schedule): Item[] {
  const target = schedule.itemById.get(action.id);
  const computed = schedule.byId.get(action.id);
  if (!target || !computed) return items;
  const patch = (id: string, changes: Partial<Item>) => (item: Item) => (item.id === id ? { ...item, ...changes } : item);

  // An inspection result means the work was presented as complete.
  const closeUpstreamWork = (list: Item[]) =>
    list.map((item) =>
      target.dependsOn.includes(item.id) && item.type === "task" && item.status === "in_progress"
        ? { ...item, status: "done" as const, progress: 100, end: Math.min(schedule.byId.get(item.id)!.end, computed.start) }
        : item,
    );

  switch (action.type) {
    case "resubmit":
      return items.map(patch(target.id, { status: "review", resubmittedDay: TODAY }));
    case "approve":
      return items.map(patch(target.id, { status: "approved", end: TODAY + 1 }));
    case "renew":
      return items.map(patch(target.id, { status: "approved", expires: TODAY + 30 }));
    case "start":
      return items.map(patch(target.id, { status: "in_progress", start: TODAY, progress: 0 }));
    case "finish":
      return items.map(
        patch(target.id, { status: "done", progress: 100, end: Math.max((target.start ?? TODAY) + 1, TODAY + 1) }),
      );
    case "schedule":
      return items.map(patch(target.id, { status: "scheduled", scheduledDay: action.day, window: action.window }));
    case "pass":
      return closeUpstreamWork(items).map(
        patch(target.id, { status: "passed", start: computed.start, end: computed.start + 1 }),
      );
    case "fail": {
      const reasons = FAIL_REASONS.filter((reason) => action.reasons.includes(reason.id));
      const work = target.dependsOn.map((dep) => schedule.itemById.get(dep)).find((dep) => dep?.type === "task");
      const fixId = `${target.id}-fix`;
      const reinspectionId = `${target.id}-re`;
      const fix: Item = {
        id: fixId,
        projectId: target.projectId,
        type: "task",
        title: `${work?.title ?? target.title} corrections`,
        status: "not_started",
        owner: work?.owner ?? target.owner,
        duration: Math.max(1, reasons.reduce((sum, reason) => sum + reason.days, 0)),
        dependsOn: [target.id],
        origin: target.id,
        note: `Created when ${target.title} failed.`,
      };
      const reinspection: Item = {
        id: reinspectionId,
        projectId: target.projectId,
        type: "inspection",
        title: /reinspection$/.test(target.title) ? target.title : target.title.replace(/inspection$/, "reinspection"),
        status: "open",
        owner: target.owner,
        duration: 1,
        lead: 1,
        dependsOn: [fixId],
        origin: target.id,
        note: "The city needs one working day of notice for a reinspection.",
      };
      return closeUpstreamWork(items).flatMap((item) => {
        if (item.id === target.id) {
          const failed: Item = {
            ...item,
            status: "failed",
            start: computed.start,
            end: computed.start + 1,
            failReasons: reasons.map((reason) => reason.label),
          };
          return [failed, reinspection];
        }
        // Whatever waited on this inspection now waits on the reinspection.
        const rewired = item.dependsOn.includes(target.id)
          ? { ...item, dependsOn: item.dependsOn.map((dep) => (dep === target.id ? reinspectionId : dep)) }
          : item;
        return work && item.id === work.id ? [rewired, fix] : [rewired];
      });
    }
  }
}

export interface ImpactRow {
  item: Item;
  isNew: boolean;
  start: number;
  end: number;
  /** Working days later than before the action (negative means earlier). */
  delta: number;
  float: number;
}

export interface Impact {
  rows: ImpactRow[];
  finishBefore: number;
  finishAfter: number;
  next: Item[];
}

/** What an action would do to everything downstream, without applying it. */
export function previewImpact(items: Item[], action: Action, schedule: Schedule): Impact {
  const next = applyAction(items, action, schedule);
  const projectId = schedule.itemById.get(action.id)?.projectId ?? "";
  const after = computeSchedule(projectItems(next, projectId));
  const rows = downstream(after, action.id)
    .map((item) => {
      const before = schedule.byId.get(item.id);
      const computed = after.byId.get(item.id)!;
      return {
        item,
        isNew: !before,
        start: computed.start,
        end: computed.end,
        delta: before ? computed.start - before.start : 0,
        float: computed.float,
      };
    })
    .sort((a, b) => a.start - b.start);
  return { rows, finishBefore: schedule.finishDay, finishAfter: after.finishDay, next };
}
