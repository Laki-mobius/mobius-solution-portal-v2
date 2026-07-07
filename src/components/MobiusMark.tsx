interface MobiusMarkProps {
  className?: string;
  size?: number;
}

export const MobiusMark = ({ className, size = 32 }: MobiusMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mobius-grad" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="hsl(var(--primary))" />
        <stop offset="100%" stopColor="hsl(var(--accent))" />
      </linearGradient>
    </defs>
    <path
      d="M6 20C6 13 11 8 18 8c4 0 7 2 9 5 2-3 5-5 9-5-7 0-12 5-12 12s5 12 12 12c-4 0-7-2-9-5-2 3-5 5-9 5-7 0-12-5-12-12z"
      stroke="url(#mobius-grad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="20" cy="20" r="2.5" fill="url(#mobius-grad)" />
  </svg>
);

export const MobiusLogo = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
    <MobiusMark size={32} />
    <div className="flex flex-col leading-none">
      <span className="font-display text-base font-bold tracking-tight">Mobius</span>
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Solutions
      </span>
    </div>
  </div>
);
