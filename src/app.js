// Fluency Gym UI — vanilla JS, no build step.
import { LEVELS, TOOLKIT, MINDSET_TIPS } from './data.js';
import {
  getLevel, getActivity, activitiesForLevel, planActivity, repXp, levelStats,
  unlockProgress, isLevelUnlocked, highestUnlockedLevel, currentStreak,
  anxietyTrend, buildWorkout, countWords, countFillers, wordsPerMinute, pick,
} from './engine.js';

const STORAGE_KEY = 'fluency-gym-v1';
const app = document.getElementById('app');

// ───────────────────────── Persistence ─────────────────────────

const defaultStore = () => ({
  history: [],
  recentPrompts: {},
  settings: { unlockAll: false, transcript: false, sound: true, lang: 'en-US' },
});

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw);
    return { ...defaultStore(), ...parsed, settings: { ...defaultStore().settings, ...parsed.settings } };
  } catch {
    return defaultStore();
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — progress lives for this tab only */
  }
}

let store = loadStore();
let view = { name: 'home' };

// ───────────────────────── Helpers ─────────────────────────

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const unlockOpts = () => ({ unlockAll: store.settings.unlockAll });
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
const canSpeak = 'speechSynthesis' in window;

function say(text, onEnd) {
  if (!canSpeak || !store.settings.sound) {
    onEnd?.();
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = store.settings.lang;
  u.rate = 0.95;
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      onEnd?.();
    }
  };
  u.onend = finish;
  u.onerror = finish;
  // Safety net in case the browser never fires onend.
  setTimeout(finish, 2500 + text.length * 90);
  speechSynthesis.speak(u);
}

let audioCtx;
function beep(freq = 660, ms = 120) {
  if (!store.settings.sound) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch {
    /* audio not available */
  }
}

function navigate(next) {
  stopTimer();
  stopRecognition();
  if (canSpeak) speechSynthesis.cancel();
  view = next;
  render();
  window.scrollTo(0, 0);
}

// ───────────────────────── Rendering ─────────────────────────

function render() {
  const screens = { home: renderHome, level: renderLevel, run: renderRun, toolkit: renderToolkit, progress: renderProgress, breathe: renderBreathe };
  app.innerHTML = `
    <header class="topbar">
      <button class="brand" data-nav="home" aria-label="Home">
        <span class="logo" aria-hidden="true">◆</span> Fluency Gym
      </button>
      <nav>
        <button data-nav="toolkit" class="${view.name === 'toolkit' ? 'active' : ''}">Toolkit</button>
        <button data-nav="breathe" class="${view.name === 'breathe' ? 'active' : ''}">Reset</button>
        <button data-nav="progress" class="${view.name === 'progress' ? 'active' : ''}">Progress</button>
      </nav>
    </header>
    <main>${screens[view.name]()}</main>`;
  bindCommon();
  if (view.name === 'breathe') startBreathing();
}

function bindCommon() {
  app.querySelectorAll('[data-nav]').forEach((el) =>
    el.addEventListener('click', () => navigate({ name: el.dataset.nav })),
  );
  app.querySelectorAll('[data-level]').forEach((el) =>
    el.addEventListener('click', () => navigate({ name: 'level', levelId: Number(el.dataset.level) })),
  );
  app.querySelectorAll('[data-activity]').forEach((el) =>
    el.addEventListener('click', () => startRun([el.dataset.activity])),
  );
  app.querySelectorAll('[data-say]').forEach((el) => el.addEventListener('click', () => say(el.dataset.say)));
  app.querySelectorAll('[data-action]').forEach((el) => el.addEventListener('click', (e) => actions[el.dataset.action]?.(e, el)));
}

