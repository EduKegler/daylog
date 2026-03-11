export function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-border">
      <div className="max-w-[42rem] mx-auto px-6 py-3 flex items-center justify-between text-tag text-muted">
        <span>© 2026 Daylog</span>
        <a
          href="https://kegler.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-200 hover:text-accent"
        >
          kegler.dev
        </a>
      </div>
    </footer>
  );
}
