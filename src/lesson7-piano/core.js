/* =====================================================================
   迷你電子琴實驗室 — 設定（老師可修改這裏）
   ===================================================================== */
const CONFIG = {
  TEACHER_PASSWORD: 'dt2026',          // 教師模式密碼
  SIGN_KEY: ['SOS', 'Lab', 'DT', 'uno', '7Qm', '2026'].join('~'), // 報告驗證用的密鑰（改了之後舊報告會驗證失敗）
  APP: 'Mini-Piano-Lab',
  VERSION: 1,
};

/* ---------------- tiny helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now = () => Date.now();
const fmtDur = sec => { sec = Math.max(0, Math.round(sec || 0)); const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m} 分 ${String(s).padStart(2,'0')} 秒` : `${s} 秒`; };
const fmtTime = t => { const d = new Date(t); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const clockOf = t => { const d = new Date(t); const p = n => String(n).padStart(2, '0'); return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ICON = {
  err: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.9 3.5h1.8l-.2 5H7.3zM8 12.6a1 1 0 110-2 1 1 0 010 2z"/></svg>',
  ok: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-1 10.2L3.8 8l1.2-1.2 2 2 4-4L12.2 6z"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5L.8 14h14.4zM7.2 6h1.6l-.2 4.2H7.4zM8 12.8a.9.9 0 110-1.8.9.9 0 010 1.8z"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.8 5.5h1.6V12H7.2zM8 3.6a1 1 0 110 2 1 1 0 010-2z"/></svg>',
};
const alertBox = (kind, html) => `<div class="alert ${kind}">${ICON[kind]}<div>${html}</div></div>`;

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function modal({ title, html, actions = [{ label: '好', kind: 'primary' }], wide = false, onOpen, dismissable = true }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><h3>${title}</h3><div class="mbody">${html}</div><div class="actions"></div></div>`;
  const close = () => back.remove();
  const act = $('.actions', back);
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.kind || ''); b.textContent = a.label;
    b.onclick = async () => { const keep = a.onClick ? await a.onClick(back) : false; if (keep !== true) close(); };
    act.appendChild(b);
  });
  if (!actions.length) act.remove();
  if (dismissable) back.addEventListener('pointerdown', e => { if (e.target === back) close(); });
  $('#modalRoot').appendChild(back);
  if (onOpen) onOpen(back, close);
  const f = $('input:not([type=range])', back) || $('.actions .btn:last-child', back);
  if (f) setTimeout(() => f.focus(), 30);
  return close;
}

function askPassword(title, onOk) {
  modal({
    title,
    html: `<div class="field"><label for="pwIn">教師密碼</label><input id="pwIn" type="password" autocomplete="off"></div><div class="form-err" id="pwErr"></div>`,
    actions: [
      { label: '取消', kind: 'ghost' },
      { label: '確定', kind: 'primary', onClick: back => {
        const v = $('#pwIn', back).value;
        if (v !== CONFIG.TEACHER_PASSWORD) { $('#pwErr', back).textContent = '密碼不正確。'; return true; }
        onOk(); return false;
      } },
    ],
    onOpen: back => $('#pwIn', back).addEventListener('keydown', e => { if (e.key === 'Enter') $('.actions .btn.primary', back).click(); }),
  });
}

/* save a generated file: artifact viewer capability first, plain download otherwise */
async function saveFile(filename, text, mime) {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) {
        try { await dl.save({ filename, data: text }); return 'saved'; }
        catch (e) {
          if (e && e.code === 'declined') return 'declined';
          if (e && e.code === 'rate_limited') { toast('請稍等一下再按一次。'); return 'declined'; }
        }
      }
    }
  } catch (e) { /* fall through */ }
  const blob = new Blob([text], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  return 'saved';
}

