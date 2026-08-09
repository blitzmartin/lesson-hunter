import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Course } from "../api";
import { TrashIcon } from "../components/TrashIcon";
import { LoadingDots } from "../components/LoadingDots";

export default function Home() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.listCourses().then(setCourses);
  }, []);

  if (!courses)
    return (
      <p className="font-mono text-sm text-muted-2 inline-flex items-center gap-2">
        Loading
        <LoadingDots />
      </p>
    );

  const deleteCourse = async (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Delete "${course.topic}"? This cannot be undone.`))
      return;
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
      <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6 mb-8">
        Your courses
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <Link
            key={c.id}
            to={`/courses/${c.id}`}
            className="bg-paper border border-line p-8 block relative"
          >
            <button
              type="button"
              onClick={(e) => deleteCourse(e, c)}
              disabled={deletingId === c.id}
              title="Delete course"
              className="absolute top-4 right-4 rounded-full border-1 border-muted text-ink w-8 h-8 flex items-center justify-center hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
            >
              <TrashIcon />
            </button>
            <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
              {c.level}
            </span>
            <h3 className="font-display font-light uppercase tracking-tight text-2xl leading-[0.95] mt-2 pr-8">
              {c.topic}
            </h3>
            <p className="text-muted mt-3 text-sm">
              {c.syllabus.length} sub-topics · {c.language}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
