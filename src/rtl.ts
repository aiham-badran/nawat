/**
 * Nawat — Arabic Block Editor Core
 * Direction resolution (PRD §7.2 / FR-02).
 *
 * Implements the "first strong character" rule from Unicode UAX #9
 * (Unicode Bidirectional Algorithm). Pure function, no DOM.
 */

import type { Direction, Locale } from "./types.js";

// ─────────────────────────────────────────────────────────────
// Unicode ranges
// ─────────────────────────────────────────────────────────────

/**
 * Strong RTL characters (Bidi_Class = R or AL).
 * Covers Hebrew, Arabic (incl. Persian/Urdu), Syriac, Thaana, NKo,
 * Samaritan, Mandaic, and RTL presentation forms[reference:4].
 */
const RTL_STRONG = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/u;

/** Any Unicode letter (Bidi_Class = L, or R/AL). Used as the LTR fallback. */
const ANY_LETTER = /\p{L}/u;

// ─────────────────────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────────────────────

/**
 * Resolve text direction.
 *
 * - If `content` is provided and contains a strong character, its class wins:
 *   RTL strong → "rtl", any other letter → "ltr"[reference:5].
 * - If no strong character exists (digits, punctuation, whitespace only),
 *   falls back to the locale: `ar` → "rtl", `en` → "ltr".
 * - If `content` is omitted entirely, returns the locale's default direction.
 */
export function resolveDirection(
  locale: Locale,
  content?: string,
): Direction {
  if (content) {
    for (const char of content) {
      if (RTL_STRONG.test(char)) return "rtl";
      if (ANY_LETTER.test(char)) return "ltr";
    }
  }
  // No strong character found (or no content): fall back to locale.
  return locale === "ar" ? "rtl" : "ltr";
}
