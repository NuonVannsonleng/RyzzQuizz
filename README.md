# RyzzQuizz

Real-time Kahoot-style quiz app with a Cambodian (MoEYS) curriculum quiz library.
Host opens a room, players join with a code and nickname, everyone answers against
a synced timer, results update live.

## Run it

```bash
npm install
npm run dev
```

- Host: http://localhost:5173/host — browse the quiz library, pick one, get a join code
- Player: http://localhost:5173 — enter the code + a nickname

Server runs on :3001; Vite proxies `/api` and `/socket.io` to it.

## Quiz library

86 quizzes / 1,332 questions, all served from the in-memory catalog under
`server/src/content/`. Curriculum quizzes hold 15 questions each; the fun
categories hold 18.

Each room gets its own copy of the quiz with **every question's options
shuffled** (`shuffleOptions` in `roomService.ts`), so a quiz plays differently
each game and the correct answer never settles into a predictable slot.

| Shelf | Contents |
| --- | --- |
| 🎓 កម្មវិធីសិក្សា · School Curriculum | 72 quizzes — grades 1–12 |
| 🌍 ទាយប្រទេស · Country Guess | Flags (emoji), capitals, landmarks, world facts |
| ⭐ ទាយតារា · Celebrity Guess | World stars, Khmer stars |
| 🎬 កម្សាន្ត · Entertainment | Movies & series, music & K-pop, anime & gaming |
| ⚽ កីឡា · Sports | Football, Olympics, SEA Games, Kun Khmer |
| 🇰🇭 វប្បធម៌ខ្មែរ · Khmer Culture | Dance, festivals, food, Bokator |
| 💡 ចំណេះដឹងទូទៅ · General | World food, tech & internet, space & science |

Curriculum coverage follows the MoEYS structure — questions and options are in
Khmer, with an English gloss as the quiz subtitle:

- **Grades 1–6** (បឋមសិក្សា): ភាសាខ្មែរ · គណិតវិទ្យា · វិទ្យាសាស្ត្រ · សិក្សាសង្គម
- **Grades 7–12** (មធ្យមសិក្សា): the above plus រូបវិទ្យា · គីមីវិទ្យា · ជីវវិទ្យា ·
  ប្រវត្តិវិទ្យា · ភូមិវិទ្យា · ភាសាអង់គ្លេស

Content lives one file per grade (`grade7.ts` … `grade12.ts`, plus `primaryLower.ts`
and `primaryUpper.ts`) and two category files. Adding a quiz is one entry in the
matching file — `eduQuiz(grade, subject, [...])` for curriculum,
`funQuiz(id, title, subtitle, category, emoji, [...])` for a category.
`validate()` runs at import time, so a bad `correctIndex` or a duplicate id fails
the boot rather than a live game.

### Catalog API

| Route | Returns |
| --- | --- |
| `GET /api/catalog` | Totals and per-category counts for the picker |
| `GET /api/quizzes?category=&grade=&subject=&search=` | Filtered quiz summaries |
| `GET /api/quizzes/:id` | Quiz preview — question text only, never `correctIndex` |

## Authentication

Additive, not required — hosting and joining a game never need an account.
Postgres-backed (`users` table only; see `server/src/db/migrations/`), password
hashing via `bcryptjs`, session is a JWT in an httpOnly cookie (not
localStorage, not a sessions table). Run `npm run db:migrate` once you've
pointed `.env` at a real database (see `.env.example`).

| Route | Does |
| --- | --- |
| `POST /api/auth/register` | `{username, email, password}` → creates the account, sets the session cookie |
| `POST /api/auth/login` | `{emailOrUsername, password}` → generic error on any failure, never reveals which part was wrong |
| `POST /api/auth/logout` | Clears the session cookie |
| `GET /api/auth/me` | Current user from the cookie, or 401 |

## Layout

| Path | What's in it |
| --- | --- |
| `shared/src/domain.ts` | Domain model — Room, Quiz, Player, Answer |
| `shared/src/events.ts` | **WebSocket event contract** — both clients import this |
| `shared/src/catalog.ts` | Subject/category vocabulary + Khmer numerals, shared by server content and client picker |
| `server/src/content/` | The quiz catalog (primary / lower / upper secondary / categories) |
| `server/src/services/` | Room lifecycle, scoring, quiz store, auth |
| `server/src/socket/` | Socket handlers (thin — they delegate to services) |
| `server/src/db/schema.sql` | Full reference schema (`CREATE DATABASE` on down) — `users` is live, the rest mirrors the in-memory room store and isn't wired up yet |
| `server/src/db/migrations/` | Applied in order by `npm run db:migrate` (`server/src/db/migrate.ts`) |
| `client/src/pages/` | Home (join), Host, Play, Dev, Login, Signup |
| `client/src/components/QuizLibrary.tsx` | Host-side shelf browser with grade/subject filters |
| `client/src/lib/authContext.tsx` | `AuthProvider`/`useAuth()` — mirrors server session state, never owns it |

