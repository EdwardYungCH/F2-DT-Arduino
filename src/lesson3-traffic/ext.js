/* =====================================================================
   延伸挑戰、聲音、互動模擬（按鈕 / 傾斜開關）
   ===================================================================== */
const SOUND = (() => {
  const KEY = 'trafficLab.muted';
  let ctx = null, osc = null;
  let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
  function unlock() {
    try {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  function start(freq) {
    stop();
    if (muted || !ctx) return;
    try {
      osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq; g.gain.value = 0.03;
      osc.connect(g); g.connect(ctx.destination); osc.start();
    } catch (e) { osc = null; }
  }
  function stop() { try { if (osc) { osc.stop(); osc.disconnect(); } } catch (e) {} osc = null; }
  function setMuted(v) { muted = v; try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} if (v) stop(); }
  return { unlock, start, stop, setMuted, isMuted: () => muted };
})();
function muteBtnHTML() { return `<button class="btn sm mute-btn" data-mute>${SOUND.isMuted() ? '聲音：已靜音' : '聲音：開（音量較低）'}</button>`; }
function bindMute(root = document) {
  $$('[data-mute]', root).forEach(b => b.onclick = () => {
    SOUND.unlock(); SOUND.setMuted(!SOUND.isMuted());
    $$('[data-mute]').forEach(x => x.textContent = SOUND.isMuted() ? '聲音：已靜音' : '聲音：開（音量較低）');
  });
}

/* LEDs inside a circuit drawing */
function setLedIn(root, color, on) {
  $$(`[data-led="${color}"]`, root).forEach(g => {
    const gl = $('.ledglow', g), b = $('.ledbody', g);
    gl && gl.setAttribute('opacity', on ? 1 : 0);
    b && b.setAttribute('fill', on ? b.dataset.on : b.dataset.off);
  });
}
/* the finished traffic-light program, driven by the on-screen button */
function trafficSim(root, o = {}) {
  let timers = [], running = false, stopped = false;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const waves = $$('.pzwaves', root);
  const show = st => {
    setLedIn(root, 'red', st === 'R' || st === 'RY'); setLedIn(root, 'yellow', st === 'Y' || st === 'RY'); setLedIn(root, 'green', st === 'G');
    if (o.light) setTraffic(o.light.querySelector('.tlight'), st);
  };
  const beep = on => { waves.forEach(w => w.setAttribute('opacity', on ? 1 : 0)); if (on) SOUND.start(2000); else SOUND.stop(); };
  function idle() { running = false; show('G'); if (o.phase) o.phase.textContent = '平時：綠燈（等人按掣）'; if (o.pressBtn) o.pressBtn.disabled = false; }
  function press() {
    if (running || stopped) return;
    running = true; SOUND.unlock();
    if (o.pressBtn) o.pressBtn.disabled = true;
    $$('.btncap', root).forEach(c => { c.setAttribute('r', 9); c.setAttribute('fill', '#8E1B12'); });
    later(300, () => $$('.btncap', root).forEach(c => { c.setAttribute('r', 10.5); c.setAttribute('fill', '#C9352A'); }));
    let t = 0;
    AFTER_PRESS.forEach(([st, ms, label]) => {
      later(t, () => { show(st); if (o.phase) o.phase.textContent = label + (st === 'R' && o.beep ? '（嘀嘀嘀…）' : ''); });
      if (st === 'R' && o.beep) for (let k = 0; k < 10; k++) { later(t + k * 500, () => beep(true)); later(t + k * 500 + 100, () => beep(false)); }
      t += ms;
    });
    later(t, idle);
  }
  $$('.btnpart', root).forEach(b => b.addEventListener('click', press));
  if (o.pressBtn) o.pressBtn.onclick = press;
  idle();
  return { press, stop: () => { stopped = true; timers.forEach(clearTimeout); SOUND.stop(); } };
}
/* bike alarm: shake → tilt switch opens → red LED flashes 20 times */
function tiltSim(root, o = {}) {
  let timers = [], running = false, stopped = false;
  const later = (ms, f) => timers.push(setTimeout(f, ms));
  const body = $$('.tiltbody', root);
  const tilt = on => body.forEach(g => {
    const tr = g.getAttribute('transform').replace(/rotate\(([-\d.]+)/, `rotate(${on ? 35 : 0}`); g.setAttribute('transform', tr);
    const ball = g.querySelector('circle'); if (ball) { const top = +g.querySelector('rect').getAttribute('y'); ball.setAttribute('cy', top + (on ? 8 : 22)); }
  });
  function idle() { running = false; tilt(false); setLedIn(root, 'red', false); if (o.phase) o.phase.textContent = '單車停定：開關接通（HIGH），沒有警報'; if (o.shakeBtn) o.shakeBtn.disabled = false; }
  function shake() {
    if (running || stopped) return;
    running = true; if (o.shakeBtn) o.shakeBtn.disabled = true;
    tilt(true); if (o.phase) o.phase.textContent = '單車被移動！開關斷開（LOW）→ 警報';
    for (let k = 0; k < 20; k++) { later(k * 200, () => setLedIn(root, 'red', true)); later(k * 200 + 100, () => setLedIn(root, 'red', false)); }
    later(900, () => tilt(false));
    later(4000, idle);
  }
  $$('.tiltpart', root).forEach(t => { t.style.cursor = 'pointer'; t.addEventListener('click', shake); });
  if (o.shakeBtn) o.shakeBtn.onclick = shake;
  ['green', 'yellow'].forEach(c => setLedIn(root, c, false));
  idle();
  return { stop: () => { stopped = true; timers.forEach(clearTimeout); } };
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
    c1: { n: 1, title: '過路「嘀嘀」聲', desc: '加一個蜂鳴器：紅燈（行人過路）時急速「嘀嘀」響，就像香港真的過路燈。學習用 <code>for</code> 迴圈重複發聲。',
      hw: '硬件：加入蜂鳴器（D8 → 蜂鳴器 → GND）', code: '程式：完成 5 個空格（for 迴圈、tone）',
      real: ['保留過路燈電路，<b>先拔走 USB 線</b>。', '把蜂鳴器插到麵包板下半部，兩隻腳在不同號碼的直行。', '白色線：D8 → 蜂鳴器一隻腳；黑色線：GND → 蜂鳴器另一隻腳。', '插回 USB 線，把程式貼到 Arduino IDE，然後上傳。', '按掣，紅燈時應該聽到「嘀嘀」聲。'] },
    c2: { n: 2, title: '單車防盜警報', desc: '用傾斜開關做一個防盜器：單車被移動時，紅燈快速閃動。接法和按鈕一樣，但讀數的意思相反。',
      hw: '硬件：加入傾斜開關和 10kΩ 下拉電阻（D3）', code: '程式：完成 6 個空格',
      real: ['保留過路燈電路，<b>先拔走 USB 線</b>。', '把傾斜開關插到麵包板下半部，兩隻腳在不同號碼的直行。', '紅色線：5V → 開關一隻腳；藍色線：D3 → 開關另一隻腳。', '10kΩ：一端和 D3 同一直行，另一端接 GND。', '上傳程式後，把整塊板輕輕傾側，紅燈應該快閃。'] },
  };
  function card(k) {
    const x = S.ext[k], c = CARDS[k], sc = extScores()[k];
    const next = x.hw.done ? k + 'code' : k + 'hw';
    return `<article class="card ext-card">
      <div class="ext-top"><div class="ext-num">${c.n}</div><div><h3>${c.title}</h3><p class="muted small">${c.desc}</p></div>${status(x)}</div>
      <details class="fold ext-mat"><summary>需要的材料（實物）</summary>${KIT.table(MATERIALS[k])}</details>
      <ul class="ext-prog">${tick(x.hw.done, c.hw)}${tick(x.code.done, c.code)}${tick(x.flow.uploaded, '驗證及上傳')}${tick(x.confirmed, '老師確認實物成功')}</ul>
      ${sc ? `<p class="ext-score"><b>${sc.total}</b> / 10　<span class="small muted">接線 ${sc.hw}/4 · 程式 ${sc.code}/4 · 上傳 ${sc.up}/2</span></p>` : '<p class="small muted">評分：接線 4 分、程式 4 分、上傳 2 分。</p>'}
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
        <div class="row">${muteBtnHTML()}</div>
      </div>
      <div class="ext-grid">${card('c1')}${card('c2')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:18px"><span class="small muted">延伸挑戰可以隨時回來做。完成後重新下載報告，分數就會更新。</span><button class="btn go lg" id="extReport">產生成績報告</button></div>
    </div>`;
    bindMute(sec);
    $$('[data-go]', sec).forEach(b => b.onclick = () => goStage(b.dataset.go));
    $$('[data-replay]', sec).forEach(b => b.onclick = () => { SOUND.unlock(); showResult(b.dataset.replay, false); });
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
    const close = () => { sim && sim.stop(); SOUND.stop(); };
    const toExt = { label: '返回延伸挑戰', kind: 'go', onClick: () => { close(); if (S.stage !== 'ext') goStage('ext'); else render(); } };
    if (which === 'c1') {
      modal({
        title: fresh ? '上傳成功！試按一下按鈕' : '過路「嘀嘀」聲', wide: true, dismissable: false,
        html: `<div class="sos-stage">${HW.circuitSVG(S.hw, S.ext.c1.hw, { clickable: true })}</div>
          <div class="row" style="margin-top:12px;justify-content:space-between">
            <div class="sim-ctrl"><div id="c1Light">${trafficHTML(true)}</div><button class="btn go" id="c1Press">按下按鈕</button><span class="phase" id="c1Phase"></span></div>
            <div class="row">${muteBtnHTML()}</div>
          </div>
          <p class="small muted" style="margin-top:8px">紅燈 5 秒內，<code>for</code> 迴圈令蜂鳴器「嘀」10 次。靜音時可以看蜂鳴器旁邊的黃色聲波。</p>`,
        actions: [toExt],
        onOpen: back => { bindMute(back); const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = trafficSim(back, { light: $('#c1Light', back), phase: $('#c1Phase', back), pressBtn: $('#c1Press', back), beep: true }); },
      });
    } else {
      modal({
        title: fresh ? '上傳成功！試搖動單車' : '單車防盜警報', wide: true, dismissable: false,
        html: `<div class="sos-stage">${HW.circuitSVG(S.hw, S.ext.c2.hw)}</div>
          <div class="row" style="margin-top:12px;justify-content:space-between">
            <div class="sim-ctrl"><button class="btn go" id="c2Shake">搖動單車</button><span class="phase" id="c2Phase"></span></div>
          </div>
          <p class="small muted" style="margin-top:8px">也可以直接按模擬器上的傾斜開關。留意：這個程式取代了過路燈程式，所以只有紅燈會閃。</p>`,
        actions: [toExt],
        onOpen: back => { const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = tiltSim(back, { phase: $('#c2Phase', back), shakeBtn: $('#c2Shake', back) }); },
      });
    }
  }
  return { render, showResult, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
stageLeave.ext = () => SOUND.stop();
