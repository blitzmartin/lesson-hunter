import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dotgrid flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 sm:px-8 py-4 sm:py-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-logo font-semibold uppercase tracking-tight text-base sm:text-lg text-ink"
          >
            <img
              src="/lesson-hunter-logo.webp"
              alt="Lesson Hunter"
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />
            <span className="hidden sm:inline">Lesson Hunter</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6">
            <Link
              to="/about"
              className={`font-mono uppercase tracking-widest text-xs ${
                isActive("/about") ? "text-ink" : "text-muted-2"
              }`}
            >
              About
            </Link>
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
              className="font-mono uppercase tracking-wider text-xs sm:text-sm rounded-full bg-ink text-paper px-4 py-2 sm:px-5 sm:py-2.5 transition-opacity hover:opacity-80"
            >
              New course
            </Link>
            <Link
              to="/setup"
              className={`font-mono uppercase tracking-widest text-xs rounded-full border-2 border-ink px-3 py-1.5 sm:px-4 sm:py-2 transition-colors hover:bg-ink hover:text-paper ${
                isActive("/setup") ? "bg-ink text-paper" : "text-ink"
              }`}
            >
              Setup
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
