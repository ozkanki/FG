// Pure logic for the Fluency Gym: planning reps, scoring, progression.
// No DOM access here so everything can be unit-tested in Node.

import { LEVELS, ACTIVITIES, INTERRUPTIONS, FILLERS } from './data.js';

// Deterministic PRNG (mulberry32) so tests and replays are reproducible.
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

export function sample(arr, n, rng = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

export function getLevel(levelId) {
  return LEVELS.find((l) => l.id === levelId);
}

export function getActivity(activityId) {
  return ACTIVITIES.find((a) => a.id === activityId);
}

export function activitiesForLevel(levelId) {
  return ACTIVITIES.filter((a) => a.level === levelId);
}

// Choose a prompt, avoiding recently used ones while any fresh ones remain.
export function pickPrompt(activity, rng = Math.random, recent = []) {
  const fresh = activity.prompts.filter((p) => !recent.includes(p));
  return pick(fresh.length ? fresh : activity.prompts, rng);
}

// Place interruption times inside a speaking window, avoiding the opening
// (so the speaker can get started) and the final seconds, with even spacing.
export function scheduleInterruptions(speakSec, count, rng = Math.random) {
  if (!count || speakSec < 20) return [];
  const start = Math.max(8, Math.round(speakSec * 0.2));
  const end = Math.round(speakSec * 0.85);
  const slot = (end - start) / count;
  const times = [];
  for (let i = 0; i < count; i++) {
    const lo = start + slot * i;
    const jitter = slot * 0.5 * rng();
    times.push(Math.round(lo + slot * 0.25 + jitter));
  }
  return times;
}

// Turn an activity definition into a concrete, timed plan for one rep.
// "heat" mode halves prep time and adds one interruption where relevant.
export function planActivity(activity, { rng = Math.random, heat = false, recentPrompts = [] } = {}) {
  const used = [...recentPrompts];
  let prompt = null;
  const extraInterruptions = heat && activity.interruptions ? 1 : 0;
  const interruptionCount = (activity.interruptions || 0) + extraInterruptions;

  const rounds = activity.rounds.map((round, i) => {
    if (i === 0 || round.fresh) {
      prompt = pickPrompt(activity, rng, used);
      used.push(prompt);
    }
    const prep = heat ? Math.floor(round.prep / 2) : round.prep;
    return {
      index: i,
      prep,
      speak: round.speak,
      prompt,
      reveal: activity.reveal ? pick(activity.reveal, rng) : null,
      requirements: null,
      interruptions: scheduleInterruptions(round.speak, interruptionCount, rng).map((at) => ({
        at,
        text: pick(INTERRUPTIONS, rng),
      })),
    };
  });

  if (activity.requirements) {
    const { pool, count, label } = activity.requirements;
    const items = sample(pool, count, rng);
    rounds.forEach((r) => (r.requirements = { label, items }));
  }

  // A revealed side stays the same across rounds of the same prompt.
  if (activity.reveal) {
    const side = rounds[0].reveal;
    rounds.forEach((r) => (r.reveal = r.prompt === rounds[0].prompt ? side : r.reveal));
  }

  return {
    activityId: activity.id,
    level: activity.level,
    heat,
    tts: Boolean(activity.tts),
    rounds,
    totalSpeakSeconds: rounds.reduce((s, r) => s + r.speak, 0),
  };
}

// ───────────────────────── Speech metrics ─────────────────────────

export function countWords(text = '') {
  const words = text.trim().match(/[\p{L}\p{N}'’-]+/gu);
  return words ? words.length : 0;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Counts filler words/phrases (whole words only, case-insensitive).
export function countFillers(text = '', fillers = FILLERS) {
  const lower = ` ${text.toLowerCase()} `;
  const byFiller = {};
  let total = 0;
  // Longer phrases first so "you know" is not also counted as something shorter.
  const sorted = [...fillers].sort((a, b) => b.length - a.length);
  let remaining = lower;
  for (const f of sorted) {
    const re = new RegExp(`(?<![\\p{L}'])${escapeRegex(f)}(?![\\p{L}'])`, 'gu');
    const matches = remaining.match(re);
    if (matches) {
      byFiller[f] = matches.length;
      total += matches.length;
      remaining = remaining.replace(re, ' ');
    }
  }
  return { total, byFiller };
}

export function wordsPerMinute(words, seconds) {
  if (!seconds || seconds <= 0) return 0;
  return Math.round((words / seconds) * 60);
}

// ───────────────────────── Scoring & progression ─────────────────────────

// XP rewards effort and recovery, not perfection: recovering from a freeze
// earns a bonus because that is the skill the gym is built to train.
export function repXp({ level, fluency = 0, freeze = 'none', heat = false }) {
  let xp = 10 * level;
  if (fluency >= 4) xp += 3;
  if (freeze === 'recovered') xp += 5;
  if (heat) xp *= 1.5;
  return Math.round(xp);
}

export function levelStats(history, levelId) {
  const reps = history.filter((h) => h.level === levelId);
  const distinct = new Set(reps.map((h) => h.activityId)).size;
  const rated = reps.filter((h) => typeof h.fluency === 'number');
  const avgFluency = rated.length ? rated.reduce((s, h) => s + h.fluency, 0) / rated.length : 0;
  const xp = reps.reduce((s, h) => s + (h.xp || 0), 0);
  return { reps: reps.length, distinct, avgFluency: Math.round(avgFluency * 10) / 10, xp };
}

export function unlockProgress(levelId, history) {
  const level = getLevel(levelId);
  if (!level || !level.unlock) return { unlocked: true, checks: [] };
  const { fromLevel, minReps, minDistinct, minAvgFluency } = level.unlock;
  const s = levelStats(history, fromLevel);
  const checks = [
    { label: `${minReps} reps in Level ${fromLevel}`, current: s.reps, target: minReps, met: s.reps >= minReps },
    { label: `${minDistinct} different activities`, current: s.distinct, target: minDistinct, met: s.distinct >= minDistinct },
    {
      label: `Average fluency rating ≥ ${minAvgFluency}`,
      current: s.avgFluency,
      target: minAvgFluency,
      met: s.reps > 0 && s.avgFluency >= minAvgFluency,
    },
  ];
  return { unlocked: checks.every((c) => c.met), checks };
}

export function isLevelUnlocked(levelId, history, { unlockAll = false } = {}) {
  if (unlockAll) return true;
  const level = getLevel(levelId);
  if (!level) return false;
  if (!level.unlock) return true;
  return isLevelUnlocked(level.unlock.fromLevel, history) && unlockProgress(levelId, history).unlocked;
}

export function highestUnlockedLevel(history, opts = {}) {
  return LEVELS.filter((l) => isLevelUnlocked(l.id, history, opts)).reduce((m, l) => Math.max(m, l.id), 1);
}

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Consecutive days with at least one rep, ending today (or yesterday, so the
// streak is not shown as broken before today's session).
export function currentStreak(history, today = new Date()) {
  const days = new Set(history.map((h) => dayKey(h.date)));
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Anxiety before vs. after reps — the key "is the gym working?" signal.
export function anxietyTrend(history, lastN = 10) {
  const rated = history.filter((h) => typeof h.anxietyBefore === 'number' && typeof h.anxietyAfter === 'number');
  const recent = rated.slice(-lastN);
  if (!recent.length) return null;
  const avg = (k) => Math.round((recent.reduce((s, h) => s + h[k], 0) / recent.length) * 10) / 10;
  const before = avg('anxietyBefore');
  const after = avg('anxietyAfter');
  return { before, after, change: Math.round((after - before) * 10) / 10, samples: recent.length };
}

// A daily workout: one Level 1 warm-up, then two main activities from the
// target level, preferring the ones practised least.
export function buildWorkout(levelId, history, rng = Math.random) {
  const counts = {};
  history.forEach((h) => (counts[h.activityId] = (counts[h.activityId] || 0) + 1));
  const leastPractised = (list) =>
    sample(list, list.length, rng).sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));

  const warmupPool = activitiesForLevel(1);
  const mainPool = activitiesForLevel(levelId);
  const warmup = leastPractised(warmupPool)[0];
  const main = leastPractised(mainPool.filter((a) => a.id !== warmup.id)).slice(0, 2);
  return [warmup, ...main].map((a) => a.id);
}
