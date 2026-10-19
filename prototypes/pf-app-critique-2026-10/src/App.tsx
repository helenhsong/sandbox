import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Tabs,
  Toaster,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from "@helenhsong/ui";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Bell,
  BookUser,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  EllipsisVertical,
  File,
  FileSpreadsheet,
  FileText,
  Hash,
  Lock,
  Headphones,
  History,
  Home,
  Image as ImageIcon,
  Mail,
  Maximize2,
  MessageCircle,
  MessagesSquare,
  MoreHorizontal,
  PenTool,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  Star,
  Users,
  X,
} from "lucide-react";
import { useDeckFill, useHistoryState } from "../../../src/live-page";
import { DECK_HISTORY_EVENT, type LivePageWindow } from "../../../src/live-page/contract";
import {
  CHANNELS,
  ME,
  MESSAGES,
  PEOPLE,
  allMessages,
  canSee,
  channelById,
  dayLabel,
  findMessage,
  involvesYou,
  type ChannelId,
  type FileKind,
  type Message,
  type Person,
  type PersonId,
  type SharedFile,
} from "./data";

type Tab = "info" | "activity" | "shared";
// The right pane shows the thread when one is open, otherwise the profile. Whenever the pane's
// content is replaced (a result opens a thread, a name in a thread opens a profile, Manager opens
// another profile), what it replaced goes on `prev`, so the pane's back arrow returns to it with
// its tab intact. Closing the pane clears the stack. The top bar's back and forward step through
// every view, channel changes included.
type Pane = { profile: PersonId | null; tab: Tab; thread: string | null; prev: Pane | null };
type View = { channel: ChannelId } & Pane;
type TypeFilter = "message" | "thread" | "file";
type DateFilter = "any" | "7" | "30";
type Filters = { query: string; types: TypeFilter[]; where: ChannelId[]; date: DateFilter; involving: boolean };

const START: View = { channel: "proj-harbor-launch", profile: null, tab: "info", thread: null, prev: null };
const NO_FILTERS: Filters = { query: "", types: [], where: [], date: "any", involving: false };

const TYPE_LABELS: Record<TypeFilter, string> = { message: "Messages", thread: "Threads", file: "Files" };
const DATE_LABELS: Record<DateFilter, string> = { any: "Any time", "7": "Past 7 days", "30": "Past 30 days" };
const DATE_ORDER: DateFilter[] = ["any", "7", "30"];

