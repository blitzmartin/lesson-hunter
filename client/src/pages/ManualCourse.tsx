import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Divider } from "../components/Divider";
import { LoadingDots } from "../components/LoadingDots";
import { LANGUAGES } from "../languages";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

interface Row {
  subTopicTitle: string;
  youtubeUrl: string;
}

function emptyRow(): Row {
  return { subTopicTitle: "", youtubeUrl: "" };
}

// Mirrors server/lib/youtube.js#extractVideoId — used here only to derive a
// thumbnail preview and validate the link client-side, no API call involved.
function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be"))
      return url.pathname.slice(1).split("/")[0] || null;
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

export default function ManualCourse() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("beginner");
  const [languageCode, setLanguageCode] = useState<string>(LANGUAGES[0].code);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (i: number) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev,
    );
  const moveRow = (i: number, dir: -1 | 1) =>
    setRows((prev) => {
      const target = i + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const language = LANGUAGES.find((l) => l.code === languageCode)!.label;
      const course = await api.createManualCourse({
        topic,
        level,
        language,
        languageCode,
        notes,
        syllabus: rows.map((r) => ({
          subTopicTitle: r.subTopicTitle,
          youtubeUrl: r.youtubeUrl,
        })),
      });
      navigate(`/courses/${course.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2">
          Manual course
        </div>
        <Link
          to="/new"
          className="font-mono uppercase tracking-widest text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
        >
          ← Use AI instead
        </Link>
      </div>
      <Divider />
      <form onSubmit={submit} className="space-y-8">
        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Topic
          </span>
          <input
            required
            className="mt-2 w-full border border-line bg-paper px-4 py-3 font-sans"
            placeholder="e.g. React hooks, sourdough baking, music theory"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Skill level
          </span>
          <div className="flex gap-3 mt-2">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLevel(l)}
                className={`font-mono uppercase tracking-wider text-xs rounded-full px-4 py-2 border-2 border-ink transition-colors ${
                  level === l
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Language
          </span>
          <select
            required
            className="mt-2 w-full border border-line bg-paper px-4 py-3 font-sans"
            value={languageCode}
            onChange={(e) => setLanguageCode(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Syllabus
          </span>
          <div className="mt-2 space-y-4">
            {rows.map((row, i) => {
              const videoId = row.youtubeUrl.trim()
                ? extractVideoId(row.youtubeUrl)
                : null;
              const invalid = row.youtubeUrl.trim().length > 0 && !videoId;
              return (
                <div key={i} className="border border-line bg-paper p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs text-muted-2">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => moveRow(i, -1)}
                        disabled={i === 0}
                        title="Move up"
                        className="font-mono text-xs text-muted-2 hover:text-ink disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(i, 1)}
                        disabled={i === rows.length - 1}
                        title="Move down"
                        className="font-mono text-xs text-muted-2 hover:text-ink disabled:opacity-30"
                      >
                        ↓
                      </button>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(i)}
                          className="font-mono uppercase tracking-widest text-xs text-muted-2 hover:text-ink"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-32 aspect-video border border-line bg-paper-2 flex-shrink-0 overflow-hidden">
                      {videoId && (
                        <img
                          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        required
                        className="w-full border border-line bg-paper px-4 py-2.5 font-sans text-sm"
                        placeholder="Sub-topic title"
                        value={row.subTopicTitle}
                        onChange={(e) =>
                          updateRow(i, { subTopicTitle: e.target.value })
                        }
                      />
                      <input
                        required
                        className={`w-full border bg-paper px-4 py-2.5 font-sans text-sm ${
                          invalid ? "border-red-500" : "border-line"
                        }`}
                        placeholder="Paste YouTube link"
                        value={row.youtubeUrl}
                        onChange={(e) =>
                          updateRow(i, { youtubeUrl: e.target.value })
                        }
                      />
                      {invalid && (
                        <p className="font-mono text-xs text-red-500">
                          Not a recognized YouTube link
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-4 font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            + Add sub-topic
          </button>
        </div>

        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Additional Information (optional)
          </span>
          <textarea
            className="mt-2 w-full border border-line bg-paper px-4 py-3 font-sans"
            rows={3}
            placeholder="e.g. anything worth noting about this course"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error && (
          <div className="border border-line bg-paper-2 px-4 py-3">
            <p className="font-mono uppercase tracking-widest text-xs text-muted-2 mb-2">
              Course creation failed
            </p>
            <p className="font-mono text-xs text-ink whitespace-pre-wrap break-words">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-7 py-3.5 hover:opacity-80 transition-opacity disabled:opacity-40 inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              Creating
              <LoadingDots />
            </>
          ) : (
            "Create course"
          )}
        </button>
      </form>
    </div>
  );
}