function statTiles() {
  const h = store.history;
  const xp = h.reduce((s, r) => s + (r.xp || 0), 0);
  const trend = anxietyTrend(h);
  return `
    <div class="tiles">
      <div class="tile"><span class="tile-num">${currentStreak(h)}</span><span class="tile-label">day streak</span></div>
      <div class="tile"><span class="tile-num">${h.length}</span><span class="tile-label">reps done</span></div>
      <div class="tile"><span class="tile-num">${xp}</span><span class="tile-label">total XP</span></div>
      <div class="tile"><span class="tile-num">${trend ? (trend.change <= 0 ? '' : '+') + trend.change : '—'}</span>
        <span class="tile-label">nerves after vs. before</span></div>
    </div>`;
}

function renderHome() {
  const top = highestUnlockedLevel(store.history, unlockOpts());
  const levelCards = LEVELS.map((level) => {
    const unlocked = isLevelUnlocked(level.id, store.history, unlockOpts());
    const stats = levelStats(store.history, level.id);
    const progress = unlockProgress(level.id, store.history);
    const lockInfo = unlocked
      ? `<p class="muted">${stats.reps} reps · avg fluency ${stats.avgFluency || '—'} · ${stats.xp} XP</p>`
      : `<ul class="checks">${progress.checks
          .map((c) => `<li class="${c.met ? 'met' : ''}">${c.met ? '✓' : '○'} ${esc(c.label)} <span class="muted">(${c.current}/${c.target})</span></li>`)
          .join('')}</ul>`;
    return `
      <article class="level-card ${unlocked ? '' : 'locked'}" style="--accent:${level.color}">
        <div class="level-head">
          <span class="level-num">Level ${level.id}</span>
          <span class="pressure">${esc(level.pressure)} pressure</span>
        </div>
        <h3>${esc(level.name)} <span class="zone">· ${esc(level.zone)}</span></h3>
        <p><strong>${esc(level.goal)}</strong></p>
        <p class="muted">${esc(level.description)}</p>
        ${lockInfo}
        <button class="btn ${unlocked ? '' : 'ghost'}" ${unlocked ? `data-level="${level.id}"` : 'disabled'}>
          ${unlocked ? 'Enter' : '🔒 Locked'}
        </button>
      </article>`;
  }).join('');

  return `
    <section class="hero">
      <h1>Train your speaking for the moments that matter.</h1>
      <p>Three levels take you from low-pressure warm-ups to real-world pressure: shorter prep, surprise questions, no safety net. Short daily reps. The aim is to keep talking, not to be perfect.</p>
      <div class="hero-actions">
        <button class="btn big" data-action="workout">Start today's workout · Level ${top}</button>
        <button class="btn ghost" data-nav="breathe">60-second calm-down first</button>
      </div>
      <p class="tip">💡 ${esc(pick(MINDSET_TIPS))}</p>
    </section>
    ${statTiles()}
    <section class="levels">${levelCards}</section>`;
}

function activityCard(a) {
  const total = a.rounds.reduce((s, r) => s + r.prep + r.speak, 0);
  return `
    <article class="activity-card">
      <div class="activity-meta"><span class="chip">${esc(a.skill)}</span><span class="muted">≈ ${Math.ceil(total / 60)} min · ${a.rounds.length} round${a.rounds.length > 1 ? 's' : ''}</span></div>
      <h3>${esc(a.name)}</h3>
      <p>${esc(a.tagline)}</p>
      <details><summary>Why it works</summary><p class="muted">${esc(a.why)}</p></details>
      <button class="btn" data-activity="${a.id}">Start</button>
    </article>`;
}

function renderLevel() {
  const level = getLevel(view.levelId);
  if (!isLevelUnlocked(level.id, store.history, unlockOpts())) return renderHome();
  return `
    <button class="back" data-nav="home">← All levels</button>
    <section class="level-banner" style="--accent:${level.color}">
      <span class="level-num">Level ${level.id} · ${esc(level.pressure)} pressure</span>
      <h2>${esc(level.name)} — ${esc(level.zone)}</h2>
      <p>${esc(level.description)}</p>
      <button class="btn" data-action="workout-level" data-id="${level.id}">Quick workout (3 activities)</button>
    </section>
    <section class="activity-grid">${activitiesForLevel(level.id).map(activityCard).join('')}</section>`;
}