export function App() {
  const [view, setView] = useHistoryState<View>("view", START);
  // Each person keeps their own search and filters, so going back to a profile finds it as you left it.
  const [filtersBy, setFiltersBy] = useState<Partial<Record<PersonId, Filters>>>({});
  const [highlight, setHighlight] = useState<{ id: string; n: number } | null>(null);
  const filters = (view.profile && filtersBy[view.profile]) || NO_FILTERS;
  const setFilters = (next: Filters, id: PersonId | null = view.profile) => {
    if (id) setFiltersBy((all) => ({ ...all, [id]: next }));
  };

  const pane = (): Pane | null =>
    view.profile || view.thread ? { profile: view.profile, tab: view.tab, thread: view.thread, prev: view.prev } : null;
  const inStack = (id: PersonId) => {
    for (let p = pane(); p; p = p.prev) if (p.profile === id) return true;
    return false;
  };
  // Replaces the pane's content, keeping what it showed so the back arrow can return to it.
  const showPane = (next: Omit<Pane, "prev">, channel = view.channel) => setView({ channel, ...next, prev: pane() });

  const openProfile = (id: PersonId) => {
    if (view.profile === id && !view.thread) return;
    // A fresh look at someone starts unfiltered; a profile still in the back stack keeps its search.
    if (!inStack(id)) setFilters(NO_FILTERS, id);
    showPane({ profile: id, tab: "info", thread: null });
  };
  const openThread = (id: string) => {
    if (view.thread !== id) showPane({ profile: null, tab: view.tab, thread: id });
  };
  const paneBack = () => view.prev && setView({ channel: view.channel, ...view.prev });
  const closePane = () => setView({ ...view, profile: null, thread: null, prev: null });

  // Every result opens the same way: the profile stays open, the channel switches to where the
  // message lives and highlights it. A thread reply highlights its parent; "N replies" then opens
  // the thread scrolled to the reply, with a back arrow to the profile. The top bar's back
  // returns to the channel you were in.
  const jumpTo = (id: string) => {
    const msg = findMessage(id);
    if (!msg) return;
    setView({ ...view, channel: msg.channel });
    setHighlight({ id, n: (highlight?.n ?? 0) + 1 });
  };

  useEffect(() => {
    if (!view.profile && !view.thread) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape closes the filters popover first, then the right pane.
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector(".filter-pop")) return;
      setView({ ...view, profile: null, thread: null, prev: null });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, setView]);

  // Happy path: open Priya's profile on Activity, narrowed to what involves Sam and "staging",
  // so the message Sam is trying to remember is in view. Offered only while something is left to
  // fill, so the window's fast-forward button disappears once it's done (and while a thread is open).
  const priya = view.profile === "priya" ? filters : NO_FILTERS;
  const filled = view.profile === "priya" && view.tab === "activity" && !!priya.query && priya.involving;
  useDeckFill(view.thread || filled ? null : () => {
    if (view.profile === "priya") setView({ ...view, tab: "activity" });
    else showPane({ profile: "priya", tab: "activity", thread: null });
    setFilters({ ...priya, query: priya.query || "staging", involving: true }, "priya");
  });

  const backLabel = view.prev ? (view.prev.thread ? "Back to thread" : `Back to ${PEOPLE[view.prev.profile!].first}'s profile`) : null;

  return (
    <Toaster toastManager={toast}>
      <TooltipProvider delay={300}>
        <div className="slack">
          <TopBar />
          <div className="slack-body">
            <Rail />
            <Sidebar current={view.channel} onSelect={(channel) => setView({ ...view, channel })} />
            <div className="slack-card">
              <ChannelView
                channelId={view.channel}
                openThread={view.thread}
                highlight={highlight}
                onOpenProfile={openProfile}
                onOpenThread={openThread}
              />
              {view.thread && (
                <ThreadPane
                  parentId={view.thread}
                  highlight={highlight}
                  backLabel={backLabel}
                  onBack={paneBack}
                  onClose={closePane}
                  onOpenProfile={openProfile}
                />
              )}
              {view.profile && !view.thread && (
                <ProfilePanel
                  person={PEOPLE[view.profile]}
                  tab={view.tab}
                  onTab={(tab) => setView({ ...view, tab })}
                  filters={filters}
                  onFilters={(f) => setFilters(f)}
                  backLabel={backLabel}
                  onBack={paneBack}
                  onClose={closePane}
                  onJump={jumpTo}
                  selected={highlight?.id}
                  onOpenProfile={openProfile}
                  onMessage={(channel) => setView({ ...view, channel })}
                />
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </Toaster>
  );
}

/* ---------- Shell ---------- */

// Slack's own back and forward, stepping through the same view history as the prototype window.
function TopBar() {
  const history = (window as Window & LivePageWindow).deckHistory;
  const [, rerender] = useState(0);
  useEffect(() => {
    const update = () => rerender((n) => n + 1);
    // ⌘[ and ⌘], as in Slack.
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key === "[") history?.back();
      else if (e.key === "]") history?.forward();
      else return;
      e.preventDefault();
    };
    window.addEventListener(DECK_HISTORY_EVENT, update);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(DECK_HISTORY_EVENT, update);
      window.removeEventListener("keydown", onKey);
    };
  }, [history]);
  return (
    <header className="topbar">
      <span className="topbar-nav">
        <NavButton label="Back" keys="⌘[" disabled={!history?.canBack()} onClick={() => history?.back()}>
          <ArrowLeft size={18} aria-hidden />
        </NavButton>
        <NavButton label="Forward" keys="⌘]" disabled={!history?.canForward()} onClick={() => history?.forward()}>
          <ArrowRight size={18} aria-hidden />
        </NavButton>
        <span className="topbar-icon" aria-hidden>
          <History size={18} />
        </span>
      </span>
      <div className="topbar-search">
        <Search size={14} aria-hidden />
        <input aria-label="Search Harbor" placeholder="Search Harbor" />
      </div>
    </header>
  );
}

