// All names, addresses, permit numbers and portal links are fictional.

export const TODAY = "2026-10-12";
export const WEEK_END = "2026-10-18";
export const STALE_AFTER_DAYS = 6;

export type PermitStatus = "In review" | "Corrections" | "Approved" | "Expiring soon";
export const STATUSES: PermitStatus[] = ["In review", "Corrections", "Approved", "Expiring soon"];

export type ActionType = "correction" | "inspection" | "renewal" | "fee" | "document" | "status";

export type Job = { id: string; name: string; address: string };
export type Jurisdiction = { id: string; name: string; portal: string; portalUrl: string };
export type Comment = { id: string; date: string; reviewer: string; discipline: string; text: string };

export type Permit = {
  id: string;
  number: string;
  type: string;
  jobId: string;
  jurisdictionId: string;
  status: PermitStatus;
  submitted: string;
  expires: string | null;
  nextDeadline: string | null;
  lastChecked: number;
  comments: Comment[];
};

export type Action = {
  id: string;
  permitId: string;
  type: ActionType;
  task: string;
  due: string;
  snoozed?: boolean;
};

export const ACTION_LABEL: Record<ActionType, string> = {
  correction: "Correction",
  inspection: "Inspection",
  renewal: "Renewal",
  fee: "Fee due",
  document: "Document",
  status: "Update status",
};

export const JOBS: Job[] = [
  { id: "maple", name: "Maple Ridge Clinic", address: "4120 Tallowood Ln, Austin" },
  { id: "barton", name: "Barton Lofts", address: "915 Calloway St, Austin" },
  { id: "cedar", name: "Cedar Bend Elementary Addition", address: "2200 Fennick Rd, Round Rock" },
  { id: "lakeline", name: "Lakeline Retail Shell", address: "780 Harrow Pkwy, Williamson County" },
  { id: "onion", name: "Onion Creek Warehouse", address: "15060 Pruett Rd, Travis County" },
  { id: "station9", name: "Fire Station 9 Remodel", address: "3307 Delmar Ave, Austin" },
];

export const JURISDICTIONS: Jurisdiction[] = [
  { id: "austin", name: "City of Austin", portal: "City of Austin permit portal", portalUrl: "https://example.com/portal/austin" },
  { id: "travis", name: "Travis County", portal: "Travis County permit portal", portalUrl: "https://example.com/portal/travis-county" },
  { id: "roundrock", name: "City of Round Rock", portal: "City of Round Rock permit portal", portalUrl: "https://example.com/portal/round-rock" },
  { id: "wilco", name: "Williamson County", portal: "Williamson County permit portal", portalUrl: "https://example.com/portal/williamson-county" },
];

const permit = (
  id: string,
  number: string,
  type: string,
  jobId: string,
  jurisdictionId: string,
  status: PermitStatus,
  submitted: string,
  expires: string | null,
  nextDeadline: string | null,
  lastChecked: number,
  comments: Comment[] = [],
): Permit => ({ id, number, type, jobId, jurisdictionId, status, submitted, expires, nextDeadline, lastChecked, comments });