function renderToolkit() {
  return `
    <section class="page-head">
      <h2>Recovery Toolkit</h2>
      <p class="muted">Freezing usually starts with one missing word or one surprise question. These phrases keep you talking while your brain catches up. Tap a phrase to hear it, then say it out loud three times.</p>
    </section>
    <section class="toolkit-grid">${TOOLKIT.map((cat) => `
      <article class="toolkit-card">
        <h3>${esc(cat.title)}</h3>
        <p class="muted">${esc(cat.when)}</p>
        <ul>${cat.phrases.map((p) => `<li><button class="phrase" data-say="${esc(p)}">${esc(p)}</button></li>`).join('')}</ul>
      </article>`).join('')}
    </section>`;
}

function renderProgress() {
  const h = store.history;
  const trend = anxietyTrend(h);
  const levelRows = LEVELS.map((l) => {
    const s = levelStats(h, l.id);
    return `<tr><td>Level ${l.id} · ${esc(l.name)}</td><td>${s.reps}</td><td>${s.distinct}</td><td>${s.avgFluency || '—'}</td><td>${s.xp}</td></tr>`;
  }).join('');
  const recent = h.slice(-15).reverse().map((r) => {
    const a = getActivity(r.activityId);
    const metrics = r.wpm ? ` · ${r.wpm} wpm · ${r.fillers} fillers` : '';
    return `<li><span class="chip" style="--accent:${getLevel(r.level).color}">L${r.level}</span>
      <strong>${esc(a ? a.name : r.activityId)}</strong>
      <span class="muted">${new Date(r.date).toLocaleDateString()} · fluency ${r.fluency}/5 · nerves ${r.anxietyBefore}→${r.anxietyAfter} · ${esc(freezeLabel(r.freeze))}${metrics}${r.heat ? ' · 🔥' : ''} · +${r.xp} XP</span>
      ${r.note ? `<div class="note">“${esc(r.note)}”</div>` : ''}</li>`;
  }).join('');
  const s = store.settings;
  return `
    <section class="page-head"><h2>Progress</h2></section>
    ${statTiles()}
    ${trend ? `<section class="panel"><h3>Nerves check (last ${trend.samples} reps)</h3>
      <div class="bars">
        <div class="bar-row"><span>Before</span><div class="bar"><div style="width:${trend.before * 20}%"></div></div><span>${trend.before}/5</span></div>
        <div class="bar-row"><span>After</span><div class="bar after"><div style="width:${trend.after * 20}%"></div></div><span>${trend.after}/5</span></div>
      </div>
      <p class="muted">${trend.change < 0 ? 'Speaking is lowering your nerves. You are getting used to the pressure.' : 'Nerves are not dropping yet. That is normal early on. Keep doing short, regular reps.'}</p></section>` : ''}
    <section class="panel"><h3>By level</h3>
      <table><thead><tr><th>Level</th><th>Reps</th><th>Activities</th><th>Avg fluency</th><th>XP</th></tr></thead><tbody>${levelRows}</tbody></table>
    </section>
    <section class="panel"><h3>Recent reps</h3>${recent ? `<ul class="history">${recent}</ul>` : '<p class="muted">No reps yet. Start with a Level 1 warm-up.</p>'}</section>
    <section class="panel settings"><h3>Settings</h3>
      <label><input type="checkbox" data-setting="sound" ${s.sound ? 'checked' : ''}> Sounds & read-aloud</label>
      <label><input type="checkbox" data-setting="transcript" ${s.transcript ? 'checked' : ''} ${SpeechRec ? '' : 'disabled'}>
        Live transcript: words per minute & filler count ${SpeechRec ? '' : '<span class="muted">(not supported in this browser)</span>'}</label>
      <label>Speech language <input type="text" data-setting="lang" value="${esc(s.lang)}" size="7" aria-label="Speech language code"></label>
      <label><input type="checkbox" data-setting="unlockAll" ${s.unlockAll ? 'checked' : ''}> Skip ahead: unlock all levels (for experienced speakers)</label>
      <div class="row">
        <button class="btn ghost" data-action="export">Export data</button>
        <button class="btn danger" data-action="reset">Reset progress</button>
      </div>
    </section>`;
}

