import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@helenhsong/ui";
import { ArrowLeft, ChevronDown, Download, FileUp, Play, Plus, Trash2, Upload } from "lucide-react";
import { DeckPlayer } from "../../../src/deck/DeckPlayer";
import { SlideView } from "../../../src/deck/SlideView";
import { isPersistent, visibleSlides, withFigmaEmbeds, type Deck, type Slide, type WebSlide } from "../../../src/deck/types";
import { AddSlide, type AddPreset, type FigmaImport } from "./AddSlide";
import { readDeckFile } from "./deckFile";
import { figmaFileName, listSlides, loadFigmaSlides } from "./figma";
import { FigmaLogo, FigmaSource, RemoveFigmaDialog } from "./FigmaSource";
import { Inspector } from "./Inspector";
import { PublishDialog } from "./PublishDialog";
import { StartOverDialog } from "./SourceDialogs";
import { SlideList } from "./SlideList";
import { SlideMenu, type SlideActions } from "./SlideMenu";
import {
  DRAFT_KEY,
  emptyDraft,
  figmaSlideLink,
  isFigmaLive,
  loadDraft,
  loadToken,
  mergeFigmaSlides,
  moveItem,
  newWebSlide,
  saveDraft,
  saveToken,
  slugify,
  type Draft,
} from "./draft";
import { IMAGE_PREFIX, blobToDataUrl, getImages, imageKeys, pruneImages } from "./imageStore";

