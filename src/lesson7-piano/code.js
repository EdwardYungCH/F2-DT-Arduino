/* =====================================================================
   Arduino IDE 模擬器：程式填空、選板、選 Port、編譯、上傳
   情境：main（迷你電子琴）、c1（延伸 1 光線琴）、c2（延伸 2 一鍵播歌）
   ===================================================================== */
HELP.setLesson(7);
const CODE_TEMPLATE = [
  '// 迷你電子琴：Do、Re、Mi、So 四個琴鍵',
  '// 按鈕一邊接腳位，另一邊接 GND；蜂鳴器接 D8',
  '',
  'int buzzerPin = 8;',
  'int doKey = 2;',
  'int reKey = 3;',
  'int miKey = 4;',
  'int soKey = {{b1}};              // So 鍵接在哪一支腳？',
  '',
  'void setup() {',
  '  pinMode(buzzerPin, OUTPUT);',
  '  pinMode(doKey, {{b2}});       // 開啟板內的上拉電阻',
  '  pinMode(reKey, INPUT_PULLUP);',
  '  pinMode(miKey, INPUT_PULLUP);',
  '  pinMode(soKey, INPUT_PULLUP);',
  '}',
  '',
  'void loop() {',
  '  if ({{b3}}(doKey) == {{b4}}) {         // Do 鍵被按下？',
  '    tone(buzzerPin, 262);             // Do',
  '  } else if (digitalRead(reKey) == LOW) {',
  '    tone(buzzerPin, {{b5}});             // Re',
  '  } {{b6}} if (digitalRead(miKey) == LOW) {',
  '    tone(buzzerPin, 330);             // Mi',
  '  } else if (digitalRead(soKey) == LOW) {',
  '    tone(buzzerPin, {{b7}});             // So',
  '  } else {',
  '    {{b8}}(buzzerPin);                 // 全部放開：停聲',
  '  }',
  '}',
];
const BLANKS = [
  { id: 'b1', ans: '5', ctx: 'init', ask: 'So 鍵接在哪一支腳（數字）', hint: '看接線：So 鍵（第 4 個按鈕）的線接在 <em>D5</em>。這裏只寫數字。' },
  { id: 'b2', ans: 'INPUT_PULLUP', ctx: 'mode', ask: 'Do 鍵的模式（開啟板內電阻）', hint: '看看下面三行：按鈕用 <em>INPUT_PULLUP</em>（全部大寫，中間是底線 _）。' },
  { id: 'b3', ans: 'digitalRead', ctx: 'func', argc: 1, ask: '讀取按鈕的指令', hint: '第 3 堂學過：讀取按鈕用 <em>digitalRead</em>（R 大寫）。看看下面幾行。' },
  { id: 'b4', ans: 'LOW', ctx: 'level', accept: v => v === 'LOW' || v === '0', ask: '按下按鈕時讀到甚麼', hint: '用了 INPUT_PULLUP：放開是 HIGH，<em>按下是 LOW</em>（接到 GND）。' },
  { id: 'b5', ans: '294', ctx: 'arg', ask: 'Re 的頻率（Hz）', hint: '看右邊的<em>音階頻率卡</em>，找 Re。只寫數字。' },
  { id: 'b6', ans: 'else', ctx: 'kw', type: '一個英文字（全部小寫）', ask: '「否則，如果…」的「否則」', hint: '上下兩行都寫 <em>else if</em>。這一格只填 <em>else</em>（if 已經寫好）。' },
  { id: 'b7', ans: '392', ctx: 'arg', ask: 'So 的頻率（Hz）', hint: '看右邊的<em>音階頻率卡</em>，找 So。只寫數字。' },
  { id: 'b8', ans: 'noTone', ctx: 'func', argc: 1, ask: '令蜂鳴器停聲的指令', hint: '停聲 = no + Tone，寫成 <em>noTone</em>，注意 T 大寫。' },
];
const BANK = ['5', '8', 'INPUT_PULLUP', 'INPUT', 'OUTPUT', 'digitalRead', 'digitalWrite', 'LOW', 'HIGH', 'else', 'tone', 'noTone'];

