"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner } from "sonner@2.0.3";
const Toaster = ({ ...props }) => {
    const { theme = "system" } = useTheme();
    return (_jsx(Sonner, { theme: theme, className: "toaster group", style: {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
        }, ...props }));
};
export { Toaster };
//# sourceMappingURL=sonner.js.map