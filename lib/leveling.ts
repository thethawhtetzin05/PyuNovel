// EXP & Leveling utility functions (pure, no server action)

// Level = floor(sqrt(EXP / 100))
export function calculateLevel(exp: number): number {
    return Math.floor(Math.sqrt(exp / 100));
}

// EXP required to reach the NEXT level after current level
export function expForNextLevel(level: number): number {
    return (level + 1) * (level + 1) * 100;
}