function renderBreathe() {
  return `
    <section class="breathe">
      <h2>Box breathing reset</h2>
      <p class="muted">Before a high-pressure speaking moment, slow breathing calms your body's stress response. Four rounds take about a minute.</p>
      <div class="breath-circle" id="breath-circle"><span id="breath-text">Get ready…</span></div>
      <p id="breath-count" class="muted"></p>
      <button class="btn" data-nav="home">Done</button>
    </section>`;
}

let breathTimer;
function startBreathing() {
  clearTimeout(breathTimer);
  const steps = [
    ['Breathe in', 'grow'],
    ['Hold', 'grow'],
    ['Breathe out', 'shrink'],
    ['Hold', 'shrink'],
  ];
  let i = 0;
  const cycles = 4;
  const run = () => {
    const circle = document.getElementById('breath-circle');
    if (!circle || view.name !== 'breathe') return;
    if (i >= steps.length * cycles) {
      document.getElementById('breath-text').textContent = 'Ready ✓';
      circle.className = 'breath-circle';
      return;
    }
    const [label, cls] = steps[i % 4];
    circle.className = `breath-circle ${cls}`;
    document.getElementById('breath-text').textContent = label;
    document.getElementById('breath-count').textContent = `Round ${Math.floor(i / 4) + 1} of ${cycles}`;
    i++;
    breathTimer = setTimeout(run, 4000);
  };
  breathTimer = setTimeout(run, 1200);
}

// ───────────────────────── Run (a rep) ─────────────────────────

function startRun(queue, anxietyBefore) {
  const activity = getActivity(queue[0]);
  const last = store.history[store.history.length - 1];
  navigate({
    name: 'run',
    queue,
    activity,
    phase: 'brief',
    heat: false,
    showHints: getLevel(activity.level).showScaffolds,
    anxietyBefore: anxietyBefore ?? last?.anxietyAfter ?? 3,
  });
}

function freezeLabel(f) {
  return { none: 'no freeze', recovered: 'froze & recovered', stopped: 'froze & stopped' }[f] || f;
}

function renderRun() {
  const { activity, phase } = view;
  const level = getLevel(activity.level);
  const header = `
    <div class="run-head" style="--accent:${level.color}">
      <button class="back" data-action="quit">✕ Quit</button>
      <span class="level-num">Level ${level.id} · ${esc(level.zone)}</span>
      ${view.queue.length > 1 ? `<span class="muted">${view.queue.length - 1} more after this</span>` : ''}
    </div>`;
  if (phase === 'brief') return header + renderBrief(activity, level);
  if (phase === 'rate') return header + renderRate(activity);
  if (phase === 'result') return header + renderResult(activity);
  return header + renderLive(activity, level);
}

function scale(name, value, labels) {
  return `<div class="scale" role="radiogroup">${[1, 2, 3, 4, 5]
    .map((n) => `<label title="${esc(labels[n - 1])}"><input type="radio" name="${name}" value="${n}" ${n === value ? 'checked' : ''}><span>${n}</span></label>`)
    .join('')}</div><div class="scale-legend"><span>${esc(labels[0])}</span><span>${esc(labels[4])}</span></div>`;
}

const NERVES = ['Calm', 'A little tense', 'Nervous', 'Very nervous', 'Panicking'];
const FLUENCY = ['Many long stops', 'Choppy', 'OK with pauses', 'Mostly smooth', 'Smooth & natural'];

