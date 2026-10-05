/* =====================================================================
   SOS 求救燈實驗室 — 設定（老師可修改這裏）
   ===================================================================== */
const CONFIG = {
  TEACHER_PASSWORD: 'dt2026',          // 教師模式密碼
  SIGN_KEY: ['SOS', 'Lab', 'DT', 'uno', '7Qm', '2026'].join('~'), // 報告驗證用的密鑰（改了之後舊報告會驗證失敗）
  LED_PIN: 13,
  APP: 'SOS-Lab',
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
const STORE_KEY = 'sosLab.v1.state';
const STAGES = ['intro', 'hw', 'code', 'real', 'ext', 'report'];
/* sub-views of the extension stage reuse the hardware / IDE sections */
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

function newState(student) {
  const akey = 'sosLab.attempts.' + student.cls + '.' + student.no;
  const attempt = (recall(akey) || 0) + 1; store(akey, attempt);
  const com = 'COM' + (3 + Math.floor(Math.random() * 6));
  return {
    v: 4, id: randId(), student, attempt, teacherUsed: false,
    startedAt: now(), finishedAt: null,
    stage: 'intro', unlocked: 0,
    t: { intro: now() },
    hw: { led: null, res: null, wires: [], step: 0, errors: 0, hints: 0, hinted: {}, log: [], done: false, lastFailSig: '', stepFails: {}, color: '#F4F4F0' },
    code: { blanks: {}, checks: 0, done: false, log: [] },
    up: { usb: false, board: null, port: null, com, verified: false, uploaded: false, errors: 0, log: [], lastErrSig: '' },
    real: { checks: {}, confirmed: false },
    ext: newExt(),
  };
}
function newExt() {
  const flow = () => ({ errors: 0, verified: false, uploaded: false, log: [], lastErrSig: '' });
  return {
    c1: { hw: { pz: null, wires: [], step: 0, errors: 0, hints: 0, hinted: {}, log: [], done: false, lastFailSig: '', stepFails: {} },
          code: { blanks: {}, checks: 0, done: false, log: [] }, flow: flow(), t: {}, done: false, confirmed: false },
    c2: { code: { initials: '', text: '', checks: 0, fails: 0, lastFailSig: '', done: false, revealed: false, log: [] },
          flow: flow(), t: {}, done: false, confirmed: false },
  };
}
/* progress saved by an older version of this page */
function migrate(st) {
  if (!st.ext) st.ext = newExt();
  if ((st.v || 1) < 2) { if (st.unlocked >= 4) st.unlocked = 5; st.v = 2; }
  if (st.v < 3) {   // breadboard rows were drawn upside down (a on top); relabel so circuits stay where they were drawn
    const flip = id => { const m = /^([a-j])(\d+)$/.exec(id || ''); return m ? 'jihgfedcba'['abcdefghij'.indexOf(m[1])] + m[2] : id; };
    const fix = h => { if (!h) return; ['led', 'res', 'pz'].forEach(k => { if (h[k]) h[k].h1 = flip(h[k].h1); }); (h.wires || []).forEach(w => { w.a = flip(w.a); w.b = flip(w.b); }); };
    fix(st.hw); fix(st.ext && st.ext.c1 && st.ext.c1.hw);
    st.v = 3;
  }
  if (st.v < 4) {   // wire colours now match the kit (black, white, red, blue, green)
    const map = { '#F2A91E': '#F4F4F0', '#EE6B1F': '#2F6FD6' };
    [st.hw, st.ext && st.ext.c1 && st.ext.c1.hw, st.ext && st.ext.c2 && st.ext.c2.hw].forEach(h => { if (h) (h.wires || []).forEach(w => { if (map[w.color]) w.color = map[w.color]; }); });
    if (map[st.hw.color]) st.hw.color = map[st.hw.color];
    st.v = 4;
  }
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
/* extension challenges: 10 points each, reported separately (not part of the 100) */
function extScores(st = S) {
  const e = st.ext; const res = { c1: null, c2: null };
  if (!e) return res;
  if (e.c1.done) {
    const h = e.c1.hw;
    const bl = C1_BLANKS.map(b => e.c1.code.blanks[b.id] || {});
    const wrong = bl.reduce((a, x) => a + (x.wrong || 0), 0), rev = bl.filter(x => x.revealed).length;
    const hw = Math.max(1, 4 - h.errors - h.hints), code = Math.max(1, 4 - wrong - 2 * rev), up = Math.max(0, 2 - (e.c1.flow.errors || 0));
    res.c1 = { hw, code, up, total: hw + code + up, wrong, rev };
  }
  if (e.c2.done) {
    const c = e.c2.code;
    const code = c.revealed ? 3 : Math.max(3, 8 - (c.fails || 0)), up = Math.max(0, 2 - (e.c2.flow.errors || 0));
    res.c2 = { code, up, total: code + up };
  }
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

/* ---------------- SOS timing (shared) ---------------- */
// [on?, ms] sequence produced by the finished program
const SOS_SEQ = (() => {
  const seq = [];
  const letter = (len, last) => { for (let i = 0; i < 3; i++) { seq.push([1, len]); seq.push([0, i < 2 ? 200 : last]); } };
  letter(200, 600); letter(600, 600); letter(200, 2000);
  return seq;
})();
const SYMBOLS = [['S', ['dot','dot','dot']], ['O', ['dash','dash','dash']], ['S', ['dot','dot','dot']]];

function morseHTML() {
  return SYMBOLS.map(([l, syms]) => `<div class="letter"><b>${l}</b>${syms.map(s => `<i class="sym ${s}"></i>`).join('')}</div>`).join('');
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
function playSOS(onStep) { return playSeq(SOS_SEQ, (on, i) => onStep(on, i < 0 ? -1 : Math.floor(i / 2), i)); }
function lampPlayer(lampEl, morseEl) {
  if (morseEl && !morseEl.children.length) morseEl.innerHTML = morseHTML();
  const syms = morseEl ? $$('.sym', morseEl) : [];
  return playSOS((on, sym) => {
    lampEl && lampEl.classList.toggle('on', !!on);
    syms.forEach((s, k) => s.classList.toggle('lit', !!on && k === sym));
  });
}

/* ---------------- login ---------------- */
let heroStop = null;
function showLogin() {
  $$('.stage').forEach(s => s.hidden = true);
  $('#st-login').hidden = false;
  renderStepper();
  if (!heroStop) heroStop = lampPlayer($('#heroLamp'), $('#heroMorse'));
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
      html: `<p>要繼續上次的進度，還是重新開始？重新開始會在成績報告上記錄為第 ${(recall('sosLab.attempts.' + cls + '.' + String(+no)) || 1) + 1} 次嘗試。</p>`,
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
    KIT.ROW.uno('控制 LED 閃出 SOS'), KIT.ROW.usb(), KIT.ROW.board(),
    { icon: KIT.ICON.led('#E8412B'), name: 'LED（紅色）', look: '<b>長腳是 +</b>，短腳是 −；短腳那邊的邊緣是平的', qty: '1', use: 'SOS 求救燈' },
    KIT.ROW.res(220, 1, '限制電流，保護 LED'),
    KIT.ROW.wires({ white: 1, black: 1 }, '白 = D13、黑 = GND'),
  ],
  c1: [
    KIT.ROW.buzzer('LED 閃的同時「嗶」一聲'),
    KIT.ROW.wires({ blue: 1, black: 1 }, '藍 = D8、黑 = GND'),
  ],
};

/* ---------------- intro ---------------- */
let introStop = null;
stageInit.intro = () => {
  if (!$('#partsList').children.length) {
    $('#partsList').innerHTML = KIT.table(MATERIALS.main);
    $('#resCard').innerHTML = KIT.resCard([[220, 'LED 用']], [1000, 10000]);
    // timeline
    const total = SOS_SEQ.reduce((a, [, ms]) => a + ms, 0);
    let t = 0, html = '';
    SOS_SEQ.forEach(([on, ms]) => { if (on) html += `<div class="seg" style="left:${(t / total * 100).toFixed(2)}%;width:${(ms / total * 100).toFixed(2)}%"></div>`; t += ms; });
    [0, 2, 4, 6].forEach(s => html += `<div class="lab" style="left:${Math.min(98, s * 1000 / total * 100)}%">${s}s</div>`);
    html += '<div class="head" id="tlHead"></div>';
    $('#introTL').innerHTML = html;
  }
  if (introStop) introStop();
  const lamp = $('#introLamp'), morse = $('#introMorse');
  if (!morse.children.length) morse.innerHTML = morseHTML();
  const syms = $$('.sym', morse);
  const total = SOS_SEQ.reduce((a, [, ms]) => a + ms, 0);
  const starts = []; SOS_SEQ.reduce((a, [, ms], i) => (starts[i] = a, a + ms), 0);
  introStop = playSOS((on, sym, i) => {
    lamp.classList.toggle('on', !!on);
    syms.forEach((s, k) => s.classList.toggle('lit', !!on && k === sym));
    const h = $('#tlHead'); if (h && i >= 0) h.style.left = (starts[i] / total * 100) + '%';
  });
};
stageLeave.intro = () => { if (introStop) { introStop(); introStop = null; } };
$('#introNext').addEventListener('click', () => {
  if (!S.t.hw) S.t.hw = now();
  unlock('hw'); goStage('hw');
});
