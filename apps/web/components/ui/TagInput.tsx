"use client";

import { useRef, useState, type KeyboardEvent, type FocusEvent } from "react";

interface TagInputProps {
	value: string[];
	onChange: (next: string[]) => void;
	placeholder?: string;
	maxTags?: number;
	ariaLabel?: string;
	/** Optional id for the first focusable input (label `htmlFor` target). */
	id?: string;
	/** Disable input (rare, e.g. during submit). */
	disabled?: boolean;
}

/**
 * Chip-based tag input. Users type, press Enter (or comma), the text becomes
 * a removable chip. Backspace on empty input removes the last chip.
 *
 * DESIGN.md-compliant:
 *   chip:   px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[11px]
 *   input:  bg-transparent border-b border-gray-800 focus:border-gray-600
 *           minimal chrome, no boxy frame
 *
 * Added for AI Animation Storyboard wizard (Step 2, character appearance
 * traits). Reusable for any future tag field. Codifies a new system pattern.
 */
export function TagInput({
	value,
	onChange,
	placeholder,
	maxTags = 10,
	ariaLabel,
	id,
	disabled = false,
}: TagInputProps) {
	const [draft, setDraft] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	function commitDraft() {
		const trimmed = draft.trim();
		if (!trimmed) return;
		if (value.length >= maxTags) return;
		if (value.includes(trimmed)) {
			setDraft("");
			return;
		}
		onChange([...value, trimmed]);
		setDraft("");
	}

	function removeAt(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			commitDraft();
			return;
		}
		if (e.key === "Backspace" && draft.length === 0 && value.length > 0) {
			e.preventDefault();
			removeAt(value.length - 1);
			return;
		}
	}

	function handleBlur(_e: FocusEvent<HTMLInputElement>) {
		// Commit on blur so users who click away don't lose half-typed chips.
		commitDraft();
	}

	return (
		<div
			className="flex flex-wrap items-center gap-1.5 border-b border-gray-800 focus-within:border-gray-600 py-1.5"
			onClick={() => inputRef.current?.focus()}
			role="group"
			aria-label={ariaLabel}
		>
			{value.map((tag, i) => (
				<span
					key={`${tag}-${i}`}
					className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[11px]"
				>
					<span>{tag}</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							removeAt(i);
						}}
						className="text-gray-500 hover:text-white focus-visible:text-white focus:outline-none"
						aria-label={`Remove ${tag}`}
						disabled={disabled}
					>
						×
					</button>
				</span>
			))}

			<input
				ref={inputRef}
				id={id}
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKeyDown}
				onBlur={handleBlur}
				placeholder={value.length === 0 ? placeholder : ""}
				disabled={disabled || value.length >= maxTags}
				className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-200 placeholder-gray-600 focus:outline-none disabled:opacity-50"
				aria-label={ariaLabel ? `${ariaLabel} — add new tag` : "Add tag"}
			/>
		</div>
	);
}