/* ---------------- state ---------------- */
const STORE_KEY = 'pianoLab.v1.state';
const STAGES = ['intro', 'hw', 'code', 'real', 'ext', 'report'];
/* sub-views of the extension stage reuse the hardware / IDE sections (challenge 2 has no wiring) */
const VIEWS = { c1hw: { section: 'hw', stepper: 'ext' }, c1code: { section: 'code', stepper: 'ext' }, c2code: { section: 'code', stepper: 'ext' } };
const stepperOf = name => (VIEWS[name] ? VIEWS[name].stepper : name);
const sectionOf = name => (VIEWS[name] ? VIEWS[name].section : name);
let S = null;
let teacherOn = false;

function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function recall(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function forget(k) { try { localStorage.removeItem(k); } catch (e) {} }

let saveTimer = 0;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { if (S) store(STORE_KEY, S); }, 250); }

function randId() { const a = new Uint8Array(6); (crypto.getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256)); return SHA.hex(a).toUpperCase(); }

const ATTEMPT_KEY = (cls, no) => 'pianoLab.attempts.' + cls + '.' + no;
function newState(student) {
  const akey = ATTEMPT_KEY(student.cls, student.no);
  const attempt = (recall(akey) || 0) + 1; store(akey, attempt);
  const com = 'COM' + (3 + Math.floor(Math.random() * 6));
  return {
    v: 1, id: randId(), student, attempt, teacherUsed: false,
    startedAt: now(), finishedAt: null,
    stage: 'intro', unlocked: 0,
    t: { intro: now() },
    hw: newHw({ color: '#D63A2F' }),
    code: { blanks: {}, checks: 0, done: false, log: [] },
    up: { usb: false, board: null, port: null, com, verified: false, uploaded: false, errors: 0, log: [], lastErrSig: '', baud: 115200, monitorOk: false },
    real: { checks: {}, confirmed: false, song: false },
    ext: newExt(),
  };
}
function newHw(extra = {}) { return { parts: [], wires: [], step: 0, errors: 0, hints: 0, hinted: {}, log: [], done: false, lastFailSig: '', stepFails: {}, ...extra }; }
function newExt() {
  const flow = () => ({ errors: 0, verified: false, uploaded: false, log: [], lastErrSig: '' });
  const one = hw => ({ hw, code: { blanks: {}, checks: 0, done: false, log: [] }, flow: flow(), t: {}, done: false, confirmed: false });
  return { c1: one(newHw()), c2: one(newHw({ done: true, none: true })) };   // challenge 2 needs no new wiring
}
/* progress saved by an older version of this page */
function migrate(st) {
  if (!st.ext) st.ext = newExt();
  if (!st.real.wl) st.real.wl = {};
  return st;
}

function pushLog(obj, msg) {
  if (!obj.log) obj.log = [];
  obj.log.push({ t: now(), msg });
  save();
}
function logEv(sec, msg, counted = true) {
  if (!S[sec].log) S[sec].log = [];
  S[sec].log.push({ t: now(), msg, counted });
  save();
}

