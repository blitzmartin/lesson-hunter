import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { LANGUAGES } from "../languages";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const COUNT_RANGES = ["1-5", "6-15", "15-30"];

export default function NewCourse() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("beginner");
  const [languageCode, setLanguageCode] = useState<string>(LANGUAGES[0].code);
  const [videoCountRange, setVideoCountRange] = useState(COUNT_RANGES[1]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const language = LANGUAGES.find((l) => l.code === languageCode)!.label;
      const course = await api.generateCourse({
        topic,
        level,
        language,
        languageCode,
        videoCountRange,
        notes,
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
      <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6 mb-8">
        New course
      </div>

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

        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Video count
          </span>
          <div className="flex gap-3 mt-2">
            {COUNT_RANGES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setVideoCountRange(r)}
                className={`font-mono uppercase tracking-wider text-xs rounded-full px-4 py-2 border-2 border-ink transition-colors ${
                  videoCountRange === r
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                {r} videos
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            Additional Information (optional)
          </span>
          <textarea
            className="mt-2 w-full border border-line bg-paper px-4 py-3 font-sans"
            rows={3}
            placeholder="e.g. focus on practical examples, avoid framework X"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {error && <p className="font-mono text-xs text-muted">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-7 py-3.5 hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {loading ? "Researching & curating…" : "Generate course"}
        </button>
        {loading && (
          <p className="font-mono text-xs text-muted-2">
            This researches the topic, builds a syllabus, and searches YouTube
            for each sub-topic — it can take a minute or two.
          </p>
        )}
      </form>
    </div>
  );
}
