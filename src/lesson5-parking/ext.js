/* =====================================================================
   延伸挑戰、互動模擬（停車場閘門、管理員按鈕、Serial Monitor）
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
const GARBLE = '⸮⸮⸮⸮⸮xf~àÿ⸮';
const garble = () => Array.from({ length: 3 + Math.floor(Math.random() * 6) }, () => GARBLE[Math.floor(Math.random() * GARBLE.length)]).join('');

/* controls under the circuit: the parking-lot scene, car controls, reading, serial monitor */
function gatePanelHTML(mode) {
  return `<div class="night-panel${mode === 'c2' ? ' solo-wide' : ''}">
    <div class="np-ctl">
      <div class="gate-big">${gateSceneSVG('resScene-' + mode)}</div>
      <div class="row small" style="gap:6px"><button class="btn go sm np-drive">駛入一架車</button>${mode === 'c1' ? '<button class="btn sm np-admin">按下管理員按鈕</button>' : ''}</div>
      <label class="small">或者拉動滑桿，自己移動車輛：</label>
      <input type="range" class="dark-slider np-car" min="0" max="100" value="0" aria-label="車輛位置">
      <div class="readout">A0 讀數 <b class="np-val"></b>　<span class="small muted">伺服馬達角度 <b class="np-ang">0</b>°</span></div>
      <div class="np-gauge">${gaugeHTML(LIGHT.base(LIGHT.ROOM_AT), 700)}</div>
      <div class="phase np-state"></div>
    </div>
    ${mode === 'c2' ? '' : monitorHTML()}
  </div>`;
}
/* wires the panel to the gate program; returns {stop} */
function gatePanelSim(root, mode, thr) {
  const q = s => $(s, root);
  const outEl = q('.smon-out'), baudSel = q('.smon-baud'), lines = [];
  const note = () => {
    const nt = q('.smon-note'); if (!nt) return;
    nt.innerHTML = S.up.baud === 9600 ? '' : alertBox('warn', `<b>看到亂碼 ⸮⸮⸮？</b>Serial Monitor 現在是 <b>${S.up.baud} baud</b>，但程式寫 <code>Serial.begin(9600)</code>。請改為 <b>9600 baud</b>。`);
  };
  if (baudSel) { baudSel.value = String(S.up.baud || 9600); baudSel.onchange = () => { S.up.baud = +baudSel.value; save(); lines.length = 0; note(); }; note(); }
  let n = 0;
  const sim = gateSim({ mode, thr, root, scene: q('.gate-big svg'), carSlider: q('.np-car'),
    onPrint: val => {
      if (!outEl || n++ % 2) return;
      lines.push(S.up.baud === 9600 ? String(val) : garble());
      if (lines.length > 40) lines.shift();
      outEl.textContent = lines.join('\n'); outEl.scrollTop = outEl.scrollHeight;
    },
    onState: st => {
      q('.np-val').textContent = st.val; q('.np-ang').textContent = Math.round(st.angle);
      const g = q('.np-gauge'); setGauge(g, st.val);
      const th = $('.gthr', g); if (th) { th.style.left = (thr / 1023 * 100) + '%'; $('span', th).textContent = '門檻 ' + thr; }
      q('.np-state').innerHTML = gateStateText(st, thr);
    } });
  q('.np-drive').onclick = () => sim.drive();
  const ad = q('.np-admin');
  if (ad) ad.onclick = () => sim.admin();
  $$('.btnpart', root).forEach(b => b.addEventListener('click', () => sim.admin()));
  return sim;
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
    c1: { n: 1, title: '管理員按鈕', desc: '加一個按鈕：有車，<b>或者</b>管理員按下按鈕，都會開閘。重溫第 3 堂的按鈕和下拉電阻，學習「或者」<code>||</code>。',
      hw: '硬件：加入按鈕和 10kΩ 下拉電阻（D2）', code: '程式：完成 5 個空格（||、digitalRead）', score: '評分：接線 4 分、程式 4 分、上傳 2 分。',
      real: ['保留閘門電路，<b>先拔走 USB 線</b>。', '把按鈕插到麵包板，跨過中間的坑，腳向上下。', '紅色短線：按鈕左邊 → 「+」電源軌；藍色線：D2 → 按鈕右邊。', '10kΩ：一端和 D2 同一直行，另一端接「−」電源軌。', '插回 USB 線，把程式貼到 Arduino IDE，然後上傳。', '不用車，按一下按鈕，閘門應該升起 3 秒。'] },
    c2: { n: 2, title: '慢慢開閘', desc: '不用加零件：真的閘門不會「啪」一聲升起。用 <code>for</code> 迴圈令閘門每次只轉 1°，慢慢升起，再慢慢落下。',
      hw: null, code: '程式：完成 5 個空格（for 迴圈、angle）', score: '評分：程式 8 分、上傳 2 分。',
      real: ['保留閘門電路，不用改動。', '把程式貼到 Arduino IDE，然後上傳。', '遮住光感應器，閘門應該用大約 2 秒慢慢升起，3 秒後再慢慢落下。'] },
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
      title: c1 ? (fresh ? '上傳成功！試按管理員按鈕' : '管理員按鈕') : (fresh ? '上傳成功！看閘門慢慢升起' : '慢慢開閘'),
      wide: true, dismissable: false,
      html: `<div class="sos-stage">${c1 ? HW.circuitSVG(S.hw, S.ext.c1.hw, { clickable: true }) : HW.circuitSVG(S.hw)}</div>${gatePanelHTML(which)}
        <p class="small muted" style="margin-top:8px">${c1 ? '沒有車時按一下按鈕（或者直接按模擬器上的紅色按鈕），閘門也會升起：<code>val &gt; threshold || digitalRead(buttonPin) == HIGH</code>。' : 'for 迴圈每次轉 1°、等 20 毫秒：90 × 20 = 1800 毫秒，閘門用大約 1.8 秒升起。'}</p>`,
      actions: [toExt],
      onOpen: back => { const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = gatePanelSim(back, which, 700); },
    });
  }
  return { render, showResult, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