export const PERMITS: Permit[] = [
  permit("p1", "BP-2026-04418", "Commercial building", "maple", "austin", "Corrections", "2026-08-18", null, "2026-10-08", 2, [
    { id: "c1", date: "2026-09-24", reviewer: "R. Okafor", discipline: "Structural", text: "Provide sealed calculations for the roof framing at gridlines C to F. Sheet S-201 does not match the truss layout." },
    { id: "c2", date: "2026-09-24", reviewer: "L. Brandt", discipline: "Fire", text: "Show fire-rated assembly details for the corridor walls next to the exam rooms." },
    { id: "c3", date: "2026-09-25", reviewer: "M. Castell", discipline: "Accessibility", text: "The accessible route from parking to the main entry is missing slope and landing dimensions." },
  ]),
  permit("p2", "EP-2026-11702", "Electrical", "barton", "austin", "Approved", "2026-09-02", "2027-04-01", "2026-10-09", 3),
  permit("p3", "DP-2025-00931", "Site development", "onion", "travis", "Expiring soon", "2025-10-20", "2026-10-24", "2026-10-10", 4),
  permit("p4", "RR-BLD-26-0582", "Building addition", "cedar", "roundrock", "Corrections", "2026-08-31", null, "2026-10-12", 1, [
    { id: "c4", date: "2026-10-01", reviewer: "T. Halvorsen", discipline: "Building", text: "Egress width at the east stair is under the minimum for the calculated occupant load." },
    { id: "c5", date: "2026-10-01", reviewer: "T. Halvorsen", discipline: "Energy", text: "Submit the envelope compliance report for the addition." },
  ]),
  permit("p5", "PP-2026-07215", "Plumbing", "barton", "austin", "Approved", "2026-07-14", "2027-03-02", "2026-10-12", 1),
  permit("p6", "WC-2026-3391", "Commercial shell", "lakeline", "wilco", "In review", "2026-09-21", null, "2026-10-12", 3),
  permit("p7", "MP-2026-05540", "Mechanical", "maple", "austin", "In review", "2026-09-15", null, "2026-10-13", 8),
  permit("p8", "TC-FP-26-0147", "Fire protection", "onion", "travis", "Corrections", "2026-09-08", null, "2026-10-14", 2, [
    { id: "c6", date: "2026-10-05", reviewer: "D. Marrero", discipline: "Fire", text: "Hydraulic calculations use a water supply test older than 12 months. Provide a current flow test." },
    { id: "c7", date: "2026-10-05", reviewer: "D. Marrero", discipline: "Fire", text: "Show sprinkler coverage under the mezzanine storage area." },
  ]),
  permit("p9", "RR-ELE-26-0719", "Electrical", "cedar", "roundrock", "Approved", "2026-08-11", "2027-02-18", "2026-10-14", 2),
  permit("p10", "WC-2026-3407", "Driveway and right-of-way", "lakeline", "wilco", "In review", "2026-09-28", null, "2026-10-15", 4),
  permit("p11", "BP-2026-02260", "Interior remodel", "station9", "austin", "Expiring soon", "2026-04-27", "2026-11-06", "2026-10-16", 5),
  permit("p12", "DM-2026-01877", "Demolition", "station9", "austin", "In review", "2026-10-01", null, "2026-10-16", 2),
  permit("p13", "TC-OSSF-26-0093", "Septic system", "onion", "travis", "Approved", "2026-06-30", "2027-06-30", "2026-10-17", 3),
  permit("p14", "SP-2026-00655", "Sign", "lakeline", "wilco", "Corrections", "2026-09-17", null, "2026-10-18", 1, [
    { id: "c8", date: "2026-10-07", reviewer: "A. Pruitt", discipline: "Zoning", text: "The monument sign exceeds the maximum height for this frontage. Revise the elevation or request a variance." },
  ]),
  permit("p15", "BP-2026-03975", "Residential building", "barton", "austin", "Approved", "2026-05-14", "2027-05-14", null, 2),
  permit("p16", "RR-PLB-26-0611", "Plumbing", "cedar", "roundrock", "In review", "2026-09-29", null, "2026-10-27", 1),
  permit("p17", "TC-DRV-26-0210", "Driveway", "onion", "travis", "Approved", "2026-07-22", "2027-01-22", null, 5),
  permit("p18", "EP-2026-12044", "Electrical", "station9", "austin", "In review", "2026-10-02", null, "2026-10-30", 3),
];

export const ACTIONS: Action[] = [
  { id: "a1", permitId: "p1", type: "correction", task: "Respond to plan review comments", due: "2026-10-08" },
  { id: "a2", permitId: "p2", type: "fee", task: "Pay the issuance fee", due: "2026-10-09" },
  { id: "a3", permitId: "p3", type: "renewal", task: "File the renewal application", due: "2026-10-10" },
  { id: "a4", permitId: "p4", type: "correction", task: "Respond to plan review comments", due: "2026-10-12" },
  { id: "a5", permitId: "p5", type: "inspection", task: "Schedule the rough-in inspection", due: "2026-10-12" },
  { id: "a6", permitId: "p6", type: "document", task: "Upload the stamped civil set", due: "2026-10-12" },
  { id: "a7", permitId: "p7", type: "status", task: "Check the portal and update the status", due: "2026-10-13" },
  { id: "a8", permitId: "p8", type: "correction", task: "Respond to fire review comments", due: "2026-10-14" },
  { id: "a9", permitId: "p9", type: "inspection", task: "Schedule the service inspection", due: "2026-10-14" },
  { id: "a10", permitId: "p10", type: "fee", task: "Pay the review fee", due: "2026-10-15" },
  { id: "a11", permitId: "p11", type: "renewal", task: "File the extension request", due: "2026-10-16" },
  { id: "a12", permitId: "p12", type: "document", task: "Upload the asbestos survey", due: "2026-10-16" },
  { id: "a13", permitId: "p13", type: "inspection", task: "Schedule the final inspection", due: "2026-10-17" },
  { id: "a14", permitId: "p14", type: "correction", task: "Respond to zoning comments", due: "2026-10-18" },
];

const DAY = 86_400_000;

export const daysFromToday = (iso: string) => Math.round((Date.parse(iso) - Date.parse(TODAY)) / DAY);

export const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString().slice(0, 10);

export function formatDate(iso: string | null) {
  if (!iso) return "–";
  const date = new Date(`${iso}T00:00:00`);
  const sameYear = iso.startsWith(TODAY.slice(0, 4));
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

export const formatLongDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
