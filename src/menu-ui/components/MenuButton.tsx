import React from "react";

export interface MenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const MenuButton = React.forwardRef<HTMLButtonElement, MenuButtonProps>(
  ({ className, children, onClick, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled} // <-- ADDED
        className={`
          w-full px-4 py-2 
          text-center uppercase tracking-[0.2em] text-[13px] 
          text-amber-100/70 
          border border-amber-900/60 
          bg-gradient-to-b from-stone-800/40 to-stone-900/50
          transition-all duration-300
          hover:text-amber-100 hover:bg-stone-800/70 hover:border-amber-700/80 hover:tracking-[0.22em]
          focus:outline-none focus:ring-2 focus:ring-amber-600/50
          
          disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:text-amber-100/70
          disabled:hover:bg-gradient-to-b
          disabled:hover:from-stone-800/40
          disabled:hover:to-stone-900/50
          disabled:hover:border-amber-900/60
          disabled:hover:tracking-[0.2em]
          
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);
MenuButton.displayName = "MenuButton";