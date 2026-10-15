import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@helenhsong/ui";
import { sandboxProjects, type SandboxProject } from "./draft";
import { useCloseOnFrameClick } from "./useCloseOnFrameClick";

interface LinkFieldsProps {
  idPrefix: string;
  /** What's in the link field: a web address, or a Sandbox project's name. */
  link: string;
  error: string | null;
  onLinkChange: (link: string) => void;
  /** Runs when a project is picked from the list, or the field is left or submitted. */
  onLinkCommit?: (link: string) => void;
  autoFocus?: boolean;
  /** The note about sites that block embedding; shown where a link is first added. */
  showHint?: boolean;
  /** Keeps the "Link" label for screen readers only, where the context already says what the field is. */
  hideLabel?: boolean;
  /** Shown inside the field at its end, like a button to open the page. */
  endAction?: ReactNode;
}

/**
 * One field for where a live page points: paste any web address, or type to find a
 * Sandbox project and pick it from the list.
 */
export function LinkFields({ idPrefix, link, error, onLinkChange, onLinkCommit, autoFocus, showHint = true, hideLabel = false, endAction }: LinkFieldsProps) {
  const [open, setOpen] = useState(false);
  /** Whether the person has typed since the list opened; until then it lists every project. */
  const [typed, setTyped] = useState(false);
  /** Set when a project is picked, so focus coming back to the field doesn't reopen the list. */
  const justPicked = useRef(false);

  const shown = useMemo(() => {
    const query = typed ? link.trim().toLowerCase() : "";
    return query ? sandboxProjects.filter((project) => project.name.toLowerCase().includes(query)) : sandboxProjects;
  }, [link, typed]);

  useCloseOnFrameClick(open, () => setOpen(false));

  const openList = () => {
    if (justPicked.current) return;
    setTyped(false);
    setOpen(true);
  };

  return (
    <>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={`${idPrefix}-link`} className={hideLabel ? "visually-hidden" : undefined}>
          Link
        </FieldLabel>
        <Combobox<SandboxProject>
          items={sandboxProjects}
          itemToStringLabel={(project) => project.name}
          // The chosen project follows the text, so typing over a project name un-chooses it
          // and the combobox never resets the field to an empty selection.
          value={sandboxProjects.find((project) => project.name === link) ?? null}
          inputValue={link}
          onInputValueChange={(value) => onLinkChange(value)}
          onValueChange={(project) => {
            if (!project) return;
            justPicked.current = true;
            setTimeout(() => (justPicked.current = false), 0);
            onLinkChange(project.name);
            onLinkCommit?.(project.name);
          }}
          // Clicking the field opens the list, showing every project until you type.
          open={open}
          onOpenChange={(next) => (next ? openList() : setOpen(false))}
          filteredItems={shown}
          openOnInputClick
        >
          <ComboboxInput
            id={`${idPrefix}-link`}
            placeholder="Paste a URL or search Sandbox projects"
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            autoFocus={autoFocus}
            showTrigger={false}
            onChange={() => setTyped(true)}
            onBlur={() => onLinkCommit?.(link)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && onLinkCommit) onLinkCommit(link);
            }}
          >
            {endAction}
          </ComboboxInput>
          <ComboboxContent className="link-options">
            <ComboboxEmpty>No Sandbox project matches. A web address works too.</ComboboxEmpty>
            <ComboboxList>
              {(project: SandboxProject) => (
                <ComboboxItem key={project.slug} value={project}>
                  <span className="link-option-name">{project.name}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {error ? (
          <FieldError>{error}</FieldError>
        ) : showHint ? (
          <FieldDescription>Some sites don't allow embedding and stay blank. Sandbox projects always work.</FieldDescription>
        ) : null}
      </Field>
    </>
  );
}
