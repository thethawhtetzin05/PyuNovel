import { describe, it, expect } from 'vitest';
import { calculateLevel, expForNextLevel } from './leveling';

describe('Leveling System', () => {
    describe('calculateLevel', () => {
        it('should return level 0 for 0 EXP', () => {
            expect(calculateLevel(0)).toBe(0);
        });

        it('should return level 0 for 99 EXP', () => {
            expect(calculateLevel(99)).toBe(0);
        });

        it('should return level 1 for 100 EXP', () => {
            expect(calculateLevel(100)).toBe(1);
        });

        it('should return level 1 for 399 EXP', () => {
            expect(calculateLevel(399)).toBe(1);
        });

        it('should return level 2 for 400 EXP', () => {
            expect(calculateLevel(400)).toBe(2);
        });

        it('should return level 3 for 900 EXP', () => {
            expect(calculateLevel(900)).toBe(3);
        });
    });

    describe('expForNextLevel', () => {
        it('should return 100 EXP for level 0', () => {
            expect(expForNextLevel(0)).toBe(100);
        });

        it('should return 400 EXP for level 1', () => {
            expect(expForNextLevel(1)).toBe(400);
        });

        it('should return 900 EXP for level 2', () => {
            expect(expForNextLevel(2)).toBe(900);
        });
    });
});