/* ---------------- scoring ---------------- */
/* only finished parts score: an early (unfinished) report gets 0 for the parts not yet done */
function scores(st = S) {
  const done = { hw: !!st.hw.done, code: !!st.code.done, up: !!st.up.uploaded };
  const hw = done.hw ? Math.max(16, 40 - 4 * st.hw.errors - 2 * st.hw.hints) : 0;
  let code = 0;
  if (done.code) BLANKS.forEach(b => { const x = st.code.blanks[b.id] || {}; code += x.revealed ? 1 : Math.max(2, 5 - Math.min(3, x.wrong || 0) - (x.hinted ? 1 : 0)); });
  const up = done.up ? Math.max(8, 20 - 3 * st.up.errors) : 0;
  const total = hw + code + up;
  const grade = total >= 85 ? '優異' : total >= 70 ? '良好' : total >= 50 ? '合格' : '仍需努力';
  return { hw, code, up, total, grade, complete: done.hw && done.code && done.up };
}
const mainDone = (st = S) => !!(st && st.hw.done && st.code.done && st.up.uploaded);
/* "未完成？先交報告": a partial report; the student can carry on and hand in a full one later */
function earlySubmit() {
  if (!S || mainDone()) return;
  const okBlanks = BLANKS.filter(b => (S.code.blanks[b.id] || {}).status === 'ok').length;
  const li = (label, done, extra) => `<li>${label}：${done ? '<b style="color:var(--ok)">已完成 ✔</b>' : `<b style="color:var(--err)">未完成</b>（0 分${extra ? '，' + extra : ''}）`}</li>`;
  modal({
    title: '未完成，先交報告？',
    html: `<p>你還未完成全部任務。報告只會計<b>已完成</b>的部分：</p>
      <ul class="tight" style="margin:8px 0 12px">${li('硬件接線', S.hw.done)}${li('程式填空', S.code.done, `已答對 ${okBlanks} / ${BLANKS.length} 格`)}${li('上傳流程', S.up.uploaded)}</ul>
      <p>報告會寫明「<b>未完成（提早提交）</b>」。交了之後，你仍然可以<b>繼續做</b>；完成後再下載一份完整報告交給老師，老師會用<b>最新</b>的一份。</p>`,
    actions: [{ label: '取消', kind: 'ghost' }, { label: '產生未完成報告', kind: 'go', onClick: () => {
      if (S.stage !== 'report') S.resume = S.stage;
      S.early = true; save(); goStage('report');
    } }],
  });
}
$('#earlyBtn').onclick = earlySubmit;
/* extension challenges: 10 points each, reported separately (not part of the 100)
   challenge 1 has wiring (wiring 4, code 4, upload 2); challenge 2 is code only (code 8, upload 2) */
function extScores(st = S) {
  const e = st.ext; const res = { c1: null, c2: null };
  if (!e) return res;
  [['c1', C1_BLANKS], ['c2', C2_BLANKS]].forEach(([k, bls]) => {
    const x = e[k]; if (!x.done) return;
    const bl = bls.map(b => x.code.blanks[b.id] || {});
    const wrong = bl.reduce((a, y) => a + (y.wrong || 0), 0), rev = bl.filter(y => y.revealed).length, hn = bl.filter(y => y.hinted).length;
    const up = Math.max(0, 2 - (x.flow.errors || 0));
    if (k === 'c1') { const hw = Math.max(1, 4 - x.hw.errors - x.hw.hints), code = Math.max(1, 4 - wrong - 2 * rev - hn); res[k] = { hw, code, up, total: hw + code + up, wrong, rev, hn }; }
    else { const code = Math.max(3, 8 - wrong - 2 * rev - hn); res[k] = { hw: null, code, up, total: code + up, wrong, rev, hn }; }
  });
  return res;
}

/* ---------------- navigation ---------------- */
const stageInit = {};
const stageLeave = {};
function goStage(name) {
  if (!S) return;
  const idx = STAGES.indexOf(stepperOf(name));
  if (idx < 0 || (idx > S.unlocked && !teacherOn && !(name === 'report' && S.early))) return;
  Object.values(stageLeave).forEach(f => { try { f(); } catch (e) {} });
  S.stage = name; save();
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-' + sectionOf(name)).hidden = false;
  renderStepper();
  window.scrollTo({ top: 0 });
  if (stageInit[name]) stageInit[name]();
}
function unlock(name) {
  const idx = STAGES.indexOf(name);
  if (idx > S.unlocked) { S.unlocked = idx; save(); }
  renderStepper();
}
function renderStepper() {
  $$('#stepper button').forEach((b, i) => {
    const st = b.dataset.stage;
    b.disabled = !S || (i > S.unlocked && !teacherOn && !(st === 'report' && S.early && !mainDone()));
    const cur = S && stepperOf(S.stage) === st;
    b.classList.toggle('current', !!cur);
    b.classList.toggle('done', !!(S && i < S.unlocked && !cur));
  });
  $('#who').textContent = S ? `${S.student.cls} · ${S.student.no} · ${S.student.name}` : '';
  $('#earlyBtn').hidden = !S || mainDone() || S.stage === 'report';
}
$$('#stepper button').forEach(b => b.addEventListener('click', () => goStage(b.dataset.stage)));

