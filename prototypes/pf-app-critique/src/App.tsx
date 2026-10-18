import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@helenhsong/ui";
import {
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
  convById,
  filesFor,
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

type Target = { conv: string; msg: string; parent?: string };
type Tab = "info" | "activity" | "shared";
type SharedFilter = "all" | "with-you";

export function App() {
  const [convId, setConvId] = useHistoryState("conv", "proj-onboarding", { nested: true });
  const [profileId, setProfileId] = useHistoryState<string | null>("profile", null, { nested: true });
  const [tab, setTab] = useHistoryState<Tab>("tab", "info", { nested: true });
  const [filter, setFilter] = useHistoryState<SharedFilter>("filter", "all", { nested: true });
  const [target, setTarget] = useHistoryState<Target | null>("target", null, { nested: true });
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<Record<string, Message[]>>({});

  const openProfile = (id: string) => {
    if (id === profileId) return;
    setQuery("");
    setProfileId(id);
  };

  const jumpTo = (t: Target) => {
    if (t.conv !== convId) setConvId(t.conv);
    setTarget(t);
  };

  useDeckFill(profileId && !query ? () => setQuery("onboarding flow") : null);

  const conv = convById(convId);

  return (
    <TooltipProvider>
      <div className="slack">
        <Sidebar active={convId} onSelect={(id) => setConvId(id)} />
        <ChannelView
          conv={conv}
          extra={sent[convId] ?? []}
          target={target?.conv === convId ? target : null}
          onOpenProfile={openProfile}
          onSend={(text) =>
            setSent((s) => ({
              ...s,
              [convId]: [...(s[convId] ?? []), { id: `sent-${Date.now()}`, author: ME, day: "Thu, Oct 16", time: "2:14 PM", text }],
            }))
          }
        />
        {profileId && (
          <ProfilePanel
            key={profileId}
            person={people[profileId]}
            tab={tab}
            onTab={setTab}
            filter={filter}
            onFilter={setFilter}
            query={query}
            onQuery={setQuery}
            onJump={jumpTo}
            onClose={() => setProfileId(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

/* ---------- Slack shell ---------- */

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const item = (id: string) => {
    const c = convById(id);
    const person = c.kind === "dm" ? people[c.messages.find((m) => m.author !== ME)!.author] : null;
    return (
      <li key={id}>
        <button className="side-item" data-active={id === active || undefined} onClick={() => onSelect(id)}>
          {person ? <span className="side-dot" style={{ background: person.color }} /> : <Hash size={14} />}
          {c.name}
        </button>
      </li>
    );
  };
  return (
    <nav className="side" aria-label="Workspace">
      <div className="side-workspace">Northwind</div>
      <p className="side-label">Channels</p>
      <ul>{sidebar.channels.map(item)}</ul>
      <p className="side-label">Direct messages</p>
      <ul>{sidebar.dms.map(item)}</ul>
    </nav>
  );
}

function ChannelView({
  conv,
  extra,
  target,
  onOpenProfile,
  onSend,
}: {
  conv: Conversation;
  extra: Message[];
  target: Target | null;
  onOpenProfile: (id: string) => void;
  onSend: (text: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [openThreads, setOpenThreads] = useState<Record<string, boolean>>({});
  const messages = [...conv.messages, ...extra];

  // A jump into a thread opens it, then the message is brought into view.
  useEffect(() => {
    const el = target ? document.getElementById(`msg-${target.msg}`) : null;
    const box = scroller.current;
    if (!box) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2, behavior: smooth ? "smooth" : "auto" });
    else box.scrollTo({ top: box.scrollHeight });
  }, [target, conv.id, openThreads, extra.length]);

  const title = conv.kind === "dm" ? conv.name : `#${conv.name}`;
  let lastDay = "";

  return (
    <main className="channel">
      <header className="channel-head">
        <h1>
          {conv.kind === "channel" ? <Hash size={16} /> : null}
          {conv.name}
        </h1>
        {conv.topic && <span className="channel-topic">{conv.topic}</span>}
        {conv.members && <span className="channel-members">{conv.members} members</span>}
      </header>
      <div className="channel-scroll" ref={scroller}>
        {!conv.joined && <p className="channel-preview">You're viewing #{conv.name}. You're not a member of this channel.</p>}
        {messages.map((m) => {
          const showDay = m.day !== lastDay;
          lastDay = m.day;
          const thread = openThreads[m.id] ?? target?.parent === m.id;
          return (
            <div key={m.id}>
              {showDay && <div className="day-divider"><span>{m.day}</span></div>}
              <MessageRow m={m} highlight={target?.msg === m.id} onOpenProfile={onOpenProfile} />
              {m.replies && (
                <div className="thread">
                  <button className="thread-toggle" onClick={() => setOpenThreads((o) => ({ ...o, [m.id]: !thread }))}>
                    <MessageSquare size={14} />
                    {thread ? "Hide replies" : `${m.replies.length} ${m.replies.length === 1 ? "reply" : "replies"}`}
                  </button>
                  {thread && (
                    <div className="thread-replies">
                      {m.replies.map((r) => (
                        <MessageRow key={r.id} m={r} highlight={target?.msg === r.id} onOpenProfile={onOpenProfile} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
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
          <InputGroupInput aria-label={`Message ${title}`} placeholder={`Message ${title}`} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" size="icon-sm" aria-label="Send" disabled={!draft.trim()}>
              <Send />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </main>
  );
}

function PersonAvatar({ person, size }: { person: Person; size?: "sm" | "lg" }) {
  return (
    <Avatar size={size}>
      <AvatarFallback style={{ background: person.color, color: "white" }}>
        {person.name.split(" ").map((p) => p[0]).join("")}
      </AvatarFallback>
    </Avatar>
  );
}

function MessageRow({ m, highlight, onOpenProfile }: { m: Message; highlight: boolean; onOpenProfile: (id: string) => void }) {
  const person = people[m.author];
  return (
    <article id={`msg-${m.id}`} className="msg" data-highlight={highlight || undefined}>
      <button className="msg-avatar" onClick={() => onOpenProfile(person.id)} aria-label={`Open ${person.name}'s profile`}>
        <PersonAvatar person={person} />
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
  tab,
  onTab,
  filter,
  onFilter,
  query,
  onQuery,
  onJump,
  onClose,
}: {
  person: Person;
  tab: Tab;
  onTab: (t: Tab) => void;
  filter: SharedFilter;
  onFilter: (f: SharedFilter) => void;
  query: string;
  onQuery: (q: string) => void;
  onJump: (t: Target) => void;
  onClose: () => void;
}) {
  const activity = useMemo(() => activityFor(person.id), [person.id]);
  const files = useMemo(() => filesFor(person.id), [person.id]);
  const first = person.name.split(" ")[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside className="panel" aria-label={`${person.name}'s profile`}>
      <div className="panel-bar">
        <span className="panel-bar-title">Profile</span>
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
        <PersonAvatar person={person} size="lg" />
        <div>
          <h2>{person.name}</h2>
          <p className="panel-title">{person.title}</p>
          <p className="panel-facts">
            <span>{person.team} team</span>
            <span>{person.location}</span>
            <span><Clock size={12} /> {person.localTime} local</span>
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
        <SearchResults query={query.trim()} activity={activity} files={files} first={first} onJump={onJump} />
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
    </aside>
  );
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

function InfoTab({ person, first, onJump }: { person: Person; first: string; onJump: (t: Target) => void }) {
  return (
    <>
      {person.askAbout.length > 0 && (
        <Section title={`Ask ${first} about`} icon={<Sparkles size={14} />} note="Summarized from messages in channels you can see">
          <div className="ask-chips">
            {person.askAbout.map((a) => (
              <Badge key={a} variant="secondary">{a}</Badge>
            ))}
          </div>
          <p className="psec-body">{person.askSummary}</p>
        </Section>
      )}
      {person.pinned.length > 0 && (
        <Section title="Pinned" icon={<Pin size={14} />}>
          <ul className="rows">
            {person.pinned.map((p) => (
              <li key={p.label}>
                <button className="row" onClick={() => onJump(p.target)}>
                  {p.kind === "message" ? <MessageSquare size={16} className="row-icon" /> : <FileIcon kind={p.kind} />}
                  <span className="row-main">{p.label}</span>
                  <span className="row-where">#{convById(p.target.conv).name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Contact">
        <dl className="contact">
          <dt><Mail size={14} /> Email</dt>
          <dd><a href={`mailto:${person.email}`}>{person.email}</a></dd>
          <dt><Phone size={14} /> Phone</dt>
          <dd>{person.phone}</dd>
        </dl>
      </Section>
    </>
  );
}

function ActivityTab({ person, activity, onJump }: { person: Person; activity: ReturnType<typeof activityFor>; onJump: (t: Target) => void }) {
  return (
    <>
      <Section title="Recent topics" icon={<Sparkles size={14} />} note="Summarized from messages in channels you can see">
        <p className="psec-body">{person.recentTopics}</p>
      </Section>
      <Section title="Recent messages">
        {activity.length ? (
          <ul className="rows">
            {activity.map((m) => (
              <li key={m.id}>
                <button className="row row-msg" onClick={() => onJump({ conv: m.conv.id, msg: m.id, parent: m.parent?.id })}>
                  <span className="row-main row-snippet">{m.text}</span>
                  <span className="row-sub">
                    <span className="row-where">{whereLabel(m.conv, m.parent)}</span>
                    <span>{shortDate(m)}</span>
                  </span>
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

function FileRow({ file, onJump, query }: { file: SharedFile; onJump: (t: Target) => void; query?: string }) {
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
  onJump: (t: Target) => void;
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

function SearchResults({
  query,
  activity,
  files,
  first,
  onJump,
}: {
  query: string;
  activity: ReturnType<typeof activityFor>;
  files: SharedFile[];
  first: string;
  onJump: (t: Target) => void;
}) {
  const q = query.toLowerCase();
  const fileHits = files.filter((f) => f.name.toLowerCase().includes(q));
  const msgHits = activity.filter((m) => m.text.toLowerCase().includes(q));
  if (!fileHits.length && !msgHits.length) {
    return (
      <div className="panel-scroll">
        <Empty className="panel-empty">
          <EmptyHeader>
            <EmptyMedia variant="icon"><SearchX /></EmptyMedia>
            <EmptyTitle>No results for “{query}”</EmptyTitle>
            <EmptyDescription>Try a file name or a word from one of {first}'s messages.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
  return (
    <div className="panel-scroll">
      {fileHits.length > 0 && (
        <Section title={`Files · ${fileHits.length}`}>
          <ul className="rows">
            {fileHits.map((file) => (
              <FileRow key={file.id} file={file} onJump={onJump} query={query} />
            ))}
          </ul>
        </Section>
      )}
      {msgHits.length > 0 && (
        <Section title={`Messages · ${msgHits.length}`}>
          <ul className="rows">
            {msgHits.map((m) => (
              <li key={m.id}>
                <button className="row row-msg" onClick={() => onJump({ conv: m.conv.id, msg: m.id, parent: m.parent?.id })}>
                  <span className="row-main row-snippet"><Mark text={m.text} query={query} /></span>
                  <span className="row-sub">
                    <span className="row-where">{whereLabel(m.conv, m.parent)}</span>
                    <span>{shortDate(m)}</span>
                  </span>
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
