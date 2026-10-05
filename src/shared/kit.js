/* =====================================================================
   套件材料：圖示、材料清單表、電阻辨認卡、電阻小測
   （各堂共用；材料內容由各堂的 MATERIALS 提供）
   ===================================================================== */
const KIT = (() => {
  const BAND = { red: ['#D12B2B', '紅'], black: ['#1E1E1E', '黑'], brown: ['#7A4A1E', '棕'] };
  /* the kit's resistors: blue metal-film body, 5 bands (4th = multiplier, 5th = tolerance) */
  const RES = {
    220: { label: '220Ω', bag: '220R', bands: ['red', 'red', 'black', 'black', 'brown'], reds: 2 },
    1000: { label: '1kΩ', bag: '1K', bands: ['brown', 'black', 'black', 'brown', 'brown'], reds: 0 },
    10000: { label: '10kΩ', bag: '10K', bands: ['brown', 'black', 'black', 'red', 'brown'], reds: 1 },
  };
  const bandWords = ohm => RES[ohm].bands.map(b => BAND[b][1]).join('');
  const WIRE = { black: ['#2A2A2A', '黑'], white: ['#F4F4F0', '白'], red: ['#D63A2F', '紅'], blue: ['#2F6FD6', '藍'], green: ['#2E9B4F', '綠'] };

  /* ---------- small icons for the materials table ---------- */
  function resIcon(ohm) {
    const xs = [27, 33, 39, 45, 54];
    return `<svg viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15h76" stroke="#9AA3A7" stroke-width="2"/><rect x="20" y="7" width="40" height="16" rx="7" fill="#4A8BD6" stroke="#2C5E9A"/>${RES[ohm].bands.map((b, i) => `<rect x="${xs[i]}" y="7" width="3.6" height="16" fill="${BAND[b][0]}"/>`).join('')}</svg>`;
  }
  const ICON = {
    uno: '<svg viewBox="0 0 70 52" aria-hidden="true"><rect x="1" y="1" width="68" height="50" rx="4" fill="#0E7C9B"/><rect x="-2" y="8" width="14" height="12" fill="#B9C2C6"/><rect x="18" y="4" width="44" height="5" fill="#222"/><rect x="26" y="43" width="36" height="5" fill="#222"/><rect x="30" y="26" width="30" height="8" fill="#222"/></svg>',
    usb: '<svg viewBox="0 0 70 40" aria-hidden="true"><rect x="2" y="12" width="16" height="16" rx="2" fill="#8A969B"/><path d="M18 20c20 0 20 14 34 14h8" stroke="#333" stroke-width="4" fill="none"/><rect x="58" y="29" width="10" height="9" fill="#8A969B"/></svg>',
    board: '<svg viewBox="0 0 70 52" aria-hidden="true"><rect x="1" y="1" width="68" height="50" rx="3" fill="#F2F1EA" stroke="#CFCCC0"/><path d="M5 5h60" stroke="#2F6FD6" stroke-width="1.2"/><path d="M5 11h60" stroke="#D63A2F" stroke-width="1.2"/><path d="M5 41h60" stroke="#2F6FD6" stroke-width="1.2"/><path d="M5 47h60" stroke="#D63A2F" stroke-width="1.2"/>' + Array.from({ length: 40 }, (_, i) => `<rect x="${7 + (i % 10) * 6}" y="${i < 20 ? 15 + Math.floor(i / 10) * 5 : 29 + Math.floor((i - 20) / 10) * 5}" width="2.6" height="2.6" fill="#555"/>`).join('') + '<rect x="3" y="25" width="64" height="2" fill="#E2E0D5"/></svg>',
    led: c => `<svg viewBox="0 0 40 60" aria-hidden="true"><path d="M10 26a10 10 0 0120 0v8H10z" fill="${c}"/><rect x="8" y="33" width="24" height="4" fill="#555"/><path d="M15 37v19" stroke="#999" stroke-width="2"/><path d="M25 37v6l3 3v12" stroke="#999" stroke-width="2" fill="none"/></svg>`,
    leds: cs => `<svg viewBox="0 0 ${cs.length * 28 + 6} 60" aria-hidden="true">${cs.map((c, i) => `<g transform="translate(${i * 28} 0)"><path d="M10 26a10 10 0 0120 0v8H10z" fill="${c}"/><path d="M15 37v19" stroke="#999" stroke-width="2"/><path d="M25 37v6l3 3v12" stroke="#999" stroke-width="2" fill="none"/></g>`).join('')}</svg>`,
    res: resIcon,
    btn: '<svg viewBox="0 0 60 60" aria-hidden="true"><rect x="8" y="2" width="4" height="10" fill="#aaa"/><rect x="48" y="2" width="4" height="10" fill="#aaa"/><rect x="8" y="48" width="4" height="10" fill="#aaa"/><rect x="48" y="48" width="4" height="10" fill="#aaa"/><rect x="6" y="10" width="48" height="40" rx="4" fill="#2B2F33"/><circle cx="30" cy="30" r="12" fill="#C9352A"/></svg>',
    buzzer: '<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M22 44v14M38 44v14" stroke="#999" stroke-width="2"/><circle cx="30" cy="26" r="21" fill="#1F1F1F"/><circle cx="30" cy="26" r="15" fill="none" stroke="#3A3A3A" stroke-width="1.5"/><circle cx="30" cy="26" r="3.5" fill="#555"/></svg>',
    tilt: '<svg viewBox="0 0 80 30" aria-hidden="true"><path d="M2 15h22" stroke="#C9A53A" stroke-width="2"/><path d="M56 15h22" stroke="#9AA3A7" stroke-width="2"/><rect x="22" y="6" width="36" height="18" rx="6" fill="#2E9E55" stroke="#1D6E3A"/><rect x="25" y="9" width="30" height="4" rx="2" fill="#7FD79C" opacity=".55"/></svg>',
    wires: cols => `<svg viewBox="0 0 70 ${12 + cols.length * 6}" aria-hidden="true">${cols.map((c, i) => { const d = `M6 ${8 + i * 6}C24 ${i * 6 - 2} 46 ${i * 6 + 18} 64 ${8 + i * 6}`; return `<path d="${d}" stroke="rgba(0,0,0,.45)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${WIRE[c][0]}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`; }).join('')}</svg>`,
  };
  /* wire summary: {black: 5, red: 2} -> "黑 5、紅 2" with colour dots */
  const wireText = w => Object.entries(w).map(([c, n]) => `<span class="kit-wire"><i style="background:${WIRE[c][0]}"></i>${WIRE[c][1]} ${n}</span>`).join('');

  /* ---------- materials table ---------- */
  /* rows: [{icon, name, look, qty, use}] */
  function table(rows) {
    return `<div class="tbl-wrap"><table class="tbl kit-tbl"><thead><tr><th></th><th>材料</th><th>怎樣認出它</th><th>數量</th><th>用途</th></tr></thead><tbody>${rows.map(r =>
      `<tr><td class="kit-ic">${r.icon || ''}</td><td><b>${r.name}</b></td><td>${r.look}</td><td class="kit-qty">${r.qty}</td><td>${r.use}</td></tr>`).join('')}</tbody></table></div>`;
  }
  /* common rows */
  const ROW = {
    uno: (use = '執行你的程式，控制電路') => ({ icon: ICON.uno, name: 'Arduino UNO', look: '藍色電路板（DFRduino UNO R3），有一個方形 USB 插口', qty: '1', use }),
    usb: () => ({ icon: ICON.usb, name: 'USB 線', look: '一頭方形（插 UNO），一頭扁形（插電腦）', qty: '1', use: '上傳程式，同時供電給 UNO' }),
    board: () => ({ icon: ICON.board, name: '麵包板', look: '白色，中間有 a–j 行、1–30 號；兩邊有紅（+）藍（−）線的電源軌', qty: '1', use: '不用焊接就可以把零件接在一起' }),
    res: (ohm, qty, use) => ({ icon: ICON.res(ohm), name: `電阻 ${RES[ohm].label}`, look: `藍色身，五條色環：<b>${bandWords(ohm)}</b>（有 <b>${RES[ohm].reds}</b> 條紅色）<br><span class="muted small">包裝袋寫「${RES[ohm].bag}」</span>`, qty: String(qty), use }),
    wires: (w, use = '連接 UNO 和麵包板') => ({ icon: ICON.wires(Object.keys(w)), name: '杜邦線（公對公）', look: '兩頭都是針，可以直接插入麵包板和 UNO<div class="kit-wires">' + wireText(w) + '</div>', qty: String(Object.values(w).reduce((a, b) => a + b, 0)), use }),
    buzzer: (use) => ({ icon: ICON.buzzer, name: '蜂鳴器', look: '黑色圓形，兩隻腳；<b>沒有正負極</b>，兩隻腳可以對調', qty: '1', use }),
    tilt: (use) => ({ icon: ICON.tilt, name: '傾斜開關', look: '綠色小圓柱，兩隻腳；搖動時入面有「沙沙」聲（小鋼珠）', qty: '1', use }),
    btn: (use) => ({ icon: ICON.btn, name: '按鈕', look: '黑色方形，<b>4 隻腳</b>，中間有一粒圓掣', qty: '1', use }),
  };

  /* ---------- resistor identification card ---------- */
  function bigRes(ohm, opts = {}) {
    const r = RES[ohm], xs = [52, 70, 88, 106, 136];
    return `<svg viewBox="0 0 200 ${opts.noWords ? 40 : 62}" class="kit-bigres" aria-label="${opts.noWords ? '電阻' : r.label + ' 電阻，色環' + bandWords(ohm)}">
      <path d="M4 20H196" stroke="#9AA3A7" stroke-width="3"/>
      <rect x="38" y="6" width="124" height="28" rx="12" fill="#4A8BD6" stroke="#2C5E9A" stroke-width="1.5"/>
      <rect x="44" y="10" width="112" height="5" rx="2.5" fill="#fff" opacity=".18"/>
      ${r.bands.map((b, i) => `<rect x="${xs[i]}" y="6" width="9" height="28" fill="${BAND[b][0]}"/>`).join('')}
      ${opts.noWords ? '' : r.bands.map((b, i) => `<text x="${xs[i] + 4.5}" y="52" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor">${BAND[b][1]}</text>`).join('')}
    </svg>`;
  }
  /* use: [[ohm, '用途'], ...]; warn: other resistor values in the kit that look similar */
  function resCard(use, warn = []) {
    return `<div class="kit-rescard">
      <div class="kit-resrow">${use.map(([ohm, u]) => `<div class="kit-res"><div class="kit-res-h"><b>${RES[ohm].label}</b><span>${u}</span></div>${bigRes(ohm)}<p class="small">有 <b>${RES[ohm].reds}</b> 條紅色 · 包裝袋寫「${RES[ohm].bag}」</p></div>`).join('')}</div>
      <div class="alert info" style="margin-top:10px"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.8 5.5h1.6V12H7.2zM8 3.6a1 1 0 110 2 1 1 0 010-2z"/></svg><div><b>最易的方法：數紅色環。</b>${use.map(([ohm]) => `${RES[ohm].label} 有 ${RES[ohm].reds} 條紅色`).join('；')}。
        ${warn.length ? `<br>小心：套件還有 ${warn.map(o => `${RES[o].label}（${bandWords(o)}，${RES[o].reds ? RES[o].reds + ' 條紅色' : '<b>沒有</b>紅色'}）`).join('、')}，樣子很相似，不要用錯。` : ''}
        <br>色環看不清楚？先把電阻留在<b>包裝袋</b>內，用的時候才拿出來。</div></div>
    </div>`;
  }

  /* ---------- quick resistor quiz (not scored) ---------- */
  /* qs: [{ask, ans}], opts: ohm values shown as choices; st: object to remember result */
  function quiz(el, qs, choices, st, onDone) {
    let qi = st.done ? qs.length : (st.qi || 0);
    const draw = msg => {
      if (qi >= qs.length) {
        el.innerHTML = `<div class="alert ok"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-1 10.2L3.8 8l1.2-1.2 2 2 4-4L12.2 6z"/></svg><div><b>你已經懂得分辨電阻！</b>接真的電路時，也用同一個方法：數紅色環。</div></div>`;
        return;
      }
      const q = qs[qi];
      el.innerHTML = `<p class="kit-q"><b>第 ${qi + 1} / ${qs.length} 題：</b>${q.ask}</p>
        <div class="kit-choices">${choices.map((o, i) => `<button class="kit-choice" data-o="${o}" aria-label="選項 ${'ABC'[i]}"><span class="kit-ch-l">${'ABC'[i]}</span>${bigRes(o, { noWords: true })}</button>`).join('')}</div>
        <p class="small kit-msg" role="status">${msg || '點選正確的電阻。'}</p>`;
      $$('.kit-choice', el).forEach(b => b.onclick = () => {
        if (+b.dataset.o === q.ans) { qi++; st.qi = qi; if (qi >= qs.length) { st.done = true; onDone && onDone(); } save(); draw(); }
        else { b.classList.add('bad'); $('.kit-msg', el).innerHTML = `<span style="color:var(--err)">不對。</span>${q.tip}`; }
      });
    };
    draw();
  }

  return { RES, ICON, ROW, WIRE, table, resCard, bigRes, quiz, bandWords, wireText };
})();
