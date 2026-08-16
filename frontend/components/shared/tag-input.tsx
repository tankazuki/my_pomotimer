"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { TagChips } from "@/components/shared/tag-chips";
import { listTags, type TagRead } from "@/lib/api";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  variant?: "rpg" | "minimal";
  placeholder?: string;
  inputClassName?: string;
};

const SUGGESTION_LIMIT = 8;
const SUGGESTION_DEBOUNCE_MS = 200;

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "");
}

/**
 * タグの自由入力 + サジェスト付きコンポーネント。依存を追加せず自前のリストボックスで実装する。
 * Enterで確定 (サジェスト選択中ならそのタグ、それ以外は入力中の文字列)、
 * 入力が空の状態でBackspaceを押すと直前のタグを削除する。
 */
export function TagInput({
  value,
  onChange,
  variant = "minimal",
  placeholder = "タグを追加",
  inputClassName,
}: TagInputProps) {
  const isRpg = variant === "rpg";
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagRead[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      listTags({ q: query, limit: SUGGESTION_LIMIT })
        .then((tags) => {
          if (!cancelled) setSuggestions(tags);
        })
        .catch(() => {
          if (!cancelled) setSuggestions([]);
        });
    }, SUGGESTION_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputValue]);

  const visibleSuggestions = suggestions.filter(
    (tag) => !value.some((selected) => selected.toLowerCase() === tag.name.toLowerCase()),
  );

  function commitTag(raw: string): void {
    const normalized = normalizeTag(raw);
    if (!normalized) return;
    if (value.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...value, normalized]);
    setInputValue("");
    setSuggestions([]);
    setHighlightedIndex(-1);
  }

  function removeLastTag(): void {
    if (value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      if (highlightedIndex >= 0 && visibleSuggestions[highlightedIndex]) {
        commitTag(visibleSuggestions[highlightedIndex].name);
      } else {
        commitTag(inputValue);
      }
      return;
    }
    if (event.key === "Backspace" && inputValue === "") {
      removeLastTag();
      return;
    }
    if (event.key === "ArrowDown") {
      if (visibleSuggestions.length === 0) return;
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % visibleSuggestions.length);
      return;
    }
    if (event.key === "ArrowUp") {
      if (visibleSuggestions.length === 0) return;
      event.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? visibleSuggestions.length - 1 : prev - 1));
      return;
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }

  const showSuggestions = isOpen && visibleSuggestions.length > 0;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 px-2 py-1.5",
          isRpg
            ? "border-2 border-white bg-black"
            : "rounded-xl border border-white/10 bg-white/5",
        )}
      >
        <TagChips
          tags={value}
          onRemove={(tag) => onChange(value.filter((t) => t !== tag))}
          variant={variant}
        />
        <input
          value={inputValue}
          onChange={(event) => {
            const next = event.target.value;
            setInputValue(next);
            setIsOpen(true);
            setHighlightedIndex(-1);
            if (next.trim() === "") setSuggestions([]);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={cn(
            "min-w-[6rem] flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none",
            inputClassName,
          )}
        />
      </div>

      {showSuggestions && (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            "absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-y-auto text-xs",
            isRpg
              ? "border-2 border-white bg-black"
              : "rounded-xl border border-white/10 bg-[#14151f] shadow-xl",
          )}
        >
          {visibleSuggestions.map((tag, index) => (
            <li key={tag.id} role="option" aria-selected={index === highlightedIndex}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commitTag(tag.name)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-left",
                  index === highlightedIndex
                    ? isRpg
                      ? "bg-white text-black"
                      : "bg-white/10 text-white"
                    : "text-gray-300",
                )}
              >
                <span className="truncate">{`#${tag.name}`}</span>
                <span className="ml-2 shrink-0 text-[10px] text-gray-500">{tag.usage_count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
