/* =====================================================================
   行人過路燈實驗室 — 設定（老師可修改這裏）
   ===================================================================== */
const CONFIG = {
  TEACHER_PASSWORD: 'dt2026',          // 教師模式密碼
  SIGN_KEY: ['SOS', 'Lab', 'DT', 'uno', '7Qm', '2026'].join('~'), // 報告驗證用的密鑰（改了之後舊報告會驗證失敗）
  APP: 'Traffic-Lab',
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
  const f = $('input', back) || $('.actions .btn:last-child', back);
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
const STORE_KEY = 'trafficLab.v1.state';
const STAGES = ['intro', 'hw', 'code', 'real', 'ext', 'report'];
/* sub-views of the extension stage reuse the hardware / IDE sections */
const VIEWS = { c1hw: { section: 'hw', stepper: 'ext' }, c1code: { section: 'code', stepper: 'ext' }, c2hw: { section: 'hw', stepper: 'ext' }, c2code: { section: 'code', stepper: 'ext' } };
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

function newState(student) {
  const akey = 'trafficLab.attempts.' + student.cls + '.' + student.no;
  const attempt = (recall(akey) || 0) + 1; store(akey, attempt);
  const com = 'COM' + (3 + Math.floor(Math.random() * 6));
  return {
    v: 1, id: randId(), student, attempt, teacherUsed: false,
    startedAt: now(), finishedAt: null,
    stage: 'intro', unlocked: 0,
    t: { intro: now() },
    hw: newHw({ color: '#D63A2F' }),
    code: { blanks: {}, checks: 0, done: false, log: [] },
    up: { usb: false, board: null, port: null, com, verified: false, uploaded: false, errors: 0, log: [], lastErrSig: '' },
    real: { checks: {}, confirmed: false },
    ext: newExt(),
  };
}
function newHw(extra = {}) { return { parts: [], wires: [], step: 0, errors: 0, hints: 0, hinted: {}, log: [], done: false, lastFailSig: '', stepFails: {}, ...extra }; }
function newExt() {
  const flow = () => ({ errors: 0, verified: false, uploaded: false, log: [], lastErrSig: '' });
  const one = () => ({ hw: newHw(), code: { blanks: {}, checks: 0, done: false, log: [] }, flow: flow(), t: {}, done: false, confirmed: false });
  return { c1: one(), c2: one() };
}
/* progress saved by an older version of this page */
function migrate(st) {
  if (!st.ext) st.ext = newExt();
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
function scores(st = S) {
  const hw = Math.max(16, 40 - 4 * st.hw.errors - 2 * st.hw.hints);
  let code = 0;
  BLANKS.forEach(b => { const x = st.code.blanks[b.id] || {}; code += x.revealed ? 1 : Math.max(2, 5 - Math.min(3, x.wrong || 0)); });
  const up = Math.max(8, 20 - 3 * st.up.errors);
  const total = hw + code + up;
  const grade = total >= 85 ? '優異' : total >= 70 ? '良好' : total >= 50 ? '合格' : '仍需努力';
  return { hw, code, up, total, grade };
}
/* extension challenges: 10 points each, reported separately (not part of the 100) */
function extScores(st = S) {
  const e = st.ext; const res = { c1: null, c2: null };
  if (!e) return res;
  [['c1', C1_BLANKS], ['c2', C2_BLANKS]].forEach(([k, bls]) => {
    const x = e[k]; if (!x.done) return;
    const bl = bls.map(b => x.code.blanks[b.id] || {});
    const wrong = bl.reduce((a, y) => a + (y.wrong || 0), 0), rev = bl.filter(y => y.revealed).length;
    const hw = Math.max(1, 4 - x.hw.errors - x.hw.hints), code = Math.max(1, 4 - wrong - 2 * rev), up = Math.max(0, 2 - (x.flow.errors || 0));
    res[k] = { hw, code, up, total: hw + code + up, wrong, rev };
  });
  return res;
}

/* ---------------- navigation ---------------- */
const stageInit = {};
const stageLeave = {};
function goStage(name) {
  if (!S) return;
  const idx = STAGES.indexOf(stepperOf(name));
  if (idx < 0 || (idx > S.unlocked && !teacherOn)) return;
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
    b.disabled = !S || (i > S.unlocked && !teacherOn);
    const cur = S && stepperOf(S.stage) === st;
    b.classList.toggle('current', !!cur);
    b.classList.toggle('done', !!(S && i < S.unlocked && !cur));
  });
  $('#who').textContent = S ? `${S.student.cls} · ${S.student.no} · ${S.student.name}` : '';
}
$$('#stepper button').forEach(b => b.addEventListener('click', () => goStage(b.dataset.stage)));

