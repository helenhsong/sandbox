import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@helenhsong/ui";
import { ArrowLeft, ChevronDown, Download, FileUp, Play, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { DeckPlayer } from "../../../src/deck/DeckPlayer";
import { SlideView } from "../../../src/deck/SlideView";
import { visibleSlides, type Deck, type Slide, type WebSlide } from "../../../src/deck/types";
import { AddSlide, type AddPreset, type FigmaImport } from "./AddSlide";
import { readDeckFile } from "./deckFile";
import { Inspector } from "./Inspector";
import { PublishDialog } from "./PublishDialog";
import { ReloadDialog, StartOverDialog } from "./SourceDialogs";
import { SlideList } from "./SlideList";
import { SlideMenu, type SlideActions } from "./SlideMenu";
import {
  emptyDraft,
  figmaSlideLink,
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

  // Forget slide images nothing refers to any more (after a reload from Figma or starting over).
  const keys = useMemo(() => imageKeys(draft.slides), [draft.slides]);
  useEffect(() => {
    const timer = setTimeout(() => void pruneImages(keys), 1000);
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
  setDraft: (draft: Draft) => void;
  /** Swaps in a different deck (a new empty one, or one read from a file). */
  replaceDraft: (draft: Draft) => void;
  token: string;
  setToken: (token: string) => void;
}

function Editor({ draft, setDraft, replaceDraft, token, setToken }: EditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(draft.slides[0]?.id ?? null);
  const [presentFrom, setPresentFrom] = useState<number | null>(null);
  const [dialog, setDialog] = useState<"publish" | "reload" | "start-over" | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addPreset, setAddPreset] = useState<AddPreset>({ kind: "live", placement: "after" });
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  /** Slides with their images ready to display; `draft.slides` keeps the stored references. */
  const slides = useImageUrls(draft.slides);

  const update = (change: Partial<Draft>) => setDraft({ ...draft, ...change });
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

  /** Opens Add slide from its button: Figma first while the deck has no Figma file, otherwise a live page. */
  const openAdd = () => {
    setAddPreset({ kind: draft.fileKey ? "live" : "figma", placement: "after", slideId: selected?.id });
    setAddOpen(true);
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
    update({ figmaUrl, fileKey, slides: next, ...named });
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
              placeholder="Untitled deck"
              aria-label="Deck name"
            />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Deck options" className="builder-title-menu" />}>
                <ChevronDown size={20} strokeWidth={2} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="deck-menu">
                {draft.fileKey ? (
                  <DropdownMenuItem onClick={() => setDialog("reload")}>
                    <RefreshCw size={16} strokeWidth={2} aria-hidden />
                    Reload from Figma
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={() => fileInput.current?.click()}>
                  <FileUp size={16} strokeWidth={2} aria-hidden />
                  Import deck file
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportDeck()} disabled={!draft.slides.length}>
                  <Download size={16} strokeWidth={2} aria-hidden />
                  Export deck file
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
            <>
              <div className="builder-preview">
                <SlideMenu
                  slide={selected}
                  actions={actions}
                  render={<div />}
                  className="builder-preview-frame"
                  data-hidden={(selected.kind === "figma" && selected.hidden) || undefined}
                >
                  <SlideView slide={selected} />
                </SlideMenu>
              </div>
              <Inspector key={selected.id} draft={draft} index={selectedIndex} onChange={(next) => update({ slides: next })} />
            </>
          ) : (
            <div className="builder-preview">
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
        <DeckPlayer name={draft.name || "Untitled deck"} slides={slides} startIndex={presentFrom} onClose={() => setPresentFrom(null)} />
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
      <ReloadDialog
        open={dialog === "reload"}
        onOpenChange={(open) => setDialog(open ? "reload" : null)}
        draft={draft}
        token={token}
        setToken={setToken}
        onReloaded={(next) => {
          setDraft(next);
          if (!next.slides.some((slide) => slide.id === selectedId)) setSelectedId(next.slides[0]?.id ?? null);
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

/** The list reorders display slides; apply the same order to the stored ones. */
function reorderStored(stored: Slide[], displayed: Slide[]) {
  const byId = new Map(stored.map((slide) => [slide.id, slide]));
  return displayed.map((slide) => byId.get(slide.id) ?? slide);
}
