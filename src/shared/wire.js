/* =====================================================================
   接線輔助（各堂共用）
   - 兩種位置兩種寫法：UNO 腳位（深藍標籤）、麵包板位置（白色標籤）
   - 滑鼠停在腳位 / 孔上的放大標籤
   - 麵包板分區淡色底、目前步驟用到的腳位放大標示
   - 「太擠」提示（不扣分）
   - 實物接線清單（按學生自己的模擬器接線）
   ===================================================================== */
const WIRE = (() => {
  const H = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* ---------- names ---------- */
  const pinShort = n => (n === 'GND2' || n === 'GND3') ? 'GND' : n === '3V3' ? '3.3V' : n === 'VIN' ? 'Vin' : n;
  const PRINTED = n => /^D\d+$/.test(n) ? ({ D3: '~3', D5: '~5', D6: '~6', D9: '~9', D10: '~10', D11: '~11' }[n] || n.slice(1)) : pinShort(n);
  const RAIL = { tp: '「+」電源軌', tn: '「−」電源軌', bp: '下方「+」電源軌', bn: '下方「−」電源軌' };
  const SERVO = { SVG: '伺服馬達插頭（啡線）', SV5: '伺服馬達插頭（紅線）', SVS: '伺服馬達插頭（橙線）' };
  const parse = id => { const m = /^(tp|tn|bp|bn|[a-j])(\d+)$/.exec(id); return m ? { row: m[1], col: +m[2] } : null; };

  /* ---------- tags used in step text, hints and error messages ---------- */
  const pin = n => `<span class="tag-pin">UNO ${pinShort(n)}</span>`;
  const hole = id => `<span class="tag-hole">麵包板 ${id}</span>`;
  const col = c => `<span class="tag-col">第 ${c} 直行</span>`;
  const rail = sign => `<span class="tag-rail ${sign === '+' ? 'p' : 'n'}">「${sign}」電源軌</span>`;
  /* any point id: 'P:D12' / 'f13' / 'tp4' */
  function tag(id) {
    if (!id) return '';
    if (id.startsWith('P:')) { const n = id.slice(2); return SERVO[n] ? `<span class="tag-sv">${SERVO[n]}</span>` : pin(n); }
    const q = parse(id); if (!q) return H(id);
    if (RAIL[q.row]) return rail(q.row.endsWith('p') ? '+' : '−');
    return hole(id);
  }

  /* ---------- hover label (big) ---------- */
  function tipPin(n, desc) {
    if (SERVO[n]) return `<span class="tag-sv big">${SERVO[n]}</span>`;
    const printed = PRINTED(n);
    const extra = /^D\d+$/.test(n) ? `數位腳 · 板上印「${printed}」` : /^A\d$/.test(n) ? '類比輸入腳' : (desc || '');
    return `<span class="tag-pin big">UNO ${pinShort(n)}</span><span class="tip-sub">${extra}</span>`;
  }
  function tipHole(id) {
    const q = parse(id); if (!q) return H(id);
    if (RAIL[q.row]) return `${rail(q.row.endsWith('p') ? '+' : '−')}<span class="tip-sub">${q.row[0] === 'b' ? '下方 · ' : ''}整條相通</span>`;
    const half = 'abcde'.includes(q.row) ? 'a 至 e' : 'f 至 j';
    return `<span class="tag-hole big">麵包板 ${id}</span><span class="tip-sub">${half} 的第 ${q.col} 直行相通</span>`;
  }

  /* ---------- zones on the breadboard (light bands with a name) ---------- */
  /* zones: [{name, from, to, half: 'top'|'bot', hue, faded}] ; g: {colX, BY} */
  const HUE = ['#2F80ED', '#E0A800', '#27AE60', '#9B51E0', '#EB5757', '#00A3A3'];
  function zonesSVG(zones, g) {
    return zones.map((z, i) => {
      const c = z.hue || HUE[i % HUE.length];
      const x1 = g.colX(z.from) - 10, x2 = g.colX(z.to) + 10;
      const both = z.half === 'both', top = z.half !== 'bot';
      const y1 = g.BY + (top ? 72 : 194), y2 = g.BY + (both || !top ? 296 : 175);
      const ry = g.BY + (top ? 172 : 187);
      return `<g class="zone${z.faded ? ' faded' : ''}" pointer-events="none">
        <rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" rx="6" fill="${c}" fill-opacity="${z.faded ? 0.05 : 0.12}" stroke="${c}" stroke-opacity="${z.faded ? 0.25 : 0.65}" stroke-dasharray="5 4"/>
        <rect x="${(x1 + x2) / 2 - z.name.length * 6 - 6}" y="${ry}" width="${z.name.length * 12 + 12}" height="14" rx="7" fill="${c}" fill-opacity="${z.faded ? 0.35 : 0.92}"/>
        <text x="${(x1 + x2) / 2}" y="${ry + 11}" font-size="10.5" font-weight="700" fill="#fff" text-anchor="middle">${z.name}</text>
      </g>`;
    }).join('');
  }
  /* big labels above the UNO pins that the current step uses */
  function pinCallouts(ids, P) {
    return ids.filter(id => id && id.startsWith('P:') && !SERVO[id.slice(2)] && P[id]).map(id => {
      const q = P[id], n = pinShort(id.slice(2)), w = n.length * 9 + 18;
      const up = q.y < 300, by = up ? q.y - 42 : q.y - 46;
      return `<g class="pincall" pointer-events="none">
        <path d="M${q.x} ${q.y - 9}L${q.x - 6} ${by + 22}H${q.x + 6}Z" fill="#0B3D63"/>
        <rect x="${q.x - w / 2}" y="${by}" width="${w}" height="24" rx="6" fill="#0B3D63" stroke="#fff" stroke-width="1.5"/>
        <text x="${q.x}" y="${by + 17}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle" font-family="var(--f-mono, monospace)">${n}</text>
        <circle cx="${q.x}" cy="${q.y}" r="8" fill="none" stroke="#FFD27A" stroke-width="2.5"/>
      </g>`;
    }).join('');
  }

  /* ---------- 「太擠」: legs of two different parts in neighbouring columns (same half), not joined ---------- */
  /* parts: [{id, name, legs:[holeIds]}] ; same(a, b) -> true if the two holes are in the same net */
  function crowded(parts, same) {
    const out = [];
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const A = parts[i], B = parts[j];
      if (A.legs.some(a => B.legs.some(b => a && b && same(a, b)))) continue;   // joined parts belong to the same small circuit
      let hit = null;
      A.legs.forEach(a => B.legs.forEach(b => {
        const qa = parse(a), qb = parse(b); if (!qa || !qb || hit) return;
        const ha = 'abcde'.includes(qa.row), hb = 'abcde'.includes(qb.row);
        if (ha === hb && Math.abs(qa.col - qb.col) === 1 && !same(a, b)) hit = [qa.col, qb.col].sort((x, y) => x - y);
      }));
      if (hit) out.push(`<b>${A.name}</b>和<b>${B.name}</b>插在相鄰的直行（第 ${hit[0]} 和第 ${hit[1]} 直行）。電路沒有錯，但實物上腳容易碰在一起或插錯孔，建議隔開最少 1 個直行。`);
    }
    return out;
  }
  const crowdBox = msgs => msgs.length ? alertBox('warn', `<b>小提醒（不扣分）</b>${msgs.map(m => `<div class="crowd-m">${m}</div>`).join('')}`) : '';

  /* ---------- real-hardware checklist from the student's own layout ---------- */
  const WNAME = { '#2a2a2a': '黑色', '#f4f4f0': '白色', '#d63a2f': '紅色', '#2f6fd6': '藍色', '#2e9b4f': '綠色' };
  const LEDN = { red: '紅色 LED', yellow: '黃色 LED', green: '綠色 LED' };
  const BANDW = { 220: '紅紅黑黑棕', 1000: '棕黑黑棕棕', 10000: '棕黑黑紅棕' };
  const OHMW = { 220: '220Ω', 1000: '1kΩ', 10000: '10kΩ' };
  /* parts: [{type, color, ohm, flipped, legs}] (legs from the lesson's legHoles) ; wires: [{a, b, color}] */
  function partLine(p) {
    const L = p.legs || [];
    const pol = () => { const [a, k] = p.flipped ? [L[1], L[0]] : [L[0], L[1]]; return `長腳（+）插 ${hole(a)}，短腳（−）插 ${hole(k)}`; };
    if (p.type === 'led') return `<b>${LEDN[p.color] || 'LED'}</b>：${pol()}`;
    if (p.type === 'ls') return `<b>光感應器</b>：${pol()}`;
    if (p.type === 'res') return `<b>${OHMW[p.ohm] || ''} 電阻</b>（色環${BANDW[p.ohm] || ''}）：兩端插 ${hole(L[0])} 和 ${hole(L[1])}`;
    if (p.type === 'btn') return `<b>按鈕</b>（跨過中間的坑，腳向上下）：四隻腳插 ${L.map(hole).join('、')}`;
    if (p.type === 'pot') return `<b>電位器</b>（跨過中間的坑）：兩隻外腳插 ${hole(L[0])}、${hole(L[1])}，中間腳插 ${hole(L[2])}`;
    if (p.type === 'pz') return `<b>蜂鳴器</b>：兩隻腳插 ${hole(L[0])} 和 ${hole(L[1])}（不分正負）`;
    if (p.type === 'tilt') return `<b>傾斜開關</b>：兩隻腳插 ${hole(L[0])} 和 ${hole(L[1])}`;
    return `<b>${p.type}</b>：${L.map(hole).join('、')}`;
  }
  function wireLine(w) {
    const c = WNAME[String(w.color).toLowerCase()] || '';
    const ends = [w.a, w.b].sort((x, y) => (y.startsWith('P:') ? 1 : 0) - (x.startsWith('P:') ? 1 : 0));
    return `<i class="wl-sw" style="background:${w.color}"></i><b>${c}導線</b>：${tag(ends[0])} → ${tag(ends[1])}`;
  }
  /* key: S.real field that stores ticks ; returns HTML (bind with bindList) */
  function listHTML(parts, wires, ticks) {
    const row = (k, html) => `<li><label><input type="checkbox" data-wl="${k}" ${ticks && ticks[k] ? 'checked' : ''}><span>${html}</span></label></li>`;
    const pk = parts.map((p, i) => row('p' + i + ':' + (p.legs || []).join(','), partLine(p))).join('');
    const wk = wires.map(w => row('w:' + [w.a, w.b].sort().join('-'), wireLine(w))).join('');
    const ck = [['c1', '每隻腳都插入正確的直行，<b>沒有插到隔離的直行</b>（逐隻數一數號碼）。'], ['c2', 'LED / 感應器的<b>兩隻腳沒有碰在一起</b>，電阻的腳也沒有碰到其他零件。'], ['c3', '每條導線都<b>插到底</b>，沒有插歪到旁邊的孔。']].map(([k, t]) => row('chk:' + k, t)).join('');
    return `<div class="wlist" id="wireList">
      <div class="wl-head"><b>實物接線清單</b><span class="small muted">按你在模擬器的接線列出。接好一項，就剔一項。</span><button class="btn sm ghost" id="wlPrint" type="button">🖨 列印清單</button></div>
      <div class="wl-legend small"><span>${pin('D12')} = Arduino 上的腳位</span><span>${hole('f13')} = 麵包板的孔（行字母 + 直行號碼）</span></div>
      <h4>① 先插元件</h4><ol class="wl">${pk}</ol>
      <h4>② 再接導線</h4><ol class="wl">${wk}</ol>
      <h4>③ 插完後三項檢查</h4><ol class="wl">${ck}</ol>
      <p class="small muted wl-done" id="wlDone"></p>
    </div>`;
  }
  function bindList(root, ticks, onChange) {
    const upd = () => {
      const all = root.querySelectorAll('[data-wl]'), n = [...all].filter(x => x.checked).length;
      const d = root.querySelector('#wlDone'); if (d) d.textContent = `已完成 ${n} / ${all.length} 項` + (n === all.length ? ' ✓ 可以請老師檢查了。' : '');
    };
    root.querySelectorAll('[data-wl]').forEach(cb => cb.addEventListener('change', () => { ticks[cb.dataset.wl] = cb.checked; onChange && onChange(); upd(); }));
    const pr = root.querySelector('#wlPrint');
    if (pr) pr.onclick = () => { document.body.classList.add('print-wl'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('print-wl'), 300); }, 50); };
    upd();
  }

  /* light markup in step text / messages: 〔D12〕 pin · 〔f13〕 hole · 〔第13直行〕 column · 「+」電源軌 rail */
  function fmt(html) {
    return String(html)
      .replace(/〔(D\d{1,2}|A[0-5]|5V|3V3|VIN|GND\d?)〕/g, (_, n) => pin(n))
      .replace(/〔([a-j]\d{1,2})〕/g, (_, id) => hole(id))
      .replace(/〔第(\d{1,2})直行〕/g, (_, c) => col(c))
      .replace(/(^|[^>和])「([+−])」電源軌/g, (_, pre, sg) => pre + rail(sg));
  }
  /* ---------- 分辨小題：UNO 腳位 vs 麵包板位置（不計分） ---------- */
  const PQ = [
    { want: 'P:D12', ask: '點選 Arduino 上的 <b>D12</b> 腳（板上印 12）。' },
    { want: 'f13', ask: '點選麵包板的 <b>f13</b>（f 行、第 13 直行）。' },
    { want: 'P:D9', ask: '點選 Arduino 上的 <b>D9</b> 腳（板上印 <b>~9</b>）。' },
    { want: 'j7', ask: '點選麵包板的 <b>j7</b>（j 行、第 7 直行）。' },
  ];
  const PQ_PINS = [['SCL', 'SCL'], ['SDA', 'SDA'], ['AREF', 'AREF'], ['GND', 'GND'], ['D13', '13'], ['D12', '12'], ['D11', '~11'], ['D10', '~10'], ['D9', '~9'], ['D8', '8'], null, ['D7', '7'], ['D6', '~6'], ['D5', '~5'], ['D4', '4'], ['D3', '~3'], ['D2', '2'], ['D1', 'TX→1'], ['D0', 'RX←0']];
  function pinQuizSVG() {
    let s = '<rect x="0" y="0" width="760" height="300" rx="10" fill="#1E5A4B"/>';
    // UNO top header (as printed on the board)
    s += '<rect x="14" y="14" width="732" height="86" rx="8" fill="#0E7C9B"/><text x="30" y="92" font-size="12" fill="#CFEFFF" font-weight="700">Arduino UNO 上方的排針（DIGITAL）</text>';
    let x = 40;
    PQ_PINS.forEach(p => {
      if (!p) { x += 18; return; }
      const [id, lab] = p;
      s += `<g class="pq-pt" data-pq="P:${id}" style="cursor:pointer"><rect x="${x - 15}" y="20" width="30" height="64" fill="transparent"/><rect x="${x - 8}" y="26" width="16" height="16" rx="2" fill="#1B1B1B"/><rect x="${x - 3}" y="31" width="6" height="6" fill="#555"/><text x="${x}" y="${lab.length > 3 ? 70 : 62}" font-size="${lab.length > 3 ? 9 : 12}" fill="#fff" text-anchor="middle" font-weight="700" ${lab.length > 3 ? `transform="rotate(-90 ${x} 64)"` : ''}>${lab}</text></g>`;
      x += 34;
    });
    // breadboard top half: rows j..f, columns 1..15
    s += '<rect x="14" y="116" width="732" height="170" rx="8" fill="#F3F2EC"/><text x="30" y="280" font-size="12" fill="#5B6B6C" font-weight="700">麵包板（上半部）</text>';
    const rows = ['j', 'i', 'h', 'g', 'f'];
    for (let c = 1; c <= 15; c++) s += `<text x="${90 + (c - 1) * 42}" y="138" font-size="12" fill="#555" text-anchor="middle" font-weight="${c % 5 ? 400 : 700}">${c}</text>`;
    rows.forEach((r, i) => {
      const y = 158 + i * 22;
      s += `<text x="44" y="${y + 4}" font-size="12" fill="#555" text-anchor="middle">${r}</text>`;
      for (let c = 1; c <= 15; c++) { const cx = 90 + (c - 1) * 42; s += `<g class="pq-pt" data-pq="${r}${c}" style="cursor:pointer"><rect x="${cx - 18}" y="${y - 10}" width="36" height="20" fill="transparent"/><rect x="${cx - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="#3A3A3A"/></g>`; }
    });
    return `<svg viewBox="0 0 760 300" class="pq-svg" role="img" aria-label="Arduino 排針和麵包板">${s}<g id="pqMark"></g></svg>`;
  }
  function pinQuiz(store, onChange) {
    let k = 0, tries = 0;
    const html = `<p class="small muted">Arduino 的腳位寫成 <b>D12</b>、<b>A0</b>；麵包板的孔寫成<b>行字母 + 直行號碼</b>，例如 <b>f13</b>。兩樣東西的數字<b>沒有關係</b>。這個小練習不計分。</p>
      <div class="pq-q" id="pqQ"></div><div class="pq-wrap">${pinQuizSVG()}</div><div id="pqFb" class="pq-fb"></div>`;
    modal({ title: '小練習：分辨腳位和麵包板位置', wide: true, html, actions: [{ label: '關閉', kind: 'ghost' }], onOpen: back => {
      const q = () => { back.querySelector('#pqQ').innerHTML = k < PQ.length ? `<b>第 ${k + 1} / ${PQ.length} 題</b>　${PQ[k].ask}` : '<b>全部完成！</b>　記住：<b>D 幾</b>是 Arduino 的腳，<b>字母 + 數字</b>是麵包板的孔。'; };
      const mark = (id, ok) => { const g = back.querySelector(`[data-pq="${id}"]`); if (!g) return; const r = g.querySelector('rect:nth-child(2)'); const b = r.getBBox(); back.querySelector('#pqMark').innerHTML = `<circle cx="${b.x + b.width / 2}" cy="${b.y + b.height / 2}" r="12" fill="none" stroke="${ok ? '#2ECC71' : '#E74C3C'}" stroke-width="3"/>`; };
      q();
      back.querySelectorAll('[data-pq]').forEach(g => g.addEventListener('click', () => {
        if (k >= PQ.length) return;
        const id = g.dataset.pq, want = PQ[k].want, fb = back.querySelector('#pqFb');
        if (id === want) {
          mark(id, true); k++; fb.innerHTML = alertBox('ok', '答對了！'); store.right = (store.right || 0) + 1;
          if (k >= PQ.length) { store.done = true; store.tries = tries; }
          onChange && onChange(); q(); return;
        }
        tries++; mark(id, false);
        const isPin = id.startsWith('P:'), wantPin = want.startsWith('P:');
        const nm = isPin ? id.slice(2) : id;
        let msg = `你點了${isPin ? ` Arduino 的 <b>${nm}</b>` : `麵包板的 <b>${nm}</b>`}，再試一次。`;
        if (wantPin && !isPin) msg = `這是<b>麵包板的孔 ${nm}</b>，不是 Arduino 的腳。${want.slice(2)} 在 Arduino 上方的排針。`;
        if (!wantPin && isPin) msg = `這是 <b>Arduino 的 ${nm} 腳</b>，不是麵包板的孔。${want} 在下面的麵包板：先找 ${want[0]} 行，再數到第 ${want.slice(1)} 直行。`;
        fb.innerHTML = alertBox('err', msg);
      }));
    } });
  }
  return { pinQuiz, fmt, pin, hole, col, rail, tag, tipPin, tipHole, zonesSVG, pinCallouts, crowded, crowdBox, listHTML, bindList, partLine, wireLine, PRINTED, pinShort };
})();