/* ---------------- music helpers (shared) ---------------- */
/* the four keys of the mini piano: button → pin, note, frequency (Hz) */
const KEYS = [
  { k: 'do', name: 'Do', f: 262, pin: 'D2', n: 2, v: 'doKey', kb: ['1', 'a'] },
  { k: 're', name: 'Re', f: 294, pin: 'D3', n: 3, v: 'reKey', kb: ['2', 's'] },
  { k: 'mi', name: 'Mi', f: 330, pin: 'D4', n: 4, v: 'miKey', kb: ['3', 'd'] },
  { k: 'so', name: 'So', f: 392, pin: 'D5', n: 5, v: 'soKey', kb: ['4', 'f'] },
];
const keyOf = k => KEYS.find(x => x.k === k);
/* 音階頻率卡 (rounded to whole Hz, as used with tone()) */
const SCALE = [['Do', 262], ['Re', 294], ['Mi', 330], ['Fa', 349], ['So', 392], ['La', 440], ['Ti', 494], ['高音 Do', 523]];
const noteName = f => { const s = SCALE.find(x => x[1] === +f); return s ? s[0] : null; };
/* 瑪莉有隻小綿羊 (first line): only Do, Re, Mi, So */
const SONG = { name: '瑪莉有隻小綿羊', notes: ['mi', 're', 'do', 're', 'mi', 'mi', 'mi', 're', 're', 're', 'mi', 'so', 'so'], bars: [4, 3, 3, 3] };
const songFreqs = () => SONG.notes.map(k => keyOf(k).f);

