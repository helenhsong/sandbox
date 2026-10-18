export type FileKind = "figma" | "doc" | "sheet" | "pdf" | "image";

export type FileRef = { id: string; name: string; kind: FileKind };

export type Message = {
  id: string;
  author: string;
  day: string;
  time: string;
  text: string;
  files?: FileRef[];
  replies?: Message[];
};

export type Conversation = {
  id: string;
  name: string;
  kind: "channel" | "dm";
  topic?: string;
  members?: number;
  /** Whether Sam (you) is in it. Public channels you're not in still show up in profiles. */
  joined: boolean;
  messages: Message[];
};

export type Person = {
  id: string;
  name: string;
  title: string;
  team: string;
  location: string;
  localTime: string;
  email: string;
  phone: string;
  color: string;
  askAbout: string[];
  askSummary: string;
  recentTopics: string;
  pinned: { label: string; kind: FileKind | "message"; target: { conv: string; msg: string; parent?: string } }[];
  /** Files shared in private channels you're not in: hinted, never named. */
  privateFiles: number;
};

export const ME = "sam";

export const people: Record<string, Person> = {
  priya: {
    id: "priya",
    name: "Priya Raman",
    title: "Senior Product Designer",
    team: "Growth",
    location: "San Francisco",
    localTime: "2:14 PM",
    email: "priya@northwind.io",
    phone: "(415) 555-0142",
    color: "#7c5cff",
    askAbout: ["Onboarding flow", "Usability research", "Figma handoff", "Empty states"],
    askSummary:
      "Leads design for onboarding v3. Her answers in #proj-onboarding are mostly about the signup flow, research findings and getting designs ready for engineering.",
    recentTopics:
      "This week: finalizing the onboarding v3 flow, planning Tuesday's usability test, and reviewing welcome screen copy with you.",
    pinned: [
      { label: "Onboarding flow v3", kind: "figma", target: { conv: "proj-onboarding", msg: "m6", parent: "m5" } },
      { label: "How I hand off designs", kind: "message", target: { conv: "design-system", msg: "ds1" } },
    ],
    privateFiles: 2,
  },
  marcus: {
    id: "marcus",
    name: "Marcus Chen",
    title: "Product Manager",
    team: "Growth",
    location: "New York",
    localTime: "5:14 PM",
    email: "marcus@northwind.io",
    phone: "(212) 555-0187",
    color: "#e5484d",
    askAbout: ["Launch plan", "Activation metrics", "Scope decisions"],
    askSummary: "Owns the onboarding v3 launch. Most of his messages are about scope, dates and the activation goal.",
    recentTopics: "This week: locking scope for the Nov 7 launch and the activation dashboard.",
    pinned: [{ label: "Onboarding v3 launch plan", kind: "doc", target: { conv: "proj-onboarding", msg: "m1" } }],
    privateFiles: 1,
  },
  jordan: {
    id: "jordan",
    name: "Jordan Ellis",
    title: "Engineering Lead",
    team: "Platform",
    location: "Austin",
    localTime: "4:14 PM",
    email: "jordan@northwind.io",
    phone: "(512) 555-0119",
    color: "#12a594",
    askAbout: ["Auth service", "Release process", "Feature flags"],
    askSummary: "Runs the engineering side of onboarding. Answers questions about the auth service, flags and releases.",
    recentTopics: "This week: the signup API change and the release checklist.",
    pinned: [],
    privateFiles: 0,
  },
  aisha: {
    id: "aisha",
    name: "Aisha Okafor",
    title: "Frontend Engineer",
    team: "Growth",
    location: "Toronto",
    localTime: "5:14 PM",
    email: "aisha@northwind.io",
    phone: "(416) 555-0163",
    color: "#f76b15",
    askAbout: ["Signup form", "Design system components"],
    askSummary: "Building the new signup screens. Usually answers questions about components and front-end edge cases.",
    recentTopics: "This week: building the welcome screen and the email step.",
    pinned: [],
    privateFiles: 0,
  },
  sam: {
    id: "sam",
    name: "Sam Lee",
    title: "Product Designer",
    team: "Growth",
    location: "San Francisco",
    localTime: "2:14 PM",
    email: "sam@northwind.io",
    phone: "(415) 555-0108",
    color: "#3e63dd",
    askAbout: [],
    askSummary: "Joined Northwind this week.",
    recentTopics: "Getting up to speed on onboarding v3.",
    pinned: [],
    privateFiles: 0,
  },
};

