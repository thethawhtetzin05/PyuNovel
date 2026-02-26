export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

// ==========================================
// Chapter Parsing Utility
// ==========================================

export interface ParsedChapter {
  title: string;
  content: string;
}

/**
 * Splits raw text into an array of chapters.
 * Detection priority:
 *  1. Lines starting with "အခန်း (digits)" or "Chapter digits" → treated as chapter title.
 *  2. Lines matching ---, ***, ==== as explicit delimiters (next meaningful line is title).
 */
export function parseChaptersFromText(raw: string, asHtml: boolean = true): ParsedChapter[] {
  // Normalize line endings
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n');

  // Regex patterns
  // ၁။ အခန်း (သို့) Chapter + (English or Burmese digits)
  // ၂။ Markdown style (# Heading)
  const titleRegex = /^(အခန်း\s*[\(\（]?[0-9၀-၉]+[\)\）]?|Chapter\s+[0-9၀-၉]+|^#\s+)/i;
  const delimiterRegex = /^(---+|\*\*\*+|={3,})\s*$/;

  const chapters: ParsedChapter[] = [];
  let currentTitle = '';
  let currentLines: string[] = [];
  let awaitingTitleAfterDelimiter = false;

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

    // ---- Delimiter line ----
    if (delimiterRegex.test(trimmed)) {
      flush();
      awaitingTitleAfterDelimiter = true;
      continue;
    }

    // ---- Burmese/English chapter heading ----
    if (titleRegex.test(trimmed)) {
      flush();
      awaitingTitleAfterDelimiter = false;
      currentTitle = trimmed;
      continue;
    }

    // ---- Line after delimiter becomes the title ----
    if (awaitingTitleAfterDelimiter && trimmed.length > 0) {
      currentTitle = trimmed;
      awaitingTitleAfterDelimiter = false;
      continue;
    }

    // ---- Regular content line ----
    currentLines.push(line);
  }

  flush(); // push last chapter

  return chapters;
}
