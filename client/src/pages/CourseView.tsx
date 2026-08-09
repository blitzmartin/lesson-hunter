import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Course, type SyllabusEntry } from '../api';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CourseView() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeOrder, setActiveOrder] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getCourse(id).then((c) => {
      setCourse(c);
      setActiveOrder(c.syllabus[0]?.order ?? null);
    });
  }, [id]);

  useEffect(() => {
    const entry = course?.syllabus.find((s) => s.order === activeOrder);
    setNotesDraft(entry?.userNotes ?? '');
  }, [activeOrder, course]);

  if (!course) return <p className="font-mono text-sm text-muted-2">Loading…</p>;

  const active = course.syllabus.find((s) => s.order === activeOrder) as SyllabusEntry | undefined;

  const toggleCompleted = async (entry: SyllabusEntry) => {
    const updated = await api.updateSyllabusEntry(course.id, entry.order, { completed: !entry.completed });
    setCourse(updated);
  };

  const saveNotes = async () => {
    if (!active) return;
    const updated = await api.updateSyllabusEntry(course.id, active.order, { userNotes: notesDraft });
    setCourse(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      <aside className="border border-line bg-paper">
        <div className="p-6 border-b border-line">
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">{course.level}</span>
          <h2 className="font-display font-light uppercase tracking-tight text-xl leading-[0.95] mt-1">
            {course.topic}
          </h2>
        </div>
        <ol>
          {course.syllabus.map((entry) => (
            <li key={entry.order} className="border-b border-line last:border-b-0">
              <button
                onClick={() => setActiveOrder(entry.order)}
                className={`w-full text-left px-6 py-4 flex items-start gap-3 ${
                  entry.order === activeOrder ? 'bg-yellow' : 'hover:bg-paper-2'
                }`}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompleted(entry);
                  }}
                  className={`mt-0.5 inline-block w-4 h-4 border-2 border-ink flex-shrink-0 ${
                    entry.completed ? 'bg-ink' : 'bg-transparent'
                  }`}
                />
                <span className="text-sm leading-snug">
                  <span className="font-mono text-xs text-muted-2 mr-2">{entry.order}</span>
                  {entry.subTopicTitle}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>

      <section>
        {!active?.video && (
          <div className="border border-line bg-paper-2 p-16 text-center">
            <p className="font-mono text-sm text-muted-2">No video found for this sub-topic.</p>
          </div>
        )}

        {active?.video && (
          <>
            <div className="aspect-video border border-line bg-ink">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${active.video.youtubeId}`}
                title={active.video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="mt-6 flex items-start justify-between gap-6">
              <div>
                <h3 className="font-display font-light uppercase tracking-tight text-2xl leading-[0.95]">
                  {active.subTopicTitle}
                </h3>
                <p className="font-mono text-xs text-muted-2 mt-2">
                  {active.video.channelName} · {formatDuration(active.video.durationSeconds)} ·{' '}
                  {active.video.viewCount.toLocaleString()} views
                </p>
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${active.video.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 whitespace-nowrap hover:bg-ink hover:text-paper transition-colors"
              >
                Open on YouTube →
              </a>
            </div>

            <p className="text-muted mt-4 text-sm">
              <span className="font-mono uppercase tracking-widest text-xs text-muted-2 mr-2">
                Why this video
              </span>
              {active.video.selectionRationale}
            </p>

            <div className="mt-10">
              <div className="font-mono uppercase tracking-widest text-xs text-muted-2 border-t-2 border-ink pt-4 mb-3">
                Your notes
              </div>
              <textarea
                className="w-full border border-line bg-paper px-4 py-3 font-sans text-sm"
                rows={5}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={saveNotes}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
