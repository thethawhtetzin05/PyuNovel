import { describe, it, expect } from 'vitest';

// Extract the function from the route file (mocked/copied here for testing purity)
// In a real scenario, we'd export it from a separate utility file.
function parseBulkText(text: string) {
    const lines = text.split(/\r?\n/);
    const result: { title: string; content: string }[] = [];
    let currentChapter: { title: string; content: string } | null = null;

    const titleRegex = /^([*-=\s\[\(])*(Chapter|အပိုင်း|Episode|Vol|Volume|အခန်း)[\s\(\).:-]*[0-9၀-၉]+([\s\]\)-=*])*$/i;
    const flexibleTitleWithDigitsRegex = /^([*-=\s\[\(])*(Chapter|အပိုင်း|Episode|Vol|Volume|အခန်း)[\s\(\).:-]*[0-9၀-၉]+/i;
    const startWithDigitRegex = /^[0-9၀-၉]+[\)။၊।\.\s-]/;

    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const isTitle = titleRegex.test(trimmed) || 
                        flexibleTitleWithDigitsRegex.test(trimmed) ||
                        startWithDigitRegex.test(trimmed);

        if (isTitle) {
            if (currentChapter) result.push(currentChapter);
            currentChapter = { title: trimmed, content: "" };
        } else {
            if (!currentChapter) {
                currentChapter = { title: "Untitled Chapter", content: "" };
            }
            currentChapter.content += line + "\n";
        }
    }
    if (currentChapter) result.push(currentChapter);
    return result;
}

describe('Telegram Bulk Text Parser', () => {
    it('should parse chapters with English digits', () => {
        const input = "Chapter 1\nContent of chapter 1\nChapter 2\nContent of chapter 2";
        const result = parseBulkText(input);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("Chapter 1");
        expect(result[1].title).toBe("Chapter 2");
    });

    it('should parse chapters with Myanmar digits', () => {
        const input = "အခန်း ၁\nမာတိကာ ၁\nအခန်း ၂\nမာတိကာ ၂";
        const result = parseBulkText(input);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("အခန်း ၁");
        expect(result[1].title).toBe("အခန်း ၂");
    });

    it('should handle complex chapter patterns', () => {
        const input = "[Chapter 10]\nText here\n--- အပိုင်း ၁၁ ---\nMore text";
        const result = parseBulkText(input);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("[Chapter 10]");
        expect(result[1].title).toBe("--- အပိုင်း ၁၁ ---");
    });

    it('should handle numbered list style titles', () => {
        const input = "၁။ နိဒါန်း\nစာသားများ\n၂။ အစပိုင်း\nနောက်ထပ်စာသားများ";
        const result = parseBulkText(input);
        expect(result).toHaveLength(2);
        expect(result[0].title).toBe("၁။ နိဒါန်း");
        expect(result[1].title).toBe("၂။ အစပိုင်း");
    });

    it('should combine multiple lines into content', () => {
        const input = "Chapter 1\nLine 1\nLine 2\nLine 3";
        const result = parseBulkText(input);
        expect(result[0].content).toBe("Line 1\nLine 2\nLine 3\n");
    });
});
