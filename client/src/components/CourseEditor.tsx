import { useEffect, useRef, useState } from "react";
import { api, type Course, type SyllabusEntry } from "../api";
import { GripIcon } from "./GripIcon";

// Mirrors server/lib/youtube.js#extractVideoId — used here only to derive a
// thumbnail preview and validate new links client-side, no API call involved.
function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const match = /\/(embed|shorts)\/([\w-]{11})/.exec(url.pathname);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

interface Row {
  subTopicTitle: string;
  video: SyllabusEntry["video"];
  userNotes: string;
  completed: boolean;
  // Only set for newly added rows, not yet resolved into a `video`.
  youtubeUrl?: string;
}

function fromCourse(course: Course): Row[] {
  return course.syllabus.map((s) => ({
    subTopicTitle: s.subTopicTitle,
    video: s.video,
    userNotes: s.userNotes,
    completed: s.completed,
  }));
}

export function CourseEditor({
  course,
  onSaved,
  onCancel,
}: {
  course: Course;
  onSaved: (course: Course) => void;
  onCancel: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => fromCourse(course));
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const updateTitle = (i: number, subTopicTitle: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, subTopicTitle } : r)));

  const removeRow = (i: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const moveRowTo = (from: number, to: number) =>
    setRows((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  // Pointer Events instead of the HTML5 Drag and Drop API: HTML5 drag
  // (draggable + dragstart/dragover/drop) doesn't fire reliably on touch
  // browsers, while pointer events cover mouse, touch, and pen uniformly.
  useEffect(() => {
    if (draggedIndex === null) return;

    const handleMove = (e: PointerEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const rowEl = target instanceof Element ? target.closest<HTMLElement>("[data-row-index]") : null;
      if (!rowEl) return;
      const overIndex = Number(rowEl.dataset.rowIndex);
      if (Number.isNaN(overIndex) || dragIndexRef.current === null || dragIndexRef.current === overIndex) return;
      moveRowTo(dragIndexRef.current, overIndex);
      dragIndexRef.current = overIndex;
      setDraggedIndex(overIndex);
    };

    const stopDragging = () => {
      dragIndexRef.current = null;
      setDraggedIndex(null);
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", stopDragging);
    document.addEventListener("pointercancel", stopDragging);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", stopDragging);
      document.removeEventListener("pointercancel", stopDragging);
    };
  }, [draggedIndex]);

  const startDrag = (i: number) => {
    dragIndexRef.current = i;
    setDraggedIndex(i);
  };

  const newVideoId = newUrl.trim() ? extractVideoId(newUrl) : null;
  const newUrlInvalid = newUrl.trim().length > 0 && !newVideoId;

  const addRow = () => {
    if (!newTitle.trim() || !newVideoId) return;
    setRows((prev) => [
      ...prev,
      { subTopicTitle: newTitle.trim(), video: null, userNotes: "", completed: false, youtubeUrl: newUrl },
    ]);
    setNewTitle("");
    setNewUrl("");
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const updated = await api.replaceSyllabus(
        course.id,
        rows.map((r) => ({
          subTopicTitle: r.subTopicTitle,
          video: r.video,
          youtubeUrl: r.youtubeUrl,
          userNotes: r.userNotes,
          completed: r.completed,
        }))
      );
      onSaved(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-line bg-paper p-6">
      <div className="font-mono uppercase tracking-widest text-xs text-muted-2 mb-4">
        Edit syllabus
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => {
          const thumbId = row.video?.youtubeId ?? (row.youtubeUrl ? extractVideoId(row.youtubeUrl) : null);
          return (
            <div
              key={i}
              data-row-index={i}
              className={`border p-3 flex items-center gap-3 transition-colors ${
                draggedIndex === i ? "border-ink bg-yellow opacity-90" : "border-line bg-paper"
              }`}
            >
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  startDrag(i);
                }}
                title="Drag to reorder"
                className="touch-none text-muted-2 hover:text-ink cursor-grab active:cursor-grabbing flex-shrink-0"
              >
                <GripIcon className="w-4 h-4" />
              </button>
              <div className="w-16 sm:w-24 aspect-video border border-line bg-paper-2 flex-shrink-0 overflow-hidden">
                {thumbId && (
                  <img
                    src={`https://i.ytimg.com/vi/${thumbId}/hqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <input
                className="flex-1 min-w-0 border border-line bg-paper px-3 py-2 font-sans text-sm"
                value={row.subTopicTitle}
                onChange={(e) => updateTitle(i, e.target.value)}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="font-mono uppercase tracking-widest text-xs text-muted-2 hover:text-ink flex-shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 border border-line border-dashed p-3">
        <p className="font-mono uppercase tracking-widest text-xs text-muted-2 mb-3">
          Add video
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border border-line bg-paper px-3 py-2 font-sans text-sm"
            placeholder="Sub-topic title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <input
            className={`flex-1 border bg-paper px-3 py-2 font-sans text-sm ${
              newUrlInvalid ? "border-red-500" : "border-line"
            }`}
            placeholder="Paste YouTube link"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={addRow}
            disabled={!newTitle.trim() || !newVideoId}
            className="font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-30 whitespace-nowrap"
          >
            + Add
          </button>
        </div>
        {newUrlInvalid && (
          <p className="font-mono text-xs text-red-500 mt-2">
            Not a recognized YouTube link
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 border border-line bg-paper-2 px-4 py-3">
          <p className="font-mono text-xs text-ink whitespace-pre-wrap break-words">
            {error}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-6 py-3 hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="font-mono uppercase tracking-wider text-sm rounded-full border-2 border-ink px-6 py-3 hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
