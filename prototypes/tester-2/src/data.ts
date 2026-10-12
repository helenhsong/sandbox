// Sample data for the prototype. Every company, person and place is fictional.
//
// Dates are working-day offsets from "today" (Mon Oct 12, 2026 = day 0), so
// day 4 is Fri Oct 16 and day 5 is Mon Oct 19. An item occupies [start, end).

export type ItemType = "permit" | "task" | "inspection";

export type PermitStatus = "draft" | "submitted" | "review" | "corrections" | "approved" | "expired";
export type TaskStatus = "not_started" | "in_progress" | "done";
export type InspectionStatus = "open" | "scheduled" | "passed" | "failed";

export interface Item {
  id: string;
  projectId: string;
  type: ItemType;
  title: string;
  status: PermitStatus | TaskStatus | InspectionStatus;
  owner: string;
  /** Actual start, once the item has started. */
  start?: number;
  /** Actual end, once the item is complete. */
  end?: number;
  /** Working days of effort (tasks) or review (permits). */
  duration: number;
  dependsOn: string[];
  note?: string;
  /** Tasks: percent complete. */
  progress?: number;
  /** Permits: day the corrections must be resubmitted by. */
  resubmitDue?: number;
  /** Permits: day the corrections were resubmitted. */
  resubmittedDay?: number;
  /** Permits: last day the permit is valid. */
  expires?: number;
  /** Inspections: booked day and window. */
  scheduledDay?: number;
  window?: "AM" | "PM";
  /** Inspections: working days of notice the city needs. */
  lead?: number;
  failReasons?: string[];
  /** Set on items created by a failed inspection. */
  origin?: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  scope: string;
  phase: string;
  /** Day the final item was planned to finish. */
  targetDay: number;
}

export const TODAY = 0;

export const CONTRACTOR = "Northline Builders";

export const PROJECTS: Project[] = [
  {
    id: "alder",
    name: "Alder Street ADU",
    location: "Oakridge",
    scope: "Detached 640 sq ft ADU, residential",
    phase: "Rough-in",
    targetDay: 32,
  },
  {
    id: "birch",
    name: "Birch Ct kitchen remodel",
    location: "Oakridge",
    scope: "Kitchen remodel, residential",
    phase: "Finishes",
    targetDay: 5,
  },
  {
    id: "elm",
    name: "Elm Ave deck + stairs",
    location: "Oakridge",
    scope: "Rear deck and stairs, residential",
    phase: "Foundations",
    targetDay: 6,
  },
  {
    id: "harbor",
    name: "Harbor Rd re-roof",
    location: "Oakridge",
    scope: "Full tear-off and re-roof, residential",
    phase: "Pre-construction",
    targetDay: 2,
  },
];

const CITY = "City of Oakridge";
const CREW = "Northline crew";
const OFFICE = "Northline office";