/* ---------- 延伸挑戰 1：光線琴 ---------- */
const C1_TEMPLATE = [
  '// 延伸挑戰 1：光線琴',
  '// 手越近光感應器（越暗），聲音越高；手拿開就停聲',
  '',
  'int buzzerPin = 8;',
  '',
  'void setup() {',
  '  pinMode(buzzerPin, OUTPUT);',
  '}',
  '',
  'void loop() {',
  '  int val = readLight();          // 讀 20 次計平均（見最後幾行）',
  '  if (val > {{e1}}) {               // 手遮住了嗎？（門檻值）',
  '    int pitch = {{e2}}(val, 400, 700, 262, {{e3}});   // 讀數 → 音高',
  '    {{e4}}(buzzerPin, {{e5}});',
  '  } else {',
  '    {{e6}}(buzzerPin);',
  '  }',
  '}',
  '',
  'int readLight() {',
  '  long sum = 0;',
  '  for (int i = 0; i < 20; i++) {',
  '    sum = sum + analogRead(A0);',
  '    delay(1);',
  '  }',
  '  return sum / 20;',
  '}',
];
const thrOk = v => /^\d+$/.test(v) && +v >= LIGHT.THR_MIN && +v <= LIGHT.THR_MAX;
const topOk = v => /^\d+$/.test(v) && +v >= 300 && +v <= 2000;
const C1_BLANKS = [
  { id: 'e1', ans: '500', ctx: 'arg', accept: thrOk, open: true, ask: '門檻值：讀數大過幾多才發聲', hint: '用右邊的小實驗：課室燈光約 330，用手遮住約 700。選一個<em>中間</em>的數字，例如 500。' },
  { id: 'e2', ans: 'map', ctx: 'func', argc: 5, ask: '把讀數按比例轉成音高的指令', hint: '第 4、6 堂的延伸挑戰用過：<em>map</em>(值, 由, 至, 新由, 新至)。' },
  { id: 'e3', ans: '523', ctx: 'arg', accept: topOk, open: true, ask: '最高音的頻率（300 至 2000）', hint: '手完全遮住時發出的音。可以用音階卡的<em>高音 Do（523）</em>，或者自己定一個更尖的音（例如 1047）。' },
  { id: 'e4', ans: 'tone', ctx: 'func', argc: 2, ask: '令蜂鳴器發聲的指令', hint: '發聲用 <em>tone</em>(腳, 頻率)。' },
  { id: 'e5', ans: 'pitch', ctx: 'arg', ask: '用哪個變數做頻率', hint: '上一行用 map 計出來的音高存在哪一個變數？看等號左邊。' },
  { id: 'e6', ans: 'noTone', ctx: 'func', argc: 1, ask: '手拿開時：停聲的指令', hint: '停聲用 <em>noTone</em>(腳)。' },
];
const C1_BANK = ['map', 'analogRead', 'tone', 'noTone', 'pitch', 'val', 'buzzerPin'];

