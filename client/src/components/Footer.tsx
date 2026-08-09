export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="max-w-6xl mx-auto px-8 py-8 flex flex-wrap items-center justify-center gap-4">
        <p className="font-mono uppercase tracking-widest text-xs text-muted-2">
          <a
            href="https://paperboardlabs.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink hover:underline"
          >
            Paper Board Labs
          </a>{" "}
          &copy; 2026
        </p>
      </div>
    </footer>
  );
}
