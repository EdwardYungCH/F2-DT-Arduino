/* =====================================================================
   Arduino IDE 模擬器：程式填空 / 自由編程、選板、選 Port、編譯、上傳
   三個情境：main（主任務）、c1（延伸 1 聲光 SOS）、c2（延伸 2 英文縮寫）
   ===================================================================== */
HELP.setLesson(2);
const CODE_TEMPLATE = [
  '// SOS 求救燈',
  '// 摩斯密碼：S = ···（三下短閃）  O = –––（三下長閃）',
  '',
  'int ledPin = {{b1}};          // LED 接在 Arduino 的第幾號腳？',
  '',
  'void setup() {',
  '  pinMode(ledPin, {{b2}});   // 把 ledPin 設定為「輸出」',
  '}',
  '',
  'void loop() {',
  '  // ===== S：三下短閃 =====',
  '  digitalWrite(ledPin, {{b3}});  // 開燈',
  '  delay({{b4}});                 // 短閃：亮 0.2 秒',
  '  digitalWrite(ledPin, {{b5}});  // 關燈',
  '  delay(200);                  // 熄 0.2 秒',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(600);                  // 字母之間熄 0.6 秒',
  '',
  '  // ===== O：三下長閃 =====',
  '  digitalWrite(ledPin, HIGH);',
  '  delay({{b6}});                 // 長閃：亮 0.6 秒',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '  {{b7}}(ledPin, HIGH);        // 開燈（用哪個指令？）',
  '  delay(600);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(600);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(600);                  // 字母之間熄 0.6 秒',
  '',
  '  // ===== S：三下短閃 =====',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '',
  '  delay({{b8}});                // 一次 SOS 完成，熄 2 秒再重複',
  '}',
];
const BLANKS = [
  { id: 'b1', ans: '13', ctx: 'init', ask: 'LED 接在哪一號腳', hint: '回想接線模擬器：LED 的信號線接在 UNO 的幾號腳？只需要填數字。' },
  { id: 'b2', ans: 'OUTPUT', ctx: 'mode', ask: '腳位的模式', hint: 'LED 是由 Arduino「送出」信號去控制的，所以要設定成「輸出」。英文要<em>全部大寫</em>。' },
  { id: 'b3', ans: 'HIGH', ctx: 'level', ask: '開燈時輸出的狀態', hint: '開燈 = 腳位輸出 5V 高電位，英文是「高」，要<em>全部大寫</em>。' },
  { id: 'b4', ans: '200', ctx: 'delay', ask: '短閃亮多久', hint: 'delay() 用<em>毫秒</em>計時：1 秒 = 1000 毫秒，0.2 秒 = ? 毫秒。' },
  { id: 'b5', ans: 'LOW', ctx: 'level', ask: '關燈時輸出的狀態', hint: '關燈 = 腳位輸出 0V 低電位，英文是「低」，要<em>全部大寫</em>。' },
  { id: 'b6', ans: '600', ctx: 'delay', ask: '長閃亮多久', hint: '長閃亮 0.6 秒。1 秒 = 1000 毫秒，0.6 秒 = ? 毫秒。' },
  { id: 'b7', ans: 'digitalWrite', ctx: 'func', argc: 2, ask: '控制腳位開關的指令', hint: '和上面「開燈」「關燈」那幾行用的是<em>同一個指令</em>。注意大小寫：digital 小寫，W 大寫。' },
  { id: 'b8', ans: '2000', ctx: 'delay', ask: '一次 SOS 後停多久', hint: '要停 2 秒。1 秒 = 1000 毫秒，2 秒 = ? 毫秒。' },
];
const BANK = ['13', '12', 'OUTPUT', 'INPUT', 'HIGH', 'LOW', '2', '200', '600', '2000', 'digitalWrite', 'digitalRead', 'pinMode'];

/* ---------- 延伸挑戰 1：聲光 SOS（蜂鳴器用 tone / noTone） ---------- */
const C1_TEMPLATE = (() => {
  const L = [
    '// 延伸挑戰 1：聲光 SOS',
    '// LED 閃的同時，蜂鳴器發出「嗶」聲',
    '',
    'int ledPin = 13;              // LED 接在 13 號腳',
    'int buzzerPin = {{e1}};           // 蜂鳴器接在第幾號腳？',
    'int pitch = {{e2}};             // 聲音頻率（Hz），建議 1000',
    '',
    'void setup() {',
    '  pinMode(ledPin, OUTPUT);',
    '  pinMode(buzzerPin, {{e3}});   // 蜂鳴器也要設定為「輸出」',
    '}',
    '',
    'void loop() {',
    '  // ===== S：三下短閃 + 短嗶 =====',
    '  digitalWrite(ledPin, HIGH);',
    '  {{e4}}(buzzerPin, pitch);     // 開聲（用哪個指令？）',
    '  delay(200);',
    '  digitalWrite(ledPin, LOW);',
    '  {{e5}}(buzzerPin);            // 停聲（用哪個指令？）',
    '  delay(200);',
    '  digitalWrite(ledPin, HIGH);',
    '  tone(buzzerPin, pitch);',
    '  delay(200);',
    '  digitalWrite(ledPin, LOW);',
    '  noTone({{e6}});               // 停止哪一支腳的聲音？',
    '  delay(200);',
  ];
  const sig = (ms, after, note) => [
    '  digitalWrite(ledPin, HIGH);', '  tone(buzzerPin, pitch);', `  delay(${ms});`,
    '  digitalWrite(ledPin, LOW);', '  noTone(buzzerPin);', `  delay(${after});${note ? '                  // ' + note : ''}`];
  L.push(...sig(200, 600, '字母之間停 0.6 秒'));
  L.push('', '  // ===== O：三下長閃 + 長嗶 =====');
  L.push(...sig(600, 200), ...sig(600, 200), ...sig(600, 600, '字母之間停 0.6 秒'));
  L.push('', '  // ===== S：三下短閃 + 短嗶 =====');
  L.push(...sig(200, 200), ...sig(200, 200), ...sig(200, 2000, '一次 SOS 完成，停 2 秒'));
  L.push('}');
  return L;
})();
const pitchOK = v => /^\d+$/.test(v) && +v >= 100 && +v <= 5000;
const C1_BLANKS = [
  { id: 'e1', ans: '8', ctx: 'init', ask: '蜂鳴器接在哪一號腳', hint: '回想剛才的接線：蜂鳴器的信號線接在 UNO 的幾號腳？只填數字。' },
  { id: 'e2', ans: '1000', ctx: 'init', accept: pitchOK, ask: '聲音頻率（Hz）', hint: '頻率 = 每秒震動多少次。填 <em>100 至 5000</em> 之間的整數，建議 1000。' },
  { id: 'e3', ans: 'OUTPUT', ctx: 'mode', ask: '蜂鳴器腳位的模式', hint: 'Arduino 要「送出」信號給蜂鳴器，所以是「輸出」。英文要<em>全部大寫</em>。' },
  { id: 'e4', ans: 'tone', ctx: 'func', argc: 2, ask: '令蜂鳴器發聲的指令', hint: '發聲的指令是 <em>tone</em>（全部小寫），括號內寫腳位和頻率。' },
  { id: 'e5', ans: 'noTone', ctx: 'func', argc: 1, ask: '令蜂鳴器停聲的指令', hint: '停聲 = no + Tone，寫成 <em>noTone</em>，注意 T 是大寫。' },
  { id: 'e6', ans: 'buzzerPin', ctx: 'arg', accept: v => v === 'buzzerPin' || v === '8', ask: '停止哪一支腳的聲音', hint: '要停的是蜂鳴器那支腳。程式第 5 行已經用一個變數記住了它的腳位。' },
];
const C1_BANK = ['8', '13', '1000', 'OUTPUT', 'INPUT', 'tone', 'noTone', 'digitalWrite', 'buzzerPin', 'ledPin'];

