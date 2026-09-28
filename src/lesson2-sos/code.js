/* =====================================================================
   Arduino IDE 模擬器：程式填空、選板、選 Port、編譯、上傳
   ===================================================================== */
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
  { id: 'b7', ans: 'digitalWrite', ctx: 'func', ask: '控制腳位開關的指令', hint: '和上面「開燈」「關燈」那幾行用的是<em>同一個指令</em>。注意大小寫：digital 小寫，W 大寫。' },
  { id: 'b8', ans: '2000', ctx: 'delay', ask: '一次 SOS 後停多久', hint: '要停 2 秒。1 秒 = 1000 毫秒，2 秒 = ? 毫秒。' },
];
BLANKS.forEach(b => { b.line = CODE_TEMPLATE.findIndex(l => l.includes('{{' + b.id + '}}')) + 1; });
const BANK = ['13', '12', 'OUTPUT', 'INPUT', 'HIGH', 'LOW', '2', '200', '600', '2000', 'digitalWrite', 'digitalRead', 'pinMode'];
const BOARDS = ['Arduino Yún', 'Arduino Uno', 'Arduino Duemilanove or Diecimila', 'Arduino Nano', 'Arduino Mega or Mega 2560', 'Arduino Mega ADK', 'Arduino Leonardo', 'Arduino Micro', 'Arduino Esplora', 'Arduino Mini', 'Arduino Ethernet', 'Arduino Fio', 'Arduino BT', 'LilyPad Arduino USB', 'LilyPad Arduino', 'Arduino Pro or Pro Mini', 'Arduino NG or older', 'Arduino Gemma', 'Arduino Uno WiFi'];
const INO_PATH = 'C:\\Users\\student\\Documents\\Arduino\\SOS_Light\\SOS_Light.ino';

