/** "Kup mi kafe ☕": opens Ko-fi in a new tab; a plain link, no third-party scripts. */
export function KofiLink({ href, className = "", children }: { href: string; className?: string; children?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? "Kup mi kafe ☕"}
      <span className="sr-only"> (otevře se v nové záložce)</span>
    </a>
  );
}
