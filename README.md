# Lesson Hunter

A local-first tool that turns any topic into a structured video course by curating
existing YouTube content. No video creation, just intelligent research, sequencing
and selection. Lesson Hunter runs entirely on your own machine, in your real browser,
using your own LLM and YouTube API keys.

> **Alpha release.** This is early software. Expect rough edges, and please open an
> issue if something breaks.

---

## Why a local server instead of a desktop app

LessonHunter runs a small server on `localhost` and opens it in your **real, unmodified
default browser**. This is intentional: to embed
YouTube videos ad-free for Premium subscribers, the app needs you to be logged into
your real Google account in a browser. Google actively detects and blocks Google
login flows running inside embedded webviews, so a real browser is required for that to
work reliably.

---

## Requirements

- **Node.js 18+** and npm
- A **YouTube Data API v3** key (free, from your own Google Cloud project)
- An LLM provider — either:
  - a local **Ollama** install (no API key needed), or
  - an API key for **OpenAI**, **Anthropic**, **DeepSeek**, or **Gemini**

## Install

Clone the repository and install dependencies (this also installs the client
workspace):

```bash
git clone https://github.com/blitzmartin/lesson-hunter.git
cd lesson-hunter
npm install
```

Register the global `lessonhunter` command:

```bash
npm link
```

Build the frontend (required before running `lessonhunter` in production mode — see
[Running](#running) below):

```bash
npm run build
```

## Running

Once linked and built, launch the app from anywhere:

```bash
lessonhunter
```

This starts the local Express server, picks a free port automatically (starting from
`4173`, falling back to another free port if that's taken), and opens your system's
default browser to it. If your browser doesn't open automatically, the terminal prints
the URL to open manually, e.g.:

```
LessonHunter running at http://localhost:4173
```

### Developing

If you're working on LessonHunter itself rather than just using it, run the server and
Vite dev server together with hot reload instead of the built `lessonhunter` command:

```bash
npm run dev
```

## First-time setup

On first launch, go to **Setup** (gear icon) to configure:

1. **LLM provider** — either point at a local Ollama endpoint (default
   `http://localhost:11434`) and pick an installed model, or enter an API key for
   OpenAI, Anthropic, DeepSeek, or Gemini. Use **Test connection** to confirm it works
   before saving. Local Ollama models are usable but weaker at video-matching
   reasoning than cloud providers — the Setup screen shows a quality disclaimer.
2. **YouTube Data API key** — required for searching and selecting videos. Get your
   own free key from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (enable
   the "YouTube Data API v3"). Search operations are quota-expensive (currently ~200
   units per sub-topic against a 10,000/day default quota), so generating many or
   large courses in a single day may hit your daily limit — this is expected, not a
   bug, given the local single-user design.
3. **Browser cookie notice** — LessonHunter detects your browser and shows guidance on
   whether ad-free embedded playback will work for YouTube Premium subscribers:
   - **Chrome/Chromium**: works if third-party cookies are allowed for `youtube.com`.
   - **Safari/Firefox**: blocked by default tracking protection — embedded videos will
     show standard ads.
   - Regardless of browser, every video has an **"Open on YouTube"** button that opens
     the real `youtube.com` page in a new tab, which always guarantees ad-free
     playback for Premium subscribers.

Both your LLM API key and your YouTube API key are stored in your OS's secure
credential store (via `keytar`) — never written to disk in plain text.

## Using LessonHunter

1. **New course**: enter a topic, pick a skill level (beginner/intermediate/advanced),
   a language, a video count range (1–5 / 6–15 / 15–30), and optional notes (e.g.
   "focus on practical examples", "avoid framework X").
2. The AI agent researches the topic, builds an ordered syllabus of sub-topics, and
   picks the best-fitting YouTube video for each one — weighing relevance, appropriate
   duration, recency, and view count, with a short rationale for why each video was
   chosen.
3. **Course view**: a sidebar shows the syllabus and your progress; the main panel
   plays the selected video for the current sub-topic, with space for your own notes
   per topic. Mark topics complete as you go.

Courses are saved locally as flat JSON files under `~/.lessonhunter/courses/` — nothing
is sent to any server beyond your chosen LLM provider and the YouTube Data API.

## Uninstalling / resetting

- To remove the global command: `npm unlink -g lessonhunter` (or `npm rm --global
  lessonhunter`, run from the repo).
- To reset all local data (courses, settings): delete `~/.lessonhunter/`. To clear a
  stored provider/API key from the OS keychain, use **Setup → Reset** in-app rather
  than deleting the folder, since keys live in the OS keychain, not in that folder.

## Scope

Not in this release: exporting a course as a real YouTube playlist (requires OAuth),
multi-user/hosted use (this is a local single-user tool by design), and
transcript-based content verification.

## License

[PolyForm Shield 1.0.0](LICENSE) — free for any use, including commercial use of the
tool itself (e.g. a course creator using LessonHunter professionally), except building
a competing hosted/SaaS product from this code.
