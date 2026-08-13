export function PencilIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
      <path d="M4 20l4.5-1 11-11a1.5 1.5 0 0 0 0-2.12l-1.38-1.38a1.5 1.5 0 0 0-2.12 0l-11 11L4 20Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 6l4 4" strokeLinecap="round" />
    </svg>
  );
}