/* ---------- 延伸挑戰 2：一鍵播歌（陣列 + for 迴圈） ---------- */
const C2_TEMPLATE = [
  '// 延伸挑戰 2：一鍵播歌',
  '// 按 Do 鍵（D2），自動播《瑪莉有隻小綿羊》',
  '',
  'int buzzerPin = 8;',
  'int doKey = 2;',
  '// 陣列：一個名稱記住一串數字（數一數有幾多個音）',
  'int melody[] = {330, 294, 262, 294, 330, 330, 330, 294, 294, 294, 330, {{e1}}, 392};',
  '',
  'void setup() {',
  '  pinMode(buzzerPin, OUTPUT);',
  '  pinMode(doKey, INPUT_PULLUP);',
  '}',
  '',
  'void loop() {',
  '  if (digitalRead(doKey) == LOW) {',
  '    for (int i = 0; i {{e2}} {{e3}}; i{{e4}}) {   // i 由 0 開始，逐個音播',
  '      tone(buzzerPin, {{e5}}[i]);        // 陣列的第 i 個音',
  '      delay({{e6}});                     // 每個音長幾多毫秒',
  '      noTone(buzzerPin);',
  '      delay(50);                       // 音與音之間停一停',
  '    }',
  '  }',
  '}',
];
const noteOk = v => /^\d+$/.test(v) && +v >= 100 && +v <= 1000;
const C2_BLANKS = [
  { id: 'e1', ans: '392', ctx: 'arg', ask: '倒數第二個音（So）的頻率', hint: '歌的最後是 Mi So So。看<em>音階頻率卡</em>：So = ？' },
  { id: 'e2', ans: '<', ctx: 'op', ask: '迴圈繼續的條件符號', hint: 'i 由 0 開始，13 個音的位置是 0 至 12。條件是 i「<em>細過</em>」13。' },
  { id: 'e3', ans: '13', ctx: 'arg', ask: '一共有幾多個音', hint: '數一數 melody 的 { } 內有幾多個數字（包括空格 1 那個）。' },
  { id: 'e4', ans: '++', ctx: 'incr', ask: '每次令 i 加 1 的符號', hint: '每次加 1 寫成 <em>i++</em>。' },
  { id: 'e5', ans: 'melody', ctx: 'arg', ask: '陣列的名稱', hint: '一串音存在哪一個陣列？看第 7 行：int <em>melody</em>[] = …' },
  { id: 'e6', ans: '400', ctx: 'arg', accept: noteOk, open: true, ask: '每個音長幾多毫秒（100 至 1000）', hint: '400 毫秒左右聽起來剛好。數字越大，歌越慢。' },
];
const C2_BANK = ['<', '<=', '13', '12', '++', '--', 'melody', 'i'];
const C2_TEMPLATE_FREE = null;
const MORSE = {};
const morseCalls = () => [];
const blankVal = (st, b) => { const v = String((st.blanks[b.id] || {}).val || '').trim(); return b.open && b.accept && b.accept(v) ? v : b.ans; };

