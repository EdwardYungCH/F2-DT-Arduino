/* =====================================================================
   延伸挑戰、互動模擬（RGB LED 變色、電位器、彩虹漸變）
   ===================================================================== */
/* this lesson has no sound; upload() still calls SOUND.unlock() */
const SOUND = { unlock() {}, stop() {} };

/* the RGB LED inside a circuit drawing shows colour c = [r, g, b] */
function setRgbIn(root, c) {
  const L = rgbLook(c);
  $$('.rgbpart', root).forEach(g => {
    const gl = $('.rgbglow', g), b = $('.rgbbody', g);
    if (gl) { gl.setAttribute('opacity', L.k); $$('circle', gl).forEach(x => x.setAttribute('fill', L.hue)); }
    if (b) b.setAttribute('fill', L.body);
  });
}
/* controls under the circuit */
function rgbPanelHTML(mode) {
  if (mode === 'main') return `<div class="rgb-panel">
    <div class="np-ctl">
      <div><b>程式正在運作</b> <span class="small muted">（loop 不停重複）</span></div>
      <div class="seq" id="rgbSeq"></div>
      <div class="readout small" id="rgbNow"></div>
      <p class="small muted">看看 D9、D10、D11 的數字怎樣混出顏色。</p>
    </div>
    <div class="np-ctl"><div><b>自由調色</b> <span class="small muted">（拉動滑桿會暫停程式）</span></div><div id="rgbMix"></div><button class="btn sm" id="rgbResume" hidden>繼續播放程式</button></div>
  </div>`;
  if (mode === 'c1') return `<div class="rgb-panel solo"><div class="np-ctl">
      <label class="small">電位器旋鈕</label>
      <input type="range" class="knob-slider np-knob" min="0" max="100" value="20" aria-label="電位器旋鈕">
      <div class="readout small" id="rgbNow"></div>
    </div></div>`;
  return `<div class="rgb-panel solo"><div class="np-ctl">
      <div class="readout small" id="rgbNow"></div>
      <div class="seq" id="rgbSeq"></div>
    </div></div>`;
}
const nowLine = c => `D9（紅）<b>${c[0]}</b> · D10（綠）<b>${c[1]}</b> · D11（藍）<b>${c[2]}</b> → <span class="mix-name"><i style="background:${rgbLook(c).k ? rgbLook(c).hue : '#222'}"></i>${colourName(c)}</span>`;
/* the finished program running on the simulated board */
function rgbSim(root, o = {}) {
  let stopped = false, timer = 0;
  const q = s => $(s, root);
  const show = c => { setRgbIn(root, c); const n = q('#rgbNow'); if (n) n.innerHTML = nowLine(c); };
  if (o.mode === 'main') {
    const seq = [['紅色', [255, 0, 0], 1000], ['黃色', [255, 255, 0], 1000], ['我的心情色', o.mood, 2000]];
    const sq = q('#rgbSeq');
    sq.innerHTML = seq.map(([n, c, ms], i) => `<span data-i="${i}"><i style="background:${rgbLook(c).k ? rgbLook(c).hue : '#222'}"></i>${n} · ${ms / 1000} 秒</span>`).join('');
    let i = 0, paused = false;
    const mix = [...o.mood];
    const step = () => {
      if (stopped || paused) return;
      $$('span', sq).forEach(x => x.classList.toggle('on', +x.dataset.i === i));
      show(seq[i][1]);
      timer = setTimeout(() => { i = (i + 1) % seq.length; step(); }, seq[i][2]);
    };
    const mixEl = q('#rgbMix'); mixEl.innerHTML = mixerHTML(mix);
    let first = true;
    bindMixer(mixEl, mix, c => { if (first) { first = false; return; } paused = true; clearTimeout(timer); $$('span', sq).forEach(x => x.classList.remove('on')); show(c); q('#rgbResume').hidden = false; });
    q('#rgbResume').onclick = () => { paused = false; q('#rgbResume').hidden = true; step(); };
    step();
  } else if (o.mode === 'c1') {
    const sl = q('.np-knob');
    const tick = () => {
      const k = +sl.value, val = Math.round(k * 1023 / 100), level = Math.round(val * 255 / 1023);
      $$('.potknob', root).forEach(g => g.setAttribute('transform', `rotate(${-135 + 270 * k / 100} ${g.dataset.cx} ${g.dataset.cy})`));
      const c = [255 - level, 0, level];
      setRgbIn(root, c);
      q('#rgbNow').innerHTML = `A0 讀數 <b>${val}</b> → level = map(${val}, 0, 1023, 0, 255) = <b>${level}</b><br>${nowLine(c)}`;
    };
    sl.oninput = tick; tick();
  } else {
    const d = Math.max(1, Math.min(50, o.delay || 10));
    const legs = [['紅 → 綠', i => [255 - i, i, 0]], ['綠 → 藍', i => [0, 255 - i, i]], ['藍 → 紅', i => [i, 0, 255 - i]]];
    const sq = q('#rgbSeq'); sq.innerHTML = legs.map(([n], k) => `<span data-i="${k}">第 ${k + 1} 個 for：${n}</span>`).join('');
    let t = 0;
    const tick = () => {
      if (stopped) return;
      const steps = Math.floor(t / d), k = Math.floor(steps / 256) % 3, i = steps % 256;
      const c = legs[k][1](i);
      $$('span', sq).forEach(x => x.classList.toggle('on', +x.dataset.i === k));
      setRgbIn(root, c);
      q('#rgbNow').innerHTML = `i = <b>${i}</b>　${nowLine(c)}`;
      t += 40; timer = setTimeout(tick, 40);
    };
    tick();
  }
  return { stop: () => { stopped = true; clearTimeout(timer); } };
}

