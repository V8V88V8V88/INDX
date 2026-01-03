export interface ThemeColor {
    id: string;
    label: string;
    colors: {
        primary: string;
        secondary: string;
        muted: string;
        dark: string;
    };
}

export const THEMES: ThemeColor[] = [
    {
        id: "blue",
        label: "Blue",
        colors: { primary: "#2563eb", secondary: "#3b82f6", muted: "#dbeafe", dark: "#1e3a8a" },
    },
    {
        id: "teal",
        label: "Teal",
        colors: { primary: "#0f766e", secondary: "#14b8a6", muted: "#ccfbf1", dark: "#115e59" },
    },
    {
        id: "green",
        label: "Green",
        colors: { primary: "#16a34a", secondary: "#22c55e", muted: "#dcfce7", dark: "#14532d" },
    },
    {
        id: "yellow",
        label: "Yellow",
        colors: { primary: "#ca8a04", secondary: "#eab308", muted: "#fef9c3", dark: "#854d0e" },
    },
    {
        id: "orange",
        label: "Orange",
        colors: { primary: "#ea580c", secondary: "#f97316", muted: "#ffedd5", dark: "#9a3412" },
    },
    {
        id: "red",
        label: "Red",
        colors: { primary: "#dc2626", secondary: "#ef4444", muted: "#fee2e2", dark: "#991b1b" },
    },
    {
        id: "pink",
        label: "Pink",
        colors: { primary: "#db2777", secondary: "#ec4899", muted: "#fce7f3", dark: "#9d174d" },
    },
    {
        id: "purple",
        label: "Purple",
        colors: { primary: "#9333ea", secondary: "#a855f7", muted: "#f3e8ff", dark: "#6b21a8" },
    },
    {
        id: "slate",
        label: "Slate",
        colors: { primary: "#475569", secondary: "#64748b", muted: "#f1f5f9", dark: "#334155" },
    },
];

export function applyTheme(themeId: string) {
    if (typeof document === "undefined") return;

    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    const root = document.documentElement;

    root.style.setProperty("--accent-primary", theme.colors.primary);
    root.style.setProperty("--accent-secondary", theme.colors.secondary);
    root.style.setProperty("--accent-muted", theme.colors.muted);
    root.style.setProperty("--accent-dark", theme.colors.dark);
}
