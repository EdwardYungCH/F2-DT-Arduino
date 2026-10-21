/* =====================================================================
   RGB 心情燈實驗室 — 設定（老師可修改這裏）
   ===================================================================== */
const CONFIG = {
  TEACHER_PASSWORD: 'dt2026',          // 教師模式密碼
  SIGN_KEY: ['SOS', 'Lab', 'DT', 'uno', '7Qm', '2026'].join('~'), // 報告驗證用的密鑰（改了之後舊報告會驗證失敗）
  APP: 'RGB-MoodLamp-Lab',
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
const STORE_KEY = 'rgbLab.v1.state';
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

const ATTEMPT_KEY = (cls, no) => 'rgbLab.attempts.' + cls + '.' + no;
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
    real: { checks: {}, confirmed: false, shade: false },
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

/* ---------------- RGB colour helpers (shared) ---------------- */
/* c = [r, g, b], each 0–255 (the three analogWrite values) */
const rgbCss = c => `rgb(${c.map(v => Math.max(0, Math.min(255, Math.round(v)))).join(',')})`;
/* colour of a lit RGB LED: hue at full strength; overall brightness = the strongest channel */
function rgbLook(c) {
  const m = Math.max(c[0], c[1], c[2]), k = m / 255;
  if (m < 4) return { k: 0, hue: '#000', body: '#EEF2F3' };
  const hue = c.map(v => Math.round(v / m * 255));
  const body = [238, 242, 243].map((w, i) => Math.round(w + (hue[i] - w) * (0.25 + 0.75 * k)));
  return { k: +k.toFixed(2), hue: `rgb(${hue.join(',')})`, body: `rgb(${body.join(',')})` };
}
/* a rough Chinese colour name, for the mixer read-out */
function colourName(c) {
  const [r, g, b] = c.map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx < 0.03) return '熄燈（三色都是 0）';
  const dim = mx < 0.35 ? '暗' : '';
  const sat = (mx - mn) / mx;
  if (sat < 0.18) return dim ? '暗白色' : '白色';
  let h; const d = mx - mn;
  if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  const name = h < 15 ? '紅色' : h < 40 ? '橙色' : h < 70 ? '黃色' : h < 100 ? '黃綠色' : h < 150 ? '綠色' : h < 190 ? '青色' : h < 250 ? '藍色' : h < 285 ? '藍紫色' : h < 320 ? '紫色' : h < 350 ? '粉紅色' : '紅色';
  return (sat < 0.45 ? '淺' : '') + dim + name;
}
const PRESETS = [['紅色', [255, 0, 0]], ['黃色', [255, 255, 0]], ['紫色', [255, 0, 255]], ['青色', [0, 255, 255]], ['白色', [255, 255, 255]], ['橙色', [255, 80, 0]], ['粉紅色', [255, 40, 120]]];
/* a desk lamp made from a ping-pong ball (the lampshade the students can make) */
function lampSVG(id) {
  return `<svg viewBox="0 0 220 150" class="lamp" id="${id}" aria-hidden="true">
    <rect x="0" y="0" width="220" height="150" rx="12" fill="#1F2A3A"/>
    <rect x="0" y="112" width="220" height="38" fill="#4A3C30"/>
    <g class="lglow" opacity="0"><circle cx="110" cy="66" r="62" class="lg1" fill="#fff" opacity=".16"/><circle cx="110" cy="66" r="40" class="lg2" fill="#fff" opacity=".3"/></g>
    <path d="M110 92v20M86 112h48" stroke="#9AA5AE" stroke-width="5" stroke-linecap="round"/>
    <circle class="lball" cx="110" cy="66" r="27" fill="#EEF2F3" stroke="#C3CCD0" stroke-width="1.5"/>
    <path d="M97 54a15 15 0 0113-9" stroke="#fff" stroke-opacity=".75" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function setLamp(el, c) {
  if (!el) return;
  const L = rgbLook(c);
  $('.lglow', el).setAttribute('opacity', L.k);
  $$('.lg1,.lg2', el).forEach(x => x.setAttribute('fill', L.hue));
  $('.lball', el).setAttribute('fill', L.body);
}
/* three overlapping circles: how light colours add up */
function addMixSVG() {
  return `<svg viewBox="0 0 220 190" aria-label="光的三原色混色圖" style="background:#11161D;border-radius:10px">
    <g style="mix-blend-mode:screen;isolation:isolate">
      <circle cx="110" cy="72" r="46" fill="#FF0000" style="mix-blend-mode:screen"/>
      <circle cx="84" cy="118" r="46" fill="#00FF00" style="mix-blend-mode:screen"/>
      <circle cx="136" cy="118" r="46" fill="#0000FF" style="mix-blend-mode:screen"/>
    </g>
    <g font-size="11" font-weight="700" text-anchor="middle" fill="#111">
      <text x="110" y="52" fill="#fff">紅</text><text x="62" y="140" fill="#fff">綠</text><text x="158" y="140" fill="#fff">藍</text>
      <text x="88" y="90">黃</text><text x="134" y="90" fill="#fff">紫</text><text x="110" y="148">青</text><text x="110" y="106">白</text>
    </g></svg>`;
}
/* sliders R / G / B with a lamp preview (intro, code panel, results) */
function mixerHTML(c, opts = {}) {
  const row = (k, i, label) => `<label class="mix-row ${k}"><span>${label}</span><input type="range" min="0" max="255" value="${c[i]}" data-mix="${i}" aria-label="${label}"><b data-mixv="${i}">${c[i]}</b></label>`;
  return `<div class="mixer"${opts.narrow ? ' style="min-width:0"' : ''}>
    ${row('r', 0, '紅（D9）')}${row('g', 1, '綠（D10）')}${row('b', 2, '藍（D11）')}
    <div class="mix-chips">${PRESETS.map(([n, v]) => `<button class="chip" data-preset="${v.join(',')}">${n}</button>`).join('')}</div>
    <div class="mix-name"><i data-mixdot></i><b data-mixname></b></div>
    ${opts.code ? '<pre class="mix-code" data-mixcode></pre>' : ''}
  </div>`;
}
function bindMixer(root, c, onChange) {
  const draw = () => {
    $$('[data-mixv]', root).forEach(b => { b.textContent = c[+b.dataset.mixv]; });
    $$('[data-mix]', root).forEach(inp => { inp.value = c[+inp.dataset.mix]; });
    const dot = $('[data-mixdot]', root); if (dot) dot.style.background = rgbLook(c).k ? rgbLook(c).hue : '#222';
    const nm = $('[data-mixname]', root); if (nm) nm.textContent = colourName(c);
    const cd = $('[data-mixcode]', root); if (cd) cd.textContent = `analogWrite(redPin, ${c[0]});\nanalogWrite(greenPin, ${c[1]});\nanalogWrite(bluePin, ${c[2]});`;
    onChange && onChange(c);
  };
  $$('[data-mix]', root).forEach(inp => inp.addEventListener('input', () => { c[+inp.dataset.mix] = +inp.value; draw(); }));
  $$('[data-preset]', root).forEach(b => b.addEventListener('click', () => { b.dataset.preset.split(',').forEach((v, i) => { c[i] = +v; }); draw(); }));
  draw();
}

/* ---------------- login ---------------- */
let heroStop = null;
const HERO_SEQ = [[255, 0, 0], [255, 120, 0], [255, 255, 0], [0, 255, 0], [0, 255, 255], [0, 0, 255], [255, 0, 255], [255, 255, 255]];
function heroLoop() {
  let t = 0, stopped = false, timer = 0;
  const tick = () => {
    if (stopped) return;
    const n = HERO_SEQ.length, i = Math.floor(t / 12) % n, f = (t % 12) / 12;
    const a = HERO_SEQ[i], b = HERO_SEQ[(i + 1) % n], c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
    setLamp($('#heroScene'), c);
    const r = $('#heroRead'); if (r) r.innerHTML = `analogWrite：紅 <b>${c[0]}</b> · 綠 <b>${c[1]}</b> · 藍 <b>${c[2]}</b> → ${colourName(c)}`;
    t++; timer = setTimeout(tick, 120);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
function showLogin() {
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-login').hidden = false;
  renderStepper();
  if (!$('#heroScene')) $('#heroWrap').innerHTML = lampSVG('heroScene');
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
    KIT.ROW.uno('執行程式，控制三種顏色的亮度'), KIT.ROW.usb(), KIT.ROW.board(),
    KIT.ROW.rgb('心情燈的光源：紅、綠、藍三色混色'),
    KIT.ROW.res(220, 3, 'RGB LED 每種顏色<b>各一粒</b>，限制電流，保護 LED'),
    KIT.ROW.wires({ black: 2, white: 1, green: 1, blue: 1 }, '黑 = GND（2 條）、白 = D9（紅光）、綠 = D10（綠光）、藍 = D11（藍光）'),
  ],
  c1: [
    KIT.ROW.pot('轉動旋鈕，改變燈的顏色'),
    KIT.ROW.wires({ red: 2, black: 1, blue: 1 }, '紅 = 5V →「+」軌、紅 = 外腳 →「+」軌、黑 = 外腳 →「−」軌、藍 = A0'),
  ],
  c2: [
    { icon: '', name: '不用新材料', look: '用主任務的電路就可以', qty: '—', use: 'RGB LED 已經接在 ~9、~10、~11，程式用 <code>for</code> 迴圈慢慢改變亮度' },
  ],
};
const EXT_EXTRA = '電位器 × 1 及杜邦線 4 條（挑戰 1）；挑戰 2 不用新材料。';

/* ---------------- intro ---------------- */
const introMix = [255, 80, 0];
stageInit.intro = () => {
  if (!$('#partsList').children.length) {
    $('#partsList').innerHTML = KIT.table(MATERIALS.main);
    $('#partsExt').innerHTML = '延伸挑戰（選做）另需：' + EXT_EXTRA;
    $('#resCard').innerHTML = KIT.resCard([[220, 'RGB LED 用（3 粒）']], [10000, 1000]);
    $('#introSceneWrap').innerHTML = lampSVG('introScene');
    $('#introMixer').innerHTML = mixerHTML(introMix, { code: true });
    $('#introAdd').innerHTML = addMixSVG();
    bindMixer($('#introMixer'), introMix, c => setLamp($('#introScene'), c));
  }
};
$('#introNext').addEventListener('click', () => {
  if (!S.t.hw) S.t.hw = now();
  unlock('hw'); goStage('hw');
});