const f = (id: string, name: string, kind: FileKind): FileRef => ({ id, name, kind });

export const conversations: Conversation[] = [
  {
    id: "proj-onboarding",
    name: "proj-onboarding",
    kind: "channel",
    topic: "Onboarding v3 · ships Nov 7",
    members: 14,
    joined: true,
    messages: [
      { id: "m0", author: "priya", day: "Wed, Oct 1", time: "10:02 AM", text: "Retro notes from onboarding v2 are in the thread. Worth a read if you're new to the project.", replies: [
        { id: "m0r1", author: "priya", day: "Wed, Oct 1", time: "10:03 AM", text: "Here they are.", files: [f("f7", "Onboarding v2 retro", "doc")] },
      ] },
      { id: "m00", author: "priya", day: "Thu, Oct 9", time: "3:40 PM", text: "Research synthesis from the 8 signup interviews. TL;DR: people drop at email verification.", files: [f("f2", "Onboarding research synthesis", "doc")] },
      { id: "m01", author: "priya", day: "Sun, Oct 12", time: "11:15 AM", text: "Empty states exploration for the first-run dashboard.", files: [f("f6", "Empty states exploration.png", "image")] },
      { id: "m1", author: "marcus", day: "Thu, Oct 16", time: "9:12 AM", text: "Morning! Reminder that scope locks Friday. Launch plan is pinned to the channel.", files: [f("fm1", "Onboarding v3 launch plan", "doc")] },
      { id: "m2", author: "jordan", day: "Thu, Oct 16", time: "9:30 AM", text: "Signup API change is merged behind the onboarding_v3 flag. Staging deploy after lunch." },
      { id: "m3", author: "aisha", day: "Thu, Oct 16", time: "9:41 AM", text: "Welcome screen is up on staging. The illustration is still a placeholder." },
      { id: "m4", author: "marcus", day: "Thu, Oct 16", time: "10:05 AM", text: "Activation goal for v3 is 45% completing setup in the first session. Dashboard link coming." },
      { id: "m5", author: "jordan", day: "Thu, Oct 16", time: "10:20 AM", text: "Which version of the flow are we building from? I've seen three links floating around.", replies: [
        { id: "m5r1", author: "aisha", day: "Thu, Oct 16", time: "10:24 AM", text: "Same question. I've been using the one from last week." },
        { id: "m6", author: "priya", day: "Thu, Oct 16", time: "10:31 AM", text: "Use v3, it's the source of truth. Sam, this is the one for the email step too.", files: [f("f1", "Onboarding flow v3", "figma")] },
        { id: "m5r3", author: "jordan", day: "Thu, Oct 16", time: "10:33 AM", text: "Perfect, thanks." },
      ] },
      { id: "m7", author: "aisha", day: "Thu, Oct 16", time: "11:02 AM", text: "Heads up, the email step needs an error state for expired links. Not in the current flow." },
      { id: "m8", author: "marcus", day: "Thu, Oct 16", time: "11:20 AM", text: "Usability test is Tuesday. Need two more people from Growth to observe." },
      { id: "m9", author: "jordan", day: "Thu, Oct 16", time: "12:45 PM", text: "Staging is deployed. Flag is on for the internal workspace." },
      { id: "m10", author: "aisha", day: "Thu, Oct 16", time: "1:10 PM", text: "Found a layout bug on small laptops in the plan picker, fixing now." },
      { id: "m11", author: "marcus", day: "Thu, Oct 16", time: "1:52 PM", text: "Can someone from design own the expired-link error state? Want it in before scope lock." },
    ],
  },
  {
    id: "design-system",
    name: "design-system",
    kind: "channel",
    topic: "Components, tokens and handoff",
    members: 32,
    joined: true,
    messages: [
      { id: "ds0", author: "priya", day: "Wed, Oct 1", time: "4:10 PM", text: "Updated illustration kit with the new brand colors.", files: [f("f9", "Brand illustration kit", "figma")] },
      { id: "ds1", author: "priya", day: "Mon, Oct 6", time: "9:05 AM", text: "How I hand off designs: every frame marked Ready has specs, states and copy. If it's not marked Ready, ask me before building it." },
      { id: "ds2", author: "aisha", day: "Mon, Oct 6", time: "9:30 AM", text: "Super helpful, thank you." },
    ],
  },
  {
    id: "design-crit",
    name: "design-crit",
    kind: "channel",
    topic: "Weekly design critique",
    members: 9,
    joined: false,
    messages: [
      { id: "dc1", author: "priya", day: "Tue, Oct 14", time: "3:00 PM", text: "Notes from today's crit on onboarding and pricing.", files: [f("f5", "Design crit notes Oct 14", "doc")] },
    ],
  },
  {
    id: "growth-metrics",
    name: "growth-metrics",
    kind: "channel",
    topic: "Dashboards and experiments",
    members: 21,
    joined: false,
    messages: [
      { id: "gm1", author: "priya", day: "Thu, Oct 2", time: "1:20 PM", text: "Q3 activation funnel, for the onboarding kickoff.", files: [f("f4", "Activation funnel Q3", "sheet")] },
      { id: "gm2", author: "priya", day: "Wed, Oct 8", time: "10:45 AM", text: "Audit of the pricing page before we touch the plan picker.", files: [f("f10", "Pricing page audit", "doc")] },
    ],
  },
  {
    id: "general",
    name: "general",
    kind: "channel",
    topic: "Company-wide announcements",
    members: 48,
    joined: true,
    messages: [
      { id: "g1", author: "marcus", day: "Mon, Oct 13", time: "9:00 AM", text: "Everyone welcome Sam, who joined the Growth team as a product designer!" },
      { id: "g2", author: "priya", day: "Mon, Oct 13", time: "9:04 AM", text: "Welcome Sam! Happy to walk you through onboarding v3 anytime." },
    ],
  },
  {
    id: "dm-priya",
    name: "Priya Raman",
    kind: "dm",
    joined: true,
    messages: [
      { id: "dp1", author: "priya", day: "Mon, Oct 13", time: "2:30 PM", text: "Here's the test plan for Tuesday's sessions. You'll take notes for sessions 2 and 3.", files: [f("f8", "Usability test plan", "pdf")] },
      { id: "dp2", author: "sam", day: "Mon, Oct 13", time: "2:41 PM", text: "Got it, thanks!" },
      { id: "dp3", author: "priya", day: "Wed, Oct 15", time: "4:18 PM", text: "Can you review the welcome screen copy before Friday? Comments in the doc are fine.", files: [f("f3", "Welcome screen copy", "doc")] },
    ],
  },
  {
    id: "dm-marcus",
    name: "Marcus Chen",
    kind: "dm",
    joined: true,
    messages: [{ id: "dmm1", author: "marcus", day: "Mon, Oct 13", time: "10:00 AM", text: "Let's do a 1:1 Thursday to talk through the roadmap." }],
  },
];

