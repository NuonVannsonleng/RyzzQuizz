# RyzzQuizz — Project Instructions for Claude Code

## What this is
Real-time Kahoot-style quiz/polling app. Final project for "Web Technologies and
Cloud Computing" course at RUPP. Host creates a room with a join code, players
join and answer live, results update in real time via WebSockets, and the app
is deployed to the cloud with a load-balanced/multi-instance setup.

## Tech stack
- Backend: [Spring Boot + WebSocket/STOMP | Node.js + Socket.io] — confirm choice
  before scaffolding, don't assume
- Frontend: React + TypeScript, Vite
- Database: MySQL (or Postgres) for persistent data (quizzes, questions, results
  history); Redis or in-memory store for live room/session state
- Deployment: cloud provider TBD (AWS free tier / Render / Railway) — must
  support WebSocket connections

## Core domain
- **Room**: created by a host, has a join code, a quiz, a list of connected
  players, and a state (lobby / question live / showing results / ended)
- **Quiz**: a set of questions, each with options, a correct answer, and a
  time limit
- **Player**: joined via room code + nickname, submits one answer per question
- **Answer**: tied to player + question, timestamped for scoring/speed bonus

## WebSocket event contract
Keep event names and payload shapes consistent across host and player clients.
When adding a new event, update both sides in the same change — don't let them
drift. Document new events inline where they're defined.

## Working style
- Build in phases: data model → room/session logic → WebSocket events →
  frontend → deployment. Confirm one phase is solid before moving to the next.
- Minimum viable path first — get the core loop (join → answer → live results)
  working end-to-end before adding polish (animations, sound, themes).
- Flag genuinely tricky parts before implementing them (disconnect handling,
  duplicate-answer prevention, timer sync across clients) rather than silently
  picking an approach.

## Code style
- Minimal comments — only key labeling/section comments, not explanatory prose.
- Keep WebSocket event handlers small and named clearly; push logic into
  services rather than inline in handlers.

## Out of scope unless asked
- Auth/user accounts beyond host session + player nickname
- Payment, monetization, or multi-tenant org features
- Anything not needed to demonstrate the core real-time + cloud requirements
  for grading