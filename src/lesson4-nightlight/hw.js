/* =====================================================================
   硬件接線模擬器
   ===================================================================== */
const HW = (() => {
  const UX = 24, UY = 150, UW = 420, UH = 320;       // Arduino UNO
  const BX = 470, BY = 96, BW = 660, BH = 368;       // breadboard
  const PITCH = 20, COLS = 30;
  const TRAY = { x: 24, y: 490, w: 1102, h: 138 };
  const TRASH = { x: 990, y: 506, w: 122, h: 108 };
  const COLORS = [['#2A2A2A', '黑'], ['#F4F4F0', '白'], ['#D63A2F', '紅'], ['#2F6FD6', '藍'], ['#2E9B4F', '綠']];   // the kit's jumper wire colours

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

  const ROWY = { tn: 24, tp: 44, j: 84, i: 104, h: 124, g: 144, f: 164, e: 204, d: 224, c: 244, b: 264, a: 284, bn: 324, bp: 344 };   // like a real breadboard: j on top, a at the bottom
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

  /* ---------- parts: several instances of each type ---------- */
  const SPAN = { led: 1, ls: 1, res: 4, pot: 2 };
  const LED_COL = { red: ['#D8321F', '#FF5B45', '#A92414'], yellow: ['#E3A800', '#FFE14D', '#A67B00'], green: ['#1E9E3E', '#5BEA7A', '#146B2A'] };
  const CNAME = { red: '紅色', yellow: '黃色', green: '綠色' };
  const BANDS = { 220: ['#D12B2B', '#D12B2B', '#1E1E1E', '#1E1E1E', '#7A4A1E'], 10000: ['#7A4A1E', '#1E1E1E', '#1E1E1E', '#D12B2B', '#7A4A1E'] };   // 5-band metal-film resistors (blue body) as in the kit
  const BAND_TXT = { 220: '紅紅黑黑棕', 10000: '棕黑黑紅棕' };
  const OHM = { 220: '220Ω', 10000: '10kΩ' };
  /* potentiometer: h1 is the left outer leg in row f; the two outer legs are 2 columns apart,
     the middle leg (wiper) is in row e, straddling the centre channel like the real part */
  function legHoles(p) {
    const q = parseHole(p.h1);
    if (p.type === 'pot') return ['f' + q.col, 'f' + (q.col + 2), 'e' + (q.col + 1)];
    return [p.h1, holeAt(q.row, q.col + SPAN[p.type])];
  }
  /* LED: a = long leg (+), k = short leg (−). The light sensor has polarity too: long leg (+) goes to the 10kΩ / A0 side */
  const ledAK = led => { const [h1, h2] = legHoles(led); return led.flipped ? { a: h2, k: h1 } : { a: h1, k: h2 }; };
  const lsPM = ledAK;
  function partPairs() { return []; }

  /* ---------- SVG builders for parts ---------- */
  function ledSVG(p1, p2, flipped, opts = {}) {
    const col = LED_COL[opts.color || 'red'];
    const mx = (p1.x + p2.x) / 2, y = p1.y, cy = y - 27;
    const ax = flipped ? p2.x : p1.x, kx = flipped ? p1.x : p2.x;
    const ax0 = flipped ? mx + 5 : mx - 5, kx0 = flipped ? mx - 5 : mx + 5;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="led" data-led="${opts.color || 'red'}"${op}>
      ${opts.lit !== undefined ? `<g class="ledglow" opacity="${opts.lit ? 1 : 0}"><circle cx="${mx}" cy="${cy}" r="30" fill="${col[1]}" opacity=".16"/><circle cx="${mx}" cy="${cy}" r="19" fill="${col[1]}" opacity=".32"/></g>` : ''}
      <path d="M${kx0} ${y - 15}L${kx} ${y}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${ax0} ${y - 15}V${y - 11}L${ax} ${y - 5}V${y}" stroke="#B9BEC0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${mx - 10} ${cy + 8}V${cy}A10 10 0 0 1 ${mx + 10} ${cy}V${cy + 8}Z" fill="${opts.lit ? col[1] : col[0]}" class="ledbody" data-off="${col[0]}" data-on="${col[1]}"/>
      <path d="M${mx - 6} ${cy - 2}A6 6 0 0 1 ${mx} ${cy - 7}" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>
      <rect x="${mx - 12}" y="${cy + 8}" width="24" height="4" rx="1" fill="${col[2]}"/>
      ${opts.noSigns ? '' : `<text x="${ax + (flipped ? 9 : -9)}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#FFD34D">+</text>
      <text x="${kx + (flipped ? -9 : 9)}" y="${y - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#9FD3FF">−</text>`}
    </g>`;
  }
  /* light sensor: clear, flat-topped, like a 5mm LED; long leg = + */
  function lsSVG(p1, p2, flipped, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y, top = y - 40;
    const ax = flipped ? p2.x : p1.x, kx = flipped ? p1.x : p2.x;
    const ax0 = flipped ? mx + 5 : mx - 5, kx0 = flipped ? mx - 5 : mx + 5;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="lspart"${op}>
      <path d="M${kx0} ${y - 15}L${kx} ${y}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${ax0} ${y - 15}V${y - 11}L${ax} ${y - 5}V${y}" stroke="#B9BEC0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="${mx - 10}" y="${top + 4}" width="20" height="22" rx="3" fill="#E4EEF2" fill-opacity=".9" stroke="#9FB3BB"/>
      <rect x="${mx - 11}" y="${top}" width="22" height="6" rx="1.5" fill="#F7FBFC" stroke="#9FB3BB"/>
      <rect x="${mx - 4}" y="${top + 10}" width="8" height="6" fill="#4A4A4A"/>
      <path d="M${mx - 4} ${top + 19}h8" stroke="#C9A53A" stroke-width="1.4"/>
      <rect x="${mx - 12}" y="${top + 25}" width="24" height="3" rx="1" fill="#B9C7CC"/>
      ${opts.shade !== undefined ? `<g class="lsshade" opacity="${opts.shade}" pointer-events="none"><ellipse cx="${mx}" cy="${top + 4}" rx="30" ry="22" fill="#0A1418" opacity=".75"/><text x="${mx}" y="${top - 6}" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">遮光</text></g>` : ''}
      ${opts.noSigns ? '' : `<text x="${ax + (flipped ? 9 : -9)}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#FFD34D">+</text>
      <text x="${kx + (flipped ? -9 : 9)}" y="${y - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#9FD3FF">−</text>`}
    </g>`;
  }
  function resSVG(p1, p2, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y, bd = BANDS[opts.ohm || 220];
    const op = opts.ghost ? ' opacity=".7"' : '';
    const xs = [-16, -10, -4, 2, 13];
    return `<g class="res"${op}>
      <path d="M${p1.x} ${y}H${p2.x}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="${mx - 23}" y="${y - 8}" width="46" height="16" rx="7" fill="#4A8BD6" stroke="#2C5E9A"/>
      ${bd.map((c, i) => `<rect x="${mx + xs[i]}" y="${y - 8}" width="3.6" height="16" fill="${c}"/>`).join('')}
      ${opts.noTag ? '' : `<g pointer-events="none"><rect x="${mx - 19}" y="${y - 25}" width="38" height="14" rx="4" fill="#FFFDF4" stroke="#2C5E9A" stroke-width="1"/><text x="${mx}" y="${y - 14.5}" font-size="10.5" font-weight="700" fill="#1D3F66" text-anchor="middle">${OHM[opts.ohm || 220]}</text></g>`}
    </g>`;
  }
  /* potentiometer: x,y = left outer leg (row f); the wiper leg sits one column right, across the channel */
  function potSVG(x, y, opts = {}) {
    const op = opts.ghost ? ' opacity=".7"' : '';
    const cx = x + PITCH, cy = y + 20, ang = opts.angle == null ? 0 : opts.angle;
    return `<g class="potpart"${op}>
      <rect x="${x - 2}" y="${y - 8}" width="4" height="10" rx="1" fill="#C9CED1"/><rect x="${x + 2 * PITCH - 2}" y="${y - 8}" width="4" height="10" rx="1" fill="#C9CED1"/><rect x="${cx - 2}" y="${y + 32}" width="4" height="10" rx="1" fill="#C9CED1"/>
      <rect x="${x - 8}" y="${y - 2}" width="${2 * PITCH + 16}" height="38" rx="3" fill="#2B2F33" stroke="#555" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy - 2}" r="13" fill="#161616" stroke="#4A4A4A" stroke-width="1.5"/>
      <g class="potknob" data-cx="${cx}" data-cy="${cy - 2}" transform="rotate(${ang} ${cx} ${cy - 2})"><path d="M${cx} ${cy - 2}V${cy - 13}" stroke="#E6E6E6" stroke-width="3" stroke-linecap="round"/></g>
    </g>`;
  }
  function drawPart(p, a, b, opts = {}) {
    if (p.type === 'led') return ledSVG(a, b, !!p.flipped, { ...opts, color: p.color });
    if (p.type === 'ls') return lsSVG(a, b, !!p.flipped, opts);
    if (p.type === 'res') return resSVG(a, b, { ...opts, ohm: p.ohm });
    if (p.type === 'pot') return potSVG(a.x, a.y, opts);
    return '';
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
      s += `<text transform="translate(${x + 3} ${topY + 12}) rotate(-90)" text-anchor="end" font-size="8.5" fill="#fff" font-family="monospace" ${n === 'D9' || n === 'GND' ? 'font-weight="700"' : ''}>${tl[n] || PIN_LABEL[n] || n}</text>`;
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
      <path d="M${BX + 30} ${BY + 11}H${BX + BW - 30}" stroke="#2F6FD6" stroke-width="2"/>
      <path d="M${BX + 30} ${BY + 57}H${BX + BW - 30}" stroke="#D63A2F" stroke-width="2"/>
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
    <radialGradient id="glow-red"><stop offset="0" stop-color="#FF6A4D" stop-opacity=".95"/><stop offset=".45" stop-color="#FF5A3C" stop-opacity=".45"/><stop offset="1" stop-color="#FF5A3C" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow-yellow"><stop offset="0" stop-color="#FFE45C" stop-opacity=".95"/><stop offset=".45" stop-color="#FFD21F" stop-opacity=".45"/><stop offset="1" stop-color="#FFD21F" stop-opacity="0"/></radialGradient>
    <radialGradient id="glow-green"><stop offset="0" stop-color="#6BFF8E" stop-opacity=".95"/><stop offset=".45" stop-color="#2FE064" stop-opacity=".45"/><stop offset="1" stop-color="#2FE064" stop-opacity="0"/></radialGradient>
  </defs>`;

  /* ---------- static circuit snapshot (later pages & report) ---------- */
  const DRAW_ORDER = { res: 0, pot: 1, ls: 2, led: 3 };
  const sortParts = parts => parts.slice().sort((a, b) => DRAW_ORDER[a.type] - DRAW_ORDER[b.type]);
  function partsSVG(h, opts = {}) {
    let s = '';
    (h.wires || []).forEach(w => s += wireSVG(w));
    sortParts(h.parts || []).forEach(p => {
      const [a, b] = legHoles(p).map(x => P[x]);
      s += drawPart(p, a, b, p.type === 'led' ? { lit: false } : p.type === 'ls' ? { shade: 0 } : p.type === 'pot' ? { angle: 0 } : {});
    });
    return s;
  }
  function circuitSVG(st, extra, opts = {}) {
    const h = st || S.hw;
    const parts = partsSVG(h, opts) + (extra ? partsSVG(extra, opts) : '');
    return `<svg viewBox="0 80 1150 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="電路接線圖" style="background:#1E5A4B">${DEFS}<rect x="0" y="80" width="1150" height="400" fill="url(#matgrid)"/>${unoSVG()}${boardSVG()}${parts}</svg>`;
  }

  /* ---------- modes ---------- */
  let MODE = 'main';
  const H = () => MODE === 'main' ? S.hw : S.ext[MODE].hw;
  const FIXED = () => MODE === 'main' ? null : S.hw;
  const allWires = h => (FIXED() ? FIXED().wires : []).concat(h.wires);
  const isHwView = () => S && ['hw', 'c1hw'].includes(S.stage);
  /* parts box contents per mode */
  const BINS = {
    main: [
      { key: 'ls', type: 'ls', label: '光感應器', max: 1 },
      { key: 'r10k', type: 'res', ohm: 10000, label: '10kΩ', max: 2 },
      { key: 'ledY', type: 'led', color: 'yellow', label: '黃色 LED', max: 1 },
      { key: 'r220', type: 'res', ohm: 220, label: '220Ω', max: 2 },
    ],
    c1: [{ key: 'pot', type: 'pot', label: '電位器', max: 1 }],
  };
  const BIN_X = i => 84 + i * 112;
  const binRect = i => ({ x: BIN_X(i) - 54, y: TRAY.y + 30, w: 108, h: 100 });
  const binMatch = (bin, p) => p.type === bin.type && (bin.color ? p.color === bin.color : true) && (bin.ohm ? p.ohm === bin.ohm : true);
  const binLeft = bin => bin.max - H().parts.filter(p => binMatch(bin, p)).length;
  function trayLegs(type, cx) {
    if (type === 'led' || type === 'ls') return [{ x: cx - 10, y: 598 }, { x: cx + 10, y: 598 }];
    if (type === 'res') return [{ x: cx - 40, y: 574 }, { x: cx + 40, y: 574 }];
    if (type === 'pot') return [{ x: cx - 20, y: 548 }, { x: cx + 20, y: 548 }];
    return [{ x: cx - 20, y: 600 }, { x: cx + 20, y: 600 }];
  }
  const newPart = bin => ({ id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 999), type: bin.type, ...(bin.color ? { color: bin.color } : {}), ...(bin.type === 'led' || bin.type === 'ls' ? { flipped: false } : {}), ...(bin.ohm ? { ohm: bin.ohm } : {}) });

  /* ---------- nets ---------- */
  function buildNets(wires, pairs = []) {
    const parent = {};
    const find = x => { if (parent[x] === undefined) parent[x] = x; while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
    HOLE_IDS.forEach(id => uni(id, 'G:' + P[id].group));
    uni('P:GND', 'P:GND2'); uni('P:GND', 'P:GND3');
    wires.forEach(w => uni(w.a, w.b));
    pairs.forEach(([a, b]) => uni(a, b));
    return find;
  }
  function occupancy(h = H()) {
    const o = {};
    const f = FIXED();
    if (f) { f.parts.forEach(p => legHoles(p).forEach(x => o[x] = { type: 'fixed' })); f.wires.forEach(w => { o[w.a] = { type: 'fixed' }; o[w.b] = { type: 'fixed' }; }); }
    h.parts.forEach(p => legHoles(p).forEach(x => o[x] = { type: 'part', id: p.id }));
    h.wires.forEach(w => { o[w.a] = { type: 'wire', id: w.id, end: 'a' }; o[w.b] = { type: 'wire', id: w.id, end: 'b' }; });
    return o;
  }

  /* ---------- analysis helpers ---------- */
  const POWER = ['5V', '3V3', 'VIN'];
  const LED_PIN = { yellow: 'D9' };
  const pinPretty = n => /^SV/.test(n) ? (PIN_LABEL[n] || n) : `〔${pinName(n)}〕`;
  const endName = id => id.startsWith('P:') ? pinName(P[id].name) : id;
  function ctxFor(wires, find) {
    const pinsIn = net => [...new Set(PIN_IDS.filter(p => find(p) === net).map(p => pinName(P[p].name)))];
    const wiredPins = new Set(wires.flatMap(w => [w.a, w.b]).filter(x => x.startsWith('P:')).map(x => pinName(P[x].name)));
    const touched = net => wires.some(w => find(w.a) === net);
    const railOf = net => { const id = HOLE_IDS.find(x => RAIL_NAME[P[x].row] && find(x) === net); return id ? P[id].row : null; };
    return { pinsIn, wiredPins, touched, railOf };
  }
  const resEnds = (parts, find) => parts.filter(p => p.type === 'res').map(r => { const [x, y] = legHoles(r).map(find); return { r, x, y }; });
  const isPlusRail = r => r === 'tp' || r === 'bp', isMinusRail = r => r === 'tn' || r === 'bn';

  /* one LED: signal pin → resistor → LED → GND (resistor may be on either side) */
  function ledChain(L, parts, find, c, add, gnd) {
    const nm = CNAME[L.color] + ' LED', want = LED_PIN[L.color];
    const ak = ledAK(L); const A = find(ak.a), K = find(ak.k);
    if (A === K) { add(1, 'led_short', `${nm}兩隻腳插在<b>相通</b>的孔，LED 被短路了，不會亮。請把兩隻腳放在不同的直行。`); return null; }
    const pinsOn = net => c.pinsIn(net).filter(n => n !== 'GND');
    const rs = resEnds(parts, find);
    if (rs.some(o => (o.x === A && o.y === K) || (o.x === K && o.y === A))) { add(2, 'parallel', `${nm}：電阻兩端分別接到 LED 兩隻腳，變成<b>並聯</b>了。電阻只需要<b>一隻腳</b>和 LED 長腳在同一個直行。`); return null; }
    // only look for the LED's own resistor on a leg that is not already GND (the rail joins many parts)
    const legNets = [A, K].filter(n => n !== gnd);
    const t = legNets.map(n => rs.find(o => o.x === n || o.y === n)).find(Boolean);
    if (!t) {
      if (pinsOn(A).some(n => /^D/.test(n)) && K === gnd) add(2, 'no_resistor', `<b>${nm}漏接電阻！</b>LED 直接接到信號腳和 GND，電流太大會燒壞 LED。請串聯一粒 220Ω 電阻。`);
      else add(2, 'res_missing', `請在${nm}旁邊插上一粒 <b>220Ω</b> 電阻，電阻一隻腳要和 LED 長腳（+）在同一個直行。`, false);
      return null;
    }
    if (t.r.ohm !== 220) add(2, 'res_value', `${nm}用了 <b>${OHM[t.r.ohm]}</b> 電阻。電阻太大，電流太小，LED 會非常暗。LED 要用 <b>220Ω</b>（色環：紅紅黑黑棕）。`);
    const onA = t.x === A || t.y === A;
    const other = (t.x === A || t.x === K) ? t.y : t.x;
    const X = onA ? other : A, Y = onA ? K : other, M = onA ? A : K;
    const px = pinsOn(X);
    if (px.includes(want)) { const extra = px.filter(n => n !== want); if (extra.length) add(3, 'sig_extra', `${nm}的信號線同時接到了 <b>${extra.map(pinPretty).join('、')}</b>，請移除多餘的線。`); }
    else if (pinsOn(Y).includes(want)) add(3, 'reversed', `<b>${nm}接反了！</b>〔${want}〕 接到了短腳（−）那一邊。長腳（+）要向信號腳，短腳（−）向 GND。<br>方法：點選這粒 LED，按「反轉 LED」。`);
    else if (pinsOn(M).includes(want)) add(3, 'bypass', `〔${want}〕 接到了${nm}和電阻之間，電流沒有經過電阻。請把線改接到電阻<b>另一端</b>的直行。`);
    else if (px.length) {
      const n = px[0];
      if (POWER.includes(n)) add(3, 'power', `${nm}接到了 <b>${PIN_LABEL[n]}</b>，會一直亮，程式不能控制。要改接 <b>${want}</b>。`);
      else if (/^A\d$/.test(n)) add(3, 'wrong_pin', `${nm}接到了 〔${n}〕。A0 – A5 是讀取感應器用的輸入腳，LED 要接 〔${want}〕。`);
      else add(3, 'wrong_pin', `${nm}接到了 ${pinPretty(n)}，要改接 〔${want}〕。`);
    }
    else if (X === gnd) add(3, 'gnd_anode', `GND 接到了${nm}長腳（+）那一邊，方向反了。`);
    else if (!c.wiredPins.has(want)) add(3, 'sig_missing', `還未連接${nm}的信號線：由 〔${want}〕（Arduino 上方）拉一條線到電阻另一端的直行。`, false);
    else add(3, 'sig_nowhere', `〔${want}〕 的導線接到了<b>沒有元件</b>的位置。導線要插在和電阻另一隻腳<b>同一個</b>直行。`);
    if (Y !== gnd && !(X === gnd)) {
      const rail = c.railOf(Y), py = pinsOn(Y);
      if (isPlusRail(rail)) add(4, 'plus_rail', `${nm}的短腳接到了<b>「+」電源軌</b>（紅線）。GND 要接<b>「−」電源軌</b>（藍線）。`);
      else if (rail) add(4, 'rail_unpowered', `「−」電源軌還未接到 Arduino 的 <b>GND</b>。請由 GND 腳拉一條黑色線到這條電源軌。`, false);
      else if (py.length) add(4, 'wrong_gnd', `${nm}短腳（−）那邊應該接 <b>GND</b>，你接了 <b>${pinPretty(py[0])}</b>。`);
      else if (!c.touched(Y)) add(4, 'gnd_missing', `${nm}短腳（−）還未接到 GND：用一條黑色短導線，把短腳的直行接到上方的「−」電源軌。`, false);
      else add(4, 'gnd_nowhere', `${nm}短腳那條 GND 導線接到了沒有元件的位置。`);
    }
    return { X, Y, M };
  }

  /* light sensor divider: 5V → 10kΩ → (A0) → sensor + … sensor − → GND */
  function sensorChain(L, parts, find, c, add, nets) {
    const { v5, gnd, a0 } = nets;
    const pm = lsPM(L), Pn = find(pm.a), Mn = find(pm.k);
    if (Pn === Mn) { add(1, 'ls_short', '光感應器兩隻腳插在<b>相通</b>的孔，被短路了，讀數不會變。請把兩隻腳放在不同的直行。'); return null; }
    const rs = resEnds(parts, find);
    const resOn = n => n !== gnd && n !== v5 && rs.some(o => (o.x === n) !== (o.y === n));
    const sideOf = n => n === a0 || resOn(n);
    /* which leg is the "signal" (10kΩ / A0) side? normally the long leg (+) */
    let sig = Pn, low = Mn, reversed = false;
    if (Pn === gnd && Mn !== gnd) { sig = Mn; low = Pn; reversed = true; }
    else if (Mn !== gnd && sideOf(Mn) && !sideOf(Pn)) { sig = Mn; low = Pn; reversed = true; }
    if (reversed && Pn === gnd) add(4, 'ls_reversed', '<b>光感應器接反了！</b>光感應器和 LED 一樣有正負極：<b>長腳（+）</b>要接 10kΩ 和 A0 那一邊，<b>短腳（−）</b>接 GND。接反了，讀數不會隨光暗改變。<br>方法：點選光感應器，按「反轉光感應器」。');
    else if (reversed) add(2, 'ls_reversed', '<b>光感應器方向錯了！</b>10kΩ（或 A0）接到了光感應器的<b>短腳（−）</b>。10kΩ 和 A0 要和<b>長腳（+）</b>在同一直行。<br>方法：點選光感應器，按「反轉光感應器」；或者把 10kΩ 移到長腳的直行。');
    /* the 10kΩ pull-up */
    if (low !== gnd && low !== v5 && rs.some(o => (o.x === sig && o.y === low) || (o.x === low && o.y === sig))) add(2, 'pu_parallel', '10kΩ 兩端分別接到光感應器兩隻腳，變成<b>並聯</b>了。10kΩ 只需要<b>一隻腳</b>和光感應器長腳在同一個直行，另一隻腳接 5V。');
    else {
      const cand = rs.filter(o => (o.x === sig) !== (o.y === sig));
      const t = cand.find(o => o.r.ohm === 10000) || cand[0];
      if (!t) add(2, 'pu_missing', '請插上一粒 <b>10kΩ</b> 電阻（色環<b>棕黑黑紅棕</b>）：一隻腳和光感應器<b>長腳</b>在同一個直行。', false);
      else {
        if (t.r.ohm !== 10000) add(2, 'pu_value', `光感應器用了 <b>${OHM[t.r.ohm]}</b> 電阻。電阻太小，光暗改變時讀數只會變一點點，夜燈很難分辨天黑。光感應器要用 <b>10kΩ</b>（色環：棕黑黑紅棕）。`);
        const O = t.x === sig ? t.y : t.x, rail = c.railOf(O), po = c.pinsIn(O).filter(n => n !== 'GND');
        if (O === v5) { /* correct */ }
        else if (O === gnd) add(4, 'pu_to_gnd', '10kΩ 的另一端接到了 <b>GND</b>。這樣 A0 只會讀到 0。10kΩ 另一端要接 <b>5V</b>（「+」電源軌）。');
        else if (isMinusRail(rail)) add(4, 'pu_minus_rail', '10kΩ 的另一端接到了<b>「−」電源軌</b>（藍線）。它要接<b>「+」電源軌</b>（紅線），即是 5V。');
        else if (isPlusRail(rail)) add(4, 'rail_unpowered_plus', '這條「+」電源軌還未接到 Arduino 的 <b>5V</b>。請由 5V 腳拉一條紅色線到這條電源軌。', false);
        else if (po.length) add(4, 'pu_pin', `10kΩ 的另一端接到了 <b>${pinPretty(po[0])}</b>，要改接 <b>5V</b>（「+」電源軌）。`);
        else if (!c.touched(O)) add(4, 'pu_5v_missing', '10kΩ 的另一端還未接到 5V：用一條紅色短導線，把它的直行接到上方的「+」電源軌。', false);
        else add(4, 'pu_nowhere', '10kΩ 另一端的導線沒有接到 5V。');
      }
    }
    /* short leg (−) to GND */
    if (low !== gnd) {
      const rail = c.railOf(low), pl = c.pinsIn(low).filter(n => n !== 'GND');
      if (low === v5) add(4, 'ls_to_5v', '光感應器短腳（−）接到了 <b>5V</b>。短腳要接 <b>GND</b>（「−」電源軌）。');
      else if (isPlusRail(rail)) add(4, 'ls_plus_rail', '光感應器短腳接到了<b>「+」電源軌</b>（紅線）。短腳要接<b>「−」電源軌</b>（藍線）。');
      else if (rail) add(4, 'rail_unpowered', '「−」電源軌還未接到 Arduino 的 <b>GND</b>。請由 GND 腳拉一條黑色線到這條電源軌。', false);
      else if (pl.length) add(4, 'ls_gnd_pin', `光感應器短腳（−）應該接 <b>GND</b>，你接了 <b>${pinPretty(pl[0])}</b>。`);
      else if (!c.touched(low)) add(4, 'ls_gnd_missing', '光感應器短腳（−）還未接到 GND：用一條黑色短導線，把短腳的直行接到上方的「−」電源軌。', false);
      else add(4, 'ls_gnd_nowhere', '光感應器短腳那條 GND 導線接到了沒有元件的位置。');
    }
    /* A0 on the junction */
    if (a0 !== v5 && a0 !== gnd && sig !== a0) {
      const ps = c.pinsIn(sig).filter(n => n !== 'GND' && !POWER.includes(n));
      if (ps.length) add(5, 'a0_wrong_pin', `光感應器接到了 <b>${pinPretty(ps[0])}</b>，但程式讀取的是 <b>A0</b>。請改接到 Arduino 下方 ANALOG IN 的 <b>A0</b>。`);
      else if (low === a0) add(5, 'a0_on_gnd_side', 'A0 接到了光感應器<b>短腳</b>那一邊。A0 要接在<b>長腳、10kΩ 同一直行</b>（兩粒零件中間）。');
      else if (!c.wiredPins.has('A0')) add(5, 'a0_missing', '還未連接 A0：由 Arduino 下方 ANALOG IN 的 <b>A0</b>，拉一條藍色線到光感應器長腳的直行。', false);
      else add(5, 'a0_nowhere', 'A0 的導線接到了<b>沒有元件</b>的位置。A0 要接在光感應器長腳和 10kΩ <b>同一個</b>直行。');
    }
    return { sig, low };
  }
  function strayCheck(wires, find, parts, add, step) {
    const legs = parts.flatMap(legHoles);
    wires.forEach(w => {
      const n = find(w.a);
      const pins = PIN_IDS.filter(p => find(p) === n && wires.some(x => x.a === p || x.b === p)).length;
      const l = legs.filter(x => find(x) === n).length;
      if (pins + l < 2) add(step, 'stray', `有一條多餘的導線（${endName(w.a)} → ${endName(w.b)}）沒有連接任何元件，請把它移除。`, false);
    });
  }
  function unusedCheck(mine, all, wires, find, add, step) {
    mine.filter(p => p.type === 'res').forEach(r => {
      const ends = legHoles(r).map(find);
      const others = all.filter(p => p !== r).flatMap(legHoles).map(find);
      const pinNets = PIN_IDS.filter(p => wires.some(w => w.a === p || w.b === p)).map(find);
      if (ends.every(e => !others.includes(e) && !pinNets.includes(e) && !wires.some(w => find(w.a) === e))) add(step, 'unused', `有一粒 ${OHM[r.ohm]} 電阻沒有接到電路，請把它放回元件盒。`, false);
    });
  }
  /* rails: 5V on the "+" rail, GND on the "−" rail (wiring the parts straight to the pins also counts) */
  function railCheck(find, c, add, step) {
    const v5 = find('P:5V'), gnd = find('P:GND');
    const railsIn = net => [...new Set(HOLE_IDS.filter(x => RAIL_NAME[P[x].row] && find(x) === net).map(x => P[x].row))];
    if (railsIn(v5).some(isMinusRail)) add(step, 'rail_5v_minus', '5V 接到了<b>「−」電源軌</b>（藍線）。5V 要接<b>「+」電源軌</b>（紅線），GND 才接「−」。');
    if (railsIn(gnd).some(isPlusRail)) add(step, 'rail_gnd_plus', 'GND 接到了<b>「+」電源軌</b>（紅線）。GND 要接<b>「−」電源軌</b>（藍線）。');
    if (!c.wiredPins.has('5V')) add(step, 'v5_missing', '還未連接 5V：由 Arduino 下方 POWER 那一排的 <b>5V</b> 腳，拉一條紅色線到麵包板上方的<b>「+」電源軌</b>。', false);
    if (!c.wiredPins.has('GND')) add(step, 'gnd_rail_missing', '還未連接 GND：由 Arduino 的 <b>GND</b> 腳，拉一條黑色線到麵包板上方的<b>「−」電源軌</b>。', false);
  }

  /* main lesson: light sensor divider on A0 + LED on D9 */
  function analyze(h = S.hw) {
    const wires = h.wires, parts = h.parts;
    const find = buildNets(wires);
    const c = ctxFor(wires, find);
    const iss = [];
    const add = (step, code, msg, counts = true) => iss.push({ step, code, msg, counts });
    const gnd = find('P:GND'), v5 = find('P:5V'), a0 = find('P:A0');
    POWER.forEach(n => { if (find('P:' + n) === gnd) add(0, 'short_' + n, `<b>短路！</b>${PIN_LABEL[n]} 和 GND 被直接連在一起，會損壞 Arduino 和電腦的 USB 埠。請立即移除那條線。`); });
    if (find('P:D9') === gnd) add(0, 'short_D9', '<b>短路！</b>D9 和 GND 被直接連在一起（中間沒有 LED 和電阻）。');
    POWER.forEach(pw => { if (find('P:D9') === find('P:' + pw)) add(0, 'short_D9' + pw, `<b>短路！</b>D9 和 ${PIN_LABEL[pw]} 被直接連在一起。`); });
    if (a0 === v5) add(0, 'a0_5v', 'A0 被直接接到了 <b>5V</b>，讀數永遠是 1023，夜燈不會分辨光暗。A0 要接在光感應器和 10kΩ 中間。');
    else if (a0 === gnd) add(0, 'a0_gnd', 'A0 接到了 <b>GND</b>（例如插在光感應器<b>短腳</b>那一直行，或者「−」電源軌），讀數永遠是 0。A0 要接在光感應器<b>長腳</b>和 10kΩ 中間。');
    if (a0 === find('P:D9')) add(0, 'a0_d9', 'A0 和 D9 被連在一起了。光感應器（A0）和 LED（D9）要分開接。');
    const out = { iss, find, ls: null, led: null };
    /* steps 1–5: light sensor */
    const L = parts.find(p => p.type === 'ls');
    if (!L) add(1, 'ls_missing', '請把元件盒中的<b>光感應器</b>拖到麵包板上方。', false);
    else out.ls = sensorChain(L, parts, find, c, add, { v5, gnd, a0 });
    railCheck(find, c, add, 3);
    /* steps 6–7: LED (ledChain uses steps 1–4) */
    const addL = (s, code, msg, counts = true) => add(s <= 2 ? 6 : 7, code, msg, counts);
    const led = parts.find(p => p.type === 'led');
    if (!led) add(6, 'led_missing', '請把元件盒中的<b>黃色 LED</b> 拖到麵包板上方。', false);
    else out.led = ledChain(led, parts, find, c, addL, gnd);
    strayCheck(wires, find, parts, add, 8);
    unusedCheck(parts, parts, wires, find, add, 8);
    return out;
  }
  /* extensions: base circuit must stay intact */
  function baseIssues(base, extWires) {
    return analyze({ parts: base.parts, wires: base.wires.concat(extWires) }).iss.filter(i => i.step <= 7 && i.counts)
      .map(i => ({ ...i, step: 0, code: 'base_' + i.code, msg: '<b>原本的夜燈電路被改變了：</b>' + i.msg }));
  }
  /* challenge 1: potentiometer — outer legs to 5V and GND, middle leg (wiper) to A1 */
  function analyzeC1(h = S.ext.c1.hw, base = S.hw) {
    const wires = base.wires.concat(h.wires), parts = base.parts.concat(h.parts);
    const find = buildNets(wires);
    const c = ctxFor(h.wires, find), cAll = ctxFor(wires, find);
    const iss = baseIssues(base, h.wires);
    const add = (step, code, msg, counts = true) => iss.push({ step, code, msg, counts });
    const gnd = find('P:GND'), v5 = find('P:5V'), a1 = find('P:A1');
    if (a1 === gnd) add(0, 'a1_gnd', 'A1 被直接接到了 <b>GND</b>，讀數永遠是 0。');
    else if (a1 === v5) add(0, 'a1_5v', 'A1 被直接接到了 <b>5V</b>，讀數永遠是 1023。');
    else if (['P:A0', 'P:D9'].some(n => find(n) === a1)) add(0, 'a1_mixed', 'A1 和夜燈用的腳（A0 / D9）被連在一起了。電位器要用<b>自己的</b> A1。');
    const out = { iss, find, legs: null };
    const pot = h.parts.find(p => p.type === 'pot');
    if (!pot) add(1, 'pot_missing', '請把元件盒中的電位器拖到麵包板，跨過中間的坑。', false);
    else {
      const [l1, l2, lw] = legHoles(pot); const A = find(l1), B = find(l2), Wn = find(lw);
      out.legs = { A, B, W: Wn };
      const outerName = n => n === A ? '左邊外腳' : '右邊外腳';
      /* step 2: outer legs to 5V and GND (either way round is fine: it only reverses the knob direction) */
      if (Wn === v5 || Wn === gnd) add(3, 'pot_wiper_power', `電位器<b>中間的腳</b>接到了 <b>${Wn === v5 ? '5V' : 'GND'}</b>。中間腳是「輸出」，要接 <b>A1</b>；5V 和 GND 要接<b>兩隻外腳</b>。`);
      if ((A === v5 && B === v5) || (A === gnd && B === gnd)) add(2, 'pot_same', `電位器兩隻外腳都接到了 <b>${A === v5 ? '5V' : 'GND'}</b>，轉動旋鈕讀數也不會變。一隻接「+」電源軌，另一隻接「−」電源軌。`);
      else {
        [A, B].forEach(n => {
          if (n === v5 || n === gnd) return;
          const rail = cAll.railOf(n), ps = cAll.pinsIn(n).filter(x => x !== 'GND');
          if (n === a1) add(3, 'pot_a1_outer', `A1 接到了電位器的<b>${outerName(n)}</b>。A1 要接<b>中間</b>那隻腳，外腳接 5V 和 GND。`);
          else if (rail === 'bp' || rail === 'bn') add(2, 'pot_bottom_rail', '下方的電源軌沒有接到 5V 或 GND。請用麵包板<b>上方</b>的「+」和「−」電源軌（主任務已經接好電）。');
          else if (ps.length) add(2, 'pot_pin', `電位器${outerName(n)}接到了 <b>${pinPretty(ps[0])}</b>。兩隻外腳要接「+」和「−」電源軌。`);
          else if (!c.touched(n)) add(2, 'pot_outer_missing', `電位器${outerName(n)}還未接電：用短導線把它的直行接到上方的電源軌（一隻外腳接「+」，另一隻接「−」）。`, false);
          else add(2, 'pot_outer_nowhere', `電位器${outerName(n)}的導線沒有接到電源軌。`);
        });
      }
      /* step 3: wiper to A1 */
      if (Wn !== a1 && Wn !== v5 && Wn !== gnd && a1 !== gnd && a1 !== v5) {
        const ps = cAll.pinsIn(Wn).filter(x => x !== 'GND');
        if (ps.includes('A0')) add(3, 'pot_on_a0', '電位器中間腳接到了 <b>A0</b>。A0 已經用來讀光感應器，電位器要接 <b>A1</b>。');
        else if (ps.length) add(3, 'pot_wiper_pin', `電位器中間腳接到了 <b>${pinPretty(ps[0])}</b>，程式讀取的是 <b>A1</b>。`);
        else if (A === a1 || B === a1) { /* already reported */ }
        else if (!c.wiredPins.has('A1')) add(3, 'a1_missing', '還未連接 A1：由 Arduino 下方 ANALOG IN 的 <b>A1</b>，拉一條白色線到電位器<b>中間腳</b>的直行（坑的下面）。', false);
        else add(3, 'a1_nowhere', 'A1 的導線接到了<b>沒有元件</b>的位置。A1 要接在電位器中間腳<b>同一個</b>直行。');
      }
    }
    strayCheck(h.wires, find, parts, add, 4);
    return out;
  }

  /* ---------- steps ---------- */
  const STEPS_ALL = {
    main: ['插上光感應器（長腳在左）', '插上 10kΩ 電阻', '把 5V 和 GND 接到電源軌', '10kΩ 接「+」軌，光感應器接「−」軌', '連接 A0', '插上 LED 和 220Ω 電阻', '連接 D9 和 LED 的 GND', '最後檢查'],
    c1: ['插上電位器（跨過中間的坑）', '兩隻外腳接到「+」和「−」電源軌', '中間腳接 A1', '最後檢查'],
  };
  const STEPS = () => STEPS_ALL[MODE];
  const AUTO_HINT = { main: [1, 2, 6], c1: [1] };
  /* 分區（放元件的步驟顯示淡色底）：主任務的區，延伸挑戰另加的區 */
  const ZONES = { main: [{ name: '光感應器區', from: 1, to: 6 }, { name: '黃燈區', from: 12, to: 17 }] };
  const ZONES_X = { c1: [{ name: '電位器區', from: 21, to: 23, half: 'both' }] };
  const PLACE_STEPS = { main: [1, 2, 6], c1: [1] };
  const PAID_HINT = { main: [3, 4, 5, 7], c1: [2, 3] };
  const HINT_COST = { main: 2, c1: 1 };
  const doAnalyze = () => MODE === 'c1' ? analyzeC1() : analyze();
  function freeHoleIn(net, find, occ, rowsFirst) {
    const cands = HOLE_IDS.filter(id => find(id) === net && !occ[id] && !RAIL_NAME[P[id].row]);
    cands.sort((a, b) => rowsFirst === 'bottom' ? P[b].y - P[a].y : P[a].y - P[b].y);
    return cands[0] || null;
  }
  /* a free spot for a resistor with one leg in the same column as hole h */
  function resTargetAt(h, occ, prefer = -1) {
    const pa = parseHole(h); if (!pa || RAIL_NAME[pa.row]) return null;
    const rows = 'abcde'.includes(pa.row) ? ['c', 'd', 'b', 'e', 'a'] : ['h', 'i', 'g', 'j', 'f'];
    for (const dir of [prefer, -prefer]) for (const r of rows) {
      if (r === pa.row) continue;
      const c1 = dir < 0 ? pa.col - 4 : pa.col;
      if (c1 < 1 || c1 + 4 > COLS) continue;
      const h1 = holeAt(r, c1), h2 = holeAt(r, c1 + 4);
      if (!occ[h1] && !occ[h2]) return [h1, h2];
    }
    return null;
  }
  const freeRail = (row, near, occ) => { for (let d = 0; d < COLS; d++) for (const s of [0, -d, d]) { const id = holeAt(row, near + s); if (id && !occ[id]) return id; } return null; };
  function stepTargets(step) {
    const h = H(), occ = occupancy();
    if (MODE === 'main') {
      const L = h.parts.find(p => p.type === 'ls'), led = h.parts.find(p => p.type === 'led');
      if (step === 1) return L ? [] : ['f5', 'f6'];
      if (step === 6) {
        if (!led) return ['f16', 'f17'];
        const an = analyze(); const A = an.find(ledAK(led).a);
        if (resEnds(h.parts, an.find).some(o => o.x === A || o.y === A)) return [];
        return resTargetAt(ledAK(led).a, occ, -1) || [];
      }
      if (!L) return [];
      const an = analyze();
      if (step === 2) { if (!an.ls) return []; const sigHole = HOLE_IDS.find(id => an.find(id) === an.ls.sig && !RAIL_NAME[P[id].row]); if (resEnds(h.parts, an.find).some(o => o.x === an.ls.sig || o.y === an.ls.sig)) return []; return sigHole ? (resTargetAt(lsPM(L).a, occ, -1) || []) : []; }
      if (step === 3) { const t = []; const ws = allWires(h); if (!ws.some(w => w.a === 'P:5V' || w.b === 'P:5V')) t.push('P:5V', freeRail('tp', 8, occ)); if (!ws.some(w => ['P:GND', 'P:GND2', 'P:GND3'].includes(w.a) || ['P:GND', 'P:GND2', 'P:GND3'].includes(w.b))) t.push('P:GND', freeRail('tn', 8, occ)); return t.filter(Boolean); }
      if (step === 4) {
        if (!an.ls) return [];
        const t = [];
        const pu = resEnds(h.parts, an.find).find(o => (o.x === an.ls.sig) !== (o.y === an.ls.sig));
        if (pu) { const O = pu.x === an.ls.sig ? pu.y : pu.x; if (O !== an.find('P:5V')) { const x = freeHoleIn(O, an.find, occ); if (x) t.push(x, freeRail('tp', parseHole(x).col, occ)); } }
        if (an.ls.low !== an.find('P:GND')) { const y = freeHoleIn(an.ls.low, an.find, occ); if (y) t.push(y, freeRail('tn', parseHole(y).col, occ)); }
        return t.filter(Boolean);
      }
      if (step === 5) { if (!an.ls) return []; const x = freeHoleIn(an.ls.sig, an.find, occ); return ['P:A0'].concat(x ? [x] : []); }
      if (step === 7) {
        if (!an.led) return [];
        const t = ['P:D9']; const x = freeHoleIn(an.led.X, an.find, occ); if (x) t.push(x);
        if (an.led.Y !== an.find('P:GND')) { const y = freeHoleIn(an.led.Y, an.find, occ); if (y) t.push(y, freeRail('tn', parseHole(y).col, occ)); }
        return t.filter(Boolean);
      }
      return [];
    }
    const an = doAnalyze();
    const pot = h.parts.find(p => p.type === 'pot');
    if (step === 1) return pot ? [] : ['f21', 'f23', 'e22'];
    if (!an.legs) return [];
    const [l1, l2, lw] = legHoles(pot);
    if (step === 2) { const t = []; [[l1, 'tp'], [l2, 'tn']].forEach(([l, rail]) => { const n = an.find(l); if (n === an.find('P:5V') || n === an.find('P:GND')) return; const x = freeHoleIn(n, an.find, occ); if (x) t.push(x, freeRail(rail, parseHole(x).col, occ)); }); return t.filter(Boolean); }
    if (step === 3) { const x = freeHoleIn(an.find(lw), an.find, occ, 'bottom'); return ['P:A1'].concat(x ? [x] : []); }
    return [];
  }
  function stepBody(step) {
    const RULE = '<p class="small muted">小規則：元件插在 f 至 h 行，導線插在 j 行；每個區之間最少空出兩個直行。</p>';
    if (MODE === 'main') {
      if (step === 1) return `<p>把<b>光感應器</b>拖到麵包板的<b>光感應器區</b>（〔第1直行〕至〔第6直行〕），插在 〔f5〕、〔f6〕。它和 LED 一樣有正負極：<b>長腳（+）</b>在左，<b>短腳（−）</b>在右。</p>${RULE}`;
      if (step === 2) return `<p>插上一粒 <b>10kΩ</b> 電阻（色環<b>棕黑黑紅棕</b>）在 〔h1〕 至 〔h5〕：右端和光感應器<b>長腳</b>在<b>同一個直行</b>。</p><p class="small">元件盒有 10kΩ 和 220Ω 兩種電阻，看清楚色環才拿。10kΩ 和光感應器一齊，組成<b>分壓電路</b>。</p>`;
      if (step === 3) return `<p>今次有幾個零件要用 5V 和 GND，所以先接好麵包板頂部的<b>電源軌</b>（整行相通）：</p><ul class="small tight"><li>紅色線：〔5V〕（Arduino 下方）→「+」電源軌（紅線那一行）。</li><li>黑色線：〔GND〕（Arduino 上方，13 號旁邊）→「−」電源軌（最頂、藍線那一行）。</li></ul><p class="small muted">板上的藍色框會標示要用的腳位。</p>`;
      if (step === 4) return `<ul class="small tight"><li>紅色短線：10kΩ <b>左端</b>的直行 →「+」電源軌。</li><li>黑色短線：光感應器<b>短腳</b>的直行 →「−」電源軌。</li></ul><p class="small">現在電流由 5V 經過 10kΩ、光感應器，流到 GND。</p>`;
      if (step === 5) return `<p>藍色線：〔A0〕（Arduino 下方 ANALOG IN）→ 光感應器<b>長腳</b>的直行（即 10kΩ 和光感應器<b>中間</b>）。</p><p class="small">A0 量度這一點的電壓：越暗，電壓越高，讀數越大。</p>`;
      if (step === 6) return `<p>在<b>黃燈區</b>插<b>黃色 LED</b>：〔f16〕、〔f17〕，長腳在左。再插一粒 <b>220Ω</b> 電阻（色環<b>紅紅黑黑棕</b>）在 〔h12〕 至 〔h16〕：右端和 LED <b>長腳</b>在同一個直行。</p><p class="small muted">光感應器區和黃燈區之間空出幾個直行，實物上腳不會碰在一起。</p>`;
      if (step === 7) return `<ul class="small tight"><li>綠色線：〔D9〕（Arduino 上方，板上印 <b>~9</b>）→ 220Ω <b>左端</b>的直行。</li><li>黑色短線：LED <b>短腳</b>的直行 →「−」電源軌。</li></ul><p class="small">D9 在板上印成「~9」，「~」代表它可以調光（延伸挑戰會用到）。小心：〔D9〕 是 Arduino 上的腳位，和麵包板的〔第9直行〕無關。</p>`;
      return `<p>檢查所有導線都接好，沒有多餘的線和元件，然後按「完成接線檢查」。</p>`;
    }
    if (step === 1) return `<p>夜燈電路已經接好（今次不用改動）。把<b>電位器</b>拖到麵包板的<b>電位器區</b>，<b>跨過中間的坑</b>：兩隻外腳在坑上面 〔f21〕、〔f23〕，中間腳在坑下面 〔e22〕。</p>`;
    if (step === 2) return `<p>電位器的兩隻<b>外腳</b>接電源。〔5V〕 和 〔GND〕 已經接了電源軌，每個腳位只可以插一條線，所以由<b>電源軌</b>取電：</p><ul class="small tight"><li>紅色短線：左邊外腳的直行 →「+」電源軌。</li><li>黑色短線：右邊外腳的直行 →「−」電源軌。</li></ul>`;
    if (step === 3) return `<p>白色線：〔A1〕（Arduino 下方 ANALOG IN）→ 電位器<b>中間腳</b>的直行（坑的下面，a 至 d 行）。</p>`;
    return `<p>檢查新導線都接好，而且沒有改動夜燈電路，然後按「完成接線檢查」。</p>`;
  }

  /* ---------- UI state ---------- */
  let svg, gDyn, gHint, gGroup, gGhost, gFlow, gFixed, gTray;
  let sel = null;          // {type:'part'|'wire', id}
  let drag = null;
  let lastIssues = null;
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
  function nearestHoleForLeg(p, type) {
    let best = null, bd = 16;
    for (const id of HOLE_IDS) {
      if (type === 'pot' && (P[id].row !== 'f' || P[id].col > COLS - 2)) continue;
      const q = P[id]; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const legPts = p => legHoles(p).map(x => P[x]);
  function partBox(p, pts = legPts(p)) {
    const [a, b] = pts; const mx = (a.x + b.x) / 2;
    if (p.type === 'led' || p.type === 'ls') return { x: mx - 15, y: a.y - 42, w: 30, h: 40 };
    if (p.type === 'pot') return { x: a.x - 8, y: a.y - 2, w: 2 * PITCH + 16, h: 38 };
    return { x: a.x + 12, y: a.y - 10, w: b.x - a.x - 24, h: 20 };
  }
  const partName = p => p.type === 'led' ? CNAME[p.color] + ' LED' : p.type === 'res' ? OHM[p.ohm] + ' 電阻' : p.type === 'ls' ? '光感應器' : '電位器';

  let gZone, gCall;
  function build() {
    svg = $('#hwSvg');
    svg.innerHTML = DEFS + `<rect x="0" y="0" width="1150" height="640" fill="url(#matgrid)"/>` + unoSVG() + boardSVG() +
      `<g id="tray"><rect x="${TRAY.x}" y="${TRAY.y}" width="${TRAY.w}" height="${TRAY.h}" rx="12" fill="rgba(0,0,0,.25)" stroke="rgba(255,255,255,.15)"/>
        <text x="${TRAY.x + 16}" y="${TRAY.y + 20}" font-size="13" fill="#CFE3DD" font-weight="700">元件盒</text>
        <g id="gTray"></g>
        <text x="712" y="${TRAY.y + 52}" font-size="12" fill="#CFE3DD">拉導線：在腳位或孔上</text>
        <text x="712" y="${TRAY.y + 70}" font-size="12" fill="#CFE3DD"><tspan font-weight="700" fill="#fff">按住滑鼠</tspan>，拖到另一個孔。</text>
        <text x="712" y="${TRAY.y + 94}" font-size="11" fill="#9DBDB3">滑鼠停在孔上，會顯示</text>
        <text x="712" y="${TRAY.y + 110}" font-size="11" fill="#9DBDB3">哪些孔相通。</text>
        <rect x="${TRASH.x}" y="${TRASH.y}" width="${TRASH.w}" height="${TRASH.h}" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.3)" stroke-dasharray="5 4" id="trashZone"/>
        <g transform="translate(${TRASH.x + TRASH.w / 2 - 12} ${TRASH.y + 22})" fill="none" stroke="#CFE3DD" stroke-width="2"><path d="M2 6h20M8 6V3h8v3M5 6l1.5 18h11L19 6"/></g>
        <text x="${TRASH.x + TRASH.w / 2}" y="${TRASH.y + 74}" font-size="12" fill="#CFE3DD" text-anchor="middle">回收區</text>
        <text x="${TRASH.x + TRASH.w / 2}" y="${TRASH.y + 92}" font-size="10.5" fill="#9DBDB3" text-anchor="middle">拖到這裏移除</text>
      </g>
      <g id="gZone"></g><g id="gFixed"></g><g id="gGroup"></g><g id="gHint"></g><g id="gDyn"></g><g id="gFlow"></g><g id="gCall"></g><g id="gGhost"></g>`;
    gZone = $('#gZone'); gCall = $('#gCall'); gDyn = $('#gDyn'); gHint = $('#gHint'); gGroup = $('#gGroup'); gGhost = $('#gGhost'); gFlow = $('#gFlow'); gFixed = $('#gFixed'); gTray = $('#gTray');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', () => { drag = null; gGhost.innerHTML = ''; render(); });
    svg.addEventListener('pointerleave', () => { if (!drag) { hideTip(); gGroup.innerHTML = ''; } });
    svg.addEventListener('dblclick', e => { const p = svgPt(e); const hit = hitPart(p); if (hit && !H().done) { sel = { type: 'part', id: hit.id }; if (hit.type === 'led' || hit.type === 'ls') flipLed(); } });
    $('#swatches').innerHTML = COLORS.map(([c, n]) => `<button class="sw" style="background:${c}" data-c="${c}" title="${n}色導線" aria-label="${n}色導線"></button>`).join('');
    $$('#swatches .sw').forEach(b => b.onclick = () => { S.hw.color = b.dataset.c; save(); renderSwatches(); });
    document.addEventListener('keydown', e => {
      if (isHwView() && !H().done && sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !$('.modal-back')) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); }
        if (e.key === 'r' || e.key === 'R') { const p = selPart(); if (p && (p.type === 'led' || p.type === 'ls')) flipLed(); }
      }
    });
    built = true;
  }
  function renderSwatches() { $$('#swatches .sw').forEach(b => b.classList.toggle('sel', b.dataset.c === S.hw.color)); }
  const selPart = () => sel && sel.type === 'part' ? H().parts.find(p => p.id === sel.id) : null;
  function hitPart(pt) { const ps = sortParts(H().parts).reverse(); return ps.find(p => inRect(pt, partBox(p))) || null; }

  function renderTray() {
    const bins = BINS[MODE];
    gTray.innerHTML = bins.map((bin, i) => {
      const r = binRect(i), left = binLeft(bin), cx = BIN_X(i);
      const legs = trayLegs(bin.type, cx);
      const sample = left > 0 ? drawPart({ type: bin.type, color: bin.color, ohm: bin.ohm }, legs[0], legs[1], { noTag: true }) : '';
      return `<g data-bin="${i}"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="8" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>${sample}${bin.type === 'res' && left > 0 ? `<text x="${cx}" y="${TRAY.y + 106}" font-size="10" fill="#B9D4CC" text-anchor="middle">色環：${BAND_TXT[bin.ohm]}</text>` : ''}
        <text x="${cx}" y="${TRAY.y + 126}" font-size="11" fill="${left > 0 ? '#CFE3DD' : '#7F9C93'}" text-anchor="middle">${bin.label}${bin.max > 1 ? `（剩 ${left}）` : left > 0 ? '' : '（已用）'}</text></g>`;
    }).join('');
  }
  function render() {
    const h = H(), f = FIXED();
    gFixed.innerHTML = f ? `<g opacity=".9">${partsSVG(f)}</g>` : '';
    let s = '';
    h.wires.forEach(w => s += wireSVG(w, { hit: true, sel: sel && sel.type === 'wire' && sel.id === w.id }));
    sortParts(h.parts).forEach(p => {
      if (drag && drag.kind === 'part' && drag.part.id === p.id && drag.moved) return;
      const [a, b] = legPts(p);
      const opts = p.type === 'led' ? { lit: h.done ? true : undefined } : {};
      s += (sel && sel.id === p.id ? selBox(p) : '') + drawPart(p, a, b, opts);
    });
    gDyn.innerHTML = s;
    renderTray();
    const cur = h.step + 1;
    let tg = [];
    if (!h.done && (AUTO_HINT[MODE].includes(cur) || h.hinted[cur])) tg = stepTargets(cur);
    gHint.innerHTML = tg.filter(id => P[id]).map(id => { const q = P[id]; return `<circle class="pulse" cx="${q.x}" cy="${q.y}" r="8"/><circle class="target-dot" cx="${q.x}" cy="${q.y}" r="4" opacity=".9"/>`; }).join('');
    const zs = (ZONES.main || []).map(z => ({ ...z, faded: MODE !== 'main' })).concat(MODE === 'main' ? [] : (ZONES_X[MODE] || []));
    gZone.innerHTML = !h.done && (PLACE_STEPS[MODE] || []).includes(cur) ? WIRE.zonesSVG(zs, { colX, BY }) : '';
    gCall.innerHTML = h.done || cur > STEPS().length ? '' : WIRE.pinCallouts(stepTargets(cur), P);
    renderSelTools();
  }
  function selBox(p) { const b = partBox(p); return `<rect x="${b.x - 4}" y="${b.y - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="6" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-dasharray="4 3"/>`; }
  function renderSelTools() {
    const el = $('#selTools'), h = H();
    if (h.done) { el.innerHTML = '<span class="pill ok">接線已完成</span>'; return; }
    const p = selPart();
    if (p) el.innerHTML = `<span class="lbl">已選取：${partName(p)}</span>${p.type === 'led' ? '<button class="btn sm" id="stFlip">反轉 LED</button>' : ''}${p.type === 'ls' ? '<button class="btn sm" id="stFlip">反轉光感應器</button>' : ''}<button class="btn sm" id="stDel">放回元件盒</button>`;
    else if (sel && sel.type === 'wire') { const w = h.wires.find(x => x.id === sel.id); el.innerHTML = w ? `<span class="lbl">已選取：導線 ${endName(w.a)} → ${endName(w.b)}</span><button class="btn sm" id="stDel">刪除導線</button>` : ''; }
    else el.innerHTML = `<span class="lbl">點選元件或導線，可以${MODE === 'main' ? '反轉或' : ''}移除</span>`;
    const fl = $('#stFlip'); if (fl) fl.onclick = flipLed;
    const d = $('#stDel'); if (d) d.onclick = removeSel;
  }
  function changed() { lastIssues = null; save(); render(); renderPanel(); }
  function flipLed() { const p = selPart(); if (!p || (p.type !== 'led' && p.type !== 'ls')) return; p.flipped = !p.flipped; toast(`${partName(p)}已反轉：長腳（+）現在在${p.flipped ? '右' : '左'}邊`); changed(); }
  function removeSel() {
    if (!sel) return;
    const h = H();
    if (sel.type === 'wire') h.wires = h.wires.filter(w => w.id !== sel.id);
    else h.parts = h.parts.filter(p => p.id !== sel.id);
    sel = null; changed();
  }

  /* ---------- tooltip ---------- */
  function showTip(html, e) { const t = $('#tip'); t.innerHTML = html; t.hidden = false; t.style.left = (e.clientX + 14) + 'px'; t.style.top = (e.clientY + 16) + 'px'; }
  function hideTip() { $('#tip').hidden = true; }
  function hoverAt(p, e) {
    const id = nearestPoint(p);
    if (!id) { hideTip(); gGroup.innerHTML = ''; return; }
    const q = P[id];
    if (q.kind === 'pin') { showTip(WIRE.tipPin(q.name, q.label), e); gGroup.innerHTML = `<circle cx="${q.x}" cy="${q.y}" r="8" fill="none" stroke="#FFD27A" stroke-width="2"/>`; return; }
    showTip(WIRE.tipHole(id), e);
    gGroup.innerHTML = HOLE_IDS.filter(x => P[x].group === q.group).map(x => `<rect x="${P[x].x - 6}" y="${P[x].y - 6}" width="12" height="12" rx="3" fill="rgba(255,210,122,.45)" stroke="#E0A63A"/>`).join('');
  }

  /* ---------- pointer handling ---------- */
  function startPartDrag(part, legs, p, e, isNew) {
    drag = { kind: 'part', part, isNew, off: { x: p.x - legs[0].x, y: p.y - legs[0].y }, start: p, moved: false, snap: null };
    sel = isNew ? null : { type: 'part', id: part.id }; svg.setPointerCapture(e.pointerId); render();
  }
  function onDown(e) {
    if (e.button !== 0) return;
    const p = svgPt(e);
    const h = H();
    if (h.done) return;
    hideTip();
    const hit = hitPart(p);
    if (hit) return startPartDrag(hit, legPts(hit), p, e, false);
    const bi = BINS[MODE].findIndex((b, i) => inRect(p, binRect(i)));
    if (bi >= 0) {
      const bin = BINS[MODE][bi];
      if (binLeft(bin) <= 0) { toast(`${bin.label}已經用完了。`); return; }
      return startPartDrag(newPart(bin), trayLegs(bin.type, BIN_X(bi)), p, e, true);
    }
    const occ = occupancy();
    const wt = e.target.closest && e.target.closest('[data-wire]');
    const ptId = nearestPoint(p);
    if (ptId && occ[ptId] && occ[ptId].type === 'fixed') { toast('這是原本的夜燈電路，今次不用改動。'); return; }
    if (ptId && occ[ptId] && occ[ptId].type === 'wire') {
      const w = h.wires.find(x => x.id === occ[ptId].id);
      drag = { kind: 'wire', wire: w, end: occ[ptId].end, fixed: occ[ptId].end === 'a' ? w.b : w.a, start: p, moved: false };
      sel = { type: 'wire', id: w.id }; svg.setPointerCapture(e.pointerId); render(); return;
    }
    if (ptId && occ[ptId] && occ[ptId].type === 'part') { const part = h.parts.find(x => x.id === occ[ptId].id); return startPartDrag(part, legPts(part), p, e, false); }
    if (wt) { sel = { type: 'wire', id: wt.dataset.wire }; render(); return; }
    if (ptId) { drag = { kind: 'wire', wire: null, fixed: ptId, start: p, moved: false }; sel = null; svg.setPointerCapture(e.pointerId); render(); return; }
    sel = null; render();
  }
  function ghostLegs(part, h1) {
    if (part.type === 'pot') { const q = parseHole(h1); return [P[h1], P[holeAt('f', q.col + 2)]]; }
    const q = parseHole(h1); const h2 = holeAt(q.row, q.col + SPAN[part.type]); return h2 ? [P[h1], P[h2]] : null;
  }
  function onMove(e) {
    const p = svgPt(e);
    if (!drag) { hoverAt(p, e); return; }
    if (!drag.moved && Math.hypot(p.x - drag.start.x, p.y - drag.start.y) < 4) return;
    if (!drag.moved) { drag.moved = true; render(); }
    const occ = occupancy();
    if (drag.kind === 'part') {
      const part = drag.part;
      const leg1 = { x: p.x - drag.off.x, y: p.y - drag.off.y };
      const own = new Set(drag.isNew ? [] : legHoles(part));
      const h1 = nearestHoleForLeg(leg1, part.type);
      let snap = null;
      if (h1 && ghostLegs(part, h1)) {
        const holes = legHoles({ ...part, h1 });
        snap = { h1, holes, ok: holes.every(x => x && (!occ[x] || own.has(x))) };
      }
      drag.snap = snap;
      const legs = snap ? ghostLegs(part, h1) : [leg1, { x: leg1.x + SPAN[part.type] * PITCH, y: leg1.y }];
      let g = drawPart(part, legs[0], legs[1], { ghost: true });
      if (snap) g += snap.holes.map(x => `<circle cx="${P[x].x}" cy="${P[x].y}" r="6" fill="none" stroke="${snap.ok ? '#6CF09A' : '#FF6B5E'}" stroke-width="2.5"/>`).join('');
      gGhost.innerHTML = g;
      gGroup.innerHTML = snap ? snap.holes.flatMap(x => HOLE_IDS.filter(y => P[y].group === P[x].group)).map(x => `<rect x="${P[x].x - 6}" y="${P[x].y - 6}" width="12" height="12" rx="3" fill="rgba(255,210,122,.35)"/>`).join('') : '';
      if (snap) showTip(`${partName(part)}：麵包板 <b>${snap.holes.join('、')}</b>${snap.ok ? '' : '（已有東西）'}`, e);
      else if (part.type === 'pot') showTip('電位器要跨過<b>中間的坑</b>（f 行和 e 行）', e);
      else hideTip();
    } else {
      const from = P[drag.fixed];
      const tgt = nearestPoint(p);
      const ok = tgt && tgt !== drag.fixed && (!occ[tgt] || (drag.wire && occ[tgt].id === drag.wire.id));
      drag.target = ok ? tgt : null;
      const color = drag.wire ? drag.wire.color : S.hw.color;
      gGhost.innerHTML = wireSVG({ color }, { pa: from, pb: ok ? P[tgt] : p, ghost: true }) + (tgt ? `<circle cx="${P[tgt].x}" cy="${P[tgt].y}" r="8" fill="none" stroke="${ok ? '#6CF09A' : '#FF6B5E'}" stroke-width="2.5"/>` : '');
      if (drag.wire) { const wg = gDyn.querySelector(`[data-wire="${drag.wire.id}"]`); if (wg) wg.parentNode.setAttribute('opacity', '.15'); }
      if (tgt) { const q = P[tgt]; showTip(q.kind === 'pin' ? WIRE.tipPin(q.name, q.label) : WIRE.tipHole(tgt), e); } else hideTip();
    }
  }
  function onUp(e) {
    if (!drag) return;
    const p = svgPt(e);
    const d = drag; drag = null; gGhost.innerHTML = ''; gGroup.innerHTML = ''; hideTip();
    try { svg.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!d.moved) { render(); return; }
    const h = H();
    if (d.kind === 'part') {
      if (inRect(p, TRASH) || (inRect(p, TRAY) && !d.snap)) { if (!d.isNew) h.parts = h.parts.filter(x => x.id !== d.part.id); sel = null; changed(); return; }
      if (d.snap && d.snap.ok) {
        d.part.h1 = d.snap.h1;
        if (d.isNew) h.parts.push(d.part);
        sel = { type: 'part', id: d.part.id };
        changed(); return;
      }
      if (d.snap && !d.snap.ok) toast('那個位置已經有東西，請換另一個孔。', 'err');
      else toast(d.part.type === 'pot' ? '電位器要跨過麵包板中間的坑。' : '元件要插在麵包板的孔上。');
      render(); return;
    }
    if (d.wire) {
      if (inRect(p, TRASH)) { h.wires = h.wires.filter(w => w !== d.wire); sel = null; toast('已移除導線'); changed(); return; }
      if (d.target) { d.wire[d.end] = d.target; changed(); return; }
      render(); return;
    }
    if (d.target) {
      const w = { id: 'w' + Date.now().toString(36) + Math.floor(Math.random() * 99), a: d.fixed, b: d.target, color: S.hw.color };
      h.wires.push(w); sel = { type: 'wire', id: w.id }; changed(); return;
    }
    const tgt = nearestPoint(p);
    if (tgt && tgt !== d.fixed) toast('那個孔已經有東西了，每個孔只可以插一樣東西。', 'err');
    render();
  }

  /* ---------- checking ---------- */
  const layoutSig = () => { const h = H(); return JSON.stringify([h.parts.map(p => [p.type, p.color, p.ohm, p.h1, p.flipped, p.rot].join('|')).sort(), h.wires.map(w => [w.a, w.b].sort().join('-')).sort()]); };
  function crowdTips() {
    const f = FIXED(), parts = (f ? f.parts : []).concat(H().parts);
    const an = doAnalyze(), find = an.find || (x => x);
    return WIRE.crowded(parts.map(p => ({ id: p.id, name: partName(p), legs: legHoles(p) })), (a, b) => find(a) === find(b));
  }
  function runCheck(upto) {
    const h = H(), last = STEPS().length;
    const an = doAnalyze();
    let rel = an.iss.filter(i => i.step <= upto);
    const globals = rel.filter(i => i.step === 0);
    const minStep = Math.min(...rel.filter(i => i.step > 0).map(i => i.step), 99);
    rel = globals.concat(rel.filter(i => i.step === minStep));
    rel = rel.filter((i, k) => rel.findIndex(j => j.msg === i.msg) === k);
    if (!rel.length) {
      h.step = Math.max(h.step, upto);
      if (upto >= last) { finish(); return; }
      changed(); lastIssues = { kind: 'ok', html: alertBox('ok', `第 ${upto} 步正確！繼續下一步。`) + WIRE.crowdBox(crowdTips()) }; renderPanel(); return;
    }
    const counted = rel.some(i => i.counts);
    const sig = layoutSig();
    let newErr = false;
    if (counted && sig !== h.lastFailSig) {
      h.errors++; newErr = true; h.lastFailSig = sig;
      h.stepFails[h.step + 1] = (h.stepFails[h.step + 1] || 0) + 1;
      rel.filter(i => i.counts).forEach(i => pushLog(h, i.msg.replace(/<[^>]+>/g, '')));
    }
    lastIssues = { html: rel.map(i => alertBox(i.counts ? 'err' : 'warn', i.msg)).join('') + (newErr ? `<p class="small muted">已記錄 1 次接線錯誤。</p>` : (counted ? '<p class="small muted">電路未有改動，這次不再重複扣分。</p>' : '')) + WIRE.crowdBox(crowdTips()) };
    save(); renderPanel();
  }
  function flowLines() { return allWires(H()).map(w => `<path class="flowline" d="${wirePath(P[w.a], P[w.b])}"/>`).join(''); }
  const NEXT = { main: 'code', c1: 'c1code' };
  function finish() {
    const h = H();
    h.done = true; h.step = STEPS().length; sel = null;
    if (MODE === 'main') { S.t.hwEnd = now(); if (!S.t.code) S.t.code = now(); unlock('code'); }
    else S.ext[MODE].t.hwEnd = now();
    save(); render(); renderPanel();
    gFlow.innerHTML = flowLines();
    const pills = `<div class="row" style="margin-top:12px"><span class="pill ${h.errors ? 'warn' : 'ok'}">接線錯誤 ${h.errors} 次</span><span class="pill ${h.hints ? 'warn' : 'ok'}">使用提示 ${h.hints} 次</span></div>`;
    const txt = {
      main: `<p>做得好！你的電路有兩部分：</p><ul class="tight"><li><b>輸入：</b>5V → 10kΩ → 光感應器 → GND，A0 量度兩者<b>中間</b>的電壓</li><li><b>輸出：</b>D9 → 220Ω → 黃色 LED → GND</li></ul><p class="muted" style="margin-top:8px">越暗，光感應器越難導電，A0 的電壓越高，讀數越大（最大 1023）。</p>`,
      c1: `<p>做得好！新加的電路是：<b>「+」軌 → 電位器 → 「−」軌</b>，中間腳接 <b>A1</b>。夜燈電路保持不變。</p><p class="muted" style="margin-top:8px">轉動旋鈕，中間腳的電壓就會在 0V 至 5V 之間改變，A1 讀到 0 至 1023。</p>`,
    }[MODE];
    modal({ title: '接線完成！', html: WIRE.fmt(txt) + pills, actions: [{ label: '留在這頁', kind: 'ghost' }, { label: '下一步：編寫程式', kind: 'go', onClick: () => goStage(NEXT[MODE]) }] });
  }

  function renderPanel() {
    const h = H(), cur = h.step + 1, steps = STEPS(), last = steps.length, paid = PAID_HINT[MODE];
    $('#hwEyebrow').textContent = { main: '第 2 步', c1: '延伸挑戰 1 · 調校靈敏度' }[MODE];
    $('#hwTitle').textContent = { main: '硬件接線', c1: '加入電位器' }[MODE];
    $('#hwKnow').innerHTML = WIRE.fmt({
      main: `<div><b>麵包板：</b>同一個直行的 f 至 j 五個孔相通，a–e 另一組。頂部的電源軌是<b>整行</b>相通的：最頂一行「−」（藍線），下一行「+」（紅線）。</div><div><b>光感應器：</b>透明平頂，樣子像 LED，<b>長腳是 +</b>。越暗越難導電。</div><div><b>電阻色環：</b>220Ω = 紅紅黑黑棕；10kΩ = 棕黑黑紅棕。</div>`,
      c1: `<div><b>電位器：</b>轉動旋鈕會改變中間腳的電壓。兩隻外腳接 5V 和 GND，中間腳接類比輸入腳。</div><div><b>為甚麼用 A1：</b>A0 已經用來讀光感應器，電位器要用另一支類比腳。</div>`,
    }[MODE]);
    $('#hwSteps').innerHTML = WIRE.fmt(steps.map((t, i) => {
      const n = i + 1, cls = n <= h.step ? 'done' : n === cur && !h.done ? 'cur' : 'locked';
      let body = '';
      if (cls === 'cur') {
        body = `<div class="sb">${stepBody(n)}<div class="row">`;
        body += n < last ? `<button class="btn primary sm" data-check="${n}">檢查這一步</button>` : `<button class="btn go" data-check="${last}">完成接線檢查</button>`;
        if (paid.includes(n) && !h.hinted[n]) body += `<button class="btn sm ghost" data-hint="${n}">顯示提示位置（扣 ${HINT_COST[MODE]} 分）</button>`;
        if (paid.includes(n) && h.hinted[n]) body += `<span class="pill warn">提示位置已顯示</span>`;
        body += '</div></div>';
        if ((h.stepFails[n] || 0) >= 2 && paid.includes(n) && !h.hinted[n]) body += `<div class="sb">${alertBox('info', '試了幾次也不成功？可以按「顯示提示位置」，看看應該接到哪裏。')}</div>`;
      }
      return `<li class="${cls}"><div class="sh"><i>${n <= h.step ? '✓' : n}</i>${t}</div>${body}</li>`;
    }).join(''));
    $$('#hwSteps [data-check]').forEach(b => b.onclick = () => runCheck(+b.dataset.check));
    $$('#hwSteps [data-hint]').forEach(b => b.onclick = () => {
      const n = +b.dataset.hint;
      if (!stepTargets(n).length) { toast('先完成前面的步驟，才可以顯示提示位置。'); return; }
      h.hinted[n] = true; h.hints++; pushLog(h, `使用提示：第 ${n} 步（${steps[n - 1]}）`);
      save(); render(); renderPanel();
    });
    let issues = lastIssues ? lastIssues.html : '';
    if (h.done) issues = alertBox('ok', '接線正確，已經完成！') + `<button class="btn go" id="hwNext">下一步：編寫程式</button>`;
    $('#hwIssues').innerHTML = WIRE.fmt(issues);
    const nx = $('#hwNext'); if (nx) nx.onclick = () => goStage(NEXT[MODE]);
    $('#hwStats').innerHTML = `<span class="pill ${h.errors ? 'err' : ''}">接線錯誤 ${h.errors} 次</span><span class="pill ${h.hints ? 'warn' : ''}">使用提示 ${h.hints} 次</span>` + (MODE !== 'main' ? '<button class="btn sm ghost" id="hwBackExt">返回延伸挑戰</button>' : '');
    const bk = $('#hwBackExt'); if (bk) bk.onclick = () => goStage('ext');
  }

  function enter(mode = 'main') {
    if (!built) build();
    if (mode !== MODE) { sel = null; drag = null; lastIssues = null; }
    MODE = mode;
    renderSwatches(); render(); renderPanel();
    gFlow.innerHTML = H().done ? flowLines() : '';
  }

  /* teacher demo: the suggested layout */
  const W = (a, b, color) => ({ id: 'w' + a.replace(':', '') + b, a, b, color });
  function autoWire(mode = MODE) {
    const R = '#D63A2F', Wh = '#F4F4F0', G = '#2E9B4F', K = '#2A2A2A', B = '#2F6FD6';
    const mk = (type, h1, extra = {}) => ({ id: 'p' + type + h1, type, h1, ...extra });
    if (mode === 'c1') {
      Object.assign(S.ext.c1.hw, { parts: [mk('pot', 'f21')], wires: [W('j21', 'tp21', R), W('j23', 'tn23', K), W('P:A1', 'a22', Wh)], step: 3 });
    } else {
      Object.assign(S.hw, {
        parts: [mk('ls', 'f5', { flipped: false }), mk('res', 'h1', { ohm: 10000 }), mk('led', 'f16', { color: 'yellow', flipped: false }), mk('res', 'h12', { ohm: 220 })],
        wires: [W('P:5V', 'tp8', R), W('P:GND', 'tn8', K), W('j1', 'tp1', R), W('P:A0', 'j5', B), W('j6', 'tn6', K), W('P:D9', 'j12', G), W('j17', 'tn17', K)],
        step: 7,
      });
    }
    S.teacherUsed = true; save();
    if (built) { render(); renderPanel(); }
  }

  const layout = () => ({ parts: S.hw.parts.map(p => ({ ...p, legs: legHoles(p) })), wires: S.hw.wires.slice() });
  return { layout, enter, circuitSVG, analyze, analyzeC1, autoWire, runCheck, P, HOLE_IDS, legHoles, mode: () => MODE };
})();
stageInit.hw = () => HW.enter('main');
stageInit.c1hw = () => HW.enter('c1');