## Event contract

Defined once in [`shared/src/events.ts`](shared/src/events.ts) and imported by
server and client, so a changed payload is a type error on both sides rather
than a runtime surprise. Add new events there first.

**Client → server:** `host:create` · `host:resume` · `host:start` · `host:next` ·
`host:skip` · `host:end` · `player:join` · `player:answer` · `player:leave`

**Server → client:** `room:state` · `room:players` · `room:closed` ·
`question:start` · `question:answered` · `question:results` · `game:over` ·
`error:msg`

## How the tricky parts are handled

**Timer sync.** The server sends `endsAt` in its own clock alongside `serverNow`.
Clients store the offset and count down against that, so a device with a skewed
clock still sees the same deadline. The server deadline is authoritative — a
late answer is rejected even if the client's countdown hasn't hit zero.

**Duplicate answers.** `submitAnswer` rejects a second answer for the same
question, and the `answers` table has a matching `UNIQUE (player_id, question_id)`.

**Disconnects.** Dropping marks a player offline but keeps their score for a
45s grace period; rejoining with the stored `playerId` reclaims it and replays
the current room state. Players are only reaped if they're still gone and the
room is back in the lobby. A host refresh recovers via `host:resume` + a
`hostToken` held in sessionStorage.

**Answer counts.** While a question is live, clients get only how *many* people
have answered — never the per-option tally, which would leak the answer.

## Scoring

1000 points for a correct answer, half of it a speed bonus that decays linearly
over the question's time limit. Wrong answers score 0.

## Deployment

`Dockerfile` builds the client and serves it from the API server on one port,
so there's a single origin and no CORS in production. `/api/health` returns the
`INSTANCE_ID`, which is how you demonstrate which instance served you.

Works as-is on Render / Railway / a single EC2 instance — all of which support
WebSocket upgrades.

### Before running more than one instance

Room state currently lives in each process's memory. Behind a load balancer that
breaks: a room created on instance A is invisible to a player routed to instance
B, and sticky sessions don't fix it (stickiness is per client, not per room).

Making the multi-instance requirement real needs two changes:

1. `@socket.io/redis-adapter` so broadcasts reach sockets on every instance
2. Room/session state moved from the `Map` in `roomService.ts` into Redis

`roomService` is the only module that touches that `Map`, so this is contained
to one file. Worth doing before the deployment demo.

## Motion

All motion pulls from one vocabulary in [`client/src/lib/motion.ts`](client/src/lib/motion.ts)
so the app reads as one system:

| Moment | What happens |
| --- | --- |
| Answer tiles | Kahoot-style shape + colour per slot (triangle / diamond / circle / square), cascading in on a 60 ms stagger |
| Locking an answer | Picked tile scales up and takes a white inset ring; the others fade to 35% |
| Timer | SVG ring drains as the clock runs down, digit re-keys and pops each second, both turn red under 5s |
| Results (host) | Bars grow from zero on a left-to-right stagger, counts roll up, correct bar gets a ✓ |
| Verdict (player) | Full green/red card, icon springs in, points count up, confetti on correct, 🔥 streak badge |
| Leaderboard | `layout` reorder held back `REORDER_DELAY_MS` so the verdict lands first, then rows slide past each other with scores counting up |
| Game over | 2nd · 1st · 3rd podium columns rise on a heavier spring, two-sided confetti |

Shapes carry the same information as colour, so the answer grid still works for
colour-blind players. Every confetti call is a no-op under
`prefers-reduced-motion`, and `MotionConfig reducedMotion="user"` degrades
transforms to opacity across the app.

## Khmer text rendering

No webfont is downloaded — the CSS stack falls back through `Khmer UI` (ships with
Windows), `Noto Sans Khmer`, and `Khmer OS`, so the app renders correctly offline
on a classroom projector. Line-height is raised to 1.5–1.55 wherever Khmer appears,
because Khmer stacks subscripts and vowel signs above and below the baseline and
clips at tighter leading.

## Status

Phases 1–4 (data model → room logic → WebSocket events → frontend) are done and
verified end-to-end, now with the quiz catalog, a one-click developer mode
(`/dev` — simulated players, see `server/src/services/botService.ts`), and
Postgres-backed login/signup on top. Still open: quiz ownership/creation,
Redis for multi-instance, and picking a cloud provider.
