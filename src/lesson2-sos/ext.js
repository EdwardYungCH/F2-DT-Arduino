/* =====================================================================
   延伸挑戰：選擇頁、聲音、成功動畫、實物確認
   ===================================================================== */
const SOUND = (() => {
  const KEY = 'sosLab.muted';
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
  const pitchOf = () => { const v = ((S.ext.c1.code.blanks.e2 || {}).val || '').trim(); return pitchOK(v) ? +v : 1000; };
  function c1Code() { return C1_TEMPLATE.map(l => l.replace(/\{\{(e\d)\}\}/g, (_, id) => id === 'e2' ? String(pitchOf()) : C1_BLANKS.find(b => b.id === id).ans)).join('\n'); }
  function c2Code() {
    const body = (S.ext.c2.code.text || '').split('\n').map(l => '  ' + l.trim()).join('\n');
    return C2_TEMPLATE.map(l => l === '{{REGION}}' ? body : l).join('\n');
  }
  /* on/off sequence for the student's initials, matching dot() / dash() / letterGap() */
  function initialsSeq(ini) {
    const seq = [];
    ini.split('').forEach((ch, li) => {
      morseCalls(ch).forEach((n, si) => { seq.push([1, n === 'dot' ? 200 : 600, li, si]); seq.push([0, 200, li, si]); });
      if (li < ini.length - 1) seq[seq.length - 1][1] += 400;
    });
    seq[seq.length - 1][1] += 2000;
    return seq;
  }

  function status(x, hwNeeded) {
    if (x.done) return '<span class="pill ok">已完成</span>';
    const started = (hwNeeded && (x.hw.pz || x.hw.wires.length)) || x.code.done || (x.code.text || '').trim() || Object.values(x.code.blanks || {}).some(b => b.val);
    return started ? '<span class="pill warn">進行中</span>' : '<span class="pill">未開始</span>';
  }
  const tick = (ok, label) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${label}</span></li>`;

  function render() {
    const sec = $('#st-ext');
    const e = S.ext, sc = extScores();
    const c1Next = e.c1.hw.done ? 'c1code' : 'c1hw';
    sec.innerHTML = `<div class="ext-wrap">
      <div class="intro-head">
        <div><div class="eyebrow">第 5 步 · 選做</div><h2>延伸挑戰</h2>
        <p>做得快？試試這兩個挑戰，可以任選一個先做。每個挑戰 10 分，會另外列在成績報告上，<b>不計入 100 分總分</b>。</p></div>
        <div class="row">${muteBtnHTML()}</div>
      </div>
      <div class="ext-grid">
        <article class="card ext-card">
          <div class="ext-top"><div class="ext-num">1</div><div><h3>聲光 SOS</h3><p class="muted small">加一個蜂鳴器：LED 閃的同時「嗶」一聲。學習用 <code>tone()</code> 和 <code>noTone()</code> 發聲。</p></div>${status(e.c1, true)}</div>
          <details class="fold ext-mat"><summary>需要的材料（實物）</summary>${KIT.table(MATERIALS.c1)}</details>
          <ul class="ext-prog">${tick(e.c1.hw.done, '硬件：加入蜂鳴器（D8 → 蜂鳴器 → GND）')}${tick(e.c1.code.done, '程式：完成 6 個空格')}${tick(e.c1.flow.uploaded, '驗證及上傳')}${tick(e.c1.confirmed, '老師確認實物成功')}</ul>
          ${sc.c1 ? `<p class="ext-score"><b>${sc.c1.total}</b> / 10　<span class="small muted">接線 ${sc.c1.hw}/4 · 程式 ${sc.c1.code}/4 · 上傳 ${sc.c1.up}/2</span></p>` : '<p class="small muted">評分：接線 4 分、程式 4 分、上傳 2 分。</p>'}
          <div class="row">
            ${e.c1.done ? '<button class="btn" data-replay="c1">再看一次（有聲）</button>' : `<button class="btn go" data-go="${c1Next}">${status(e.c1, true).includes('未開始') ? '開始挑戰 1' : '繼續挑戰 1'}</button>`}
          </div>
          ${e.c1.done ? `<details class="fold ext-real" ${e.c1.confirmed ? '' : 'open'}><summary>在真的 UNO 上做一次</summary>
            <ol class="goals small"><li>保留原本的 LED 電路，<b>先拔走 USB 線</b>。</li><li>把蜂鳴器插到麵包板，兩隻腳在不同號碼的直行。</li><li>藍色線：D8 → 蜂鳴器一隻腳；黑色線：GND → 蜂鳴器另一隻腳。</li><li>插回 USB 線，把程式貼到 Arduino IDE，然後上傳。</li><li>LED 閃時應該聽到「嗶」聲。沒有聲？檢查是否用了 <code>tone()</code>，以及蜂鳴器兩隻腳是否插在不同直行。</li></ol>
            <div class="row"><button class="btn sm primary" data-copy="c1">複製完整程式</button><span class="small muted" data-copymsg="c1"></span></div>
            ${e.c1.confirmed ? alertBox('ok', '老師已確認實物成功。') : '<button class="btn sm teal" data-confirm="c1">老師確認實物成功</button>'}
          </details>` : ''}
        </article>
        <article class="card ext-card">
          <div class="ext-top"><div class="ext-num">2</div><div><h3>閃出你的英文名縮寫</h3><p class="muted small">不用改線。程式已有 <code>dot()</code> 和 <code>dash()</code> 兩個函數，你要自己寫出次序，用摩斯密碼閃出你的縮寫。</p></div>${status(e.c2, false)}</div>
          <ul class="ext-prog">${tick(!!e.c2.code.initials, `輸入縮寫${e.c2.code.initials ? `：<b class="mono">${esc(e.c2.code.initials)}</b>` : ''}`)}${tick(e.c2.code.done, '程式：用 dot / dash / letterGap 寫出縮寫')}${tick(e.c2.flow.uploaded, '驗證及上傳')}${tick(e.c2.confirmed, '老師確認實物成功')}</ul>
          ${sc.c2 ? `<p class="ext-score"><b>${sc.c2.total}</b> / 10　<span class="small muted">程式 ${sc.c2.code}/8 · 上傳 ${sc.c2.up}/2</span></p>` : '<p class="small muted">評分：程式 8 分（每次檢查未通過 −1）、上傳 2 分。</p>'}
          <div class="row">
            ${e.c2.done ? '<button class="btn" data-replay="c2">再看一次</button>' : `<button class="btn go" data-go="c2code">${status(e.c2, false).includes('未開始') ? '開始挑戰 2' : '繼續挑戰 2'}</button>`}
          </div>
          ${e.c2.done ? `<details class="fold ext-real" ${e.c2.confirmed ? '' : 'open'}><summary>在真的 UNO 上做一次</summary>
            <ol class="goals small"><li>用原本的 LED 電路，不用改線。</li><li>把你的程式貼到 Arduino IDE，然後上傳。</li><li>看看 LED 是否閃出 <b>${esc(e.c2.code.initials)}</b>，讓同學猜猜是誰的縮寫。</li></ol>
            <div class="row"><button class="btn sm primary" data-copy="c2">複製完整程式</button><span class="small muted" data-copymsg="c2"></span></div>
            ${e.c2.confirmed ? alertBox('ok', '老師已確認實物成功。') : '<button class="btn sm teal" data-confirm="c2">老師確認實物成功</button>'}
          </details>` : ''}
        </article>
      </div>
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
    let stop = null;
    const close = () => { stop && stop(); SOUND.stop(); };
    const toExt = { label: '返回延伸挑戰', kind: 'go', onClick: () => { close(); if (S.stage !== 'ext') goStage('ext'); else render(); } };
    if (which === 'c1') {
      const pitch = pitchOf();
      modal({
        title: fresh ? '上傳成功！聲光 SOS 正在運作' : '聲光 SOS',
        wide: true, dismissable: false,
        html: `<div class="sos-stage">${HW.circuitSVG(S.hw, S.ext.c1.hw)}</div>
          <div class="row" style="margin-top:12px;justify-content:space-between">
            <div class="morse" id="c1Morse" style="background:#0F1B20;border-radius:8px;padding:6px"></div>
            <div class="row">${muteBtnHTML()}<span class="small muted">頻率 ${pitch} Hz</span></div>
          </div>
          <p class="small muted" style="margin-top:8px">LED 亮時蜂鳴器同時發聲。靜音時可以看蜂鳴器旁邊的黃色聲波。想聽不同的聲音？在真的 Arduino 上把 <code>pitch</code> 改成 500 或 2000 試試。</p>`,
        actions: [toExt],
        onOpen: back => {
          bindMute(back);
          const glow = $$('.ledglow', back), body = $$('.ledbody', back), waves = $$('.pzwaves', back), L = $('.uLedL', back), ON = $('.uLedON', back);
          ON && ON.setAttribute('fill', '#3CFF7A');
          const morse = $('#c1Morse', back); morse.innerHTML = morseHTML(); const syms = $$('.sym', morse);
          stop = playSOS((on, sym) => {
            glow.forEach(g => g.setAttribute('opacity', on ? 1 : 0));
            body.forEach(b => b.setAttribute('fill', on ? '#FF6B55' : '#D8321F'));
            waves.forEach(w => w.setAttribute('opacity', on ? 1 : 0));
            L && L.setAttribute('fill', on ? '#FFB020' : '#6B5A2E');
            syms.forEach((s, k) => s.classList.toggle('lit', !!on && k === sym));
            if (on) SOUND.start(pitch); else SOUND.stop();
          });
        },
      });
    } else {
      const ini = S.ext.c2.code.initials;
      const seq = initialsSeq(ini);
      modal({
        title: fresh ? `上傳成功！LED 正在閃出 ${esc(ini)}` : `閃出 ${esc(ini)}`,
        wide: true, dismissable: false,
        html: `<div class="sos-stage">${HW.circuitSVG(S.hw)}</div>
          <div class="ini-track" id="iniTrack">${ini.split('').map((ch, li) => `<div class="letter" data-l="${li}"><b>${ch}</b>${morseCalls(ch).map((n, si) => `<i class="sym ${n}" data-s="${li}-${si}"></i>`).join('')}</div>`).join('')}</div>
          <p class="small muted" style="margin-top:8px">試試請同學看着 LED，猜猜這是誰的縮寫。</p>`,
        actions: [toExt],
        onOpen: back => {
          const glow = $$('.ledglow', back), body = $$('.ledbody', back), L = $('.uLedL', back), ON = $('.uLedON', back);
          ON && ON.setAttribute('fill', '#3CFF7A');
          stop = playSeq(seq, (on, i) => {
            glow.forEach(g => g.setAttribute('opacity', on ? 1 : 0));
            body.forEach(b => b.setAttribute('fill', on ? '#FF6B55' : '#D8321F'));
            L && L.setAttribute('fill', on ? '#FFB020' : '#6B5A2E');
            const cur = i >= 0 ? seq[i] : null;
            $$('.sym', back).forEach(s => s.classList.toggle('lit', !!(on && cur && s.dataset.s === `${cur[2]}-${cur[3]}`)));
            $$('.ini-track .letter', back).forEach(l => l.classList.toggle('cur', !!(cur && +l.dataset.l === cur[2])));
          });
        },
      });
    }
  }
  return { render, showResult, c1Code, c2Code, initialsSeq };
})();
stageInit.ext = () => EXT.render();
stageLeave.ext = () => SOUND.stop();