function renderBrief(activity, level) {
  const total = activity.rounds.reduce((s, r) => s + r.prep + r.speak, 0);
  return `
    <section class="brief">
      <span class="chip">${esc(activity.skill)}</span>
      <h2>${esc(activity.name)}</h2>
      <p class="lead">${esc(activity.tagline)}</p>
      <ol class="steps">${activity.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p class="muted">${activity.rounds.length} round${activity.rounds.length > 1 ? 's' : ''} · about ${fmtTime(total)} total. Speak out loud, even if you are alone.</p>
      <div class="panel">
        <h3>How nervous do you feel right now?</h3>
        ${scale('anxietyBefore', view.anxietyBefore, NERVES)}
      </div>
      <div class="row wrap">
        <label class="toggle"><input type="checkbox" id="heat" ${view.heat ? 'checked' : ''}> 🔥 Turn up the heat (half prep time${activity.interruptions ? ', extra interruption' : ''}, ×1.5 XP)</label>
        ${level.showScaffolds ? '' : `<label class="toggle"><input type="checkbox" id="hints" ${view.showHints ? 'checked' : ''}> Show hints (training wheels)</label>`}
      </div>
      ${level.id === 3 ? '<p class="tip">Arena tip: do the <button class="linklike" data-nav="breathe">box-breathing reset</button> first if your heart is racing.</p>' : ''}
      <button class="btn big" data-action="begin">I'm ready — start</button>
    </section>`;
}

function currentRound() {
  return view.plan.rounds[view.roundIdx];
}

