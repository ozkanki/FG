import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, ACTIVITIES, TOOLKIT } from '../src/data.js';
import {
  createRng, planActivity, scheduleInterruptions, countWords, countFillers,
  wordsPerMinute, repXp, levelStats, unlockProgress, isLevelUnlocked,
  highestUnlockedLevel, currentStreak, anxietyTrend, buildWorkout, getActivity,
  pickPrompt, activitiesForLevel,
} from '../src/engine.js';

const rep = (level, activityId, extra = {}) => ({
  date: '2026-09-20T10:00:00Z', level, activityId, fluency: 3, anxietyBefore: 3, anxietyAfter: 2, freeze: 'none', xp: 10, ...extra,
});

test('content: three levels with increasing pressure', () => {
  assert.deepEqual(LEVELS.map((l) => l.id), [1, 2, 3]);
  assert.deepEqual(LEVELS.map((l) => l.pressure), ['Low', 'Medium', 'High']);
  for (const l of LEVELS) assert.ok(activitiesForLevel(l.id).length >= 4, `level ${l.id} needs activities`);
});

test('content: every activity is well-formed', () => {
  const ids = new Set();
  for (const a of ACTIVITIES) {
    assert.ok(!ids.has(a.id), `duplicate id ${a.id}`);
    ids.add(a.id);
    assert.ok(a.prompts.length >= 8, `${a.id} needs enough prompts`);
    assert.ok(a.rounds.length >= 1 && a.steps.length >= 2);
    for (const r of a.rounds) assert.ok(r.speak > 0 && r.prep >= 0);
    // The rounds' total must fit enough fresh prompts to avoid repeats within a rep.
    assert.ok(a.prompts.length >= a.rounds.filter((r) => r.fresh).length);
  }
  assert.ok(TOOLKIT.every((c) => c.phrases.length >= 3));
});

test('pressure rises: the Arena gives the least prep time', () => {
  const avgPrep = (lvl) => {
    const rounds = activitiesForLevel(lvl).flatMap((a) => a.rounds);
    return rounds.reduce((s, r) => s + r.prep, 0) / rounds.length;
  };
  assert.ok(avgPrep(3) < avgPrep(1));
  assert.ok(avgPrep(3) < avgPrep(2));
});

test('planActivity: fresh rounds get distinct prompts, repeated rounds keep the prompt', () => {
  const rng = createRng(42);
  const hot = planActivity(getActivity('hot-seat'), { rng });
  assert.equal(new Set(hot.rounds.map((r) => r.prompt)).size, hot.rounds.length);

  const retell = planActivity(getActivity('four-three-two'), { rng });
  assert.equal(new Set(retell.rounds.map((r) => r.prompt)).size, 1);
  assert.deepEqual(retell.rounds.map((r) => r.speak), [90, 60, 45]);
});

test('planActivity: heat halves prep and adds an interruption', () => {
  const act = getActivity('curveball');
  const normal = planActivity(act, { rng: createRng(1) });
  const heat = planActivity(act, { rng: createRng(1), heat: true });
  assert.equal(heat.rounds[0].prep, Math.floor(normal.rounds[0].prep / 2));
  assert.equal(heat.rounds[0].interruptions.length, normal.rounds[0].interruptions.length + 1);
});

test('planActivity: requirements and reveals are attached', () => {
  const link = planActivity(getActivity('link-it-up'), { rng: createRng(3) });
  assert.equal(link.rounds[0].requirements.items.length, 3);
  const devil = planActivity(getActivity('devils-advocate'), { rng: createRng(3) });
  assert.match(devil.rounds[0].reveal, /Argue (FOR|AGAINST)/);
});

test('pickPrompt avoids recent prompts while fresh ones remain', () => {
  const act = getActivity('spotlight');
  const recent = act.prompts.slice(0, -1);
  assert.equal(pickPrompt(act, createRng(9), recent), act.prompts.at(-1));
});

test('scheduleInterruptions: inside the window, sorted, not at the very start or end', () => {
  const times = scheduleInterruptions(90, 3, createRng(5));
  assert.equal(times.length, 3);
  assert.deepEqual([...times].sort((a, b) => a - b), times);
  assert.ok(times[0] >= 18 && times.at(-1) <= 90 * 0.85);
  assert.deepEqual(scheduleInterruptions(10, 3), []);
});