export const sidebar = {
  channels: ["general", "proj-onboarding", "design-system"],
  dms: ["dm-priya", "dm-marcus"],
};

export const convById = (id: string) => conversations.find((c) => c.id === id)!;

export type Located<T> = T & { conv: Conversation; parent?: Message };

/** Every message a person wrote in conversations you can see (DMs with you and public channels). */
export function activityFor(personId: string): Located<Message>[] {
  const out: Located<Message>[] = [];
  for (const conv of conversations) {
    for (const m of conv.messages) {
      if (m.author === personId) out.push({ ...m, conv });
      for (const r of m.replies ?? []) if (r.author === personId) out.push({ ...r, conv, parent: m });
    }
  }
  return out.sort((a, b) => stamp(b) - stamp(a));
}

export type SharedFile = Located<FileRef & { msg: Message; withYou: boolean }>;

export function filesFor(personId: string): SharedFile[] {
  return activityFor(personId).flatMap((m) =>
    (m.files ?? []).map((file) => ({ ...file, msg: m, conv: m.conv, parent: m.parent, withYou: m.conv.joined })),
  );
}

export function whereLabel(conv: Conversation, parent?: Message) {
  if (conv.kind === "dm") return "Direct message";
  return parent ? `Thread in #${conv.name}` : `#${conv.name}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function stamp(m: Message) {
  const [, md] = m.day.split(", ");
  const [mon, d] = md.split(" ");
  const [hm, ap] = m.time.split(" ");
  const [h, min] = hm.split(":").map(Number);
  return new Date(2026, MONTHS.indexOf(mon), Number(d), (h % 12) + (ap === "PM" ? 12 : 0), min).getTime();
}

export function shortDate(m: Message) {
  return m.day === "Thu, Oct 16" ? m.time : m.day.split(", ")[1];
}
