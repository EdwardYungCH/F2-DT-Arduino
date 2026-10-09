/* =====================================================================
   編程輔助（各堂共用）：指令小字典、程式內指令解釋、空格說明卡
   - HELP.setLesson(n)：本堂是第幾堂（決定「以前學過」的範圍）
   - HELP.hl(line)：語法顏色 + 可查字典的指令（data-k）
   - HELP.mount()：IDE 左側「字典」按鈕、字典欄、指令解釋小框
   - HELP.setCtx(C)：切換主任務 / 延伸挑戰時更新字典內容（C.dict = 字典 key）
   - HELP.showCard(input, blank, state, C)：在空格下方顯示說明卡
   ===================================================================== */
const HELP = (() => {
  /* k: key · w: 程式內可查的字 · sig: 寫法 · d: 解釋 · eg: 例子 · L: 第幾堂學 · x: 只在延伸挑戰 · only: 只屬於某一堂 · cat: err = 錯誤訊息 */
  const E = [
    { k: 'setup', w: ['setup'], sig: 'void setup() { … }', d: '開機時只做一次，用來做設定', eg: 'void setup() { pinMode(13, OUTPUT); }', L: 1 },
    { k: 'loop', w: ['loop'], sig: 'void loop() { … }', d: '做完最後一行，就由頭再做，不停重複', eg: 'void loop() { digitalWrite(13, HIGH); … }', L: 1 },
    { k: 'pinMode', w: ['pinMode'], sig: 'pinMode(腳, 模式)', d: '設定腳位是 OUTPUT（輸出）還是 INPUT（輸入）', eg: 'pinMode(13, OUTPUT);', L: 1 },
    { k: 'OUTPUT', w: ['OUTPUT'], sig: 'OUTPUT', d: '輸出模式：Arduino 送出電，例如開關 LED（全部大寫）', eg: 'pinMode(13, OUTPUT);', L: 1 },
    { k: 'digitalWrite', w: ['digitalWrite'], sig: 'digitalWrite(腳, 狀態)', d: '令腳位輸出 HIGH（5V，開）或 LOW（0V，關）', eg: 'digitalWrite(13, HIGH);', L: 1 },
    { k: 'HIGH', w: ['HIGH'], sig: 'HIGH', d: '高電位 5V：開（全部大寫）', eg: 'digitalWrite(13, HIGH);', L: 1 },
    { k: 'LOW', w: ['LOW'], sig: 'LOW', d: '低電位 0V：關（全部大寫）', eg: 'digitalWrite(13, LOW);', L: 1 },
    { k: 'delay', w: ['delay'], sig: 'delay(毫秒)', d: '暫停一段時間。單位是毫秒：1000 毫秒 = 1 秒', eg: 'delay(500);   // 等 0.5 秒', L: 1 },
    { k: 'semi', sig: ';', d: '每個指令最後都要有分號（半形）', eg: 'delay(1000);', L: 1 },
    { k: 'comment', sig: '// 註解', d: '雙斜線後面的灰色文字是寫給人看的說明，Arduino 不會執行', eg: 'delay(1000);   // 等 1 秒', L: 1 },
    { k: 'e-undecl', cat: 'err', sig: "'…' was not declared in this scope", d: '編譯器不認識這個字：多數是串錯字或大小寫不對', eg: "'digitalwrite' was not declared", L: 1 },
    { k: 'e-sugg', cat: 'err', sig: 'suggested alternative', d: '編譯器估你想寫的字', eg: "note: suggested alternative: 'digitalWrite'", L: 1 },
    { k: 'e-semi', cat: 'err', sig: "expected ';' before …", d: '上一句的句尾少了分號 ;', eg: "expected ';' before 'delay'", L: 1 },
    { k: 'e-stray', cat: 'err', sig: "stray '\\357' in program", d: '程式裏有中文或全形字，例如全形分號 ；', eg: "stray '\\357' in program", L: 1 },
    { k: 'e-pos', cat: 'err', sig: 'Blink:10:27', d: '錯誤位置：冒號前是行號，後面是第幾個字（列）', eg: '第 10 行第 27 個字', L: 1 },

    { k: 'int', w: ['int'], sig: 'int 名稱 = 數值;', d: '建立變數（整數），用一個名稱記住一個數字', eg: 'int ledPin = 13;', L: 2 },
    { k: 'tone', w: ['tone'], sig: 'tone(腳, 頻率)', d: '蜂鳴器發出該頻率的聲音；頻率愈高，聲音愈尖', eg: 'tone(8, 1000);', L: 2, x: 1 },
    { k: 'noTone', w: ['noTone'], sig: 'noTone(腳)', d: '停止那支腳的聲音', eg: 'noTone(8);', L: 2, x: 1 },
    { k: 'func', sig: 'void 名稱() { … }', d: '自訂函數：把幾行包起來，之後寫 名稱(); 就會執行那幾行', eg: 'void dot() { … }   →   dot();', L: 2, x: 1 },
    { k: 'dot', w: ['dot'], sig: 'dot();', d: '短閃一下（·）', eg: 'dot();', L: 2, x: 1, only: 2 },
    { k: 'dash', w: ['dash'], sig: 'dash();', d: '長閃一下（–）', eg: 'dash();', L: 2, x: 1, only: 2 },
    { k: 'letterGap', w: ['letterGap'], sig: 'letterGap();', d: '字母之間多停一會，令人分得出下一個字母', eg: 'letterGap();', L: 2, x: 1, only: 2 },

    { k: 'INPUT', w: ['INPUT'], sig: 'INPUT', d: '輸入模式：Arduino 讀取，例如按鈕（全部大寫）', eg: 'pinMode(2, INPUT);', L: 3 },
    { k: 'digitalRead', w: ['digitalRead'], sig: 'digitalRead(腳)', d: '讀取腳位：有 5V 得到 HIGH，0V 得到 LOW', eg: 'int s = digitalRead(2);', L: 3 },
    { k: 'if', w: ['if'], sig: 'if (條件) { … }', d: '如果條件成立，就做 { } 內的程式', eg: 'if (digitalRead(2) == HIGH) { … }', L: 3 },
    { k: 'else', w: ['else'], sig: 'else { … }', d: '否則（條件不成立）就做這裏的程式', eg: '} else { digitalWrite(13, LOW); }', L: 3 },
    { k: 'eq', w: ['=='], sig: '==', d: '比較兩邊是否相等（兩個等號）；一個 = 是「設定」', eg: 'if (s == HIGH)', L: 3 },
    { k: 'for', w: ['for'], sig: 'for (int i = 0; i < 10; i++) { … }', d: '重複 { } 內的程式：i 由 0 開始，每次加 1，直到條件不成立', eg: 'for (int i = 0; i < 3; i++) { … }   // 做 3 次', L: 3, x: 1 },
    { k: 'inc', w: ['++'], sig: 'i++', d: '變數加 1', eg: 'i++', L: 3, x: 1 },

    { k: 'analogRead', w: ['analogRead'], sig: 'analogRead(腳)', d: '讀取類比腳（A0 至 A5）的電壓：0（0V）至 1023（5V）', eg: 'int val = analogRead(A0);', L: 4 },
    { k: 'A0', w: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], sig: 'A0 至 A5', d: '類比輸入腳，用來接感應器', eg: 'analogRead(A0)', L: 4 },
    { k: 'Serial', w: ['Serial'], sig: 'Serial', d: 'Arduino 和電腦通訊，數字會顯示在 Serial Monitor', eg: 'Serial.println(val);', L: 4 },
    { k: 'begin', w: ['begin'], sig: 'Serial.begin(速度)', d: '開始和電腦通訊；Serial Monitor 也要選同一個速度（baud）', eg: 'Serial.begin(9600);', L: 4 },
    { k: 'println', w: ['println'], sig: 'Serial.println(數值)', d: '把數值送到電腦，顯示在 Serial Monitor，然後換行', eg: 'Serial.println(val);', L: 4 },
    { k: 'gt', w: ['>', '<'], sig: '>  <', d: '> 是「大過」，< 是「小過」', eg: 'if (val > 700) { … }', L: 4 },
    { k: 'print', w: ['print'], sig: 'Serial.print(數值)', d: '顯示數值，不換行', eg: 'Serial.print(val);', L: 4, x: 1 },
    { k: 'map', w: ['map'], sig: 'map(值, 0, 1023, 0, 255)', d: '把一個範圍的數值，按比例轉換成另一個範圍', eg: 'int b = map(val, 0, 1023, 0, 255);', L: 4, x: 1 },
    { k: 'analogWrite', w: ['analogWrite'], sig: 'analogWrite(腳, 0 至 255)', d: '調校亮度：0 熄，255 最亮；只可以用在有 ~ 號的腳', eg: 'analogWrite(9, 128);', L: 4, x: 1 },

    { k: 'include', w: ['#include'], sig: '#include <檔名>', d: '載入程式庫（別人寫好的指令），檔名大小寫要完全一樣', eg: '#include <Servo.h>', L: 5 },
    { k: 'Servo', w: ['Servo'], sig: 'Servo 名稱;', d: '建立一個伺服馬達（物件），之後用「名稱.指令」控制它', eg: 'Servo gate;', L: 5 },
    { k: 'attach', w: ['attach'], sig: '名稱.attach(腳)', d: '告訴 Arduino 伺服馬達的信號線接在哪一支腳（在 setup 做一次）', eg: 'gate.attach(9);', L: 5 },
    { k: 'write', w: ['write'], sig: '名稱.write(角度)', d: '叫伺服馬達轉到 0° 至 180° 之間的角度，然後停住', eg: 'gate.write(90);', L: 5 },
    { k: 'or', w: ['||'], sig: 'A || B', d: '或者：其中一個成立就成立', eg: 'if (val > 700 || s == HIGH)', L: 5, x: 1 },
    { k: 'and', w: ['&&'], sig: 'A && B', d: '而且：兩個都要成立', eg: 'if (val > 700 && s == HIGH)', L: 5, x: 1 },
    { k: 'dec', w: ['--'], sig: 'i--', d: '變數減 1', eg: 'angle--', L: 5, x: 1 },
  ];
  const BY = {}, TOK = {};
  E.forEach(e => { BY[e.k] = e; (e.w || []).forEach(t => { TOK[t] = e.k; }); });
  let LESSON = 1, CTX = null, open = false, seen = false, mounted = false;
  const H = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const visible = e => e && !(e.only && e.only !== LESSON) && e.L <= LESSON;

  /* ---------- syntax colours + dictionary words ---------- */
  const RE = /(#include)\b|\b(void|int|if|else|for)\b|\b(pinMode|digitalWrite|digitalRead|delay|tone|noTone|analogRead|analogWrite|map|attach|write|begin|println|print|dot|dash|letterGap)\b|\b(HIGH|LOW|OUTPUT|INPUT|A[0-5])\b|\b(setup|loop|Serial|Servo)\b|\b(\d+)\b|("[^"]*")|(==|\|\||&&|\+\+|--)/g;
  function hl(text) {
    let out = '', i = 0, m;
    const ci = text.indexOf('//');
    const code = ci >= 0 ? text.slice(0, ci) : text, com = ci >= 0 ? text.slice(ci) : '';
    RE.lastIndex = 0;
    while ((m = RE.exec(code))) {
      out += H(code.slice(i, m.index));
      const cls = m[1] ? 'k-struct' : m[2] ? 'k-type' : m[3] ? 'k-fn' : m[4] ? 'k-const' : m[5] ? 'k-struct' : m[7] ? 'k-str' : m[8] ? 'k-op' : 'k-num';
      const k = TOK[m[0]];
      out += `<span class="${cls}"${k && visible(BY[k]) ? ` data-k="${k}"` : ''}>${H(m[0])}</span>`;
      i = m.index + m[0].length;
    }
    out += H(code.slice(i));
    if (com) out += `<span class="k-com">${H(com)}</span>`;
    return out;
  }

  /* ---------- what kind of answer a blank needs ---------- */
  function typeOf(b) {
    if (b.type) return b.type;
    const a = String(b.ans);
    if (b.ctx === 'include') return '程式庫的檔名（大小寫要完全一樣）';
    if (b.ctx === 'op' || b.ctx === 'incr') return '一個符號';
    if (/^\d+$/.test(a)) return '一個數字（只寫數字，不用單位）';
    if (b.ctx === 'func' || b.ctx === 'method') return '一個指令（英文，注意大小寫）';
    if (/^A[0-5]$/.test(a)) return '一個腳位名稱';
    if (b.ctx === 'mode' || b.ctx === 'level' || /^[A-Z][A-Z0-9_]+$/.test(a)) return '一個全部大寫的英文字';
    if (/^[A-Za-z_]\w*$/.test(a)) return '一個變數名稱（英文）';
    return '程式的一部分';
  }
  /* the dictionary entry that a blank's hint points to */
  function dkOf(b, tpl) {
    if (b.dk !== undefined) return b.dk;
    const shown = k => k && (keysOf(CTX).includes(k) || others(CTX).some(e => e.k === k));
    if (shown(TOK[b.ans])) return TOK[b.ans];
    const raw = (tpl[(b.line || 1) - 1] || '').replace(/\/\/.*/, '');
    const at = raw.indexOf('{{' + b.id + '}}');
    const words = [];
    const re = /#include|[A-Za-z_]\w*|==|\|\||&&|\+\+|--|[<>]/g; let m;
    const line = raw.replace(/\{\{[a-z]\d\}\}/g, s => ' '.repeat(s.length));
    while ((m = re.exec(line))) if (TOK[m[0]] && !['int', 'void', 'setup', 'loop'].includes(m[0])) words.push({ k: TOK[m[0]], d: at >= 0 && m.index < at ? at - m.index : 1000 + m.index });
    words.sort((a, c) => a.d - c.d);
    const hit = words.find(w => shown(w.k));
    if (hit) return hit.k;
    return shown('int') && /\bint\b/.test(line) ? 'int' : null;
  }
  /* ---------- dictionary content ---------- */
  const NEW = e => e.L === LESSON && !e.cat ? '<i class="dk-new">新</i>' : '';
  const item = (e, withEg) => `<div class="dk-item" id="dk-${e.k}"><code>${NEW(e)}${H(e.sig)}</code><span>${e.d}</span>${withEg && e.eg ? `<em>例子：<code>${H(e.eg)}</code></em>` : ''}</div>`;
  const keysOf = C => (C && C.dict || []).filter(k => BY[k]);
  function others(C) {
    const mine = keysOf(C);
    return E.filter(e => !mine.includes(e.k) && !(e.only && e.only !== LESSON) &&
      (e.L < LESSON || (e.L === LESSON && !e.x && C && C.name !== 'main')));
  }
  function drawerHTML() {
    const mine = keysOf(CTX).map(k => BY[k]);
    const old = others(CTX);
    const groups = {};
    old.forEach(e => { const g = e.cat === 'err' ? '看懂錯誤訊息' : `第 ${e.L} 堂`; (groups[g] = groups[g] || []).push(e); });
    return `<div class="dk-head"><b>📖 指令小字典</b><button class="dk-x" data-dk-close aria-label="關閉字典">✕</button></div>
      <div class="dk-body">
        <div class="dk-sec"><div class="dk-h">${CTX && CTX.name !== 'main' ? '這個挑戰用到的指令' : '今堂用到的指令'}</div>${mine.map(e => item(e, true)).join('') || '<p class="small muted">這部分沒有新指令。</p>'}</div>
        ${old.length ? `<details class="dk-old" id="dkOld"><summary>以前學過的其他指令（${old.length}）</summary>${Object.keys(groups).map(g => `<div class="dk-h">${g}</div>${groups[g].map(e => item(e, true)).join('')}`).join('')}</details>` : ''}
        <p class="dk-tip">💡 滑鼠停在程式中有虛線的字上（或用手指點一下），也會顯示解釋。</p>
      </div>`;
  }
  function renderDrawer() { const d = document.getElementById('ideDict'); if (d) d.innerHTML = drawerHTML(); }
  function setOpen(v) {
    open = v; const d = document.getElementById('ideDict'), b = document.getElementById('sideDict');
    if (d) d.hidden = !v;
    if (b) { b.classList.toggle('on', v); b.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    if (v) { seen = true; if (b) b.classList.remove('pulse'); }
  }
  function openDict(k) {
    setOpen(true);
    if (!k) return;
    const el = document.getElementById('dk-' + k); if (!el) return;
    const det = el.closest('details'); if (det) det.open = true;
    const box = el.closest('.dk-body');
    if (box) box.scrollTop = Math.max(0, el.offsetTop - 60);
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  /* compact list for the side panel: this part's new commands */
  function panelDict(C) {
    const mine = keysOf(C).map(k => BY[k]);
    return `<div class="pdict"><div class="pdict-h"><b>📖 指令小字典</b><button class="linkbtn" data-dk-open>${others(C).length ? '看全部（包括以前學過）' : '看例子'}</button></div><div class="dict">${mine.map(e => `<div><code>${NEW(e)}${H(e.sig)}</code><span>${e.d}</span></div>`).join('')}</div></div>`;
  }

  /* ---------- tooltip on dictionary words ---------- */
  let tip = null, tipFor = null;
  function showTip(el) {
    const e = BY[el.dataset.k]; if (!e) return;
    if (!tip) { tip = document.createElement('div'); tip.className = 'dk-tipbox'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip); }
    tip.innerHTML = `<code>${H(e.sig)}</code><span>${e.d}</span>${e.eg ? `<em>例子：<code>${H(e.eg)}</code></em>` : ''}`;
    tip.style.display = 'block';
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = Math.min(Math.max(8, r.left), window.innerWidth - w - 8), y = r.bottom + 6;
    if (y + h > window.innerHeight - 8) y = r.top - h - 6;
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; tipFor = el;
  }
  function hideTip() { if (tip) tip.style.display = 'none'; tipFor = null; }

  /* ---------- mount once (IDE side bar, drawer, events) ---------- */
  function mount() {
    if (mounted) return; mounted = true;
    const side = document.querySelector('.ide-side'), body = document.querySelector('.ide-body');
    if (side && body) {
      side.removeAttribute('aria-hidden');
      const icons = side.querySelectorAll('svg'); icons.forEach(s => s.setAttribute('aria-hidden', 'true'));
      const btn = document.createElement('button');
      btn.className = 'side-dict pulse'; btn.id = 'sideDict'; btn.type = 'button'; btn.title = '指令小字典'; btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/></svg><span>字典</span>';
      if (icons[2]) icons[2].replaceWith(btn); else side.appendChild(btn);
      btn.addEventListener('click', () => setOpen(!open));
      const d = document.createElement('div'); d.className = 'ide-dict'; d.id = 'ideDict'; d.hidden = true;
      body.insertBefore(d, side.nextSibling);
    }
    document.addEventListener('click', ev => {
      const t = ev.target;
      if (t.closest('[data-dk-close]')) { setOpen(false); return; }
      const o = t.closest('[data-dk-open]'); if (o) { openDict(o.dataset.dkOpen || ''); return; }
      const g = t.closest('[data-dk]'); if (g) { openDict(g.dataset.dk); return; }
      const w = t.closest('#editor [data-k]');
      if (w) { showTip(w); return; }
      if (tip && !t.closest('.dk-tipbox')) hideTip();
    });
    document.addEventListener('mouseover', ev => { const w = ev.target.closest && ev.target.closest('#editor [data-k]'); if (w) showTip(w); });
    document.addEventListener('mouseout', ev => { const w = ev.target.closest && ev.target.closest('#editor [data-k]'); if (w && !(ev.relatedTarget && w.contains(ev.relatedTarget))) hideTip(); });
    document.addEventListener('scroll', hideTip, true);
  }
  function setCtx(C) { CTX = C; mount(); renderDrawer(); setOpen(open); hideTip(); if (!seen) { const b = document.getElementById('sideDict'); if (b) b.classList.add('pulse'); } }

  /* ---------- explanation card under a blank ---------- */
  /* st: blank state {status, revealed, wrong, hinted, fb} · opts: {cost, revAt} */
  function cardHTML(b, st, C, opts = {}) {
    const n = b.id.slice(1), dk = dkOf(b, C.tpl);
    if (st.status === 'ok' || st.revealed) return `<div class="bc-top"><span class="bc-n ok">${n}</span><b>${b.ask}</b><span class="pill ok">${st.revealed ? '已顯示答案' : '正確'}</span><button class="bc-x" data-bc-close aria-label="關閉">✕</button></div>`;
    let h = `<div class="bc-top"><span class="bc-n">${n}</span><b>${b.ask}</b><button class="bc-x" data-bc-close aria-label="關閉">✕</button></div>
      <div class="bc-type">要填：<b>${typeOf(b)}</b></div>`;
    if (st.status === 'bad' && st.fb) h += `<div class="bc-fb">${st.fb}</div>`;
    if (st.hinted) h += `<div class="bc-hint">💡 提示：${b.hint}${dk ? ` <button class="linkbtn" data-dk="${dk}">看字典</button>` : ''}</div>`;
    const acts = [];
    if (!st.hinted) acts.push(`<button class="btn sm ghost bc-hb${(st.wrong || 0) >= 2 ? ' pulse' : ''}" data-hint="${b.id}">💡 提示（${opts.cost || '扣 1 分'}）</button>`);
    if ((st.wrong || 0) >= (opts.revAt || 3)) acts.push(`<button class="btn sm ghost" data-rev="${b.id}">顯示答案</button>`);
    if (!st.hinted) acts.push(`<button class="linkbtn" data-dk-open>打開字典</button>`);
    if (acts.length) h += `<div class="bc-acts">${acts.join('')}</div>`;
    return h;
  }
  function showCard(inp, b, st, C, opts) {
    hideCard();
    const line = inp.closest('.cl'); if (!line) return null;
    const row = document.createElement('div'); row.className = 'bcard-row'; row.dataset.for = b.id;
    row.innerHTML = `<div class="bcard" role="note">${cardHTML(b, st, C, opts)}</div>`;
    line.after(row);
    const x = row.querySelector('[data-bc-close]'); if (x) x.onclick = e => { e.stopPropagation(); hideCard(); };
    return row;
  }
  function hideCard() { document.querySelectorAll('.bcard-row').forEach(r => r.remove()); }

  return { setLesson: n => { LESSON = n; }, hl, mount, setCtx, openDict, panelDict, typeOf, dkOf, showCard, hideCard, cardHTML, entry: k => BY[k], ENTRIES: E };
})();
