// Sample workspace for the prototype: Harbor, a platform launch in its last two weeks.
// The viewer is Sam Rivera, who joined the Platform team this week.

export const ME = "sam";

export type PersonId = "priya" | "marcus" | "sofia" | "dev" | "hannah" | "leo" | "aiko" | "sam";

export type Pin = { title: string; kind: FileKind; meta: string; target: string };

export type Person = {
  id: PersonId;
  name: string;
  first: string;
  title: string;
  team: string;
  location: string;
  localTime: string;
  email: string;
  manager?: PersonId;
  presence: "active" | "away";
  status?: string;
  color: string;
  workingOn: string;
  askAbout: { topic: string; detail: string }[];
  pinned: Pin[];
};

export const PEOPLE: Record<PersonId, Person> = {
  priya: {
    id: "priya",
    name: "Priya Nair",
    first: "Priya",
    title: "Staff Engineer",
    team: "Platform",
    location: "Toronto",
    localTime: "2:14 PM",
    email: "priya.nair@harbor.dev",
    manager: "marcus",
    presence: "active",
    status: "In a focus block until 3pm",
    color: "#a23e74",
    workingOn:
      "Priya is leading the Harbor rollout: she wrote the 5% → 25% → 100% rollout plan and fixed the token refresh bug that broke the migration dry run. This week she's getting staging to mirror production before Thursday's deploy freeze.",
    askAbout: [
      { topic: "Staging environment", detail: "Access, credentials and how it mirrors production" },
      { topic: "Deploy pipeline", detail: "Canary steps, auto-rollback and the freeze schedule" },
      { topic: "Auth service", detail: "Owns token refresh and the legacy auth path" },
      { topic: "Rollout checklist", detail: "Keeps the checklist in #platform-eng current" },
    ],
    pinned: [
      { title: "Harbor rollout checklist", kind: "Doc", meta: "Pinned in #platform-eng", target: "pe1" },
      { title: "harbor-architecture.png", kind: "Image", meta: "Platform architecture diagram", target: "pe2" },
      { title: "Platform onboarding — start here", kind: "Doc", meta: "From her welcome message", target: "dp1" },
    ],
  },
  marcus: {
    id: "marcus",
    name: "Marcus Chen",
    first: "Marcus",
    title: "Engineering Manager",
    team: "Platform",
    location: "San Francisco",
    localTime: "11:14 AM",
    email: "marcus.chen@harbor.dev",
    presence: "active",
    status: "Launch week",
    color: "#2f6fbd",
    workingOn:
      "Marcus runs the daily launch standup and posts the notes in #proj-harbor-launch. He's tracking the auth fix and the migration re-run.",
    askAbout: [
      { topic: "Launch standups", detail: "Posts notes every morning" },
      { topic: "Platform team", detail: "Manages Platform engineering" },
    ],
    pinned: [],
  },
  sofia: {
    id: "sofia",
    name: "Sofia Alvarez",
    first: "Sofia",
    title: "Product Manager",
    team: "Harbor",
    location: "New York",
    localTime: "2:14 PM",
    email: "sofia.alvarez@harbor.dev",
    presence: "away",
    status: "Customer calls all afternoon",
    color: "#3a8a5c",
    workingOn: "Sofia owns the Harbor launch date and is collecting decisions on the 25% rollout step.",
    askAbout: [{ topic: "Launch scope and dates", detail: "Owns the Harbor roadmap" }],
    pinned: [],
  },
  dev: {
    id: "dev",
    name: "Dev Patel",
    first: "Dev",
    title: "Backend Engineer",
    team: "Platform",
    location: "Austin",
    localTime: "1:14 PM",
    email: "dev.patel@harbor.dev",
    manager: "marcus",
    presence: "active",
    color: "#c2762b",
    workingOn: "Dev has been running the tenant migration dry runs on staging.",
    askAbout: [{ topic: "Tenant migration", detail: "Runs the dry runs and posts results" }],
    pinned: [],
  },
  hannah: {
    id: "hannah",
    name: "Hannah Kim",
    first: "Hannah",
    title: "Product Marketing",
    team: "Growth",
    location: "London",
    localTime: "7:14 PM",
    email: "hannah.kim@harbor.dev",
    presence: "away",
    color: "#7a52b3",
    workingOn: "Hannah is drafting the launch blog post and the customer email.",
    askAbout: [{ topic: "Launch announcement", detail: "Owns the blog post and email" }],
    pinned: [],
  },
  leo: {
    id: "leo",
    name: "Leo Okafor",
    first: "Leo",
    title: "Site Reliability Engineer",
    team: "Infrastructure",
    location: "Lagos",
    localTime: "7:14 PM",
    email: "leo.okafor@harbor.dev",
    presence: "active",
    status: "On call",
    color: "#1f8a8a",
    workingOn: "Leo fixed the staging cert rotation and owns the launch-week on-call rotation.",
    askAbout: [{ topic: "On-call and incidents", detail: "Owns the incident runbook" }],
    pinned: [],
  },
  aiko: {
    id: "aiko",
    name: "Aiko Tanaka",
    first: "Aiko",
    title: "Product Designer",
    team: "Harbor",
    location: "Vancouver",
    localTime: "11:14 AM",
    email: "aiko.tanaka@harbor.dev",
    presence: "active",
    color: "#c24b3a",
    workingOn: "Aiko shared the final onboarding screens and is reviewing dashboard empty states.",
    askAbout: [{ topic: "Onboarding designs", detail: "Owns the Harbor onboarding Figma file" }],
    pinned: [],
  },
  sam: {
    id: "sam",
    name: "Sam Rivera",
    first: "Sam",
    title: "Software Engineer",
    team: "Platform",
    location: "Toronto",
    localTime: "2:14 PM",
    email: "sam.rivera@harbor.dev",
    manager: "marcus",
    presence: "active",
    status: "New on Platform",
    color: "#55606e",
    workingOn: "Sam joined the Platform team on Oct 13.",
    askAbout: [],
    pinned: [],
  },
};

