/* =====================================================================
   延伸挑戰、互動模擬（光暗滑桿、電位器、Serial Monitor）
   ===================================================================== */
/* this lesson has no sound; upload() still calls SOUND.unlock() */
const SOUND = { unlock() {}, stop() {} };

/* LEDs inside a circuit drawing */
function setLedIn(root, color, on) { setLedLevel(root, color, on ? 1 : 0); }
function setLedLevel(root, color, k) {
  $$(`[data-led="${color}"]`, root).forEach(g => {
    const gl = $('.ledglow', g), b = $('.ledbody', g);
    gl && gl.setAttribute('opacity', Math.max(0, Math.min(1, k)));
    b && b.setAttribute('fill', k > 0.04 ? b.dataset.on : b.dataset.off);
  });
}
const BAUDS = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000];
function monitorHTML() {
  return `<div class="smon">
    <div class="smon-tabs"><span>Output</span><span class="on">Serial Monitor <i>×</i></span></div>
    <div class="smon-bar"><input disabled placeholder="Message (Enter to send message to 'Arduino Uno' on '${esc(S.up.com)}')"><select disabled aria-label="行尾"><option>New Line</option></select>
      <select class="smon-baud" aria-label="通訊速度">${BAUDS.map(b => `<option value="${b}">${b} baud</option>`).join('')}</select></div>
    <pre class="smon-out" aria-live="off"></pre>
    <div class="smon-note"></div>
  </div>`;
}
/* controls under the circuit: darkness slider (+ knob for challenge 1), reading, scale, serial monitor */
function nightPanelHTML(mode) {
  return `<div class="night-panel${mode === 'c2' ? ' solo' : ''}">
    <div class="np-ctl">
      <label class="small">環境：<b class="np-label"></b></label>
      <input type="range" class="dark-slider np-dark" min="0" max="100" value="${LIGHT.ROOM_AT}" aria-label="環境光暗">
      <div class="row small" style="gap:6px"><button class="chip" data-dk="0">電筒照住</button><button class="chip" data-dk="${LIGHT.ROOM_AT}">課室燈光</button><button class="chip" data-dk="100">用手遮住</button></div>
      ${mode === 'c1' ? `<label class="small" style="margin-top:6px">電位器旋鈕（門檻值 <b class="np-thrv"></b>）</label><input type="range" class="knob-slider np-knob" min="0" max="100" value="60" aria-label="電位器旋鈕">` : ''}
      <div class="readout">A0 讀數 <b class="np-val"></b>${mode === 'c2' ? ' → 亮度 <b class="np-level"></b> / 255' : ''}</div>
      <div class="np-gauge">${gaugeHTML(LIGHT.base(LIGHT.ROOM_AT), mode === 'c2' ? null : 700)}</div>
      <div class="phase np-state"></div>
    </div>
    ${mode === 'c2' ? '' : monitorHTML()}
  </div>`;
}
const GARBLE = '⸮⸮⸮⸮⸮xf~àÿ⸮';
const garble = () => Array.from({ length: 3 + Math.floor(Math.random() * 6) }, () => GARBLE[Math.floor(Math.random() * GARBLE.length)]).join('');
/* the finished program running on the simulated board */
function nightSim(root, o = {}) {
  let dark = LIGHT.ROOM_AT, knob = 60, n = 0, stopped = false;
  const q = s => $(s, root);
  const thrOf = () => o.mode === 'c1' ? Math.round(knob * 1023 / 100) : o.thr;
  const outEl = q('.smon-out'), baudSel = q('.smon-baud'), lines = [];
  const note = () => {
    const nt = q('.smon-note'); if (!nt) return;
    nt.innerHTML = S.up.baud === 9600
      ? alertBox('ok', '速度 <b>9600 baud</b> 和程式的 <code>Serial.begin(9600)</code> 一樣，讀數正常。')
      : alertBox('warn', `<b>看到亂碼 ⸮⸮⸮？</b>Serial Monitor 現在是 <b>${S.up.baud} baud</b>，但程式寫 <code>Serial.begin(9600)</code>。兩邊速度不同，電腦就會「聽錯」。請把右邊的速度改為 <b>9600 baud</b>。`);
  };
  if (baudSel) {
    baudSel.value = String(S.up.baud);
    baudSel.onchange = () => {
      S.up.baud = +baudSel.value;
      if (S.up.baud === 9600 && !S.up.monitorOk) { S.up.monitorOk = true; pushLog(S.up, 'Serial Monitor 速度改為 9600 baud（讀數正常）'); toast('速度正確，讀數正常了！', 'ok'); }
      save(); lines.length = 0; note(); o.onBaud && o.onBaud();
    };
    note();
  }
  const darkSl = q('.np-dark'), knobSl = q('.np-knob');
  if (darkSl) darkSl.oninput = () => { dark = +darkSl.value; };
  $$('[data-dk]', root).forEach(b => b.onclick = () => { dark = +b.dataset.dk; darkSl.value = dark; });
  if (knobSl) knobSl.oninput = () => { knob = +knobSl.value; };
  function tick() {
    if (stopped) return;
    const val = LIGHT.read(dark), thr = thrOf();
    $$('.lsshade', root).forEach(g => g.setAttribute('opacity', Math.max(0, (dark - 45) / 55 * 0.95).toFixed(2)));
    $$('.potknob', root).forEach(g => g.setAttribute('transform', `rotate(${-135 + 270 * knob / 100} ${g.dataset.cx} ${g.dataset.cy})`));
    q('.np-label').textContent = LIGHT.label(dark);
    q('.np-val').textContent = val;
    const g = q('.np-gauge'); setGauge(g, val);
    let state = '';
    if (o.mode === 'c2') {
      const level = Math.round(val * 255 / 1023);
      setLedLevel(root, 'yellow', 0.08 + 0.92 * level / 255);
      q('.np-level').textContent = level;
      state = `map(${val}, 0, 1023, 0, 255) = ${level}：${level < 80 ? 'LED 很暗' : level < 180 ? 'LED 半亮' : 'LED 很亮'}`;
    } else {
      const on = val > thr;
      setLedIn(root, 'yellow', on);
      const th = $('.gthr', g); if (th) { th.style.left = (thr / 1023 * 100) + '%'; $('span', th).textContent = '門檻 ' + thr; }
      if (q('.np-thrv')) q('.np-thrv').textContent = thr;
      state = on ? `${val} > ${thr}：天黑，<span style="color:var(--amber)">開燈</span>` : `${val} 不大過 ${thr}：關燈`;
    }
    q('.np-state').innerHTML = state;
    if (outEl && n % 2 === 0) {
      lines.push(S.up.baud === 9600 ? (o.mode === 'c1' ? `${val} ${thr}` : String(val)) : garble());
      if (lines.length > 40) lines.shift();
      outEl.textContent = lines.join('\n'); outEl.scrollTop = outEl.scrollHeight;
    }
    n++;
    setTimeout(tick, 160);
  }
  tick();
  return { stop: () => { stopped = true; } };
}

