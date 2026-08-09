export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-light uppercase tracking-[0.14em] text-ink ${className}`}>
      LESSON
      <span
        className="inline-block rounded-full bg-yellow align-[-0.02em] mx-[0.08em]"
        style={{ width: '0.62em', height: '0.62em' }}
      />
      HUNTER
    </span>
  );
}