function scaleHTML() {
  const used = KEYS.map(k => k.f);
  return `<div class="scale" role="table" aria-label="音階頻率卡">${SCALE.map(([n, f]) => `<div class="sc-n${used.includes(f) ? ' use' : ''}" role="row"><b>${n}</b><span>${f} Hz</span></div>`).join('')}</div>`;
}
/* the on-screen piano: 4 keys (press and hold); opts.pins shows the Arduino pin on each key */
function pianoHTML(opts = {}) {
  return `<div class="piano${opts.small ? ' small' : ''}">${KEYS.map((x, i) => `<button type="button" class="pkey" data-key="${x.k}" aria-label="${x.name} 鍵（${x.f} Hz）"><b>${x.name}</b><span>${x.f} Hz</span>${opts.pins ? `<em>${x.pin}</em>` : ''}<kbd>${i + 1}</kbd></button>`).join('')}</div>`;
}
/* press / release handling for pianoHTML keys and the number keys 1–4 (A S D F); returns an unbind function */
function bindPiano(root, onChange) {
  const down = new Set();
  const fire = () => onChange(KEYS.filter(x => down.has(x.k)).map(x => x.k));
  const set = (k, on) => { if (on === down.has(k)) return; on ? down.add(k) : down.delete(k); $$(`.pkey[data-key="${k}"]`, root).forEach(b => b.classList.toggle('down', on)); fire(); };
  $$('.pkey', root).forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); SOUND.unlock(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set(b.dataset.key, true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set(b.dataset.key, false)));
  });
  const kd = e => { if (e.repeat || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return; const x = KEYS.find(q => q.kb.includes(e.key.toLowerCase())); if (x) { SOUND.unlock(); set(x.k, true); } };
  const ku = e => { const x = KEYS.find(q => q.kb.includes(e.key.toLowerCase())); if (x) set(x.k, false); };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  return { off: () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); [...down].forEach(k => set(k, false)); }, set };
}
/* the program's choice: if … else if … – the first pressed key from the top wins */
const firstKey = pressed => KEYS.find(x => pressed.includes(x.k)) || null;
/* song guide: highlights the next note; press(k) moves on when the right note is played */
function songHTML() {
  let i = 0;
  return `<div class="song" aria-label="${SONG.name}的音符">${SONG.bars.map(n => `<span class="bar">${Array.from({ length: n }, () => { const k = SONG.notes[i]; return `<i data-si="${i++}">${keyOf(k).name}</i>`; }).join('')}</span>`).join('')}</div>`;
}
function songTracker(root, onDone) {
  let pos = 0;
  const draw = () => { $$('.song i', root).forEach(el => { const j = +el.dataset.si; el.classList.toggle('done', j < pos); el.classList.toggle('next', j === pos); }); };
  draw();
  return {
    press(k) {
      if (pos >= SONG.notes.length) { pos = 0; draw(); }
      if (SONG.notes[pos] === k) { pos++; draw(); if (pos === SONG.notes.length && onDone) onDone(); }
    },
    reset() { pos = 0; draw(); },
  };
}
/* light sensor model for challenge 1 (as lessons 4–5: averaged readings, classroom light ≈ 330, hand covering ≈ 700) */
const LIGHT = {
  THR_MIN: 420, THR_MAX: 620,
  base: d => { d = Math.max(0, Math.min(100, d)); return Math.round(d <= 40 ? 60 + (330 - 60) * d / 40 : 330 + (700 - 330) * (d - 40) / 60); },
  read: d => Math.max(0, Math.min(1023, LIGHT.base(d) + Math.round((Math.random() - 0.5) * 20))),
  label: d => d < 15 ? '很光（窗邊）' : d < 55 ? '課室燈光' : d < 85 ? '手慢慢移近' : '用手遮住',
};
function gaugeHTML(val, thr) {
  return `<div class="gauge" aria-hidden="true"><div class="gtrack">${thr != null ? `<i class="gthr" style="left:${thr / 1023 * 100}%"><span>門檻 ${thr}</span></i>` : ''}<i class="gval" style="left:${val / 1023 * 100}%"><span>${val}</span></i></div><div class="gends"><span>0（很光）</span><span>1023（很暗）</span></div></div>`;
}
function setGauge(el, val) {
  const v = el && $('.gval', el); if (!v) return;
  v.style.left = (val / 1023 * 100) + '%'; $('span', v).textContent = val;
}
/* the button + INPUT_PULLUP idea: click the button to see HIGH / LOW */
function pullupSVG(pressed) {
  return `<svg viewBox="0 0 330 150" class="pullup" aria-label="INPUT_PULLUP 示意圖：按鈕${pressed ? '按下' : '放開'}">
    <rect x="6" y="10" width="128" height="130" rx="10" fill="#0E7C9B"/><text x="70" y="30" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">Arduino 內部</text>
    <text x="30" y="56" font-size="11" fill="#fff">5V</text><path d="M44 52H70V62" stroke="#FFD27A" stroke-width="2.4" fill="none"/>
    <rect x="62" y="62" width="16" height="34" rx="3" fill="#FFF3D6" stroke="#E0A63A"/><text x="88" y="84" font-size="10" fill="#fff">內置電阻</text>
    <path d="M70 96V112H160" stroke="#FFD27A" stroke-width="2.4" fill="none"/><circle cx="70" cy="112" r="3.5" fill="#FFD27A"/>
    <text x="70" y="132" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">D2</text>
    <path d="M160 112H186" stroke="#999" stroke-width="2.4"/>
    <g class="pu-btn" style="cursor:pointer"><rect x="186" y="88" width="48" height="40" rx="5" fill="#2B2F33"/><circle cx="210" cy="108" r="${pressed ? 9 : 11}" fill="${pressed ? '#8E1B12' : '#C9352A'}"/>
</g>
    <path d="M234 112H262" stroke="#999" stroke-width="2.4"/><text x="286" y="116" font-size="12" fill="var(--ink)" font-weight="700">GND</text>
    <text x="210" y="80" font-size="11" fill="var(--ink-2)" text-anchor="middle">${pressed ? '按下：D2 接到 GND' : '放開：D2 不接 GND'}</text>
  </svg>`;
}
/* ---------------- login ---------------- */
let heroStop = null;
/* the keyboard on the login page plays the song silently (lights only) */
function heroLoop() {
  let i = 0, stopped = false, timer = 0;
  const tick = () => {
    if (stopped) return;
    const k = SONG.notes[i % SONG.notes.length], x = keyOf(k);
    $$('#heroWrap .pkey').forEach(b => b.classList.toggle('down', b.dataset.key === k));
    const r = $('#heroRead'); if (r) r.innerHTML = `按下 <b>${x.name}</b> 鍵（${x.pin}）→ <code>tone(8, ${x.f})</code> → 蜂鳴器每秒震動 <b>${x.f}</b> 次`;
    timer = setTimeout(() => { $$('#heroWrap .pkey').forEach(b => b.classList.remove('down')); timer = setTimeout(() => { i++; tick(); }, 140); }, (i % SONG.notes.length) >= 11 || [2, 6, 9].includes(i % SONG.notes.length) ? 760 : 420);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
function showLogin() {
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-login').hidden = false;
  renderStepper();
  if (!$('#heroWrap .piano')) $('#heroWrap').innerHTML = pianoHTML();
  if (!heroStop) heroStop = heroLoop();
  const saved = recall(STORE_KEY);
  const box = $('#resumeBox');
  if (saved && saved.student) {
    const stName = { intro: '簡介', hw: '硬件接線', code: '編程及上傳', real: '實物挑戰', ext: '延伸挑戰', report: '成績報告' }[STAGES[migrate(saved).unlocked]] || '';
    box.hidden = false;
    box.innerHTML = alertBox('info', `這部電腦有 <b>${esc(saved.student.cls)} · ${esc(saved.student.no)} · ${esc(saved.student.name)}</b> 未完成的進度（已到：${stName}）。
      <div class="row" style="margin-top:8px"><button type="button" class="btn sm primary" id="resumeBtn">繼續這個進度</button></div>`);
    $('#resumeBtn').onclick = () => { S = saved; startApp(); };
  } else box.hidden = true;
}
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#inName').value.trim(), cls = $('#inCls').value.trim().toUpperCase(), no = $('#inNo').value.trim();
  const err = $('#loginErr');
  if (!name) return err.textContent = '請輸入姓名。';
  if (!/^[1-6][A-Z]$/.test(cls) && !/^[A-Z0-9]{1,6}$/.test(cls)) return err.textContent = '班別格式不正確，例如：2A。';
  if (!/^\d{1,3}$/.test(no) || +no < 1) return err.textContent = '學號只可以填數字，例如：12。';
  err.textContent = '';
  const saved = recall(STORE_KEY);
  const begin = () => { S = newState({ name, cls, no: String(+no) }); save(); startApp(); };
  if (saved && saved.student && !(saved.student.cls === cls && saved.student.no === String(+no) && saved.student.name === name)) {
    modal({
      title: '開始新的任務？',
      html: `<p>這部電腦已有 <b>${esc(saved.student.cls)} · ${esc(saved.student.no)} · ${esc(saved.student.name)}</b> 的進度。開始新任務會取代它。</p>`,
      actions: [{ label: '取消', kind: 'ghost' }, { label: '開始新任務', kind: 'go', onClick: begin }],
    });
  } else if (saved && saved.student) {
    modal({
      title: '已有你的進度',
      html: `<p>要繼續上次的進度，還是重新開始？重新開始會在成績報告上記錄為第 ${(recall(ATTEMPT_KEY(cls, String(+no))) || 1) + 1} 次嘗試。</p>`,
      actions: [{ label: '重新開始', kind: 'ghost', onClick: begin }, { label: '繼續上次進度', kind: 'primary', onClick: () => { S = saved; startApp(); } }],
    });
  } else begin();
});

