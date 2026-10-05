/* =====================================================================
   延伸挑戰：選擇頁、聲音、成功動畫、實物確認
   ===================================================================== */
const SOUND = (() => {
  const KEY = 'blinkLab.muted';
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
      osc.type = 'square'; osc.frequency.value = freq; g.gain.value = 0.03;   // low volume for a classroom
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

const EXT = (() => {
  const c1Code = () => C1_TEMPLATE.map(l => l.replace(/\{\{(e\d)\}\}/g, (_, id) => C1_BLANKS.find(b => b.id === id).ans)).join('\n');
  const c2Code = () => S.ext.c2.code.text || FIXED_CODE;

  function status(x) {
    if (x.done) return '<span class="pill ok">已完成</span>';
    const started = x.code.done || x.code.compileFails || (x.code.text && x.code.text !== BUGGY_CODE) || Object.values(x.code.blanks || {}).some(b => b.val);
    return started ? '<span class="pill warn">進行中</span>' : '<span class="pill">未開始</span>';
  }
  const tick = (ok, label) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${label}</span></li>`;
  const CARDS = {
    c1: { n: 1, title: '心跳燈', desc: '令 L 燈像心跳一樣「噗噗——停」：快閃兩下，再停一停。學習用不同的 <code>delay()</code> 數值做出節奏。',
      prog: x => tick(x.code.done, '程式：完成 5 個空格') + tick(x.flow.uploaded, '驗證及上傳') + tick(x.confirmed, '老師確認實物成功'),
      score: sc => `程式 ${sc.code}/8 · 上傳 ${sc.up}/2`, rule: '評分：程式 8 分（每答錯一次 −1，顯示答案 −2）、上傳 2 分。',
      real: ['不用改線，只要 UNO 和 USB 線。', '按「複製完整程式」，貼到 Arduino IDE，然後上傳。', 'L 燈應該「噗噗——停」地閃，像心跳一樣。'] },
    c2: { n: 2, title: '修好壞掉的程式', desc: '一個程式有 4 個錯處。用 Output 的錯誤訊息找出文法錯誤，再上傳找出最後一個「邏輯錯誤」。以後每一堂都會用到這個本領！',
      prog: x => tick(x.code.compileOk || x.code.done, '修正文法錯誤（Verify 沒有錯誤）') + tick(x.code.done, '修正邏輯錯誤（L 燈每秒閃一次）') + tick(x.confirmed, '老師確認實物成功'),
      score: sc => `程式 ${sc.code}/8 · 上傳 ${sc.up}/2`, rule: '評分：程式 8 分（編譯錯誤不扣分；上傳後燈號不對每次 −1，顯示答案只得 3 分）、上傳 2 分。',
      real: ['不用改線，只要 UNO 和 USB 線。', '按「複製完整程式」，貼到 Arduino IDE，然後上傳。', 'L 燈應該每秒閃一次。'] },
  };
  function card(k) {
    const x = S.ext[k], c = CARDS[k], sc = extScores()[k];
    return `<article class="card ext-card">
      <div class="ext-top"><div class="ext-num">${c.n}</div><div><h3>${c.title}</h3><p class="muted small">${c.desc}</p></div>${status(x)}</div>
      <p class="small muted">需要的材料：UNO 和 USB 線（不用加零件）。</p>
      <ul class="ext-prog">${c.prog(x)}</ul>
      ${sc ? `<p class="ext-score"><b>${sc.total}</b> / 10　<span class="small muted">${c.score(sc)}</span></p>` : `<p class="small muted">${c.rule}</p>`}
      <div class="row">${x.done ? `<button class="btn" data-replay="${k}">再看一次</button>` : `<button class="btn go" data-go="${k}code">${status(x).includes('未開始') ? '開始挑戰 ' + c.n : '繼續挑戰 ' + c.n}</button>`}</div>
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
  /* the program compiled and uploaded, but the L light does the wrong thing */
  function showWrongRun(r) {
    let stop = null;
    modal({
      title: '上傳成功……但 L 燈不對', wide: true, dismissable: false,
      html: `<div class="sos-stage">${HW.circuitSVG()}</div><p style="margin-top:12px">${r.why}程式本來應該令 L 燈<b>亮 1 秒、熄 1 秒</b>。看清楚 <code>loop()</code> 內每一行做甚麼，找出最後一個錯處。</p>`,
      actions: [{ label: '返回修改程式', kind: 'go', onClick: () => { stop && stop(); } }],
      onOpen: back => { stop = playSeq(r.seq || [[0, 1000]], (on, i) => HW.setL(back, r.kind === 'nomode' ? false : on)); if (r.kind === 'nomode') $$('.uLedL, .lbig', back).forEach(e => e.setAttribute('fill', '#7A6A3A')); },
    });
  }
  function showResult(which, fresh) {
    let stop = null;
    const close = () => { stop && stop(); };
    const toExt = { label: '返回延伸挑戰', kind: 'go', onClick: () => { close(); if (S.stage !== 'ext') goStage('ext'); else render(); } };
    const isHeart = which === 'c1';
    const seq = isHeart ? HEART_SEQ : (runDebug(parseDebug(S.ext.c2.code.text).fns).seq || BLINK_SEQ);
    modal({
      title: isHeart ? (fresh ? '上傳成功！L 燈在「噗噗——停」' : '心跳燈') : (fresh ? '修好了！L 燈每秒閃一次' : '修好壞掉的程式'),
      wide: true, dismissable: false,
      html: `<div class="sos-stage">${HW.circuitSVG()}</div>
        <div class="row" style="margin-top:12px;justify-content:space-between"><div class="blinkbar" id="xBar">${seq.map((s, i) => `<i style="width:${Math.max(10, s[1] / 12)}px" data-i="${i}"></i>`).join('')}</div>
        <p class="small muted" style="max-width:34em">${isHeart ? '亮 0.1 秒 → 熄 0.1 秒 → 亮 0.1 秒 → 熄 0.8 秒。試試在真的 UNO 上把 800 改成 400，心跳會變快。' : '你修正了 3 個文法錯誤和 1 個邏輯錯誤。記住：編譯成功只代表文法正確，程式做的事對不對，要上傳後看清楚。'}</p></div>`,
      actions: [toExt],
      onOpen: back => {
        const bars = $$('#xBar i', back);
        stop = playSeq(seq, (on, i) => { HW.setL(back, on); bars.forEach((b, k) => b.classList.toggle('lit', k === i && !!on)); });
      },
    });
  }
  return { render, showResult, showWrongRun, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
stageLeave.ext = () => SOUND.stop();
