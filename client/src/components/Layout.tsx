import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dotgrid">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-6">
          <Link to="/">LESSON HUNTER</Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className={`font-mono uppercase tracking-widest text-xs ${
                isActive("/") ? "text-ink" : "text-muted-2"
              }`}
            >
              Courses
            </Link>
            <Link
              to="/new"
              className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-5 py-2.5 transition-opacity hover:opacity-80"
            >
              New course
            </Link>
            <Link
              to="/setup"
              className={`font-mono uppercase tracking-widest text-xs rounded-full border-2 border-ink px-4 py-2 transition-colors hover:bg-ink hover:text-paper ${
                isActive("/setup") ? "bg-ink text-paper" : "text-ink"
              }`}
            >
              Setup
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-8 py-12">{children}</main>
    </div>
  );
}
