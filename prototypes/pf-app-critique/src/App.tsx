import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@helenhsong/ui";
import {
  Bell,
  CalendarDays,
  ListFilter,
  UserRound,
  BookUser,
  ChevronDown,
  ChevronLeft,
  Files,
  EllipsisVertical,
  Headphones,
  House,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Clock,
  FileImage,
  FileSpreadsheet,
  FileText,
  Hash,
  Lock,
  Mail,
  Maximize2,
  MessageSquare,
  PenTool,
  Phone,
  Pin,
  Search,
  SearchX,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useDeckFill, useHistoryState } from "../../../src/live-page";
import {
  ME,
  activityFor,
  conversations,
  convById,
  filesFor,
  inLastWeek,
  people,
  shortDate,
  sidebar,
  whereLabel,
  type Conversation,
  type FileKind,
  type Message,
  type Person,
  type SharedFile,
} from "./data";

type Target = { conv: string; msg: string };
type JumpTarget = Target & { parent?: string };
type Side =
  | { kind: "profile"; id: string; fromThread?: { conv: string; parent: string } }
  | { kind: "thread"; conv: string; parent: string; highlight?: string; from?: string }
  | null;
type Tab = "info" | "activity" | "shared";
type SharedFilter = "all" | "with-you";
type SearchType = "all" | "messages" | "files";
type SearchFilters = { type: SearchType; in: string; includesMe: boolean; threadsOnly: boolean; lastWeek: boolean };
const NO_FILTERS: SearchFilters = { type: "all", in: "anywhere", includesMe: false, threadsOnly: false, lastWeek: false };

