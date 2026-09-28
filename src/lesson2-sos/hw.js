/* =====================================================================
   硬件接線模擬器
   ===================================================================== */
const HW = (() => {
  const UX = 24, UY = 150, UW = 420, UH = 320;       // Arduino UNO
  const BX = 500, BY = 96, BW = 560, BH = 368;       // breadboard
  const PITCH = 20, COLS = 25;
  const TRAY = { x: 24, y: 490, w: 1042, h: 138 };
  const TRASH = { x: 930, y: 506, w: 122, h: 108 };
  const LED_TRAY = [{ x: 95, y: 596 }, { x: 115, y: 596 }];
  const RES_TRAY = [{ x: 206, y: 578 }, { x: 286, y: 578 }];
  const COLORS = [['#F2A91E', '黃'], ['#EE6B1F', '橙'], ['#D63A2F', '紅'], ['#2A2A2A', '黑'], ['#2E9B4F', '綠'], ['#2F6FD6', '藍']];

  /* ---------- points (pins + holes) ---------- */
  const P = {};            // id -> {x,y,kind,label,group,name}
  const PIN_IDS = [];
  const HOLE_IDS = [];
  const PIN_LABEL = { SCL: 'SCL', SDA: 'SDA', AREF: 'AREF', GND: 'GND', GND2: 'GND', GND3: 'GND', '5V': '5V', '3V3': '3.3V', VIN: 'Vin', IOREF: 'IOREF', RESET: 'RESET' };
  const PIN_DESC = n => {
    if (/^D\d+$/.test(n)) return `${n}（數位腳 ${n.slice(1)}）${n === 'D0' ? ' · RX' : n === 'D1' ? ' · TX' : ''}`;
    if (/^A\d$/.test(n)) return `${n}（類比輸入腳）`;
    return ({ GND: 'GND（接地 · 電源負極）', GND2: 'GND（接地 · 電源負極）', GND3: 'GND（接地 · 電源負極）', '5V': '5V（電源正極 5V）', '3V3': '3.3V（電源正極 3.3V）', VIN: 'Vin（外接電源輸入）', RESET: 'RESET（重設）', IOREF: 'IOREF', AREF: 'AREF（類比參考電壓）', SCL: 'SCL（I2C 時鐘）', SDA: 'SDA（I2C 數據）' })[n] || n;
  };
  const pinName = n => (n === 'GND2' || n === 'GND3') ? 'GND' : n;
  function addPin(name, x, y) { const id = 'P:' + name; P[id] = { x, y, kind: 'pin', name, label: PIN_DESC(name) }; PIN_IDS.push(id); }
  const TOP1 = ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'];
  const TOP2 = ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];
  const BOT1 = ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND2', 'GND3', 'VIN'];
  const BOT2 = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
  const topY = UY + 16, botY = UY + UH - 16;
  const TOP1X = i => UX + 128 + i * 15, TOP2X = i => UX + 292 + i * 15;
  const BOT1X = i => UX + 158 + i * 15, BOT2X = i => UX + 292 + i * 15;
  TOP1.forEach((n, i) => addPin(n, TOP1X(i), topY));
  TOP2.forEach((n, i) => addPin(n, TOP2X(i), topY));
  BOT1.forEach((n, i) => n !== 'NC' && addPin(n, BOT1X(i), botY));
  BOT2.forEach((n, i) => addPin(n, BOT2X(i), botY));

  const ROWY = { tp: 24, tn: 44, a: 84, b: 104, c: 124, d: 144, e: 164, f: 204, g: 224, h: 244, i: 264, j: 284, bn: 324, bp: 344 };
  const ROWS = Object.keys(ROWY);
  const colX = c => BX + 40 + (c - 1) * PITCH;
  const groupOf = (row, c) => ({ tp: 'TP', tn: 'TN', bp: 'BP', bn: 'BN' })[row] || ('abcde'.includes(row) ? 'T' + c : 'B' + c);
  const RAIL_NAME = { tp: '上方「+」電源軌', tn: '上方「−」電源軌', bn: '下方「−」電源軌', bp: '下方「+」電源軌' };
  ROWS.forEach(row => { for (let c = 1; c <= COLS; c++) {
    const id = row + c;
    P[id] = { x: colX(c), y: BY + ROWY[row], kind: 'hole', row, col: c, group: groupOf(row, c) };
    HOLE_IDS.push(id);
  } });
  const parseHole = id => { const m = /^(tp|tn|bp|bn|[a-j])(\d+)$/.exec(id); return m ? { row: m[1], col: +m[2] } : null; };
  const holeAt = (row, col) => (col >= 1 && col <= COLS) ? row + col : null;
  const holeLabel = id => {
    const h = P[id]; if (!h) return id;
    if (RAIL_NAME[h.row]) return `${RAIL_NAME[h.row]} · 整條相通`;
    const half = 'abcde'.includes(h.row) ? 'a–e' : 'f–j';
    return `孔 <b>${id}</b> · 與 ${half.replace('–', h.col + '–')}${h.col} 相通`;
  };

  /* ---------- part geometry ---------- */
  const ledHoles = led => { const p = parseHole(led.h1); return [led.h1, holeAt(p.row, p.col + 1)]; };
  const resHoles = res => { const p = parseHole(res.h1); return [res.h1, holeAt(p.row, p.col + 4)]; };
  const ledAK = led => { const [h1, h2] = ledHoles(led); return led.flipped ? { a: h2, k: h1 } : { a: h1, k: h2 }; };
  function ledLegs(st = S.hw) { return st.led ? ledHoles(st.led).map(h => P[h]) : LED_TRAY; }
  function resLegs(st = S.hw) { return st.res ? resHoles(st.res).map(h => P[h]) : RES_TRAY; }

  /* ---------- SVG builders ---------- */
  function ledSVG(p1, p2, flipped, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y, cy = y - 27;
    const ax = flipped ? p2.x : p1.x, kx = flipped ? p1.x : p2.x;
    const ax0 = flipped ? mx + 5 : mx - 5, kx0 = flipped ? mx - 5 : mx + 5;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="led"${op}>
      ${opts.lit !== undefined ? `<circle class="ledglow" cx="${mx}" cy="${cy}" r="30" fill="url(#glow)" opacity="${opts.lit ? 1 : 0}"/>` : ''}
      <path d="M${kx0} ${y - 15}L${kx} ${y}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${ax0} ${y - 15}V${y - 11}L${ax} ${y - 5}V${y}" stroke="#B9BEC0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${mx - 10} ${cy + 8}V${cy}A10 10 0 0 1 ${mx + 10} ${cy}V${cy + 8}Z" fill="${opts.lit ? '#FF5B45' : '#D8321F'}" class="ledbody"/>
      <path d="M${mx - 6} ${cy - 2}A6 6 0 0 1 ${mx} ${cy - 7}" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>
      <rect x="${mx - 12}" y="${cy + 8}" width="24" height="4" rx="1" fill="#A92414"/>
      ${opts.noSigns ? '' : `<text x="${ax + (flipped ? 9 : -9)}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#FFD34D">+</text>
      <text x="${kx + (flipped ? -9 : 9)}" y="${y - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#9FD3FF">−</text>`}
    </g>`;
  }
  function resSVG(p1, p2, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="res"${op}>
      <path d="M${p1.x} ${y}H${p2.x}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="${mx - 23}" y="${y - 8}" width="46" height="16" rx="7" fill="#E4CFA6" stroke="#B89C6C"/>
      <rect x="${mx - 15}" y="${y - 8}" width="4.5" height="16" fill="#D12B2B"/>
      <rect x="${mx - 7}" y="${y - 8}" width="4.5" height="16" fill="#D12B2B"/>
      <rect x="${mx + 1}" y="${y - 8}" width="4.5" height="16" fill="#7A4A1E"/>
      <rect x="${mx + 11}" y="${y - 8}" width="3.5" height="16" fill="#C9A227"/>
    </g>`;
  }
  function wirePath(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const lift = Math.min(90, 14 + d * 0.28);
    return `M${a.x} ${a.y}C${a.x + dx * .2} ${a.y - lift} ${b.x - dx * .2} ${b.y - lift} ${b.x} ${b.y}`;
  }
  function wireSVG(w, opts = {}) {
    const a = opts.pa || P[w.a], b = opts.pb || P[w.b];
    const d = wirePath(a, b);
    return `<g class="wire" ${opts.ghost ? 'opacity=".8"' : ''}>
      ${opts.sel ? `<path d="${d}" stroke="#fff" stroke-opacity=".6" stroke-width="11" fill="none" stroke-linecap="round"/>` : ''}
      <path d="${d}" stroke="rgba(0,0,0,.45)" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="${d}" stroke="${w.color}" stroke-width="4.6" fill="none" stroke-linecap="round"/>
      <rect x="${a.x - 4}" y="${a.y - 4}" width="8" height="8" rx="1.5" fill="#3a3a3a" stroke="${w.color}" stroke-width="1.2"/>
      <rect x="${b.x - 4}" y="${b.y - 4}" width="8" height="8" rx="1.5" fill="#3a3a3a" stroke="${w.color}" stroke-width="1.2"/>
      ${opts.hit ? `<path d="${d}" stroke="transparent" stroke-width="14" fill="none" data-wire="${w.id}" style="cursor:pointer"/>` : ''}
    </g>`;
  }

  function unoSVG() {
    let s = `<g id="uno">
      <rect x="${UX}" y="${UY}" width="${UW}" height="${UH}" rx="12" fill="#0E7C9B" stroke="#095A70" stroke-width="2"/>
      <rect x="${UX + 6}" y="${UY + 6}" width="${UW - 12}" height="${UH - 12}" rx="8" fill="none" stroke="#1590B0" stroke-width="1"/>
      ${[[UX + 26, UY + 58], [UX + 26, UY + UH - 26], [UX + UW - 18, UY + 22], [UX + UW - 18, UY + UH - 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#1E5A4B" stroke="#D5DEE1" stroke-width="2"/>`).join('')}
      <rect x="${UX - 16}" y="${UY + 34}" width="78" height="64" rx="3" fill="#C9D0D3" stroke="#8B979C" stroke-width="2"/>
      <rect x="${UX - 16}" y="${UY + 46}" width="18" height="40" fill="#A4AEB2"/>
      <text x="${UX + 24}" y="${UY + 70}" font-size="10" fill="#5B676C" text-anchor="middle" font-weight="700">USB</text>
      <rect x="${UX - 12}" y="${UY + 218}" width="66" height="60" rx="3" fill="#1C1C1C"/>
      <circle cx="${UX + 20}" cy="${UY + 248}" r="12" fill="#333"/>
      <rect x="${UX + 76}" y="${UY + 16}" width="26" height="26" rx="3" fill="#C9D0D3"/><circle cx="${UX + 89}" cy="${UY + 29}" r="7" fill="#9A2A20"/>
      <text x="${UX + 89}" y="${UY + 54}" font-size="8" fill="#fff" text-anchor="middle">RESET</text>
      <rect x="${UX + 200}" y="${UY + 186}" width="196" height="42" rx="3" fill="#1E1E1E"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${UX + 206 + i * 13.6}" y="${UY + 180}" width="5" height="6" fill="#B5BCC0"/><rect x="${UX + 206 + i * 13.6}" y="${UY + 228}" width="5" height="6" fill="#B5BCC0"/>`).join('')}
      <text x="${UX + 298}" y="${UY + 211}" font-size="9" fill="#888" text-anchor="middle" font-family="monospace">ATMEGA328P</text>
      <rect x="${UX + 120}" y="${UY + 196}" width="40" height="18" rx="9" fill="#C9D0D3"/>
      <g transform="translate(${UX + 250} ${UY + 122})" fill="none" stroke="#fff" stroke-width="5"><circle cx="-14" cy="0" r="11"/><circle cx="14" cy="0" r="11"/></g>
      <text x="${UX + 244}" y="${UY + 125}" font-size="12" fill="#0E7C9B" font-weight="900" text-anchor="middle">−</text>
      <text x="${UX + 263}" y="${UY + 126}" font-size="12" fill="#0E7C9B" font-weight="900" text-anchor="middle">+</text>
      <text x="${UX + 300}" y="${UY + 118}" font-size="15" fill="#fff" font-weight="700" font-family="Chakra Petch, sans-serif" letter-spacing="1">ARDUINO</text>
      <text x="${UX + 300}" y="${UY + 150}" font-size="30" fill="#fff" font-weight="700" font-style="italic" font-family="Chakra Petch, sans-serif">UNO</text>
      <g fill="#D8D8D8">${[0, 1, 2].map(r => [0, 1].map(c => `<circle cx="${UX + 400 + c * 9}" cy="${UY + 146 + r * 9}" r="2.6"/>`).join('')).join('')}</g>
      <text x="${UX + 268}" y="${UY + 76}" font-size="9" fill="#fff" text-anchor="middle" letter-spacing="1">DIGITAL (PWM ~)</text>
      <text x="${UX + 216}" y="${UY + UH - 60}" font-size="9" fill="#fff" text-anchor="middle" letter-spacing="1">POWER</text>
      <text x="${UX + 330}" y="${UY + UH - 60}" font-size="9" fill="#fff" text-anchor="middle" letter-spacing="1">ANALOG IN</text>
      <rect class="uLedL" x="${UX + 120}" y="${UY + 90}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 96}" font-size="9" fill="#fff">L</text>
      <rect class="uLedTX" x="${UX + 120}" y="${UY + 106}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 112}" font-size="9" fill="#fff">TX</text>
      <rect class="uLedRX" x="${UX + 120}" y="${UY + 122}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 128}" font-size="9" fill="#fff">RX</text>
      <rect class="uLedON" x="${UX + 370}" y="${UY + 100}" width="11" height="6" rx="1" fill="#2E5B3A"/><text x="${UX + 386}" y="${UY + 106}" font-size="9" fill="#fff">ON</text>`;
    const header = (xs, y) => `<rect x="${xs[0] - 8}" y="${y - 8}" width="${xs[xs.length - 1] - xs[0] + 16}" height="16" rx="1.5" fill="#1A1A1A"/>` +
      xs.map(x => `<rect x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" fill="#050505" stroke="#444" stroke-width=".8"/>`).join('');
    s += header(TOP1.map((_, i) => TOP1X(i)), topY) + header(TOP2.map((_, i) => TOP2X(i)), topY);
    s += header(BOT1.map((_, i) => BOT1X(i)), botY) + header(BOT2.map((_, i) => BOT2X(i)), botY);
    const tl = { D13: '13', D12: '12', D11: '~11', D10: '~10', D9: '~9', D8: '8', D7: '7', D6: '~6', D5: '~5', D4: '4', D3: '~3', D2: '2', D1: 'TX→1', D0: 'RX←0' };
    TOP1.concat(TOP2).forEach((n, i) => {
      const x = i < 10 ? TOP1X(i) : TOP2X(i - 10);
      s += `<text transform="translate(${x + 3} ${topY + 12}) rotate(-90)" text-anchor="end" font-size="8.5" fill="#fff" font-family="monospace" ${n === 'D13' || n === 'GND' ? 'font-weight="700"' : ''}>${tl[n] || PIN_LABEL[n] || n}</text>`;
    });
    BOT1.concat(BOT2).forEach((n, i) => {
      const x = i < 8 ? BOT1X(i) : BOT2X(i - 8);
      s += `<text transform="translate(${x + 3} ${botY - 12}) rotate(-90)" font-size="8.5" fill="#fff" font-family="monospace">${n === 'NC' ? '' : (PIN_LABEL[n] || n)}</text>`;
    });
    return s + '</g>';
  }

  function boardSVG() {
    let s = `<g id="bb"><rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="8" fill="#F3F2EC" stroke="#CFCBBE" stroke-width="2"/>
      <rect x="${BX + 10}" y="${BY + 176}" width="${BW - 20}" height="16" rx="3" fill="#E1DED2"/>
      <path d="M${BX + 30} ${BY + 11}H${BX + BW - 30}" stroke="#D63A2F" stroke-width="2"/>
      <path d="M${BX + 30} ${BY + 57}H${BX + BW - 30}" stroke="#2F6FD6" stroke-width="2"/>
      <path d="M${BX + 30} ${BY + 311}H${BX + BW - 30}" stroke="#2F6FD6" stroke-width="2"/>
      <path d="M${BX + 30} ${BY + 357}H${BX + BW - 30}" stroke="#D63A2F" stroke-width="2"/>`;
    [['tp', '+', '#D63A2F'], ['tn', '−', '#2F6FD6'], ['bn', '−', '#2F6FD6'], ['bp', '+', '#D63A2F']].forEach(([r, t, c]) => {
      s += `<text x="${BX + 18}" y="${BY + ROWY[r] + 5}" font-size="15" font-weight="700" fill="${c}" text-anchor="middle">${t}</text><text x="${BX + BW - 18}" y="${BY + ROWY[r] + 5}" font-size="15" font-weight="700" fill="${c}" text-anchor="middle">${t}</text>`;
    });
    'abcdefghij'.split('').forEach(r => {
      s += `<text x="${BX + 20}" y="${BY + ROWY[r] + 4}" font-size="11" fill="#8C897C" text-anchor="middle" font-family="monospace">${r}</text><text x="${BX + BW - 20}" y="${BY + ROWY[r] + 4}" font-size="11" fill="#8C897C" text-anchor="middle" font-family="monospace">${r}</text>`;
    });
    for (let c = 1; c <= COLS; c++) {
      const w = c % 5 === 0 || c === 1 ? '700' : '400';
      s += `<text x="${colX(c)}" y="${BY + 70}" font-size="9" fill="#77746A" font-weight="${w}" text-anchor="middle" font-family="monospace">${c}</text><text x="${colX(c)}" y="${BY + 302}" font-size="9" fill="#77746A" font-weight="${w}" text-anchor="middle" font-family="monospace">${c}</text>`;
    }
    HOLE_IDS.forEach(id => { const h = P[id]; s += `<rect x="${h.x - 3.5}" y="${h.y - 3.5}" width="7" height="7" rx="1.2" fill="#4A4943"/>`; });
    return s + '</g>';
  }
  const DEFS = `<defs>
    <pattern id="matgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1"/></pattern>
    <radialGradient id="glow"><stop offset="0" stop-color="#FF6A4D" stop-opacity=".95"/><stop offset=".45" stop-color="#FF5A3C" stop-opacity=".45"/><stop offset="1" stop-color="#FF5A3C" stop-opacity="0"/></radialGradient>
  </defs>`;

  /* ---------- static circuit snapshot (used on later pages & in the report) ---------- */
  function circuitSVG(st, opts = {}) {
    const h = st || S.hw;
    let parts = '';
    h.wires.forEach(w => parts += wireSVG(w));
    if (h.res) { const [a, b] = resHoles(h.res).map(x => P[x]); parts += resSVG(a, b); }
    if (h.led) { const [a, b] = ledHoles(h.led).map(x => P[x]); parts += ledSVG(a, b, h.led.flipped, { lit: false }); }
    return `<svg viewBox="0 80 1090 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="電路接線圖" style="background:#1E5A4B">${DEFS}<rect x="0" y="80" width="1090" height="400" fill="url(#matgrid)"/>${unoSVG()}${boardSVG()}${parts}</svg>`;
  }

  /* ---------- nets & analysis ---------- */
  function buildNets(h = S.hw) {
    const parent = {};
    const find = x => { if (parent[x] === undefined) parent[x] = x; while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    HOLE_IDS.forEach(id => uni(id, 'G:' + P[id].group));
    uni('P:GND', 'P:GND2'); uni('P:GND', 'P:GND3');
    h.wires.forEach(w => uni(w.a, w.b));
    return find;
  }
  function occupancy(h = S.hw) {
    const o = {};
    if (h.led) ledHoles(h.led).forEach(x => o[x] = { type: 'led' });
    if (h.res) resHoles(h.res).forEach(x => o[x] = { type: 'res' });
    h.wires.forEach(w => { o[w.a] = { type: 'wire', id: w.id, end: 'a' }; o[w.b] = { type: 'wire', id: w.id, end: 'b' }; });
    return o;
  }

  const pinPretty = n => /^D\d+$/.test(n) ? `D${n.slice(1)}（${n.slice(1)} 號腳）` : (PIN_LABEL[n] || n);
  function analyze(h = S.hw) {
    const find = buildNets(h);
    const iss = [];
    const add = (step, code, msg, counts = true) => iss.push({ step, code, msg, counts });
    const pinsIn = net => [...new Set(PIN_IDS.filter(p => find(p) === net).map(p => pinName(P[p].name)))];
    const wiredPins = new Set(h.wires.flatMap(w => [w.a, w.b]).filter(x => x.startsWith('P:')).map(x => pinName(P[x].name)));
    const gnd = find('P:GND'), d13 = find('P:D13');
    // global: short circuits
    ['5V', '3V3', 'VIN'].forEach(n => { if (find('P:' + n) === gnd) add(0, 'short_' + n, `<b>短路！</b>${PIN_LABEL[n]} 和 GND 被直接連在一起，會損壞 Arduino 和電腦的 USB 埠。請立即移除那條線。`); });
    if (d13 === gnd) add(0, 'short_d13', '<b>短路！</b>D13 和 GND 被直接連在一起（中間沒有 LED 和電阻）。D13 輸出 HIGH 時會有很大電流，會損壞 Arduino。');
    ['5V', '3V3', 'VIN'].forEach(n => { if (find('P:' + n) === d13) add(0, 'short_5v_d13', `<b>短路！</b>D13 和 ${PIN_LABEL[n]} 被直接連在一起。`); });

    const out = { iss, find, chain: null };
    let A, K, R1, R2;
    if (!h.led) add(1, 'led_missing', '請先把元件盒中的 LED 拖到麵包板上。', false);
    else {
      const ak = ledAK(h.led); A = find(ak.a); K = find(ak.k);
      if (A === K) add(1, 'led_short', 'LED 兩隻腳插在<b>相通</b>的孔（同一號碼的直行，或同一條電源軌），LED 被短路了，不會亮。請把兩隻腳放在不同號碼的直行。');
    }
    if (!h.res) {
      if (h.led && A !== K && ((d13 === A && K === gnd) || (d13 === K && A === gnd))) add(2, 'no_resistor', '<b>漏接電阻！</b>LED 直接接到 D13 和 GND，中間沒有電阻，電流太大會燒壞 LED。請把 220Ω 電阻串聯在電路中。');
      else add(2, 'res_missing', '請把元件盒中的 220Ω 電阻拖到麵包板上。', false);
    } else {
      const [r1, r2] = resHoles(h.res); R1 = find(r1); R2 = find(r2);
      if (R1 === R2) add(2, 'res_short', '電阻兩隻腳插在相通的孔，電阻被短路，沒有作用。請把它放在同一橫排、跨過不同號碼的直行。');
    }
    if (h.led && h.res && A !== K && R1 !== R2) {
      const sA = R1 === A || R2 === A, sK = R1 === K || R2 === K;
      if (sA && sK) add(2, 'parallel', '電阻兩端分別接到 LED 兩隻腳，變成<b>並聯</b>了。電阻只需要<b>一隻腳</b>和 LED 在同一號碼的直行（串聯）。');
      else if (!sA && !sK) {
        if ((d13 === A && K === gnd) || (d13 === K && A === gnd)) add(2, 'no_resistor', '<b>漏接電阻！</b>LED 直接接到 D13 和 GND，電流沒有經過電阻，會燒壞 LED。電阻要和 LED 串聯。');
        else add(2, 'not_series', '電阻和 LED 沒有連接起來。電阻其中一隻腳要插在和 LED <b>長腳（+）同一號碼</b>的直行，兩者才會串聯。');
      } else {
        const side = sA ? 'anode' : 'cathode';
        const M = sA ? A : K;
        const X = sA ? (R1 === A ? R2 : R1) : A;
        const Y = sA ? K : (R1 === K ? R2 : R1);
        out.chain = { X, Y, M, side };
        const pX = pinsIn(X), pY = pinsIn(Y), pM = pinsIn(M);
        // step 3: D13
        if (d13 === X) { /* ok */ }
        else if (d13 === Y) add(3, 'reversed', '<b>LED 接反了！</b>D13 接到了 LED 短腳（−）那一邊。LED 只可以單向導電：長腳（+）要向 D13，短腳（−）向 GND。<br>方法：點選 LED，按「反轉 LED」。');
        else if (d13 === M) add(3, 'bypass', side === 'anode' ? 'D13 接到了 LED 長腳那一行，電流<b>沒有經過電阻</b>。請把 D13 的線改接到電阻<b>另一端</b>的直行。' : 'D13 接到了 LED 和電阻之間的位置。請把線改接到 LED 長腳（+）的直行。');
        else {
          const other = pX.filter(n => n !== 'GND' && n !== 'D13');
          if (other.length) {
            const n = other[0];
            if (['5V', '3V3', 'VIN'].includes(n)) add(3, 'wrong_pin', `你把電路接到了 <b>${PIN_LABEL[n]}</b>。這樣 LED 只會一直亮，程式不能控制它閃爍。請把線改接到 <b>13</b> 號腳（D13）。`);
            else add(3, 'wrong_pin', `你把線接到了 <b>${pinPretty(n)}</b>，但今次的程式控制的是 <b>D13</b>。請把線改接到 13 號腳。`);
          } else if (pX.includes('GND')) add(3, 'gnd_anode', 'GND 接到了 LED 長腳（+）那一邊，方向反了。長腳那邊要接 D13，短腳（−）那邊才接 GND。');
          else if (!wiredPins.has('D13')) add(3, 'd13_missing', '還未連接 D13。請由 Arduino 上方的 <b>13</b> 號腳拉一條導線到電阻另一端的直行。', false);
          else add(3, 'd13_nowhere', 'D13 的導線接到了<b>沒有元件</b>的位置。導線要插在和電阻另一隻腳<b>同一號碼</b>的直行，才算連接。');
        }
        // step 4: GND
        if (gnd === Y) { /* ok */ }
        else if (gnd === X) add(4, 'gnd_anode', 'GND 接到了 LED 長腳（+）那一邊。長腳要向 D13，短腳（−）那邊才接 GND。');
        else if (gnd === M) add(4, 'gnd_mid', 'GND 接到了 LED 和電阻之間，電流會繞過其中一個元件。請把 GND 接到電路的另一端。');
        else {
          const other = pY.filter(n => n !== 'D13' && n !== 'GND');
          if (other.length) add(4, 'wrong_gnd', `LED 短腳（−）那邊應該接 <b>GND</b>，你接了 <b>${pinPretty(other[0])}</b>。`);
          else if (!wiredPins.has('GND')) add(4, 'gnd_missing', '還未連接 GND。請由 Arduino 的 <b>GND</b> 腳拉一條導線到 LED 短腳（−）的直行。', false);
          else add(4, 'gnd_nowhere', 'GND 的導線接到了<b>沒有元件</b>的位置。導線要插在和 LED 短腳（−）<b>同一號碼</b>的直行。');
        }
        const midOther = pM.filter(n => n !== 'D13' && n !== 'GND');
        if (midOther.length) add(4, 'mid_pin', `LED 和電阻之間的相連點不應該接到 ${pinPretty(midOther[0])}。請移除那條線。`);
      }
    }
    // step 5: stray wires
    h.wires.forEach(w => {
      const n = find(w.a);
      const pins = PIN_IDS.filter(p => find(p) === n && h.wires.some(x => x.a === p || x.b === p)).length;
      let legs = 0;
      if (h.led) ledHoles(h.led).forEach(x => { if (find(x) === n) legs++; });
      if (h.res) resHoles(h.res).forEach(x => { if (find(x) === n) legs++; });
      if (pins + legs < 2) add(5, 'stray', `有一條多餘的導線（${endName(w.a)} → ${endName(w.b)}）沒有連接任何元件，請把它移除。`, false);
    });
    return out;
  }
  const endName = id => id.startsWith('P:') ? pinName(P[id].name) : id;

  /* ---------- steps ---------- */
  const STEPS = [
    { t: '插上 LED' }, { t: '插上 220Ω 電阻' }, { t: '連接 D13（信號）' }, { t: '連接 GND（接地）' }, { t: '最後檢查' },
  ];
  function freeHoleIn(net, find, occ) {
    const cands = HOLE_IDS.filter(id => find(id) === net && !occ[id]);
    cands.sort((a, b) => P[a].y - P[b].y);
    return cands[0] || null;
  }
  function resTarget(h = S.hw) {
    if (!h.led) return { h1: 'c9', h2: 'c13' };
    const { a } = ledAK(h.led); const pa = parseHole(a); if (!pa || RAIL_NAME[pa.row]) return null;
    const occ = occupancy(h); if (h.res) resHoles(h.res).forEach(x => delete occ[x]);
    const rows = 'abcde'.includes(pa.row) ? ['c', 'b', 'a', 'd', 'e'] : ['h', 'i', 'j', 'g', 'f'];
    for (const dir of [-1, 1]) for (const r of rows) {
      if (r === pa.row) continue;
      const c1 = dir < 0 ? pa.col - 4 : pa.col;
      if (c1 < 1 || c1 + 4 > COLS) continue;
      const h1 = holeAt(r, c1), h2 = holeAt(r, c1 + 4);
      if (!occ[h1] && !occ[h2]) return { h1, h2 };
    }
    return null;
  }
  function stepTargets(step) {
    const h = S.hw;
    if (step === 1) return h.led ? [] : ['e13', 'e14'];
    if (step === 2) { const t = resTarget(); return t && !h.res ? [t.h1, t.h2] : []; }
    const an = analyze(); if (!an.chain) return [];
    const occ = occupancy();
    if (step === 3) { const x = freeHoleIn(an.chain.X, an.find, occ); return ['P:D13'].concat(x ? [x] : []); }
    if (step === 4) { const y = freeHoleIn(an.chain.Y, an.find, occ); return ['P:GND'].concat(y ? [y] : []); }
    return [];
  }
  const colOfNet = (net, find) => { const hs = HOLE_IDS.filter(id => find(id) === net); if (!hs.length) return null; const p = P[hs[0]]; return RAIL_NAME[p.row] ? RAIL_NAME[p.row] : `第 ${p.col} 號直行`; };
  function stepBody(step) {
    const h = S.hw;
    if (step === 1) return `<p>把元件盒中的 LED 拖到麵包板。<b>長腳（+）</b>在左，<b>短腳（−）</b>在右，兩隻腳要在<b>不同號碼</b>的直行。</p><p>建議位置：黃色閃動的 <b>e13</b> 和 <b>e14</b>。</p>`;
    if (step === 2) { const t = resTarget(); return `<p>把 220Ω 電阻拖到麵包板，令電阻其中一隻腳和 LED <b>長腳（+）</b>在<b>同一號碼</b>的直行，這樣兩者就串聯起來。</p>${t ? `<p>建議位置：<b>${t.h1}</b> 至 <b>${t.h2}</b>。</p>` : ''}`; }
    const an = analyze();
    if (step === 3) { const c = an.chain ? colOfNet(an.chain.X, an.find) : null; return `<p>選一種導線顏色（建議<b>黃色</b>），在 Arduino 上方的 <b>13</b> 號腳按住，拖到${c ? `電阻另一端的<b>${c}</b>` : '電阻另一端的直行'}，放開滑鼠。</p>`; }
    if (step === 4) { const c = an.chain ? colOfNet(an.chain.Y, an.find) : null; return `<p>選<b>黑色</b>導線，由 Arduino 的 <b>GND</b> 腳（在 13 號腳左邊）拉到 LED <b>短腳（−）</b>的${c ? `<b>${c}</b>` : '直行'}。</p><p class="small">黑色代表負極 / 接地，是電子接線的習慣。</p>`; }
    return `<p>檢查所有導線都接好，沒有多餘的線，然後按「完成接線檢查」。</p>`;
  }

  /* ---------- UI state ---------- */
  let svg, gDyn, gHint, gGroup, gGhost, gFlow;
  let sel = null;          // {type:'led'|'res'|'wire', id}
  let drag = null;
  let lastIssues = null;   // {kind, html}
  let built = false;

  function svgPt(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  function nearestPoint(p, filter) {
    let best = null, bd = 1e9;
    for (const id in P) {
      const q = P[id]; const r = q.kind === 'pin' ? 8.5 : 10.5;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= r && d < bd && (!filter || filter(id))) { best = id; bd = d; }
    }
    return best;
  }
  function nearestHoleForLeg(p) {
    let best = null, bd = 16;
    for (const id of HOLE_IDS) { const q = P[id]; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = id; } }
    return best;
  }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  function partBox(type) {
    const legs = type === 'led' ? ledLegs() : resLegs();
    const [a, b] = legs;
    if (type === 'led') { const mx = (a.x + b.x) / 2; return { x: mx - 15, y: a.y - 42, w: 30, h: 40 }; }
    return { x: a.x + 12, y: a.y - 10, w: b.x - a.x - 24, h: 20 };
  }

  function build() {
    svg = $('#hwSvg');
    svg.innerHTML = DEFS + `<rect x="0" y="0" width="1090" height="640" fill="url(#matgrid)"/>` + unoSVG() + boardSVG() +
      `<g id="tray"><rect x="${TRAY.x}" y="${TRAY.y}" width="${TRAY.w}" height="${TRAY.h}" rx="12" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.15)"/>
        <text x="${TRAY.x + 16}" y="${TRAY.y + 22}" font-size="13" fill="#CFE3DD" font-weight="700">元件盒</text>
        <rect x="44" y="${TRAY.y + 32}" width="122" height="96" rx="8" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>
        <text x="105" y="${TRAY.y + 122}" font-size="11" fill="#CFE3DD" text-anchor="middle" id="trayLedLbl">LED（紅）</text>
        <rect x="178" y="${TRAY.y + 32}" width="136" height="96" rx="8" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>
        <text x="246" y="${TRAY.y + 122}" font-size="11" fill="#CFE3DD" text-anchor="middle" id="trayResLbl">電阻 220Ω</text>
        <text x="340" y="${TRAY.y + 58}" font-size="13" fill="#CFE3DD">拉導線：在 Arduino 的腳位或麵包板的孔上<tspan font-weight="700" fill="#fff">按住滑鼠</tspan>，</text>
        <text x="340" y="${TRAY.y + 80}" font-size="13" fill="#CFE3DD">拖到另一個孔再放開。導線顏色在上方選擇。</text>
        <text x="340" y="${TRAY.y + 108}" font-size="12" fill="#9DBDB3">把滑鼠停在孔上，會顯示它的名稱和哪些孔相通。</text>
        <rect x="${TRASH.x}" y="${TRASH.y}" width="${TRASH.w}" height="${TRASH.h}" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.3)" stroke-dasharray="5 4" id="trashZone"/>
        <g transform="translate(${TRASH.x + TRASH.w / 2 - 12} ${TRASH.y + 22})" fill="none" stroke="#CFE3DD" stroke-width="2"><path d="M2 6h20M8 6V3h8v3M5 6l1.5 18h11L19 6"/></g>
        <text x="${TRASH.x + TRASH.w / 2}" y="${TRASH.y + 74}" font-size="12" fill="#CFE3DD" text-anchor="middle">回收區</text>
        <text x="${TRASH.x + TRASH.w / 2}" y="${TRASH.y + 92}" font-size="10.5" fill="#9DBDB3" text-anchor="middle">拖到這裏移除</text>
      </g>
      <g id="gGroup"></g><g id="gHint"></g><g id="gDyn"></g><g id="gFlow"></g><g id="gGhost"></g>`;
    gDyn = $('#gDyn'); gHint = $('#gHint'); gGroup = $('#gGroup'); gGhost = $('#gGhost'); gFlow = $('#gFlow');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', () => { drag = null; gGhost.innerHTML = ''; render(); });
    svg.addEventListener('pointerleave', () => { if (!drag) { hideTip(); gGroup.innerHTML = ''; } });
    svg.addEventListener('dblclick', e => { const p = svgPt(e); if (S.hw.led && inRect(p, partBox('led')) && !S.hw.done) flipLed(); });
    $('#swatches').innerHTML = COLORS.map(([c, n]) => `<button class="sw" style="background:${c}" data-c="${c}" title="${n}色導線" aria-label="${n}色導線"></button>`).join('');
    $$('#swatches .sw').forEach(b => b.onclick = () => { S.hw.color = b.dataset.c; save(); renderSwatches(); });
    document.addEventListener('keydown', e => {
      if (S && S.stage === 'hw' && !S.hw.done && sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !$('.modal-back')) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); }
        if ((e.key === 'r' || e.key === 'R') && sel.type === 'led') flipLed();
      }
    });
    built = true;
  }
  function renderSwatches() { $$('#swatches .sw').forEach(b => b.classList.toggle('sel', b.dataset.c === S.hw.color)); }

  function render() {
    const h = S.hw;
    let s = '';
    h.wires.forEach(w => s += wireSVG(w, { hit: true, sel: sel && sel.type === 'wire' && sel.id === w.id }));
    const hideLed = drag && drag.kind === 'part' && drag.part === 'led' && drag.moved;
    const hideRes = drag && drag.kind === 'part' && drag.part === 'res' && drag.moved;
    if (!hideRes) { const [a, b] = resLegs(); s += (sel && sel.type === 'res' ? selBox('res') : '') + resSVG(a, b); }
    if (!hideLed) { const [a, b] = ledLegs(); s += (sel && sel.type === 'led' ? selBox('led') : '') + ledSVG(a, b, h.led ? h.led.flipped : false, { lit: h.done ? true : undefined }); }
    gDyn.innerHTML = s;
    $('#trayLedLbl').textContent = h.led ? 'LED（已使用）' : 'LED（紅）';
    $('#trayResLbl').textContent = h.res ? '電阻（已使用）' : '電阻 220Ω';
    // hint targets
    const cur = h.step + 1;
    let tg = [];
    if (!h.done && (cur <= 2 || h.hinted[cur])) tg = stepTargets(cur);
    gHint.innerHTML = tg.map(id => { const q = P[id]; return `<circle class="pulse" cx="${q.x}" cy="${q.y}" r="8"/><circle class="target-dot" cx="${q.x}" cy="${q.y}" r="4" opacity=".9"/>`; }).join('');
    renderSelTools();
  }
  function selBox(type) { const b = partBox(type); return `<rect x="${b.x - 4}" y="${b.y - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="6" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-dasharray="4 3"/>`; }
  function renderSelTools() {
    const el = $('#selTools');
    if (S.hw.done) { el.innerHTML = '<span class="pill ok">接線已完成</span>'; return; }
    if (!sel) { el.innerHTML = '<span class="lbl">點選元件或導線可以反轉或移除</span>'; return; }
    if (sel.type === 'led') el.innerHTML = `<span class="lbl">已選取：LED</span>${S.hw.led ? '<button class="btn sm" id="stFlip">反轉 LED</button>' : ''}${S.hw.led ? '<button class="btn sm" id="stDel">放回元件盒</button>' : ''}`;
    else if (sel.type === 'res') el.innerHTML = `<span class="lbl">已選取：電阻</span>${S.hw.res ? '<button class="btn sm" id="stDel">放回元件盒</button>' : ''}`;
    else { const w = S.hw.wires.find(x => x.id === sel.id); el.innerHTML = w ? `<span class="lbl">已選取：導線 ${endName(w.a)} → ${endName(w.b)}</span><button class="btn sm" id="stDel">刪除導線</button>` : ''; }
    const f = $('#stFlip'); if (f) f.onclick = flipLed;
    const d = $('#stDel'); if (d) d.onclick = removeSel;
  }
  function changed() { lastIssues = null; save(); render(); renderPanel(); }
  function flipLed() { if (!S.hw.led) return; S.hw.led.flipped = !S.hw.led.flipped; toast(S.hw.led.flipped ? 'LED 已反轉：長腳（+）現在在右邊' : 'LED 已反轉：長腳（+）現在在左邊'); changed(); }
  function removeSel() {
    if (!sel) return;
    if (sel.type === 'led') S.hw.led = null;
    else if (sel.type === 'res') S.hw.res = null;
    else S.hw.wires = S.hw.wires.filter(w => w.id !== sel.id);
    sel = null; changed();
  }

  /* ---------- tooltip ---------- */
  function showTip(html, e) { const t = $('#tip'); t.innerHTML = html; t.hidden = false; t.style.left = (e.clientX + 14) + 'px'; t.style.top = (e.clientY + 16) + 'px'; }
  function hideTip() { $('#tip').hidden = true; }
  function hoverAt(p, e) {
    const id = nearestPoint(p);
    if (!id) { hideTip(); gGroup.innerHTML = ''; return; }
    const q = P[id];
    if (q.kind === 'pin') { showTip(`<b>${pinName(q.name) === 'GND' ? 'GND' : q.name}</b> · ${q.label}`, e); gGroup.innerHTML = `<circle cx="${q.x}" cy="${q.y}" r="8" fill="none" stroke="#FFD27A" stroke-width="2"/>`; return; }
    showTip(holeLabel(id), e);
    gGroup.innerHTML = HOLE_IDS.filter(x => P[x].group === q.group).map(x => `<rect x="${P[x].x - 6}" y="${P[x].y - 6}" width="12" height="12" rx="3" fill="rgba(255,210,122,.45)" stroke="#E0A63A"/>`).join('');
  }

  /* ---------- pointer handling ---------- */
  function onDown(e) {
    if (e.button !== 0) return;
    const p = svgPt(e);
    if (S.hw.done) return;
    const occ = occupancy();
    hideTip();
    // parts first (LED on top)
    for (const type of ['led', 'res']) {
      if (inRect(p, partBox(type))) {
        const leg = (type === 'led' ? ledLegs() : resLegs())[0];
        drag = { kind: 'part', part: type, off: { x: p.x - leg.x, y: p.y - leg.y }, start: p, moved: false, snap: null };
        sel = { type }; svg.setPointerCapture(e.pointerId); render(); return;
      }
    }
    const wt = e.target.closest && e.target.closest('[data-wire]');
    const ptId = nearestPoint(p);
    if (ptId && occ[ptId] && occ[ptId].type === 'wire') {
      const w = S.hw.wires.find(x => x.id === occ[ptId].id);
      drag = { kind: 'wire', wire: w, end: occ[ptId].end, fixed: occ[ptId].end === 'a' ? w.b : w.a, start: p, moved: false };
      sel = { type: 'wire', id: w.id }; svg.setPointerCapture(e.pointerId); render(); return;
    }
    if (ptId && occ[ptId] && (occ[ptId].type === 'led' || occ[ptId].type === 'res')) {
      const type = occ[ptId].type; const leg = (type === 'led' ? ledLegs() : resLegs())[0];
      drag = { kind: 'part', part: type, off: { x: p.x - leg.x, y: p.y - leg.y }, start: p, moved: false, snap: null };
      sel = { type }; svg.setPointerCapture(e.pointerId); render(); return;
    }
    if (wt) { sel = { type: 'wire', id: wt.dataset.wire }; render(); return; }
    if (ptId) { drag = { kind: 'wire', wire: null, fixed: ptId, start: p, moved: false }; sel = null; svg.setPointerCapture(e.pointerId); render(); return; }
    sel = null; render();
  }
  function onMove(e) {
    const p = svgPt(e);
    if (!drag) { hoverAt(p, e); return; }
    if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) < 4) return;
    if (!drag.moved) { drag.moved = true; render(); }
    const occ = occupancy();
    if (drag.kind === 'part') {
      const leg1 = { x: p.x - drag.off.x, y: p.y - drag.off.y };
      const own = new Set(drag.part === 'led' ? (S.hw.led ? ledHoles(S.hw.led) : []) : (S.hw.res ? resHoles(S.hw.res) : []));
      const h1 = nearestHoleForLeg(leg1);
      let snap = null;
      if (h1) {
        const ph = parseHole(h1); const h2 = holeAt(ph.row, ph.col + (drag.part === 'led' ? 1 : 4));
        if (h2) snap = { h1, h2, ok: [h1, h2].every(x => !occ[x] || own.has(x)) };
      }
      drag.snap = snap;
      const span = drag.part === 'led' ? 20 : 80;
      const a = snap ? P[snap.h1] : leg1, b = snap ? P[snap.h2] : { x: leg1.x + span, y: leg1.y };
      const flipped = drag.part === 'led' && S.hw.led ? S.hw.led.flipped : false;
      let g = drag.part === 'led' ? ledSVG(a, b, flipped, { ghost: true }) : resSVG(a, b, { ghost: true });
      if (snap) g += [snap.h1, snap.h2].map(x => `<circle cx="${P[x].x}" cy="${P[x].y}" r="6" fill="none" stroke="${snap.ok ? '#6CF09A' : '#FF6B5E'}" stroke-width="2.5"/>`).join('');
      gGhost.innerHTML = g;
      gGroup.innerHTML = snap ? [snap.h1, snap.h2].flatMap(x => HOLE_IDS.filter(y => P[y].group === P[x].group)).map(x => `<rect x="${P[x].x - 6}" y="${P[x].y - 6}" width="12" height="12" rx="3" fill="rgba(255,210,122,.35)"/>`).join('') : '';
      if (snap) showTip(`${drag.part === 'led' ? 'LED' : '電阻'}：<b>${snap.h1}</b> 至 <b>${snap.h2}</b>${snap.ok ? '' : '（已有東西）'}`, e); else hideTip();
    } else {
      const from = P[drag.fixed];
      const tgt = nearestPoint(p);
      const ok = tgt && tgt !== drag.fixed && (!occ[tgt] || (drag.wire && occ[tgt].id === drag.wire.id));
      drag.target = ok ? tgt : null;
      const color = drag.wire ? drag.wire.color : S.hw.color;
      const end = ok ? P[tgt] : p;
      gGhost.innerHTML = wireSVG({ color }, { pa: from, pb: end, ghost: true }) + (tgt ? `<circle cx="${P[tgt].x}" cy="${P[tgt].y}" r="8" fill="none" stroke="${ok ? '#6CF09A' : '#FF6B5E'}" stroke-width="2.5"/>` : '');
      if (drag.wire) { // hide original while moving
        const wg = gDyn.querySelector(`[data-wire="${drag.wire.id}"]`); if (wg) wg.parentNode.setAttribute('opacity', '.15');
      }
      if (tgt) { const q = P[tgt]; showTip(q.kind === 'pin' ? `<b>${pinName(q.name)}</b> · ${q.label}` : holeLabel(tgt), e); } else hideTip();
    }
  }
  function onUp(e) {
    if (!drag) return;
    const p = svgPt(e);
    const d = drag; drag = null; gGhost.innerHTML = ''; gGroup.innerHTML = ''; hideTip();
    try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!d.moved) { render(); return; }
    if (d.kind === 'part') {
      const key = d.part === 'led' ? 'led' : 'res';
      if (inRect(p, TRASH) || (inRect(p, TRAY) && !d.snap)) { S.hw[key] = null; sel = null; changed(); return; }
      if (d.snap && d.snap.ok) {
        const prev = S.hw[key];
        S.hw[key] = key === 'led' ? { h1: d.snap.h1, flipped: prev ? prev.flipped : false } : { h1: d.snap.h1 };
        changed(); return;
      }
      if (d.snap && !d.snap.ok) toast('那個位置已經有東西，請換另一個孔。', 'err');
      else toast('元件要插在麵包板的孔上。');
      render(); return;
    }
    // wire
    if (d.wire) {
      if (inRect(p, TRASH)) { S.hw.wires = S.hw.wires.filter(w => w !== d.wire); sel = null; toast('已移除導線'); changed(); return; }
      if (d.target) { d.wire[d.end] = d.target; changed(); return; }
      render(); return;
    }
    if (d.target) {
      const w = { id: 'w' + Date.now().toString(36) + Math.floor(Math.random() * 99), a: d.fixed, b: d.target, color: S.hw.color };
      S.hw.wires.push(w); sel = { type: 'wire', id: w.id }; changed(); return;
    }
    const tgt = nearestPoint(p);
    if (tgt && tgt !== d.fixed) toast('那個孔已經有東西了，每個孔只可以插一樣東西。', 'err');
    render();
  }

  /* ---------- checking ---------- */
  const layoutSig = () => JSON.stringify([S.hw.led, S.hw.res, S.hw.wires.map(w => [w.a, w.b].sort().join('-')).sort()]);
  function runCheck(upto) {
    const an = analyze();
    let rel = an.iss.filter(i => i.step <= upto);
    const globals = rel.filter(i => i.step === 0);
    const minStep = Math.min(...rel.filter(i => i.step > 0).map(i => i.step), 99);
    rel = globals.concat(rel.filter(i => i.step === minStep));
    if (!rel.length) {
      S.hw.step = Math.max(S.hw.step, upto);
      if (upto >= 5) { finish(); return; }
      lastIssues = { kind: 'ok', html: alertBox('ok', `第 ${upto} 步正確！${upto < 5 ? '繼續下一步。' : ''}`) };
      changed(); lastIssues = { kind: 'ok', html: alertBox('ok', `第 ${upto} 步正確！繼續下一步。`) }; renderPanel(); return;
    }
    const counted = rel.some(i => i.counts);
    const sig = layoutSig();
    let newErr = false;
    if (counted && sig !== S.hw.lastFailSig) {
      S.hw.errors++; newErr = true; S.hw.lastFailSig = sig;
      S.hw.stepFails[S.hw.step + 1] = (S.hw.stepFails[S.hw.step + 1] || 0) + 1;
      rel.filter(i => i.counts).forEach(i => logEv('hw', i.msg.replace(/<[^>]+>/g, '')));
    }
    const kind = counted ? 'err' : 'warn';
    lastIssues = { kind, html: rel.map(i => alertBox(i.counts ? 'err' : 'warn', i.msg)).join('') + (newErr ? `<p class="small muted">已記錄 1 次接線錯誤。</p>` : (counted ? '<p class="small muted">電路未有改動，這次不再重複扣分。</p>' : '')) };
    save(); renderPanel();
  }
  function finish() {
    S.hw.done = true; S.hw.step = 5; S.t.hwEnd = now(); if (!S.t.code) S.t.code = now();
    unlock('code'); sel = null; save(); render(); renderPanel();
    // current flow animation
    gFlow.innerHTML = S.hw.wires.map(w => `<path class="flowline" d="${wirePath(P[w.a], P[w.b])}"/>`).join('');
    modal({
      title: '接線完成！',
      html: `<p>做得好！你的電路是：<b>D13 → 220Ω 電阻 → LED 長腳（+）→ LED 短腳（−）→ GND</b>。</p><p class="muted" style="margin-top:8px">模擬器上黃色虛線顯示電流的路線。當 D13 輸出 HIGH（5V），電流就會流過電阻和 LED，LED 便會亮起。</p><div class="row" style="margin-top:12px"><span class="pill ${S.hw.errors ? 'warn' : 'ok'}">接線錯誤 ${S.hw.errors} 次</span><span class="pill ${S.hw.hints ? 'warn' : 'ok'}">使用提示 ${S.hw.hints} 次</span></div>`,
      actions: [{ label: '留在這頁', kind: 'ghost' }, { label: '下一步：編寫程式', kind: 'go', onClick: () => goStage('code') }],
    });
  }

  function renderPanel() {
    const h = S.hw, cur = h.step + 1;
    $('#hwSteps').innerHTML = STEPS.map((st, i) => {
      const n = i + 1, cls = n <= h.step ? 'done' : n === cur && !h.done ? 'cur' : 'locked';
      let body = '';
      if (cls === 'cur') {
        body = `<div class="sb">${stepBody(n)}<div class="row">`;
        body += n < 5 ? `<button class="btn primary sm" data-check="${n}">檢查這一步</button>` : `<button class="btn go" data-check="5">完成接線檢查</button>`;
        if ((n === 3 || n === 4) && !h.hinted[n]) body += `<button class="btn sm ghost" data-hint="${n}">顯示提示位置（扣 2 分）</button>`;
        if ((n === 3 || n === 4) && h.hinted[n]) body += `<span class="pill warn">提示位置已顯示</span>`;
        body += '</div></div>';
        if ((h.stepFails[n] || 0) >= 2 && (n === 3 || n === 4) && !h.hinted[n]) body += `<div class="sb">${alertBox('info', '試了幾次也不成功？可以按「顯示提示位置」，看看應該接到哪裏。')}</div>`;
      }
      return `<li class="${cls}"><div class="sh"><i>${n <= h.step ? '✓' : n}</i>${st.t}</div>${body}</li>`;
    }).join('');
    $$('#hwSteps [data-check]').forEach(b => b.onclick = () => runCheck(+b.dataset.check));
    $$('#hwSteps [data-hint]').forEach(b => b.onclick = () => {
      const n = +b.dataset.hint;
      if (!analyze().chain) { toast('先完成 LED 和電阻的步驟，才可以顯示提示位置。'); return; }
      h.hinted[n] = true; h.hints++; logEv('hw', `使用提示：第 ${n} 步（${STEPS[n - 1].t}）`);
      save(); render(); renderPanel();
    });
    let issues = lastIssues ? lastIssues.html : '';
    if (h.done) issues = alertBox('ok', '接線正確，已經完成！') + `<button class="btn go" id="hwNext">下一步：編寫程式</button>`;
    $('#hwIssues').innerHTML = issues;
    const nx = $('#hwNext'); if (nx) nx.onclick = () => goStage('code');
    $('#hwStats').innerHTML = `<span class="pill ${h.errors ? 'err' : ''}">接線錯誤 ${h.errors} 次</span><span class="pill ${h.hints ? 'warn' : ''}">使用提示 ${h.hints} 次</span>`;
  }

  function enter() {
    if (!built) build();
    renderSwatches(); render(); renderPanel();
    gFlow.innerHTML = S.hw.done ? S.hw.wires.map(w => `<path class="flowline" d="${wirePath(P[w.a], P[w.b])}"/>`).join('') : '';
  }

  /* teacher demo: build the recommended circuit */
  function autoWire() {
    S.hw.led = { h1: 'e13', flipped: false }; S.hw.res = { h1: 'c9' };
    S.hw.wires = [{ id: 'wd13', a: 'P:D13', b: 'a9', color: '#F2A91E' }, { id: 'wgnd', a: 'P:GND', b: 'a14', color: '#2A2A2A' }];
    S.hw.step = 4; S.teacherUsed = true; save();
    if (built) { render(); renderPanel(); }
  }

  return { enter, circuitSVG, analyze, autoWire, runCheck, P, HOLE_IDS, ledAK, _state: () => ({ sel, drag }) };
})();
stageInit.hw = () => HW.enter();