const EXT = (() => {
  const answered = (tpl, bls) => tpl.map(l => l.replace(/\{\{(e\d)\}\}/g, (_, id) => bls.find(b => b.id === id).ans)).join('\n');
  const c1Code = () => answered(C1_TEMPLATE, C1_BLANKS);
  const c2Code = () => answered(C2_TEMPLATE, C2_BLANKS);
  function status(x) {
    if (x.done) return '<span class="pill ok">已完成</span>';
    const started = x.hw.parts.length || x.hw.wires.length || Object.values(x.code.blanks || {}).some(b => b.val);
    return started ? '<span class="pill warn">進行中</span>' : '<span class="pill">未開始</span>';
  }
  const tick = (ok, label) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${label}</span></li>`;
  const CARDS = {
    c1: { n: 1, title: '調校靈敏度（電位器）', desc: '加一個電位器：轉動旋鈕就可以改變門檻值，就像真的夜燈上的「靈敏度」旋鈕。學習用 <code>Serial.print</code> 在同一行顯示兩個數字。',
      hw: '硬件：加入電位器（中間腳接 A1）', code: '程式：完成 5 個空格（analogRead、print / println）', score: '評分：接線 4 分、程式 4 分、上傳 2 分。',
      real: ['保留夜燈電路，<b>先拔走 USB 線</b>。', '把電位器插到麵包板，<b>跨過中間的坑</b>：兩隻外腳在上面，中間腳在下面。', '紅色短線：一隻外腳 → 「+」電源軌；黑色短線：另一隻外腳 → 「−」電源軌。', '白色線：A1 → 電位器中間腳的直行。', '插回 USB 線，把程式貼到 Arduino IDE，上傳，再打開 Serial Monitor（9600 baud）。', '轉動旋鈕，第二個數字（門檻值）會改變。調到剛好大過課室燈光的讀數，用手遮住時 LED 就會亮。'] },
    c2: { n: 2, title: '越暗越亮', desc: '不用加零件：天越暗，LED 越亮。學習用 <code>map()</code> 轉換數值範圍，再用 <code>analogWrite()</code> 調校亮度。',
      hw: null, code: '程式：完成 5 個空格（map、analogWrite）', score: '評分：程式 8 分、上傳 2 分。',
      real: ['保留夜燈電路，不用改動。', '把程式貼到 Arduino IDE，然後上傳。', '用手<b>慢慢</b>遮住光感應器，LED 應該慢慢變亮；用電筒照住，LED 會變得很暗。'] },
  };
  function card(k) {
    const x = S.ext[k], c = CARDS[k], sc = extScores()[k];
    const next = k === 'c2' || x.hw.done ? k + 'code' : k + 'hw';
    return `<article class="card ext-card">
      <div class="ext-top"><div class="ext-num">${c.n}</div><div><h3>${c.title}</h3><p class="muted small">${c.desc}</p></div>${status(x)}</div>
      <details class="fold ext-mat"><summary>需要的材料（實物）</summary>${KIT.table(MATERIALS[k])}</details>
      <ul class="ext-prog">${c.hw ? tick(x.hw.done, c.hw) : ''}${tick(x.code.done, c.code)}${tick(x.flow.uploaded, '驗證及上傳')}${tick(x.confirmed, '老師確認實物成功')}</ul>
      ${sc ? `<p class="ext-score"><b>${sc.total}</b> / 10　<span class="small muted">${c.hw ? `接線 ${sc.hw}/4 · 程式 ${sc.code}/4` : `程式 ${sc.code}/8`} · 上傳 ${sc.up}/2</span></p>` : `<p class="small muted">${c.score}</p>`}
      <div class="row">${x.done ? `<button class="btn" data-replay="${k}">再試一次模擬</button>` : `<button class="btn go" data-go="${next}">${status(x).includes('未開始') ? '開始挑戰 ' + c.n : '繼續挑戰 ' + c.n}</button>`}</div>
      ${x.done ? `<details class="fold ext-real" ${x.confirmed ? '' : 'open'}><summary>在真的 UNO 上做一次</summary>
        <ol class="goals small">${c.real.map(r => `<li>${r}</li>`).join('')}</ol>
        <div class="row"><button class="btn sm primary" data-copy="${k}">複製完整程式</button><span class="small muted" data-copymsg="${k}"></span></div>
        ${x.confirmed ? alertBox('ok', '老師已確認實物成功。') : `<button class="btn sm teal" data-confirm="${k}">老師確認實物成功</button>`}
      </details>` : ''}
    </article>`;
  }
  function render() {
    const sec = $('#st-ext');
    sec.innerHTML = `<div class="ext-wrap">
      <div class="intro-head">
        <div><div class="eyebrow">第 5 步 · 選做</div><h2>延伸挑戰</h2>
        <p>做得快？試試這兩個挑戰，可以任選一個先做。每個挑戰 10 分，會另外列在成績報告上，<b>不計入 100 分總分</b>。</p></div>
      </div>
      <div class="ext-grid">${card('c1')}${card('c2')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:18px"><span class="small muted">延伸挑戰可以隨時回來做。完成後重新下載報告，分數就會更新。</span><button class="btn go lg" id="extReport">產生成績報告</button></div>
    </div>`;
    $$('[data-go]', sec).forEach(b => b.onclick = () => goStage(b.dataset.go));
    $$('[data-replay]', sec).forEach(b => b.onclick = () => showResult(b.dataset.replay, false));
    $$('[data-copy]', sec).forEach(b => b.onclick = () => copyCode(b.dataset.copy));
    $$('[data-confirm]', sec).forEach(b => b.onclick = () => askPassword('老師確認實物成功', () => {
      S.ext[b.dataset.confirm].confirmed = true; S.ext[b.dataset.confirm].confirmedAt = now(); save(); render(); toast('已確認實物成功', 'ok');
    }));
    $('#extReport').onclick = () => { unlock('report'); goStage('report'); };
  }
  async function copyCode(which) {
    const code = which === 'c1' ? c1Code() : c2Code();
    const msg = $(`[data-copymsg="${which}"]`);
    try { await navigator.clipboard.writeText(code); msg.textContent = '已複製，可以貼到 Arduino IDE。'; }
    catch (e) {
      modal({ title: '複製程式', html: `<p class="small muted">請按 Ctrl+C 複製。</p><textarea id="cpTa" readonly style="width:100%;height:260px;font-family:var(--f-mono);font-size:12px;margin-top:8px;border:1px solid var(--line);border-radius:6px;padding:8px;background:var(--surface-2);color:var(--ink)">${esc(code)}</textarea>`, onOpen: back => { const t = $('#cpTa', back); t.focus(); t.select(); } });
    }
  }
  function showResult(which, fresh) {
    let sim = null;
    const toExt = { label: '返回延伸挑戰', kind: 'go', onClick: () => { sim && sim.stop(); if (S.stage !== 'ext') goStage('ext'); else render(); } };
    const c1 = which === 'c1';
    modal({
      title: c1 ? (fresh ? '上傳成功！轉動電位器試試' : '調校靈敏度') : (fresh ? '上傳成功！試試把環境變暗' : '越暗越亮'),
      wide: true, dismissable: false,
      html: `<div class="sos-stage">${c1 ? HW.circuitSVG(S.hw, S.ext.c1.hw) : HW.circuitSVG(S.hw)}</div>${nightPanelHTML(which)}
        <p class="small muted" style="margin-top:8px">${c1 ? '電位器的讀數（0 至 1023）就是門檻值。旋鈕轉得越大，要越暗才會開燈。' : 'analogWrite 令 D9極快地開關，開的時間越長，LED 看起來越亮。'}</p>`,
      actions: [toExt],
      onOpen: back => { const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = nightSim(back, { mode: which }); },
    });
  }
  return { render, showResult, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
