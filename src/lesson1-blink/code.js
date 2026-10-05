/* =====================================================================
   Arduino IDE 模擬器：程式填空 / 修正程式、選板、選 Port、編譯、上傳
   三個情境：main（主任務：閃動 L 燈）、c1（延伸 1 心跳燈）、c2（延伸 2 修好壞掉的程式）
   ===================================================================== */
const CODE_TEMPLATE = [
  '// 我的第一個程式：閃動 L 燈',
  '// L 燈在 UNO 板上，板內已經接到 13 號腳',
  '',
  'void setup() {',
  '  // setup() 的內容：開機時只做一次',
  '  pinMode(13, {{b1}});        // 把 13 號腳設定為「輸出」',
  '}',
  '',
  'void loop() {',
  '  // loop() 的內容：做完之後由頭再做，不停重複',
  '  {{b2}}(13, {{b3}});   // 開燈：13 號腳輸出高電位',
  '  delay({{b4}});              // 亮 1 秒',
  '  digitalWrite(13, {{b5}});    // 關燈：13 號腳輸出低電位',
  '  delay({{b6}});              // 熄 1 秒',
  '}',
];
const BLANKS = [
  { id: 'b1', ans: 'OUTPUT', ctx: 'mode', ask: '13 號腳的模式', hint: 'Arduino 要「送出」信號去控制 L 燈，所以要設定為「輸出」。英文要<em>全部大寫</em>。' },
  { id: 'b2', ans: 'digitalWrite', ctx: 'func', argc: 2, ask: '控制腳位開關的指令', hint: '在第 13 行「關燈」那一行用的是<em>同一個指令</em>。注意大小寫：digital 小寫，W 大寫。' },
  { id: 'b3', ans: 'HIGH', ctx: 'level', ask: '開燈時輸出的狀態', hint: '開燈 = 輸出 5V 高電位，英文是「高」，要<em>全部大寫</em>。' },
  { id: 'b4', ans: '1000', ctx: 'delay', ask: '亮多久', hint: 'delay() 用<em>毫秒</em>計時：1 秒 = 1000 毫秒。' },
  { id: 'b5', ans: 'LOW', ctx: 'level', ask: '關燈時輸出的狀態', hint: '關燈 = 輸出 0V 低電位，英文是「低」，要<em>全部大寫</em>。' },
  { id: 'b6', ans: '1000', ctx: 'delay', ask: '熄多久', hint: '熄 1 秒。1 秒 = 1000 毫秒。' },
];
const BANK = ['OUTPUT', 'INPUT', 'HIGH', 'LOW', '1000', '1', 'digitalWrite', 'pinMode', 'delay'];

/* ---------- 延伸挑戰 1：心跳燈（「噗噗——停」） ---------- */
const C1_TEMPLATE = [
  '// 延伸挑戰 1：心跳燈',
  '// L 燈像心跳一樣：快閃兩下「噗噗」，再停一停',
  '',
  'void setup() {',
  '  pinMode(13, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  // 第一下「噗」',
  '  digitalWrite(13, HIGH);',
  '  delay({{e1}});              // 亮 0.1 秒',
  '  digitalWrite(13, {{e2}});    // 熄燈',
  '  delay(100);                // 熄 0.1 秒',
  '',
  '  // 第二下「噗」',
  '  {{e3}}(13, HIGH);   // 開燈（用哪個指令？）',
  '  delay({{e4}});              // 亮 0.1 秒',
  '  digitalWrite(13, LOW);',
  '',
  '  // 停一停，再重複',
  '  delay({{e5}});              // 熄 0.8 秒',
  '}',
];
const C1_BLANKS = [
  { id: 'e1', ans: '100', ctx: 'delay', ask: '第一下亮多久', hint: '0.1 秒 = ? 毫秒。1 秒 = 1000 毫秒，所以 0.1 秒是它的十分之一。' },
  { id: 'e2', ans: 'LOW', ctx: 'level', ask: '熄燈時輸出的狀態', hint: '熄燈 = 低電位，英文要<em>全部大寫</em>。' },
  { id: 'e3', ans: 'digitalWrite', ctx: 'func', argc: 2, ask: '開燈的指令', hint: '和第 10 行開燈用的是同一個指令。' },
  { id: 'e4', ans: '100', ctx: 'delay', ask: '第二下亮多久', hint: '和第一下一樣，亮 0.1 秒。' },
  { id: 'e5', ans: '800', ctx: 'delay', ask: '停多久', hint: '停 0.8 秒。1 秒 = 1000 毫秒，0.8 秒 = ? 毫秒。' },
];
const C1_BANK = ['100', '800', '1000', 'HIGH', 'LOW', 'digitalWrite', 'pinMode'];
const HEART_SEQ = [[1, 100], [0, 100], [1, 100], [0, 800]];

/* ---------- 延伸挑戰 2：修好壞掉的程式 ---------- */
const BUGGY_CODE = [
  '// 延伸挑戰 2：修好壞掉的程式',
  '// 這個程式本來會令 L 燈每秒閃一次，但入面有 4 個錯處。',
  '// 按 ✓ Verify，看 Output 的錯誤訊息，找出錯處並修正。',
  '',
  'void setup() {',
  '  pinmode(13, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(13, HIGH)',
  '  delay(1000);',
  '  digitalWrite(13, LOW)；',
  '}',
].join('\n');
const FIXED_CODE = [
  '// 延伸挑戰 2：修好壞掉的程式',
  '// 這個程式本來會令 L 燈每秒閃一次，但入面有 4 個錯處。',
  '// 按 ✓ Verify，看 Output 的錯誤訊息，找出錯處並修正。',
  '',
  'void setup() {',
  '  pinMode(13, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  digitalWrite(13, HIGH);',
  '  delay(1000);',
  '  digitalWrite(13, LOW);',
  '  delay(1000);',
  '}',
].join('\n');

