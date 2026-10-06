/* =====================================================================
   智能停車場閘門實驗室 — 設定（老師可修改這裏）
   ===================================================================== */
const CONFIG = {
  TEACHER_PASSWORD: 'dt2026',          // 教師模式密碼
  SIGN_KEY: ['SOS', 'Lab', 'DT', 'uno', '7Qm', '2026'].join('~'), // 報告驗證用的密鑰（改了之後舊報告會驗證失敗）
  APP: 'Parking-Lab',
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
const STORE_KEY = 'parkLab.v1.state';
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

const ATTEMPT_KEY = (cls, no) => 'parkLab.attempts.' + cls + '.' + no;
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
    up: { usb: false, board: null, port: null, com, verified: false, uploaded: false, errors: 0, log: [], lastErrSig: '', baud: 9600 },
    real: { checks: {}, confirmed: false, readings: {} },
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
  if (!st.real.readings) st.real.readings = {};
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
  if (done.code) BLANKS.forEach(b => { const x = st.code.blanks[b.id] || {}; code += x.revealed ? 1 : Math.max(2, 5 - Math.min(3, x.wrong || 0)); });
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
    const wrong = bl.reduce((a, y) => a + (y.wrong || 0), 0), rev = bl.filter(y => y.revealed).length;
    const up = Math.max(0, 2 - (x.flow.errors || 0));
    if (k === 'c1') { const hw = Math.max(1, 4 - x.hw.errors - x.hw.hints), code = Math.max(1, 4 - wrong - 2 * rev); res[k] = { hw, code, up, total: hw + code + up, wrong, rev }; }
    else { const code = Math.max(3, 8 - wrong - 2 * rev); res[k] = { hw: null, code, up, total: code + up, wrong, rev }; }
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

/* ---------------- light sensor model (shared) ---------------- */
/* darkness d: 0 = torch shining on it, 40 = classroom light, 100 = covered by a hand.
   With 5V → 10kΩ → A0 → light sensor → GND, the darker it is, the bigger the reading. */
const LIGHT = {
  ROOM_AT: 40, THR_MIN: 500, THR_MAX: 950, DEMO_THR: 700,
  base: d => Math.round(80 + (985 - 80) * Math.max(0, Math.min(100, d)) / 100),
  read: d => Math.max(0, Math.min(1023, LIGHT.base(d) + Math.round((Math.random() - 0.5) * 12))),
  label: d => d < 15 ? '電筒照住' : d < 55 ? '課室燈光' : d < 85 ? '有點暗' : '用手遮住',
};
/* a 0–1023 scale with the reading and the threshold */
function gaugeHTML(val, thr) {
  return `<div class="gauge" aria-hidden="true"><div class="gtrack">${thr != null ? `<i class="gthr" style="left:${thr / 1023 * 100}%"><span>門檻 ${thr}</span></i>` : ''}<i class="gval" style="left:${val / 1023 * 100}%"><span>${val}</span></i></div><div class="gends"><span>0（很光）</span><span>1023（很暗）</span></div></div>`;
}
function setGauge(el, val) {
  const v = el && $('.gval', el); if (!v) return;
  v.style.left = (val / 1023 * 100) + '%'; $('span', v).textContent = val;
}
/* ---------------- parking gate: scene + program model (shared by intro and results) ---------------- */
const CAR_STOP = 6;                                   // car waits here (front just before the barrier); it covers the sensor
const carCovers = x => x + 86 > 62 && x < 78;         // sensor sits at x 60–80 on the road
function gateSceneSVG(id) {
  return `<svg viewBox="0 0 320 150" class="scene gate-scene" id="${id}" aria-hidden="true">
    <rect x="0" y="0" width="320" height="150" rx="12" fill="#BFE3F5"/>
    <rect x="236" y="34" width="70" height="66" fill="#E9E2D0" stroke="#B9AE93"/><text x="271" y="62" font-size="13" font-weight="700" fill="#2F6FD6" text-anchor="middle">P</text><text x="271" y="80" font-size="9" fill="#555" text-anchor="middle">停車場</text>
    <rect x="0" y="100" width="320" height="50" fill="#5E6468"/>
    <path d="M0 136H320" stroke="#E8E8E8" stroke-width="2" stroke-dasharray="14 10"/>
    <rect x="60" y="116" width="20" height="7" rx="1.5" fill="#2B2F33"/><circle cx="70" cy="119.5" r="2.4" fill="#F4F1DA"/>
    <text x="70" y="132" font-size="8.5" fill="#fff" text-anchor="middle">光感應器</text>
    <g class="gcar" transform="translate(-100 0)">
      <path d="M2 106Q4 94 18 92L32 80H58L72 92Q84 94 86 106V114H2Z" fill="#E8412B"/>
      <path d="M36 84H55L65 92H30Z" fill="#CFE8F5"/>
      <circle cx="20" cy="115" r="7" fill="#222"/><circle cx="20" cy="115" r="3" fill="#999"/><circle cx="68" cy="115" r="7" fill="#222"/><circle cx="68" cy="115" r="3" fill="#999"/>
      <rect x="80" y="99" width="5" height="4" rx="1" fill="#FFE07A"/>
    </g>
    <rect x="206" y="60" width="10" height="56" fill="#D9D9D9" stroke="#999"/>
    <rect x="219" y="40" width="16" height="30" rx="3" fill="#222"/>
    <circle class="gl-r" cx="227" cy="48" r="5" fill="#5a1a14"/><circle class="gl-g" cx="227" cy="62" r="5" fill="#14401f"/>
    <g class="garm" transform="rotate(0 211 70)"><rect x="96" y="66" width="118" height="8" rx="3" fill="#fff" stroke="#888"/>${[104, 128, 152, 176].map(x => `<rect x="${x}" y="66" width="12" height="8" fill="#D8321F"/>`).join('')}</g>
    <circle cx="211" cy="70" r="5" fill="#555"/>
  </svg>`;
}
function setGateScene(el, st) {
  if (!el) return;
  $('.gcar', el).setAttribute('transform', `translate(${st.car.toFixed(1)} 0)`);
  $('.garm', el).setAttribute('transform', `rotate(${st.angle.toFixed(1)} 211 70)`);
  $('.gl-r', el).setAttribute('fill', st.red ? '#FF4A33' : '#5a1a14');
  $('.gl-g', el).setAttribute('fill', st.green ? '#3CE06B' : '#14401f');
}
/* runs the gate program: mode 'demo' / 'main' (gate.write(90), delay 3 s, gate.write(0)),
   'c1' (also opens when the admin button is pressed), 'c2' (for loops: 1° every 20 ms) */
function gateSim(o) {
  const st = { car: -100, auto: false, angle: 0, target: 0, phase: 'idle', until: 0, nextLoop: 0, red: true, green: false, admin: false, val: 0 };
  let stopped = false, last = performance.now(), timer = 0;
  const thr = () => o.thr;
  function loopOnce(t) {
    st.val = LIGHT.read(carCovers(st.car) ? 100 : LIGHT.ROOM_AT);
    if (o.onPrint) o.onPrint(st.val);
    const trig = st.val > thr() || (o.mode === 'c1' && st.admin);
    st.admin = false;
    if (trig) {
      st.red = false; st.green = true;
      if (o.mode === 'c2') st.phase = 'up';
      else { st.target = 90; st.phase = 'open'; st.until = t + 3000; }
    } else { st.red = true; st.green = false; st.nextLoop = t + 100; }
  }
  function step() {
    if (stopped) return;
    const t = performance.now(), dt = Math.min(80, t - last); last = t;
    if (st.phase === 'idle' && t >= st.nextLoop) loopOnce(t);
    else if (st.phase === 'open' && t >= st.until) { st.target = 0; st.phase = 'idle'; st.nextLoop = t + 100; }
    else if (st.phase === 'up') { st.target = Math.min(90, st.target + dt / 20); if (st.target >= 90) { st.phase = 'hold'; st.until = t + 3000; } }
    else if (st.phase === 'hold' && t >= st.until) st.phase = 'down';
    else if (st.phase === 'down') { st.target = Math.max(0, st.target - dt / 20); if (st.target <= 0) { st.phase = 'idle'; st.nextLoop = t + 100; } }
    const d = st.target - st.angle, sp = 0.6 * dt;               // a 9g servo turns about 60° in 0.1 s
    st.angle += Math.max(-sp, Math.min(sp, d));
    if (st.auto) {
      const nx = st.car + 0.12 * dt;
      if (st.car <= CAR_STOP && nx > CAR_STOP && st.angle < 70) st.car = CAR_STOP;
      else st.car = nx;
      if (st.car > 330) { st.car = -100; if (!o.autoLoop) st.auto = false; }
      if (o.carSlider) o.carSlider.value = Math.round((st.car + 100) / 430 * 100);
    }
    setGateScene(o.scene, st);
    if (o.root) {
      setLedIn(o.root, 'red', st.red); setLedIn(o.root, 'green', st.green);
      $$('.svhorn', o.root).forEach(g => g.setAttribute('transform', `rotate(${(-st.angle).toFixed(1)} ${g.dataset.cx} ${g.dataset.cy})`));
    }
    if (o.onState) o.onState(st);
    timer = setTimeout(step, 40);
  }
  if (o.carSlider) o.carSlider.oninput = () => {
    st.auto = false;
    let x = -100 + 430 * (+o.carSlider.value) / 100;
    if (st.car <= CAR_STOP && x > CAR_STOP && st.angle < 70) { x = CAR_STOP; o.carSlider.value = Math.round((x + 100) / 430 * 100); }
    st.car = x;
  };
  if (o.autoLoop) st.auto = true;
  step();
  return { stop: () => { stopped = true; clearTimeout(timer); }, drive: () => { st.car = -100; st.auto = true; }, admin: () => { st.admin = true; }, st };
}
function gateStateText(st, thr) {
  if (st.phase === 'open' || st.phase === 'hold') return `有車！綠燈，閘門升起（${Math.round(st.angle)}°），等 3 秒`;
  if (st.phase === 'up') return `有車！慢慢開閘：${Math.round(st.target)}°`;
  if (st.phase === 'down') return `慢慢關閘：${Math.round(st.target)}°`;
  if (st.angle > 2) return `關閘中（${Math.round(st.angle)}°）`;
  return `讀數 ${st.val} 不大過 ${thr}：沒有車，紅燈，閘門關`;
}

/* ---------------- login ---------------- */
let heroStop = null;
function heroLoop() {
  const sim = gateSim({ mode: 'demo', thr: LIGHT.DEMO_THR, scene: $('#heroScene'), autoLoop: true,
    onState: st => { const r = $('#heroRead'); if (r) r.innerHTML = `A0 讀數 <b>${st.val}</b> · ${st.green ? '<b style="color:#7CF29C">有車，開閘</b>' : '沒有車，紅燈'}`; } });
  return sim.stop;
}
function showLogin() {
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-login').hidden = false;
  renderStepper();
  if (!$('#heroScene')) $('#heroWrap').innerHTML = gateSceneSVG('heroScene');
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
    KIT.ROW.uno('讀取光感應器，控制燈號和閘門'), KIT.ROW.usb(), KIT.ROW.board(),
    KIT.ROW.lsensor('偵測有沒有車（車會遮住光感應器）'),
    KIT.ROW.res(10000, 1, '和光感應器組成分壓電路（接 5V 和 A0）'),
    KIT.ROW.led('#D8321F', '紅色 LED', '沒有車：紅燈'),
    KIT.ROW.led('#1E9E3E', '綠色 LED', '有車：綠燈'),
    KIT.ROW.res(220, 2, '每粒 LED 一粒，保護 LED'),
    KIT.ROW.servo('閘門：轉到 90° 開閘，0° 關閘'),
    KIT.ROW.wires({ red: 4, black: 5, blue: 1, green: 1, white: 1 }, '紅 = 5V（2 條）、紅燈 D12 及伺服馬達紅線；黑 = GND；藍 = A0；綠 = 綠燈 D10；白 = 伺服馬達信號 D9'),
    { icon: '', name: '雪條棍、寶特貼', look: '做閘門：用寶特貼把雪條棍貼在伺服馬達的擺臂上', qty: '各 1', use: '閘門的「欄杆」' },
  ],
  c1: [
    KIT.ROW.btn('管理員開閘掣'),
    KIT.ROW.res(10000, 1, '按鈕的<b>下拉電阻</b>（接 D2 和 GND）'),
    KIT.ROW.wires({ red: 1, blue: 1, black: 1 }, '紅 = 「+」電源軌、藍 = D2、黑 = 「−」電源軌'),
  ],
  c2: [
    { icon: '', name: '不用新材料', look: '用主任務的電路就可以', qty: '—', use: '只需要改程式，令閘門慢慢升起和落下' },
  ],
};
const EXT_EXTRA = '按鈕 × 1、10kΩ 電阻 × 1 及杜邦線 3 條（挑戰 1）；挑戰 2 不用新材料。';

