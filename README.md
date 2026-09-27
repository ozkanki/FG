# Fluency Gym

A speaking-practice gym for **non-native language learners who freeze when they have to speak under pressure**: in meetings, interviews, phone calls, or whenever someone is waiting for an answer.

The design idea is simple. Speaking under pressure is a trainable skill, just like lifting heavier weights. The gym starts with low-pressure reps that make speech automatic. It then adds pressure step by step: less prep time, shrinking time limits, surprise interruptions and assigned opinions. It also trains the skill that matters most: **recovering from a freeze instead of stopping.**

## Quick start

```bash
npm start          # serves the app at http://localhost:8080
npm test           # runs the engine unit tests (Node 18+)
```

There are no dependencies and no build step. ES modules do not load from `file://`, so open the app through the included static server (or any other static server).

## The three levels

| | Level 1 · Foundation | Level 2 · Builder | Level 3 · Performance |
|---|---|---|---|
| **Zone** | Warm-Up Zone | Strength Zone | Arena |
| **Pressure** | Low | Medium | High |
| **Goal** | Make speaking automatic and safe | Organize ideas fast, recover from gaps | Stay fluent under real-world pressure |
| **Prep time** | Generous (10–30 s) | Shorter (5–20 s) | Little or none (0–10 s) |
| **Support** | Hints + recovery phrases on screen | Hints + recovery phrases on screen | Scaffolds removed (optional "training wheels") |
| **Unlock** | Open | 6 reps in L1, 3 different activities, avg fluency ≥ 3 | 8 reps in L2, 3 different activities, avg fluency ≥ 3 |

Experienced speakers can skip ahead in **Progress → Settings**.

## Speaking activities

### Level 1: Foundation (Warm-Up Zone)
- **Shadow Echo**: a model sentence is read aloud, and you repeat it right away, copying its rhythm. This builds automaticity with high-frequency phrases.
- **Chunk Reps**: say three sentences with one ready-made chunk ("The thing is…", "I'd rather… than…").
- **Picture This**: describe something familiar with a What / Where / Details / Feeling frame.
- **Easy Answers**: three friendly personal questions, each answered with Answer → Reason → Example.

### Level 2: Builder (Strength Zone)
- **4‑3‑2 Retell**: tell the same story three times in 90 → 60 → 45 seconds (after Nation's 4/3/2 technique).
- **PREP Answer**: give an opinion as Point → Reason → Example → Point.
- **Talk Around It**: explain a word without saying it (circumlocution). This is the core anti-freeze skill.
- **Real-World Role-Play**: returns, complaints, bookings and calls. The "other person" cuts in once.
- **Link It Up**: speak for 60 seconds using three randomly assigned connectors.

### Level 3: Performance (Arena)
- **Hot Seat**: six rapid-fire questions, with 3 seconds to think before each.
- **Curveball Talk**: a 90-second talk interrupted by surprise listener questions. You respond, then return to your point.
- **Mock Interview**: four interview questions with 5 seconds of prep each (STAR structure).
- **Devil's Advocate**: your side of the motion is revealed only when the timer starts.
- **Spotlight Talk**: a two-minute impromptu talk on a random word, with zero prep.

## Built-in anti-freeze support

- **Recovery Toolkit**: phrases for buying time, handling a missing word, clarifying, self-correcting, getting back on track, handling interruptions and finishing confidently. Tap a phrase to hear it.
- **Box-breathing reset**: a guided one-minute 4‑4‑4‑4 breathing exercise, suggested before Arena reps.
- **🔥 Heat mode**: on any rep, halve the prep time (and add an extra interruption where the activity has them) for ×1.5 XP.
- **Mindset tips** between reps that push back on perfectionism.

## Tracking progress

After every rep you rate **fluency** (1–5), **nerves now** (1–5, compared with the nerves rating you gave before starting) and whether you **froze** (no / froze & recovered / froze & stopped).

- **XP** rewards effort and recovery, not perfection. A freeze you recover from earns *bonus* XP.
- **Nerves check** compares your average nerves before and after reps, so you can see whether the pressure is getting easier to handle.
- **Streaks** count consecutive practice days.
- **Optional live transcript** (Chrome and Edge, via the Web Speech API) adds words per minute and a filler-word count (um, uh, like, you know…).

Progress is stored in your browser's `localStorage`. You can export it as JSON from the Progress page.

## Project structure

```
index.html          App shell
server.js           Zero-dependency static server (npm start)
src/data.js         Levels, activities, prompts, toolkit phrases: all content lives here
src/engine.js       Pure logic: rep planning, interruptions, metrics, XP, unlocking, streaks, workouts
src/app.js          Vanilla JS UI: screens, timer and phase machine, speech APIs, storage
src/styles.css      Styles (light/dark, responsive, reduced-motion aware)
test/engine.test.js Unit tests for the engine and content integrity
```

### Adding or localizing content

All content is plain data in `src/data.js`. An activity is described by:

```js
{
  id, level, name, skill, tagline, why, steps,
  rounds: [{ prep, speak, fresh }],   // seconds; fresh = draw a new prompt this round
  prompts: [...],
  tts: true,                          // optional: read the prompt aloud first (shadowing)
  interruptions: 2,                   // optional: surprise listener pop-ups per round
  reveal: ['Argue FOR', 'Argue AGAINST'], // optional: revealed when speaking starts
  requirements: { pool, count, label },   // optional: e.g. required connectors
  scaffolds: [...],                   // hints shown in levels 1–2
}
```

To practise a language other than English, translate the prompts and toolkit phrases, then set the speech language code (for example `es-ES` or `de-DE`) in Settings.