/* a tiny compiler for the whole sketch: void setup() { … } void loop() { … } with calls like f(a, b); */
const DBG_FUNCS = { pinMode: 2, digitalWrite: 2, delay: 1 };
const DBG_PROTO = { pinMode: 'void pinMode(uint8_t, uint8_t)', digitalWrite: 'void digitalWrite(uint8_t, uint8_t)', delay: 'void delay(long unsigned int)' };
const DBG_CONST = ['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'LED_BUILTIN'];
function parseDebug(text) {
  const src = String(text || '').split('\n');
  const toks = [], errs = [];
  // tokenise (comments removed); a non-ASCII character outside a comment is a "stray" error, like GCC
  src.forEach((raw, li) => {
    const ln = li + 1, ci = raw.indexOf('//'), line = ci >= 0 ? raw.slice(0, ci) : raw;
    const re = /\s+|([A-Za-z_]\w*)|(\d+)|([(){},;])|(.)/g;
    let m;
    while ((m = re.exec(line))) {
      if (m[0].trim() === '') continue;
      const col = m.index + 1;
      if (m[1]) toks.push({ t: 'id', v: m[1], ln, col });
      else if (m[2]) toks.push({ t: 'num', v: m[2], ln, col });
      else if (m[3]) toks.push({ t: m[3], v: m[3], ln, col });
      else if (/[^\x00-\x7F]/.test(m[4])) {
        const byte = new TextEncoder().encode(m[4])[0];
        errs.push({ line: ln, col, len: 1, msg: `stray '\\${byte.toString(8)}' in program`, kind: 'stray', ch: m[4], lineTxt: raw });
      } else toks.push({ t: 'other', v: m[4], ln, col });
    }
  });
  const lineTxt = ln => src[ln - 1] || '';
  const fns = {};
  let i = 0, fn = null;
  const peek = () => toks[i], next = () => toks[i++];
  const err = (tk, msg, extra = {}) => { const t = tk || toks[toks.length - 1] || { ln: src.length, col: 1, v: '' }; errs.push({ line: t.ln, col: t.col + (extra.after ? String(t.v).length : 0), len: Math.max(1, String(t.v || ' ').length), msg, fn: fn ? `void ${fn}()` : null, lineTxt: lineTxt(t.ln), ...extra }); };
  const skipStmt = () => { while (peek() && peek().t !== ';' && peek().t !== '}') i++; if (peek() && peek().t === ';') i++; };
  while (peek()) {
    const tk = next();
    if (!(tk.t === 'id' && tk.v === 'void')) { err(tk, `expected unqualified-id before '${tk.v}'`, { kind: 'bad' }); continue; }
    const name = next();
    if (!name || name.t !== 'id') { err(name, "expected unqualified-id", { kind: 'bad' }); break; }
    if (!(peek() && peek().t === '(')) { err(peek(), `expected initializer before '${peek() ? peek().v : ''}'`, { kind: 'bad' }); break; }
    i++; if (peek() && peek().t === ')') i++; else { err(peek(), "expected ')'", { kind: 'bad' }); }
    if (!(peek() && peek().t === '{')) { err(peek(), "expected '{'", { kind: 'brace' }); break; }
    i++; fn = name.v; const body = []; fns[fn] = body;
    while (peek() && peek().t !== '}') {
      const st = next();
      if (st.t !== 'id') { err(st, `expected primary-expression before '${st.v}' token`, { kind: 'bad' }); skipStmt(); continue; }
      if (!(peek() && peek().t === '(')) {
        if (DBG_FUNCS[st.v] !== undefined) err(st, `statement is a reference, not call, to function '${st.v}'`, { kind: 'nocall' });
        else err(st, `'${st.v}' was not declared in this scope`, { kind: 'undecl', sug: Object.keys(DBG_FUNCS).concat(DBG_CONST).find(k => k.toLowerCase() === st.v.toLowerCase() && k !== st.v) });
        skipStmt(); continue;
      }
      i++;
      const args = []; let bad = false;
      while (peek() && peek().t !== ')') {
        const a = next();
        if (a.t === 'num') args.push(a);
        else if (a.t === 'id') {
          if (!DBG_CONST.includes(a.v)) { err(a, `'${a.v}' was not declared in this scope`, { kind: 'undecl', sug: DBG_CONST.find(k => k.toLowerCase() === a.v.toLowerCase()) }); bad = true; }
          args.push(a);
        } else if (a.t === ',') continue;
        else { err(a, `expected primary-expression before '${a.v}' token`, { kind: 'bad' }); bad = true; break; }
      }
      const close = peek();
      if (!close || close.t !== ')') { err(close, "expected ')' before ';' token", { kind: 'bad' }); skipStmt(); continue; }
      i++;
      if (DBG_FUNCS[st.v] === undefined) {
        const sug = Object.keys(DBG_FUNCS).find(k => k.toLowerCase() === st.v.toLowerCase());
        err(st, `'${st.v}' was not declared in this scope`, { kind: 'undecl', sug });
        bad = true;
      } else if (args.length !== DBG_FUNCS[st.v]) {
        err(st, `too ${args.length > DBG_FUNCS[st.v] ? 'many' : 'few'} arguments to function '${DBG_PROTO[st.v]}'`, { kind: 'args', name: st.v });
        bad = true;
      }
      if (!(peek() && peek().t === ';')) {
        const nx = peek();
        err(close, `expected ';' before '${nx ? nx.v : '}'}' token`.replace(/' token$/, nx && nx.t === 'id' ? "'" : "' token"), { kind: 'semi', after: true, len: 1 });
        bad = true;
      } else i++;
      if (!bad) body.push({ fn: st.v, args: args.map(a => a.v), ln: st.ln });
    }
    if (!peek()) { err(null, "expected '}' at end of input", { kind: 'brace' }); break; }
    i++; fn = null;
  }
  if (!errs.length) {
    if (!fns.setup) errs.push({ line: 1, col: 1, len: 1, msg: "undefined reference to `setup'", kind: 'link', lineTxt: src[0] || '' });
    if (!fns.loop) errs.push({ line: 1, col: 1, len: 1, msg: "undefined reference to `loop'", kind: 'link', lineTxt: src[0] || '' });
  }
  errs.sort((a, b) => a.line - b.line || a.col - b.col);
  return { errs, fns };
}
/* what the L light does with a program that compiled: {ok, why, seq} */
function runDebug(fns) {
  const setup = fns.setup || [], loop = fns.loop || [];
  const out13 = setup.some(c => c.fn === 'pinMode' && c.args[0] === '13' && c.args[1] === 'OUTPUT');
  const seq = []; let on = 0;
  loop.forEach(c => {
    if (c.fn === 'digitalWrite' && c.args[0] === '13') on = c.args[1] === 'HIGH' ? 1 : 0;
    if (c.fn === 'delay') seq.push([on, +c.args[0]]);
  });
  const onMs = seq.filter(s => s[0]).reduce((a, s) => a + s[1], 0), offMs = seq.filter(s => !s[0]).reduce((a, s) => a + s[1], 0);
  if (!out13) return { ok: false, kind: 'nomode', why: 'L 燈只有很暗的光，幾乎看不見。' };
  if (!loop.some(c => c.fn === 'digitalWrite' && c.args[0] === '13')) return { ok: false, kind: 'nowrite', why: 'L 燈完全沒有反應。' };
  if (offMs < 50 && onMs >= 50) return { ok: false, kind: 'alwayson', why: 'L 燈<b>一直亮着</b>，好像不會閃！', seq: [[1, 1000]] };
  if (onMs < 50) return { ok: false, kind: 'alwaysoff', why: 'L 燈幾乎一直熄着。', seq: [[0, 1000]] };
  return { ok: true, seq: seq.length ? seq : [[1, 1000], [0, 1000]], onMs, offMs };
}
/* which of the 4 planted mistakes are fixed (for the progress pills) */
function bugStatus(text) {
  const code = String(text || '').split('\n').map(l => l.replace(/\/\/.*/, ''));
  const { errs, fns } = parseDebug(text);
  const r = runDebug(fns);
  return [
    { t: 'pinmode 大小寫', ok: !code.some(l => /\bpinmode\b/.test(l)) },
    { t: '開燈一行少了 ;', ok: !code.some(l => /digitalWrite\s*\(\s*13\s*,\s*HIGH\s*\)\s*$/.test(l.trim())) },
    { t: '全形分號 ；', ok: !code.some(l => /[^\x00-\x7F]/.test(l)) },
    { t: '熄燈後沒有等待', ok: !errs.length && r.kind !== 'alwayson' && r.ok },
  ];
}

const BOARDS = ['Arduino Yún', 'Arduino Uno', 'Arduino Duemilanove or Diecimila', 'Arduino Nano', 'Arduino Mega or Mega 2560', 'Arduino Mega ADK', 'Arduino Leonardo', 'Arduino Micro', 'Arduino Esplora', 'Arduino Mini', 'Arduino Ethernet', 'Arduino Fio', 'Arduino BT', 'LilyPad Arduino USB', 'LilyPad Arduino', 'Arduino Pro or Pro Mini', 'Arduino NG or older', 'Arduino Gemma', 'Arduino Uno WiFi'];
const lineOf = (tpl, id) => tpl.findIndex(l => l.includes('{{' + id + '}}')) + 1;
BLANKS.forEach(b => b.line = lineOf(CODE_TEMPLATE, b.id));
C1_BLANKS.forEach(b => b.line = lineOf(C1_TEMPLATE, b.id));
function fnOf(tpl, line) {
  for (let i = line - 1; i >= 0; i--) { const m = /^void\s+(\w+)\(\)/.exec(tpl[i]); if (m) return `void ${m[1]}()`; if (tpl[i] === '}' && i < line - 1) return null; }
  return null;
}

const IDE = (() => {
  let built = false, lastFocus = null, busy = false;
  const explainMap = {};
  let C = null;              // current context

  const CTX = {
    main: {
      name: 'main', file: 'Blink_L', eyebrow: '第 3 步', title: '編程及上傳', full: true,
      tpl: CODE_TEMPLATE, blanks: BLANKS, bank: BANK,
      st: () => S.code, flow: () => S.up,
      intro: `這是你的第一個程式。先讀灰色的註解，它會告訴你那一行做甚麼，然後完成 <b>6 個橙色空格</b>。可以直接打字，或者先點空格，再點下面的字詞。`,
      revealNote: '顯示答案後，這一格只會得 1 分（滿分 5 分）。建議先再試一次。',
      next: { label: '下一步：實物挑戰', stage: 'real' },
      dict: [['void setup() { … }', '開機時只做一次，用來做設定'], ['void loop() { … }', '做完最後一行，就由頭再做，不停重複'], ['pinMode(腳, 模式)', '設定腳位是 OUTPUT（輸出）還是 INPUT（輸入）'], ['digitalWrite(腳, 狀態)', 'HIGH = 輸出 5V（開），LOW = 輸出 0V（關）'], ['delay(毫秒)', '暫停一段時間，1000 毫秒 = 1 秒'], [';', '每個指令最後都要有分號（半形）'], ['// 註解', '雙斜線後面的灰色文字是寫給人看的說明，Arduino 不會執行']],
    },
    c1: {
      name: 'c1', file: 'Heartbeat', eyebrow: '延伸挑戰 1 · 心跳燈', title: '編程及上傳', full: false,
      tpl: C1_TEMPLATE, blanks: C1_BLANKS, bank: C1_BANK,
      st: () => S.ext.c1.code, flow: () => S.ext.c1.flow,
      intro: `令 L 燈像心跳一樣「噗噗——停」。完成 <b>5 個橙色空格</b>，留意每一行的註解寫着多少秒。`,
      revealNote: '顯示答案會令這個挑戰扣 2 分。建議先再試一次。',
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: [['delay(100)', '等 0.1 秒（100 毫秒）'], ['delay(800)', '等 0.8 秒（800 毫秒）'], ['digitalWrite(13, HIGH)', '開燈'], ['digitalWrite(13, LOW)', '關燈']],
    },
    c2: {
      name: 'c2', file: 'Fix_Me', eyebrow: '延伸挑戰 2 · 修好壞掉的程式', title: '找錯處及上傳', full: false, debug: true,
      tpl: [], blanks: [], bank: [],
      st: () => S.ext.c2.code, flow: () => S.ext.c2.flow,
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: [['was not declared in this scope', '編譯器不認識這個字：多數是串錯字或大小寫不對'], ['suggested alternative', '編譯器估你想寫的字'], ["expected ';' before …", '上一句的句尾少了分號 ;'], ["stray '\\357' in program", '程式裏有中文或全形字，例如全形分號 ；'], ['第 10:27 行', '冒號前是行號，後面是第幾個字（列）']],
    },
  };
  const B = id => { const st = C.st(); if (!st.blanks[id]) st.blanks[id] = { val: '', wrong: 0, lastWrong: null, status: '', revealed: false, fb: '' }; return st.blanks[id]; };
  const isRight = (b, v) => b.accept ? b.accept(v) : v === b.ans;
  const INO = () => `C:\\Users\\student\\Documents\\Arduino\\${C.file}\\${C.file}.ino`;
  const logTo = (obj, msg) => pushLog(obj, msg);

  /* ---------- editor ---------- */
  const TIP = { pinMode: '設定腳位模式：pinMode(腳, OUTPUT/INPUT)', digitalWrite: '令腳位輸出 HIGH（開）或 LOW（關）', delay: '暫停，單位是毫秒（1000 = 1 秒）', HIGH: '高電位 5V（開）', LOW: '低電位 0V（關）', OUTPUT: '輸出模式', setup: '開機時執行一次', loop: '不停重複執行', tone: '發聲：tone(腳, 頻率)', noTone: '停聲：noTone(腳)', dot: '短閃', dash: '長閃', letterGap: '字母之間的停頓' };
  function hl(text) {
    let out = '', i = 0;
    const ci = text.indexOf('//');
    const codePart = ci >= 0 ? text.slice(0, ci) : text, com = ci >= 0 ? text.slice(ci) : '';
    const re = /\b(void|int)\b|\b(pinMode|digitalWrite|delay|tone|noTone)\b|\b(HIGH|LOW|OUTPUT)\b|\b(setup|loop)\b|\b(\d+)\b/g;
    let m;
    while ((m = re.exec(codePart))) {
      out += esc(codePart.slice(i, m.index));
      const cls = m[1] ? 'k-type' : m[2] ? 'k-fn' : m[3] ? 'k-const' : m[4] ? 'k-struct' : 'k-num';
      out += `<span class="${cls}"${TIP[m[0]] ? ` title="${TIP[m[0]]}"` : ''}>${esc(m[0])}</span>`;
      i = m.index + m[0].length;
    }
    out += esc(codePart.slice(i));
    if (com) out += `<span class="k-com">${esc(com)}</span>`;
    return out;
  }
  function renderEditor() {
    const ed = $('#editor');
    if (C.debug) return renderDebugEditor();
    ed.innerHTML = C.tpl.map((line, idx) => {
      const parts = line.split(/(\{\{[a-z]\d\}\})/);
      const html = parts.map(p => {
        const m = /^\{\{([a-z]\d)\}\}$/.exec(p);
        if (!m) return hl(p);
        const b = C.blanks.find(x => x.id === m[1]); const st = B(b.id);
        const n = b.id.slice(1);
        const cls = st.revealed ? 'rev' : st.status;
        const w = Math.max(b.ans.length, 3) + 1.6;
        return `<span class="bnum ${cls}">${n}</span><input class="blank ${cls}" id="blank-${b.id}" data-b="${b.id}" style="width:${w}ch" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="空格 ${n}：${b.ask}" value="${esc(st.val)}" ${st.status === 'ok' || st.revealed ? 'readonly' : ''}>`;
      }).join('');
      return `<div class="cl" data-ln="${idx + 1}"><span class="ln">${idx + 1}</span><span class="tx">${html || ' '}</span></div>`;
    }).join('');
    $$('.blank', ed).forEach(inp => {
      inp.addEventListener('focus', () => { lastFocus = inp.dataset.b; markLine(inp); });
      inp.addEventListener('input', () => {
        const st = B(inp.dataset.b); st.val = inp.value;
        if (st.status === 'bad') { st.status = ''; inp.classList.remove('bad'); inp.previousElementSibling.classList.remove('bad'); }
        save();
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); focusNext(inp.dataset.b); } });
    });
  }
  function markLine(inp) {
    $$('.cl.cur').forEach(x => x.classList.remove('cur'));
    const cl = inp.closest('.cl'); cl.classList.add('cur');
    const ln = +cl.dataset.ln; const col = C.tpl[ln - 1].indexOf('{{' + inp.dataset.b) + 1;
    $('#stPos').textContent = `Ln ${ln}, Col ${col}`;
  }
  function focusNext(id) {
    const bl = C.blanks, i = bl.findIndex(b => b.id === id);
    for (let k = 1; k <= bl.length; k++) {
      const b = bl[(i + k) % bl.length]; const st = B(b.id);
      if (st.status !== 'ok' && !st.revealed) { const el = $('#blank-' + b.id); el.focus(); el.select(); el.scrollIntoView({ block: 'nearest' }); return; }
    }
  }

  /* whole-program editor for challenge 2 (fix the broken program) */
  function renderDebugEditor() {
    const ed = $('#editor'), st = C.st(), locked = st.done;
    ed.innerHTML = `<div class="dbg-wrap"><div class="dbg-ln" id="dbgLn"></div><textarea class="dbg-ta" id="dbgTa" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="程式（可以直接修改）" ${locked ? 'readonly' : ''}>${esc(st.text)}</textarea></div>`;
    const ta = $('#dbgTa');
    ta.addEventListener('input', () => { st.text = ta.value; st.compileOk = false; save(); syncDebug(); });
    ta.addEventListener('keyup', syncCaret); ta.addEventListener('click', syncCaret);
    ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const p = ta.selectionStart; ta.setRangeText('  ', p, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); } });
    syncDebug();
  }
  let errLines = [];
  function syncDebug() {
    const ta = $('#dbgTa'); if (!ta) return;
    const n = ta.value.split('\n').length;
    ta.style.height = Math.max(440, n * 22 + 8) + 'px';
    $('#dbgLn').innerHTML = Array.from({ length: n }, (_, i) => `<b class="${errLines.includes(i + 1) ? 'err' : ''}">${i + 1}</b>`).join('');
    renderBugPills();
  }
  function syncCaret() {
    const ta = $('#dbgTa'); if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart).split('\n');
    $('#stPos').textContent = `Ln ${before.length}, Col ${before[before.length - 1].length + 1}`;
  }
  function renderBugPills() {
    const el = $('#bugPills'); if (!el || !C.debug) return;
    const bs = bugStatus(C.st().text), n = bs.filter(b => b.ok).length;
    el.innerHTML = `<span class="pill ${n === 4 ? 'ok' : ''}">已修正 ${n} / 4</span>`;
  }

  /* ---------- checking answers (fill-in contexts) ---------- */
  function feedback(b, v) {
    const lc = v.toLowerCase();
    if (lc === b.ans.toLowerCase()) return '大小寫不對。Arduino 會分辨大小寫，請看清楚。';
    if (/[^\x00-\x7F]/.test(v)) return '不可以用中文或全形字，只可以用英文和數字。';
    if (b.ctx === 'delay') {
      const f = parseFloat(v);
      if (!isNaN(f) && Math.round(f * 1000) === +b.ans) return 'delay() 的單位是<b>毫秒</b>，不是秒。';
      if (/^\d+$/.test(v)) return '時間不對，再看看那一行的註解（灰色文字）。';
    }
    if (b.ctx === 'mode' && lc === 'input') return 'INPUT 是「輸入」（例如讀取按鈕）；L 燈要用「輸出」。';
    if (b.ctx === 'level' && b.ans === 'HIGH' && lc === 'low') return 'LOW 是關燈，開燈要用高電位。';
    if (b.ctx === 'level' && b.ans === 'LOW' && lc === 'high') return 'HIGH 是開燈，關燈要用低電位。';
    if (b.ctx === 'level' && /^\d+$/.test(v)) return '這裏要寫「高」或「低」電位的英文，不是數字。';
    if (b.ctx === 'func' && lc === 'pinmode') return 'pinMode 只用來設定模式，開燈要用另一個指令。';
    if (b.ctx === 'func' && lc === 'delay') return 'delay 是等待。開燈要用令腳位輸出 HIGH 的指令。';
    if (b.ctx === 'func' && lc === 'digitalread') return 'digitalRead 是「讀取」輸入；控制燈要「寫」出信號。';
    return '';
  }
  function checkAnswers() {
    const st = C.st(), bl = C.blanks;
    st.checks = (st.checks || 0) + 1;
    let ok = 0, empty = 0, bad = 0;
    bl.forEach(b => {
      const x = B(b.id);
      if (x.status === 'ok' || x.revealed) { ok++; return; }
      const v = (x.val || '').trim();
      if (!v) { empty++; x.status = ''; x.fb = ''; return; }
      if (isRight(b, v)) { x.status = 'ok'; x.fb = ''; x.val = v; ok++; return; }
      x.status = 'bad'; bad++;
      x.fb = feedback(b, v);
      if (v !== x.lastWrong) { x.wrong++; x.lastWrong = v; logTo(st, `空格 ${b.id.slice(1)}（${b.ask}）填了「${v}」`); }
    });
    save(); renderEditor();
    if (ok === bl.length) {
      st.done = true;
      if (C.name === 'main') S.t.codeEnd = now(); else S.ext[C.name].t.codeEnd = now();
      save();
      explainMap[C.name] = { kind: 'ok', html: `全部 ${bl.length} 格都正確！接下來要把程式上傳到 Arduino。` };
      renderPanel();
      modal(C.full
        ? { title: '程式填空全部正確！', html: `<p>接下來像真的一樣把程式上傳到 Arduino。這是你<b>第一次上傳</b>，右邊會一步一步帶你做；第一次做錯只會提示，不會扣分。</p><ol style="margin:10px 0 0;padding-left:1.3em;display:flex;flex-direction:column;gap:4px"><li>插上 USB 線</li><li>在 <span class="path">Tools → Board</span> 選開發板</li><li>在 <span class="path">Tools → Port</span> 選連接埠</li><li>按 ✓ 驗證，再按 → 上傳</li></ol>`, actions: [{ label: '開始', kind: 'go' }] }
        : { title: '程式填空全部正確！', html: `<p>USB 線、Board 和 Port 已經在主任務設定好。按 <b>✓ Verify</b> 驗證，再按 <b>→ Upload</b> 上傳。</p>`, actions: [{ label: '好', kind: 'go' }] });
      return;
    }
    const parts = [`${ok} / ${bl.length} 格正確`];
    if (bad) parts.push(`${bad} 格有錯（紅色）`);
    if (empty) parts.push(`${empty} 格未填`);
    explainMap[C.name] = { kind: bad ? 'err' : 'warn', html: parts.join('，') + '。' + (bad ? '看看右邊清單的提示，改好後再按「檢查答案」。' : '') };
    renderPanel();
    const firstBad = bl.find(b => B(b.id).status === 'bad') || bl.find(b => B(b.id).status !== 'ok' && !B(b.id).revealed);
    if (firstBad) { const el = $('#blank-' + firstBad.id); el.focus(); el.scrollIntoView({ block: 'center' }); }
  }
  function reveal(id) {
    const b = C.blanks.find(x => x.id === id);
    modal({
      title: `顯示空格 ${id.slice(1)} 的答案？`,
      html: `<p>${C.revealNote}</p>`,
      actions: [{ label: '再試一次', kind: 'ghost' }, { label: '顯示答案', kind: 'primary', onClick: () => {
        const st = B(id); st.revealed = true; st.val = b.ans; st.status = ''; st.fb = '';
        logTo(C.st(), `顯示答案：空格 ${id.slice(1)}（${b.ask}）`); save(); renderEditor(); renderPanel();
        if (C.blanks.every(x => B(x.id).status === 'ok' || B(x.id).revealed)) checkAnswers();
      } }],
    });
  }

  /* ---------- challenge 2: explain errors, show answer ---------- */
  function explainDebugErr(e) {
    if (e.kind === 'stray') return `這一行有<b>中文或全形字</b>「${esc(e.ch)}」。程式只可以用英文、數字和半形符號，例如分號要用半形的 <code>;</code>（輸入法要轉回英文）。`;
    if (e.kind === 'semi') return `句尾少了分號 <code>;</code>。每個指令最後都要有分號。留意：錯誤訊息說的是「<b>下一個字之前</b>」，所以要看<b>上一句</b>的句尾。`;
    if (e.kind === 'undecl') return `編譯器不認識「${esc(e.msg.match(/'([^']+)'/)[1])}」。${e.sug ? `你是否想寫 <b>${e.sug}</b>？Arduino 會分辨大小寫。` : '檢查一下串字和大小寫。'}`;
    if (e.kind === 'args') return `<code>${e.name}()</code> 括號內的資料數量不對。`;
    if (e.kind === 'nocall') return '指令後面要有括號 <code>( )</code>，括號內寫資料。';
    if (e.kind === 'brace') return '大括號 <code>{ }</code> 要成對出現。檢查有沒有刪走了 <code>}</code>。';
    if (e.kind === 'link') return '程式一定要有 <code>void setup()</code> 和 <code>void loop()</code>。';
    return '這一行的寫法不對。可以按「重設程式」，回到最初的版本再試。';
  }
  function revealC2() {
    modal({
      title: '顯示正確的程式？',
      html: '<p>顯示答案後，這個挑戰的程式分只得 3 分（滿分 8 分）。建議先看清楚錯誤訊息再試一次。</p>',
      actions: [{ label: '再試一次', kind: 'ghost' }, { label: '顯示答案', kind: 'primary', onClick: () => {
        const st = C.st(); st.text = FIXED_CODE; st.revealed = true; st.compileOk = false;
        logTo(st, '顯示正確的程式'); save(); renderEditor(); renderPanel();
        explainMap.c2 = { kind: 'info', html: '已換上正確的程式。比較一下改了甚麼，然後按 ✓ Verify，再按 → Upload。' }; renderPanel();
      } }],
    });
  }
  function resetC2() {
    modal({
      title: '重設程式？', html: '<p>你的修改會全部清除，回到最初有錯處的版本。</p>',
      actions: [{ label: '取消', kind: 'ghost' }, { label: '重設', kind: 'primary', onClick: () => {
        const st = C.st(); st.text = BUGGY_CODE; st.compileOk = false; errLines = []; save(); renderEditor(); renderPanel();
      } }],
    });
  }

  /* ---------- menus ---------- */
  const deco = () => toast('今次任務不需要用這個功能。');
  function menuDef(name) {
    const up = S.up;
    if (name === 'file') return ['New Sketch|Ctrl+N', 'New Cloud Sketch|Alt+Ctrl+N', 'Open...|Ctrl+O', 'Open Recent>', 'Sketchbook>', 'Examples>', '-', 'Close|Ctrl+W', 'Save|Ctrl+S', 'Save As...|Ctrl+Shift+S', '-', 'Preferences...|Ctrl+Comma', '-', 'Quit|Ctrl+Q'].map(parseDeco);
    if (name === 'edit') return ['Undo|Ctrl+Z', 'Redo|Ctrl+Y', '-', 'Cut|Ctrl+X', 'Copy|Ctrl+C', 'Copy for Forum (Markdown)', 'Paste|Ctrl+V', 'Select All|Ctrl+A', '-', 'Comment/Uncomment|Ctrl+/', 'Increase Indent|Tab', 'Decrease Indent|Shift+Tab', '-', 'Find|Ctrl+F'].map(parseDeco);
    if (name === 'sketch') return [{ label: 'Verify/Compile', sc: 'Ctrl+R', act: () => verify() }, { label: 'Upload', sc: 'Ctrl+U', act: () => upload() }, ...['Configure and Upload', 'Upload Using Programmer|Ctrl+Shift+U', 'Export Compiled Binary|Alt+Ctrl+S', '-', 'Show Sketch Folder|Alt+Ctrl+K', 'Include Library>', 'Add File...'].map(parseDeco)];
    if (name === 'help') return ['Getting Started', 'Environment', 'Troubleshooting', 'Reference', '-', 'Find in Reference|Ctrl+Shift+F', 'Frequently Asked Questions', 'Visit Arduino.cc', '-', 'About Arduino IDE'].map(parseDeco);
    if (name === 'tools') return [
      ...['Auto Format|Ctrl+T', 'Archive Sketch', 'Manage Libraries...|Ctrl+Shift+I', 'Serial Monitor|Ctrl+Shift+M', 'Serial Plotter', '-', 'WiFi101 / WiFiNINA Firmware Updater', '-'].map(parseDeco),
      { label: `Board: "${up.board || ''}"`.replace('Board: ""', 'Board'), sub: () => [
        { label: 'Boards Manager...', sc: 'Ctrl+Shift+B', act: deco },
        { sep: true },
        { label: 'Arduino AVR Boards', sub: () => BOARDS.map(bn => ({ label: bn, checked: up.board === bn, act: () => setBoard(bn) })) },
      ] },
      { label: up.port ? `Port: "${up.port}${up.port === up.com && up.usb ? ' (Arduino Uno)' : ''}"` : 'Port', sub: () => [
        { hdr: 'Serial ports' },
        { label: 'COM1', checked: up.port === 'COM1', act: () => setPort('COM1') },
        ...(up.usb ? [{ label: `${up.com} (Arduino Uno)`, checked: up.port === up.com, act: () => setPort(up.com) }] : []),
      ] },
      { label: 'Get Board Info', act: boardInfo },
      { sep: true },
      ...['Programmer>', 'Burn Bootloader'].map(parseDeco),
    ];
    return [];
  }
  function parseDeco(s) {
    if (s === '-') return { sep: true };
    const sub = s.endsWith('>'); s = s.replace(/>$/, '');
    const [label, sc] = s.split('|');
    return sub ? { label, sub: () => [{ label: '（今次任務不需要）', dis: true }] } : { label, sc, act: deco, dim: true };
  }
  let openMenus = [];
  function closeMenus() { openMenus.forEach(m => m.remove()); openMenus = []; $$('.mbtn.open').forEach(b => b.classList.remove('open')); }
  function openMenu(items, x, y, level) {
    openMenus.slice(level).forEach(m => m.remove()); openMenus = openMenus.slice(0, level);
    const wrap = $('.ide-wrap');
    const m = document.createElement('div'); m.className = 'menu';
    items.forEach(it => {
      if (it.sep) { m.insertAdjacentHTML('beforeend', '<div class="sep"></div>'); return; }
      if (it.hdr) { m.insertAdjacentHTML('beforeend', `<div class="hdr">${esc(it.hdr)}</div>`); return; }
      const el = document.createElement('div');
      el.className = 'mi ' + (it.dis ? 'dis' : 'act') + (it.checked ? ' checked' : '');
      el.innerHTML = `<span>${esc(it.label)}</span>${it.sub ? '<span class="arrow">▶</span>' : it.sc ? `<span class="sc">${esc(it.sc)}</span>` : ''}`;
      if (it.sub) {
        const open = () => { $$('.mi.hover', m).forEach(x => x.classList.remove('hover')); el.classList.add('hover'); const r = el.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); openMenu(it.sub(), r.right - wr.left - 2, r.top - wr.top - 5, level + 1); };
        el.addEventListener('mouseenter', open); el.addEventListener('click', e => { e.stopPropagation(); open(); });
      } else if (!it.dis) {
        el.addEventListener('mouseenter', () => { $$('.mi.hover', m).forEach(x => x.classList.remove('hover')); openMenus.slice(level + 1).forEach(x => x.remove()); openMenus = openMenus.slice(0, level + 1); });
        el.addEventListener('click', e => { e.stopPropagation(); closeMenus(); it.act && it.act(); });
      }
      m.appendChild(el);
    });
    m.style.left = x + 'px'; m.style.top = y + 'px';
    wrap.appendChild(m); openMenus.push(m);
    const wr = wrap.getBoundingClientRect(), mr = m.getBoundingClientRect();
    if (mr.right > wr.right + 120 && level > 0) m.style.left = Math.max(0, x - mr.width - (openMenus[level - 1] ? openMenus[level - 1].getBoundingClientRect().width : 0) + 4) + 'px';
    const vh = window.innerHeight; if (mr.bottom > vh - 8) m.style.maxHeight = (vh - mr.top - 12) + 'px', m.style.overflowY = 'auto';
    return m;
  }

  /* ---------- board & port (physical, shared by all contexts) ---------- */
  function setBoard(bn) { S.up.board = bn; save(); renderStatus(); renderPanel(); toast(`已選擇開發板：${bn}`); }
  function setPort(p) { S.up.port = p; save(); renderStatus(); renderPanel(); toast(`已選擇連接埠：${p}`); }
  function renderStatus() {
    const up = S.up;
    $('#boardSelTxt').textContent = up.board ? `${up.board}${up.port ? ' · ' + up.port : ''}` : (up.port ? `Unknown · ${up.port}` : 'Select Board');
    $('#boardDot').classList.toggle('on', !!(up.usb && up.port === up.com));
    $('#stBoard').textContent = up.board ? `${up.board}${up.port ? ' on ' + up.port : ''}${up.port && !(up.usb && up.port === up.com) ? ' [not connected]' : ''}` : 'No board selected';
  }
  function boardSelMenu() {
    const up = S.up; const btn = $('#boardSelBtn');
    const r = btn.getBoundingClientRect(), wr = $('.ide-wrap').getBoundingClientRect();
    const items = [];
    if (up.usb) items.push({ label: `Arduino Uno   ${up.com}`, checked: up.board === 'Arduino Uno' && up.port === up.com, act: () => { S.up.board = 'Arduino Uno'; S.up.port = up.com; save(); renderStatus(); renderPanel(); toast(`已選擇 Arduino Uno（${up.com}）`); } });
    else items.push({ label: 'No board detected（未偵測到開發板）', dis: true });
    items.push({ sep: true }, { label: 'Select other board and port...', act: () => toast('請用上方選單 Tools → Board 及 Tools → Port 選擇。') });
    openMenu(items, r.left - wr.left, r.bottom - wr.top + 4, 0);
  }
  function boardInfo() {
    const up = S.up;
    if (!up.usb || up.port !== up.com) { modal({ title: 'Board Info', html: `<p class="mono">Please select a port to obtain board info.</p><p class="muted small" style="margin-top:8px">請先插上 USB 線，並在 Tools → Port 選擇 Arduino Uno 所在的連接埠。</p>` }); return; }
    modal({ title: 'Board Info', html: `<pre class="mono" style="margin:0;font-size:13px">BN: Arduino Uno\nVID: 0x2341\nPID: 0x0043\nSN: 75833353035351E0C1F2</pre><p class="muted small" style="margin-top:8px">電腦已認出這塊板是 Arduino Uno，接在 ${up.com}。</p>` });
  }
  function plugUsb() {
    if (S.up.usb) return;
    S.up.usb = true; save();
    renderMini(); renderStatus(); renderPanel();
    toast(`電腦已偵測到新裝置：Arduino Uno（${S.up.com}）`, 'ok');
  }

  /* ---------- compile ---------- */
  const KNOWN = ['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'true', 'false', 'ledPin', 'buzzerPin', 'pitch'];
  const FUNCS = ['digitalWrite', 'digitalRead', 'pinMode', 'delay', 'analogWrite', 'tone', 'noTone'];
  const ARITY = { digitalWrite: [2], digitalRead: [1], pinMode: [2], delay: [1], analogWrite: [2], tone: [2, 3], noTone: [1] };
  const PROTO = { digitalWrite: 'void digitalWrite(uint8_t, uint8_t)', digitalRead: 'int digitalRead(uint8_t)', pinMode: 'void pinMode(uint8_t, uint8_t)', delay: 'void delay(long unsigned int)', analogWrite: 'void analogWrite(uint8_t, int)', tone: 'void tone(uint8_t, unsigned int, long unsigned int)', noTone: 'void noTone(uint8_t)' };
  function suggest(id) { const all = KNOWN.concat(FUNCS); return all.find(k => k.toLowerCase() === id.toLowerCase() && k !== id) || null; }
  function compileBlanks() {
    const errs = [];
    const filled = C.tpl.map(l => l.replace(/\{\{([a-z]\d)\}\}/g, (_, id) => (B(id).val || '').trim()));
    C.blanks.forEach(b => {
      const v = (B(b.id).val || '').trim();
      const line = b.line, lineTxt = filled[line - 1];
      const col = C.tpl[line - 1].indexOf('{{' + b.id) + 1;
      const fn = fnOf(C.tpl, line);
      const push = (msg, extra = {}) => errs.push({ b, line, col, fn, msg, lineTxt, len: Math.max(1, v.length), ...extra });
      if (/[^\x00-\x7F]/.test(v)) { const byte = new TextEncoder().encode(v.match(/[^\x00-\x7F]/)[0])[0]; push(`stray '\\${byte.toString(8)}' in program`, { kind: 'stray' }); return; }
      if (!v) {
        if (b.ctx === 'delay') push("too few arguments to function 'void delay(long unsigned int)'", { kind: 'empty' });
        else if (b.ctx === 'init') push("expected primary-expression before ';' token", { kind: 'empty' });
        else if (b.ctx === 'arg') push("too few arguments to function 'void noTone(uint8_t)'", { kind: 'empty' });
        else if (b.ctx !== 'func') push("expected primary-expression before ')' token", { kind: 'empty' });
        else push("expected primary-expression before '(' token", { kind: 'empty' });
        return;
      }
      const tok = v.split(/\s+/)[0];
      if (/^-?\d+(\.\d+)?$/.test(v)) { if (b.ctx === 'func') push(`expression cannot be used as a function`, { kind: 'bad' }); return; }
      if (/^[A-Za-z_]\w*$/.test(tok)) {
        if (b.ctx === 'func') {
          if (FUNCS.includes(tok) && tok === v) {
            const n = b.argc || 2;
            if (!ARITY[tok].includes(n)) return push(`too ${n > Math.max(...ARITY[tok]) ? 'many' : 'few'} arguments to function '${PROTO[tok]}'`, { kind: 'args' });
            return;
          }
        } else if (KNOWN.includes(tok) && tok === v) return;
        return push(`'${tok}' was not declared in this scope`, { kind: 'undecl', sug: suggest(tok) });
      }
      push(`expected primary-expression before '${esc(v[0])}' token`, { kind: 'bad' });
    });
    return errs;
  }
  function compileDebug() {
    const { errs } = parseDebug(C.st().text);
    return { errs, warns: [] };
  }
  function diagLines(list, sev) {
    const out = []; let lastFn;
    list.forEach(e => {
      if (e.fn && e.fn !== lastFn) { out.push({ c: '', t: `${INO()}: In function '${e.fn}':` }); lastFn = e.fn; }
      out.push({ c: sev === 'error' ? 'e' : 'w', t: `${INO()}:${e.line}:${e.col}: ${sev}: ${e.msg}` });
      out.push({ c: '', t: ` ${e.lineTxt}` });
      out.push({ c: sev === 'error' ? 'e' : 'w', t: ' ' + ' '.repeat(Math.max(0, e.col - 1)) + '^' + '~'.repeat(Math.max(0, e.len - 1)) });
      if (e.sug) out.push({ c: 'g', t: `${INO()}:${e.line}:${e.col}: note: suggested alternative: '${e.sug}'` });
    });
    return out;
  }
  function errText(errs) {
    const out = diagLines(errs, 'error');
    out.push({ c: '', t: '' }, { c: 'e', t: 'exit status 1' }, { c: '', t: '' }, { c: 'e', t: `Compilation error: ${errs[0].msg}` });
    return out;
  }
  function explainCompile(errs) {
    const e = errs[0];
    if (C.debug) return `<b>編譯失敗（Compilation error）</b><br>第 ${e.line} 行：${explainDebugErr(e)}${errs.length > 1 ? `<br><span class="small">另外還有 ${errs.length - 1} 個錯誤，都在 Output 視窗中。</span>` : ''}`;
    const n = e.b.id.slice(1);
    let why = '';
    if (e.kind === 'stray') why = '程式裏出現了中文或全形字。程式碼只可以用英文、數字和半形符號。';
    else if (e.kind === 'empty') why = e.b.ctx === 'delay' ? 'delay() 的括號內要有一個數字（毫秒）。這個空格還未填。' : '這個空格還未填，編譯器不知道那裏應該是甚麼。';
    else if (e.kind === 'undecl') why = `編譯器不認識「${esc(e.msg.match(/'([^']+)'/)[1])}」這個字。${e.sug ? `你是否想寫 <b>${e.sug}</b>？Arduino 會分辨大小寫。` : '檢查一下串字和大小寫。'}`;
    else if (e.kind === 'args') why = '這個指令不能這樣用：括號內的資料數量不對。想想這一行要做甚麼。';
    else why = '這個位置填的內容不符合程式的寫法。';
    return `<b>編譯失敗（Compilation error）</b><br>第 ${e.line} 行、空格 ${n} 有問題：${why}${errs.length > 1 ? `<br><span class="small">另外還有 ${errs.length - 1} 個錯誤，都在 Output 視窗中。</span>` : ''}`;
  }

  /* ---------- output & notifications ---------- */
  function out(lines, append = false) {
    const pre = $('#ideOut');
    const html = lines.map(l => l.c ? `<span class="${l.c}">${esc(l.t)}</span>` : esc(l.t)).join('\n');
    pre.innerHTML = append && pre.innerHTML ? pre.innerHTML + '\n' + html : html;
    pre.scrollTop = pre.scrollHeight;
  }
  async function note(text, ms, withBar = true) {
    const n = $('#ideNote'); n.hidden = false;
    n.innerHTML = `<div>${esc(text)}</div>${withBar ? '<div class="bar"><i></i></div>' : ''}`;
    if (withBar) { const i = $('i', n); requestAnimationFrame(() => { i.style.transition = `width ${ms}ms linear`; i.style.width = '100%'; }); }
    await sleep(ms);
  }
  function hideNote(delay = 0) { setTimeout(() => { $('#ideNote').hidden = true; }, delay); }
  function setBusy(v) { busy = v; $('#btnVerify').disabled = v; $('#btnUpload').disabled = v; $('#outState').textContent = v ? '處理中…' : ''; }

  const SIZE = { main: [924, 9], c1: [954, 9], c2: [924, 9] };
  const sizeLines = () => { const [f, r] = SIZE[C.name]; return [
    { c: '', t: `Sketch uses ${f} bytes (${Math.round(f / 322.56)}%) of program storage space. Maximum is 32256 bytes.` },
    { c: '', t: `Global variables use ${r} bytes (${Math.round(r / 20.48)}%) of dynamic memory, leaving ${2048 - r} bytes for local variables. Maximum is 2048 bytes.` },
  ]; };
  function flowError(kind, action) {
    if (!(C.debug ? C.st().compileOk || C.st().done : C.st().done)) return false;
    const fl = C.flow();
    const sig = `${kind}|${action}|${S.up.board}|${S.up.port}|${S.up.usb}`;
    if (sig === fl.lastErrSig) return false;
    fl.lastErrSig = sig;
    const msgs = { no_board: '未選擇開發板', no_port: '未選擇連接埠（Port）', wrong_port: `選錯連接埠（${S.up.port}）`, wrong_board: `選錯開發板（${S.up.board}）` };
    if (C.name === 'main' && !fl.freeUsed) {       // first upload ever: the first mistake is only a hint
      fl.freeUsed = true; logTo(fl, `${action === 'upload' ? '上傳' : '驗證'}失敗：${msgs[kind]}（第一次，不扣分）`); save(); return 'free';
    }
    fl.errors = (fl.errors || 0) + 1;
    logTo(fl, `${action === 'upload' ? '上傳' : '驗證'}失敗：${msgs[kind]}`);
    save(); return true;
  }
  const recorded = c => c === 'free' ? '<br><span class="small">這是你第一次上傳，這次錯誤<b>只作提示，不扣分</b>。下次要小心。</span>' : c ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : '';

  async function verify(isUpload = false) {
    if (busy) return false;
    closeMenus(); setBusy(true);
    out([]);
    if (!S.up.board) {
      await note('Compiling sketch...', 500);
      hideNote();
      out([{ c: 'e', t: 'Compilation error: Missing FQBN (Fully Qualified Board Name)' }]);
      const counted = flowError('no_board', isUpload ? 'upload' : 'verify');
      explainMap[C.name] = { kind: 'err', html: `<b>未選擇開發板。</b>編譯器要知道程式是給哪一款板用的。請到 <span class="path">Tools → Board → Arduino AVR Boards</span> 選 <b>Arduino Uno</b>。${recorded(counted)}` };
      setBusy(false); renderPanel(); return false;
    }
    await note('Compiling sketch...', 1300);
    let errs, warns = [];
    if (C.debug) ({ errs, warns } = compileDebug()); else errs = compileBlanks();
    $$('.cl.errline').forEach(x => x.classList.remove('errline'));
    if (errs.length) {
      hideNote();
      out(diagLines(warns, 'warning').concat(errText(errs)));
      errs.forEach(e => { const cl = $(`.cl[data-ln="${e.line}"]`); cl && cl.classList.add('errline'); });
      if (C.debug) { const st = C.st(); st.compileOk = false; if (st.text !== st.lastSig) { st.compileFails = (st.compileFails || 0) + 1; st.lastSig = st.text; logTo(st, `編譯錯誤：第 ${errs[0].line} 行 ${errs[0].msg}`); } errLines = errs.map(e => e.line); syncDebug(); save(); }
      explainMap[C.name] = { kind: 'err', html: explainCompile(errs) };
      setBusy(false); renderPanel(); return false;
    }
    out(diagLines(warns, 'warning').concat(sizeLines()));
    if (C.debug) { C.st().compileOk = true; errLines = []; syncDebug(); save(); }
    const done = C.debug ? true : C.st().done;
    if (!isUpload) {
      await note('Done compiling.', 1600, false); hideNote();
      if (done && S.up.board === 'Arduino Uno') { C.flow().verified = true; save(); }
      explainMap[C.name] = C.debug && S.up.board === 'Arduino Uno'
        ? { kind: 'ok', html: '<b>編譯成功（Done compiling）。</b>文法錯誤已經全部修正！但編譯器只檢查<b>文法</b>，不知道燈會不會閃。按 → Upload，看看 L 燈是否真的每秒閃一次。' }
        : done
        ? (S.up.board === 'Arduino Uno' ? { kind: 'ok', html: '<b>編譯成功（Done compiling）。</b>程式沒有文法錯誤。下一步：按 → Upload 上傳。' } : { kind: 'warn', html: `編譯成功，但你選的開發板是 <b>${esc(S.up.board)}</b>。你手上的是 Arduino Uno，上傳前請更改。` })
        : { kind: 'warn', html: `<b>編譯成功，但這不代表程式正確！</b>編譯器只檢查文法，不知道數字是否正確。請按「檢查答案」確認每一格。${warns.length ? '<br>另外 Output 有黃色的 <b>warning</b>，要留意。' : ''}` };
      setBusy(false); renderPanel(); return true;
    }
    return true;
  }

  async function upload() {
    if (busy) return;
    if (!C.debug && !C.st().done) {
      const msg = `上傳之前，要先完成 ${C.blanks.length} 個空格，並按「檢查答案」確認全部正確。`;
      toast(msg); explainMap[C.name] = { kind: 'warn', html: msg }; renderPanel(); return;
    }
    SOUND.unlock();
    const ok = await verify(true);
    if (!ok) return;
    const up = S.up;
    if (!up.port) {
      hideNote(); out([{ c: 'e', t: 'Failed uploading: no upload port provided' }], true);
      const counted = flowError('no_port', 'upload');
      explainMap[C.name] = { kind: 'err', html: `<b>未選擇連接埠（Port）。</b>${up.usb ? '' : '你還未插上 USB 線。'}電腦要知道 Arduino 接在哪一個 COM。請${up.usb ? '' : '先插上 USB 線，再'}到 <span class="path">Tools → Port</span> 選有 <b>(Arduino Uno)</b> 字樣的那一個。${recorded(counted)}` };
      setBusy(false); renderPanel(); return;
    }
    await note('Uploading...', 900);
    if (up.port !== up.com || !up.usb) {
      const lines = [];
      for (let i = 1; i <= 10; i++) lines.push({ c: 'e', t: `avrdude: stk500_recv(): programmer is not responding` }, { c: 'e', t: `avrdude: stk500_getsync() attempt ${i} of 10: not in sync: resp=0x00` });
      lines.push({ c: '', t: '' }, { c: 'e', t: 'Failed uploading: uploading error: exit status 1' });
      hideNote(); out(lines, true);
      const counted = flowError('wrong_port', 'upload');
      explainMap[C.name] = { kind: 'err', html: `<b>上傳失敗：選錯連接埠。</b>${esc(up.port)} 不是 Arduino，所以電腦得不到回應（not in sync）。請到 <span class="path">Tools → Port</span> 選有 <b>(Arduino Uno)</b> 字樣的那一個。${recorded(counted)}` };
      setBusy(false); renderPanel(); return;
    }
    if (up.board !== 'Arduino Uno') {
      let lines;
      if (/Leonardo|Micro|Esplora|Yún|LilyPad Arduino USB/.test(up.board)) lines = [{ c: 'e', t: "Couldn't find a Board on the selected port. Check that you have the correct port selected.  If it is correct, try pressing the board's reset button after initiating the upload." }];
      else if (/Mega/.test(up.board)) lines = [{ c: 'e', t: 'avrdude: stk500v2_ReceiveMessage(): timeout' }, { c: 'e', t: 'avrdude: stk500v2_ReceiveMessage(): timeout' }, { c: 'e', t: 'avrdude: stk500v2_getsync(): timeout communicating with programmer' }];
      else { lines = []; for (let i = 1; i <= 10; i++) lines.push({ c: 'e', t: `avrdude: stk500_getsync() attempt ${i} of 10: not in sync: resp=0x${(0x1c + i * 7).toString(16)}` }); }
      lines.push({ c: '', t: '' }, { c: 'e', t: 'Failed uploading: uploading error: exit status 1' });
      hideNote(); out(lines, true);
      const counted = flowError('wrong_board', 'upload');
      explainMap[C.name] = { kind: 'err', html: `<b>上傳失敗：選錯開發板。</b>你選了 <b>${esc(up.board)}</b>，但接着的是 <b>Arduino Uno</b>，上傳方式不同，所以失敗。請到 <span class="path">Tools → Board → Arduino AVR Boards</span> 改選 Arduino Uno。${recorded(counted)}` };
      setBusy(false); renderPanel(); return;
    }
    let flick = setInterval(() => { $$('.mTX,.mRX').forEach(el => el.setAttribute('fill', Math.random() > .4 ? '#FFB020' : '#6B5A2E')); }, 70);
    await note('Uploading...', 1500);
    clearInterval(flick); $$('.mTX,.mRX').forEach(el => el.setAttribute('fill', '#6B5A2E'));
    await note('Done uploading.', 100, false);
    hideNote(2500);
    if (C.debug) {   // the program compiled: does the L light really blink?
      const st = C.st(), r = runDebug(parseDebug(st.text).fns);
      if (!r.ok) {
        st.runTries = (st.runTries || 0) + 1;
        if (st.text !== st.lastRunSig) { st.wrongRuns = (st.wrongRuns || 0) + 1; st.lastRunSig = st.text; logTo(st, `上傳後燈號不對：${r.kind}`); }
        save();
        const tip = r.kind === 'alwayson' ? `想一想：關燈之後，程式立即回到 <code>loop()</code> 第一行再開燈。熄燈的時間只有百萬分之幾秒，眼睛看不到。${st.runTries >= 2 ? '<br><b>提示：</b>在 <code>digitalWrite(13, LOW);</code> 之後加一行 <code>delay(1000);</code>。' : ''}`
          : r.kind === 'nomode' ? '檢查 <code>setup()</code> 有沒有 <code>pinMode(13, OUTPUT);</code>。' : '檢查 <code>loop()</code> 內控制 13 號腳的指令。';
        explainMap.c2 = { kind: 'warn', html: `<b>上傳成功，但是……</b>${r.why}這是<b>邏輯錯誤</b>：文法沒有問題，所以編譯器找不到，但程式做的事不對。<br>${tip}` };
        setBusy(false); renderPanel(); EXT.showWrongRun(r); return;
      }
      st.done = true; S.ext.c2.t.codeEnd = now(); save(); renderEditor();
    }
    const fl = C.flow(); fl.uploaded = true; fl.verified = true;
    if (C.name === 'main') { S.t.upEnd = now(); if (!S.t.real) S.t.real = now(); unlock('real'); }
    else { const x = S.ext[C.name]; x.done = true; x.t.end = now(); }
    save();
    explainMap[C.name] = { kind: 'ok', html: C.name === 'main' ? '<b>上傳完成（Done uploading）！</b>UNO 板上的 L 燈正在每秒閃一次。' : '<b>上傳完成（Done uploading）！</b>延伸挑戰完成。' };
    setBusy(false); renderPanel();
    if (C.name === 'main') { startMiniBlink(); showResult(); }
    else EXT.showResult(C.name, true);
  }

  function showResult() {
    let stop = null;
    const run = (back, ms) => {
      stop && stop();
      $('#spdCode', back).textContent = `delay(${ms});`;
      stop = playSeq([[1, ms], [0, ms]], on => HW.setL(back, on));
    };
    modal({
      title: '上傳成功！L 燈正在閃',
      wide: true,
      html: `<div class="sos-stage" id="resStage">${HW.circuitSVG()}</div>
        <div class="stack" style="margin-top:12px;gap:8px">
          <p>你的程式令 13 號腳<b>每秒開關一次</b>，所以板上的 L 燈亮 1 秒、熄 1 秒，不停重複。</p>
          <div class="speed"><label for="spd"><b>試一試：</b>如果把兩個 <code id="spdCode">delay(1000);</code> 都改成這個數值……</label>
            <input type="range" id="spd" min="100" max="2000" step="100" value="1000" aria-label="delay 的數值（毫秒）"></div>
          <p class="small muted">數值愈細，閃得愈快。在實物挑戰中，你會在真的 UNO 上改一改這個數字，證明程式是你上傳的。</p>
        </div>`,
      actions: [{ label: '留在這頁', kind: 'ghost', onClick: () => { stop && stop(); } }, { label: '下一步：實物挑戰', kind: 'go', onClick: () => { stop && stop(); goStage('real'); } }],
      dismissable: false,
      onOpen: back => {
        const r = $('#spd', back);
        r.addEventListener('input', () => run(back, +r.value));
        run(back, 1000);
      },
    });
  }

  /* ---------- mini board in the side panel ---------- */
  function miniSVG() {
    const u = S.up.usb;
    return `<svg viewBox="0 0 210 110" aria-label="${u ? 'USB 線已連接' : 'USB 線未連接'}">
      <rect x="0" y="0" width="210" height="110" rx="8" fill="#1E5A4B"/>
      <path d="M-4 55H${u ? 58 : 28}" stroke="#2B2B2B" stroke-width="9"/>
      <rect x="${u ? 50 : 20}" y="47" width="18" height="16" rx="2" fill="#8A969B"/>
      <rect x="68" y="18" width="130" height="80" rx="6" fill="#0E7C9B"/>
      <rect x="62" y="44" width="24" height="22" rx="2" fill="#C9D0D3"/>
      <text x="150" y="66" font-size="16" fill="#fff" font-style="italic" font-weight="700" text-anchor="middle">UNO</text>
      <rect x="96" y="28" width="7" height="4" fill="#6B5A2E" class="mL"/><text x="106" y="32" font-size="6" fill="#fff">L</text>
      <rect x="96" y="36" width="7" height="4" fill="#6B5A2E" class="mTX"/><text x="106" y="40" font-size="6" fill="#fff">TX</text>
      <rect x="96" y="44" width="7" height="4" fill="#6B5A2E" class="mRX"/><text x="106" y="48" font-size="6" fill="#fff">RX</text>
      <rect x="176" y="30" width="7" height="4" fill="${u ? '#3CFF7A' : '#2E5B3A'}"/><text x="176" y="42" font-size="6" fill="#fff">ON</text>
    </svg>`;
  }
  let miniStop = null;
  function renderMini() { const m = $('#miniBoard'); if (m) m.innerHTML = miniSVG(); }
  function startMiniBlink() { if (miniStop) miniStop(); miniStop = playSeq(BLINK_SEQ, on => { const l = $('.mL'); l && l.setAttribute('fill', on ? '#FFB020' : '#6B5A2E'); }); }

  /* ---------- side panel ---------- */
  function flowSteps() {
    const up = S.up, fl = C.flow(), c = C.debug ? !!(C.st().compileOk || C.st().done) : C.st().done;
    const first = { t: C.debug ? '找出並修正錯處（Verify 至沒有錯誤）' : '完成程式填空', done: c };
    if (C.debug) return [first, { t: '上傳，看看 L 燈是否每秒閃一次', done: !!fl.uploaded }];
    if (!C.full) return [first, { t: '驗證（編譯）程式', done: !!fl.verified }, { t: '上傳程式', done: !!fl.uploaded }];
    return [first,
      { t: '插上 USB 線', done: up.usb },
      { t: '選擇開發板（Board）', done: up.board === 'Arduino Uno' },
      { t: '選擇連接埠（Port）', done: up.usb && up.port === up.com },
      { t: '驗證（編譯）程式', done: !!fl.verified },
      { t: '上傳程式', done: !!fl.uploaded }];
  }
  function blanksBody() {
    const bl = C.blanks;
    const nOk = bl.filter(b => B(b.id).status === 'ok' || B(b.id).revealed).length;
    return `<p>${C.intro}</p>
      <div class="row"><button class="btn primary sm" id="btnCheck">檢查答案</button><span class="pill ${nOk === bl.length ? 'ok' : ''}">${nOk} / ${bl.length} 格正確</span></div>
      <div><div class="small muted" style="margin-bottom:4px">字詞庫（先點空格，再點字詞）</div><div class="bank">${C.bank.map(w => `<button class="chip" data-w="${w}">${w}</button>`).join('')}</div></div>
      <ul class="blist">${bl.map(b => {
        const st = B(b.id); const cls = st.revealed ? 'rev' : st.status;
        let extra = '';
        if (st.status === 'ok') extra = '<span class="pill ok">正確</span>';
        else if (st.revealed) extra = '<span class="pill warn">已顯示答案</span>';
        else if (st.wrong >= 3) extra = `<button class="btn sm ghost" data-rev="${b.id}">顯示答案</button>`;
        let h = '';
        if (st.status === 'bad' && st.fb) h += `<div class="fb">${st.fb}</div>`;
        if (st.wrong >= 2 && st.status !== 'ok' && !st.revealed) h += `<div class="h">提示：${b.hint}</div>`;
        return `<li class="${cls}"><span class="n">${b.id.slice(1)}</span><div><div>${b.ask}<span class="muted small">（第 ${b.line} 行）</span></div>${h}${st.wrong ? `<div class="small muted">答錯 ${st.wrong} 次</div>` : ''}</div>${extra}</li>`;
      }).join('')}</ul>`;
  }
  function debugBody() {
    const st = C.st();
    if (st.done) return '<p>全部錯處已修正，L 燈每秒閃一次。</p>';
    return `<div class="stack" style="gap:8px">
      <p>左邊的程式本來會令 L 燈每秒閃一次，但有 <b>4 個錯處</b>：3 個是<b>文法錯誤</b>（編譯器會找到），1 個是<b>邏輯錯誤</b>（編譯器找不到，要上傳後看 L 燈）。</p>
      <ol class="tight small"><li>按 <b>✓ Verify</b>，看 Output 的紅色錯誤訊息。</li><li>訊息寫着<b>第幾行</b>，例如 <code>Fix_Me.ino:6:3</code> 是第 6 行。</li><li>直接在程式中修改，再按 Verify，直至沒有錯誤。</li><li>按 <b>→ Upload</b>，看看 L 燈是否真的每秒閃一次。</li></ol>
      <div class="row" id="bugPills"></div>
      <div class="row"><button class="btn sm ghost" id="dbgReset">重設程式</button>${(st.wrongRuns || 0) + (st.compileFails || 0) >= 6 && !st.revealed ? '<button class="btn sm ghost" id="dbgReveal">顯示答案</button>' : ''}</div>
    </div>`;
  }
  function stepBody(i) {
    if (i === 0) return C.debug ? debugBody() : blanksBody();
    if (C.debug) return `<p>按 <b>→ Upload</b>（或 <kbd>Ctrl</kbd>+<kbd>U</kbd>）。Board 和 Port 沿用主任務的設定。</p>`;
    if (!C.full) {
      if (i === 1) return `<p>按工具列左邊的 <b>✓ Verify</b>（或 <kbd>Ctrl</kbd>+<kbd>R</kbd>）。Board 和 Port 沿用主任務的設定。</p>`;
      return `<p>按 <b>→ Upload</b>（或 <kbd>Ctrl</kbd>+<kbd>U</kbd>），把程式傳到 Arduino。</p>`;
    }
    if (i === 1) return `<div class="minib"><div id="miniBoard">${miniSVG()}</div><div class="stack"><p>用 USB 線把 Arduino UNO 接到電腦。接上後板上綠色的 <b>ON</b> 燈會亮，電腦會多了一個 COM 連接埠。</p><button class="btn teal sm" id="btnUsb">插上 USB 線</button></div></div>`;
    if (i === 2) return `<p>告訴電腦你用的是哪一款板：</p><ol class="tight small"><li>按 IDE 最上方的 <b>Tools</b></li><li>把滑鼠移到 <b>Board</b></li><li>再移到 <b>Arduino AVR Boards</b></li><li>按 <b>Arduino Uno</b></li></ol><p class="small muted">小心：選單內有很多款名字相似的板，例如 Arduino Uno WiFi 和 Arduino Nano 都不對。</p>`;
    if (i === 3) return `<p>告訴電腦 UNO 接在哪一個 USB 插口：</p><ol class="tight small"><li>按 <b>Tools</b></li><li>把滑鼠移到 <b>Port</b></li><li>按有 <b>(Arduino Uno)</b> 字樣的 COM（你的是 <b>${S.up.com}</b>）</li></ol><p class="small muted">COM1 是電腦本身的，不是 Arduino。每部電腦的號碼可能不同，所以要看清楚。</p>`;
    if (i === 4) return `<p>按工具列<b>最左邊的 ✓</b>（Verify，或 <kbd>Ctrl</kbd>+<kbd>R</kbd>）。</p><p class="small muted">編譯器會檢查程式有沒有文法錯誤，再轉換成 Arduino 看得懂的機器碼。成功時 Output 會寫 Sketch uses … bytes。</p>`;
    if (i === 5) return `<p>按 ✓ 旁邊的 <b>→</b>（Upload，或 <kbd>Ctrl</kbd>+<kbd>U</kbd>），把程式傳到 Arduino。</p><p class="small muted">上傳時板上的 TX / RX 燈會快速閃動，完成後會顯示 Done uploading。</p>`;
    return '';
  }
  function statsHTML() {
    const fl = C.flow(), st = C.st();
    if (C.debug) return `<span class="pill">編譯錯誤 ${st.compileFails || 0} 次（不扣分）</span><span class="pill ${st.wrongRuns ? 'err' : ''}">上傳後燈號不對 ${st.wrongRuns || 0} 次</span>`;
    const nWrong = C.blanks.reduce((a, b) => a + (B(b.id).wrong || 0), 0), nRev = C.blanks.filter(b => B(b.id).revealed).length;
    return `<span class="pill ${nWrong ? 'err' : ''}">填錯 ${nWrong} 次</span><span class="pill ${nRev ? 'warn' : ''}">顯示答案 ${nRev} 格</span><span class="pill ${fl.errors ? 'err' : ''}">上傳流程錯誤 ${fl.errors || 0} 次</span>`;
  }
  function renderPanel() {
    const steps = flowSteps();
    const cur = steps.findIndex(s => !s.done);
    const done = C.debug ? !!(C.st().compileOk || C.st().done) : C.st().done;
    const panel = $('#codePanel');
    const ex = explainMap[C.name];
    panel.innerHTML = `<div><div class="eyebrow">${C.eyebrow}</div><h2>${C.title}</h2></div>
      <ol class="steps">${steps.map((s, i) => {
        const locked = i > 0 && !done;
        const cls = s.done ? 'done' : (i === cur && !locked ? 'cur' : (i === 0 ? 'cur' : 'locked'));
        const open = (i === cur && !locked) || (i === 0 && !s.done) || (C.full && i === 1 && !S.up.usb && done);
        return `<li class="${cls}"><div class="sh"><i>${s.done ? '✓' : i + 1}</i>${s.t}</div>${open ? `<div class="sb">${stepBody(i)}</div>` : ''}</li>`;
      }).join('')}</ol>
      <div id="codeExplain">${ex ? alertBox(ex.kind, ex.html) : ''}</div>
      ${C.flow().uploaded ? `<button class="btn go" id="codeNext">${C.next.label}</button>` : (C.name !== 'main' ? `<button class="btn sm ghost" id="codeBack">返回延伸挑戰</button>` : '')}
      <div class="statline">${statsHTML()}</div>
      <details class="fold know"><summary>指令小字典</summary><div class="dict">${C.dict.map(([c, t]) => `<div><code>${esc(c)}</code><span>${t}</span></div>`).join('')}</div></details>`;
    const bc = $('#btnCheck'); if (bc) bc.onclick = checkAnswers;
    const bu = $('#btnUsb'); if (bu) bu.onclick = plugUsb;
    const cn = $('#codeNext'); if (cn) cn.onclick = () => goStage(C.next.stage);
    const cb = $('#codeBack'); if (cb) cb.onclick = () => goStage('ext');
    $$('[data-rev]', panel).forEach(b => b.onclick = () => reveal(b.dataset.rev));
    $$('.chip[data-w]', panel).forEach(c => c.onclick = () => {
      let id = lastFocus;
      const st = id && C.blanks.some(b => b.id === id) && B(id);
      if (!st || st.status === 'ok' || st.revealed) { const nb = C.blanks.find(b => B(b.id).status !== 'ok' && !B(b.id).revealed); if (!nb) return; id = nb.id; }
      const el = $('#blank-' + id); el.value = c.dataset.w; el.dispatchEvent(new Event('input')); el.focus();
      focusNext(id);
    });
    const dr = $('#dbgReset'); if (dr) dr.onclick = resetC2;
    const dv = $('#dbgReveal'); if (dv) dv.onclick = revealC2;
    renderBugPills();
    if (C.name === 'main' && S.up.uploaded) { const m = $('#miniBoard'); if (m && !miniStop) startMiniBlink(); }
  }

  function build() {
    $$('#ideMenubar .mbtn').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const open = b.classList.contains('open'); closeMenus(); if (open) return;
      b.classList.add('open');
      const r = b.getBoundingClientRect(), wr = $('.ide-wrap').getBoundingClientRect();
      openMenu(menuDef(b.dataset.menu), r.left - wr.left, r.bottom - wr.top, 0);
    }));
    $$('#ideMenubar .mbtn').forEach(b => b.addEventListener('mouseenter', () => { if (openMenus.length && !b.classList.contains('open') && $('.mbtn.open')) b.click(); }));
    document.addEventListener('click', e => { if (!e.target.closest('.menu')) closeMenus(); });
    $('#boardSelBtn').addEventListener('click', e => { e.stopPropagation(); closeMenus(); boardSelMenu(); });
    $('#btnVerify').addEventListener('click', () => verify(false));
    $('#btnUpload').addEventListener('click', upload);
    $$('[data-deco]').forEach(b => b.addEventListener('click', deco));
    document.addEventListener('keydown', e => {
      if (!S || !['code', 'c1code', 'c2code'].includes(S.stage) || !(e.ctrlKey || e.metaKey) || $('.modal-back')) return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); verify(false); }
      if (e.key === 'u' || e.key === 'U') { e.preventDefault(); upload(); }
    });
    built = true;
  }
  function enter(name = 'main') {
    if (!built) build();
    const switched = !C || C.name !== name;
    C = CTX[name];
    $('#ideMenubar .title').textContent = `${C.file} | Arduino IDE`;
    $('.ide-tab').textContent = `${C.file}.ino`;
    C.blanks.forEach(b => B(b.id));
    renderEditor(); renderStatus(); renderPanel();
    if (switched || !$('#ideOut').textContent) out([{ c: 'g', t: '（Output 視窗：編譯和上傳的訊息會顯示在這裏）' }]);
  }
  function fillAnswers(name = C ? C.name : 'main') {
    const prev = C; C = CTX[name];
    if (C.debug) { C.st().text = FIXED_CODE; C.st().compileOk = false; }
    else C.blanks.forEach(b => { B(b.id).val = b.ans; });
    S.teacherUsed = true; save();
    if (built && prev && prev.name === name) { renderEditor(); renderPanel(); } else C = prev;
  }
  function leave() { if (miniStop) { miniStop(); miniStop = null; } closeMenus(); }
  return { enter, leave, fillAnswers, compile: compileBlanks, checkAnswers, current: () => C && C.name };
})();
stageInit.code = () => IDE.enter('main');
stageInit.c1code = () => IDE.enter('c1');
stageInit.c2code = () => IDE.enter('c2');