const IDE = (() => {
  let built = false, lastFocus = null, busy = false, playing = null, explain = null;
  const B = id => { if (!S.code.blanks[id]) S.code.blanks[id] = { val: '', wrong: 0, lastWrong: null, status: '', revealed: false, fb: '' }; return S.code.blanks[id]; };

  /* ---------- editor ---------- */
  function hl(text) {
    let out = '', i = 0;
    const ci = text.indexOf('//');
    const codePart = ci >= 0 ? text.slice(0, ci) : text, com = ci >= 0 ? text.slice(ci) : '';
    const re = /\b(void|int)\b|\b(pinMode|digitalWrite|delay)\b|\b(HIGH|LOW|OUTPUT)\b|\b(setup|loop)\b|\b(\d+)\b/g;
    const TIP = { pinMode: '設定腳位模式：pinMode(腳, OUTPUT/INPUT)', digitalWrite: '令腳位輸出 HIGH（開）或 LOW（關）', delay: '暫停，單位是毫秒（1000 = 1 秒）', HIGH: '高電位 5V（開）', LOW: '低電位 0V（關）', OUTPUT: '輸出模式', setup: '開機時執行一次', loop: '不停重複執行' };
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
    ed.innerHTML = CODE_TEMPLATE.map((line, idx) => {
      const parts = line.split(/(\{\{b\d\}\})/);
      const html = parts.map(p => {
        const m = /^\{\{(b\d)\}\}$/.exec(p);
        if (!m) return hl(p);
        const b = BLANKS.find(x => x.id === m[1]); const st = B(b.id);
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
        save(); renderPanelLight();
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) { e.preventDefault(); focusNext(inp.dataset.b); } });
    });
  }
  function markLine(inp) {
    $$('.cl.cur').forEach(x => x.classList.remove('cur'));
    const cl = inp.closest('.cl'); cl.classList.add('cur');
    const ln = +cl.dataset.ln; const col = CODE_TEMPLATE[ln - 1].indexOf('{{') + 1;
    $('#stPos').textContent = `Ln ${ln}, Col ${col}`;
  }
  function focusNext(id) {
    const i = BLANKS.findIndex(b => b.id === id);
    for (let k = 1; k <= BLANKS.length; k++) {
      const b = BLANKS[(i + k) % BLANKS.length]; const st = B(b.id);
      if (st.status !== 'ok' && !st.revealed) { const el = $('#blank-' + b.id); el.focus(); el.select(); el.scrollIntoView({ block: 'nearest' }); return; }
    }
  }

  /* ---------- checking answers ---------- */
  function feedback(b, v) {
    const lc = v.toLowerCase();
    if (lc === b.ans.toLowerCase()) return '大小寫不對。Arduino 會分辨大小寫，請看清楚。';
    if (/[^\x00-\x7F]/.test(v)) return '不可以用中文或全形字，只可以用英文和數字。';
    if (b.ctx === 'delay' || b.ctx === 'init') {
      const f = parseFloat(v);
      if (!isNaN(f) && b.ctx === 'delay' && Math.round(f * 1000) === +b.ans) return 'delay() 的單位是<b>毫秒</b>，不是秒。';
      if (b.id === 'b1' && /^\d+$/.test(v)) return '看清楚接線模擬器中，導線接在哪一號腳。';
      if (b.ctx === 'delay' && /^\d+$/.test(v)) return '時間不對，再看看那一行的註解（灰色文字）。';
    }
    if (b.id === 'b2' && lc === 'input') return 'INPUT 是「輸入」（例如讀取按鈕）；LED 要用「輸出」。';
    if (b.id === 'b3' && lc === 'low') return 'LOW 是關燈，開燈要用高電位。';
    if (b.id === 'b5' && lc === 'high') return 'HIGH 是開燈，關燈要用低電位。';
    if (b.id === 'b7' && lc === 'digitalread') return 'digitalRead 是「讀取」輸入；控制 LED 要「寫」出信號。';
    if (b.id === 'b7' && lc === 'pinmode') return 'pinMode 只用來設定模式，開燈要用另一個指令。';
    return '';
  }
  function checkAnswers() {
    S.code.checks++;
    let ok = 0, empty = 0, bad = 0, newly = 0;
    BLANKS.forEach(b => {
      const st = B(b.id);
      if (st.status === 'ok' || st.revealed) { ok++; return; }
      const v = (st.val || '').trim();
      if (!v) { empty++; st.status = ''; st.fb = ''; return; }
      if (v === b.ans) { st.status = 'ok'; st.fb = ''; st.val = v; ok++; return; }
      st.status = 'bad'; bad++;
      st.fb = feedback(b, v);
      if (v !== st.lastWrong) { st.wrong++; st.lastWrong = v; newly++; logEv('code', `空格 ${b.id.slice(1)}（${b.ask}）填了「${v}」`); }
    });
    save(); renderEditor();
    if (ok === BLANKS.length) {
      S.code.done = true; S.t.codeEnd = now(); save();
      explain = { kind: 'ok', html: '全部 8 格都正確！接下來要把程式上傳到 Arduino。' };
      renderPanel();
      modal({ title: '程式填空全部正確！', html: `<p>接下來像真的一樣把程式上傳到 Arduino：</p><ol style="margin:10px 0 0;padding-left:1.3em;display:flex;flex-direction:column;gap:4px"><li>插上 USB 線</li><li>在 <span class="path">Tools → Board</span> 選開發板</li><li>在 <span class="path">Tools → Port</span> 選連接埠</li><li>按 ✓ 驗證，再按 → 上傳</li></ol>`, actions: [{ label: '開始', kind: 'go' }] });
      return;
    }
    const parts = [`${ok} / 8 格正確`];
    if (bad) parts.push(`${bad} 格有錯（紅色）`);
    if (empty) parts.push(`${empty} 格未填`);
    explain = { kind: bad ? 'err' : 'warn', html: parts.join('，') + '。' + (bad ? '看看右邊清單的提示，改好後再按「檢查答案」。' : '') };
    renderPanel();
    const firstBad = BLANKS.find(b => B(b.id).status === 'bad') || BLANKS.find(b => B(b.id).status !== 'ok' && !B(b.id).revealed);
    if (firstBad) { const el = $('#blank-' + firstBad.id); el.focus(); el.scrollIntoView({ block: 'center' }); }
  }
  function reveal(id) {
    const b = BLANKS.find(x => x.id === id);
    modal({
      title: `顯示空格 ${id.slice(1)} 的答案？`,
      html: `<p>顯示答案後，這一格只會得 1 分（滿分 5 分）。建議先再試一次。</p>`,
      actions: [{ label: '再試一次', kind: 'ghost' }, { label: '顯示答案', kind: 'primary', onClick: () => {
        const st = B(id); st.revealed = true; st.val = b.ans; st.status = ''; st.fb = '';
        logEv('code', `顯示答案：空格 ${id.slice(1)}（${b.ask}）`); save(); renderEditor(); renderPanel();
        if (BLANKS.every(x => B(x.id).status === 'ok' || B(x.id).revealed)) checkAnswers();
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
    // keep inside the wrap horizontally
    const wr = wrap.getBoundingClientRect(), mr = m.getBoundingClientRect();
    if (mr.right > wr.right + 120 && level > 0) m.style.left = Math.max(0, x - mr.width - (openMenus[level - 1] ? openMenus[level - 1].getBoundingClientRect().width : 0) + 4) + 'px';
    const vh = window.innerHeight; if (mr.bottom > vh - 8) m.style.maxHeight = (vh - mr.top - 12) + 'px', m.style.overflowY = 'auto';
    return m;
  }

  /* ---------- board & port ---------- */
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
  const KNOWN = ['HIGH', 'LOW', 'OUTPUT', 'INPUT', 'INPUT_PULLUP', 'LED_BUILTIN', 'true', 'false', 'ledPin'];
  const FUNCS = ['digitalWrite', 'digitalRead', 'pinMode', 'delay', 'analogWrite'];
  function suggest(id) { const all = KNOWN.concat(FUNCS); return all.find(k => k.toLowerCase() === id.toLowerCase() && k !== id) || null; }
  function compile() {
    const errs = [];
    const filled = CODE_TEMPLATE.map(l => l.replace(/\{\{(b\d)\}\}/g, (_, id) => (B(id).val || '').trim()));
    BLANKS.forEach(b => {
      const v = (B(b.id).val || '').trim();
      const line = b.line, lineTxt = filled[line - 1];
      const col = CODE_TEMPLATE[line - 1].indexOf('{{') + 1;
      const fn = b.id === 'b1' ? null : b.id === 'b2' ? 'void setup()' : 'void loop()';
      const push = (msg, extra = {}) => errs.push({ b, line, col, fn, msg, lineTxt, len: Math.max(1, v.length), ...extra });
      if (/[^\x00-\x7F]/.test(v)) { const byte = new TextEncoder().encode(v.match(/[^\x00-\x7F]/)[0])[0]; push(`stray '\\${byte.toString(8)}' in program`, { kind: 'stray' }); return; }
      if (!v) {
        if (b.ctx === 'delay') push("too few arguments to function 'void delay(long unsigned int)'", { kind: 'empty' });
        else if (b.ctx === 'init') push("expected primary-expression before ';' token", { kind: 'empty' });
        else if (b.ctx !== 'func') push("expected primary-expression before ')' token", { kind: 'empty' });
        return;
      }
      const tok = v.split(/\s+/)[0];
      if (/^-?\d+(\.\d+)?$/.test(v)) { if (b.ctx === 'func') push(`expression cannot be used as a function`, { kind: 'bad' }); return; }
      if (/^[A-Za-z_]\w*$/.test(tok)) {
        if (b.ctx === 'func') {
          if (tok === 'digitalRead') return push("too many arguments to function 'int digitalRead(uint8_t)'", { kind: 'args' });
          if (tok === 'delay') return push("too many arguments to function 'void delay(long unsigned int)'", { kind: 'args' });
          if (FUNCS.includes(tok) && tok === v) return;
        } else if ((KNOWN.includes(tok) || tok === 'ledPin') && tok === v) return;
        return push(`'${tok}' was not declared in this scope`, { kind: 'undecl', sug: suggest(tok) });
      }
      push(`expected primary-expression before '${esc(v[0])}' token`, { kind: 'bad' });
    });
    return { errs, filled };
  }
  function errText(errs) {
    const out = []; let lastFn;
    errs.forEach(e => {
      if (e.fn && e.fn !== lastFn) { out.push({ c: '', t: `${INO_PATH}: In function '${e.fn}':` }); lastFn = e.fn; }
      out.push({ c: 'e', t: `${INO_PATH}:${e.line}:${e.col}: error: ${e.msg}` });
      out.push({ c: '', t: ` ${e.lineTxt}` });
      out.push({ c: 'e', t: ' ' + ' '.repeat(e.col - 1) + '^' + '~'.repeat(Math.max(0, e.len - 1)) });
      if (e.sug) out.push({ c: 'g', t: `${INO_PATH}:${e.line}:${e.col}: note: suggested alternative: '${e.sug}'` });
    });
    out.push({ c: '', t: '' }, { c: 'e', t: 'exit status 1' }, { c: '', t: '' }, { c: 'e', t: `Compilation error: ${errs[0].msg}` });
    return out;
  }
  function explainCompile(errs) {
    const e = errs[0]; const n = e.b.id.slice(1);
    let why = '';
    if (e.kind === 'stray') why = '程式裏出現了中文或全形字。程式碼只可以用英文、數字和半形符號。';
    else if (e.kind === 'empty') why = e.b.ctx === 'delay' ? 'delay() 的括號內要有一個數字（毫秒）。這個空格還未填。' : '這個空格還未填，編譯器不知道那裏應該是甚麼。';
    else if (e.kind === 'undecl') why = `編譯器不認識「${esc(e.msg.match(/'([^']+)'/)[1])}」這個字。${e.sug ? `你是否想寫 <b>${e.sug}</b>？Arduino 會分辨大小寫。` : '檢查一下串字和大小寫。'}`;
    else if (e.kind === 'args') why = '這個指令不能這樣用：括號內的資料數量不對。想想「開燈」應該用哪個指令。';
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

  const SIZE_LINES = [
    { c: '', t: 'Sketch uses 1102 bytes (3%) of program storage space. Maximum is 32256 bytes.' },
    { c: '', t: 'Global variables use 9 bytes (0%) of dynamic memory, leaving 2039 bytes for local variables. Maximum is 2048 bytes.' },
  ];
  function flowError(kind, action) {
    if (!S.code.done) return false;
    const sig = `${kind}|${action}|${S.up.board}|${S.up.port}|${S.up.usb}`;
    if (sig === S.up.lastErrSig) return false;
    S.up.lastErrSig = sig; S.up.errors++;
    const msgs = { no_board: '未選擇開發板', no_port: '未選擇連接埠（Port）', wrong_port: `選錯連接埠（${S.up.port}）`, wrong_board: `選錯開發板（${S.up.board}）` };
    logEv('up', `${action === 'upload' ? '上傳' : '驗證'}失敗：${msgs[kind]}`);
    save(); return true;
  }

  async function verify(isUpload = false) {
    if (busy) return false;
    closeMenus(); setBusy(true);
    out([]);
    if (!S.up.board) {
      await note('Compiling sketch...', 500);
      hideNote();
      out([{ c: 'e', t: 'Compilation error: Missing FQBN (Fully Qualified Board Name)' }]);
      const counted = flowError('no_board', isUpload ? 'upload' : 'verify');
      explain = { kind: 'err', html: `<b>未選擇開發板。</b>編譯器要知道程式是給哪一款板用的。請到 <span class="path">Tools → Board → Arduino AVR Boards</span> 選 <b>Arduino Uno</b>。${counted ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : ''}` };
      setBusy(false); renderPanel(); return false;
    }
    await note('Compiling sketch...', 1300);
    const { errs } = compile();
    if (errs.length) {
      hideNote();
      out(errText(errs));
      $$('.cl.errline').forEach(x => x.classList.remove('errline'));
      errs.forEach(e => { const cl = $(`.cl[data-ln="${e.line}"]`); cl && cl.classList.add('errline'); });
      explain = { kind: 'err', html: explainCompile(errs) };
      setBusy(false); renderPanel(); return false;
    }
    $$('.cl.errline').forEach(x => x.classList.remove('errline'));
    out(SIZE_LINES);
    if (!isUpload) {
      await note('Done compiling.', 1600, false); hideNote();
      if (S.code.done && S.up.board === 'Arduino Uno') { S.up.verified = true; save(); }
      explain = S.code.done
        ? (S.up.board === 'Arduino Uno' ? { kind: 'ok', html: '<b>編譯成功（Done compiling）。</b>程式沒有文法錯誤。下一步：按 → Upload 上傳。' } : { kind: 'warn', html: `編譯成功，但你選的開發板是 <b>${esc(S.up.board)}</b>。你手上的是 Arduino Uno，上傳前請更改。` })
        : { kind: 'warn', html: '<b>編譯成功，但這不代表程式正確！</b>編譯器只檢查文法，不知道數字是否正確。請按「檢查答案」確認每一格。' };
      setBusy(false); renderPanel(); return true;
    }
    return true;
  }

  async function upload() {
    if (busy) return;
    if (!S.code.done) {
      toast('請先完成程式填空，並按「檢查答案」確認全部正確。');
      explain = { kind: 'warn', html: '上傳之前，要先完成 8 個空格，並按「檢查答案」確認全部正確。' }; renderPanel(); return;
    }
    const ok = await verify(true);
    if (!ok) return;
    const up = S.up;
    if (!up.port) {
      hideNote(); out([{ c: 'e', t: 'Failed uploading: no upload port provided' }], true);
      const counted = flowError('no_port', 'upload');
      explain = { kind: 'err', html: `<b>未選擇連接埠（Port）。</b>${up.usb ? '' : '你還未插上 USB 線。'}電腦要知道 Arduino 接在哪一個 COM。請${up.usb ? '' : '先插上 USB 線，再'}到 <span class="path">Tools → Port</span> 選有 <b>(Arduino Uno)</b> 字樣的那一個。${counted ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : ''}` };
      setBusy(false); renderPanel(); return;
    }
    await note('Uploading...', 900);
    if (up.port !== up.com || !up.usb) {
      const lines = [];
      for (let i = 1; i <= 10; i++) lines.push({ c: 'e', t: `avrdude: stk500_recv(): programmer is not responding` }, { c: 'e', t: `avrdude: stk500_getsync() attempt ${i} of 10: not in sync: resp=0x00` });
      lines.push({ c: '', t: '' }, { c: 'e', t: 'Failed uploading: uploading error: exit status 1' });
      hideNote(); out(lines, true);
      const counted = flowError('wrong_port', 'upload');
      explain = { kind: 'err', html: `<b>上傳失敗：選錯連接埠。</b>${esc(up.port)} 不是 Arduino，所以電腦得不到回應（not in sync）。請到 <span class="path">Tools → Port</span> 選有 <b>(Arduino Uno)</b> 字樣的那一個。${counted ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : ''}` };
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
      explain = { kind: 'err', html: `<b>上傳失敗：選錯開發板。</b>你選了 <b>${esc(up.board)}</b>，但接着的是 <b>Arduino Uno</b>，上傳方式不同，所以失敗。請到 <span class="path">Tools → Board → Arduino AVR Boards</span> 改選 Arduino Uno。${counted ? '<br><span class="small">已記錄 1 次上傳流程錯誤。</span>' : ''}` };
      setBusy(false); renderPanel(); return;
    }
    // success
    let flick = setInterval(() => { $$('.mTX,.mRX').forEach(el => el.setAttribute('fill', Math.random() > .4 ? '#FFB020' : '#6B5A2E')); }, 70);
    await note('Uploading...', 1500);
    clearInterval(flick); $$('.mTX,.mRX').forEach(el => el.setAttribute('fill', '#6B5A2E'));
    await note('Done uploading.', 100, false);
    hideNote(2500);
    up.uploaded = true; up.verified = true; S.t.upEnd = now(); if (!S.t.real) S.t.real = now();
    unlock('real'); save();
    explain = { kind: 'ok', html: '<b>上傳完成（Done uploading）！</b>你的 SOS 求救燈正在運作。' };
    setBusy(false); renderPanel(); startMiniSOS();
    showResult();
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
    const up = S.up, c = S.code.done;
    return [
      { t: '完成程式填空', done: c },
      { t: '插上 USB 線', done: up.usb },
      { t: '選擇開發板（Board）', done: up.board === 'Arduino Uno' },
      { t: '選擇連接埠（Port）', done: up.usb && up.port === up.com },
      { t: '驗證（編譯）程式', done: up.verified },
      { t: '上傳程式', done: up.uploaded },
    ];
  }
  function stepBody(i) {
    const up = S.up;
    if (i === 0) {
      const nOk = BLANKS.filter(b => B(b.id).status === 'ok' || B(b.id).revealed).length;
      return `<p>程式已寫好大部分，你要完成 <b>8 個橙色空格</b>。先讀灰色的註解，它會告訴你那一行做甚麼。可以直接打字，或者點選下面的字詞。</p>
        <div class="row"><button class="btn primary sm" id="btnCheck">檢查答案</button><span class="pill ${nOk === 8 ? 'ok' : ''}">${nOk} / 8 格正確</span></div>
        <div><div class="small muted" style="margin-bottom:4px">字詞庫（先點空格，再點字詞）</div><div class="bank">${BANK.map(w => `<button class="chip" data-w="${w}">${w}</button>`).join('')}</div></div>
        <ul class="blist">${BLANKS.map(b => {
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
    if (i === 1) return `<div class="minib"><div id="miniBoard">${miniSVG()}</div><div class="stack"><p>用 USB 線把 Arduino UNO 接到電腦。接上後板上綠色的 <b>ON</b> 燈會亮，電腦會多了一個 COM 連接埠。</p><button class="btn teal sm" id="btnUsb">插上 USB 線</button></div></div>`;
    if (i === 2) return `<p>在 IDE 最上方的選單按 <span class="path">Tools → Board → Arduino AVR Boards → Arduino Uno</span>。</p><p class="small muted">也可以用工具列上的開發板下拉選單。小心：選單內有很多款相似的板。</p>`;
    if (i === 3) return `<p>按 <span class="path">Tools → Port</span>，選有 <b>(Arduino Uno)</b> 字樣的 COM。每部電腦的號碼可能不同，所以要看清楚。</p>`;
    if (i === 4) return `<p>按工具列左邊的 <b>✓ Verify</b>（或 <kbd>Ctrl</kbd>+<kbd>R</kbd>）。編譯器會檢查程式有沒有文法錯誤，再轉換成 Arduino 看得懂的機器碼。</p>`;
    if (i === 5) return `<p>按 <b>→ Upload</b>（或 <kbd>Ctrl</kbd>+<kbd>U</kbd>），把程式傳到 Arduino。上傳時板上的 TX / RX 燈會快速閃動。</p>`;
    return '';
  }
  function renderPanel() {
    const steps = flowSteps();
    const cur = steps.findIndex(s => !s.done);
    const nWrong = BLANKS.reduce((a, b) => a + (B(b.id).wrong || 0), 0), nRev = BLANKS.filter(b => B(b.id).revealed).length;
    const panel = $('#codePanel');
    panel.innerHTML = `<div><div class="eyebrow">第 3 步</div><h2>編程及上傳</h2></div>
      <ol class="steps">${steps.map((s, i) => {
        const locked = i > 0 && !S.code.done;
        const cls = s.done ? 'done' : (i === cur && !locked ? 'cur' : (i === 0 ? 'cur' : 'locked'));
        const open = (i === cur && !locked) || (i === 0 && !s.done) || (i === 1 && !S.up.usb && S.code.done);
        return `<li class="${cls}"><div class="sh"><i>${s.done ? '✓' : i + 1}</i>${s.t}</div>${open ? `<div class="sb">${stepBody(i)}</div>` : ''}</li>`;
      }).join('')}</ol>
      <div id="codeExplain">${explain ? alertBox(explain.kind, explain.html) : ''}</div>
      ${S.up.uploaded ? '<button class="btn go" id="codeNext">下一步：實物挑戰</button>' : ''}
      <div class="statline"><span class="pill ${nWrong ? 'err' : ''}">填錯 ${nWrong} 次</span><span class="pill ${nRev ? 'warn' : ''}">顯示答案 ${nRev} 格</span><span class="pill ${S.up.errors ? 'err' : ''}">上傳流程錯誤 ${S.up.errors} 次</span></div>
      <details class="fold know"><summary>指令小字典</summary><div class="dict">
        <div><code>int ledPin = 13;</code><span>建立變數 ledPin，記住 LED 接在 13 號腳</span></div>
        <div><code>setup()</code><span>開機時執行一次，用來做設定</span></div>
        <div><code>loop()</code><span>不停重複執行裏面的程式</span></div>
        <div><code>pinMode(腳, 模式)</code><span>設定腳位是 OUTPUT（輸出）還是 INPUT（輸入）</span></div>
        <div><code>digitalWrite(腳, 狀態)</code><span>HIGH = 輸出 5V（開），LOW = 輸出 0V（關）</span></div>
        <div><code>delay(毫秒)</code><span>暫停一段時間，1000 毫秒 = 1 秒</span></div>
      </div></details>`;
    const bc = $('#btnCheck'); if (bc) bc.onclick = checkAnswers;
    const bu = $('#btnUsb'); if (bu) bu.onclick = plugUsb;
    const cn = $('#codeNext'); if (cn) cn.onclick = () => goStage('real');
    $$('[data-rev]', panel).forEach(b => b.onclick = () => reveal(b.dataset.rev));
    $$('.chip', panel).forEach(c => c.onclick = () => {
      let id = lastFocus;
      const st = id && B(id);
      if (!id || st.status === 'ok' || st.revealed) { const nb = BLANKS.find(b => B(b.id).status !== 'ok' && !B(b.id).revealed); if (!nb) return; id = nb.id; }
      const el = $('#blank-' + id); el.value = c.dataset.w; el.dispatchEvent(new Event('input')); el.focus();
      focusNext(id);
    });
    if (S.up.uploaded) { const m = $('#miniBoard'); if (m && !miniStop) startMiniSOS(); }
  }
  function renderPanelLight() {
    const pill = $('#codePanel .steps li:first-child .pill'); // counts only change on check; nothing else to refresh
    return pill;
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
      if (!S || S.stage !== 'code' || !(e.ctrlKey || e.metaKey) || $('.modal-back')) return;
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); verify(false); }
      if (e.key === 'u' || e.key === 'U') { e.preventDefault(); upload(); }
    });
    built = true;
  }
  function enter() {
    if (!built) build();
    BLANKS.forEach(b => B(b.id));
    renderEditor(); renderStatus(); renderPanel();
    if (!$('#ideOut').textContent) out([{ c: 'g', t: '（Output 視窗：編譯和上傳的訊息會顯示在這裏）' }]);
  }
  function fillAnswers() {
    BLANKS.forEach(b => { const st = B(b.id); st.val = b.ans; });
    S.teacherUsed = true; save(); if (built) { renderEditor(); renderPanel(); }
  }
  function leave() { if (miniStop) { miniStop(); miniStop = null; } closeMenus(); }
  return { enter, leave, fillAnswers, compile, checkAnswers };
})();
stageInit.code = () => IDE.enter();