export function App() {
  const [convId, setConvId] = useHistoryState("conv", "proj-onboarding", { nested: true });
  // One side panel at a time: a profile or a thread, as in Slack.
  const [side, setSide] = useHistoryState<Side>("side", null, { nested: true });
  const [target, setTarget] = useHistoryState<Target | null>("target", null, { nested: true });
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(NO_FILTERS);
  const [sent, setSent] = useState<Record<string, Message[]>>({});

  const profileId = side?.kind === "profile" ? side.id : null;

  const openProfile = (id: string) => {
    if (id === profileId) return;
    setQuery("");
    setFilters(NO_FILTERS);
    // Opening a profile from a thread replaces the thread; the back arrow returns to it.
    const fromThread = side?.kind === "thread" ? { conv: side.conv, parent: side.parent } : undefined;
    setSide({ kind: "profile", id, fromThread });
  };

  const jumpTo = (t: Target & { parent?: string }) => {
    if (t.conv !== convId) setConvId(t.conv);
    if (t.parent) {
      // A reply lives in its thread: the thread replaces the profile in the side panel.
      setTarget({ conv: t.conv, msg: t.parent });
      setSide({ kind: "thread", conv: t.conv, parent: t.parent, highlight: t.msg, from: profileId ?? undefined });
    } else {
      setTarget({ conv: t.conv, msg: t.msg });
    }
  };

  const send = (convKey: string, text: string) =>
    setSent((s) => ({
      ...s,
      [convKey]: [...(s[convKey] ?? []), { id: `sent-${Date.now()}`, author: ME, day: "Thu, Oct 16", time: "2:14 PM", text }],
    }));

  useDeckFill(profileId && !query ? () => setQuery("onboarding flow") : null);

  const conv = convById(convId);
  const threadParent =
    side?.kind === "thread" ? convById(side.conv).messages.find((m) => m.id === side.parent) ?? null : null;

  return (
    <TooltipProvider>
      <div className="slack">
        <Rail />
        <Sidebar active={convId} onSelect={(id) => setConvId(id)} />
        <div className="card">
        <ChannelView
          conv={conv}
          extra={sent[convId] ?? []}
          target={target?.conv === convId ? target : null}
          openThread={side?.kind === "thread" ? side.parent : null}
          onOpenProfile={openProfile}
          onOpenThread={(parent) => setSide({ kind: "thread", conv: convId, parent })}
          onSend={(text) => send(convId, text)}
        />
        {profileId && (
          <ProfilePanel
            key={profileId}
            person={people[profileId]}
            query={query}
            onQuery={setQuery}
            filters={filters}
            onFilters={setFilters}
            onJump={jumpTo}
            onMessage={conversations.some((c) => c.id === `dm-${profileId}`) ? () => setConvId(`dm-${profileId}`) : undefined}
            onBack={
              side?.kind === "profile" && side.fromThread
                ? () => setSide({ kind: "thread", ...side.fromThread! })
                : undefined
            }
            onClose={() => setSide(null)}
          />
        )}
        {side?.kind === "thread" && threadParent && (
          <ThreadPanel
            key={side.parent}
            conv={convById(side.conv)}
            parent={threadParent}
            extra={sent[`thread:${side.parent}`] ?? []}
            highlight={side.highlight}
            from={side.from ? people[side.from] : null}
            onBack={side.from ? () => openProfile(side.from!) : undefined}
            onOpenProfile={openProfile}
            onSend={(text) => send(`thread:${side.parent}`, text)}
            onClose={() => setSide(null)}
          />
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/* ---------- Slack shell ---------- */

function Rail() {
  // Slack's app-level navigation, shown for context; this prototype only covers Home.
  const items = [
    { icon: House, label: "Home", active: true },
    { icon: MessagesSquare, label: "DMs" },
    { icon: Bell, label: "Activity" },
    { icon: Files, label: "Files" },
  ];
  return (
    <div className="rail" aria-hidden="true">
      <div className="rail-workspace">N</div>
      {items.map(({ icon: Icon, label, active }) => (
        <div key={label} className="rail-item" data-active={active || undefined}>
          <span className="rail-icon">
            <Icon size={18} />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const item = (id: string) => {
    const c = convById(id);
    const person = c.kind === "dm" ? people[c.messages.find((m) => m.author !== ME)!.author] : null;
    return (
      <li key={id}>
        <button className="side-item" data-active={id === active || undefined} onClick={() => onSelect(id)}>
          {person ? <PersonTile person={person} size={20} /> : <Hash size={16} />}
          <span className="side-name">{c.name}</span>
        </button>
      </li>
    );
  };
  return (
    <nav className="side" aria-label="Workspace">
      <div className="side-workspace">
        Northwind <ChevronDown size={16} />
      </div>
      <ul className="side-shortcuts" aria-hidden="true">
        <li>
          <MessageSquareText size={16} /> Threads
        </li>
        <li>
          <Headphones size={16} /> Huddles
        </li>
        <li>
          <BookUser size={16} /> Directories
        </li>
      </ul>
      <p className="side-label">Channels</p>
      <ul>{sidebar.channels.map(item)}</ul>
      <p className="side-label">Direct messages</p>
      <ul>{sidebar.dms.map(item)}</ul>
    </nav>
  );
}

function Composer({ label, onSend }: { label: string; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        onSend(draft.trim());
        setDraft("");
      }}
    >
      <InputGroup>
        <InputGroupInput aria-label={label} placeholder={label} value={draft} onChange={(e) => setDraft(e.target.value)} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" size="icon-sm" aria-label="Send" disabled={!draft.trim()}>
            <Send />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function ChannelView({
  conv,
  extra,
  target,
  openThread,
  onOpenProfile,
  onOpenThread,
  onSend,
}: {
  conv: Conversation;
  extra: Message[];
  target: Target | null;
  openThread: string | null;
  onOpenProfile: (id: string) => void;
  onOpenThread: (parent: string) => void;
  onSend: (text: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const messages = [...conv.messages, ...extra];

  // Bring a jumped-to message into view; otherwise show the latest messages.
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const el = target ? document.getElementById(`msg-${target.msg}`) : null;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2, behavior: smooth ? "smooth" : "auto" });
    else box.scrollTo({ top: box.scrollHeight });
  }, [target, conv.id, extra.length]);

  const title = conv.kind === "dm" ? conv.name : `#${conv.name}`;
  let lastDay = "";

  return (
    <main className="channel">
      <header className="channel-head">
        <div className="channel-title">
          <h1>
            {conv.kind === "channel" ? <Hash size={18} /> : null}
            <span className="channel-name">{conv.name}</span>
          </h1>
          {conv.topic && <span className="channel-topic">{conv.topic}</span>}
          {conv.members && (
            <span className="channel-members">
              <span className="member-stack" aria-hidden="true">
                {["priya", "marcus", "jordan"].map((id) => (
                  <PersonTile key={id} person={people[id]} size={20} />
                ))}
              </span>
              <span className="channel-members-count">{conv.members}</span>
              <span className="channel-members-label">members</span>
            </span>
          )}
        </div>
        <div className="channel-tabs" aria-hidden="true">
          <span data-active>
            <MessageCircle size={16} /> Messages
          </span>
          <span>
            <Files size={16} /> Files & links
          </span>
          <span>
            <Pin size={16} /> Pins
          </span>
        </div>
      </header>

      <div className="channel-scroll" ref={scroller}>
        {!conv.joined && <p className="channel-preview">You're viewing #{conv.name}. You're not a member of this channel.</p>}
        {conv.kind === "dm" && messages.length === 0 && (
          <p className="channel-preview">This is the start of your direct messages with {conv.name}.</p>
        )}
        {messages.map((m) => {
          const showDay = m.day !== lastDay;
          lastDay = m.day;
          return (
            <div key={m.id}>
              {showDay && <div className="day-divider"><span>{m.day}</span></div>}
              <MessageRow m={m} highlight={target?.msg === m.id} active={openThread === m.id} onOpenProfile={onOpenProfile} />
              {m.replies && (
                <div className="thread">
                  <button className="thread-toggle" onClick={() => onOpenThread(m.id)}>
                    <span className="member-stack">
                      {[...new Set(m.replies.map((r) => r.author))].slice(0, 3).map((id) => (
                        <PersonTile key={id} person={people[id]} size={20} />
                      ))}
                    </span>
                    {m.replies.length} {m.replies.length === 1 ? "reply" : "replies"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Composer label={`Message ${title}`} onSend={onSend} />
    </main>
  );
}

function ThreadPanel({
  conv,
  parent,
  extra,
  highlight,
  from,
  onBack,
  onOpenProfile,
  onSend,
  onClose,
}: {
  conv: Conversation;
  parent: Message;
  extra: Message[];
  highlight?: string;
  from: Person | null;
  onBack?: () => void;
  onOpenProfile: (id: string) => void;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const replies = [...(parent.replies ?? []), ...extra];
  useEscape(onClose);
  return (
    <aside className="panel" aria-label="Thread">
      <div className="panel-bar">
        {onBack && from && (
          <Button variant="ghost" size="icon-sm" aria-label={`Back to ${from.name}'s profile`} onClick={onBack}>
            <ChevronLeft />
          </Button>
        )}
        <h2 className="panel-bar-title">
          Thread <span className="panel-bar-sub">#{conv.name}</span>
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close thread" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div className="panel-scroll thread-panel">
        <MessageRow m={parent} highlight={false} onOpenProfile={onOpenProfile} />
        <div className="thread-count">
          <span>{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>
        </div>
        {replies.map((r) => (
          <MessageRow key={r.id} m={r} highlight={highlight === r.id} onOpenProfile={onOpenProfile} />
        ))}
      </div>
      <Composer label="Reply…" onSend={onSend} />
    </aside>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function PersonTile({ person, size = 36 }: { person: Person; size?: number }) {
  return (
    <span
      className="tile"
      style={{ background: person.color, width: size, height: size, fontSize: Math.round(size * 0.4), borderRadius: Math.round(size * 0.22) }}
    >
      {size < 28 ? person.name[0] : person.name.split(" ").map((p) => p[0]).join("")}
    </span>
  );
}

function MessageRow({
  m,
  highlight,
  active,
  onOpenProfile,
}: {
  m: Message;
  highlight: boolean;
  active?: boolean;
  onOpenProfile: (id: string) => void;
}) {
  const person = people[m.author];
  return (
    <article id={`msg-${m.id}`} className="msg" data-highlight={highlight || undefined} data-active={active || undefined}>
      <button className="msg-avatar" onClick={() => onOpenProfile(person.id)} aria-label={`Open ${person.name}'s profile`}>
        <PersonTile person={person} />
      </button>
      <div className="msg-body">
        <div className="msg-meta">
          <button className="msg-author" onClick={() => onOpenProfile(person.id)}>
            {person.name}
          </button>
          <span className="msg-time">{m.time}</span>
        </div>
        <p className="msg-text">{m.text}</p>
        {m.files?.map((file) => (
          <div key={file.id} className="msg-file">
            <FileIcon kind={file.kind} />
            {file.name}
          </div>
        ))}
      </div>
    </article>
  );
}

/* ---------- Profile panel ---------- */

function ProfilePanel({
  person,
  query,
  onQuery,
  filters,
  onFilters,
  onJump,
  onMessage,
  onBack,
  onClose,
}: {
  person: Person;
  query: string;
  onQuery: (q: string) => void;
  filters: SearchFilters;
  onFilters: (f: SearchFilters) => void;
  onJump: (t: JumpTarget) => void;
  onMessage?: () => void;
  onBack?: () => void;
  onClose: () => void;
}) {
  // Each person's panel opens on Info and remembers its own tab and filter.
  const [tab, onTab] = useHistoryState<Tab>(`tab:${person.id}`, "info", { nested: true });
  const [filter, onFilter] = useHistoryState<SharedFilter>(`filter:${person.id}`, "all", { nested: true });
  const activity = useMemo(() => activityFor(person.id), [person.id]);
  const files = useMemo(() => filesFor(person.id), [person.id]);
  const first = person.name.split(" ")[0];

  useEscape(onClose);

  return (
    <aside className="panel" aria-label={`${person.name}'s profile`}>
      <div className="panel-bar">
        {onBack && (
          <Button variant="ghost" size="icon-sm" aria-label="Back to thread" onClick={onBack}>
            <ChevronLeft />
          </Button>
        )}
        <h2 className="panel-bar-title">Profile</h2>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Open full profile" />}>
            <Maximize2 />
          </TooltipTrigger>
          <TooltipContent>Open full profile</TooltipContent>
        </Tooltip>
        <Button variant="ghost" size="icon-sm" aria-label="Close profile" onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="panel-person">
        <PersonTile person={person} size={72} />
        <div className="panel-person-text">
          <h3 className="panel-name">{person.name}</h3>
          <p>{person.title}</p>
          <p className="panel-facts">
            {person.team} team · {person.location}
          </p>
          <p className="panel-facts">
            <Clock size={14} /> {person.localTime} local time
          </p>
        </div>
      </div>
      <div className="panel-search">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={`Search ${first}'s messages and files`}
            placeholder={`Search ${first}'s messages and files`}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onQuery("")}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onQuery("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      {query.trim() ? (
        <SearchResults
          query={query.trim()}
          activity={activity}
          files={files}
          first={first}
          filters={filters}
          onFilters={onFilters}
          onJump={onJump}
        />
      ) : (
        <Tabs value={tab} onValueChange={(v) => onTab(v as Tab)} className="panel-tabs">
          <TabsList variant="line" className="panel-tablist">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
          </TabsList>
          <div className="panel-scroll">
            <TabsContent value="info">
              <InfoTab person={person} first={first} onJump={onJump} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab person={person} activity={activity} onJump={onJump} />
            </TabsContent>
            <TabsContent value="shared">
              <SharedTab person={person} files={files} filter={filter} onFilter={onFilter} first={first} onJump={onJump} />
            </TabsContent>
          </div>
        </Tabs>
      )}
      <footer className="panel-footer">
        {onMessage && (
          <Button variant="outline" onClick={onMessage}>
            <MessageCircle /> Message
          </Button>
        )}
        {/* Hint only: huddles are outside this prototype. */}
        <Button variant="outline">
          <Headphones /> Huddle
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label={`More actions for ${person.name}`} />}>
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="more-menu">
            <DropdownMenuItem onClick={() => copy(`@${first}`)}>Copy display name: @{first}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onQuery("");
                onTab("shared");
              }}
            >
              View files
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => copy(`U0${person.id.toUpperCase()}`)}>Copy member ID</DropdownMenuItem>
            <DropdownMenuItem onClick={() => copy(`https://northwind.slack.com/team/${person.id}`)}>Copy link to profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Hint only: hiding people is outside this prototype. */}
            <DropdownMenuItem variant="destructive">Hide {first}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </aside>
  );
}

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

function Section({ title, icon, children, note }: { title: string; icon?: ReactNode; children: ReactNode; note?: ReactNode }) {
  return (
    <section className="psec">
      <h3>
        {icon}
        {title}
      </h3>
      {children}
      {note && <p className="psec-note">{note}</p>}
    </section>
  );
}

function InfoTab({ person, first, onJump }: { person: Person; first: string; onJump: (t: JumpTarget) => void }) {
  return (
    <>
      <Section title="Contact">
        <dl className="contact">
          <dt><Mail size={14} /> Email</dt>
          <dd><a href={`mailto:${person.email}`}>{person.email}</a></dd>
          <dt><Phone size={14} /> Phone</dt>
          <dd>{person.phone}</dd>
        </dl>
      </Section>
      {person.pinned.length > 0 && (
        <Section title="Pinned" icon={<Pin size={14} />}>
          <ul className="rows">
            {person.pinned.map((p) => (
              <li key={p.label}>
                <button className="row" onClick={() => onJump(p.target)}>
                  {p.kind === "message" ? (
                    <span className="file-icon" data-kind="message" aria-hidden="true">
                      <MessageSquare size={16} />
                    </span>
                  ) : (
                    <FileIcon kind={p.kind} />
                  )}
                  <span className="row-stack">
                    <span className="row-main">{p.label}</span>
                    <span className="row-sub">{p.target.parent ? "Thread in " : ""}#{convById(p.target.conv).name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {person.askAbout.length > 0 && (
        <Section title={`Ask ${first} about`} icon={<Sparkles size={14} />} note="AI summary of messages in channels you can see">
          <div className="ask-chips">
            {person.askAbout.map((a) => (
              <Badge key={a} variant="secondary">{a}</Badge>
            ))}
          </div>
          <p className="psec-body">{person.askSummary}</p>
        </Section>
      )}
    </>
  );
}

function ActivityTab({ person, activity, onJump }: { person: Person; activity: ReturnType<typeof activityFor>; onJump: (t: JumpTarget) => void }) {
  return (
    <>
      <Section title="Recent topics" icon={<Sparkles size={14} />} note="AI summary of messages in channels you can see">
        <p className="psec-body">{person.recentTopics}</p>
      </Section>
      <Section title="Recent messages">
        {activity.length ? (
          <ul className="rows">
            {activity.map((m) => (
              <li key={m.id}>
                <button className="row row-msg" onClick={() => onJump({ conv: m.conv.id, msg: m.id, parent: m.parent?.id })}>
                  <span className="row-sub">
                    <span className="row-where">{whereLabel(m.conv, m.parent)}</span>
                    <span className="row-date">{shortDate(m)}</span>
                  </span>
                  <span className="row-main row-snippet">{m.text}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="psec-body muted">No messages in channels you can see yet.</p>
        )}
      </Section>
    </>
  );
}

function FileRow({ file, onJump, query }: { file: SharedFile; onJump: (t: JumpTarget) => void; query?: string }) {
  return (
    <li>
      <button className="row" onClick={() => onJump({ conv: file.conv.id, msg: file.msg.id, parent: file.parent?.id })}>
        <FileIcon kind={file.kind} />
        <span className="row-stack">
          <span className="row-main">{query ? <Mark text={file.name} query={query} /> : file.name}</span>
          <span className="row-sub">
            <span className="row-where">{whereLabel(file.conv, file.parent)}</span>
            <span>{shortDate(file.msg)}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function SharedTab({
  person,
  files,
  filter,
  onFilter,
  first,
  onJump,
}: {
  person: Person;
  files: SharedFile[];
  filter: SharedFilter;
  onFilter: (f: SharedFilter) => void;
  first: string;
  onJump: (t: JumpTarget) => void;
}) {
  const withYou = files.filter((f) => f.withYou);
  const shown = filter === "all" ? files : withYou;
  return (
    <section className="psec">
      <ToggleGroup
        value={[filter]}
        onValueChange={(v: string[]) => v[0] && onFilter(v[0] as SharedFilter)}
        variant="outline"
        size="sm"
        className="shared-filter"
        aria-label="Which files"
      >
        <ToggleGroupItem value="all">All <span className="count">{files.length}</span></ToggleGroupItem>
        <ToggleGroupItem value="with-you">Shared with you <span className="count">{withYou.length}</span></ToggleGroupItem>
      </ToggleGroup>
      <p className="psec-note">
        {filter === "all"
          ? `Everything ${first} has shared in conversations you can see.`
          : `Sent to you directly or to channels you're in.`}
      </p>
      {shown.length ? (
        <ul className="rows">
          {shown.map((file) => (
            <FileRow key={file.id} file={file} onJump={onJump} />
          ))}
        </ul>
      ) : (
        <Empty className="panel-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>Nothing shared with you yet</EmptyTitle>
            <EmptyDescription>Files {first} sends you or posts in your channels will show up here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {filter === "all" && person.privateFiles > 0 && (
        <div className="locked">
          <Lock size={14} />
          {person.privateFiles} {person.privateFiles === 1 ? "file" : "files"} in private channels you're not in
        </div>
      )}
    </section>
  );
}

const TYPE_LABELS: Record<SearchType, string> = { all: "All types", messages: "Messages", files: "Files" };

function matches(conv: Conversation, parent: Message | undefined, msg: Message, f: SearchFilters) {
  if (f.in === "dms" ? conv.kind !== "dm" : f.in !== "anywhere" && conv.id !== f.in) return false;
  if (f.includesMe && !conv.joined) return false;
  if (f.threadsOnly && !parent) return false;
  if (f.lastWeek && !inLastWeek(msg)) return false;
  return true;
}

function FilterMenu({
  icon,
  label,
  active,
  value,
  options,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant={active ? "secondary" : "outline"} size="sm" />}>
        {icon}
        {label}
        <ChevronDown />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="filter-menu">
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as string)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterChip({ icon, label, pressed, onPressed }: { icon: ReactNode; label: string; pressed: boolean; onPressed: (p: boolean) => void }) {
  return (
    <Toggle variant="outline" size="sm" pressed={pressed} onPressedChange={onPressed}>
      {icon}
      {label}
    </Toggle>
  );
}

function SearchResults({
  query,
  activity,
  files,
  first,
  filters,
  onFilters,
  onJump,
}: {
  query: string;
  activity: ReturnType<typeof activityFor>;
  files: SharedFile[];
  first: string;
  filters: SearchFilters;
  onFilters: (f: SearchFilters) => void;
  onJump: (t: JumpTarget) => void;
}) {
  const type = filters.type;
  const set = (patch: Partial<SearchFilters>) => onFilters({ ...filters, ...patch });
  const places = [...new Map(activity.map((m) => [m.conv.id, m.conv])).values()];
  const inOptions = [
    { value: "anywhere", label: "Anywhere" },
    ...(places.some((c) => c.kind === "dm") ? [{ value: "dms", label: "Direct messages" }] : []),
    ...places.filter((c) => c.kind === "channel").map((c) => ({ value: c.id, label: `#${c.name}` })),
  ];
  const inLabel = filters.in === "anywhere" ? "In" : inOptions.find((o) => o.value === filters.in)?.label ?? "In";
  const q = query.toLowerCase();
  const fileHits = files.filter((f) => f.name.toLowerCase().includes(q) && matches(f.conv, f.parent, f.msg, filters));
  const msgHits = activity.filter((m) => m.text.toLowerCase().includes(q) && matches(m.conv, m.parent, m, filters));
  const showFiles = type !== "messages" && fileHits.length > 0;
  const showMsgs = type !== "files" && msgHits.length > 0;
  const filtered = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  return (
    <div className="panel-scroll">
      <div className="search-filters" role="group" aria-label="Search filters">
        <FilterMenu
          icon={<ListFilter />}
          label={TYPE_LABELS[type]}
          active={type !== "all"}
          value={type}
          options={(Object.keys(TYPE_LABELS) as SearchType[]).map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          onChange={(v) => set({ type: v as SearchType })}
        />
        <FilterMenu
          icon={<Hash />}
          label={inLabel}
          active={filters.in !== "anywhere"}
          value={filters.in}
          options={inOptions}
          onChange={(v) => set({ in: v })}
        />
        <span className="search-filters-divider" aria-hidden="true" />
        <FilterChip icon={<UserRound />} label="Includes me" pressed={filters.includesMe} onPressed={(p) => set({ includesMe: p })} />
        <FilterChip icon={<MessageSquareText />} label="Threads only" pressed={filters.threadsOnly} onPressed={(p) => set({ threadsOnly: p })} />
        <FilterChip icon={<CalendarDays />} label="Last 7 days" pressed={filters.lastWeek} onPressed={(p) => set({ lastWeek: p })} />
      </div>
      {!showFiles && !showMsgs && (
        <Empty className="panel-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
            <EmptyTitle>No results for “{query}”</EmptyTitle>
            <EmptyDescription>
              {filtered ? "Nothing matches these filters." : `Try a file name or a word from one of ${first}'s messages.`}
            </EmptyDescription>
          </EmptyHeader>
          {filtered && (
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilters(NO_FILTERS)}
              >
                Clear filters
              </Button>
            </EmptyContent>
          )}
        </Empty>
      )}
      {showFiles && (
        <Section title={`Files · ${fileHits.length}`}>
          <ul className="rows">
            {fileHits.map((file) => (
              <FileRow key={file.id} file={file} onJump={onJump} query={query} />
            ))}
          </ul>
        </Section>
      )}
      {showMsgs && (
        <Section title={`Messages · ${msgHits.length}`}>
          <ul className="rows">
            {msgHits.map((m) => (
              <li key={m.id}>
                <button className="row row-msg" onClick={() => onJump({ conv: m.conv.id, msg: m.id, parent: m.parent?.id })}>
                  <span className="row-sub">
                    <span className="row-where">{whereLabel(m.conv, m.parent)}</span>
                    <span className="row-date">{shortDate(m)}</span>
                  </span>
                  <span className="row-main row-snippet"><Mark text={m.text} query={query} /></span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Mark({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function FileIcon({ kind }: { kind: FileKind }) {
  const Icon = { figma: PenTool, doc: FileText, sheet: FileSpreadsheet, pdf: FileText, image: FileImage }[kind];
  return (
    <span className="file-icon" data-kind={kind}>
      <Icon size={16} />
    </span>
  );
}