const BOARDS = ['Arduino Yún', 'Arduino Uno', 'Arduino Duemilanove or Diecimila', 'Arduino Nano', 'Arduino Mega or Mega 2560', 'Arduino Mega ADK', 'Arduino Leonardo', 'Arduino Micro', 'Arduino Esplora', 'Arduino Mini', 'Arduino Ethernet', 'Arduino Fio', 'Arduino BT', 'LilyPad Arduino USB', 'LilyPad Arduino', 'Arduino Pro or Pro Mini', 'Arduino NG or older', 'Arduino Gemma', 'Arduino Uno WiFi'];
const lineOf = (tpl, id) => tpl.findIndex(l => l.includes('{{' + id + '}}')) + 1;
const colOf = (tpl, b) => tpl[b.line - 1].indexOf('{{' + b.id) + 1;
BLANKS.forEach(b => b.line = lineOf(CODE_TEMPLATE, b.id));
C1_BLANKS.forEach(b => b.line = lineOf(C1_TEMPLATE, b.id));
C2_BLANKS.forEach(b => b.line = lineOf(C2_TEMPLATE, b.id));
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
      name: 'main', file: 'Mini_Piano', eyebrow: '第 3 步', title: '編程及上傳', full: true,
      tpl: CODE_TEMPLATE, blanks: BLANKS, bank: BANK,
      st: () => S.code, flow: () => S.up,
      intro: `程式已寫好大部分，你要完成 <b>8 個橙色空格</b>。今堂的新語法：<code>INPUT_PULLUP</code>（按下 = LOW）和 <code>if … else if … else</code>。音的頻率看下面的<b>音階頻率卡</b>。`,
      revealNote: '顯示答案後，這一格只會得 1 分（滿分 5 分）。建議先再試一次。',
      next: { label: '下一步：實物挑戰', stage: 'real' },
      dict: ['INPUT_PULLUP', 'digitalRead', 'LOW', 'elseif', 'tone', 'noTone'],
    },
    c1: {
      name: 'c1', file: 'Light_Theremin', eyebrow: '延伸挑戰 1 · 光線琴', title: '編程及上傳', full: false,
      tpl: C1_TEMPLATE, blanks: C1_BLANKS, bank: C1_BANK,
      st: () => S.ext.c1.code, flow: () => S.ext.c1.flow,
      intro: `你要完成 <b>6 個空格</b>：讀數大過<b>門檻值</b>才發聲；用 <code>map</code> 把讀數（400 至 700）轉成音高（262 至最高音）。空格 1 和 3 由你決定。`,
      revealNote: '顯示答案會令這個挑戰扣 2 分。建議先再試一次。',
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: ['map', 'tone', 'noTone', 'gt'],
    },
    c2: {
      name: 'c2', file: 'Play_Song', eyebrow: '延伸挑戰 2 · 一鍵播歌', title: '編程及上傳', full: false,
      tpl: C2_TEMPLATE, blanks: C2_BLANKS, bank: C2_BANK,
      st: () => S.ext.c2.code, flow: () => S.ext.c2.flow,
      intro: `不用接新零件。你要完成 <b>6 個空格</b>：把整首歌的頻率放進<b>陣列</b> <code>melody</code>，再用 <code>for</code> 迴圈逐個音播出來。`,
      revealNote: '顯示答案會令這個挑戰扣 2 分。建議先再試一次。',
      next: { label: '返回延伸挑戰', stage: 'ext' },
      dict: ['array', 'for', 'inc', 'tone'],
    },
  };
  const ctxName = () => C && C.name;
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
        const w = Math.max(b.ans.length, 3) + 1.6 + (b.open ? 1 : 0);
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
  const NOTE_FB = f => { const n = noteName(f); return n ? `${f} 是 <b>${n}</b>。` : ''; };
  function feedback(b, v) {
    const lc = v.toLowerCase();
    if (lc === b.ans.toLowerCase() && !/^\d+$/.test(b.ans)) return '大小寫不對。Arduino 會分辨大小寫，請看清楚。';
    if (/[^\x00-\x7F]/.test(v)) return '不可以用中文或全形字，只可以用英文、數字和半形符號。';
    const cn = ctxName(), num = /^-?\d+$/.test(v);
    if (cn === 'main') {
      if (b.id === 'b1') {
        if (/^d\d+$/i.test(v)) return `這裏只寫數字，不用寫 D：例如 <code>${v.slice(1)}</code>。`;
        if (/^~\d+$/.test(v)) return '只寫數字，不用寫「~」。';
        const k = KEYS.find(x => String(x.n) === v); if (k && k.k !== 'so') return `${v} 號已經用來接 <b>${k.name} 鍵</b>。So 鍵（第 4 個按鈕）接在哪一支腳？`;
        if (v === '8') return '8 號接蜂鳴器。So 鍵（第 4 個按鈕）接在哪一支腳？';
        return 'So 鍵是第 4 個按鈕，看看它的線接在哪一支腳。';
      }
      if (b.id === 'b2') {
        if (lc === 'input') return '用 <code>INPUT</code> 的話，板內的電阻沒有開啟：按鈕放開時腳位「浮空」，讀數會亂跳，蜂鳴器會亂響。今堂沒有下拉電阻，要用另一個模式開啟<b>板內的上拉電阻</b>。';
        if (lc === 'output') return '按鈕是<b>輸入</b>零件（Arduino 讀取它），不是輸出。';
        if (/input\s+pullup|input-pullup/i.test(v)) return '中間要用<b>底線</b> <code>_</code>，不是空格或減號：<code>INPUT_PULLUP</code>。';
        if (/pull/i.test(v)) return '寫法是 <code>INPUT_PULLUP</code>：INPUT + 底線 + PULLUP，全部大寫。';
      }
      if (b.id === 'b3' && lc === 'digitalwrite') return '<code>digitalWrite</code> 是「寫」出 HIGH / LOW；這裏要「讀取」按鈕。';
      if (b.id === 'b3' && lc === 'analogread') return '按鈕只有按下和放開兩種狀態，用讀取<b>數位</b>腳的指令就可以。';
      if (b.id === 'b4' && lc === 'high') return '用了 <code>INPUT_PULLUP</code>：放開時是 HIGH，<b>按下時才是 LOW</b>（接到 GND）。寫 HIGH 的話，不按也會響，按下反而停。';
      if (b.id === 'b4' && v === '1') return '1 即是 HIGH（放開）。按下時讀到的是 LOW。';
      if (b.id === 'b5' || b.id === 'b7') {
        const want = b.id === 'b5' ? 'Re' : 'So';
        if (!num) return /^(do|re|mi|fa|so|la|ti)$/i.test(v) ? '要寫頻率的<b>數字</b>（Hz），不是音名。看音階頻率卡。' : '這裏要填一個數字（頻率，單位 Hz，不用寫單位）。';
        if (NOTE_FB(v)) return `${NOTE_FB(v)}這一行是 <b>${want}</b>，看音階頻率卡。`;
        return `看音階頻率卡，找 <b>${want}</b> 的頻率。`;
      }
      if (b.id === 'b6') {
        if (lc === 'if') return '只寫 <code>if</code> 的話，下面會變成另一組獨立的 if：按住 Do 或 Re 時，下面那組最後的 <code>else</code> 會立即 <code>noTone</code>，聲音會斷斷續續。要寫「否則，如果」：這一格填 <b>else</b>。';
        if (/^else\s*if$/i.test(v)) return '後面已經寫了 <code>if</code>，這一格只填 <b>else</b>。';
        return '這裏要用「否則」，和上下兩行的 <code>} else if (</code> 一樣。';
      }
      if (b.id === 'b8' && lc === 'tone') return '<code>tone</code> 是開聲；全部放開時要<b>停聲</b>。';
      if (b.id === 'b8' && lc === 'digitalwrite') return '停聲要用專門停止 <code>tone()</code> 的指令。';
    }
    if (cn === 'c1') {
      if (b.id === 'e1') {
        if (!num) return '這裏要填一個數字（讀數 0 至 1023）。';
        if (+v <= 340) return `門檻 ${v} 太低：課室燈光的讀數（約 330）已經差不多，手未遮住也會一直響。`;
        if (+v < LIGHT.THR_MIN) return `門檻 ${v} 太接近課室燈光（約 330），燈光一變就會亂響。試試 500 左右。`;
        if (+v >= 700) return `門檻 ${v} 太高：用手遮住也只有約 700，永遠不會響。`;
        return `門檻 ${v} 太接近「用手遮住」（約 700），要遮得很密才響。試試 500 左右。`;
      }
      if (b.id === 'e2' && lc === 'analogread') return '<code>readLight()</code> 已經讀了讀數。這裏要把讀數<b>按比例轉成</b>音高。';
      if (b.id === 'e2' && lc === 'tone') return '<code>tone</code> 是發聲。這一行先計出音高，用按比例轉換的指令。';
      if (b.id === 'e3') {
        if (!num) return '這裏要填一個數字（頻率，Hz）。';
        if (+v < 300) return `${v} Hz 比最低音 Do（262）高不了多少，手移近時音高差不多不變。最高音要比 262 高得多，例如 523。`;
        return `${v} Hz 太尖了，聲音會很刺耳。請用 2000 或以下，例如 523（高音 Do）。`;
      }
      if (b.id === 'e4' && lc === 'notone') return '<code>noTone</code> 是停聲；手遮住時要<b>發聲</b>。';
      if (b.id === 'e5' && v === 'val') return '<code>val</code> 是光感應器讀數（400 至 700），不是音高。要用 map 計出來的音高變數。';
      if (b.id === 'e5' && num) return '寫死一個數字的話，手移近也不會變音。要用存着音高的<b>變數</b>。';
      if (b.id === 'e6' && lc === 'tone') return '手拿開時要<b>停聲</b>。';
    }
    if (cn === 'c2') {
      if (b.id === 'e1') { if (!num) return '要寫頻率的<b>數字</b>（Hz）。'; if (NOTE_FB(v)) return `${NOTE_FB(v)}歌的最後是 Mi <b>So So</b>，看音階頻率卡找 So。`; return '看音階頻率卡，找 So 的頻率。'; }
      if (b.id === 'e2' && v === '<=') return 'melody 有 13 個音，位置是 0 至 <b>12</b>。<code>i &lt;= 13</code> 會讀第 13 號位置（不存在），會播出一個怪聲。用「細過」。';
      if (b.id === 'e2' && (v === '>' || v === '>=')) return 'i 由 0 開始，「0 大過 13」不成立，迴圈<b>一次也不會做</b>。';
      if (b.id === 'e2' && v === '==') return '「i 等於 13」一開始就不成立（i 是 0），迴圈一次也不會做。';
      if (b.id === 'e2' && v === '=') return '一個 <code>=</code> 是「設定」，不是比較。';
      if (b.id === 'e3') { if (!num) return '這裏要填一個數字：音的數目。'; return +v < 13 ? `只播 ${v} 個音的話，最後 ${13 - +v} 個音不會播。數一數 melody 有幾多個數字。` : `melody 只有 13 個數字。播 ${v} 個的話，後面會讀到不存在的位置，播出怪聲。`; }
      if (b.id === 'e4' && v === '--') return '<code>i--</code> 會令 i 越來越細，永遠細過 13，迴圈停不了。要每次<b>加 1</b>。';
      if (b.id === 'e4' && v === '+') return '加 1 要寫兩個加號：<code>++</code>。';
      if (b.id === 'e5' && v === 'i') return '<code>i</code> 只是位置（0、1、2…）。要由陣列取出第 i 個音：寫陣列的名稱，後面的 <code>[i]</code> 已經寫好。';
      if (b.id === 'e5' && num) return '這裏要寫<b>陣列的名稱</b>，不是數字。';
      if (b.id === 'e6') { if (!num) return '這裏要填一個數字（毫秒）。'; return +v < 100 ? `${v} 毫秒太快了，每個音一閃即過，聽不出是歌。` : `${v} 毫秒太慢了，整首歌要播 ${(13 * (+v + 50) / 1000).toFixed(0)} 秒。`; }
    }
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
      ...['Auto Format|Ctrl+T', 'Archive Sketch', 'Manage Libraries...|Ctrl+Shift+I'].map(parseDeco), { label: 'Serial Monitor', sc: 'Ctrl+Shift+M', act: () => openMonitor() }, ...['Serial Plotter', '-', 'WiFi101 / WiFiNINA Firmware Updater', '-'].map(parseDeco),
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
  const KNOWN = ['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'true', 'false', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'buzzerPin', 'doKey', 'reKey', 'miKey', 'soKey', 'val', 'pitch', 'melody', 'i'];
  const FUNCS = ['digitalWrite', 'digitalRead', 'pinMode', 'delay', 'analogWrite', 'analogRead', 'map', 'tone', 'noTone'];
  const METHODS = ['begin', 'end', 'print', 'println', 'write', 'read', 'available', 'flush'];
  const ARITY = { digitalWrite: [2], digitalRead: [1], pinMode: [2], delay: [1], analogWrite: [2], analogRead: [1], map: [5], tone: [2, 3], noTone: [1] };
  const PROTO = { digitalWrite: 'void digitalWrite(uint8_t, uint8_t)', digitalRead: 'int digitalRead(uint8_t)', pinMode: 'void pinMode(uint8_t, uint8_t)', delay: 'void delay(long unsigned int)', analogWrite: 'void analogWrite(uint8_t, int)', analogRead: 'int analogRead(uint8_t)', map: 'long int map(long int, long int, long int, long int, long int)', tone: 'void tone(uint8_t, unsigned int, long unsigned int)', noTone: 'void noTone(uint8_t)' };
  function suggest(id) { const all = KNOWN.concat(FUNCS); return all.find(k => k.toLowerCase() === id.toLowerCase() && k !== id) || null; }
  let lastWarns = [];
  function compileBlanks() {
    const errs = [], warns = [];
    const filled = C.tpl.map(l => l.replace(/\{\{([a-z]\d)\}\}/g, (_, id) => (B(id).val || '').trim()));
    C.blanks.forEach(b => {
      const v = (B(b.id).val || '').trim();
      const line = b.line, lineTxt = filled[line - 1];
      const tline = C.tpl[line - 1], at = tline.indexOf('{{' + b.id);
      const fn = fnOf(C.tpl, line);
      const nextTok = (tline.slice(at + 6).match(/[^\s]/) || [';'])[0];
      const push = (msg, extra = {}) => errs.push({ b, line, col: realCol(b), fn, msg, lineTxt, len: Math.max(1, v.length), ...extra });
      if (b.ctx === 'incr') {
        if (v === '++' || v === '--') return;
        if (!v) return push("expected primary-expression before ')' token", { kind: 'empty' });
        return push(`expected ')' before '${esc(v)}' token`, { kind: 'bad' });
      }
      if (b.ctx === 'op') {
        if (['>', '<', '>=', '<=', '!='].includes(v)) return;
        if (v === '==') return;
        if (v === '=') { warns.push({ b, line, col: realCol(b) - 4, fn, msg: 'suggest parentheses around assignment used as truth value [-Wparentheses]', lineTxt, len: 13 }); return; }
        if (!v) return push("expected ';' before numeric constant", { kind: 'empty' });
        return push(`expected ';' before '${esc(v)}'`, { kind: 'bad' });
      }
      if (/[^\x00-\x7F]/.test(v)) { const byte = new TextEncoder().encode(v.match(/[^\x00-\x7F]/)[0])[0]; push(`stray '\\${byte.toString(8)}' in program`, { kind: 'stray' }); return; }
      if (b.ctx === 'kw') {
        if (v === 'else' || v === 'if') return;           // "} if (…)" compiles too: checking the answers explains why it is wrong
        if (!v) return push("expected ';' before 'if'", { kind: 'empty' });
        if (/^else\s+if$/.test(v)) return push("expected '(' before 'if'", { kind: 'bad' });
        const t0 = (v.match(/^[A-Za-z_]\w*/) || [v])[0];
        return push(`'${esc(t0)}' was not declared in this scope`, { kind: 'undecl', sug: t0.toLowerCase() === 'else' ? 'else' : null });
      }
      if (!v) {
        if (b.ctx === 'func') push(`expected primary-expression before '(' token`, { kind: 'empty' });
        else if (b.ctx === 'method') push(`expected unqualified-id before '(' token`, { kind: 'empty' });
        else push(`expected primary-expression before '${nextTok}' token`, { kind: 'empty' });
        return;
      }
      const tok = v.split(/\s+/)[0];
      if (b.ctx === 'method') {
        if (METHODS.includes(v)) return;
        const sug = METHODS.find(m => m.toLowerCase() === v.toLowerCase()) || (/^print/i.test(v) ? 'println' : null);
        return push(`'class HardwareSerial' has no member named '${esc(v)}'${sug ? `; did you mean '${sug}'?` : ''}`, { kind: 'member', sug: null, hint: sug });
      }
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
    lastWarns = warns;
    return errs;
  }
  /* column of a blank in the filled-in line (earlier blanks on the same line change the length) */
  function realCol(b) {
    const tline = C.tpl[b.line - 1], at = tline.indexOf('{{' + b.id);
    const before = tline.slice(0, at).replace(/\{\{([a-z]\d)\}\}/g, (_, id) => (B(id).val || '').trim());
    return before.length + 1;
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
    else if (e.kind === 'member') why = `<code>Serial</code> 沒有「${esc((B(e.b.id).val || '').trim())}」這個指令。${e.hint ? `你是否想寫 <b>${e.hint}</b>？` : ''}注意全部小寫。`;
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

  const SIZE = { main: [1612, 9], c1: [2302, 9], c2: [1880, 35] };
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
    if (C.free) ({ errs, warns } = compileFree()); else { errs = compileBlanks(); warns = lastWarns; }
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
    explainMap[C.name] = { kind: 'ok', html: C.name === 'main' ? '<b>上傳完成（Done uploading）！</b>你的電子琴可以彈了：按住琴鍵試試。' : '<b>上傳完成（Done uploading）！</b>延伸挑戰完成。' };
    setBusy(false); renderPanel();
    if (C.name === 'main') showResult();
    else EXT.showResult(C.name, true);
  }

  function showResult() {
    let sim = null;
    modal({
      title: '上傳成功！你的迷你電子琴',
      wide: true, dismissable: false,
      html: `<div class="sos-stage" id="resStage">${HW.circuitSVG(S.hw, null, { clickable: true, labels: HW.keyLabels() })}</div>${pianoPanelHTML('main')}`,
      actions: [{ label: '留在這頁', kind: 'ghost', onClick: () => { sim && sim.stop(); renderPanel(); } }, { label: '下一步：實物挑戰', kind: 'go', onClick: () => { sim && sim.stop(); goStage('real'); } }],
      onOpen: back => {
        const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A');
        sim = pianoSim(back, { mode: 'main' });
      },
    });
  }
  function openMonitor() {
    if (!C) return;
    toast('這個程式沒有用 Serial，Serial Monitor 不會顯示任何字。');
  }
  /* ---------- side-panel helpers: frequency card (all parts) + light reading lab (challenge 1) ---------- */
  let labDark = 40;
  function labHTML() {
    const card = `<div class="mini-lab"><div><b>音階頻率卡</b> <span class="small muted">（填頻率時看這裏）</span></div>${scaleHTML()}</div>`;
    if (C.name !== 'c1') return card;
    const v = LIGHT.base(labDark);
    return `<div class="mini-lab"><div><b>小實驗：讀數有幾大？</b> <span class="small muted">（拉動滑桿，模擬手移近光感應器）</span></div>
      <input type="range" class="hand-slider" id="labHand" min="0" max="100" value="${labDark}" aria-label="手和光感應器的距離">
      <div class="small" id="labRead">${LIGHT.label(labDark)}：讀數約 <b>${v}</b></div>
      <div id="labGauge">${gaugeHTML(v)}</div>
      <p class="small muted">課室燈光約 330，用手遮住約 700。門檻值選中間的數字（420 至 620）。</p></div>${card}`;
  }
  function bindLab(panel) {
    const sl = $('#labHand', panel); if (!sl) return;
    sl.oninput = () => { labDark = +sl.value; const v = LIGHT.base(labDark); $('#labRead', panel).innerHTML = `${LIGHT.label(labDark)}：讀數約 <b>${v}</b>`; setGauge($('#labGauge', panel), v); };
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
  function renderMini() { const m = $('#miniBoard'); if (m) m.innerHTML = miniSVG(); }

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
    return `<p>${C.intro}</p>${!C.st().done ? labHTML() : ''}
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
        if (st.hinted && st.status !== 'ok' && !st.revealed) { const dk = HELP.dkOf(b, C.tpl); h += `<div class="h">💡 提示：${b.hint}${dk ? ` <button class="linkbtn" data-dkey="${dk}">看字典</button>` : ''}</div>`; }
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
        bindLab(panel);
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
    $('#btnMonitor').addEventListener('click', openMonitor);
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
  function leave() { closeMenus(); }
  return { enter, leave, fillAnswers, compile: compileBlanks, checkAnswers, parseRegion, current: () => C && C.name };
})();
stageInit.code = () => IDE.enter('main');
stageInit.c1code = () => IDE.enter('c1');
stageInit.c2code = () => IDE.enter('c2');
