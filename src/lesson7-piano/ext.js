/* =====================================================================
   聲音、延伸挑戰、互動模擬（琴鍵、光線琴、一鍵播歌）
   ===================================================================== */
/* square wave like the kit's buzzer; low volume; only starts after a click (browser rule) */
const SOUND = (() => {
  const KEY = 'pianoLab.muted';
  let ctx = null, osc = null, gain = null;
  let muted = (() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } })();
  function unlock() {
    try {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }
  /* start a tone, or glide to a new frequency if one is already playing */
  function start(freq) {
    if (muted || !ctx) { stop(); return; }
    try {
      if (osc) { osc.frequency.setValueAtTime(freq, ctx.currentTime); return; }
      osc = ctx.createOscillator(); gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq; gain.gain.value = 0.03;
      osc.connect(gain); gain.connect(ctx.destination); osc.start();
    } catch (e) { osc = null; }
  }
  function stop() { try { if (osc) { osc.stop(); osc.disconnect(); } } catch (e) {} osc = null; }
  function setMuted(v) { muted = v; try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} if (v) stop(); }
  return { unlock, start, stop, setMuted, isMuted: () => muted };
})();
function muteBtnHTML() { return `<button type="button" class="btn sm mute-btn" data-mute>${SOUND.isMuted() ? '🔇 聲音：已靜音' : '🔈 聲音：開（音量較低）'}</button>`; }
function bindMute(root = document) {
  $$('[data-mute]', root).forEach(b => b.onclick = () => {
    SOUND.unlock(); SOUND.setMuted(!SOUND.isMuted());
    $$('[data-mute]').forEach(x => x.textContent = SOUND.isMuted() ? '🔇 聲音：已靜音' : '🔈 聲音：開（音量較低）');
  });
}

/* parts inside a circuit drawing */
function setBtnIn(root, id, pressed) {
  $$(`.btnpart[data-btn="${id}"] .btncap`, root).forEach(c => { c.setAttribute('r', pressed ? 9 : 10.5); c.setAttribute('fill', pressed ? '#8E1B12' : '#C9352A'); });
}
const setPzIn = (root, on) => $$('.pzwaves', root).forEach(w => w.setAttribute('opacity', on ? 1 : 0));
const setShadeIn = (root, k) => $$('.lsshade', root).forEach(g => g.setAttribute('opacity', Math.max(0, Math.min(1, k)).toFixed(2)));

