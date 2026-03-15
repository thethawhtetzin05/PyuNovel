import { describe, it, expect } from 'vitest';
import { escapeHtml, generateSlug, processTags, parseChaptersFromText, cn } from './utils';

describe('Utility Functions', () => {
    describe('escapeHtml', () => {
        it('should escape HTML special characters', () => {
            expect(escapeHtml('<b>"Me & You"</b>')).toBe('&lt;b&gt;&quot;Me &amp; You&quot;&lt;/b&gt;');
        });
    });

    describe('generateSlug', () => {
        it('should generate a valid slug from a string', () => {
            expect(generateSlug('Hello World!')).toBe('hello-world');
            expect(generateSlug('  Action & Romance  ')).toBe('action-romance');
            expect(generateSlug('Chapter 1: The Beginning')).toBe('chapter-1-the-beginning');
        });

        it('should handle Burmese digits correctly', () => {
            expect(generateSlug('အခန်း ၁')).toBe('၁');
        });

        it('should respect maxLength', () => {
            expect(generateSlug('this is a very long title that should be truncated', 10)).toBe('this-is-a');
        });
    });

    describe('processTags', () => {
        it('should normalize and deduplicate tags', () => {
            expect(processTags('action, romance,  comedy')).toBe('Action, Romance, Comedy');
            expect(processTags('ACTION, Romance ')).toBe('Action, Romance');
            expect(processTags('')).toBe('');
        });
    });

    describe('parseChaptersFromText', () => {
        it('should parse chapters correctly', () => {
            const rawText = `Chapter 1
This is the first chapter content.

Chapter 2
This is the second chapter content.
Multiple lines.`;
            const chapters = parseChaptersFromText(rawText, false);
            expect(chapters).toHaveLength(2);
            expect(chapters[0].title).toBe('Chapter 1');
            expect(chapters[0].content).toBe('This is the first chapter content.');
            expect(chapters[1].title).toBe('Chapter 2');
            expect(chapters[1].content).toContain('This is the second chapter content.');
        });

        it('should handle Burmese chapter titles', () => {
            const rawText = `အခန်း ၁
မြန်မာလို ရေးထားတဲ့ အခန်း ၁။

အပိုင်း ၂
မြန်မာလို ရေးထားတဲ့ အပိုင်း ၂။`;
            const chapters = parseChaptersFromText(rawText, false);
            expect(chapters).toHaveLength(2);
            expect(chapters[0].title).toBe('အခန်း ၁');
            expect(chapters[1].title).toBe('အပိုင်း ၂');
        });
    });

    describe('cn', () => {
        it('should merge tailwind classes correctly', () => {
            expect(cn('bg-red-500', 'p-4', 'bg-blue-500')).toBe('p-4 bg-blue-500');
            expect(cn('px-2', { 'py-2': true, 'hidden': false })).toBe('px-2 py-2');
        });
    });
});