/* ---------- 延伸挑戰 2：閃出英文名縮寫（dot / dash / letterGap） ---------- */
const C2_TEMPLATE = [
  '// 延伸挑戰 2：用摩斯密碼閃出你的英文名縮寫',
  '',
  'int ledPin = 13;',
  '',
  'void dot() {                  // 短閃：亮 0.2 秒，熄 0.2 秒',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(200);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '}',
  '',
  'void dash() {                 // 長閃：亮 0.6 秒，熄 0.2 秒',
  '  digitalWrite(ledPin, HIGH);',
  '  delay(600);',
  '  digitalWrite(ledPin, LOW);',
  '  delay(200);',
  '}',
  '',
  'void letterGap() {            // 字母之間多停 0.4 秒',
  '  delay(400);',
  '}',
  '',
  'void setup() {',
  '  pinMode(ledPin, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  // ===== 在下面寫出你的縮寫（每行一個指令） =====',
  '{{REGION}}',
  '  delay(2000);                 // 完成一次，停 2 秒再重複',
  '}',
];
const MORSE = { A: '·–', B: '–···', C: '–·–·', D: '–··', E: '·', F: '··–·', G: '––·', H: '····', I: '··', J: '·–––', K: '–·–', L: '·–··', M: '––', N: '–·', O: '–––', P: '·––·', Q: '––·–', R: '·–·', S: '···', T: '–', U: '··–', V: '···–', W: '·––', X: '–··–', Y: '–·––', Z: '––··' };
const morseCalls = ch => MORSE[ch].split('').map(s => s === '·' ? 'dot' : 'dash');

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
      name: 'main', file: 'SOS_Light', eyebrow: '第 3 步', title: '編程及上傳', full: true,
      tpl: CODE_TEMPLATE, blanks: BLANKS, bank: BANK,
      st: () => S.code, flow: () => S.up,
      intro: `程式已寫好大部分，你要完成 <b>8 個橙色空格</b>。先讀灰色的註解，它會告訴你那一行做甚麼。可以直接打字，或者點選下面的字詞。`,
      revealNote: '顯示答案後，這一格只會得 1 分（滿分 5 分）。建議先再試一次。',
      next: { label: '下一步：實物挑戰', stage: 'real' },
      dict: ['int', 'setup', 'loop', 'pinMode', 'digitalWrite', 'delay'],
    },
    c1: {
      name: 'c1', file: 'SOS_Sound', eyebrow: '延伸挑戰 1 · 聲光 SOS', title: '編程及上傳', full: false,
      tpl: C1_TEMPLATE, blanks: C1_BLANKS, bank: C1_BANK,
      st: () => S.ext.c1.code, flow: () => S.ext.c1.flow,
      intro: `LED 部分已寫好。你要完成 <b>6 個橙色空格</b>，令蜂鳴器在 LED 亮時發聲、熄時停聲。`,
      revealNote: '顯示答案會令這個挑戰扣 2 分。建議先再試一次。',
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: ['tone', 'noTone', 'int', 'digitalWrite'],
    },
    c2: {
      name: 'c2', file: 'Morse_Initials', eyebrow: '延伸挑戰 2 · 英文縮寫', title: '自己編寫程式', full: false, free: true,
      tpl: C2_TEMPLATE, blanks: [], bank: [],
      st: () => S.ext.c2.code, flow: () => S.ext.c2.flow,
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: ['func', 'dot', 'dash', 'letterGap'],
    },
  };
  const B = id => { const st = C.st(); if (!st.blanks[id]) st.blanks[id] = { val: '', wrong: 0, lastWrong: null, status: '', revealed: false, fb: '' }; return st.blanks[id]; };
  const isRight = (b, v) => b.accept ? b.accept(v) : v === b.ans;
  const INO = () => `C:\\Users\\student\\Documents\\Arduino\\${C.file}\\${C.file}.ino`;
  const logTo = (obj, msg) => pushLog(obj, msg);

  /* ---------- editor ---------- */
  const hl = text => HELP.hl(text);
  function renderEditor() {
    const ed = $('#editor');
    if (C.free) return renderFreeEditor();
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
      inp.addEventListener('focus', () => { lastFocus = inp.dataset.b; markLine(inp); openCard(inp.dataset.b); });
      inp.addEventListener('click', () => { if (!$('.bcard-row')) openCard(inp.dataset.b); });
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
    const ln = +cl.dataset.ln; const col = C.tpl[ln - 1].indexOf('{{') + 1;
    $('#stPos').textContent = `Ln ${ln}, Col ${col}`;
  }
  function focusNext(id) {
    const bl = C.blanks, i = bl.findIndex(b => b.id === id);
    for (let k = 1; k <= bl.length; k++) {
      const b = bl[(i + k) % bl.length]; const st = B(b.id);
      if (st.status !== 'ok' && !st.revealed) { const el = $('#blank-' + b.id); el.focus(); el.select(); el.scrollIntoView({ block: 'nearest' }); return; }
    }
  }

  /* free-form editor for challenge 2 */
  const REGION_AT = () => C2_TEMPLATE.indexOf('{{REGION}}');
  const regionLines = () => Math.max(1, (C.st().text || '').split('\n').length);
  function renderFreeEditor() {
    const ed = $('#editor'), st = C.st(), r = REGION_AT();
    const locked = st.done;
    ed.innerHTML = C2_TEMPLATE.map((line, idx) => {
      if (idx === r) return `<div class="cl region" data-ln="${idx + 1}"><span class="ln" id="regLn"></span><span class="tx"><textarea id="regionTa" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="在這裏寫出你的縮寫" placeholder="例如：dash();" ${locked ? 'readonly' : ''}>${esc(st.text || '')}</textarea></span></div>`;
      return `<div class="cl${idx > r ? ' after' : ''}" data-ln="${idx + 1}" data-i="${idx}"><span class="ln">${idx + 1}</span><span class="tx">${hl(line) || ' '}</span></div>`;
    }).join('');
    const ta = $('#regionTa');
    ta.addEventListener('input', () => { st.text = ta.value; save(); syncRegion(); });
    ta.addEventListener('keyup', syncCaret); ta.addEventListener('click', syncCaret);
    ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); insertAtCaret('  '); } });
    syncRegion();
    const row = ed.querySelector('.cl.region'); if (row) ed.scrollTop = Math.max(0, row.offsetTop - 120);
  }
  function syncRegion() {
    const ta = $('#regionTa'); if (!ta) return;
    const n = regionLines(), r = REGION_AT();
    ta.rows = n; ta.style.height = (n * 22) + 'px';
    $('#regLn').innerHTML = Array.from({ length: n }, (_, i) => r + 1 + i).join('<br>');
    $$('#editor .cl.after').forEach(el => { const i = +el.dataset.i; el.querySelector('.ln').textContent = i + n; el.dataset.ln = i + n; });
  }
  function syncCaret() {
    const ta = $('#regionTa'); if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart).split('\n');
    $('#stPos').textContent = `Ln ${REGION_AT() + before.length}, Col ${before[before.length - 1].length + 3}`;
  }
  function insertAtCaret(text) {
    const ta = $('#regionTa'); if (!ta || ta.readOnly) return;
    const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s;
    let ins = text;
    if (text.endsWith(';')) { const pre = ta.value.slice(0, s); ins = (pre && !pre.endsWith('\n') ? '\n' : '') + text + '\n'; }
    ta.value = ta.value.slice(0, s) + ins + ta.value.slice(e);
    const pos = s + ins.length; ta.focus(); ta.setSelectionRange(pos, pos);
    C.st().text = ta.value; save(); syncRegion(); syncCaret();
  }
  /* line number (in the full sketch) of region line i (0-based) */
  const regLineNo = i => REGION_AT() + 1 + i;

  /* ---------- checking answers (fill-in contexts) ---------- */
  function feedback(b, v) {
    const lc = v.toLowerCase();
    if (lc === b.ans.toLowerCase()) return '大小寫不對。Arduino 會分辨大小寫，請看清楚。';
    if (/[^\x00-\x7F]/.test(v)) return '不可以用中文或全形字，只可以用英文和數字。';
    if (b.id === 'e2') {
      if (/hz/i.test(v)) return '只填數字，不用寫 Hz。';
      if (/^\d+$/.test(v)) return '頻率太低或太高，人耳聽得不清楚。請填 100 至 5000 之間的數字。';
    }
    if (b.ctx === 'delay' || b.ctx === 'init') {
      const f = parseFloat(v);
      if (!isNaN(f) && b.ctx === 'delay' && Math.round(f * 1000) === +b.ans) return 'delay() 的單位是<b>毫秒</b>，不是秒。';
      if ((b.id === 'b1' || b.id === 'e1') && /^\d+$/.test(v)) return v === '13' && b.id === 'e1' ? '13 號腳是 LED 用的。蜂鳴器接在另一支腳。' : '看清楚接線模擬器中，導線接在哪一號腳。';
      if (b.ctx === 'delay' && /^\d+$/.test(v)) return '時間不對，再看看那一行的註解（灰色文字）。';
    }
    if ((b.id === 'b2' || b.id === 'e3') && lc === 'input') return 'INPUT 是「輸入」（例如讀取按鈕）；這裏要用「輸出」。';
    if (b.id === 'b3' && lc === 'low') return 'LOW 是關燈，開燈要用高電位。';
    if (b.id === 'b5' && lc === 'high') return 'HIGH 是開燈，關燈要用低電位。';
    if (b.id === 'b7' && lc === 'digitalread') return 'digitalRead 是「讀取」輸入；控制 LED 要「寫」出信號。';
    if (b.id === 'b7' && lc === 'pinmode') return 'pinMode 只用來設定模式，開燈要用另一個指令。';
    if (b.id === 'e4' && lc === 'digitalwrite') return 'digitalWrite 只會開一次，蜂鳴器不會響。要用令腳位不停開關的指令。';
    if (b.id === 'e4' && lc === 'notone') return 'noTone 是停聲，開聲要用另一個指令。';
    if (b.id === 'e5' && lc === 'tone') return 'tone 是開聲，停聲要用另一個指令。';
    if (b.id === 'e5' && lc === 'digitalwrite') return '停聲要用專門停止 tone() 的指令。';
    if (b.id === 'e6' && v === 'ledPin') return 'ledPin 是 LED 那支腳。要停的是蜂鳴器那支腳。';
    if (b.id === 'e6' && v === '13') return '13 號腳是 LED 那支腳。要停的是蜂鳴器那支腳。';
    return '';
  }
  /* ---------- 說明卡及提示（共用 HELP） ---------- */
  function openCard(id) {
    const b = C.blanks.find(x => x.id === id), inp = $('#blank-' + id);
    if (!b || !inp) return;
    const st = B(id); if (st.status === 'ok' || st.revealed) { HELP.hideCard(); return; }
    const row = HELP.showCard(inp, b, st, C, { cost: C.name === 'main' ? '扣 1 分' : '挑戰扣 1 分' });
    if (!row) return;
    $$('[data-hint]', row).forEach(x => x.onclick = e => { e.stopPropagation(); useHint(x.dataset.hint); });
    $$('[data-rev]', row).forEach(x => x.onclick = e => { e.stopPropagation(); reveal(x.dataset.rev); });
  }
  function useHint(id) {
    const b = C.blanks.find(x => x.id === id), st = B(id);
    if (!b || st.hinted || st.status === 'ok' || st.revealed) return;
    modal({
      title: `使用空格 ${id.slice(1)} 的提示？`,
      html: `<p>${C.name === 'main' ? '使用提示後，這一格會<b>扣 1 分</b>（滿分 5 分）。' : '使用提示會令這個挑戰<b>扣 1 分</b>。'}</p><p class="small muted">先看看說明卡寫的「要填甚麼」，或者打開指令小字典找找看。</p>`,
      actions: [{ label: '再想想', kind: 'ghost' }, { label: '使用提示', kind: 'primary', onClick: () => {
        st.hinted = true; logTo(C.st(), `使用提示：空格 ${id.slice(1)}（${b.ask}）`); save(); renderPanel();
        const el = $('#blank-' + id); if (el) { el.focus(); openCard(id); }
      } }],
    });
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
        ? { title: '程式填空全部正確！', html: `<p>接下來像真的一樣把程式上傳到 Arduino：</p><ol style="margin:10px 0 0;padding-left:1.3em;display:flex;flex-direction:column;gap:4px"><li>插上 USB 線</li><li>在 <span class="path">Tools → Board</span> 選開發板</li><li>在 <span class="path">Tools → Port</span> 選連接埠</li><li>按 ✓ 驗證，再按 → 上傳</li></ol>`, actions: [{ label: '開始', kind: 'go' }] }
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

  /* ---------- challenge 2: parse & check ---------- */
  const C2_FUNCS = ['dot', 'dash', 'letterGap'];
  const ARD_FUNCS = ['digitalWrite', 'digitalRead', 'pinMode', 'delay', 'tone', 'noTone', 'analogWrite'];
  function parseRegion(text) {
    const calls = [], errs = [], warns = [];
    const lines = (text || '').split('\n');
    lines.forEach((raw, i) => {
      const ln = regLineNo(i);
      let code = raw; const ci = code.indexOf('//'); if (ci >= 0) code = code.slice(0, ci);
      if (!code.trim()) return;
      const base = { line: ln, lineTxt: '  ' + raw };
      if (/[^\x00-\x7F]/.test(code)) { const byte = new TextEncoder().encode(code.match(/[^\x00-\x7F]/)[0])[0]; errs.push({ ...base, col: code.search(/[^\x00-\x7F]/) + 3, len: 1, msg: `stray '\\${byte.toString(8)}' in program`, kind: 'stray' }); return; }
      const segs = code.split(';');
      const tail = segs.pop();
      segs.forEach(sg => {
        const s = sg.trim(); if (!s) return;
        const col = code.indexOf(s) + 3;
        let m;
        if ((m = /^([A-Za-z_]\w*)\s*\(\s*([^()]*)\s*\)$/.exec(s))) {
          const name = m[1], args = m[2].trim();
          if (C2_FUNCS.includes(name)) {
            if (args) errs.push({ ...base, col, len: s.length, msg: `too many arguments to function 'void ${name}()'`, kind: 'args', name });
            else calls.push({ name, line: ln });
          } else if (ARD_FUNCS.includes(name)) calls.push({ name, line: ln, other: true });
          else { const sug = [...C2_FUNCS, ...ARD_FUNCS].find(k => k.toLowerCase() === name.toLowerCase()); errs.push({ ...base, col, len: name.length, msg: `'${name}' was not declared in this scope`, kind: 'undecl', sug }); }
        } else if ((m = /^([A-Za-z_]\w*)$/.exec(s))) {
          const name = m[1];
          if (C2_FUNCS.includes(name)) { warns.push({ ...base, col, len: name.length, msg: `statement is a reference, not call, to function '${name}' [-Waddress]` }); calls.push({ name, line: ln, nocall: true }); }
          else { const sug = C2_FUNCS.find(k => k.toLowerCase() === name.toLowerCase()); errs.push({ ...base, col, len: name.length, msg: `'${name}' was not declared in this scope`, kind: 'undecl', sug }); }
        } else errs.push({ ...base, col, len: s.length, msg: `expected primary-expression before '${s.replace(/[^()]/g, '').slice(-1) || s[0]}' token`, kind: 'bad' });
      });
      if (tail.trim()) {
        const s = tail.trim(), col = code.lastIndexOf(s) + 3 + s.length;
        const nextTok = (() => { for (let k = i + 1; k < lines.length; k++) { const t = lines[k].replace(/\/\/.*/, '').trim(); if (t) return (t.match(/^[A-Za-z_]\w*|./) || ['}'])[0]; } return 'delay'; })();
        errs.push({ ...base, col, len: 1, msg: `expected ';' before '${nextTok}'`, kind: 'semi', stmt: s });
        const m = /^([A-Za-z_]\w*)\s*\(\s*\)$/.exec(s); if (m && C2_FUNCS.includes(m[1])) calls.push({ name: m[1], line: ln });
      }
    });
    return { calls, errs, warns };
  }
  function checkC2() {
    const st = C.st();
    if (!st.initials) { toast('請先輸入你的英文名縮寫。'); $('#c2Init') && $('#c2Init').focus(); return; }
    const sig = (st.text || '').replace(/\s+/g, '');
    const fail = (html, log) => {
      st.checks = (st.checks || 0) + 1;
      let counted = false;
      if (sig !== st.lastFailSig) { st.fails = (st.fails || 0) + 1; st.lastFailSig = sig; counted = true; logTo(st, log); }
      explainMap.c2 = { kind: 'err', html: html + (counted ? '' : '<br><span class="small">程式未有改動，這次不再重複扣分。</span>') };
      save(); renderPanel();
    };
    const { calls, errs } = parseRegion(st.text);
    if (errs.length) { const e = errs[0]; return fail(`<b>第 ${e.line} 行寫法有問題。</b>${explainFreeErr(e)}`, `第 ${e.line} 行寫法錯誤`); }
    const nc = calls.find(c => c.nocall);
    if (nc) return fail(`<b>第 ${nc.line} 行少了括號。</b>要寫成 <code>${nc.name}();</code>，有 <code>()</code> 才會執行那個函數。`, `第 ${nc.line} 行少了 ()`);
    const oth = calls.find(c => c.other);
    if (oth) return fail(`第 ${oth.line} 行用了 <code>${oth.name}()</code>。這個挑戰只需要用 <code>dot();</code>、<code>dash();</code> 和 <code>letterGap();</code>。`, `第 ${oth.line} 行用了 ${oth.name}`);
    if (!calls.length) return fail('你還未寫任何指令。按下面的按鈕，或自己輸入 <code>dot();</code>、<code>dash();</code>。', '未寫任何指令');
    const letters = st.initials.split('');
    const groups = [[]];
    calls.forEach(c => { if (c.name === 'letterGap') groups.push([]); else groups[groups.length - 1].push(c.name); });
    if (!groups[0].length && groups.length > 1) return fail('第一個指令不需要 <code>letterGap();</code>。letterGap 是放在<b>兩個字母之間</b>的。', '開頭多了 letterGap');
    if (groups.length > 1 && !groups[groups.length - 1].length) groups.pop();
    if (groups.some(g => !g.length)) return fail('有兩個 <code>letterGap();</code> 連在一起，中間沒有字母。請刪除多出的一個。', '連續兩個 letterGap');
    const want = letters.map(morseCalls);
    const flat = a => a.flat().join(',');
    const sym = n => n === 'dot' ? '·' : '–';
    if (groups.length !== want.length && flat(groups) === flat(want)) return fail(`點和劃的次序全部正確，但<b>字母之間要加 <code>letterGap();</code></b>，否則別人分不出哪裏是下一個字母。你的縮寫有 ${letters.length} 個字母，所以需要 ${letters.length - 1} 個 letterGap。`, '漏了 letterGap');
    for (let i = 0; i < want.length; i++) {
      const g = groups[i];
      if (!g) return fail(`你寫完了 ${groups.length} 個字母，但縮寫 <b>${st.initials}</b> 有 ${letters.length} 個字母。下一個是 <b>${letters[i]}</b>（${MORSE[letters[i]]}），記得先加 <code>letterGap();</code>。`, `未寫完：缺少 ${letters.slice(i).join('')}`);
      if (g.join(',') !== want[i].join(',')) {
        const got = g.map(sym).join('');
        return fail(`第 ${i + 1} 個字母 <b>${letters[i]}</b> 是 <b>${MORSE[letters[i]]}</b>，但你寫出來的是 <b>${got}</b>。${g.length !== want[i].length ? `${letters[i]} 要 ${want[i].length} 下閃光，你寫了 ${g.length} 下。` : '次序不對，· 是 dot()，– 是 dash()。'}`, `字母 ${letters[i]} 錯（寫了 ${got}）`);
      }
    }
    if (groups.length > want.length) return fail(`${st.initials} 只有 ${letters.length} 個字母，但你寫了 ${groups.length} 組。請刪除多出的指令。`, '多寫了字母');
    st.checks = (st.checks || 0) + 1;
    st.done = true; S.ext.c2.t.codeEnd = now(); save();
    explainMap.c2 = { kind: 'ok', html: `正確！你的程式會閃出 <b>${st.initials}</b>。下一步：按 ✓ Verify，再按 → Upload。` };
    renderEditor(); renderPanel();
    modal({ title: '程式正確！', html: `<p>你的程式會用摩斯密碼閃出 <b>${esc(st.initials)}</b>。USB 線、Board 和 Port 已經設定好，按 <b>✓ Verify</b> 驗證，再按 <b>→ Upload</b> 上傳。</p>`, actions: [{ label: '好', kind: 'go' }] });
  }
  function explainFreeErr(e) {
    if (e.kind === 'stray') return '出現了中文或全形字。程式只可以用英文、數字和半形符號，例如分號要用半形的 <code>;</code>。';
    if (e.kind === 'semi') return `句尾少了分號 <code>;</code>。每個指令最後都要有分號，例如 <code>${esc(e.stmt)};</code>。`;
    if (e.kind === 'undecl') return `編譯器不認識「${esc(e.msg.match(/'([^']+)'/)[1])}」。${e.sug ? `你是否想寫 <b>${e.sug}</b>？Arduino 會分辨大小寫。` : '只可以用 dot、dash 和 letterGap。'}`;
    if (e.kind === 'args') return `<code>${e.name}()</code> 的括號內不用填任何東西。`;
    return '這一行的寫法不對。每行寫一個指令，例如 <code>dot();</code>。';
  }
  function revealC2() {
    modal({
      title: '顯示完整答案？',
      html: '<p>顯示答案後，這個挑戰的程式分只得 3 分（滿分 8 分）。建議先看提示再試一次。</p>',
      actions: [{ label: '再試一次', kind: 'ghost' }, { label: '顯示答案', kind: 'primary', onClick: () => {
        const st = C.st();
        st.text = st.initials.split('').map((ch, i) => `// ${ch}  ${MORSE[ch]}\n` + morseCalls(ch).map(n => n + '();').join('\n') + (i < st.initials.length - 1 ? '\nletterGap();' : '')).join('\n');
        st.revealed = true; logTo(st, '顯示完整答案'); save(); renderEditor(); checkC2();
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
      const col = C.tpl[line - 1].indexOf('{{') + 1;
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
  function compileFree() {
    const { errs, warns } = parseRegion(C.st().text);
    return { errs: errs.map(e => ({ ...e, fn: 'void loop()' })), warns: warns.map(w => ({ ...w, fn: 'void loop()' })) };
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
    if (C.free) return `<b>編譯失敗（Compilation error）</b><br>第 ${e.line} 行：${explainFreeErr(e)}${errs.length > 1 ? `<br><span class="small">另外還有 ${errs.length - 1} 個錯誤，都在 Output 視窗中。</span>` : ''}`;
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

  const SIZE = { main: [1102, 9], c1: [2386, 19], c2: [1210, 9] };
  const sizeLines = () => { const [f, r] = SIZE[C.name]; return [
    { c: '', t: `Sketch uses ${f} bytes (${Math.round(f / 322.56)}%) of program storage space. Maximum is 32256 bytes.` },
    { c: '', t: `Global variables use ${r} bytes (${Math.round(r / 20.48)}%) of dynamic memory, leaving ${2048 - r} bytes for local variables. Maximum is 2048 bytes.` },
  ]; };
  function flowError(kind, action) {
    if (!C.st().done) return false;
    const fl = C.flow();
    const sig = `${kind}|${action}|${S.up.board}|${S.up.port}|${S.up.usb}`;
    if (sig === fl.lastErrSig) return false;
    fl.lastErrSig = sig; fl.errors = (fl.errors || 0) + 1;
    const msgs = { no_board: '未選擇開發板', no_port: '未選擇連接埠（Port）', wrong_port: `選錯連接埠（${S.up.port}）`, wrong_board: `選錯開發板（${S.up.board}）` };
    logTo(fl, `${action === 'upload' ? '上傳' : '驗證'}失敗：${msgs[kind]}`);
    save(); return true;
  }
  const recorded = c => c ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : '';

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
    if (C.free) ({ errs, warns } = compileFree()); else errs = compileBlanks();
    $$('.cl.errline').forEach(x => x.classList.remove('errline'));
    if (errs.length) {
      hideNote();
      out(diagLines(warns, 'warning').concat(errText(errs)));
      errs.forEach(e => { const cl = $(`.cl[data-ln="${e.line}"]`); cl && cl.classList.add('errline'); });
      explainMap[C.name] = { kind: 'err', html: explainCompile(errs) };
      setBusy(false); renderPanel(); return false;
    }
    out(diagLines(warns, 'warning').concat(sizeLines()));
    const done = C.st().done;
    if (!isUpload) {
      await note('Done compiling.', 1600, false); hideNote();
      if (done && S.up.board === 'Arduino Uno') { C.flow().verified = true; save(); }
      explainMap[C.name] = done
        ? (S.up.board === 'Arduino Uno' ? { kind: 'ok', html: '<b>編譯成功（Done compiling）。</b>程式沒有文法錯誤。下一步：按 → Upload 上傳。' } : { kind: 'warn', html: `編譯成功，但你選的開發板是 <b>${esc(S.up.board)}</b>。你手上的是 Arduino Uno，上傳前請更改。` })
        : { kind: 'warn', html: `<b>編譯成功，但這不代表程式正確！</b>編譯器只檢查文法，${C.free ? '不知道你閃出的是否你的縮寫。請按「檢查程式」。' : '不知道數字是否正確。請按「檢查答案」確認每一格。'}${warns.length ? '<br>另外 Output 有黃色的 <b>warning</b>，要留意。' : ''}` };
      setBusy(false); renderPanel(); return true;
    }
    return true;
  }

  async function upload() {
    if (busy) return;
    if (!C.st().done) {
      const msg = C.free ? '上傳之前，請先按「檢查程式」確認你的縮寫正確。' : `上傳之前，要先完成 ${C.blanks.length} 個空格，並按「檢查答案」確認全部正確。`;
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
    const fl = C.flow(); fl.uploaded = true; fl.verified = true;
    if (C.name === 'main') { S.t.upEnd = now(); if (!S.t.real) S.t.real = now(); unlock('real'); }
    else { const x = S.ext[C.name]; x.done = true; x.t.end = now(); }
    save();
    explainMap[C.name] = { kind: 'ok', html: C.name === 'main' ? '<b>上傳完成（Done uploading）！</b>你的 SOS 求救燈正在運作。' : '<b>上傳完成（Done uploading）！</b>延伸挑戰完成。' };
    setBusy(false); renderPanel();
    if (C.name === 'main') { startMiniSOS(); showResult(); }
    else EXT.showResult(C.name, true);
  }

  function showResult() {
    let stop = null;
    modal({
      title: '上傳成功！你的 SOS 燈正在閃',
      wide: true,
      html: `<div class="sos-stage" id="resStage">${HW.circuitSVG()}</div>
        <div class="row" style="margin-top:12px;justify-content:space-between">
          <div class="morse" id="resMorse" style="background:#0F1B20;border-radius:8px;padding:6px"></div>
          <p class="small muted" style="max-width:32em">留意 UNO 板上的 <b>L</b> 燈也在同步閃：它在板上已接到 13 號腳。在真的板上，如果 L 燈閃但你的 LED 不亮，問題就在外接電路。</p>
        </div>`,
      actions: [{ label: '留在這頁', kind: 'ghost', onClick: () => { stop && stop(); } }, { label: '下一步：實物挑戰', kind: 'go', onClick: () => { stop && stop(); goStage('real'); } }],
      dismissable: false,
      onOpen: back => {
        const glow = $('.ledglow', back), body = $('.ledbody', back), L = $('.uLedL', back), ON = $('.uLedON', back);
        ON && ON.setAttribute('fill', '#3CFF7A');
        const morse = $('#resMorse', back); morse.innerHTML = morseHTML(); const syms = $$('.sym', morse);
        stop = playSOS((on, sym) => {
          glow && glow.setAttribute('opacity', on ? 1 : 0);
          body && body.setAttribute('fill', on ? '#FF6B55' : '#D8321F');
          L && L.setAttribute('fill', on ? '#FFB020' : '#6B5A2E');
          syms.forEach((s, k) => s.classList.toggle('lit', !!on && k === sym));
        });
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
  function startMiniSOS() { if (miniStop) miniStop(); miniStop = playSOS(on => { const l = $('.mL'); l && l.setAttribute('fill', on ? '#FFB020' : '#6B5A2E'); }); }

  /* ---------- side panel ---------- */
  function flowSteps() {
    const up = S.up, fl = C.flow(), c = C.st().done;
    const first = { t: C.free ? '寫出你的縮寫' : '完成程式填空', done: c };
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
      ${HELP.panelDict(C)}
      <div class="row"><button class="btn primary sm" id="btnCheck">檢查答案</button><span class="pill ${nOk === bl.length ? 'ok' : ''}">${nOk} / ${bl.length} 格正確</span></div>
      <div><div class="small muted" style="margin-bottom:4px">字詞庫（先點空格，再點字詞）</div><div class="bank">${C.bank.map(w => `<button class="chip" data-w="${w}">${w}</button>`).join('')}</div></div>
      <ul class="blist">${bl.map(b => {
        const st = B(b.id); const cls = st.revealed ? 'rev' : st.status;
        let extra = '';
        if (st.status === 'ok') extra = '<span class="pill ok">正確</span>';
        else if (st.revealed) extra = '<span class="pill warn">已顯示答案</span>';
        else extra = `<div class="acts">${st.hinted ? '' : `<button class="btn sm ghost${st.wrong >= 2 ? ' pulse' : ''}" data-hint="${b.id}" title="使用提示會扣 1 分">💡 提示 −1</button>`}${st.wrong >= 3 ? `<button class="btn sm ghost" data-rev="${b.id}">顯示答案</button>` : ''}</div>`;
        let h = '';
        if (st.status === 'bad' && st.fb) h += `<div class="fb">${st.fb}</div>`;
        if (st.hinted && st.status !== 'ok' && !st.revealed) { const dk = HELP.dkOf(b, C.tpl); h += `<div class="h">💡 提示：${b.hint}${dk ? ` <button class="linkbtn" data-dk="${dk}">看字典</button>` : ''}</div>`; }
        return `<li class="${cls}"><span class="n">${b.id.slice(1)}</span><div><div>${b.ask}<span class="muted small">（第 ${b.line} 行）</span></div>${h}${st.wrong ? `<div class="small muted">答錯 ${st.wrong} 次</div>` : ''}</div>${extra}</li>`;
      }).join('')}</ul>`;
  }
  function freeBody() {
    const st = C.st();
    const ini = st.initials || '';
    const table = ini ? `<div class="mcards">${ini.split('').map(ch => `<div class="mcard"><b>${ch}</b><span>${MORSE[ch].split('').map(s => `<i class="${s === '·' ? 'd' : 'h'}"></i>`).join('')}</span><em>${MORSE[ch]}</em></div>`).join('')}</div>` : '';
    let hint = '';
    const fails = st.fails || 0;
    if (!st.done && fails >= 2 && ini) {
      const letters = ini.split('');
      const { calls } = parseRegion(st.text);
      const groups = [[]]; calls.forEach(c => { if (c.name === 'letterGap') groups.push([]); else groups[groups.length - 1].push(c.name); });
      let k = letters.findIndex((ch, i) => (groups[i] || []).join(',') !== morseCalls(ch).join(','));
      if (k < 0) k = 0;
      hint = `<div class="h small">提示：字母 <b>${letters[k]}</b>（${MORSE[letters[k]]}）要寫成 <code>${morseCalls(letters[k]).map(n => n + '();').join(' ')}</code>${k < letters.length - 1 ? '，之後加 <code>letterGap();</code>' : ''}</div>`;
    }
    return `<div class="stack" style="gap:8px">
      <p>用摩斯密碼閃出你的<b>英文名縮寫</b>。例如 Chan Tai Man → <b>CTM</b>。</p>
      ${st.done ? `<p>你的縮寫：<b class="mono">${esc(ini)}</b></p>` : `<div class="row"><input id="c2Init" class="ini-in" maxlength="4" value="${esc(ini)}" placeholder="例如 CTM" aria-label="英文名縮寫" autocomplete="off"><button class="btn sm" id="c2Set">設定</button></div>`}
      ${table}
      <div class="dict small"><div><code>·</code><span>寫 <code>dot();</code></span></div><div><code>–</code><span>寫 <code>dash();</code></span></div><div><code>字母之間</code><span>寫 <code>letterGap();</code></span></div></div>
      ${st.done ? '' : `<div class="row"><button class="chip" data-ins="dot();">dot();</button><button class="chip" data-ins="dash();">dash();</button><button class="chip" data-ins="letterGap();">letterGap();</button><button class="btn sm ghost" id="c2Clear">清除全部</button></div>
      <p class="small muted">按按鈕會在游標位置加入一行，也可以在編輯器直接打字。</p>
      <div class="row"><button class="btn primary sm" id="btnCheck">檢查程式</button>${fails ? `<span class="pill err">未通過 ${fails} 次</span>` : ''}${fails >= 3 && !st.revealed ? '<button class="btn sm ghost" id="c2Reveal">顯示答案</button>' : ''}</div>`}
      ${hint}
    </div>`;
  }
  function stepBody(i) {
    if (i === 0) return C.free ? freeBody() : blanksBody();
    if (!C.full) {
      if (i === 1) return `<p>按工具列左邊的 <b>✓ Verify</b>（或 <kbd>Ctrl</kbd>+<kbd>R</kbd>）。Board 和 Port 沿用主任務的設定。</p>`;
      return `<p>按 <b>→ Upload</b>（或 <kbd>Ctrl</kbd>+<kbd>U</kbd>），把程式傳到 Arduino。</p>`;
    }
    if (i === 1) return `<div class="minib"><div id="miniBoard">${miniSVG()}</div><div class="stack"><p>用 USB 線把 Arduino UNO 接到電腦。接上後板上綠色的 <b>ON</b> 燈會亮，電腦會多了一個 COM 連接埠。</p><button class="btn teal sm" id="btnUsb">插上 USB 線</button></div></div>`;
    if (i === 2) return `<p>在 IDE 最上方的選單按 <span class="path">Tools → Board → Arduino AVR Boards → Arduino Uno</span>。</p><p class="small muted">也可以用工具列上的開發板下拉選單。小心：選單內有很多款相似的板。</p>`;
    if (i === 3) return `<p>按 <span class="path">Tools → Port</span>，選有 <b>(Arduino Uno)</b> 字樣的 COM。每部電腦的號碼可能不同，所以要看清楚。</p>`;
    if (i === 4) return `<p>按工具列左邊的 <b>✓ Verify</b>（或 <kbd>Ctrl</kbd>+<kbd>R</kbd>）。編譯器會檢查程式有沒有文法錯誤，再轉換成 Arduino 看得懂的機器碼。</p>`;
    if (i === 5) return `<p>按 <b>→ Upload</b>（或 <kbd>Ctrl</kbd>+<kbd>U</kbd>），把程式傳到 Arduino。上傳時板上的 TX / RX 燈會快速閃動。</p>`;
    return '';
  }
  function statsHTML() {
    const fl = C.flow(), st = C.st();
    if (C.free) return `<span class="pill ${st.fails ? 'err' : ''}">檢查未通過 ${st.fails || 0} 次</span><span class="pill ${fl.errors ? 'err' : ''}">上傳流程錯誤 ${fl.errors || 0} 次</span>`;
    const nWrong = C.blanks.reduce((a, b) => a + (B(b.id).wrong || 0), 0), nRev = C.blanks.filter(b => B(b.id).revealed).length, nHint = C.blanks.filter(b => B(b.id).hinted).length;
    return `<span class="pill ${nWrong ? 'err' : ''}">填錯 ${nWrong} 次</span><span class="pill ${nHint ? 'warn' : ''}">使用提示 ${nHint} 格</span><span class="pill ${nRev ? 'warn' : ''}">顯示答案 ${nRev} 格</span><span class="pill ${fl.errors ? 'err' : ''}">上傳流程錯誤 ${fl.errors || 0} 次</span>`;
  }
  function renderPanel() {
    const steps = flowSteps();
    const cur = steps.findIndex(s => !s.done);
    const done = C.st().done;
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
      ${C.free || C.debug ? HELP.panelDict(C) : ''}`;
    const bc = $('#btnCheck'); if (bc) bc.onclick = C.free ? checkC2 : checkAnswers;
    const bu = $('#btnUsb'); if (bu) bu.onclick = plugUsb;
    const cn = $('#codeNext'); if (cn) cn.onclick = () => goStage(C.next.stage);
    const cb = $('#codeBack'); if (cb) cb.onclick = () => goStage('ext');
    $$('[data-rev]', panel).forEach(b => b.onclick = () => reveal(b.dataset.rev));
    $$('[data-hint]', panel).forEach(b => b.onclick = () => useHint(b.dataset.hint));
    $$('.chip[data-w]', panel).forEach(c => c.onclick = () => {
      let id = lastFocus;
      const st = id && C.blanks.some(b => b.id === id) && B(id);
      if (!st || st.status === 'ok' || st.revealed) { const nb = C.blanks.find(b => B(b.id).status !== 'ok' && !B(b.id).revealed); if (!nb) return; id = nb.id; }
      const el = $('#blank-' + id); el.value = c.dataset.w; el.dispatchEvent(new Event('input')); el.focus();
      focusNext(id);
    });
    $$('.chip[data-ins]', panel).forEach(c => c.onclick = () => insertAtCaret(c.dataset.ins));
    const setIni = () => {
      const v = ($('#c2Init').value || '').toUpperCase().replace(/[^A-Z]/g, '');
      if (v.length < 2 || v.length > 4) { toast('縮寫要有 2 至 4 個英文字母。', 'err'); return; }
      C.st().initials = v; save(); toast(`縮寫已設定為 ${v}`, 'ok'); renderPanel();
    };
    const si = $('#c2Set'); if (si) si.onclick = setIni;
    const ii = $('#c2Init'); if (ii) ii.onkeydown = e => { if (e.key === 'Enter') setIni(); };
    const cl = $('#c2Clear'); if (cl) cl.onclick = () => { const ta = $('#regionTa'); if (ta) { ta.value = ''; C.st().text = ''; save(); syncRegion(); ta.focus(); } };
    const rv = $('#c2Reveal'); if (rv) rv.onclick = revealC2;
    if (C.name === 'main' && S.up.uploaded) { const m = $('#miniBoard'); if (m && !miniStop) startMiniSOS(); }
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
    HELP.setCtx(C);
    $('#ideMenubar .title').textContent = `${C.file} | Arduino IDE`;
    $('.ide-tab').textContent = `${C.file}.ino`;
    C.blanks.forEach(b => B(b.id));
    renderEditor(); renderStatus(); renderPanel();
    if (switched || !$('#ideOut').textContent) out([{ c: 'g', t: '（Output 視窗：編譯和上傳的訊息會顯示在這裏）' }]);
  }
  function fillAnswers(name = C ? C.name : 'main') {
    const prev = C; C = CTX[name];
    if (C.free) { if (!C.st().initials) C.st().initials = 'SOS'; C.st().text = C.st().initials.split('').map((ch, i) => morseCalls(ch).map(n => n + '();').join('\n') + (i < C.st().initials.length - 1 ? '\nletterGap();' : '')).join('\n'); }
    else C.blanks.forEach(b => { B(b.id).val = b.ans; });
    S.teacherUsed = true; save();
    if (built && prev && prev.name === name) { renderEditor(); renderPanel(); } else C = prev;
  }
  function leave() { if (miniStop) { miniStop(); miniStop = null; } closeMenus(); }
  return { enter, leave, fillAnswers, compile: compileBlanks, checkAnswers, parseRegion, current: () => C && C.name };
})();
stageInit.code = () => IDE.enter('main');
stageInit.c1code = () => IDE.enter('c1');
stageInit.c2code = () => IDE.enter('c2');