export type ChannelId =
  | "proj-harbor-launch"
  | "platform-eng"
  | "harbor-design"
  | "incidents"
  | "platform-oncall"
  | "general"
  | "random"
  | "dm-priya"
  | "dm-marcus";

export type Channel = {
  id: ChannelId;
  name: string;
  dm?: PersonId;
  // Private channels are only visible to their members, name included.
  private?: boolean;
  member: boolean;
  topic?: string;
  members?: number;
};

export const CHANNELS: Channel[] = [
  { id: "proj-harbor-launch", name: "proj-harbor-launch", member: true, topic: "Harbor GA on Oct 28 · blockers here, decisions in the launch doc", members: 48 },
  { id: "platform-eng", name: "platform-eng", member: true, topic: "Platform team · rollout checklist pinned", members: 22 },
  { id: "harbor-design", name: "harbor-design", private: true, member: true, topic: "Design reviews for Harbor", members: 15 },
  { id: "incidents", name: "incidents", member: false, topic: "Production incidents and postmortems", members: 112 },
  { id: "platform-oncall", name: "platform-oncall", private: true, member: false, topic: "On-call escalations", members: 6 },
  { id: "general", name: "general", member: true, topic: "Company-wide announcements", members: 240 },
  { id: "random", name: "random", member: true, topic: "Everything else", members: 231 },
  { id: "dm-priya", name: "Priya Nair", dm: "priya", member: true },
  { id: "dm-marcus", name: "Marcus Chen", dm: "marcus", member: true },
];

export const channelById = (id: ChannelId) => CHANNELS.find((c) => c.id === id)!;

// The one rule every profile surface uses: the viewer sees public channels, private channels
// they're in, and their own DMs. Anything else never appears, not even the channel's name.
export function canSee(id: ChannelId) {
  const channel = channelById(id);
  if (channel.dm) return true;
  return !channel.private || channel.member;
}

export type FileKind = "Doc" | "PDF" | "Image" | "CSV" | "Figma";

export type SharedFile = { id: string; name: string; kind: FileKind; size: string };

export type Reaction = { emoji: string; count: number };

