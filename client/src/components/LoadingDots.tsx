export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-1 ${className}`} aria-hidden="true">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-loading-dot [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-loading-dot [animation-delay:160ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-loading-dot [animation-delay:320ms]" />
    </span>
  );
}
