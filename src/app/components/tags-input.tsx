"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TagBadge } from "@/app/components/tag-badge";
import { TagColorPicker } from "@/app/components/tag-color-picker";
import { TAG_COLORS } from "@/lib/tags/colors";
import type { TagColorKey } from "@/lib/tags/colors";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/lib/queries/tags";
import type { Tag } from "@/lib/queries/tags";
import { cn } from "@/lib/cn";

const MAX_TAGS = 5;

type TagsInputProps = {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
};

function highlightMatch(text: string, query: string): React.ReactElement {
  if (!query) return <>{text}</>;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <strong>{text.slice(index, index + query.length)}</strong>
      {text.slice(index + query.length)}
    </>
  );
}

export function TagsInput({ selectedTagIds, onChange }: TagsInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState<TagColorKey>("rose");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [editingName, setEditingName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allTags } = useTags();
  const { mutateAsync: createTag, isPending: isCreatingTag } = useCreateTag();
  const { mutateAsync: updateTag, isPending: isUpdatingTag } = useUpdateTag();
  const { mutate: deleteTag } = useDeleteTag();

  const tags = allTags ?? [];

  const selectedTags = selectedTagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t) => t !== undefined);

  const filteredTags = tags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const hasExactMatch = tags.some(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase(),
  );

  const showCreateOption = inputValue.trim().length > 0 && !hasExactMatch;

  const dropdownItems = [
    ...filteredTags.map((tag, index) => ({ type: "tag" as const, tag, index })),
    ...(showCreateOption
      ? [{ type: "create" as const, index: filteredTags.length }]
      : []),
  ];

  const totalItems = dropdownItems.length;

  const reachedMax = selectedTagIds.length >= MAX_TAGS;

  const inSubMode = isCreating || editingTag !== null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        cancelSubMode();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openDropdown = useCallback(() => {
    if (!reachedMax) {
      setIsOpen(true);
      setHighlightedIndex(0);
    }
  }, [reachedMax]);

  function removeTag(tagId: string): void {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  }

  function selectTag(tagId: string): void {
    if (!selectedTagIds.includes(tagId) && selectedTagIds.length < MAX_TAGS) {
      onChange([...selectedTagIds, tagId]);
    }
    setInputValue("");
    setIsOpen(false);
    cancelSubMode();
    inputRef.current?.focus();
  }

  function cancelSubMode(): void {
    setIsCreating(false);
    setEditingTag(null);
    setSelectedColor("rose");
    setEditingName("");
  }

  function enterCreateMode(): void {
    setIsCreating(true);
    setEditingTag(null);
    setSelectedColor("rose");
  }

  function enterEditMode(tag: Tag): void {
    setEditingTag({ id: tag.id, name: tag.name });
    setEditingName(tag.name);
    setSelectedColor(tag.color as TagColorKey);
    setIsCreating(false);
  }

  async function handleCreate(): Promise<void> {
    const name = inputValue.trim();
    if (!name) return;
    try {
      const newTag = await createTag({ name, color: selectedColor });
      selectTag(newTag.id);
    } catch {
      // ignore — mutation error is surfaced by React Query
    }
  }

  async function handleUpdate(): Promise<void> {
    if (!editingTag) return;
    const name = editingName.trim();
    if (!name) return;
    try {
      await updateTag({ tagId: editingTag.id, data: { name, color: selectedColor } });
      cancelSubMode();
    } catch {
      // ignore — mutation error is surfaced by React Query
    }
  }

  function handleDelete(): void {
    if (!editingTag) return;
    if (selectedTagIds.includes(editingTag.id)) {
      onChange(selectedTagIds.filter((id) => id !== editingTag.id));
    }
    deleteTag(editingTag.id);
    cancelSubMode();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Backspace" && inputValue === "" && selectedTagIds.length > 0) {
      const lastId = selectedTagIds[selectedTagIds.length - 1];
      if (lastId !== undefined) {
        removeTag(lastId);
      }
      return;
    }

    if (event.key === "Escape") {
      if (inSubMode) {
        event.preventDefault();
        cancelSubMode();
      } else {
        setIsOpen(false);
      }
      return;
    }

    if (!isOpen) return;

    // In sub-mode: Enter confirms, arrow keys are ignored
    if (inSubMode) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (isCreating) {
          handleCreate();
        } else if (editingTag) {
          handleUpdate();
        }
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev === 0 ? Math.max(totalItems - 1, 0) : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = dropdownItems[highlightedIndex];
      if (item === undefined) return;
      if (item.type === "tag") {
        selectTag(item.tag.id);
      } else {
        enterCreateMode();
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input container */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 py-1.5 border-0 border-b border-border min-h-[36px] cursor-text",
          "focus-within:border-b-accent",
        )}
        onClick={() => {
          inputRef.current?.focus();
          openDropdown();
        }}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            color={tag.color}
            onRemove={() => removeTag(tag.id)}
          />
        ))}

        {!reachedMax && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder={selectedTagIds.length === 0 ? "Tags (optional)" : ""}
            className="flex-1 min-w-[80px] text-small bg-transparent border-none outline-none text-stone-900 placeholder:text-muted"
            onFocus={openDropdown}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsCreating(false);
              setEditingTag(null);
              setHighlightedIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !reachedMax && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-md z-20 overflow-hidden">
          {isCreating ? (
            /* Color picker view — creating a new tag */
            <div className="px-3 py-3">
              <p className="text-small font-medium text-stone-900 mb-1">
                Nova tag: &ldquo;{inputValue.trim()}&rdquo;
              </p>
              <p className="text-small text-muted mb-2">Escolha uma cor:</p>
              <TagColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelSubMode}
                  className="text-small text-muted hover:text-stone-900 cursor-pointer transition-colors duration-200"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isCreatingTag}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCreate}
                  className="text-small font-medium text-white bg-accent border-none rounded-md py-1 px-3.5 disabled:opacity-60 cursor-pointer"
                >
                  {isCreatingTag ? "Criando\u2026" : "Criar"}
                </button>
              </div>
            </div>
          ) : editingTag ? (
            /* Edit tag view */
            <div className="px-3 py-3">
              <p className="text-small font-medium text-stone-900 mb-2">Editar tag</p>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full text-small bg-transparent border-0 border-b border-border focus:border-b-accent outline-none py-1 mb-2 text-stone-900"
                autoFocus
              />
              <p className="text-small text-muted mb-2">Cor:</p>
              <TagColorPicker selectedColor={selectedColor} onSelect={setSelectedColor} />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelSubMode}
                  className="text-small text-muted hover:text-stone-900 cursor-pointer transition-colors duration-200"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isUpdatingTag}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleUpdate}
                  className="text-small font-medium text-white bg-accent border-none rounded-md py-1 px-3.5 disabled:opacity-60 cursor-pointer"
                >
                  {isUpdatingTag ? "Salvando\u2026" : "Salvar"}
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleDelete}
                  className="text-small text-red-600 hover:text-red-700 cursor-pointer transition-colors duration-200 ml-auto"
                >
                  Excluir
                </button>
              </div>
            </div>
          ) : (
            /* Tag list + create option + footer hint */
            <>
              {filteredTags.length === 0 && !showCreateOption && (
                <p className="px-3 py-2 text-small text-muted">
                  Nenhuma tag encontrada
                </p>
              )}

              {filteredTags.map((tag, index) => {
                const palette = TAG_COLORS[tag.color as TagColorKey] ?? TAG_COLORS.stone;
                const isHighlighted = highlightedIndex === index;
                return (
                  <div
                    key={tag.id}
                    className={cn(
                      "px-3 py-2 flex items-center gap-2 cursor-pointer text-small group",
                      isHighlighted && "bg-[#F7F6F3]",
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectTag(tag.id);
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: palette.bg }}
                    />
                    <span className="text-stone-900 flex-1">
                      {highlightMatch(tag.name, inputValue)}
                    </span>
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted hover:text-stone-900 cursor-pointer p-0.5"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        enterEditMode(tag);
                      }}
                      aria-label={`Editar tag ${tag.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {showCreateOption && (
                <>
                  {filteredTags.length > 0 && (
                    <div className="border-t border-border" />
                  )}
                  <div
                    className={cn(
                      "px-3 py-2 flex items-center gap-2 cursor-pointer text-small",
                      highlightedIndex === filteredTags.length && "bg-[#F7F6F3]",
                    )}
                    onMouseEnter={() => setHighlightedIndex(filteredTags.length)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={enterCreateMode}
                  >
                    <span className="text-accent font-medium">+</span>
                    <span className="text-stone-900">
                      Criar tag &ldquo;{inputValue.trim()}&rdquo;
                    </span>
                  </div>
                </>
              )}

              {/* Footer hint */}
              <div className="px-3 py-2 border-t border-border">
                <p className="text-xs text-muted">
                  {filteredTags.length === 0 && !showCreateOption
                    ? "Digite o nome da nova tag"
                    : "Digite para criar uma nova tag"}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
