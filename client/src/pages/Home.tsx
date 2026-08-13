import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Course } from "../api";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Divider } from "../components/Divider";
import { GridIcon } from "../components/GridIcon";
import { ListIcon } from "../components/ListIcon";
import { LoadingDots } from "../components/LoadingDots";
import { TrashIcon } from "../components/TrashIcon";

function courseProgress(course: Course) {
  const total = course.syllabus.length;
  const completed = course.syllabus.filter((s) => s.completed).length;
  return { completed, total };
}

function isCourseComplete(course: Course) {
  const { completed, total } = courseProgress(course);
  return total > 0 && completed === total;
}

type SortOrder = "newest" | "oldest";
type ViewMode = "grid" | "list";

export default function Home() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    () =>
      (localStorage.getItem("lessonhunter:sortOrder") as SortOrder) || "newest",
  );
  const [completedLast, setCompletedLast] = useState<boolean>(
    () => localStorage.getItem("lessonhunter:completedLast") === "true",
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("lessonhunter:viewMode") as ViewMode) || "grid",
  );

  useEffect(() => {
    api.listCourses().then(setCourses);
  }, []);

  useEffect(() => {
    localStorage.setItem("lessonhunter:sortOrder", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem("lessonhunter:completedLast", String(completedLast));
  }, [completedLast]);

  useEffect(() => {
    localStorage.setItem("lessonhunter:viewMode", viewMode);
  }, [viewMode]);

  const filteredCourses = useMemo(() => {
    if (!courses) return null;
    const query = search.trim().toLowerCase();
    const filtered = query
      ? courses.filter((c) => c.topic.toLowerCase().includes(query))
      : [...courses];

    filtered.sort((a, b) => {
      if (completedLast) {
        const aComplete = isCourseComplete(a);
        const bComplete = isCourseComplete(b);
        if (aComplete !== bComplete) return aComplete ? 1 : -1;
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return filtered;
  }, [courses, search, sortOrder, completedLast]);

  if (!courses)
    return (
      <p className="font-mono text-sm text-muted-2 inline-flex items-center gap-2">
        Loading
        <LoadingDots />
      </p>
    );

  const requestDelete = (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    e.stopPropagation();
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    const course = courseToDelete;
    setCourseToDelete(null);
    setDeletingId(course.id);
    try {
      await api.deleteCourse(course.id);
      setCourses((prev) => prev?.filter((c) => c.id !== course.id) ?? null);
    } finally {
      setDeletingId(null);
    }
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="font-display font-light uppercase tracking-tight text-4xl leading-[0.92]">
          No courses yet
        </p>
        <p className="text-muted mt-4">
          Turn any topic into a curated video course.
        </p>
        <Link
          to="/new"
          className="inline-block mt-8 font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-7 py-3.5 hover:opacity-80 transition-opacity"
        >
          Create your first course
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2">
          Your courses
        </div>
        <input
          type="search"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 border border-line bg-paper px-4 py-2 font-sans text-sm"
        />
      </div>
      <Divider />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            aria-label="Order by"
            className="border border-line bg-paper px-3 py-2 font-mono uppercase tracking-widest text-xs text-ink"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <label className="inline-flex items-center gap-2 font-mono uppercase tracking-widest text-xs text-muted-2 cursor-pointer">
            <input
              type="checkbox"
              checked={completedLast}
              onChange={(e) => setCompletedLast(e.target.checked)}
              className="accent-ink"
            />
            Completed last
          </label>
        </div>

        <div className="inline-flex border border-line shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            title="Grid view"
            aria-pressed={viewMode === "grid"}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              viewMode === "grid"
                ? "bg-ink text-paper"
                : "text-muted-2 hover:text-ink"
            }`}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            title="List view"
            aria-pressed={viewMode === "list"}
            className={`w-9 h-9 flex items-center justify-center border-l border-line transition-colors ${
              viewMode === "list"
                ? "bg-ink text-paper"
                : "text-muted-2 hover:text-ink"
            }`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {filteredCourses?.length === 0 && (
        <p className="text-muted text-sm">No courses match "{search}".</p>
      )}

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            : "flex flex-col gap-3"
        }
      >
        {filteredCourses?.map((c) => {
          const { completed, total } = courseProgress(c);
          const isComplete = total > 0 && completed === total;

          if (viewMode === "list") {
            return (
              <Link
                key={c.id}
                to={`/courses/${c.id}`}
                className="bg-paper border border-line px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 relative hover:bg-ink/[0.02] transition-colors"
              >
                <span className="font-mono uppercase tracking-widest text-xs text-muted-2 shrink-0">
                  {c.level}
                </span>
                <h3 className="font-display font-light uppercase tracking-tight text-lg leading-[0.95] flex-1 min-w-[9rem] sm:truncate">
                  {c.topic}
                </h3>
                <span className="text-muted text-sm hidden sm:inline shrink-0">
                  {c.syllabus.length} sub-topics · {c.language}
                </span>
                <span className="font-mono uppercase tracking-widest text-xs text-ink shrink-0">
                  {completed}/{total}
                </span>
                {isComplete && (
                  <span className="font-mono uppercase tracking-widest text-xs rounded-full bg-yellow text-ink px-3 py-1 shrink-0">
                    Completed
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => requestDelete(e, c)}
                  disabled={deletingId === c.id}
                  title="Delete course"
                  className="rounded-full border-1 border-muted text-ink w-8 h-8 flex items-center justify-center hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 shrink-0 ml-auto sm:ml-0"
                >
                  <TrashIcon />
                </button>
              </Link>
            );
          }

          return (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="bg-paper border border-line p-6 sm:p-8 block relative"
            >
              <button
                type="button"
                onClick={(e) => requestDelete(e, c)}
                disabled={deletingId === c.id}
                title="Delete course"
                className="absolute top-4 right-4 rounded-full border-1 border-muted text-ink w-8 h-8 flex items-center justify-center hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
              >
                <TrashIcon />
              </button>
              <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
                {c.level}
              </span>
              <h3 className="font-display font-light uppercase tracking-tight text-xl sm:text-2xl leading-[0.95] mt-2 pr-8">
                {c.topic}
              </h3>
              <p className="text-muted mt-3 text-sm">
                {c.syllabus.length} sub-topics · {c.language}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="font-mono uppercase tracking-widest text-xs text-ink">
                  {completed}/{total}
                </span>
                {isComplete && (
                  <span className="font-mono uppercase tracking-widest text-xs rounded-full bg-yellow text-ink px-3 py-1">
                    Completed
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <ConfirmDialog
        open={courseToDelete !== null}
        title="Delete course"
        message={
          courseToDelete
            ? `Delete "${courseToDelete.topic}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setCourseToDelete(null)}
      />
    </div>
  );
}