export const ITEMS: Item[] = [
  // Alder Street ADU: permits
  {
    id: "p-building",
    projectId: "alder",
    type: "permit",
    title: "Building permit",
    status: "approved",
    owner: OFFICE,
    start: -20,
    end: -18,
    duration: 2,
    dependsOn: [],
  },
  {
    id: "p-electrical",
    projectId: "alder",
    type: "permit",
    title: "Electrical permit",
    status: "approved",
    owner: OFFICE,
    start: -20,
    end: -16,
    duration: 4,
    dependsOn: [],
  },
  {
    id: "p-plumbing",
    projectId: "alder",
    type: "permit",
    title: "Plumbing permit",
    status: "approved",
    owner: OFFICE,
    start: -20,
    end: -17,
    duration: 3,
    dependsOn: [],
  },
  {
    id: "p-mechanical",
    projectId: "alder",
    type: "permit",
    title: "Mechanical permit",
    status: "corrections",
    owner: OFFICE,
    start: -10,
    duration: 5,
    resubmitDue: 4,
    dependsOn: [],
    note: "Plan review asked for a revised load calculation and duct layout on Oct 9. Summit Heating & Air is preparing the revision.",
  },
  {
    id: "p-row",
    projectId: "alder",
    type: "permit",
    title: "Sidewalk encroachment permit",
    status: "approved",
    owner: OFFICE,
    start: -20,
    end: -18,
    duration: 2,
    expires: 6,
    dependsOn: [],
    note: "Covers the dumpster on the sidewalk right-of-way. Drywall delivery and haul-off need it in place.",
  },
  // Alder Street ADU: tasks
  {
    id: "t-foundation",
    projectId: "alder",
    type: "task",
    title: "Foundation pour",
    status: "done",
    owner: CREW,
    start: -18,
    end: -14,
    duration: 4,
    dependsOn: ["p-building"],
  },
  {
    id: "t-framing",
    projectId: "alder",
    type: "task",
    title: "Framing",
    status: "done",
    owner: CREW,
    start: -13,
    end: -8,
    duration: 5,
    dependsOn: ["i-foundation"],
  },
  {
    id: "t-rough-plumbing",
    projectId: "alder",
    type: "task",
    title: "Rough plumbing",
    status: "done",
    owner: "Rivera Plumbing",
    start: -7,
    end: -3,
    duration: 4,
    dependsOn: ["i-framing", "p-plumbing"],
  },
  {
    id: "t-rough-electrical",
    projectId: "alder",
    type: "task",
    title: "Rough electrical",
    status: "in_progress",
    owner: "Volt Electric",
    start: -5,
    duration: 8,
    progress: 80,
    dependsOn: ["i-framing", "p-electrical"],
  },
  {
    id: "t-rough-mechanical",
    projectId: "alder",
    type: "task",
    title: "Rough mechanical",
    status: "not_started",
    owner: "Summit Heating & Air",
    duration: 4,
    dependsOn: ["i-framing", "p-mechanical"],
  },
  {
    id: "t-insulation",
    projectId: "alder",
    type: "task",
    title: "Insulation",
    status: "not_started",
    owner: CREW,
    duration: 3,
    dependsOn: ["i-rough-plumbing", "i-rough-electrical", "i-rough-mechanical"],
  },
  {
    id: "t-drywall",
    projectId: "alder",
    type: "task",
    title: "Drywall",
    status: "not_started",
    owner: "Keystone Drywall",
    duration: 6,
    dependsOn: ["i-insulation", "p-row"],
  },
  {
    id: "t-finishes",
    projectId: "alder",
    type: "task",
    title: "Interior finishes",
    status: "not_started",
    owner: CREW,
    duration: 10,
    dependsOn: ["t-drywall"],
  },
  {
    id: "t-punch",
    projectId: "alder",
    type: "task",
    title: "Final punch list",
    status: "not_started",
    owner: CREW,
    duration: 3,
    dependsOn: ["t-finishes"],
  },
  // Alder Street ADU: inspections
  {
    id: "i-foundation",
    projectId: "alder",
    type: "inspection",
    title: "Foundation inspection",
    status: "passed",
    owner: CITY,
    start: -14,
    end: -13,
    duration: 1,
    dependsOn: ["t-foundation"],
  },
  {
    id: "i-framing",
    projectId: "alder",
    type: "inspection",
    title: "Framing inspection",
    status: "passed",
    owner: CITY,
    start: -8,
    end: -7,
    duration: 1,
    dependsOn: ["t-framing"],
  },
  {
    id: "i-rough-plumbing",
    projectId: "alder",
    type: "inspection",
    title: "Rough plumbing inspection",
    status: "passed",
    owner: CITY,
    start: -3,
    end: -2,
    duration: 1,
    dependsOn: ["t-rough-plumbing"],
  },
  {
    id: "i-rough-electrical",
    projectId: "alder",
    type: "inspection",
    title: "Rough electrical inspection",
    status: "scheduled",
    owner: CITY,
    scheduledDay: 3,
    window: "AM",
    duration: 1,
    dependsOn: ["t-rough-electrical"],
  },
  {
    id: "i-rough-mechanical",
    projectId: "alder",
    type: "inspection",
    title: "Rough mechanical inspection",
    status: "open",
    owner: CITY,
    duration: 1,
    dependsOn: ["p-mechanical", "t-rough-mechanical"],
  },
  {
    id: "i-insulation",
    projectId: "alder",
    type: "inspection",
    title: "Insulation inspection",
    status: "open",
    owner: CITY,
    duration: 1,
    dependsOn: ["t-insulation"],
  },
  {
    id: "i-final",
    projectId: "alder",
    type: "inspection",
    title: "Final building inspection",
    status: "open",
    owner: CITY,
    duration: 1,
    dependsOn: ["t-punch"],
  },

  // Birch Ct kitchen remodel
  {
    id: "b-permit",
    projectId: "birch",
    type: "permit",
    title: "Building permit",
    status: "approved",
    owner: OFFICE,
    start: -15,
    end: -12,
    duration: 3,
    dependsOn: [],
  },
  {
    id: "b-cabinets",
    projectId: "birch",
    type: "task",
    title: "Cabinet install",
    status: "in_progress",
    owner: "Fieldstone Millwork",
    start: -3,
    duration: 8,
    progress: 40,
    dependsOn: ["b-permit"],
  },
  {
    id: "b-final",
    projectId: "birch",
    type: "inspection",
    title: "Final building inspection",
    status: "open",
    owner: CITY,
    duration: 1,
    dependsOn: ["b-cabinets"],
  },

  // Elm Ave deck + stairs
  {
    id: "e-footing-insp",
    projectId: "elm",
    type: "inspection",
    title: "Footing inspection",
    status: "failed",
    owner: CITY,
    start: -1,
    end: 0,
    duration: 1,
    dependsOn: [],
    failReasons: ["Two footings short of required depth"],
  },
  {
    id: "e-footing-fix",
    projectId: "elm",
    type: "task",
    title: "Deepen two footings",
    status: "in_progress",
    owner: CREW,
    start: 0,
    duration: 2,
    progress: 30,
    dependsOn: ["e-footing-insp"],
    origin: "e-footing-insp",
  },
  {
    id: "e-footing-reinsp",
    projectId: "elm",
    type: "inspection",
    title: "Footing reinspection",
    status: "open",
    owner: CITY,
    duration: 1,
    lead: 1,
    dependsOn: ["e-footing-fix"],
    origin: "e-footing-insp",
  },
  {
    id: "e-framing",
    projectId: "elm",
    type: "task",
    title: "Deck framing",
    status: "not_started",
    owner: CREW,
    duration: 5,
    dependsOn: ["e-footing-reinsp"],
  },

  // Harbor Rd re-roof
  {
    id: "h-permit",
    projectId: "harbor",
    type: "permit",
    title: "Re-roof permit",
    status: "approved",
    owner: OFFICE,
    start: -8,
    end: -5,
    duration: 3,
    dependsOn: [],
  },
  {
    id: "h-street",
    projectId: "harbor",
    type: "permit",
    title: "Street-use permit",
    status: "expired",
    owner: OFFICE,
    start: -15,
    end: -13,
    duration: 2,
    expires: -1,
    dependsOn: [],
    note: "Covers the dumpster at the curb. It lapsed Oct 9 while the job waited on materials.",
  },
  {
    id: "h-tearoff",
    projectId: "harbor",
    type: "task",
    title: "Tear-off",
    status: "not_started",
    owner: "Crestline Roofing",
    duration: 2,
    dependsOn: ["h-permit", "h-street"],
  },
  {
    id: "h-sheathing",
    projectId: "harbor",
    type: "inspection",
    title: "Sheathing inspection",
    status: "open",
    owner: CITY,
    duration: 1,
    dependsOn: ["h-tearoff"],
  },
];

export const FAIL_REASONS: { id: string; label: string; days: number }[] = [
  { id: "box-fill", label: "Missing box fill labels", days: 1 },
  { id: "gfci", label: "GFCI protection not installed", days: 1 },
  { id: "support", label: "Cable runs not supported", days: 2 },
  { id: "other", label: "Other correction noted on the card", days: 1 },
];

const BASE = Date.UTC(2026, 9, 12);
const DAY_MS = 86_400_000;

export function toDate(day: number): Date {
  const week = Math.floor(day / 5);
  const weekday = ((day % 5) + 5) % 5;
  return new Date(BASE + (week * 7 + weekday) * DAY_MS);
}

const shortFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Oct 16" */
export function formatDay(day: number): string {
  return shortFormat.format(toDate(day));
}

/** "Fri, Oct 16" */
export function formatDayLong(day: number): string {
  return longFormat.format(toDate(day));
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export const TYPE_LABEL: Record<ItemType, string> = {
  permit: "Permit",
  task: "Task",
  inspection: "Inspection",
};

export const LANE_LABEL: Record<ItemType, string> = {
  permit: "Permits",
  task: "Tasks",
  inspection: "Inspections",
};

export const LANES: ItemType[] = ["permit", "task", "inspection"];
