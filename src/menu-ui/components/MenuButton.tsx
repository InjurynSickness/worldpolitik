interface MenuButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function MenuButton({ children, onClick, disabled }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative w-full py-2 px-6 group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/70" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-amber-700/70" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-amber-700/70" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/70" />

      {/* Main button background */}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/40 to-stone-950/60 border border-amber-900/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] group-hover:from-stone-800/50 group-hover:to-stone-900/70 group-hover:border-amber-800/70 transition-all duration-200" />

      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-700/0 via-amber-700/5 to-amber-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Text */}
      <span className="relative text-amber-100/85 tracking-[0.12em] uppercase group-hover:text-amber-50 transition-colors duration-200" style={{ fontSize: '11px' }}>
        {children}
      </span>
    </button>
  );
}