test('speech metrics', () => {
  assert.equal(countWords("Well, I don't know — it's hard."), 6);
  assert.equal(countWords(''), 0);
  const f = countFillers('Um, I mean, it was like, you know, uh, fine. I like it.');
  assert.equal(f.byFiller['you know'], 1);
  assert.equal(f.byFiller['i mean'], 1);
  assert.equal(f.byFiller.um, 1);
  assert.equal(f.byFiller.uh, 1);
  assert.equal(f.byFiller.like, 2);
  assert.equal(countFillers('umbrella likely').total, 0);
  assert.equal(wordsPerMinute(120, 60), 120);
  assert.equal(wordsPerMinute(50, 0), 0);
});

test('repXp rewards level, recovery and heat', () => {
  assert.equal(repXp({ level: 1, fluency: 3 }), 10);
  assert.equal(repXp({ level: 3, fluency: 4 }), 33);
  assert.equal(repXp({ level: 2, freeze: 'recovered' }), 25);
  assert.ok(repXp({ level: 1, freeze: 'recovered' }) > repXp({ level: 1, freeze: 'stopped' }));
  assert.equal(repXp({ level: 2, heat: true }), 30);
});

test('level unlocking requires reps, variety and average fluency', () => {
  assert.ok(isLevelUnlocked(1, []));
  assert.ok(!isLevelUnlocked(2, []));
  const l1 = ['shadow-echo', 'chunk-reps', 'picture-this'];
  const six = Array.from({ length: 6 }, (_, i) => rep(1, l1[i % 3]));
  assert.ok(isLevelUnlocked(2, six));
  assert.ok(!isLevelUnlocked(2, six.map((r) => ({ ...r, activityId: 'shadow-echo' }))), 'needs variety');
  assert.ok(!isLevelUnlocked(2, six.map((r) => ({ ...r, fluency: 2 }))), 'needs fluency');
  assert.equal(unlockProgress(2, six.slice(0, 2)).checks[0].current, 2);

  const l2 = ['four-three-two', 'prep-answer', 'talk-around-it'];
  const eight = Array.from({ length: 8 }, (_, i) => rep(2, l2[i % 3]));
  assert.ok(!isLevelUnlocked(3, eight), 'level 2 must also be unlocked');
  assert.ok(isLevelUnlocked(3, [...six, ...eight]));
  assert.equal(highestUnlockedLevel([...six, ...eight]), 3);
  assert.ok(isLevelUnlocked(3, [], { unlockAll: true }));
});

test('levelStats', () => {
  const s = levelStats([rep(1, 'a', { fluency: 2 }), rep(1, 'b', { fluency: 4 }), rep(2, 'c')], 1);
  assert.deepEqual(s, { reps: 2, distinct: 2, avgFluency: 3, xp: 20 });
});

test('currentStreak counts consecutive days, tolerating no rep yet today', () => {
  const at = (d) => ({ date: new Date(2026, 8, d, 12).toISOString() });
  const history = [at(20), at(22), at(23), at(24)];
  assert.equal(currentStreak(history, new Date(2026, 8, 24, 18)), 3);
  assert.equal(currentStreak(history, new Date(2026, 8, 25, 9)), 3);
  assert.equal(currentStreak(history, new Date(2026, 8, 27, 9)), 0);
});

test('anxietyTrend reports before/after change', () => {
  assert.equal(anxietyTrend([]), null);
  const t = anxietyTrend([rep(1, 'a', { anxietyBefore: 4, anxietyAfter: 2 }), rep(1, 'a', { anxietyBefore: 3, anxietyAfter: 3 })]);
  assert.deepEqual(t, { before: 3.5, after: 2.5, change: -1, samples: 2 });
});

test('buildWorkout: level 1 warm-up plus two least-practised activities from the target level', () => {
  const history = [rep(3, 'hot-seat'), rep(3, 'hot-seat'), rep(3, 'curveball')];
  const w = buildWorkout(3, history, createRng(7));
  assert.equal(w.length, 3);
  assert.equal(getActivity(w[0]).level, 1);
  assert.ok(w.slice(1).every((id) => getActivity(id).level === 3));
  assert.ok(!w.includes('hot-seat'));
  const w1 = buildWorkout(1, [], createRng(7));
  assert.equal(new Set(w1).size, 3);
});