/* ---------------- traffic light timing (shared) ---------------- */
// states: G = green, Y = yellow, R = red, RY = red + yellow (Hong Kong order)
const PHASES = [['G', 3000, '平時：綠燈（等人按掣）'], ['G', 500, '有人按掣！', 'press'], ['Y', 2000, '黃燈 2 秒'], ['R', 5000, '紅燈 5 秒：行人過路'], ['RY', 2000, '紅燈 + 黃燈 2 秒：準備開車']];
const AFTER_PRESS = PHASES.slice(2);
function trafficHTML(small) {
  return `<div class="tlight${small ? ' sm' : ''}"><i class="r"></i><i class="y"></i><i class="g"></i></div>`;
}
function setTraffic(el, st) {
  if (!el) return;
  el.querySelector('.r').classList.toggle('on', st === 'R' || st === 'RY');
  el.querySelector('.y').classList.toggle('on', st === 'Y' || st === 'RY');
  el.querySelector('.g').classList.toggle('on', st === 'G');
}
/* play any [on, ms] sequence on a callback, looping; returns stop() */
function playSeq(seq, onStep) {
  let i = 0, stopped = false, timer = 0;
  const tick = () => {
    if (stopped) return;
    onStep(seq[i][0], i);
    timer = setTimeout(() => { i = (i + 1) % seq.length; tick(); }, seq[i][1]);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); onStep(0, -1); };
}
function trafficPlayer(lightEl, labelEl, btnEl) {
  return playSeq(PHASES, (st, i) => {
    setTraffic(lightEl, i < 0 ? '' : st);
    if (labelEl) labelEl.textContent = i < 0 ? '' : PHASES[i][2];
    if (btnEl) btnEl.classList.toggle('pressed', i >= 0 && PHASES[i][3] === 'press');
  });
}

