import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MenuButton } from "./MenuButton";
export function SinglePlayerMenu({ onBack, onNewGame, onLoadGame }) {
    return (_jsx("div", { className: "relative w-full h-screen flex items-center justify-center", children: _jsx("div", { className: "w-[280px]", children: _jsxs("div", { className: "space-y-1", children: [_jsx(MenuButton, { onClick: onNewGame, children: "New Game" }), _jsx(MenuButton, { onClick: onLoadGame, children: "Load Game" }), _jsx("div", { className: "py-2", children: _jsx("div", { className: "h-[1px] bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" }) }), _jsx(MenuButton, { onClick: onBack, children: "Back" })] }) }) }));
}
//# sourceMappingURL=SinglePlayerMenu.js.map