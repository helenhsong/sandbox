import { useState } from "react";
import { FieldGroup, InputGroupAddon, InputGroupButton } from "@helenhsong/ui";
import { ExternalLink, Globe, Presentation } from "lucide-react";
import { resolveUrl, type Slide, type WebSlide } from "../../../src/deck/types";
import { LinkFields } from "./LinkFields";
import { isValidUrl, linkText, openLink, resolveLink, type Draft } from "./draft";

interface InspectorProps {
  draft: Draft;
  index: number;
  onChange: (slides: Slide[]) => void;
}

/** What the selected slide is, and its link for a live page. Actions live in the right-click menu. */
export function Inspector({ draft, index, onChange }: InspectorProps) {
  const slide = draft.slides[index];
  const replace = (next: Slide) => onChange(draft.slides.map((item, i) => (i === index ? next : item)));

  if (slide.kind === "figma") {
    return (
      <section className="inspector" aria-label="Slide details">
        <div className="inspector-heading">
          <h2 className="inspector-type">
            <Presentation size={16} strokeWidth={2} aria-hidden />
            Figma slide
          </h2>
        </div>
      </section>
    );
  }
  return <WebInspector slide={slide} onReplace={replace} />;
}

function WebInspector({ slide, onReplace }: { slide: WebSlide; onReplace: (slide: Slide) => void }) {
  const [link, setLink] = useState(() => linkText(slide.url));
  const [error, setError] = useState<string | null>(null);

  const commitLink = (value: string) => {
    const { url, projectName } = resolveLink(value);
    if (!url) return setError("Add a link, or remove this live page.");
    if (!isValidUrl(url)) return setError("Enter a full web address or a Sandbox project.");
    setError(null);
    setLink(linkText(url));
    // No title field: a Sandbox project is labeled by its name, anything else by its address.
    if (url !== slide.url) onReplace({ ...slide, url, title: projectName ?? "" });
  };

  return (
    <section className="inspector" aria-label="Slide details">
      <div className="inspector-heading">
        <h2 className="inspector-type" data-live>
          <Globe size={16} strokeWidth={2} aria-hidden />
          Live page
        </h2>
        <FieldGroup className="inspector-link">
          <LinkFields
            idPrefix="edit"
            link={link}
            error={error}
            onLinkChange={(value) => {
              setLink(value);
              setError(null);
            }}
            onLinkCommit={commitLink}
            showHint={false}
            hideLabel
            endAction={
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  variant="ghost"
                  nativeButton={false}
                  render={<a href={resolveUrl(slide.url)} target="_blank" rel="noreferrer" />}
                  onClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    openLink(resolveUrl(slide.url));
                  }}
                  aria-label="Open page in a new tab"
                  title="Open page in a new tab"
                >
                  <ExternalLink size={16} strokeWidth={2} aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            }
          />
        </FieldGroup>
      </div>
    </section>
  );
}
