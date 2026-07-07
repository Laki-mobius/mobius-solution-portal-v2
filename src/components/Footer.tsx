

export const Footer = () => (
  <footer className="border-t border-border/60 bg-background">
    <div className="container flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
      <div>
        <p className="font-display text-sm font-semibold">Mobius Knowledge Services</p>
        <p className="text-xs text-muted-foreground">Solutions Portal</p>
      </div>
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Mobius Knowledge Services. Internal showcase.
      </p>
    </div>
  </footer>
);