export type Message = {
  id: string;
  channel: ChannelId;
  author: PersonId;
  // Days before today, for date filters and grouping.
  ago: number;
  time: string;
  text: string;
  files?: SharedFile[];
  reactions?: Reaction[];
  replies?: Message[];
  parentId?: string;
};

type Draft = Omit<Message, "channel" | "replies" | "parentId"> & { replies?: Omit<Message, "channel" | "ago">[] };

function inChannel(channel: ChannelId, drafts: Draft[]): Message[] {
  return drafts.map((d) => ({
    ...d,
    channel,
    replies: d.replies?.map((r) => ({ ...r, ago: d.ago, channel, parentId: d.id })),
  }));
}

// Oldest first within each channel, as Slack shows them.
export const MESSAGES: Message[] = [
  ...inChannel("proj-harbor-launch", [
    {
      id: "hl1",
      author: "sofia",
      ago: 1,
      time: "9:02 AM",
      text: "Morning! 10 days to Harbor GA. Reminder: blockers go in this channel, decisions go in the launch doc.",
      reactions: [{ emoji: "👍", count: 6 }],
    },
    {
      id: "hl2",
      author: "marcus",
      ago: 1,
      time: "9:15 AM",
      text: "Welcome @Sam, who joined Platform this week 👋 Priya is your onboarding buddy.",
      reactions: [{ emoji: "🎉", count: 9 }, { emoji: "👋", count: 4 }],
    },
    {
      id: "hl3",
      author: "leo",
      ago: 1,
      time: "9:48 AM",
      text: "Staging was flaky overnight. Root cause was the cert rotation job; it's fixed and I'm monitoring.",
      replies: [
        { id: "hl3r1", author: "dev", time: "9:55 AM", text: "Thanks Leo. Does this affect anyone's staging login?" },
        {
          id: "hl3r2",
          author: "priya",
          time: "10:03 AM",
          text: "Logins are fine. If you need staging access, the credentials are in 1Password under Harbor / Staging, and the rollout checklist is pinned in #platform-eng. Sam, that's the one you were asking about.",
        },
        { id: "hl3r3", author: "leo", time: "10:06 AM", text: "Adding that to the runbook so it's in one place." },
      ],
    },
    {
      id: "hl4",
      author: "aiko",
      ago: 1,
      time: "10:30 AM",
      text: "Final screens for the onboarding flow. Comments by Thursday please.",
      files: [{ id: "f-onb", name: "Harbor onboarding — v3", kind: "Figma", size: "Figma file" }],
      reactions: [{ emoji: "😍", count: 5 }],
    },
    {
      id: "hl5",
      author: "dev",
      ago: 1,
      time: "11:12 AM",
      text: "Migration dry run on staging: 2 of 14 tenants failed, both on the legacy auth path. Results attached.",
      files: [{ id: "f-dry", name: "migration-dry-run-results.csv", kind: "CSV", size: "38 KB" }],
      replies: [
        { id: "hl5r1", author: "marcus", time: "11:20 AM", text: "Is this a blocker for the 5% step?" },
        { id: "hl5r2", author: "priya", time: "11:34 AM", text: "That's the token refresh bug in auth-service. I have a fix up in PR #4821." },
        { id: "hl5r3", author: "dev", time: "11:40 AM", text: "I'll re-run once it merges." },
        { id: "hl5r4", author: "marcus", time: "11:41 AM", text: "Great, not a blocker then." },
      ],
    },
    {
      id: "hl6",
      author: "hannah",
      ago: 1,
      time: "1:05 PM",
      text: "Launch blog draft is ready for review. Product folks, please check the feature list.",
      files: [{ id: "f-blog", name: "Harbor launch blog — draft", kind: "Doc", size: "Google Doc" }],
    },
    {
      id: "hl7",
      author: "priya",
      ago: 1,
      time: "3:40 PM",
      text: "Rollout plan v2 is up: we go 5% → 25% → 100% over three days, with a kill switch at each step.",
      files: [{ id: "f-plan", name: "harbor-rollout-plan-v2.pdf", kind: "PDF", size: "1.2 MB" }],
      reactions: [{ emoji: "🙌", count: 11 }],
    },
    {
      id: "hl8",
      author: "sofia",
      ago: 1,
      time: "4:22 PM",
      text: "Can we decide the date for the 25% step by Friday? @Marcus @Priya",
      replies: [
        { id: "hl8r1", author: "priya", time: "4:30 PM", text: "Oct 24 works if the re-run passes. I'll confirm tomorrow." },
        { id: "hl8r2", author: "marcus", time: "4:31 PM", text: "+1" },
      ],
    },
    { id: "hl9", author: "leo", ago: 0, time: "8:55 AM", text: "Deploy freeze starts Thursday at 6pm ET." },
    {
      id: "hl10",
      author: "marcus",
      ago: 0,
      time: "9:20 AM",
      text: "Standup notes: auth fix merged, migration re-run tonight, docs on track.",
    },
    {
      id: "hl11",
      author: "dev",
      ago: 0,
      time: "9:47 AM",
      text: "Re-ran the dry run with Priya's fix: 14 of 14 tenants pass ✅",
      reactions: [{ emoji: "🎉", count: 12 }],
    },
    {
      id: "hl12",
      author: "priya",
      ago: 0,
      time: "10:12 AM",
      text: "Staging now mirrors the prod config. If your tests rely on the old feature flags they'll fail; the flag list is in the rollout checklist.",
      reactions: [{ emoji: "👀", count: 3 }],
    },
    {
      id: "hl13",
      author: "aiko",
      ago: 0,
      time: "10:40 AM",
      text: "Empty states for the dashboard. Could use eng eyes on the loading skeleton.",
      files: [{ id: "f-empty", name: "dashboard-empty-states.png", kind: "Image", size: "640 KB" }],
      replies: [
        { id: "hl13r1", author: "priya", time: "10:52 AM", text: "Skeleton looks right. Keep the row height fixed so the table doesn't jump." },
        { id: "hl13r2", author: "aiko", time: "10:55 AM", text: "Will do, thank you!" },
      ],
    },
    {
      id: "hl14",
      author: "hannah",
      ago: 0,
      time: "11:30 AM",
      text: "Customer email goes out the day we hit 100%. @Sofia can you confirm the date?",
    },
    { id: "hl15", author: "sofia", ago: 0, time: "11:34 AM", text: "Confirmed: Oct 28 for 100%." },
    {
      id: "hl16",
      author: "leo",
      ago: 0,
      time: "12:05 PM",
      text: "On-call rotation for launch week is in the incident runbook.",
      files: [{ id: "f-runbook", name: "Harbor incident runbook", kind: "Doc", size: "Google Doc" }],
    },
    {
      id: "hl17",
      author: "priya",
      ago: 0,
      time: "1:18 PM",
      text: "@Sam want to pair on the canary dashboard at 3? It's a good way to learn the deploy pipeline.",
      replies: [{ id: "hl17r1", author: "sam", time: "1:21 PM", text: "Yes please!" }],
    },
    {
      id: "hl18",
      author: "dev",
      ago: 0,
      time: "1:52 PM",
      text: "PR #4830 needs one more review before the freeze. Any Platform folks free?",
    },
  ]),

  ...inChannel("platform-eng", [
    {
      id: "pe0",
      author: "marcus",
      ago: 20,
      time: "10:00 AM",
      text: "Auth service ownership moves to Platform this sprint. Priya is the point person.",
    },
    {
      id: "pe1",
      author: "priya",
      ago: 4,
      time: "9:30 AM",
      text: "The Harbor rollout checklist is pinned here. Please keep your sections current.",
      files: [{ id: "f-check", name: "Harbor rollout checklist", kind: "Doc", size: "Google Doc" }],
      reactions: [{ emoji: "✅", count: 7 }],
    },
    {
      id: "pe2",
      author: "priya",
      ago: 2,
      time: "2:10 PM",
      text: "Updated architecture diagram: the canary step now rolls back automatically at a 2% error rate.",
      files: [{ id: "f-arch", name: "harbor-architecture.png", kind: "Image", size: "1.8 MB" }],
      replies: [{ id: "pe2r1", author: "marcus", time: "2:25 PM", text: "This is great, linking it from the runbook." }],
    },
  ]),

  ...inChannel("harbor-design", [
    {
      id: "hd1",
      author: "aiko",
      ago: 3,
      time: "3:00 PM",
      text: "Do we show tenant IDs in the migration banner, or just the tenant name?",
      replies: [{ id: "hd1r1", author: "priya", time: "3:12 PM", text: "Name only. IDs confuse customers and support can look them up." }],
    },
  ]),

  ...inChannel("incidents", [
    {
      id: "in1",
      author: "priya",
      ago: 9,
      time: "6:40 PM",
      text: "Postmortem for the Oct 9 auth outage is up. Action items are assigned in the doc.",
      files: [{ id: "f-pm", name: "postmortem-auth-oct-9.pdf", kind: "PDF", size: "420 KB" }],
    },
  ]),

  ...inChannel("platform-oncall", [
    {
      id: "oc1",
      author: "priya",
      ago: 1,
      time: "7:15 PM",
      text: "Escalation for the auth-service alert tonight: page me, not Leo. Updated rotation attached.",
      files: [{ id: "f-oncall", name: "oncall-rotation-oct.pdf", kind: "PDF", size: "180 KB" }],
    },
    {
      id: "oc2",
      author: "priya",
      ago: 0,
      time: "8:02 AM",
      text: "Quiet night. Staging creds were rotated after the cert fix, new ones are in the vault.",
    },
  ]),

  ...inChannel("general", [
    {
      id: "g1",
      author: "marcus",
      ago: 5,
      time: "9:00 AM",
      text: "Please welcome @Sam to Harbor! Sam joins the Platform team as a software engineer 🎉",
      reactions: [{ emoji: "🎉", count: 31 }],
      replies: [
        { id: "g1r1", author: "priya", time: "9:12 AM", text: "Welcome Sam! Glad to have you on Platform." },
        { id: "g1r2", author: "sam", time: "9:30 AM", text: "Thanks everyone, excited to be here!" },
      ],
    },
  ]),

  ...inChannel("random", [
    { id: "r1", author: "hannah", ago: 0, time: "12:40 PM", text: "Who's in the office for lunch Thursday? 🍜" },
  ]),

  ...inChannel("dm-priya", [
    {
      id: "dp1",
      author: "priya",
      ago: 5,
      time: "9:20 AM",
      text: "Welcome to Harbor! I'm your onboarding buddy. Start with the Platform onboarding doc, and I'll get you staging access once your laptop is set up.",
      files: [{ id: "f-onboard", name: "Platform onboarding — start here", kind: "Doc", size: "Google Doc" }],
    },
    { id: "dp2", author: "sam", ago: 5, time: "9:41 AM", text: "Thanks Priya! Reading it now." },
    { id: "dp3", author: "sam", ago: 3, time: "4:02 PM", text: "Where do I find the staging credentials?" },
    {
      id: "dp4",
      author: "priya",
      ago: 3,
      time: "4:15 PM",
      text: "Good question. I'll answer in the launch channel so everyone who needs staging sees it too.",
    },
  ]),

  ...inChannel("dm-marcus", [
    { id: "dm1", author: "marcus", ago: 4, time: "12:10 PM", text: "Hey Sam, your 1:1 with me is Thursdays at 11. Ping me anytime." },
  ]),
];

export const allMessages = (): Message[] => MESSAGES.flatMap((msg) => [msg, ...(msg.replies ?? [])]);

export const findMessage = (id: string) => allMessages().find((msg) => msg.id === id);

// Why a message involves the viewer, if it does.
export function involvesYou(msg: Message): string | null {
  if (msg.author === ME) return null;
  if (channelById(msg.channel).dm) return "DM with you";
  if (/@Sam\b/.test(msg.text)) return "Mentions you";
  if (/\bSam\b/.test(msg.text)) return "Mentions you by name";
  const parent = msg.parentId ? findMessage(msg.parentId) : msg;
  if (parent && [parent, ...(parent.replies ?? [])].some((r) => r.author === ME)) return "Thread you're in";
  return null;
}

export function dayLabel(ago: number) {
  if (ago === 0) return "Today";
  if (ago === 1) return "Yesterday";
  const date = new Date(2026, 9, 18 - ago);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