/* controls under the circuit */
function pianoPanelHTML(mode) {
  const sound = `<div class="row" style="gap:8px">${muteBtnHTML()}<span class="small muted">全班一起用會很吵，建議戴耳機。</span></div>`;
  if (mode === 'main') return `<div class="piano-panel">
    <div class="np-ctl">
      <div><b>程式正在運作</b> <span class="small muted">（按住琴鍵、按電路圖上的按鈕，或用鍵盤 1 至 4）</span></div>
      <div id="simPiano">${pianoHTML({ pins: true, small: true })}</div>
      <div class="readout small" id="pianoNow"></div>
      <div class="keypins" id="keyPins"></div>
      ${sound}
    </div>
    <div class="np-ctl"><div><b>試彈：瑪莉有隻小綿羊</b></div>${songHTML()}
      <p class="small muted" id="songMsg">跟着黃色的音符彈。</p>
      <p class="small muted">試試<b>同時按兩個鍵</b>：程式由上而下檢查 <code>if … else if</code>，只會響<b>第一個</b>成立的音。</p></div>
  </div>`;
  if (mode === 'c1') return `<div class="piano-panel solo"><div class="np-ctl">
      <label class="small" for="handSl"><b>手和光感應器的距離</b>（向右 = 手越近、越暗）</label>
      <input type="range" class="hand-slider" id="handSl" min="0" max="100" value="40" aria-label="手和光感應器的距離">
      <div id="handGauge"></div>
      <div class="readout small" id="pianoNow"></div>
      ${sound}
    </div></div>`;
  return `<div class="piano-panel solo"><div class="np-ctl">
      <div class="row"><button type="button" class="btn go" id="songKey">按住 Do 鍵（D2）</button><span class="small muted">也可以按電路圖上的 Do 鍵，或鍵盤 1</span></div>
      <div class="mel" id="melody"></div>
      <div class="readout small" id="pianoNow"></div>
      ${sound}
    </div></div>`;
}
/* the finished program running on the simulated board */
function pianoSim(root, o = {}) {
  let stopped = false, timers = [], unbind = null;
  const q = s => $(s, root);
  const later = (fn, ms) => { const t = setTimeout(() => { if (!stopped) fn(); }, ms); timers.push(t); return t; };
  bindMute(root);
  const km = HW.keyMap(), idKey = {}; Object.keys(km).forEach(k => { idKey[km[k]] = k; });
  /* the buttons drawn on the circuit can be pressed too */
  const bindCircuit = set => $$('.btnpart', root).forEach(g => {
    const k = idKey[g.dataset.btn]; if (!k) return;
    g.addEventListener('pointerdown', e => { e.preventDefault(); SOUND.unlock(); try { g.setPointerCapture(e.pointerId); } catch (_) {} set(k, true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => g.addEventListener(ev, () => set(k, false)));
  });
  if (o.mode === 'main') {
    const tr = songTracker(root, () => { q('#songMsg').innerHTML = '<b style="color:var(--ok)">彈完了！</b>再彈一次，或者試試自己作一段。'; });
    let last = null;
    const draw = pressed => {
      const x = firstKey(pressed);
      KEYS.forEach(k => { if (km[k.k]) setBtnIn(root, km[k.k], pressed.includes(k.k)); });
      q('#keyPins').innerHTML = KEYS.map(k => `<span class="${pressed.includes(k.k) ? 'low' : ''}">digitalRead(${k.n}) = ${pressed.includes(k.k) ? 'LOW' : 'HIGH'}</span>`).join('');
      setPzIn(root, !!x);
      if (x) SOUND.start(x.f); else SOUND.stop();
      const two = pressed.length > 1 ? `<br><span class="small">同時按了 ${pressed.map(k => keyOf(k).name).join('、')}：<b>${x.name}</b> 的 if 在最上面，先成立，所以只響 ${x.name}。</span>` : '';
      q('#pianoNow').innerHTML = x ? `<code>tone(buzzerPin, ${x.f})</code>：蜂鳴器每秒震動 <b>${x.f}</b> 次 → <b>${x.name}</b>${two}` : '全部放開 → <code>noTone(buzzerPin)</code>：停聲';
      if (x && (!last || last.k !== x.k)) tr.press(x.k);
      last = x;
    };
    unbind = bindPiano(q('#simPiano'), draw);
    bindCircuit(unbind.set);
    draw([]);
  } else if (o.mode === 'c1') {
    const sl = q('#handSl'), thr = o.thr, top = o.top;
    q('#handGauge').innerHTML = gaugeHTML(LIGHT.base(+sl.value), thr);
    const tick = () => {
      const d = +sl.value, val = LIGHT.read(d);
      setShadeIn(root, (d - 30) / 70);
      setGauge(q('#handGauge'), val);
      if (val > thr) {
        const pitch = Math.round(262 + (val - 400) * (top - 262) / 300);
        SOUND.start(Math.max(31, pitch)); setPzIn(root, true);
        q('#pianoNow').innerHTML = `${LIGHT.label(d)}：A0 讀數 <b>${val}</b> &gt; 門檻 ${thr}<br>pitch = map(${val}, 400, 700, 262, ${top}) = <b>${pitch}</b> Hz${noteName(pitch) ? `（${noteName(pitch)}）` : ''}`;
      } else {
        SOUND.stop(); setPzIn(root, false);
        q('#pianoNow').innerHTML = `${LIGHT.label(d)}：A0 讀數 <b>${val}</b>，未大過門檻 ${thr} → <code>noTone</code>，停聲`;
      }
      later(tick, 120);
    };
    sl.addEventListener('input', () => SOUND.unlock());
    tick();
  } else {
    const notes = songFreqs(), ms = o.noteMs || 400;
    q('#melody').innerHTML = notes.map((f, i) => `<i data-mi="${i}">[${i}] ${f}</i>`).join('');
    let held = false, playing = false;
    const play = i => {
      $$('#melody i', root).forEach(el => el.classList.toggle('on', +el.dataset.mi === i));
      if (i >= notes.length) {
        playing = false; SOUND.stop(); setPzIn(root, false);
        if (held) { later(() => { if (held) { playing = true; play(0); } }, 30); return; }
        q('#pianoNow').innerHTML = '播完了。迴圈完結後，<code>loop()</code> 再檢查 Do 鍵：放開了，所以不再播。';
        return;
      }
      SOUND.start(notes[i]); setPzIn(root, true);
      q('#pianoNow').innerHTML = `i = <b>${i}</b>　<code>tone(buzzerPin, melody[${i}])</code> → <b>${notes[i]}</b> Hz（${noteName(notes[i]) || ''}）`;
      later(() => { SOUND.stop(); setPzIn(root, false); later(() => play(i + 1), 50); }, ms);
    };
    const set = (k, on) => {
      if (k !== 'do') return;
      held = on; q('#songKey').classList.toggle('down', on);
      if (km.do) setBtnIn(root, km.do, on);
      if (on && !playing) { playing = true; play(0); }
    };
    const b = q('#songKey');
    b.addEventListener('pointerdown', e => { e.preventDefault(); SOUND.unlock(); try { b.setPointerCapture(e.pointerId); } catch (_) {} set('do', true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => set('do', false)));
    const kd = e => { if (!e.repeat && KEYS[0].kb.includes(e.key.toLowerCase())) { SOUND.unlock(); set('do', true); } };
    const ku = e => { if (KEYS[0].kb.includes(e.key.toLowerCase())) set('do', false); };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    unbind = { off: () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); } };
    bindCircuit(set);
    q('#pianoNow').innerHTML = '按一下 Do 鍵：for 迴圈會由 i = 0 播到最後一個音（中途放開也會播完）。';
  }
  return { stop: () => { stopped = true; timers.forEach(clearTimeout); SOUND.stop(); if (unbind) unbind.off(); } };
}

const EXT = (() => {
  const answered = (tpl, bls, st) => tpl.map(l => l.replace(/\{\{(e\d)\}\}/g, (_, id) => blankVal(st, bls.find(x => x.id === id)))).join('\n');
  const c1Code = () => answered(C1_TEMPLATE, C1_BLANKS, S.ext.c1.code);
  const c2Code = () => answered(C2_TEMPLATE, C2_BLANKS, S.ext.c2.code);
  const c1Val = id => +blankVal(S.ext.c1.code, C1_BLANKS.find(b => b.id === id));
  const c2Ms = () => +blankVal(S.ext.c2.code, C2_BLANKS.find(b => b.id === 'e6'));
  function status(x) {
    if (x.done) return '<span class="pill ok">已完成</span>';
    const started = x.hw.parts.length || x.hw.wires.length || Object.values(x.code.blanks || {}).some(b => b.val);
    return started ? '<span class="pill warn">進行中</span>' : '<span class="pill">未開始</span>';
  }
  const tick = (ok, label) => `<li class="${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${label}</span></li>`;
  const CARDS = {
    c1: { n: 1, title: '光線琴', desc: '加一個光感應器：手越近，聲音越高，手拿開就停聲，好像在空中彈琴。重溫第 4 堂的光感應器和 <code>map</code>，把讀數轉成音高。',
      hw: '硬件：加入光感應器和 10kΩ（用下方的電源軌）', code: '程式：完成 6 個空格（門檻值、map、tone、noTone）', score: '評分：接線 4 分、程式 4 分、上傳 2 分。',
      real: ['保留電子琴電路，<b>先拔走 USB 線</b>。', '在麵包板<b>下半部</b>插光感應器（短腳 − 在左，<b>反轉插</b>）和 10kΩ（右端和短腳同一直行）。', '紅色線：5V → 下方「+」電源軌；黑色線：下方的 GND → 下方「−」電源軌。', '紅色短線：10kΩ 左端 →「+」軌；黑色短線：光感應器長腳 →「−」軌。', '藍色線：A0 → 光感應器短腳的直行。', '插回 USB 線，把程式貼到 Arduino IDE，然後上傳。', '把手慢慢移近光感應器：聲音應該越來越高；手拿開就停。'] },
    c2: { n: 2, title: '一鍵播歌', desc: '不用加零件：把整首歌的頻率放進<b>陣列</b>，按一下 Do 鍵，<code>for</code> 迴圈就自動播完《瑪莉有隻小綿羊》。',
      hw: null, code: '程式：完成 6 個空格（陣列、for、i++、音長）', score: '評分：程式 8 分、上傳 2 分。',
      real: ['保留電子琴電路，不用改動。', '把程式貼到 Arduino IDE，然後上傳。', '按一下 Do 鍵：蜂鳴器會自動播完整首歌。試試改 <code>delay</code> 的數字，令歌變快或變慢。', '想播另一首歌？改 melody 內的數字和音的數目就可以。'] },
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
    const toExt = { label: '返回延伸挑戰', kind: 'go', onClick: () => { sim && sim.stop(); if (S.stage !== 'ext') goStage('ext'); else render(); } };
    const c1 = which === 'c1';
    const ms = c2Ms();
    modal({
      title: c1 ? (fresh ? '上傳成功！把手移近光感應器試試' : '光線琴') : (fresh ? '上傳成功！按 Do 鍵播歌' : '一鍵播歌'),
      wide: true, dismissable: false,
      html: `<div class="sos-stage">${c1 ? HW.circuitSVG(S.hw, S.ext.c1.hw) : HW.circuitSVG(S.hw, null, { clickable: true, labels: HW.keyLabels() })}</div>${pianoPanelHTML(which)}
        <p class="small muted" style="margin-top:8px">${c1 ? `讀數 400 對應 262 Hz（Do），讀數 700 對應 ${c1Val('e3')} Hz。<code>map</code> 按比例計出中間的音，所以手移近時，聲音會<b>慢慢</b>變高。` : `13 個音 × (${ms} + 50) 毫秒 ≈ ${(13 * (ms + 50) / 1000).toFixed(1)} 秒播完一次。陣列的位置由 <b>0</b> 開始：melody[0] 是第 1 個音，melody[12] 是第 13 個音。`}</p>`,
      actions: [toExt],
      onOpen: back => { const ON = $('.uLedON', back); ON && ON.setAttribute('fill', '#3CFF7A'); sim = pianoSim(back, { mode: which, thr: c1Val('e1'), top: c1Val('e3'), noteMs: ms }); },
    });
  }
  return { render, showResult, c1Code, c2Code };
})();
stageInit.ext = () => EXT.render();
stageLeave.ext = () => SOUND.stop();