function renderLive(activity, level) {
  const round = currentRound();
  const { phase } = view;
  const phaseLabel = { listen: 'Listen', prep: 'Prepare', speak: 'Speak!' }[phase];
  const showToolkit = level.showToolkit || view.showHints;
  const hints = view.showHints && activity.scaffolds?.length
    ? `<div class="hints"><h4>Hints</h4><ul>${activity.scaffolds.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : '';
  const reveal = round.reveal
    ? phase === 'speak'
      ? `<div class="reveal">${esc(round.reveal)}</div>`
      : `<div class="reveal pending">Your side is revealed when speaking starts…</div>` : '';
  const reqs = round.requirements
    ? `<div class="reqs"><span class="muted">${esc(round.requirements.label)}:</span> ${round.requirements.items.map((i) => `<span class="chip">${esc(i)}</span>`).join(' ')}</div>` : '';
  const quick = showToolkit
    ? `<aside class="quick-kit"><h4>If you get stuck</h4><ul>${TOOLKIT.slice(0, 5).map((c) => `<li>${esc(c.phrases[0])}</li>`).join('')}</ul></aside>` : '';
  return `
    <section class="live phase-${phase} ${level.id === 3 ? 'arena' : ''}" style="--accent:${level.color}">
      <div class="round-info">Round ${view.roundIdx + 1} of ${view.plan.rounds.length}${view.plan.heat ? ' · 🔥' : ''}</div>
      <div class="prompt-card">
        <div class="prompt">${esc(round.prompt)}</div>
        ${reqs}${reveal}
      </div>
      <div class="timer-wrap">
        <div class="phase-label">${phaseLabel}</div>
        <div class="timer" id="timer">${phase === 'listen' ? '🔊' : fmtTime(view.remaining ?? 0)}</div>
        <div class="progress"><div id="progress-bar"></div></div>
      </div>
      <div id="interruption" class="interruption" hidden></div>
      <div id="live-transcript" class="transcript" ${store.settings.transcript && SpeechRec ? '' : 'hidden'}></div>
      <div class="row center">
        <button class="btn ghost" data-action="pause" id="pause-btn">${view.paused ? 'Resume' : 'Pause'}</button>
        <button class="btn ghost" data-action="skip">${phase === 'speak' ? 'Finished early' : 'Skip'} →</button>
      </div>
      <div class="side">${hints}${quick}</div>
    </section>`;
}

function renderRate(activity) {
  const secs = view.spokenSeconds || 0;
  const words = countWords(view.transcript || '');
  const fillers = countFillers(view.transcript || '');
  const hasTranscript = store.settings.transcript && SpeechRec && words > 0;
  view.metrics = hasTranscript ? { wpm: wordsPerMinute(words, secs), fillers: fillers.total, words } : null;
  const fillerList = Object.entries(fillers.byFiller).map(([f, n]) => `${esc(f)} ×${n}`).join(', ');
  return `
    <section class="rate">
      <h2>How did that feel?</h2>
      <p class="muted">Rate honestly. The ratings are for tracking your progress, not for judging you.</p>
      ${hasTranscript ? `<div class="tiles small">
        <div class="tile"><span class="tile-num">${view.metrics.wpm}</span><span class="tile-label">words / min</span></div>
        <div class="tile"><span class="tile-num">${words}</span><span class="tile-label">words</span></div>
        <div class="tile"><span class="tile-num">${fillers.total}</span><span class="tile-label">fillers${fillerList ? `: ${fillerList}` : ''}</span></div>
      </div>` : ''}
      <div class="panel"><h3>Fluency: how smoothly did you keep going?</h3>${scale('fluency', 3, FLUENCY)}</div>
      <div class="panel"><h3>Nerves now</h3>${scale('anxietyAfter', view.anxietyBefore, NERVES)}</div>
      <div class="panel"><h3>Did you freeze?</h3>
        <div class="choices">
          ${['none', 'recovered', 'stopped'].map((f, i) => `<label><input type="radio" name="freeze" value="${f}" ${i === 0 ? 'checked' : ''}> ${esc(freezeLabel(f))}</label>`).join('')}
        </div>
        <p class="muted small">Freezing and then recovering earns bonus XP, because recovering is the skill you are training here.</p>
      </div>
      <div class="panel"><h3>One note for next time (optional)</h3>
        <input type="text" id="note" maxlength="200" placeholder="e.g. I need a phrase for when I lose my point">
      </div>
      <button class="btn big" data-action="save">Save rep</button>
    </section>`;
}

function renderResult(activity) {
  const rep = view.savedRep;
  const next = view.queue.slice(1);
  const level = getLevel(activity.level);
  const nextLevel = LEVELS.find((l) => l.id === level.id + 1);
  const justUnlocked = view.newlyUnlocked;
  return `
    <section class="result">
      <div class="xp-burst">+${rep.xp} XP</div>
      <h2>${rep.freeze === 'recovered' ? 'You froze and kept going. That is exactly the skill. 💪' : rep.fluency >= 4 ? 'Strong rep! 💪' : 'Rep complete. Every rep counts. 💪'}</h2>
      ${justUnlocked ? `<div class="unlock-banner" style="--accent:${justUnlocked.color}">🔓 Level ${justUnlocked.id} · ${esc(justUnlocked.name)} unlocked!</div>` : ''}
      <p class="tip">💡 ${esc(pick(MINDSET_TIPS))}</p>
      ${!justUnlocked && nextLevel && !isLevelUnlocked(nextLevel.id, store.history, unlockOpts()) ? `<div class="panel"><h3>Road to Level ${nextLevel.id}</h3><ul class="checks">${unlockProgress(nextLevel.id, store.history).checks
        .map((c) => `<li class="${c.met ? 'met' : ''}">${c.met ? '✓' : '○'} ${esc(c.label)} <span class="muted">(${c.current}/${c.target})</span></li>`).join('')}</ul></div>` : ''}
      <div class="row center wrap">
        ${next.length ? `<button class="btn big" data-action="next">Next: ${esc(getActivity(next[0]).name)} →</button>` : ''}
        <button class="btn ${next.length ? 'ghost' : ''}" data-action="again">Go again</button>
        <button class="btn ghost" data-level="${level.id}">Back to Level ${level.id}</button>
      </div>
    </section>`;
}

// ───────────────────────── Timer & phases ─────────────────────────

let tickHandle;
let phaseToken = 0;
function stopTimer() {
  clearInterval(tickHandle);
  tickHandle = null;
  phaseToken += 1;
}

function enterPhase(phase) {
  stopTimer();
  stopRecognition();
  if (canSpeak) speechSynthesis.cancel();
  const round = currentRound();
  const token = (phaseToken += 1);
  view.phase = phase;
  view.paused = false;
  view.shown = new Set();

  if (phase === 'listen') {
    render();
    // Speech callbacks can fire late (or after a skip); only act on the current phase.
    const go = () => token === phaseToken && view.name === 'run' && nextPhase();
    if (canSpeak && store.settings.sound) say(round.prompt, () => setTimeout(go, 250));
    else setTimeout(go, 3000);
    return;
  }

  const duration = phase === 'prep' ? round.prep : round.speak;
  view.duration = duration;
  view.remaining = duration;
  view.endsAt = Date.now() + duration * 1000;
  render();
  beep(phase === 'speak' ? 880 : 520, phase === 'speak' ? 220 : 120);
  if (phase === 'speak') startRecognition();
  tickHandle = setInterval(tick, 100);
  tick();
}

function tick() {
  if (view.paused) return;
  const msLeft = view.endsAt - Date.now();
  const remaining = Math.max(0, Math.ceil(msLeft / 1000));
  if (remaining !== view.remaining && remaining > 0 && remaining <= 3 && getLevel(view.activity.level).id === 3) beep(440, 60);
  view.remaining = remaining;
  const timer = document.getElementById('timer');
  const bar = document.getElementById('progress-bar');
  if (timer) {
    timer.textContent = fmtTime(remaining);
    timer.classList.toggle('urgent', remaining <= 5);
  }
  if (bar) bar.style.width = `${100 - (msLeft / (view.duration * 1000)) * 100}%`;

  if (view.phase === 'speak') {
    const elapsed = view.duration - msLeft / 1000;
    currentRound().interruptions.forEach((it, i) => {
      if (!view.shown.has(i) && elapsed >= it.at) {
        view.shown.add(i);
        showInterruption(it.text);
      }
    });
  }
  if (msLeft <= 0) nextPhase();
}

function showInterruption(text) {
  const box = document.getElementById('interruption');
  if (!box) return;
  box.innerHTML = `<span class="speaker">🗣️ Listener:</span> “${esc(text)}”<div class="muted small">Respond, then say “Anyway, as I was saying…” and carry on.</div>`;
  box.hidden = false;
  box.classList.remove('pop');
  void box.offsetWidth;
  box.classList.add('pop');
  beep(300, 180);
  // Reading it aloud would be picked up by the transcript, so only when that is off.
  if (!store.settings.transcript) say(text);
  clearTimeout(box._hide);
  box._hide = setTimeout(() => (box.hidden = true), 7000);
}

function nextPhase() {
  const round = currentRound();
  if (view.phase === 'speak') {
    const leftMs = view.paused ? view.pausedLeft : Math.max(0, view.endsAt - Date.now());
    view.spokenSeconds = (view.spokenSeconds || 0) + (round.speak * 1000 - leftMs) / 1000;
  }
  const order = [view.plan.tts ? 'listen' : null, round.prep > 0 ? 'prep' : null, 'speak'].filter(Boolean);
  const idx = order.indexOf(view.phase);
  if (idx < order.length - 1) return enterPhase(order[idx + 1]);
  if (view.roundIdx < view.plan.rounds.length - 1) {
    view.roundIdx++;
    const r = currentRound();
    return enterPhase(view.plan.tts ? 'listen' : r.prep > 0 ? 'prep' : 'speak');
  }
  stopTimer();
  stopRecognition();
  beep(990, 300);
  view.phase = 'rate';
  render();
}

// ───────────────────────── Speech recognition ─────────────────────────

let recognition;
function startRecognition() {
  if (!store.settings.transcript || !SpeechRec) return;
  recognition = new SpeechRec();
  recognition.lang = store.settings.lang;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) view.transcript = `${view.transcript || ''} ${res[0].transcript}`.trim();
      else interim += res[0].transcript;
    }
    const box = document.getElementById('live-transcript');
    if (box) box.innerHTML = `${esc((view.transcript || '').split(' ').slice(-40).join(' '))} <span class="muted">${esc(interim)}</span>`;
  };
  // Browsers end recognition after silence; restart while still speaking.
  recognition.onend = () => {
    if (recognition && view.name === 'run' && view.phase === 'speak' && !view.paused) {
      try { recognition.start(); } catch { /* already started */ }
    }
  };
  try { recognition.start(); } catch { /* permission denied or busy */ }
}

function stopRecognition() {
  if (!recognition) return;
  const r = recognition;
  recognition = null;
  try { r.stop(); } catch { /* ignore */ }
}

// ───────────────────────── Actions ─────────────────────────

const readScale = (name) => Number(app.querySelector(`input[name="${name}"]:checked`)?.value);

const actions = {
  workout: () => startRun(buildWorkout(highestUnlockedLevel(store.history, unlockOpts()), store.history)),
  'workout-level': (e, el) => startRun(buildWorkout(Number(el.dataset.id), store.history)),
  quit: () => navigate({ name: 'level', levelId: view.activity.level }),
  begin: () => {
    view.anxietyBefore = readScale('anxietyBefore') || 3;
    view.heat = app.querySelector('#heat')?.checked || false;
    const hints = app.querySelector('#hints');
    if (hints) view.showHints = hints.checked;
    const recent = store.recentPrompts[view.activity.id] || [];
    view.plan = planActivity(view.activity, { heat: view.heat, recentPrompts: recent });
    store.recentPrompts[view.activity.id] = [...recent, ...view.plan.rounds.map((r) => r.prompt)].slice(-8);
    view.roundIdx = 0;
    view.transcript = '';
    view.spokenSeconds = 0;
    const first = view.plan.rounds[0];
    enterPhase(view.plan.tts ? 'listen' : first.prep > 0 ? 'prep' : 'speak');
  },
  pause: () => {
    if (view.phase === 'listen') return;
    if (view.paused) {
      view.paused = false;
      view.endsAt = Date.now() + view.pausedLeft;
      if (view.phase === 'speak') startRecognition();
    } else {
      view.paused = true;
      view.pausedLeft = view.endsAt - Date.now();
      stopRecognition();
    }
    document.getElementById('pause-btn').textContent = view.paused ? 'Resume' : 'Pause';
  },
  skip: () => nextPhase(),
  save: () => {
    const levelBefore = highestUnlockedLevel(store.history, unlockOpts());
    const rep = {
      date: new Date().toISOString(),
      level: view.activity.level,
      activityId: view.activity.id,
      fluency: readScale('fluency') || 3,
      anxietyBefore: view.anxietyBefore,
      anxietyAfter: readScale('anxietyAfter') || view.anxietyBefore,
      freeze: app.querySelector('input[name="freeze"]:checked')?.value || 'none',
      heat: view.heat,
      seconds: Math.round(view.spokenSeconds || 0),
      note: app.querySelector('#note')?.value.trim() || '',
      ...(view.metrics ? { wpm: view.metrics.wpm, fillers: view.metrics.fillers, words: view.metrics.words } : {}),
    };
    rep.xp = repXp(rep);
    store.history.push(rep);
    saveStore();
    const levelAfter = highestUnlockedLevel(store.history, unlockOpts());
    view.savedRep = rep;
    view.newlyUnlocked = levelAfter > levelBefore ? getLevel(levelAfter) : null;
    view.phase = 'result';
    render();
  },
  next: () => startRun(view.queue.slice(1), view.savedRep.anxietyAfter),
  again: () => startRun([view.activity.id], view.savedRep.anxietyAfter),
  export: () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'fluency-gym-progress.json' });
    a.click();
    URL.revokeObjectURL(a.href);
  },
  reset: () => {
    if (!confirm('Delete all your reps and progress? This cannot be undone.')) return;
    store = defaultStore();
    saveStore();
    render();
  },
};

app.addEventListener('change', (e) => {
  const key = e.target.dataset?.setting;
  if (!key) return;
  store.settings[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim() || 'en-US';
  saveStore();
  if (key === 'unlockAll') render();
});

document.addEventListener('keydown', (e) => {
  if (view.name !== 'run' || !['listen', 'prep', 'speak'].includes(view.phase)) return;
  if (e.target.matches('input, textarea')) return;
  if (e.code === 'Space') { e.preventDefault(); actions.pause(); }
  if (e.key === 'ArrowRight') actions.skip();
});

render();