function NavButton({ label, keys, disabled, onClick, children }: { label: string; keys: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<button type="button" className="topbar-btn" aria-label={label} aria-keyshortcuts={keys === "⌘[" ? "Meta+BracketLeft" : "Meta+BracketRight"} disabled={disabled} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="tooltip-keys">{keys}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function Rail() {
  const items = [
    { icon: Home, label: "Home", active: true },
    { icon: MessagesSquare, label: "DMs" },
    { icon: Bell, label: "Activity" },
    { icon: File, label: "Files" },
    { icon: MoreHorizontal, label: "More" },
  ];
  return (
    <nav className="rail" aria-label="Workspace">
      <div className="rail-workspace" aria-label="Harbor workspace">
        H
      </div>
      {items.map(({ icon: Icon, label, active }) => (
        <div key={label} className="rail-item" data-active={active || undefined}>
          <span className="rail-icon">
            <Icon size={20} aria-hidden />
          </span>
          <span className="rail-label">{label}</span>
        </div>
      ))}
      <div className="rail-spacer" />
      <PersonAvatar person={PEOPLE[ME]} size={32} dot />
    </nav>
  );
}

function Sidebar({ current, onSelect }: { current: ChannelId; onSelect: (id: ChannelId) => void }) {
  const channels = CHANNELS.filter((c) => !c.dm && c.member);
  const dms = CHANNELS.filter((c) => c.dm);
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-workspace">
          Harbor <ChevronDown size={16} aria-hidden />
        </span>
        <span className="sidebar-head-icons" aria-hidden>
          <Settings size={18} />
          <SquarePen size={18} />
        </span>
      </div>
      <div className="sidebar-find">
        <Search size={14} aria-hidden />
        <input aria-label="Find a conversation" placeholder="Find a conversation…" />
      </div>
      <div className="sidebar-scroll">
        <div className="sidebar-group">
          <div className="sidebar-row sidebar-static">
            <MessageCircle size={16} aria-hidden /> Threads
          </div>
          <div className="sidebar-row sidebar-static">
            <Headphones size={16} aria-hidden /> Huddles
          </div>
          <div className="sidebar-row sidebar-static">
            <BookUser size={16} aria-hidden /> Directories
          </div>
        </div>
        <div className="sidebar-section">
          <ChevronDown size={14} aria-hidden /> Channels
        </div>
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            className="sidebar-row"
            aria-current={c.id === current ? "page" : undefined}
            onClick={() => onSelect(c.id)}
          >
            {c.private ? <Lock size={16} aria-hidden /> : <Hash size={16} aria-hidden />}
            <span className="truncate">{c.name}</span>
          </button>
        ))}
        <div className="sidebar-section">
          <ChevronDown size={14} aria-hidden /> Direct messages
        </div>
        {dms.map((c) => (
          <button
            key={c.id}
            type="button"
            className="sidebar-row"
            aria-current={c.id === current ? "page" : undefined}
            onClick={() => onSelect(c.id)}
          >
            <PersonAvatar person={PEOPLE[c.dm!]} size={20} dot />
            <span className="truncate">{c.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ---------- Channel ---------- */

// Where each channel was scrolled, so coming back to one (sidebar or back) lands where you left it.
const channelScroll = new Map<ChannelId, number>();

function ChannelView({
  channelId,
  openThread,
  highlight,
  onOpenProfile,
  onOpenThread,
}: {
  channelId: ChannelId;
  openThread: string | null;
  highlight: { id: string; n: number } | null;
  onOpenProfile: (id: PersonId) => void;
  onOpenThread: (id: string) => void;
}) {
  const channel = channelById(channelId);
  const messages = MESSAGES.filter((msg) => msg.channel === channelId);
  const listRef = useRef<HTMLDivElement>(null);
  const dmPerson = channel.dm ? PEOPLE[channel.dm] : null;

  // A new jump scrolls to its message (below). Otherwise go back to where this channel was left,
  // or open at the latest message, as Slack does.
  const handled = useRef(0);
  const latest = useRef(highlight);
  useLayoutEffect(() => {
    latest.current = highlight;
  });
  useLayoutEffect(() => {
    if (latest.current && latest.current.n !== handled.current) return;
    const saved = channelScroll.get(channelId);
    const restore = () => {
      const list = listRef.current;
      if (list) list.scrollTop = saved ?? list.scrollHeight;
    };
    restore();
    // Fonts and the window's first layout can change the height after mount.
    if (saved === undefined) document.fonts?.ready.then(() => requestAnimationFrame(restore));
  }, [channelId]);

  useEffect(() => {
    if (!highlight || highlight.n === handled.current) return;
    handled.current = highlight.n;
    const target = findMessage(highlight.id);
    const el = document.getElementById(`msg-${target?.parentId ?? highlight.id}`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [highlight]);

  return (
    <main className="channel">
      <header className="channel-head">
        <div className="channel-title-row">
          <span className="channel-title-left">
          <Star size={18} aria-hidden className="channel-star" />
          <h1 className="channel-title">
            {dmPerson ? (
              <PersonAvatar person={dmPerson} size={20} dot />
            ) : channel.private ? (
              <Lock size={18} strokeWidth={2.5} aria-hidden />
            ) : (
              <Hash size={18} strokeWidth={2.5} aria-hidden />
            )}
            <span className="truncate">{channel.name}</span>
          </h1>
          {channel.topic && <span className="channel-topic">{channel.topic}</span>}
          </span>
          <span className="channel-head-right">
          {channel.members && (
            <span className="channel-members">
              <span className="avatar-stack" aria-hidden>
                {(["priya", "marcus", "sofia"] as PersonId[]).map((id) => (
                  <PersonAvatar key={id} person={PEOPLE[id]} size={22} />
                ))}
              </span>
              {channel.members}
            </span>
          )}
          <span className="channel-head-icons" aria-hidden>
            <Bell size={18} />
            <Search size={18} />
            <EllipsisVertical size={18} />
          </span>
          </span>
        </div>
        <div className="channel-tabs" role="presentation">
          <span className="channel-tab" data-active>
            <MessageCircle size={16} aria-hidden /> Messages
          </span>
          <span className="channel-tab">
            <File size={16} aria-hidden /> Files &amp; links
          </span>
          <span className="channel-tab">
            <Bookmark size={16} aria-hidden /> Pins
          </span>
        </div>
      </header>

      <div key={channelId} className="channel-list" ref={listRef} onScroll={(e) => channelScroll.set(channelId, e.currentTarget.scrollTop)}>
        {messages.map((msg, i) => (
          <Fragment key={msg.id}>
            {(i === 0 || messages[i - 1].ago !== msg.ago) && (
              <div className="day-divider">
                <span>{dayLabel(msg.ago)}</span>
              </div>
            )}
            <MessageItem
              msg={msg}
              idPrefix="msg"
              highlight={highlight}
              threadOpen={openThread === msg.id}
              onOpenProfile={onOpenProfile}
              onOpenThread={() => onOpenThread(msg.id)}
            />
          </Fragment>
        ))}
      </div>

      <div className="composer">
        <textarea aria-label={`Message ${channel.dm ? channel.name : "#" + channel.name}`} placeholder={`Message ${channel.dm ? channel.name : "#" + channel.name}`} rows={1} />
        <div className="composer-tools">
          <span className="composer-icons" aria-hidden>
            <Plus size={16} />
            <AtSign size={16} />
          </span>
          <span className="composer-send" aria-hidden>
            <Send size={16} />
          </span>
        </div>
      </div>
    </main>
  );
}

function MessageItem({
  msg,
  idPrefix,
  highlight,
  threadOpen,
  onOpenProfile,
  onOpenThread,
}: {
  msg: Message;
  idPrefix: "msg" | "tmsg";
  highlight: { id: string; n: number } | null;
  threadOpen?: boolean;
  onOpenProfile: (id: PersonId) => void;
  onOpenThread?: () => void;
}) {
  const author = PEOPLE[msg.author];
  const replies = msg.replies ?? [];
  // In the channel, a highlighted thread reply lights up its parent, since the reply lives in the thread.
  const replyLit = idPrefix === "msg" && replies.some((r) => r.id === highlight?.id);
  const lit = highlight?.id === msg.id || replyLit;
  const className = ["msg", lit && "is-highlighted", threadOpen && "is-thread-open"].filter(Boolean).join(" ");
  return (
    <article id={`${idPrefix}-${msg.id}`} key={lit ? `lit-${highlight?.n}` : "rest"} className={className}>
      <button type="button" className="msg-avatar" onClick={() => onOpenProfile(author.id)} aria-label={`Open ${author.name}'s profile`}>
        <PersonAvatar person={author} size={36} />
      </button>
      <div className="msg-body">
        <div className="msg-meta">
          <button type="button" className="msg-author" onClick={() => onOpenProfile(author.id)}>
            {author.name}
          </button>
          <span className="msg-time">{idPrefix === "tmsg" && msg.ago > 0 ? `${dayLabel(msg.ago)} at ${msg.time}` : msg.time}</span>
        </div>
        <p className="msg-text">
          <RichText text={msg.text} />
        </p>
        {msg.files?.map((file) => <FileCard key={file.id} file={file} />)}
        {msg.reactions && (
          <div className="reactions">
            {msg.reactions.map((r) => (
              <span key={r.emoji} className="reaction">
                <span aria-hidden>{r.emoji}</span> {r.count}
              </span>
            ))}
          </div>
        )}
        {replies.length > 0 && onOpenThread && (
          <button type="button" className="thread-summary" data-lit={replyLit || undefined} onClick={onOpenThread}>
            <span className="avatar-stack" aria-hidden>
              {[...new Set(replies.map((r) => r.author))].slice(0, 3).map((id) => (
                <PersonAvatar key={id} person={PEOPLE[id]} size={20} />
              ))}
            </span>
            <span className="thread-count">
              {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
            <span className="thread-last">Last reply {replies.at(-1)!.time}</span>
          </button>
        )}
      </div>
    </article>
  );
}

function ThreadPane({
  parentId,
  highlight,
  backLabel,
  onBack,
  onClose,
  onOpenProfile,
}: {
  parentId: string;
  highlight: { id: string; n: number } | null;
  backLabel: string | null;
  onBack: () => void;
  onClose: () => void;
  onOpenProfile: (id: PersonId) => void;
}) {
  const parent = findMessage(parentId)!;
  const channel = channelById(parent.channel);
  const replies = parent.replies ?? [];

  useEffect(() => {
    if (!highlight) return;
    const el = document.getElementById(`tmsg-${highlight.id}`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [highlight, parentId]);

  return (
    <aside className="pane" aria-label="Thread">
      <header className="pane-head">
        <span className="pane-title">
          {backLabel && <PaneBack label={backLabel} onClick={onBack} />}
          <h2>Thread</h2>
          <span className="pane-sub">{channel.dm ? channel.name : <ChannelLabel id={channel.id} />}</span>
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="Close thread" onClick={onClose}>
          <X size={18} aria-hidden />
        </Button>
      </header>
      <div className="pane-body thread-body">
        <MessageItem msg={parent} idPrefix="tmsg" highlight={highlight} onOpenProfile={onOpenProfile} />
        <div className="thread-divider">
          <span>
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
        </div>
        {replies.map((r) => (
          <MessageItem key={r.id} msg={r} idPrefix="tmsg" highlight={highlight} onOpenProfile={onOpenProfile} />
        ))}
        <div className="composer composer-thread">
          <textarea aria-label="Reply" placeholder="Reply…" rows={1} />
          <div className="composer-tools">
            <span className="composer-icons" aria-hidden>
              <Plus size={16} />
              <AtSign size={16} />
            </span>
            <span className="composer-send" aria-hidden>
              <Send size={16} />
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PaneBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        <ChevronLeft size={18} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function RichText({ text, query }: { text: string; query?: string }) {
  const parts = text.split(/(@\w+|#[a-z][\w-]*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span key={i} className={part === "@Sam" ? "mention mention-me" : "mention"}>
              {part}
            </span>
          );
        }
        if (part.startsWith("#") && part.length > 1) {
          return (
            <span key={i} className="mention">
              {part}
            </span>
          );
        }
        return <Highlighted key={i} text={part} query={query} />;
      })}
    </>
  );
}

function Highlighted({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

const FILE_ICONS: Record<FileKind, typeof File> = {
  Doc: FileText,
  PDF: File,
  Image: ImageIcon,
  CSV: FileSpreadsheet,
  Figma: PenTool,
};

function FileIcon({ kind }: { kind: FileKind }) {
  const Icon = FILE_ICONS[kind];
  return (
    <span className="file-icon" data-kind={kind}>
      <Icon size={16} aria-hidden />
    </span>
  );
}

function FileCard({ file }: { file: SharedFile }) {
  return (
    <div className="file-card">
      <FileIcon kind={file.kind} />
      <span className="file-card-text">
        <span className="file-name">{file.name}</span>
        <span className="file-meta">
          {file.kind} · {file.size}
        </span>
      </span>
    </div>
  );
}

function PersonAvatar({ person, size, dot }: { person: Person; size: number; dot?: boolean }) {
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <span className="avatar" style={{ width: size, height: size, background: person.color, fontSize: size * 0.4 }}>
      {initials}
      {dot && <span className="presence" data-presence={person.presence} />}
    </span>
  );
}

/* ---------- Profile ---------- */

const profileScroll = new Map<string, number>();

type Activity = Message & { reason: string | null };

function useProfileData(person: Person, filters: Filters) {
  return useMemo(() => {
    const own = allMessages()
      .filter((msg) => msg.author === person.id && canSee(msg.channel))
      .map((msg): Activity => ({ ...msg, reason: involvesYou(msg) }))
      .sort((a, b) => a.ago - b.ago || toMinutes(b.time) - toMinutes(a.time));

    const q = filters.query.trim().toLowerCase();
    const matchCommon = (msg: Activity) => {
      if (filters.where.length && !filters.where.includes(msg.channel)) return false;
      if (filters.date !== "any" && msg.ago > Number(filters.date)) return false;
      if (filters.involving && !msg.reason) return false;
      return true;
    };
    const matchText = (msg: Activity) =>
      !q ||
      msg.text.toLowerCase().includes(q) ||
      channelById(msg.channel).name.toLowerCase().includes(q) ||
      (msg.files ?? []).some((f) => f.name.toLowerCase().includes(q));
    const matchType = (msg: Activity) =>
      !filters.types.length ||
      filters.types.some((t) =>
        t === "file" ? !!msg.files?.length : t === "thread" ? !!msg.parentId || !!msg.replies?.length : !msg.parentId,
      );

    const activity = own.filter((msg) => matchCommon(msg) && matchText(msg) && matchType(msg));
    const files = own
      .filter((msg) => msg.files?.length && matchCommon(msg))
      .flatMap((msg) => msg.files!.map((file) => ({ file, msg })))
      .filter(({ file, msg }) => !q || file.name.toLowerCase().includes(q) || msg.text.toLowerCase().includes(q));
    const where = [...new Set(own.map((msg) => msg.channel))];
    const pinned = person.pinned.filter((pin) => {
      const msg = findMessage(pin.target);
      return msg && canSee(msg.channel);
    });
    return { activity, files, where, pinned };
  }, [person, filters]);
}

function toMinutes(time: string) {
  const [, h, min, ap] = time.match(/(\d+):(\d+) (AM|PM)/)!;
  return ((Number(h) % 12) + (ap === "PM" ? 12 : 0)) * 60 + Number(min);
}

function copy(text: string, title: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
  toast.add({ title, timeout: 2000 });
}

function ProfilePanel({
  person,
  tab,
  onTab,
  filters,
  onFilters,
  backLabel,
  onBack,
  onClose,
  onJump,
  selected,
  onOpenProfile,
  onMessage,
}: {
  person: Person;
  selected?: string;
  tab: Tab;
  onTab: (tab: Tab) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  backLabel: string | null;
  onBack: () => void;
  onClose: () => void;
  onJump: (id: string) => void;
  onOpenProfile: (id: PersonId) => void;
  onMessage: (channel: ChannelId) => void;
}) {
  const { activity, files, where, pinned } = useProfileData(person, filters);
  const dm = CHANNELS.find((c) => c.dm === person.id);
  const filterCount = filters.types.length + filters.where.length + (filters.date !== "any" ? 1 : 0) + (filters.involving ? 1 : 0);
  const narrowed = filterCount > 0 || filters.query.trim() !== "";
  const clear = () => onFilters(NO_FILTERS);

  const setQuery = (query: string) => {
    onFilters({ ...filters, query });
    if (tab === "info" && query.trim()) onTab("activity");
  };

  // Each person and tab keeps its scroll, so coming back to a list lands on the row you opened.
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollKey = `${person.id}:${tab}`;
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = profileScroll.get(scrollKey) ?? 0;
  }, [scrollKey]);

  return (
    <aside className="pane profile" aria-label={`${person.name}'s profile`}>
      <header className="pane-head">
        <span className="pane-title">
          {backLabel && <PaneBack label={backLabel} onClick={onBack} />}
          <h2>Profile</h2>
        </span>
        <span className="pane-actions">
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Expand profile" />}>
              <Maximize2 size={16} aria-hidden />
            </TooltipTrigger>
            <TooltipContent>Full profile coming soon</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon-sm" aria-label="Close profile" onClick={onClose}>
            <X size={18} aria-hidden />
          </Button>
        </span>
      </header>

      <div className="profile-id">
        <Tooltip>
          <TooltipTrigger
            render={<span className="profile-avatar" tabIndex={0} />}
            aria-label={`${person.presence === "active" ? "Active" : "Away"}${person.status ? `: ${person.status}` : ""}`}
          >
            <PersonAvatar person={person} size={56} dot />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {person.presence === "active" ? "Active" : "Away"}
            {person.status ? ` · ${person.status}` : ""}
          </TooltipContent>
        </Tooltip>
        <div className="profile-id-text">
          <div className="profile-name">{person.name}</div>
          <div className="profile-sub">
            {person.title} · {person.team}
          </div>
          <div className="profile-sub">
            {person.location} · <Clock size={12} aria-hidden className="inline-icon" /> {person.localTime} local time
          </div>
        </div>
      </div>
      <div className="profile-search">
        <div className="search-field">
          <Search size={16} aria-hidden />
          <input
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${person.first}'s messages and files`}
            aria-label={`Search ${person.first}'s messages and files`}
          />
          {filters.query && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onFilters({ ...filters, query: "" })}>
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        <FilterPopover filters={filters} onFilters={onFilters} where={where} count={filterCount} />
      </div>
      {filterCount > 0 && <FilterChips filters={filters} onFilters={onFilters} onClear={clear} />}

      <Tabs value={tab} onValueChange={(value) => onTab(value as Tab)} className="profile-tabs">
        <TabsList variant="line">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="activity">
            Activity <span className="tab-count">{activity.length}</span>
          </TabsTrigger>
          <TabsTrigger value="shared">
            Shared <span className="tab-count">{files.length}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="profile-body" ref={bodyRef} onScroll={(e) => profileScroll.set(scrollKey, e.currentTarget.scrollTop)}>
        {tab === "info" && <InfoTab person={person} pinned={pinned} onJump={onJump} onOpenProfile={onOpenProfile} />}
        {tab === "activity" && (
          <ActivityTab person={person} items={activity} filters={filters} narrowed={narrowed} selected={selected} onJump={onJump} onClear={clear} />
        )}
        {tab === "shared" && <SharedTab person={person} items={files} query={filters.query} narrowed={narrowed} selected={selected} onJump={onJump} onClear={clear} />}
      </div>

      <footer className="pane-foot">
        <Button variant="outline" size="sm" disabled={!dm} onClick={() => dm && onMessage(dm.id)}>
          <MessageCircle size={16} aria-hidden /> Message
        </Button>
        <Button variant="outline" size="sm">
          <Headphones size={16} aria-hidden /> Huddle <ChevronDown size={14} aria-hidden />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="More" />}>
            <EllipsisVertical size={16} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="more-menu">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => copy(`@${person.first}`, "Display name copied")}>
                Copy display name: @{person.first}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTab("shared")}>View files</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => copy(`U07${person.id.toUpperCase()}42`, "Member ID copied")}>Copy member ID</DropdownMenuItem>
              <DropdownMenuItem onClick={() => copy(`https://harbor.slack.com/team/${person.id}`, "Link copied")}>
                Copy link to profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Hide {person.first}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </aside>
  );
}

function FilterPopover({
  filters,
  onFilters,
  where,
  count,
}: {
  filters: Filters;
  onFilters: (f: Filters) => void;
  where: ChannelId[];
  count: number;
}) {
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={<Button variant="outline" size="icon" className="filter-trigger" aria-label={count ? `Filters, ${count} on` : "Filters"} />}
            />
          }
        >
          <SlidersHorizontal size={16} aria-hidden />
          {count > 0 && <span className="filter-count">{count}</span>}
        </TooltipTrigger>
        <TooltipContent>Filters</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="filter-pop">
        <label className="filter-switch">
          <span className="filter-switch-text">
            <span className="filter-switch-title">Involving you</span>
            <span className="filter-hint">Mentions, DMs and threads you're in</span>
          </span>
          <Switch checked={filters.involving} onCheckedChange={(involving) => onFilters({ ...filters, involving })} />
        </label>
        <div className="filter-group" role="group" aria-labelledby="filter-type">
          <div className="filter-heading" id="filter-type">Type</div>
          {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
            <label key={t} className="filter-option">
              <Checkbox checked={filters.types.includes(t)} onCheckedChange={() => onFilters({ ...filters, types: toggle(filters.types, t) })} />
              {TYPE_LABELS[t]}
            </label>
          ))}
        </div>
        <div className="filter-group" role="group" aria-labelledby="filter-where">
          <div className="filter-heading" id="filter-where">Where</div>
          {where.map((id) => {
            const c = channelById(id);
            return (
              <label key={id} className="filter-option">
                <Checkbox checked={filters.where.includes(id)} onCheckedChange={() => onFilters({ ...filters, where: toggle(filters.where, id) })} />
                <ChannelLabel id={id} />
                {!c.member && !c.dm && <span className="filter-hint">Not a member</span>}
              </label>
            );
          })}
        </div>
        <div className="filter-group" role="group" aria-labelledby="filter-date">
          <div className="filter-heading" id="filter-date">Date</div>
          <RadioGroup className="filter-options" value={filters.date} onValueChange={(date) => onFilters({ ...filters, date: date as DateFilter })}>
            {DATE_ORDER.map((d) => (
              <label key={d} className="filter-option">
                <RadioGroupItem value={d} />
                {DATE_LABELS[d]}
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="filter-foot">
          <Button variant="ghost" size="sm" disabled={count === 0} onClick={() => onFilters({ ...NO_FILTERS, query: filters.query })}>
            Clear filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FilterChips({ filters, onFilters, onClear }: { filters: Filters; onFilters: (f: Filters) => void; onClear: () => void }) {
  const chips: { key: string; label: ReactNode; remove: () => void }[] = [];
  if (filters.involving) chips.push({ key: "inv", label: "Involving you", remove: () => onFilters({ ...filters, involving: false }) });
  filters.types.forEach((t) =>
    chips.push({ key: t, label: TYPE_LABELS[t], remove: () => onFilters({ ...filters, types: filters.types.filter((x) => x !== t) }) }),
  );
  filters.where.forEach((id) =>
    chips.push({ key: id, label: <ChannelLabel id={id} />, remove: () => onFilters({ ...filters, where: filters.where.filter((x) => x !== id) }) }),
  );
  if (filters.date !== "any") chips.push({ key: "date", label: DATE_LABELS[filters.date], remove: () => onFilters({ ...filters, date: "any" }) });
  return (
    <div className="chips">
      {chips.map((chip) => (
        <span key={chip.key} className="chip">
          {chip.label}
          <button type="button" aria-label="Remove filter" onClick={chip.remove}>
            <X size={12} aria-hidden />
          </button>
        </span>
      ))}
      <button type="button" className="chips-clear" onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}

function ChannelLabel({ id }: { id: ChannelId }) {
  const c = channelById(id);
  if (c.dm) return <span className="channel-label">Direct message</span>;
  const Icon = c.private ? Lock : Hash;
  return (
    <span className="channel-label">
      <Icon size={12} aria-hidden />
      {c.name}
    </span>
  );
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="p-section">
      <div className="p-section-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function AiCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ai-card">
      <div className="ai-head">
        <h3>{title}</h3>
        <span className="ai-label">
          <Sparkles size={12} aria-hidden /> AI summary
        </span>
      </div>
      {children}
    </section>
  );
}

function InfoTab({
  person,
  pinned,
  onJump,
  onOpenProfile,
}: {
  person: Person;
  pinned: Person["pinned"];
  onJump: (id: string) => void;
  onOpenProfile: (id: PersonId) => void;
}) {
  const manager = person.manager ? PEOPLE[person.manager] : null;
  return (
    <>
      <Section title="Contact information">
        <dl className="contact">
          <div>
            <dt>
              <Mail size={16} aria-hidden /> Email
            </dt>
            <dd>
              <a href={`mailto:${person.email}`}>{person.email}</a>
              <span className="copy-hint" aria-hidden>
                <Copy size={12} />
              </span>
            </dd>
          </div>
          <div>
            <dt>
              <Users size={16} aria-hidden /> Team
            </dt>
            <dd>{person.team}</dd>
          </div>
          {manager && (
            <div>
              <dt>
                <Users size={16} aria-hidden /> Manager
              </dt>
              <dd>
                <button type="button" className="link-button" onClick={() => onOpenProfile(manager.id)}>
                  {manager.name}
                </button>
              </dd>
            </div>
          )}
          <div>
            <dt>
              <Clock size={16} aria-hidden /> Local time
            </dt>
            <dd>{person.localTime}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Pinned">
        {pinned.length ? (
          <ul className="rows">
            {pinned.map((pin) => (
              <li key={pin.title}>
                <button type="button" className="row" onClick={() => onJump(pin.target)}>
                  <FileIcon kind={pin.kind} />
                  <span className="row-main">
                    <span className="row-title">{pin.title}</span>
                    <span className="row-meta">{pin.meta}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{person.first} hasn't pinned anything yet.</p>
        )}
      </Section>

      {person.askAbout.length > 0 && (
        <AiCard title={`Ask ${person.first} about`}>
          <ul className="ask-list">
            {person.askAbout.map((a) => (
              <li key={a.topic}>
                <span className="ask-topic">{a.topic}</span>
                <span className="ask-detail">{a.detail}</span>
              </li>
            ))}
          </ul>
        </AiCard>
      )}
    </>
  );
}

function ActivityTab({
  person,
  items,
  filters,
  narrowed,
  selected,
  onJump,
  onClear,
}: {
  person: Person;
  items: Activity[];
  filters: Filters;
  narrowed: boolean;
  selected?: string;
  onJump: (id: string) => void;
  onClear: () => void;
}) {
  const involving = items.filter((msg) => msg.reason);
  const rest = filters.involving ? [] : items.filter((msg) => !msg.reason);
  return (
    <>
      {!narrowed && (
        <AiCard title="Working on">
          <p className="ai-text">{person.workingOn}</p>
        </AiCard>
      )}
      {items.length === 0 ? (
        <NoResults query={filters.query} what="messages" narrowed={narrowed} first={person.first} onClear={onClear} />
      ) : (
        <>
          {narrowed && (
            <p className="results-count">
              {items.length} {items.length === 1 ? "result" : "results"}
            </p>
          )}
          {involving.length > 0 && (
            <Section title="Involving you" aside={<span className="count">{involving.length}</span>}>
              <ul className="results">
                {involving.map((msg) => (
                  <ActivityRow key={msg.id} msg={msg} query={filters.query} selected={selected === msg.id} onJump={onJump} />
                ))}
              </ul>
            </Section>
          )}
          {rest.length > 0 && (
            <Section title={involving.length ? "All other activity" : "All activity"} aside={<span className="count">{rest.length}</span>}>
              <ul className="results">
                {rest.map((msg) => (
                  <ActivityRow key={msg.id} msg={msg} query={filters.query} selected={selected === msg.id} onJump={onJump} />
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </>
  );
}

function shortTime(msg: Message) {
  return msg.ago === 0 ? msg.time : dayLabel(msg.ago);
}

// One search result, shaped like Slack's own search results: avatar, author, where, time, text.
function ActivityRow({ msg, query, selected, onJump }: { msg: Activity; query: string; selected: boolean; onJump: (id: string) => void }) {
  const author = PEOPLE[msg.author];
  const replies = msg.replies ?? [];
  return (
    <li>
      <button type="button" className="result" aria-current={selected || undefined} onClick={() => onJump(msg.id)}>
        <PersonAvatar person={author} size={36} />
        <span className="result-main">
          <span className="result-head">
            <span className="result-author">{author.name}</span>
            <span className="result-time" title={`${dayLabel(msg.ago)} at ${msg.time}`}>
              {shortTime(msg)}
            </span>
          </span>
          <span className="result-meta">
            <span className="result-where">
              {msg.parentId && "Thread in "}
              <ChannelLabel id={msg.channel} />
            </span>
            {msg.reason && <span className="tag tag-you">{msg.reason}</span>}
          </span>
          <span className="result-text">
            <RichText text={msg.text} query={query} />
          </span>
          {msg.files?.map((f) => (
            <span key={f.id} className="row-file">
              <FileIcon kind={f.kind} /> {f.name}
            </span>
          ))}
          {(msg.reactions || replies.length > 0) && (
            <span className="result-foot">
              {msg.reactions?.map((r) => (
                <span key={r.emoji} className="reaction">
                  <span aria-hidden>{r.emoji}</span> {r.count}
                </span>
              ))}
              {replies.length > 0 && (
                <span className="result-replies">
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </span>
              )}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

function SharedTab({
  person,
  items,
  query,
  narrowed,
  selected,
  onJump,
  onClear,
}: {
  person: Person;
  items: { file: SharedFile; msg: Activity }[];
  query: string;
  narrowed: boolean;
  selected?: string;
  onJump: (id: string) => void;
  onClear: () => void;
}) {
  if (!items.length) return <NoResults query={query} what="files" narrowed={narrowed} first={person.first} onClear={onClear} />;
  return (
    <Section title={narrowed ? `${items.length} ${items.length === 1 ? "result" : "results"}` : "Files"} aside={narrowed ? undefined : <span className="count">{items.length}</span>}>
      <ul className="results">
        {items.map(({ file, msg }) => (
          <li key={file.id}>
            <button type="button" className="result" aria-current={selected === msg.id || undefined} onClick={() => onJump(msg.id)}>
              <FileIcon kind={file.kind} />
              <span className="result-main">
                <span className="result-head">
                  <span className="result-author">
                    <Highlighted text={file.name} query={query} />
                  </span>
                  <span className="result-time" title={`${dayLabel(msg.ago)} at ${msg.time}`}>
                    {shortTime(msg)}
                  </span>
                </span>
                <span className="result-meta">
                  <span className="result-where">
                    {file.kind} · {file.size} · <ChannelLabel id={msg.channel} />
                  </span>
                  {msg.reason && <span className="tag tag-you">{msg.reason}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function NoResults({
  query,
  what,
  narrowed,
  first,
  onClear,
}: {
  query: string;
  what: "messages" | "files";
  narrowed: boolean;
  first: string;
  onClear: () => void;
}) {
  if (!narrowed) {
    return (
      <div className="empty">
        <p className="empty-title">No {what} yet</p>
        <p className="muted">
          {what === "files" ? `Files ${first} shares in channels you can see will show up here.` : `${first}'s messages in channels you can see will show up here.`}
        </p>
      </div>
    );
  }
  return (
    <div className="empty">
      <p className="empty-title">{query.trim() ? `No ${what} match “${query.trim()}”` : `No ${what} match these filters`}</p>
      <p className="muted">Try a different word, or clear the filters to see everything.</p>
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