function startApp() {
  migrate(S);
  if (heroStop) { heroStop(); heroStop = null; }
  renderStepper();
  goStage(S.stage || 'intro');
}

/* ---------------- materials (real kit) ---------------- */
const MATERIALS = {
  main: [
    KIT.ROW.uno('讀取四個按鈕，控制蜂鳴器發出不同的音'), KIT.ROW.usb(), KIT.ROW.board(),
    { ...KIT.ROW.btn('琴鍵：Do、Re、Mi、So 各一個'), qty: '4' },
    KIT.ROW.buzzer('發出聲音（用 <code>tone()</code> 控制音高）'),
    KIT.ROW.wires({ black: 6, white: 2, green: 1, blue: 2 }, '黑 = GND（6 條：GND →「−」軌、4 個按鈕、蜂鳴器）；白 = D2、D5；綠 = D3；藍 = D4、D8。黑色不夠可以用其他顏色代替，記住它是接 GND。'),
  ],
  c1: [
    KIT.ROW.lsensor('手越近光感應器，聲音越高'),
    KIT.ROW.res(10000, 1, '和光感應器組成分壓電路，接 A0'),
    KIT.ROW.wires({ red: 2, black: 2, blue: 1 }, '紅 = 5V → 下方「+」軌、10kΩ →「+」軌；黑 = GND → 下方「−」軌、光感應器長腳 →「−」軌；藍 = A0'),
  ],
  c2: [
    { icon: '', name: '不用新材料', look: '用主任務的電路就可以', qty: '—', use: '按住 Do 鍵（D2），程式用 <code>for</code> 迴圈和<b>陣列</b>自動播完整首歌' },
  ],
};
const EXT_EXTRA = '光感應器 × 1、10kΩ × 1 及杜邦線 5 條（挑戰 1）；挑戰 2 不用新材料。';