const EXT = (() => {
  const answered = (tpl, bls, st) => tpl.map(l => l.replace(/\{\{(e\d)\}\}/g, (_, id) => { const b = bls.find(x => x.id === id), v = st && st.blanks[id] && String(st.blanks[id].val || '').trim(); return b.accept && v && b.accept(v) ? v : b.ans; })).join('\n');
  const c1Code = () => answered(C1_TEMPLATE, C1_BLANKS);
  const c2Code = () => answered(C2_TEMPLATE, C2_BLANKS, S.ext.c2.code);
  function status(x) {
    if (x.done) return '<span class="pill ok">已完成</span>';
    const started = x.hw.parts.length || x.hw.wires.length || Object.values(x.code.blanks || {}).some(b => b.val);
    return started ? '<span class="pill warn">進行中</span>' : '<span class="pill">未開始</span>';
  }
  const tick = (ok, label) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${label}</span></li>`;
  const CARDS = {
    c1: { n: 1, title: '電位器調色', desc: '加一個電位器：扭動旋鈕，燈就由紅色慢慢變成藍色。重溫 <code>analogRead</code> 和 <code>map</code>，學習用 <code>255 - level</code> 令兩種顏色一個多、一個少。',
      hw: '硬件：加入電位器（中間腳接 A0）', code: '程式：完成 5 個空格（analogRead、map、255 − level）', score: '評分：接線 4 分、程式 4 分、上傳 2 分。',
      real: ['保留心情燈電路，<b>先拔走 USB 線</b>。', '把電位器插到麵包板，<b>跨過中間的坑</b>：兩隻外腳在上面，中間腳在下面。', '紅色線：5V →「+」電源軌。', '紅色短線：一隻外腳 →「+」電源軌；黑色短線：另一隻外腳 →「−」電源軌。', '藍色線：A0 → 電位器中間腳的直行。', '插回 USB 線，把程式貼到 Arduino IDE，然後上傳。', '慢慢扭動旋鈕，燈應該由紅色經過紫色，變成藍色。'] },
    c2: { n: 2, title: '彩虹漸變', desc: '不用加零件：用 <code>for</code> 迴圈令顏色慢慢由紅變綠、由綠變藍，再變回紅，像彩虹一樣不停循環。',
      hw: null, code: '程式：完成 5 個空格（i++、i、delay、<=）', score: '評分：程式 8 分、上傳 2 分。',
      real: ['保留心情燈電路，不用改動。', '把程式貼到 Arduino IDE，然後上傳。', '燈會慢慢轉色，大約 8 秒轉完一圈。試試把 delay 改大或改細，看看有甚麼分別。'] },
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
    const d = +String((S.ext.c2.code.blanks.e3 || {}).val || '10').trim() || 10;
    modal({
      title: c1 ? (fresh ? '上傳成功！扭動電位器試試' : '電位器調色') : (fresh ? '上傳成功！看看彩虹漸變' : '彩虹漸變'),
      wide: true, dismissable: false,
      html: `<div class="sos-stage">${c1 ? HW.circuitSVG(S.hw, S.ext.c1.hw) : HW.circuitSVG(S.hw)}</div>${rgbPanelHTML(which)}
        <p class="small muted" style="margin-top:8px">${c1 ? '旋鈕扭到盡頭：A0 讀到 1023，level 是 255，藍色全開、紅色熄（255 − 255 = 0）。' : `每一步等 ${d} 毫秒，每個 for 有 256 步，所以每段大約 ${(256 * d / 1000).toFixed(1)} 秒。<code>analogWrite</code> 令腳位極快地開關，開的時間越長，看起來越亮。`}</p>`,
      actions: [toExt],
      onOpen: back => { const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = rgbSim(back, { mode: which, delay: d }); },
    });
  }
  return { render, showResult, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
