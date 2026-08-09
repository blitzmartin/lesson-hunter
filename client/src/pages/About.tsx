export default function About() {
  return (
    <div className="max-w-2xl space-y-16">
      <div>
        <p className="font-mono uppercase tracking-widest text-xs text-muted-2">
          About
        </p>
        <h1 className="font-display font-light uppercase tracking-tight text-4xl leading-[0.92] mt-3">
          Tailor-made courses: AI curated, human generated.
        </h1>
        <p className="text-muted mt-6">
          Lesson Hunter finds and sequences great existing YouTube videos into a
          course that builds logically from first principles to mastery. It
          doesn't make videos, host your data, or watch what you do — it just
          does the curation work so you don't have to.
        </p>
      </div>

      <div>
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
          01 — Everything stays on your machine
        </div>
        <p className="text-muted mt-4">
          There's no account to create, no login screen and no server of ours in
          the loop. Lesson Hunter runs as a small local program on your
          computer, right in your own browser. Your courses, notes and API keys
          live in a folder on your disk, not in a database we operate. We don't
          track what you search for, what you watch, or what you build. There's
          simply nothing to send anywhere: no analytics pinging home, no usage
          logs, no "phone home" of any kind. Close the terminal and it's gone:
          nothing keeps running, nothing keeps watching.
        </p>
      </div>

      <div>
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
          02 — AI plans the shelf. Humans wrote every book on it.
        </div>
        <p className="text-muted mt-4">
          The AI in Lesson Hunter has exactly one job: figure out a sensible
          order to learn something and search for the videos that best teach
          each step. It never writes a script, narrates a slide or generates a
          single frame of video. Every video in your course was written, filmed,
          edited and explained by an actual person who knows the subject and
          chose to teach it.
        </p>
        <p className="text-muted mt-4">
          We built it this way on purpose. A machine can outline a curriculum,
          but it can't tell you, in its own words, why a mistake you just made
          makes total sense given what you already know — the small human
          judgment calls, the timing of a joke that makes a hard idea stick.
          That's not a gap in the technology we're waiting to close. It's the
          whole reason the course is worth taking. Lesson Hunter's job is to get
          out of the way and point you at the people who can actually teach.
        </p>
      </div>
    </div>
  );
}