/* ---------------- login ---------------- */
let heroStop = null;
function showLogin() {
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-login').hidden = false;
  renderStepper();
  if (!heroStop) heroStop = trafficPlayer($('#heroLight'), $('#heroPhase'), $('#heroBtn'));
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
      html: `<p>要繼續上次的進度，還是重新開始？重新開始會在成績報告上記錄為第 ${(recall('trafficLab.attempts.' + cls + '.' + String(+no)) || 1) + 1} 次嘗試。</p>`,
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

/* ---------------- intro ---------------- */
let introStop = null;
const TL_COL = { G: '#1E9E3E', Y: '#E3A800', R: '#D8321F', RY: 'linear-gradient(90deg,#D8321F 50%,#E3A800 50%)' };
stageInit.intro = () => {
  if (!$('#partsList').children.length) {
    const led = c => `<svg viewBox="0 0 40 60"><path d="M10 26a10 10 0 0120 0v8H10z" fill="${c}"/><rect x="8" y="33" width="24" height="4" fill="#555"/><path d="M15 37v19" stroke="#999" stroke-width="2"/><path d="M25 37v6l3 3v12" stroke="#999" stroke-width="2" fill="none"/></svg>`;
    const res = (b) => `<svg viewBox="0 0 80 30"><path d="M2 15h76" stroke="#999" stroke-width="2"/><rect x="22" y="7" width="36" height="16" rx="6" fill="#E4CFA6"/>${b.map((c, i) => `<rect x="${28 + i * 7 + (i === 3 ? 1 : 0)}" y="7" width="${i === 3 ? 3 : 4}" height="16" fill="${c}"/>`).join('')}</svg>`;
    $('#partsList').innerHTML = [
      ['Arduino UNO', '開發板 × 1', '<svg viewBox="0 0 70 52"><rect x="1" y="1" width="68" height="50" rx="4" fill="#0E7C9B"/><rect x="-2" y="8" width="14" height="12" fill="#B9C2C6"/><rect x="18" y="4" width="44" height="5" fill="#222"/><rect x="26" y="43" width="36" height="5" fill="#222"/><rect x="30" y="26" width="30" height="8" fill="#222"/></svg>'],
      ['紅、黃、綠 LED', '各 1 粒', `<svg viewBox="0 0 90 60">${[['#E8412B', 0], ['#E3A800', 28], ['#1E9E3E', 56]].map(([c, x]) => `<g transform="translate(${x} 0)"><path d="M10 26a10 10 0 0120 0v8H10z" fill="${c}"/><path d="M15 37v19M25 37v19" stroke="#999" stroke-width="2"/></g>`).join('')}</svg>`],
      ['電阻 220Ω', '紅紅啡金 × 3（LED 用）', res(['#D12B2B', '#D12B2B', '#7A4A1E', '#C9A227'])],
      ['電阻 10kΩ', '啡黑橙金 × 1（按鈕用）', res(['#7A4A1E', '#1E1E1E', '#EE7B1F', '#C9A227'])],
      ['按鈕', '4 隻腳 × 1', '<svg viewBox="0 0 60 60"><rect x="8" y="2" width="4" height="10" fill="#aaa"/><rect x="48" y="2" width="4" height="10" fill="#aaa"/><rect x="8" y="48" width="4" height="10" fill="#aaa"/><rect x="48" y="48" width="4" height="10" fill="#aaa"/><rect x="6" y="10" width="48" height="40" rx="4" fill="#2B2F33"/><circle cx="30" cy="30" r="12" fill="#C9352A"/></svg>'],
      ['麵包板、杜邦線、USB 線', '杜邦線約 10 條', '<svg viewBox="0 0 70 40"><path d="M8 32C20 0 50 0 62 32" stroke="#D63A2F" stroke-width="4" fill="none"/><path d="M8 38C22 14 48 14 62 38" stroke="#222" stroke-width="4" fill="none"/></svg>'],
    ].map(([b, s, svg]) => `<div class="part">${svg}<b>${b}</b><span>${s}</span></div>`).join('');
    const total = PHASES.reduce((a, [, ms]) => a + ms, 0);
    let t = 0, html = '';
    PHASES.forEach(([st, ms, , f]) => { html += `<div class="seg" style="left:${(t / total * 100).toFixed(2)}%;width:${(ms / total * 100 - .4).toFixed(2)}%;background:${TL_COL[st]}"></div>`; if (f) html += `<div class="lab" style="left:${(t / total * 100).toFixed(2)}%">按掣</div>`; t += ms; });
    html += '<div class="head" id="tlHead"></div>';
    $('#introTL').innerHTML = html;
  }
  if (introStop) introStop();
  const total = PHASES.reduce((a, [, ms]) => a + ms, 0);
  const starts = []; PHASES.reduce((a, [, ms], i) => (starts[i] = a, a + ms), 0);
  const stop1 = trafficPlayer($('#introLight'), $('#introPhase'), $('#introBtn'));
  const stop2 = playSeq(PHASES, (st, i) => { const h = $('#tlHead'); if (h && i >= 0) h.style.left = (starts[i] / total * 100) + '%'; });
  introStop = () => { stop1(); stop2(); };
};
stageLeave.intro = () => { if (introStop) { introStop(); introStop = null; } };
$('#introNext').addEventListener('click', () => {
  if (!S.t.hw) S.t.hw = now();
  unlock('hw'); goStage('hw');
});