export function App() {
  // Opens straight to the editor: a saved draft, or a new empty deck.
  const [draft, setDraft] = useState<Draft>(loadDraft);
  /** Bumped when the deck is swapped out (deleted or imported), so the editor starts fresh. */
  const [generation, setGeneration] = useState(0);
  const [token, setTokenState] = useState(loadToken);

  useEffect(() => saveDraft(draft), [draft]);

  // With Create deck open in more than one tab, each follows the latest saved deck, so an older
  // tab never writes back stale slides or clears images a newer one just brought in.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRAFT_KEY || !event.newValue) return;
      try {
        setDraft(JSON.parse(event.newValue) as Draft);
      } catch {
        // Not a draft we can read; keep ours.
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Forget slide images nothing refers to any more (after importing Figma again or starting over),
  // keeping any the latest saved deck still uses.
  const keys = useMemo(() => imageKeys(draft.slides), [draft.slides]);
  useEffect(() => {
    const timer = setTimeout(() => void pruneImages([...keys, ...imageKeys(loadDraft().slides)]), 1000);
    return () => clearTimeout(timer);
  }, [keys]);

  const setToken = (value: string) => {
    setTokenState(value);
    saveToken(value);
  };

  const replaceDraft = (next: Draft) => {
    setDraft(next);
    setGeneration((value) => value + 1);
  };

  return (
    <Editor key={generation} draft={draft} setDraft={setDraft} replaceDraft={replaceDraft} token={token} setToken={setToken} />
  );
}

/** Object URLs for the stored slide images, loaded as slides refer to them. */
function useImageUrls(slides: Slide[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const keys = useMemo(() => imageKeys(slides), [slides]);

  useEffect(() => {
    const missing = keys.filter((key) => !(key in urls));
    if (missing.length === 0) return;
    let cancelled = false;
    void getImages(missing).then((found) => {
      if (cancelled) return;
      const added: Record<string, string> = {};
      // Keys that can't be found map to "" so the slide shows "No preview" instead of loading forever.
      for (const key of missing) added[key] = found.has(key) ? URL.createObjectURL(found.get(key)!) : "";
      setUrls((current) => ({ ...current, ...added }));
    });
    return () => {
      cancelled = true;
    };
  }, [keys, urls]);

  return useMemo(
    () =>
      slides.map((slide) =>
        slide.kind === "figma" && slide.image.startsWith(IMAGE_PREFIX)
          ? // Until it's read, the slide keeps its "idb:" reference, which shows as loading.
            { ...slide, image: urls[slide.image.slice(IMAGE_PREFIX.length)] ?? slide.image }
          : slide,
      ),
    [slides, urls],
  );
}

interface EditorProps {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  /** Swaps in a different deck (a new empty one, or one read from a file). */
  replaceDraft: (draft: Draft) => void;
  token: string;
  setToken: (token: string) => void;
}

function Editor({ draft, setDraft, replaceDraft, token, setToken }: EditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(draft.slides[0]?.id ?? null);
  // Presenting has its own address, /deck-builder/?present=3: refreshing or sharing it reopens
  // the presentation on that slide, and Back closes it.
  const [presentFrom, setPresentFrom] = useState<number | null>(() => (draft.slides.length ? readPresentParam() : null));
  useEffect(() => {
    const onPop = () => setPresentFrom(readPresentParam());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const [dialog, setDialog] = useState<"publish" | "start-over" | "remove-figma" | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddPreset>({ kind: "live", placement: "after" });
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  /** Slides with their images ready to display; `draft.slides` keeps the stored references. */
  const withImages = useImageUrls(draft.slides);
  const figmaLive = isFigmaLive(draft);
  // Live Figma slides carry Figma's embed, shown over their image in the preview and when presenting.
  const slides = useMemo(
    () => (figmaLive && draft.fileKey ? withFigmaEmbeds(withImages, { figmaUrl: draft.figmaUrl, fileKey: draft.fileKey }) : withImages),
    [figmaLive, withImages, draft.figmaUrl, draft.fileKey],
  );

  const update = (change: Partial<Draft>) => setDraft({ ...draft, ...change });
  const figmaCount = draft.fileKey ? draft.slides.filter((slide) => slide.kind === "figma").length : 0;

  // Keeps the deck in step with its Figma file without a button: whenever the editor opens or
  // you come back to it, check Figma's slide list (at most once a minute) and, only if slides
  // were added, removed or reordered, bring them in. Live pages keep their places.
  const latest = useRef({ draft, token });
  useEffect(() => {
    latest.current = { draft, token };
  });
  useEffect(() => {
    let running = false;
    let lastCheck = 0;
    const check = async () => {
      const { draft: current, token: key } = latest.current;
      const figmaIds = current.slides.flatMap((slide) => (slide.kind === "figma" ? [slide.nodeId] : []));
      // Decks imported before the Figma file's name was kept pick it up here.
      if (current.fileKey && key.trim() && !current.figmaName) {
        figmaFileName(current.fileKey, key.trim())
          .then((name) => setDraft((now) => (now.fileKey === current.fileKey ? { ...now, figmaName: name } : now)))
          .catch(() => undefined);
      }
      if (running || Date.now() - lastCheck < 60_000 || !current.fileKey || !key.trim() || !figmaIds.length) return;
      running = true;
      lastCheck = Date.now();
      try {
        const nodes = await listSlides(current.fileKey, key.trim());
        const unchanged = nodes.length === figmaIds.length && nodes.every((node, i) => node.nodeId === figmaIds[i]);
        // Also bring them in again if any slide's saved image has gone missing (its thumbnail says "No preview").
        const wanted = imageKeys(current.slides);
        const imagesMissing = (await getImages(wanted)).size < wanted.length;
        if (!nodes.length || (unchanged && !imagesMissing)) return;
        const { slides: incoming } = await loadFigmaSlides(current.fileKey, key.trim());
        setDraft((now) => (now.fileKey === current.fileKey ? { ...now, slides: mergeFigmaSlides(now.slides, incoming) } : now));
      } catch {
        // Offline, or the token stopped working: try again next time.
      } finally {
        running = false;
      }
    };
    void check();
    const onReturn = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [setDraft]);
  // Falls back to the first slide; undefined only while the deck has no slides.
  const selectedIndex = Math.max(
    draft.slides.findIndex((slide) => slide.id === selectedId),
    0,
  );
  const selected = slides[selectedIndex] as Slide | undefined;
  const shown = visibleSlides(slides);

  /** The live page copied with ⌘C or Copy, pasted after the selected slide. */
  const [copied, setCopied] = useState<WebSlide | null>(null);

  /** Inserts a fresh copy of a live page after the slide with this id, and selects it. */
  const insertCopyAfter = (source: WebSlide, afterId: string) => {
    const at = draft.slides.findIndex((slide) => slide.id === afterId) + 1;
    const slide = newWebSlide(source.url, source.title);
    const next = [...draft.slides];
    next.splice(at, 0, slide);
    update({ slides: next });
    setSelectedId(slide.id);
  };
  const findWeb = (id: string) => draft.slides.find((slide): slide is WebSlide => slide.id === id && slide.kind === "web");
  const duplicate = (id: string) => {
    const source = findWeb(id);
    if (source) insertCopyAfter(source, id);
  };
  const copy = (id: string) => setCopied(findWeb(id) ?? null);
  const paste = (afterId: string) => {
    if (copied) insertCopyAfter(copied, afterId);
  };

  const indexOf = (id: string) => draft.slides.findIndex((slide) => slide.id === id);
  const actions: SlideActions = {
    count: draft.slides.length,
    indexOf,
    move: (id, delta) => {
      const from = indexOf(id);
      update({ slides: moveItem(draft.slides, from, from + delta) });
    },
    remove: (id) => {
      const at = indexOf(id);
      const neighbour = draft.slides[at + 1] ?? draft.slides[at - 1];
      update({ slides: draft.slides.filter((slide) => slide.id !== id) });
      if (neighbour) setSelectedId(neighbour.id);
    },
    duplicate,
    copy,
    paste: copied ? paste : undefined,
    toggleHidden: (id) =>
      update({ slides: draft.slides.map((slide) => (slide.id === id && slide.kind === "figma" ? { ...slide, hidden: !slide.hidden } : slide)) }),
    figmaLink: (slide) => figmaSlideLink(draft, slide),
  };

  // ⌘D / ⌘C / ⌘V on the selected slide, unless typing in a field or a dialog or the player is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (presentFrom !== null || dialog !== null || addOpen) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable], [role='dialog'], [role='menu']")) return;
      if (!selected) return;
      const key = event.key.toLowerCase();
      if (key === "d" && selected.kind === "web") {
        event.preventDefault();
        duplicate(selected.id);
      } else if (key === "c" && selected.kind === "web" && !window.getSelection()?.toString()) {
        event.preventDefault();
        copy(selected.id);
      } else if (key === "v" && copied) {
        event.preventDefault();
        paste(selected.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const addWebPage = (at: number, url: string, title: string) => {
    const slide = newWebSlide(url, title);
    const next = [...draft.slides];
    next.splice(at, 0, slide);
    update({ slides: next });
    setSelectedId(slide.id);
    setAddOpen(false);
  };

  /** Opens Add slide on Live page, set to a spot in the list: the start, after a slide, or the end. */
  const openAddAt = (at: number) => {
    if (at === 0) setAddPreset({ kind: "live", placement: "start" });
    else if (at >= slides.length) setAddPreset({ kind: "live", placement: "end" });
    else setAddPreset({ kind: "live", placement: "after", slideId: slides[at - 1].id });
    setAddOpen(true);
  };

  /** Opens Add slide from its button, always on its first tab (Live page). Figma Slides opens only when asked for. */
  const openAdd = () => {
    setAddPreset({ kind: "live", placement: "after", slideId: selected?.id });
    setAddOpen(true);
  };

  /** Opens Add slide on Figma slides, with any current link selected, ready to paste another over it. */
  const openFigmaImport = () => {
    setAddPreset({ kind: "figma", placement: "after", slideId: selected?.id, replace: Boolean(draft.figmaUrl) });
    // After this click (or menu) is done, or the dropdown would take it as a click outside and close.
    setTimeout(() => setAddOpen(true), 0);
  };

  /**
   * Brings in a Figma file's slides. The same file again updates them, keeping live pages after
   * the slides they followed; a different file replaces the Figma slides, keeping live pages.
   */
  const importFigma = ({ figmaUrl, fileKey, name, slides: incoming }: FigmaImport) => {
    const sameFile = fileKey === draft.fileKey;
    const kept = sameFile ? draft.slides : draft.slides.filter((slide) => slide.kind === "web");
    const next = mergeFigmaSlides(kept, incoming);
    const named = draft.name.trim() ? {} : { name, slug: draft.slugEdited ? draft.slug : slugify(name) };
    update({ figmaUrl, fileKey, figmaName: name, slides: next, ...named });
    if (!selected || !next.some((slide) => slide.id === selected.id)) setSelectedId(next[0]?.id ?? null);
    setAddOpen(false);
  };

  const importFile = async (file: File) => {
    try {
      const next = await readDeckFile(file);
      setImportError(null);
      replaceDraft(next);
    } catch {
      setImportError("That isn't a deck file. Choose a .deck.json file exported from this tool.");
    }
  };

  const rename = (name: string) => update({ name, slug: draft.slugEdited ? draft.slug : slugify(name) });

  const present = () => {
    const at = shown.findIndex((slide) => slide.id === selected?.id);
    setPresentFrom(Math.max(at, 0));
    history.pushState({ deckPresent: true }, "", presentUrl(Math.max(at, 0)));
  };

  /** Saves the deck as a file, images included, so it can be imported in another browser. */
  const exportDeck = async () => {
    const found = await getImages(imageKeys(draft.slides));
    const exported: Slide[] = [];
    for (const slide of draft.slides) {
      const blob = slide.kind === "figma" && slide.image.startsWith(IMAGE_PREFIX) ? found.get(slide.image.slice(IMAGE_PREFIX.length)) : undefined;
      exported.push(blob && slide.kind === "figma" ? { ...slide, image: await blobToDataUrl(blob) } : slide);
    }
    const deck: Deck = {
      version: 1,
      name: draft.name,
      slug: draft.slug,
      createdAt: new Date().toISOString().slice(0, 10),
      source: draft.fileKey ? { figmaUrl: draft.figmaUrl, fileKey: draft.fileKey } : null,
      figmaLive,
      slides: exported,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(deck)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${draft.slug || "deck"}.deck.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="builder">
      <header className="builder-header">
        <a
          className={buttonVariants({ variant: "ghost", size: "icon", className: "builder-back" })}
          href={import.meta.env.BASE_URL}
          aria-label="Back to Sandbox"
          title="Back to Sandbox"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </a>
        <div className="builder-title">
          <div className="builder-title-row">
            <input
              className="builder-name"
              value={draft.name}
              onChange={(event) => rename(event.target.value)}
              // Enter (or Escape) finishes editing the name.
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
              }}
              placeholder="Untitled deck"
              aria-label="Deck name"
            />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Deck options" className="builder-title-menu" />}>
                <ChevronDown size={20} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="deck-menu">
                <DropdownMenuItem onClick={openFigmaImport}>
                  <span className="deck-menu-icon">
                    <FigmaLogo />
                  </span>
                  Import Figma Slides
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInput.current?.click()}>
                  <FileUp size={16} strokeWidth={2} aria-hidden />
                  Import deck file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportDeck()} disabled={!draft.slides.length}>
                  <Download size={16} strokeWidth={2} aria-hidden />
                  Download deck file
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setDialog("start-over")}>
                  <Trash2 size={16} strokeWidth={2} aria-hidden />
                  Delete deck
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importFile(file);
                event.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="builder-header-actions">
          <Button variant="outline" onClick={present} disabled={!shown.length}>
            <Play size={16} strokeWidth={2} aria-hidden />
            Present
          </Button>
          <Button onClick={() => setDialog("publish")} disabled={!shown.length}>
            <Upload size={16} strokeWidth={2} aria-hidden />
            Publish
          </Button>
        </div>
      </header>

      <div className="builder-body">
        <aside className="builder-sidebar" aria-label="Slides">
          <div className="sidebar-add">
            <AddSlide
              open={addOpen}
              onOpenChange={(open) => (open ? openAdd() : setAddOpen(false))}
              preset={addPreset}
              slides={slides}
              selectedId={selected?.id ?? null}
              figmaUrl={draft.figmaUrl}
              token={token}
              setToken={setToken}
              onAddLive={addWebPage}
              onImportFigma={importFigma}
            />
            {figmaCount ? (
              <FigmaSource
                name={draft.figmaName ?? ""}
                onReplace={openFigmaImport}
                onRemove={() => setDialog("remove-figma")}
              />
            ) : null}
          </div>
          <div className="sidebar-scroll">
            <SlideList
              slides={slides}
              selectedId={selected?.id ?? ""}
              onSelect={setSelectedId}
              onInsert={openAddAt}
              onChange={(next) => update({ slides: reorderStored(draft.slides, next) })}
              actions={actions}
            />
          </div>
        </aside>

        <main className="builder-main">
          {importError ? (
            <p className="builder-import-error" role="alert">
              {importError}
            </p>
          ) : null}
          {selected ? (
            <div className="builder-stage">
              <div className="builder-preview">
                <SlideMenu
                  slide={selected}
                  actions={actions}
                  render={<div />}
                  className="builder-preview-frame"
                  data-hidden={(selected.kind === "figma" && selected.hidden) || undefined}
                >
                  {/* Live pages and Figma slides load once and stay loaded, so switching back is instant. */}
                  {slides.map((slide) => {
                    const active = slide.id === selected.id;
                    if (!active && !isPersistent(slide)) return null;
                    return (
                      <div key={slide.id} className="builder-preview-layer" data-active={active || undefined} aria-hidden={!active} inert={!active}>
                        <SlideView slide={slide} />
                      </div>
                    );
                  })}
                </SlideMenu>
              </div>
              <Inspector key={selected.id} draft={draft} index={selectedIndex} onChange={(next) => update({ slides: next })} />
            </div>
          ) : (
            <div className="builder-stage builder-preview">
              <div className="builder-empty">
                <h2>Add your first slide</h2>
                <p>Import slides from Figma, or add a live web page people can use during the presentation.</p>
                <Button onClick={openAdd}>
                  <Plus size={16} strokeWidth={2} aria-hidden />
                  Add slide
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {presentFrom !== null ? (
        <DeckPlayer
          name={draft.name || "Untitled deck"}
          slides={slides}
          startIndex={presentFrom}
          onSlideChange={(at) => history.replaceState(history.state, "", presentUrl(at))}
          onClose={() => {
            // Opened with Present: step back to the editor's address. Opened from a link: drop the parameter.
            if ((history.state as { deckPresent?: boolean } | null)?.deckPresent) history.back();
            else history.replaceState(null, "", presentUrl(null));
            setPresentFrom(null);
          }}
        />
      ) : null}

      <PublishDialog
        open={dialog === "publish"}
        onOpenChange={(open) => setDialog(open ? "publish" : null)}
        draft={draft}
        slides={slides}
        onChange={update}
        onSelect={(id) => {
          setSelectedId(id);
          setDialog(null);
        }}
        onExport={() => void exportDeck()}
      />
      <RemoveFigmaDialog
        open={dialog === "remove-figma"}
        onOpenChange={(open) => setDialog(open ? "remove-figma" : null)}
        name={draft.figmaName ?? ""}
        count={figmaCount}
        onConfirm={() => {
          // Live pages stay; the deck no longer points at a Figma file.
          const next = draft.slides.filter((slide) => slide.kind !== "figma");
          update({ slides: next, figmaUrl: "", fileKey: "", figmaName: undefined });
          if (!next.some((slide) => slide.id === selectedId)) setSelectedId(next[0]?.id ?? null);
          setDialog(null);
        }}
      />
      <StartOverDialog
        open={dialog === "start-over"}
        onOpenChange={(open) => setDialog(open ? "start-over" : null)}
        onConfirm={() => replaceDraft(emptyDraft())}
      />
    </div>
  );
}

/** The slide (0-based) in the address's ?present= parameter, or null when not presenting. */
function readPresentParam() {
  const value = Number.parseInt(new URLSearchParams(window.location.search).get("present") ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value - 1 : null;
}

/** This page's address with ?present= set to a slide (shown 1-based), or removed for null. */
function presentUrl(at: number | null) {
  const url = new URL(window.location.href);
  if (at === null) url.searchParams.delete("present");
  else url.searchParams.set("present", String(at + 1));
  return `${url.pathname}${url.search}${url.hash}`;
}

/** The list reorders display slides; apply the same order to the stored ones. */
function reorderStored(stored: Slide[], displayed: Slide[]) {
  const byId = new Map(stored.map((slide) => [slide.id, slide]));
  return displayed.map((slide) => byId.get(slide.id) ?? slide);
}
