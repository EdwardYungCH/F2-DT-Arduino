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
  const SPAN = { btn: 2, pz: 3, ls: 1, res: 4 };
  const BANDS = { 220: ['#D12B2B', '#D12B2B', '#1E1E1E', '#1E1E1E', '#7A4A1E'], 10000: ['#7A4A1E', '#1E1E1E', '#1E1E1E', '#D12B2B', '#7A4A1E'] };   // 5-band metal-film resistors (blue body) as in the kit
  const BAND_TXT = { 220: '紅紅黑黑棕', 10000: '棕黑黑紅棕' };
  const OHM = { 220: '220Ω', 10000: '10kΩ' };
  /* button: h1 is the top-left leg, always in row f; the 4 legs straddle the centre channel */
  function legHoles(p) {
    const q = parseHole(p.h1);
    if (p.type === 'btn') return ['f' + q.col, 'f' + (q.col + 2), 'e' + q.col, 'e' + (q.col + 2)];
    return [p.h1, holeAt(q.row, q.col + SPAN[p.type])];
  }
  /* light sensor: labelled like an LED (long +, short −) but plugged in reversed: a = short leg (−) on the 10kΩ / A0 side */
  const lsPM = L => { const [h1, h2] = legHoles(L); return L.flipped ? { a: h2, k: h1 } : { a: h1, k: h2 }; };
  /* internal connections of the 4-leg button: rot=false is the correct way (legs point up / down across the channel).
     Each leg pair across the channel is always joined; pressing joins the left pair with the right pair. */
  function btnPairs(p, pressed) {
    const [f1, f2, e1, e2] = legHoles(p);
    const base = p.rot ? [[f1, f2], [e1, e2]] : [[f1, e1], [f2, e2]];
    return pressed ? base.concat([[base[0][0], base[1][0]]]) : base;
  }
  /* pressed: true = every button held down, or an array of part ids held down */
  function partPairs(parts, pressed) {
    const out = [];
    parts.forEach(p => { if (p.type === 'btn') out.push(...btnPairs(p, pressed === true || (Array.isArray(pressed) && pressed.includes(p.id)))); });
    return out;
  }

  /* ---------- SVG builders for parts ---------- */
  /* x,y = top-left leg; opts.label = the note name shown above the button */
  function btnSVG(x, y, rot, opts = {}) {
    const op = opts.ghost ? ' opacity=".7"' : '';
    const legs = [[x, y], [x + 40, y], [x, y + 40], [x + 40, y + 40]];
    const tab = ([lx, ly], i) => rot
      ? `<rect x="${lx + (i % 2 ? -2 : -8)}" y="${ly - 2}" width="10" height="4" rx="1" fill="#C9CED1"/>`
      : `<rect x="${lx - 2}" y="${ly + (i < 2 ? -8 : -2)}" width="4" height="10" rx="1" fill="#C9CED1"/>`;
    return `<g class="btnpart" data-btn="${opts.id || 1}"${op} style="${opts.clickable ? 'cursor:pointer' : ''}">
      ${legs.map(tab).join('')}
      <rect x="${x + 3}" y="${y + 3}" width="34" height="34" rx="3" fill="#2B2F33" stroke="#555" stroke-width="1.5"/>
      <rect x="${x + 6}" y="${y + 6}" width="28" height="28" rx="2" fill="none" stroke="#3E4448" stroke-width="1"/>
      <circle class="btncap" cx="${x + 20}" cy="${y + 20}" r="${opts.pressed ? 9 : 10.5}" fill="${opts.pressed ? '#8E1B12' : '#C9352A'}" stroke="#7A1A12" stroke-width="1.5"/>
      ${opts.label ? `<g pointer-events="none"><rect x="${x + 2}" y="${y - 30}" width="36" height="15" rx="4" fill="#FFF4D6" stroke="#E0A63A"/><text x="${x + 20}" y="${y - 19}" font-size="10.5" font-weight="800" fill="#5E4100" text-anchor="middle">${opts.label}</text></g>` : ''}
      ${opts.clickable ? `<circle cx="${x + 20}" cy="${y + 20}" r="24" fill="transparent"/>` : ''}
    </g>`;
  }
  /* buzzer: round black body, 2 legs 3 columns apart (no polarity); opts.sound shows sound waves */
  function pzSVG(p1, p2, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y, cy = y - 34;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="pz"${op}>
      ${opts.sound !== undefined ? `<g class="pzwaves" opacity="${opts.sound ? 1 : 0}" fill="none" stroke="#FFD34D" stroke-width="2.5" stroke-linecap="round"><path d="M${mx + 30} ${cy - 10}q7 10 0 20"/><path d="M${mx + 38} ${cy - 17}q12 17 0 34"/><path d="M${mx - 30} ${cy - 10}q-7 10 0 20"/><path d="M${mx - 38} ${cy - 17}q-12 17 0 34"/></g>` : ''}
      <path d="M${p1.x} ${y}V${cy + 22}L${mx - 10} ${cy + 16}M${p2.x} ${y}V${cy + 22}L${mx + 10} ${cy + 16}" stroke="#B9BEC0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${mx}" cy="${cy}" r="23" fill="#1B1B1B" stroke="#4A4A4A" stroke-width="2"/>
      <circle cx="${mx}" cy="${cy}" r="16" fill="none" stroke="#333" stroke-width="1.5"/>
      <circle cx="${mx}" cy="${cy}" r="3.5" fill="#000"/>
    </g>`;
  }
  /* light sensor: clear, flat-topped, like a 5mm LED; drawn plugged in reversed: a (signal side) = short leg (−) */
  function lsSVG(p1, p2, flipped, opts = {}) {
    const mx = (p1.x + p2.x) / 2, y = p1.y, top = y - 40;
    const ax = flipped ? p2.x : p1.x, kx = flipped ? p1.x : p2.x;
    const ax0 = flipped ? mx + 5 : mx - 5, kx0 = flipped ? mx - 5 : mx + 5;
    const op = opts.ghost ? ' opacity=".7"' : '';
    return `<g class="lspart"${op}>
      <path d="M${ax0} ${y - 15}L${ax} ${y}" stroke="#B9BEC0" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${kx0} ${y - 15}V${y - 11}L${kx} ${y - 5}V${y}" stroke="#B9BEC0" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="${mx - 10}" y="${top + 4}" width="20" height="22" rx="3" fill="#E4EEF2" fill-opacity=".9" stroke="#9FB3BB"/>
      <rect x="${mx - 11}" y="${top}" width="22" height="6" rx="1.5" fill="#F7FBFC" stroke="#9FB3BB"/>
      <rect x="${mx - 4}" y="${top + 10}" width="8" height="6" fill="#4A4A4A"/>
      <path d="M${mx - 4} ${top + 19}h8" stroke="#C9A53A" stroke-width="1.4"/>
      <rect x="${mx - 12}" y="${top + 25}" width="24" height="3" rx="1" fill="#B9C7CC"/>
      ${opts.shade !== undefined ? `<g class="lsshade" opacity="${opts.shade}" pointer-events="none"><ellipse cx="${mx}" cy="${top + 4}" rx="30" ry="22" fill="#0A1418" opacity=".75"/><text x="${mx}" y="${top - 6}" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">手</text></g>` : ''}
      ${opts.noSigns ? '' : `<text x="${ax + (flipped ? 9 : -9)}" y="${y - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="#9FD3FF">−</text>
      <text x="${kx + (flipped ? -9 : 9)}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="#FFD34D">+</text>`}
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
  function drawPart(p, a, b, opts = {}) {
    if (p.type === 'btn') return btnSVG(a.x, a.y, !!p.rot, { ...opts, id: p.id });
    if (p.type === 'pz') return pzSVG(a, b, opts);
    if (p.type === 'ls') return lsSVG(a, b, !!p.flipped, opts);
    if (p.type === 'res') return resSVG(a, b, { ...opts, ohm: p.ohm });
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
      s += `<text transform="translate(${x + 3} ${topY + 12}) rotate(-90)" text-anchor="end" font-size="8.5" fill="#fff" font-family="monospace" ${['D2', 'D3', 'D4', 'D5', 'D8', 'GND'].includes(n) ? 'font-weight="700"' : ''}>${tl[n] || PIN_LABEL[n] || n}</text>`;
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
  const DRAW_ORDER = { res: 0, btn: 1, pz: 2, ls: 3 };
  const sortParts = parts => parts.slice().sort((a, b) => DRAW_ORDER[a.type] - DRAW_ORDER[b.type]);
  function partsSVG(h, opts = {}) {
    let s = '';
    (h.wires || []).forEach(w => s += wireSVG(w));
    sortParts(h.parts || []).forEach(p => {
      const [a, b] = endPts(p);
      s += drawPart(p, a, b, p.type === 'pz' ? { sound: false } : p.type === 'btn' ? { clickable: !!opts.clickable, label: (opts.labels || {})[p.id] } : p.type === 'ls' ? { shade: 0 } : {});
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
      { key: 'btn', type: 'btn', label: '按鈕', max: 4 },
      { key: 'pz', type: 'pz', label: '蜂鳴器', max: 1 },
    ],
    c1: [
      { key: 'ls', type: 'ls', label: '光感應器', max: 1 },
      { key: 'r10k', type: 'res', ohm: 10000, label: '10kΩ', max: 1 },
      { key: 'r220', type: 'res', ohm: 220, label: '220Ω', max: 1 },
    ],
  };
  const BIN_X = i => 84 + i * 112;
  const binRect = i => ({ x: BIN_X(i) - 54, y: TRAY.y + 30, w: 108, h: 100 });
  const binMatch = (bin, p) => p.type === bin.type && (bin.color ? p.color === bin.color : true) && (bin.ohm ? p.ohm === bin.ohm : true);
  const binLeft = bin => bin.max - H().parts.filter(p => binMatch(bin, p)).length;
  function trayLegs(type, cx) {
    if (type === 'ls') return [{ x: cx - 10, y: 598 }, { x: cx + 10, y: 598 }];
    if (type === 'btn') return [{ x: cx - 20, y: 548 }, { x: cx + 20, y: 548 }];
    if (type === 'pz') return [{ x: cx - 30, y: 604 }, { x: cx + 30, y: 604 }];
    if (type === 'res') return [{ x: cx - 40, y: 574 }, { x: cx + 40, y: 574 }];
    return [{ x: cx - 20, y: 600 }, { x: cx + 20, y: 600 }];
  }
  const newPart = bin => ({ id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 999), type: bin.type, ...(bin.color ? { color: bin.color } : {}), ...(bin.type === 'ls' ? { flipped: false } : {}), ...(bin.type === 'btn' ? { rot: false } : {}), ...(bin.ohm ? { ohm: bin.ohm } : {}) });

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
  const KEY_PINS = KEYS.map(k => k.pin);                       // D2 … D5
  const NOTE_OF = {}; KEYS.forEach(k => { NOTE_OF[k.pin] = k.name; });
  const BTN_SPOT = [3, 9, 15, 21];                             // suggested columns (left legs) for Do, Re, Mi, So
  const pinPretty = n => `〔${pinName(n)}〕`;
  const endName = id => id.startsWith('P:') ? pinName(P[id].name) : id;
  const printed = n => ({ D3: '~3', D5: '~5' }[n] || n.slice(1));
  function ctxFor(wires, find) {
    const pinsIn = net => [...new Set(PIN_IDS.filter(p => find(p) === net).map(p => pinName(P[p].name)))];
    const wiredPins = new Set(wires.flatMap(w => [w.a, w.b]).filter(x => x.startsWith('P:')).map(x => pinName(P[x].name)));
    const touched = net => wires.some(w => find(w.a) === net);
    const railOf = net => { const id = HOLE_IDS.find(x => RAIL_NAME[P[x].row] && find(x) === net); return id ? P[id].row : null; };
    return { pinsIn, wiredPins, touched, railOf };
  }
  const resEnds = (parts, find) => parts.filter(p => p.type === 'res').map(r => { const [x, y] = legHoles(r).map(find); return { r, x, y }; });
  const isPlusRail = r => r === 'tp' || r === 'bp', isMinusRail = r => r === 'tn' || r === 'bn';
  const railsIn = (find, net) => [...new Set(HOLE_IDS.filter(x => RAIL_NAME[P[x].row] && find(x) === net).map(x => P[x].row))];
  /* buttons sorted left → right (the order of the keys on a real piano) */
  const btnsOf = parts => parts.filter(p => p.type === 'btn').sort((a, b) => parseHole(a.h1).col - parseHole(b.h1).col);
  const colOfHole = id => parseHole(id).col;

  /* buzzer: one leg to D8, the other to GND (no polarity) */
  function buzzerChain(pz, find, c, add, nets, steps) {
    const { gnd, v5 } = nets, d8 = find('P:D8');
    const [l1, l2] = legHoles(pz); const N1 = find(l1), N2 = find(l2);
    if (N1 === N2) { add(steps.place, 'pz_short', '蜂鳴器兩隻腳插在<b>相通</b>的孔，被短路了，不會響。請把兩隻腳放在不同的直行，例如 〔f27〕 和 〔f30〕。'); return { N1, N2 }; }
    const legPins = [...new Set(c.pinsIn(N1).concat(c.pinsIn(N2)))].filter(n => n !== 'GND');
    if (N1 !== d8 && N2 !== d8) {
      const k = legPins.find(n => KEY_PINS.includes(n)), d = legPins.find(n => /^[DA]\d+$/.test(n)), pw = legPins.find(n => POWER.includes(n));
      if (pw) add(steps.sig, 'pz_power', `蜂鳴器接到了 <b>${PIN_LABEL[pw]}</b>。蜂鳴器要不停開關的信號才會發聲，請改接到 〔D8〕。`);
      else if (k) add(steps.sig, 'pz_key_pin', `蜂鳴器接到了 ${pinPretty(k)}，那是 <b>${NOTE_OF[k]} 鍵</b>用的腳。程式用 〔D8〕 控制蜂鳴器，請改接到 〔D8〕。`);
      else if (d) add(steps.sig, 'pz_wrong_pin', `蜂鳴器接到了 ${pinPretty(d)}，但程式用的是 D8。請改接到 〔D8〕。`);
      else if (!c.wiredPins.has('D8')) add(steps.sig, 'd8_missing', '還未連接 D8：由 Arduino 上方的 〔D8〕（板上印 8）拉一條藍色線到蜂鳴器<b>左腳</b>的直行。', false);
      else add(steps.sig, 'd8_nowhere', 'D8 的導線接到了<b>沒有元件</b>的位置。導線要插在和蜂鳴器其中一隻腳<b>同一個</b>直行。');
    }
    if (N1 !== gnd && N2 !== gnd) {
      const other = N1 === d8 ? N2 : N2 === d8 ? N1 : null;
      if (other) {
        const op = c.pinsIn(other).filter(n => n !== 'GND'), rail = c.railOf(other);
        if (other === v5 || op.some(n => POWER.includes(n))) add(steps.gnd, 'pz_5v', '蜂鳴器另一隻腳接到了 <b>5V</b>。要接 <b>GND</b>（「−」電源軌）。');
        else if (op.length) add(steps.gnd, 'pz_gnd_wrong', `蜂鳴器另一隻腳應該接 <b>GND</b>，你接了 ${pinPretty(op[0])}。`);
        else if (isPlusRail(rail)) add(steps.gnd, 'pz_plus_rail', '蜂鳴器另一隻腳接到了<b>「+」電源軌</b>。要接<b>「−」電源軌</b>（GND）。');
        else if (rail) add(steps.gnd, 'rail_unpowered', '這條「−」電源軌還未接到 Arduino 的 <b>GND</b>。', false);
        else if (!c.touched(other)) add(steps.gnd, 'pz_gnd_missing', '蜂鳴器另一隻腳還未接 GND：用一條黑色短線，把蜂鳴器<b>右腳</b>的直行接到上方的「−」電源軌。', false);
        else add(steps.gnd, 'pz_gnd_nowhere', '蜂鳴器右腳那條 GND 導線接到了沒有元件的位置。');
      }
    }
    return { N1, N2 };
  }

  /* main lesson: 4 buttons (INPUT_PULLUP: one side to a pin, the other side to GND) + buzzer on D8 */
  function analyze(h = S.hw) {
    const wires = h.wires, parts = h.parts;
    const find = buildNets(wires, partPairs(parts, false));
    const find1 = buildNets(wires, partPairs(parts, true));
    const c = ctxFor(wires, find);
    const iss = [];
    const add = (step, code, msg, counts = true) => iss.push({ step, code, msg, counts });
    const gnd = find('P:GND'), v5 = find('P:5V');
    POWER.forEach(n => { if (find('P:' + n) === gnd) add(0, 'short_' + n, `<b>短路！</b>${PIN_LABEL[n]} 和 GND 被直接連在一起，會損壞 Arduino 和電腦的 USB 埠。請立即移除那條線。`); });
    /* a button turned the wrong way joins its two sides for good: that is reported as btn_rot, not as a short */
    const rotNets = new Set(parts.filter(p => p.type === 'btn' && p.rot).flatMap(p => legHoles(p).map(find)));
    KEY_PINS.concat(['D8']).forEach(d => {
      if (find('P:' + d) === gnd && !rotNets.has(gnd)) add(0, 'short_' + d, d === 'D8' ? '<b>短路！</b>D8 和 GND 被直接連在一起，中間沒有蜂鳴器。' : `〔${d}〕 不經按鈕就接到了 GND：Arduino 會以為 <b>${NOTE_OF[d]} 鍵一直被按着</b>，蜂鳴器會不停地響。導線要接到按鈕<b>沒有接 GND</b> 的那一邊。`);
      POWER.forEach(pw => { if (find('P:' + d) === find('P:' + pw)) add(0, 'short_' + d + pw, `<b>短路！</b>${d} 和 ${PIN_LABEL[pw]} 被直接連在一起。`); });
    });
    const all = KEY_PINS.concat(['D8']);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (find('P:' + all[i]) === find('P:' + all[j]) && find('P:' + all[i]) !== gnd) add(0, 'pins_joined', `〔${all[i]}〕 和 〔${all[j]}〕 被連在一起了。每個琴鍵和蜂鳴器都要用<b>自己</b>的腳位。`);
    if (find('P:5V') !== gnd && find1('P:5V') === find1('P:GND')) add(0, 'press_short', '<b>短路！</b>按下按鈕時，5V 會直接接到 GND。今堂的按鈕只接<b>腳位</b>和 <b>GND</b>，不用接 5V。');
    const out = { iss, find, find1, sides: [], keys: {}, pz: null };
    /* steps 1: four buttons, the right way round */
    const btns = btnsOf(parts);
    if (btns.length < 4) add(1, 'btn_missing', `還有 <b>${4 - btns.length}</b> 個按鈕未插。請由元件盒拖出按鈕，<b>跨過中間的坑</b>。`, false);
    if (btns.some(b => b.rot)) add(1, 'btn_rot', '<b>有按鈕放錯方向。</b>按鈕的四隻腳要<b>向上、向下</b>，跨過中間的坑。現在的方向，按與不按都一樣。<br>方法：點選那個按鈕，按「旋轉按鈕」。');
    const sides = btns.filter(b => !b.rot).map(b => { const pr = btnPairs(b, false); return { b, A: find(pr[0][0]), B: find(pr[1][0]), col: parseHole(b.h1).col }; });
    out.sides = sides;
    /* step 3: one side of every button to GND */
    const nm = s => `（第 ${s.col} 至第 ${s.col + 2} 直行那個）`;
    sides.forEach(s => {
      if (v5 === gnd) return;
      if (s.A === s.B) { if (s.A !== gnd) add(3, 'btn_bridged', `有一個按鈕${nm(s)}左右兩邊被導線連在一起了，按與不按都一樣。請移除那條線。`); return; }
      const gA = s.A === gnd, gB = s.B === gnd;
      if (gA && gB) { add(3, 'btn_both_gnd', `有一個按鈕${nm(s)}<b>兩邊都接了 GND</b>，按下也不會改變讀數。一邊接 GND，另一邊接腳位。`); return; }
      if (s.A === v5 || s.B === v5) { add(3, 'btn_5v', `有一個按鈕${nm(s)}接到了 <b>5V</b>。今堂用 <code>INPUT_PULLUP</code>：Arduino 板內已經把腳位拉到 5V，按鈕另一邊要接 <b>GND</b>（「−」電源軌），按下時才會讀到 LOW。`); return; }
      if (gA || gB) return;
      const rails = [s.A, s.B].map(n => c.railOf(n)), pw = [s.A, s.B].flatMap(n => c.pinsIn(n)).find(n => POWER.includes(n));
      if (pw) add(3, 'btn_power', `有一個按鈕${nm(s)}接到了 <b>${PIN_LABEL[pw]}</b>。按鈕一邊要接 <b>GND</b>（「−」電源軌）。`);
      else if (rails.some(isPlusRail)) add(3, 'btn_plus_rail', `有一個按鈕${nm(s)}接到了<b>「+」電源軌</b>（紅線）。按鈕一邊要接<b>「−」電源軌</b>（藍線，GND）。`);
      else if (rails.some(isMinusRail)) add(3, 'rail_unpowered', '「−」電源軌還未接到 Arduino 的 <b>GND</b>。請由 GND 腳拉一條黑色線到這條電源軌。', false);
      else add(3, 'btn_gnd_missing', `按鈕${nm(s)}還未接 GND：用一條黑色短線，把按鈕<b>左邊</b>的直行（〔第${s.col}直行〕）接到上方的「−」電源軌。`, false);
    });
    if (railsIn(find, gnd).some(isPlusRail)) add(3, 'rail_gnd_plus', 'GND 接到了<b>「+」電源軌</b>（紅線）。GND 要接<b>「−」電源軌</b>（藍線）。');
    if (!['GND'].some(n => c.wiredPins.has(n))) add(3, 'gnd_rail_missing', '還未連接 GND：由 Arduino 的 <b>GND</b> 腳（上方，13 號旁邊），拉一條黑色線到麵包板上方的<b>「−」電源軌</b>。', false);
    /* steps 4–5: each key pin on the free side of its own button */
    KEYS.forEach(k => {
      const st = k.n <= 3 ? 4 : 5, dn = find('P:' + k.pin);
      if (dn === gnd || dn === v5) return;
      const s = sides.find(q => q.A === dn || q.B === dn);
      if (s) {
        const other = s.A === dn ? s.B : s.A;
        const op = other === gnd ? [] : c.pinsIn(other).filter(n => KEY_PINS.includes(n) && n !== k.pin);
        if (op.length) { const pr = [k.pin, op[0]].sort((x, y) => KEY_PINS.indexOf(x) - KEY_PINS.indexOf(y)); add(st, 'two_pins_one_btn', `〔${pr[0]}〕 和 〔${pr[1]}〕 接到了<b>同一個按鈕</b>的兩邊。每個按鈕一邊接<b>一支</b>腳位，另一邊接 GND。`); return; }
        out.keys[k.k] = { id: s.b.id, other };
        return;
      }
      const pzL = parts.find(p => p.type === 'pz');
      if (pzL && legHoles(pzL).some(x => find(x) === dn)) add(st, 'key_on_buzzer', `〔${k.pin}〕 接到了蜂鳴器。蜂鳴器用 〔D8〕；〔${k.pin}〕 要接 <b>${k.name} 鍵</b>（按鈕）沒有接 GND 的那一邊。`);
      else if (!c.wiredPins.has(k.pin)) add(st, 'key_missing', `還未連接 <b>${k.name} 鍵</b>：由 〔${k.pin}〕（Arduino 上方，板上印 ${printed(k.pin)}）拉一條線到按鈕<b>右邊</b>（沒有接 GND 那一邊）的直行。`, false);
      else add(st, 'key_nowhere', `〔${k.pin}〕 的導線接到了<b>沒有元件</b>的位置。導線要插在和按鈕右邊的腳<b>同一個</b>直行。`);
    });
    sides.forEach(s => [s.A, s.B].forEach(n => {
      if (n === gnd || n === v5) return;
      const ps = c.pinsIn(n).filter(x => x !== 'GND' && !KEY_PINS.includes(x) && !POWER.includes(x));
      if (!ps.length) return;
      if (ps[0] === 'D8') add(5, 'btn_d8', `有一個按鈕${nm(s)}接到了 〔D8〕，那是蜂鳴器用的腳。四個琴鍵用 〔D2〕、〔D3〕、〔D4〕、〔D5〕。`);
      else add(5, 'btn_wrong_pin', `有一個按鈕${nm(s)}接到了 ${pinPretty(ps[0])}。四個琴鍵用 〔D2〕、〔D3〕、〔D4〕、〔D5〕，程式不會讀 ${pinName(ps[0])}。`);
    }));
    /* step 2 + 6: buzzer */
    const pz = parts.find(p => p.type === 'pz');
    if (!pz) add(2, 'pz_missing', '請把元件盒中的<b>蜂鳴器</b>拖到麵包板的蜂鳴器區（〔f27〕 和 〔f30〕）。', false);
    else out.pz = buzzerChain(pz, find, c, add, { gnd, v5 }, { place: 2, sig: 6, gnd: 6 });
    strayCheck(wires, find, parts, add, 7);
    unusedCheck(parts, parts, wires, find, add, 7);
    return out;
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
  /* extensions: base circuit must stay intact */
  function baseIssues(base, extWires) {
    return analyze({ parts: base.parts, wires: base.wires.concat(extWires) }).iss.filter(i => i.step <= 6 && i.counts)
      .map(i => ({ ...i, step: 0, code: 'base_' + i.code, msg: '<b>原本的電子琴電路被改變了：</b>' + i.msg }));
  }
  /* challenge 1: light sensor + 10kΩ on A0 (bottom half), powered from the bottom rails */
  function analyzeC1(h = S.ext.c1.hw, base = S.hw) {
    const wires = base.wires.concat(h.wires), parts = base.parts.concat(h.parts);
    const find = buildNets(wires, partPairs(parts, false));
    const c = ctxFor(h.wires, find), cAll = ctxFor(wires, find);
    const iss = baseIssues(base, h.wires);
    const add = (step, code, msg, counts = true) => iss.push({ step, code, msg, counts });
    const gnd = find('P:GND'), v5 = find('P:5V'), a0 = find('P:A0');
    if (a0 === v5) add(0, 'a0_5v', 'A0 被直接接到了 <b>5V</b>，讀數永遠是 1023。A0 要接在光感應器和 10kΩ 中間。');
    else if (a0 === gnd) add(0, 'a0_gnd', 'A0 接到了 <b>GND</b>（例如插在光感應器<b>長腳</b>那一直行，或者「−」電源軌），讀數永遠是 0。A0 要接在光感應器<b>短腳</b>和 10kΩ 中間。');
    if (KEY_PINS.concat(['D8']).some(n => find('P:' + n) === a0)) add(0, 'a0_mixed', 'A0 和電子琴用的腳（D2 至 D5、D8）被連在一起了。光感應器要用<b>自己</b>的 A0。');
    /* step 2: 5V and GND to the bottom rails */
    if (railsIn(find, v5).some(isMinusRail)) add(2, 'rail_5v_minus', '5V 接到了<b>「−」電源軌</b>（藍線）。5V 要接<b>「+」電源軌</b>（紅線）。');
    if (railsIn(find, gnd).some(isPlusRail)) add(2, 'rail_gnd_plus', 'GND 接到了<b>「+」電源軌</b>（紅線）。GND 要接<b>「−」電源軌</b>（藍線）。');
    if (!cAll.wiredPins.has('5V')) add(2, 'v5_missing', '還未連接 5V：由 Arduino 下方 POWER 那一排的 <b>5V</b> 腳，拉一條紅色線到麵包板<b>下方</b>的「+」電源軌（最底一行）。', false);
    const out = { iss, find, ls: null };
    const L = h.parts.find(p => p.type === 'ls');
    if (!L) { add(1, 'ls_missing', '請把元件盒中的<b>光感應器</b>拖到麵包板<b>下半部</b>的光線琴區（〔d29〕、〔d30〕）。', false); strayCheck(h.wires, find, parts, add, 5); return out; }
    const pm = lsPM(L), Pn = find(pm.a), Mn = find(pm.k);
    if (Pn === Mn) { add(1, 'ls_short', '光感應器兩隻腳插在<b>相通</b>的孔，被短路了，讀數不會變。請把兩隻腳放在不同的直行。'); strayCheck(h.wires, find, parts, add, 5); return out; }
    const rs = resEnds(parts, find);
    const resOn = n => n !== gnd && n !== v5 && rs.some(o => (o.x === n) !== (o.y === n));
    const sideOf = n => n === a0 || resOn(n);
    let sig = Pn, low = Mn, reversed = false;
    if (Pn === gnd && Mn !== gnd) { sig = Mn; low = Pn; reversed = true; }
    else if (Mn !== gnd && sideOf(Mn) && !sideOf(Pn)) { sig = Mn; low = Pn; reversed = true; }
    if (reversed && Pn === gnd) add(3, 'ls_reversed', '<b>光感應器接反了！</b>光感應器和 LED 一樣是長腳 +、短腳 −，但這個電路要把它<b>反轉插</b>：<b>短腳（−）</b>接 10kΩ 和 A0 那一邊，<b>長腳（+）</b>接 GND。<br>方法：點選光感應器，按「反轉光感應器」。');
    else if (reversed) add(1, 'ls_reversed', '<b>光感應器方向錯了！</b>10kΩ（或 A0）接到了光感應器的<b>長腳（+）</b>。這個電路要反轉插：10kΩ 和 A0 要和<b>短腳（−）</b>在同一直行。<br>方法：點選光感應器，按「反轉光感應器」；或者把 10kΩ 移到短腳的直行。');
    out.ls = { sig, low };
    /* the 10kΩ: one end with the short leg, the other end to 5V */
    if (low !== gnd && low !== v5 && rs.some(o => (o.x === sig && o.y === low) || (o.x === low && o.y === sig))) add(1, 'pu_parallel', '10kΩ 兩端分別接到光感應器兩隻腳，變成<b>並聯</b>了。10kΩ 只需要<b>一隻腳</b>和光感應器短腳在同一個直行，另一隻腳接 5V。');
    else {
      const cand = rs.filter(o => (o.x === sig) !== (o.y === sig));
      const t = cand.find(o => o.r.ohm === 10000) || cand[0];
      if (!t) add(1, 'pu_missing', '請插上一粒 <b>10kΩ</b> 電阻（色環<b>棕黑黑紅棕</b>）：一隻腳和光感應器<b>短腳</b>在同一個直行，例如 〔c25〕 至 〔c29〕。', false);
      else {
        if (t.r.ohm !== 10000) add(1, 'pu_value', `光感應器用了 <b>${OHM[t.r.ohm]}</b> 電阻。電阻太小，手移近時讀數只會變一點點，音高差不多不變。光感應器要用 <b>10kΩ</b>（色環：棕黑黑紅棕）。`);
        const O = t.x === sig ? t.y : t.x, rail = cAll.railOf(O), po = cAll.pinsIn(O).filter(n => n !== 'GND');
        if (O === v5) { /* correct */ }
        else if (O === gnd) add(3, 'pu_to_gnd', '10kΩ 的另一端接到了 <b>GND</b>。這樣 A0 只會讀到 0。10kΩ 另一端要接 <b>5V</b>（「+」電源軌）。');
        else if (isMinusRail(rail)) add(3, 'pu_minus_rail', '10kΩ 的另一端接到了<b>「−」電源軌</b>（藍線）。它要接<b>「+」電源軌</b>（紅線），即是 5V。');
        else if (isPlusRail(rail)) add(3, 'rail_unpowered_plus', '這條「+」電源軌還未接到 Arduino 的 <b>5V</b>。請先做第 2 步：由 5V 腳拉一條紅色線到這條電源軌。', false);
        else if (po.length) add(3, 'pu_pin', `10kΩ 的另一端接到了 ${pinPretty(po[0])}，要改接 <b>5V</b>（「+」電源軌）。`);
        else if (!c.touched(O)) add(3, 'pu_5v_missing', '10kΩ 的另一端還未接到 5V：用一條紅色短線，把它的直行接到下方的「+」電源軌。', false);
        else add(3, 'pu_nowhere', '10kΩ 另一端的導線沒有接到 5V。');
      }
    }
    /* the long leg (+) to GND */
    if (low !== gnd) {
      const rail = cAll.railOf(low), pl = cAll.pinsIn(low).filter(n => n !== 'GND');
      if (low === v5) add(3, 'ls_to_5v', '光感應器長腳（+）接到了 <b>5V</b>。長腳要接 <b>GND</b>（「−」電源軌）。');
      else if (isPlusRail(rail)) add(3, 'ls_plus_rail', '光感應器長腳接到了<b>「+」電源軌</b>（紅線）。長腳要接<b>「−」電源軌</b>（藍線）。');
      else if (rail) add(3, 'rail_unpowered', '這條「−」電源軌還未接到 Arduino 的 <b>GND</b>。請先做第 2 步：由 GND 腳拉一條黑色線到下方的「−」電源軌。', false);
      else if (pl.length) add(3, 'ls_gnd_pin', `光感應器長腳（+）應該接 <b>GND</b>，你接了 ${pinPretty(pl[0])}。`);
      else if (!c.touched(low)) add(3, 'ls_gnd_missing', '光感應器長腳（+）還未接到 GND：用一條黑色短線，把長腳的直行接到下方的「−」電源軌。', false);
      else add(3, 'ls_gnd_nowhere', '光感應器長腳那條 GND 導線接到了沒有元件的位置。');
    }
    /* step 4: A0 on the junction */
    if (a0 !== v5 && a0 !== gnd && sig !== a0) {
      const ps = cAll.pinsIn(sig).filter(n => n !== 'GND' && !POWER.includes(n));
      if (ps.length) add(4, 'a0_wrong_pin', `光感應器接到了 ${pinPretty(ps[0])}，但程式讀取的是 <b>A0</b>。請改接到 Arduino 下方 ANALOG IN 的 <b>A0</b>。`);
      else if (low === a0) add(4, 'a0_on_gnd_side', 'A0 接到了光感應器<b>長腳</b>那一邊。A0 要接在<b>短腳、10kΩ 同一直行</b>（兩粒零件中間）。');
      else if (!c.wiredPins.has('A0')) add(4, 'a0_missing', '還未連接 A0：由 Arduino 下方 ANALOG IN 的 <b>A0</b>，拉一條藍色線到光感應器<b>短腳</b>的直行。', false);
      else add(4, 'a0_nowhere', 'A0 的導線接到了<b>沒有元件</b>的位置。A0 要接在光感應器短腳和 10kΩ <b>同一個</b>直行。');
    }
    if (low !== gnd && !railsIn(find, gnd).includes('bn') && !c.wiredPins.has('GND')) add(2, 'gnd_bottom_missing', '還未把 GND 接到下方的電源軌：由 Arduino 下方 POWER 那一排的 <b>GND</b> 腳，拉一條黑色線到麵包板<b>下方</b>的「−」電源軌。', false);
    strayCheck(h.wires, find, parts, add, 5);
    unusedCheck(h.parts, parts, h.wires, find, add, 5);
    return out;
  }

  /* ---------- steps ---------- */
  const STEPS_ALL = {
    main: ['插上 4 個按鈕（跨過中間的坑）', '插上蜂鳴器', 'GND 和按鈕左邊接「−」電源軌', '連接 D2（Do）和 D3（Re）', '連接 D4（Mi）和 D5（So）', '蜂鳴器：D8 和 GND', '最後檢查'],
    c1: ['插上光感應器和 10kΩ（下半部）', '5V 和 GND 接下方的電源軌', '10kΩ 接「+」軌、光感應器長腳接「−」軌', 'A0 接光感應器短腳', '最後檢查'],
  };
  const STEPS = () => STEPS_ALL[MODE];
  const AUTO_HINT = { main: [1, 2], c1: [1] };
  /* 分區（放元件的步驟顯示淡色底）：主任務的區，延伸挑戰另加的區 */
  const ZONES = { main: [{ name: '琴鍵區', from: 3, to: 23, half: 'both' }, { name: '蜂鳴器區', from: 27, to: 30 }] };
  const ZONES_X = { c1: [{ name: '光線琴區', from: 25, to: 30, half: 'bot' }] };
  const PLACE_STEPS = { main: [1, 2], c1: [1] };
  const PAID_HINT = { main: [3, 4, 5, 6], c1: [2, 3, 4] };
  const HINT_COST = { main: 2, c1: 1 };
  const doAnalyze = () => MODE === 'c1' ? analyzeC1() : analyze();
  function freeHoleIn(net, find, occ, rowsFirst) {
    const cands = HOLE_IDS.filter(id => find(id) === net && !occ[id] && !RAIL_NAME[P[id].row]);
    cands.sort((a, b) => rowsFirst === 'bottom' ? P[b].y - P[a].y : P[a].y - P[b].y);
    return cands[0] || null;
  }
  /* a free spot for a resistor with one leg in the same column as hole h (rows tried in order) */
  function resTargetAt(h, occ, prefer = -1, rowsTop = ['h', 'g', 'i']) {
    const pa = parseHole(h); if (!pa || RAIL_NAME[pa.row]) return null;
    const rows = 'abcde'.includes(pa.row) ? ['c', 'b', 'd'] : rowsTop;
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
    const h = H(), occ = occupancy(), ws = allWires(h);
    const wired = id => ws.some(w => w.a === id || w.b === id);
    if (MODE === 'main') {
      if (step === 1) {
        const btns = btnsOf(h.parts); if (btns.length >= 4) return [];
        return BTN_SPOT.filter(c => !occ['f' + c] && !occ['f' + (c + 2)] && !occ['e' + c] && !occ['e' + (c + 2)]).slice(0, 4 - btns.length).flatMap(c => ['f' + c, 'f' + (c + 2), 'e' + c, 'e' + (c + 2)]);
      }
      if (step === 2) return h.parts.some(p => p.type === 'pz') ? [] : ['f27', 'f30'];
      const an = analyze(), gnd = an.find('P:GND');
      if (step === 3) {
        const t = [];
        if (!['P:GND', 'P:GND2', 'P:GND3'].some(wired)) t.push('P:GND', freeRail('tn', 1, occ));
        an.sides.forEach(s => { if (s.A === gnd || s.B === gnd || s.A === s.B) return; const x = freeHoleIn(s.A, an.find, occ); if (x) { t.push(x, freeRail('tn', parseHole(x).col, occ)); occ[x] = { type: 'plan' }; } });
        return t.filter(Boolean);
      }
      if (step === 4 || step === 5) {
        const t = [];
        const free = an.sides.filter(s => (s.A === gnd) !== (s.B === gnd)).map(s => ({ s, net: s.A === gnd ? s.B : s.A }));
        (step === 4 ? KEYS.slice(0, 2) : KEYS.slice(2)).forEach(k => {
          if (an.keys[k.k] || wired('P:' + k.pin)) return;
          const i = KEYS.indexOf(k), f = free[i]; if (!f || an.find('P:' + k.pin) === f.net || KEY_PINS.some(p => an.find('P:' + p) === f.net)) return;
          const x = freeHoleIn(f.net, an.find, occ); if (x) t.push('P:' + k.pin, x);
        });
        return t;
      }
      if (step === 6) {
        if (!an.pz) return [];
        const t = [], pz = h.parts.find(p => p.type === 'pz'), [l1, l2] = legHoles(pz), d8 = an.find('P:D8');
        if (an.pz.N1 !== d8 && an.pz.N2 !== d8 && !wired('P:D8')) { const x = freeHoleIn(an.find(l1), an.find, occ); if (x) t.push('P:D8', x); }
        const other = an.pz.N1 === d8 ? an.pz.N2 : an.pz.N2 === d8 ? an.pz.N1 : an.find(l2);
        if (other !== gnd) { const y = freeHoleIn(other, an.find, occ); if (y) t.push(y, freeRail('tn', parseHole(y).col, occ)); }
        return t;
      }
      return [];
    }
    const an = doAnalyze();
    const L = h.parts.find(p => p.type === 'ls');
    if (step === 1) {
      if (!L) return ['d29', 'd30'];
      if (!an.ls) return [];
      if (resEnds(h.parts, an.find).some(o => o.x === an.ls.sig || o.y === an.ls.sig)) return [];
      return resTargetAt(lsPM(L).a, occ, -1) || [];
    }
    if (step === 2) { const t = []; if (!wired('P:5V')) t.push('P:5V', freeRail('bp', 20, occ)); if (!wired('P:GND2') && !railsIn(an.find, an.find('P:GND')).includes('bn')) t.push('P:GND2', freeRail('bn', 20, occ)); return t.filter(Boolean); }
    if (!an.ls) return [];
    if (step === 3) {
      const t = [];
      const pu = resEnds(h.parts, an.find).find(o => (o.x === an.ls.sig) !== (o.y === an.ls.sig));
      if (pu) { const O = pu.x === an.ls.sig ? pu.y : pu.x; if (O !== an.find('P:5V')) { const x = freeHoleIn(O, an.find, occ, 'bottom'); if (x) t.push(x, freeRail('bp', parseHole(x).col, occ)); } }
      if (an.ls.low !== an.find('P:GND')) { const y = freeHoleIn(an.ls.low, an.find, occ, 'bottom'); if (y) t.push(y, freeRail('bn', parseHole(y).col, occ)); }
      return t.filter(Boolean);
    }
    if (step === 4) { if (an.ls.sig === an.find('P:A0')) return []; const x = freeHoleIn(an.ls.sig, an.find, occ, 'bottom'); return ['P:A0'].concat(x ? [x] : []); }
    return [];
  }
  function stepBody(step) {
    const RULE = '<p class="small muted">小規則：元件插在 f 至 i 行，導線插在 j 行；每個區之間最少空出兩個直行。</p>';
    if (MODE === 'main') {
      if (step === 1) return `<p>把 <b>4 個按鈕</b>拖到麵包板的<b>琴鍵區</b>，每個都要<b>跨過中間的坑</b>（腳向上下）。左上角那隻腳插在：</p><ul class="small tight"><li><b>Do</b> 鍵：〔f3〕</li><li><b>Re</b> 鍵：〔f9〕</li><li><b>Mi</b> 鍵：〔f15〕</li><li><b>So</b> 鍵：〔f21〕</li></ul><p class="small">每個按鈕佔 3 個直行（例如 Do 鍵用第 3 至第 5 直行）。按鈕之間留空位，手指才容易按。</p><p class="small muted">按鈕的腳要向上下；如果放錯方向，點選按鈕再按「旋轉按鈕」。</p>`;
      if (step === 2) return `<p>把 <b>蜂鳴器</b>拖到<b>蜂鳴器區</b>，兩隻腳插在 〔f27〕 和 〔f30〕。蜂鳴器<b>沒有正負極</b>，兩隻腳可以對調。</p>${RULE}`;
      if (step === 3) return `<ul class="small tight"><li>黑色線：〔GND〕（Arduino 上方，13 號旁邊）→「−」電源軌（最頂、藍線那一行）。</li><li>黑色短線 × 4：每個按鈕<b>左邊</b>的直行 →「−」電源軌：〔第3直行〕、〔第9直行〕、〔第15直行〕、〔第21直行〕。</li></ul><p class="small">今堂用 <code>INPUT_PULLUP</code>：按鈕<b>不用電阻</b>，也<b>不用接 5V</b>。</p>`;
      if (step === 4) return `<p>每個按鈕的<b>右邊</b>接一支腳位：</p><ul class="small tight"><li>白色線：〔D2〕（板上印 2）→ Do 鍵右邊（〔第5直行〕）。</li><li>綠色線：〔D3〕（板上印 ~3）→ Re 鍵右邊（〔第11直行〕）。</li></ul><p class="small muted">「~」只是代表那支腳可以調光，今堂不用理會。小心：〔D2〕 是 Arduino 上的腳位，和麵包板的〔第2直行〕無關。</p>`;
      if (step === 5) return `<ul class="small tight"><li>藍色線：〔D4〕（板上印 4）→ Mi 鍵右邊（〔第17直行〕）。</li><li>白色線：〔D5〕（板上印 ~5）→ So 鍵右邊（〔第23直行〕）。</li></ul>`;
      if (step === 6) return `<ul class="small tight"><li>藍色線：〔D8〕（板上印 8）→ 蜂鳴器<b>左腳</b>的直行（〔第27直行〕）。</li><li>黑色短線：蜂鳴器<b>右腳</b>的直行（〔第30直行〕）→「−」電源軌。</li></ul>`;
      return `<p>檢查所有導線都接好，沒有多餘的線，然後按「完成接線檢查」。</p>`;
    }
    if (step === 1) return `<p>電子琴電路已經接好（今次不用改動）。在麵包板<b>下半部</b>的<b>光線琴區</b>：</p><ul class="small tight"><li><b>光感應器</b>插在 〔d29〕、〔d30〕：和 LED 一樣是長腳 +、短腳 −，但要<b>反轉插</b>：<b>短腳（−）在左</b>，長腳（+）在右。</li><li><b>10kΩ</b>（色環<b>棕黑黑紅棕</b>）插在 〔c25〕 至 〔c29〕：右端和光感應器短腳在<b>同一個直行</b>。</li></ul>`;
    if (step === 2) return `<ul class="small tight"><li>紅色線：〔5V〕（Arduino 下方 POWER 那一排）→ <b>下方</b>「+」電源軌（最底一行）。</li><li>黑色線：下方 POWER 那一排的 〔GND〕 → <b>下方</b>「−」電源軌。</li></ul><p class="small">上方的 GND 已經用來接按鈕，UNO 下方還有兩個 GND，用哪一個都可以。</p>`;
    if (step === 3) return `<ul class="small tight"><li>紅色短線：10kΩ <b>左端</b>的直行（〔第25直行〕）→ 下方「+」電源軌。</li><li>黑色短線：光感應器<b>長腳</b>的直行（〔第30直行〕）→ 下方「−」電源軌。</li></ul><p class="small muted">下半部的導線插在 a 行，最接近下方的電源軌。</p>`;
    if (step === 4) return `<p>藍色線：〔A0〕（Arduino 下方 ANALOG IN）→ 光感應器<b>短腳</b>的直行（〔第29直行〕）。</p>`;
    return `<p>檢查新導線都接好，而且沒有改動電子琴電路，然後按「完成接線檢查」。</p>`;
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
      if (type === 'btn' && (P[id].row !== 'f' || P[id].col > COLS - 2)) continue;
      const q = P[id]; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = id; }
    }
    return best;
  }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const legPts = p => legHoles(p).map(x => P[x]);
  /* the two legs used for drawing (button: the two top legs) */
  function endPts(p) { const L = legPts(p); return [L[0], L[1]]; }
  function partBox(p, pts = endPts(p)) {
    const [a, b] = pts; const mx = (a.x + b.x) / 2;
    if (p.type === 'ls') return { x: mx - 15, y: a.y - 42, w: 30, h: 40 };
    if (p.type === 'pz') return { x: mx - 26, y: a.y - 60, w: 52, h: 54 };
    if (p.type === 'btn') return { x: a.x - 4, y: a.y - 4, w: 48, h: 48 };
    return { x: a.x + 12, y: a.y - 10, w: b.x - a.x - 24, h: 20 };
  }
  const partName = p => p.type === 'btn' ? '按鈕' : p.type === 'res' ? OHM[p.ohm] + ' 電阻' : p.type === 'pz' ? '蜂鳴器' : '光感應器';

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
    svg.addEventListener('dblclick', e => { const p = svgPt(e); const hit = hitPart(p); if (hit && !H().done) { sel = { type: 'part', id: hit.id }; if (hit.type === 'ls') flipLed(); else if (hit.type === 'btn') rotBtn(); } });
    $('#swatches').innerHTML = COLORS.map(([c, n]) => `<button class="sw" style="background:${c}" data-c="${c}" title="${n}色導線" aria-label="${n}色導線"></button>`).join('');
    $$('#swatches .sw').forEach(b => b.onclick = () => { S.hw.color = b.dataset.c; save(); renderSwatches(); });
    document.addEventListener('keydown', e => {
      if (isHwView() && !H().done && sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName) && !$('.modal-back')) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); }
        if (e.key === 'r' || e.key === 'R') { const p = selPart(); if (p && p.type === 'ls') flipLed(); if (p && p.type === 'btn') rotBtn(); }
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
      const sample = left > 0 ? drawPart({ type: bin.type, color: bin.color, ohm: bin.ohm }, legs[0], legs[1], { noTag: true, noSigns: true }) : '';
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
      const [a, b] = endPts(p);
      const opts = p.type === 'pz' && h.done ? { sound: true } : {};
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
    if (p) el.innerHTML = `<span class="lbl">已選取：${partName(p)}</span>${p.type === 'ls' ? '<button class="btn sm" id="stFlip">反轉光感應器</button>' : ''}${p.type === 'btn' ? '<button class="btn sm" id="stRot">旋轉按鈕</button>' : ''}<button class="btn sm" id="stDel">放回元件盒</button>`;
    else if (sel && sel.type === 'wire') { const w = h.wires.find(x => x.id === sel.id); el.innerHTML = w ? `<span class="lbl">已選取：導線 ${endName(w.a)} → ${endName(w.b)}</span><button class="btn sm" id="stDel">刪除導線</button>` : ''; }
    else el.innerHTML = `<span class="lbl">點選元件或導線，可以${MODE === 'main' ? '旋轉或' : '反轉或'}移除</span>`;
    const fl = $('#stFlip'); if (fl) fl.onclick = flipLed;
    const ro = $('#stRot'); if (ro) ro.onclick = rotBtn;
    const d = $('#stDel'); if (d) d.onclick = removeSel;
  }
  function changed() { lastIssues = null; save(); render(); renderPanel(); }
  function flipLed() { const p = selPart(); if (!p || p.type !== 'ls') return; p.flipped = !p.flipped; toast(`光感應器已反轉：短腳（−）現在在${p.flipped ? '右' : '左'}邊`); changed(); }
  function rotBtn() { const p = selPart(); if (!p || p.type !== 'btn') return; p.rot = !p.rot; toast(p.rot ? '按鈕的腳現在向左右' : '按鈕的腳現在向上下（正確方向）'); changed(); }
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
    if (ptId && occ[ptId] && occ[ptId].type === 'fixed') { toast('這是原本的電子琴電路，今次不用改動。'); return; }
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
    if (part.type === 'btn') { const q = parseHole(h1); return [P[h1], P[holeAt('f', q.col + 2)]]; }
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
      else if (part.type === 'btn') showTip('按鈕要跨過<b>中間的坑</b>（f 行和 e 行）', e);
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
      else toast(d.part.type === 'btn' ? '按鈕要跨過麵包板中間的坑。' : '元件要插在麵包板的孔上。');
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
      main: `<p>做得好！你的電子琴電路：</p><ul class="tight"><li>〔D2〕、〔D3〕、〔D4〕、〔D5〕 → 按鈕（Do、Re、Mi、So）→「−」電源軌 → GND</li><li>〔D8〕 → 蜂鳴器 → GND</li></ul><p class="muted" style="margin-top:8px">按鈕不用電阻：程式會用 <code>INPUT_PULLUP</code> 開啟 Arduino 板內的電阻。放開時讀到 HIGH，按下時讀到 <b>LOW</b>。</p>`,
      c1: `<p>做得好！新加的電路是：<b>5V → 10kΩ → A0 接點 → 光感應器 → GND</b>（用下方的電源軌）。電子琴電路保持不變。</p><p class="muted" style="margin-top:8px">手越近光感應器，光越暗，A0 的讀數越大；程式再把讀數轉成音高。</p>`,
    }[MODE];
    modal({ title: '接線完成！', html: WIRE.fmt(txt) + pills, actions: [{ label: '留在這頁', kind: 'ghost' }, { label: '下一步：編寫程式', kind: 'go', onClick: () => goStage(NEXT[MODE]) }] });
  }

  function renderPanel() {
    const h = H(), cur = h.step + 1, steps = STEPS(), last = steps.length, paid = PAID_HINT[MODE];
    $('#hwEyebrow').textContent = { main: '第 2 步', c1: '延伸挑戰 1 · 光線琴' }[MODE];
    $('#hwTitle').textContent = { main: '硬件接線', c1: '加入光感應器' }[MODE];
    $('#hwKnow').innerHTML = WIRE.fmt({
      main: `<div><b>麵包板：</b>同一個直行的 f 至 j 五個孔相通，a–e 另一組。頂部的電源軌是<b>整行</b>相通的：最頂一行「−」（藍線），下一行「+」（紅線）。</div><div><b>按鈕：</b>4 隻腳跨過中間的坑。左邊兩隻腳一直相通，右邊兩隻腳一直相通；<b>按下時</b>左右才接通。</div><div><b>INPUT_PULLUP：</b>Arduino 板內有電阻把腳位拉到 5V，所以按鈕只要接<b>腳位</b>和 <b>GND</b>，不用外加電阻。</div><div><b>蜂鳴器：</b>沒有正負極，一隻腳接 D8，另一隻接 GND。</div>`,
      c1: `<div><b>光感應器：</b>和第 4、5 堂一樣：5V → 10kΩ → A0 → 光感應器短腳（−）；長腳（+）→ GND。越暗，A0 的讀數越大。</div><div><b>下方的電源軌：</b>上方的電源軌已經用來接按鈕，這次改用麵包板<b>下方</b>的「+」和「−」電源軌，5V 和 GND 由 UNO 下方的腳接過去。</div>`,
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
      Object.assign(S.ext.c1.hw, { parts: [mk('ls', 'd29', { flipped: false }), mk('res', 'c25', { ohm: 10000 })], wires: [W('P:5V', 'bp20', R), W('P:GND2', 'bn20', K), W('a25', 'bp25', R), W('a30', 'bn30', K), W('P:A0', 'a29', B)], step: 4 });
    } else {
      Object.assign(S.hw, {
        parts: BTN_SPOT.map(c => mk('btn', 'f' + c, { rot: false })).concat([mk('pz', 'f27')]),
        wires: [W('P:GND', 'tn1', K), ...BTN_SPOT.map(c => W('j' + c, 'tn' + c, K)), W('P:D2', 'j5', Wh), W('P:D3', 'j11', G), W('P:D4', 'j17', B), W('P:D5', 'j23', Wh), W('P:D8', 'j27', B), W('j30', 'tn30', K)],
        step: 6,
      });
    }
    S.teacherUsed = true; save();
    if (built) { render(); renderPanel(); }
  }

  /* which button is which key (from the student's own wiring): { do: partId, … } and labels for drawings */
  function keyMap(h = S.hw) { const an = analyze(h), m = {}; KEYS.forEach(k => { if (an.keys[k.k]) m[k.k] = an.keys[k.k].id; }); return m; }
  function keyLabels(h = S.hw) { const m = keyMap(h), out = {}; KEYS.forEach(k => { if (m[k.k]) out[m[k.k]] = k.name; }); return out; }
  const layout = () => { const lb = keyLabels(); return { parts: S.hw.parts.map(p => ({ ...p, legs: legHoles(p), ...(p.type === 'btn' && lb[p.id] ? { label: `按鈕（${lb[p.id]} 鍵 · ${KEYS.find(k => k.name === lb[p.id]).pin}）` } : {}) })), wires: S.hw.wires.slice() }; };
  return { layout, enter, circuitSVG, analyze, analyzeC1, autoWire, runCheck, P, HOLE_IDS, legHoles, keyMap, keyLabels, mode: () => MODE };
})();
stageInit.hw = () => HW.enter('main');
stageInit.c1hw = () => HW.enter('c1');