/* ---------------- intro ---------------- */
let introPiano = null;
stageInit.intro = () => {
  if (!$('#partsList').children.length) {
    $('#partsList').innerHTML = KIT.table(MATERIALS.main);
    $('#partsExt').innerHTML = '延伸挑戰（選做）另需：' + EXT_EXTRA;
    $('#introScale').innerHTML = scaleHTML();
    $('#introSong').innerHTML = songHTML();
    $('#introMute').innerHTML = muteBtnHTML(); bindMute($('#introMute'));
    const pu = $('#introPullup'); let pressed = false;
    const drawPu = () => { pu.innerHTML = pullupSVG(pressed) + `<div class="readout small">digitalRead(2) = <b class="mono">${pressed ? 'LOW' : 'HIGH'}</b>　${pressed ? '（按下）' : '（放開）'}</div><button type="button" class="btn sm" id="puBtn">${pressed ? '放開按鈕' : '按下按鈕'}</button>`; $('#puBtn').onclick = () => { pressed = !pressed; drawPu(); }; $('.pu-btn', pu).onclick = () => { pressed = !pressed; drawPu(); }; };
    drawPu();
  }
  $('#introPiano').innerHTML = pianoHTML();
  const tr = songTracker($('#introSong'), () => toast('彈完了！你已經會彈這首歌。', 'ok'));
  if (introPiano) introPiano.off();
  let last = null;
  introPiano = bindPiano($('#introPiano'), pressed => {
    const x = firstKey(pressed);
    if (x && (!last || last.k !== x.k)) tr.press(x.k);
    last = x;
    if (x) SOUND.start(x.f); else SOUND.stop();
    $('#introNow').innerHTML = x ? `正在發聲：<b>${x.name}</b>（${x.f} Hz）` : '按住琴鍵（或鍵盤 1 至 4）試彈';
  });
};
stageLeave.intro = () => { if (introPiano) { introPiano.off(); introPiano = null; } SOUND.stop(); };
$('#introNext').addEventListener('click', () => {
  if (!S.t.hw) S.t.hw = now();
  unlock('hw'); goStage('hw');
});