/* ---------------- intro ---------------- */
let introSim = null;
stageInit.intro = () => {
  if (!$('#partsList').children.length) {
    $('#partsList').innerHTML = KIT.table(MATERIALS.main);
    $('#partsExt').innerHTML = '延伸挑戰（選做）另需：' + EXT_EXTRA;
    $('#resCard').innerHTML = KIT.resCard([[220, 'LED 用'], [10000, '光感應器用']], [1000]);
    $('#introSceneWrap').innerHTML = gateSceneSVG('introScene');
  }
  if (introSim) introSim.stop();
  introSim = gateSim({ mode: 'demo', thr: LIGHT.DEMO_THR, scene: $('#introScene'), carSlider: $('#introSlider'),
    onState: st => {
      $('#introVal').textContent = st.val;
      const g = $('#introGauge'); if (!g.children.length) g.innerHTML = gaugeHTML(st.val, LIGHT.DEMO_THR); else setGauge(g, st.val);
      $('#introLamp').innerHTML = st.green ? `<b style="color:var(--ok)">有車：綠燈，閘門升起 ${Math.round(st.angle)}°</b>` : '沒有車：紅燈，閘門關';
    } });
  $('#introDrive').onclick = () => introSim.drive();
};
stageLeave.intro = () => { if (introSim) { introSim.stop(); introSim = null; } };
$('#introNext').addEventListener('click', () => {
  if (!S.t.hw) S.t.hw = now();
  unlock('hw'); goStage('hw');
});
