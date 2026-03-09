export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateSlug(title: string, maxLength: number = 100): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // အထူးအက္ခရာများ ဖယ်မယ်
    .replace(/[\s_-]+/g, '-') // Space တွေကို Dash ပြောင်းမယ်
    .replace(/^-+|-+$/g, '') // ရှေ့နောက် Dash တွေကို ဖယ်မယ်
    .substring(0, maxLength); // Length ကန့်သတ်မယ်
}

/**
 * Raw tag string တစ်ခုကို normalize လုပ်ပေးသည် (Title Case, trim, dedupe blank)
 * @example processTags("action, romance,  comedy") → "Action, Romance, Comedy"
 */
export function processTags(raw: string): string {
  if (!raw?.trim()) return '';
  return raw
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .map(tag => {
      const lower = tag.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(', ');
}


// ==========================================
// Chapter Parsing Utility
// ==========================================

// Regex တွေကို module-level တွင် တစ်ကြိမ်သာ compile လုပ်သည် (performance)
// ၁။ အခန်း (သို့) Chapter (သို့) အပိုင်း + (English or Burmese digits)
// ၂။ Markdown style (# Heading)
const TITLE_REGEX = /^((?:အခန်း|အပိုင်း)\s*[\(\（]?[0-9၀-၉]+[\)\）]?|Chapter\s+[0-9၀-၉]+|^#\s+)/i;


export interface ParsedChapter {
  title: string;
  content: string;
}

/**
 * Splits raw text into an array of chapters.
 * Detection priority:
 *  1. Lines starting with "အခန်း (digits)" or "အပိုင်း (digits)" or "Chapter digits" → treated as chapter title.
 */
export function parseChaptersFromText(raw: string, asHtml: boolean = true): ParsedChapter[] {
  // Input guard — null/empty string ဆိုရင် empty array ပြန်ပေးမည်
  if (typeof raw !== 'string' || !raw.trim()) return [];

  // Normalize line endings
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n');

  // Module-level ကြေငြာထားသော TITLE_REGEX ကို အသုံးပြုသည်

  const chapters: ParsedChapter[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];

  const flush = () => {
    let content = currentLines.join('\n').trim();
    if (currentTitle && content) {
      if (asHtml) {
        // Raw text ကို HTML အဖြစ်ပြောင်းမယ် (Paragraphs preserve လုပ်ဖို့)
        // Double newline (\n\n) ကို <p> အဖြစ်ပြောင်း၊ Single newline (\n) ကို <br /> အဖြစ်ပြောင်း
        content = content
          .split(/\n\s*\n/)
          .map(p => {
            const paragraph = p.trim().replace(/\n/g, '<br />');
            return `<p class="mb-4">${paragraph}</p>`;
          })
          .join('');
      }

      chapters.push({ title: currentTitle, content });
    }
    currentTitle = '';
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // ---- Burmese/English chapter heading ----
    if (TITLE_REGEX.test(trimmed)) {
      flush();
      currentTitle = trimmed;
      continue;
    }

    // ---- Regular content line ----
    currentLines.push(line);
  }

  flush(); // push last chapter

  return chapters;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
