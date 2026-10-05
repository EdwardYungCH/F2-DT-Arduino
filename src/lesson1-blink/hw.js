/* =====================================================================
   認識硬件：① 為 UNO 貼標籤 ② 麵包板相通小測 ③ 用 USB 線連接電腦
   ===================================================================== */
const HW = (() => {
  const UX = 24, UY = 150, UW = 420, UH = 320;       // Arduino UNO (same drawing as the other lessons)
  const PITCH = 20, COLS = 30;

  /* ---------- UNO pins (for drawing) ---------- */
  const PIN_LABEL = { SCL: 'SCL', SDA: 'SDA', AREF: 'AREF', GND: 'GND', GND2: 'GND', GND3: 'GND', '5V': '5V', '3V3': '3.3V', VIN: 'Vin', IOREF: 'IOREF', RESET: 'RESET' };
  const TOP1 = ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8'];
  const TOP2 = ['D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'];
  const BOT1 = ['NC', 'IOREF', 'RESET', '3V3', '5V', 'GND2', 'GND3', 'VIN'];
  const BOT2 = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
  const topY = UY + 16, botY = UY + UH - 16;
  const TOP1X = i => UX + 128 + i * 15, TOP2X = i => UX + 292 + i * 15;
  const BOT1X = i => UX + 158 + i * 15, BOT2X = i => UX + 292 + i * 15;

  function unoSVG(dx = 0, opts = {}) {
    let s = `<g class="uno" transform="translate(${dx} 0)">
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
      <circle class="lglow" cx="${UX + 125.5}" cy="${UY + 93}" r="14" fill="#FFB020" opacity="0"/>
      <rect class="uLedL" x="${UX + 120}" y="${UY + 90}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 96}" font-size="9" fill="#fff">L</text>
      <rect class="uLedTX" x="${UX + 120}" y="${UY + 106}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 112}" font-size="9" fill="#fff">TX</text>
      <rect class="uLedRX" x="${UX + 120}" y="${UY + 122}" width="11" height="6" rx="1" fill="#6B5A2E"/><text x="${UX + 137}" y="${UY + 128}" font-size="9" fill="#fff">RX</text>
      <rect class="uLedON" x="${UX + 370}" y="${UY + 100}" width="11" height="6" rx="1" fill="${opts.on ? '#3CFF7A' : '#2E5B3A'}"/><text x="${UX + 386}" y="${UY + 106}" font-size="9" fill="#fff">ON</text>`;
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
  const DEFS = `<defs><pattern id="matgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1"/></pattern></defs>`;

  /* ---------- ① labels ---------- */
  // number on the board → label; tx/ty = the part, bx/by = where the numbered badge sits
  const LABELS = [
    { key: 'usb', text: 'USB 插口', desc: '用 USB 線接電腦：上傳程式，同時供電。', tx: UX + 23, ty: UY + 66, bx: UX + 23, by: UY + 66 },
    { key: 'dc', text: '電源插口', desc: '接火牛或電池盒。不接電腦時，用它供電。', tx: UX + 21, ty: UY + 248, bx: UX + 21, by: UY + 248 },
    { key: 'reset', text: 'RESET 掣', desc: '按一下，程式會由頭再執行一次。', tx: UX + 89, ty: UY + 29, bx: UX + 89, by: UY + 29 },
    { key: 'gnd', text: 'GND', desc: '接地，即電源的負極（−）。', tx: TOP1X(3), ty: topY, bx: TOP1X(3) - 26, by: UY - 30, left: true },
    { key: 'd13', text: '13 號腳', desc: '數位腳 13。板上的 L 燈在板內已經接到這支腳。', tx: TOP1X(4), ty: topY, bx: TOP1X(4) + 26, by: UY - 30 },
    { key: 'l', text: 'L 燈', desc: '板上的小 LED，內部接到 13 號腳。今堂就是要令它閃。', tx: UX + 125, ty: UY + 93, bx: UX + 98, by: UY + 93 },
    { key: 'chip', text: '主晶片', desc: 'ATmega328P，就是 UNO 的「大腦」，負責執行你的程式。', tx: UX + 298, ty: UY + 207, bx: UX + 298, by: UY + 207 },
    { key: 'v5', text: '5V', desc: '輸出 5V 電源，即正極（+）。', tx: BOT1X(4), ty: botY, bx: BOT1X(4), by: UY + UH + 30 },
  ];
  const POOL_ORDER = ['l', 'v5', 'usb', 'chip', 'gnd', 'reset', 'd13', 'dc'];   // fixed shuffle for the chip pool
  const LBY = k => LABELS.find(l => l.key === k);
  const SLOT = i => ({ x: 556 + (i >> 2) * 290, y: 150 + (i % 4) * 64, w: 214, h: 44 });          // answer slots: ①–④ left, ⑤–⑧ right
  const POOLPOS = j => ({ x: 520 + (j % 4) * 152, y: 448 + (j >> 2) * 58, w: 138, h: 42 });

  /* ---------- ② breadboard quiz ---------- */
  const BX = 245, BY = 120, BW = 660, BH = 368;
  const ROWY = { tn: 24, tp: 44, j: 84, i: 104, h: 124, g: 144, f: 164, e: 204, d: 224, c: 244, b: 264, a: 284, bn: 324, bp: 344 };
  const ROWS = Object.keys(ROWY);
  const colX = c => BX + 40 + (c - 1) * PITCH;
  const HOLES = {};
  ROWS.forEach(row => { for (let c = 1; c <= COLS; c++) HOLES[row + c] = { x: colX(c), y: BY + ROWY[row], row, col: c }; });
  const RAIL_NAME = { tp: '上方「+」電源軌', tn: '上方「−」電源軌', bn: '下方「−」電源軌', bp: '下方「+」電源軌' };
  const QUIZ = [
    { target: 'c7', ask: '點選所有和 <b class="hole">c7</b> 相通的孔（c7 本身不用點）。', ans: ['a7', 'b7', 'd7', 'e7'],
      know: '同一號碼的 <b>a–e</b> 五個孔是相通的（一條直行）。' },
    { target: 'h20', ask: '點選所有和 <b class="hole">h20</b> 相通的孔。', ans: ['f20', 'g20', 'i20', 'j20'],
      know: '同一號碼的 <b>f–j</b> 五個孔是另一組。中間的坑把上下兩半<b>分開</b>，所以 e20 和 f20 不相通。' },
    { target: 'tn1', rail: 'tn', need: 3, ask: '最上面藍線旁的是「−」電源軌。點選<b>任何 3 個</b>和 <b class="hole">−</b> 軌最左邊那個孔相通的孔。',
      know: '電源軌是<b>左右整行</b>相通的，所以很多零件可以共用同一條「−」（GND）或「+」（5V）。' },
  ];

  /* ---------- ③ USB ---------- */
  const DX3 = 600;                                     // the UNO sits on the right in the USB scene
  const PORT = { x: UX - 16 + DX3, y: UY + 34, w: 78, h: 64 };
  const JACK = { x: UX - 12 + DX3, y: UY + 218, w: 66, h: 60 };
  const PLUG0 = { x: 470, y: 560 };                    // plug start position (centre)
  const PLUGIN = { x: PORT.x - 17, y: PORT.y + 32 };   // plug centre when plugged in

  const STEPS = [
    { t: '為 UNO 貼上 8 個標籤', bar: '把下面的標籤拖到正確的號碼', foot: ['拖動標籤：按住標籤，拖到右邊的空格', '也可以先點標籤，再點空格', '把標籤拖回下面，可以取消'] },
    { t: '麵包板：哪些孔相通？（3 題）', bar: '點選相通的孔', foot: ['點一下孔：選取 / 取消', '滑鼠停在孔上，會顯示孔的名稱'] },
    { t: '用 USB 線連接電腦', bar: '把 USB 線的插頭拖到 UNO', foot: ['按住插頭，拖到 UNO 上正確的插口'] },
  ];

  let svg = null, built = false, drag = null, selChip = null, issues = null, quizMark = null;
  const H = () => S.hw;
  const step = () => Math.min(H().step, 2);

  /* ---------- drawing ---------- */
  function badge(n, x, y, cls = '') {
    return `<g class="badge ${cls}"><circle cx="${x}" cy="${y}" r="13" fill="#FFD34D" stroke="#14212A" stroke-width="2"/><text x="${x}" y="${y + 5}" font-size="14" font-weight="800" fill="#14212A" text-anchor="middle" font-family="Chakra Petch, sans-serif">${n}</text></g>`;
  }
  function badgesSVG(withNames = false) {
    return LABELS.map((l, i) => {
      const lead = (l.bx !== l.tx || l.by !== l.ty) ? `<path d="M${l.bx} ${l.by}L${l.tx} ${l.ty}" stroke="#FFD34D" stroke-width="2"/><circle cx="${l.tx}" cy="${l.ty}" r="3.5" fill="#FFD34D"/>` : '';
      const tw = l.text.length * 13 + 14, tx = l.left ? l.bx - 15 - tw : l.bx + 15;
      const name = withNames ? `<g><rect x="${tx}" y="${l.by - 11}" width="${tw}" height="22" rx="5" fill="#FFFDF4" stroke="#14212A" stroke-width="1"/><text x="${tx + 7}" y="${l.by + 5}" font-size="13" font-weight="700" fill="#14212A">${l.text}</text></g>` : '';
      return lead + badge(i + 1, l.bx, l.by) + name;
    }).join('');
  }
  function chipSVG(key, x, y, w, h, cls = '') {
    const l = LBY(key);
    return `<g class="chip-l ${cls}" data-chip="${key}" style="cursor:grab"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="#FFFDF4" stroke="${cls.includes('bad') ? '#C4301F' : cls.includes('ok') ? '#1F8049' : cls.includes('sel') ? '#0B767A' : '#14212A'}" stroke-width="${cls.includes('sel') || cls.includes('bad') ? 3 : 1.5}"/>
      <text x="${x + w / 2}" y="${y + h / 2 + 6}" font-size="16" font-weight="700" fill="#14212A" text-anchor="middle">${l.text}</text>${cls.includes('lock') ? `<text x="${x + w - 12}" y="${y + 16}" font-size="11" fill="#9A6A00" text-anchor="middle">提示</text>` : ''}</g>`;
  }
  function scene0() {
    const h = H(), bad = (issues && issues.bad) || [];
    let s = unoSVG(0) + badgesSVG();
    s += `<text x="556" y="128" font-size="15" fill="#E8F2EF" font-weight="700">這是甚麼？把標籤放到對應的號碼</text>`;
    LABELS.forEach((l, i) => {
      const r = SLOT(i), key = h.labels[i];
      s += badge(i + 1, r.x - 22, r.y + r.h / 2);
      s += `<rect class="slot" data-slot="${i}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="9" fill="rgba(255,255,255,.06)" stroke="${bad.includes(i) ? '#FF6E60' : 'rgba(255,255,255,.45)'}" stroke-width="${bad.includes(i) ? 3 : 1.5}" stroke-dasharray="${key ? '0' : '6 5'}"/>`;
      if (key && !(drag && drag.key === key)) s += chipSVG(key, r.x + 3, r.y + 3, r.w - 6, r.h - 6, (h.locked[i] ? 'lock ' : '') + (h.done || h.step > 0 ? 'ok ' : '') + (bad.includes(i) ? 'bad ' : '') + (selChip === key ? 'sel' : ''));
    });
    s += `<rect x="504" y="430" width="626" height="134" rx="12" fill="rgba(0,0,0,.22)" stroke="rgba(255,255,255,.15)"/><text x="520" y="446" font-size="12" fill="#CFE3DD" font-weight="700" dy="-2">標籤</text>`;
    const placed = Object.values(h.labels);
    POOL_ORDER.forEach((k, j) => {
      if (placed.includes(k) || (drag && drag.key === k)) return;
      const p = POOLPOS(j); s += chipSVG(k, p.x, p.y + 6, p.w, p.h, selChip === k ? 'sel' : '');
    });
    if (drag) s += chipSVG(drag.key, drag.x - 69, drag.y - 21, 138, 42, 'sel');
    return s;
  }
  function boardSVG(sel = [], opts = {}) {
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
    if (opts.hint) opts.hint.forEach(id => { const q = HOLES[id]; s += `<circle cx="${q.x}" cy="${q.y}" r="9" fill="#6CF09A" opacity=".55"/>`; });
    Object.keys(HOLES).forEach(id => {
      const q = HOLES[id], on = sel.includes(id), bad = opts.bad && opts.bad.includes(id), tgt = opts.target === id;
      s += `<rect data-hole="${id}" x="${q.x - 3.5}" y="${q.y - 3.5}" width="7" height="7" rx="1.2" fill="${tgt ? '#14212A' : on ? (bad ? '#C4301F' : '#0B767A') : '#4A4943'}"/>`;
      if (on) s += `<circle cx="${q.x}" cy="${q.y}" r="7.5" fill="none" stroke="${bad ? '#C4301F' : '#0B767A'}" stroke-width="2.5"/>`;
      if (tgt) s += `<circle cx="${q.x}" cy="${q.y}" r="9" fill="none" stroke="#E6A21A" stroke-width="3"/>`;
    });
    return s + '</g>';
  }
  function scene1() {
    const h = H(), q = Math.min(h.quiz.q, QUIZ.length - 1), Q = QUIZ[q];
    const hint = h.hinted['q' + q] ? (Q.rail ? Object.keys(HOLES).filter(id => HOLES[id].row === Q.rail && id !== Q.target) : Q.ans) : null;
    const done = h.quiz.q >= QUIZ.length;
    return `<text x="${BX}" y="${BY - 14}" font-size="15" fill="#E8F2EF" font-weight="700">${done ? '麵包板小測已完成' : `第 ${q + 1} / 3 題`}</text>` +
      boardSVG(done ? [] : h.quiz.sel, { target: done ? null : Q.target, bad: quizMark, hint });
  }
  function laptopSVG(on) {
    return `<g class="laptop">
      <rect x="50" y="200" width="330" height="210" rx="10" fill="#2B3338" stroke="#151A1D" stroke-width="3"/>
      <rect x="64" y="214" width="302" height="182" rx="4" fill="${on ? '#0F2A33' : '#10181C'}"/>
      <path d="M20 412H410L392 440H38Z" fill="#3A444A"/>
      <rect x="380" y="372" width="14" height="10" fill="#8A969B"/>
      <text x="215" y="290" font-size="16" fill="${on ? '#9FE8B6' : '#6E7E86'}" text-anchor="middle" font-weight="700">${on ? '已偵測到新裝置' : '電腦'}</text>
      <text x="215" y="318" font-size="15" fill="${on ? '#E8F2EF' : '#55646B'}" text-anchor="middle">${on ? `Arduino Uno（${S.up.com}）` : '等待連接……'}</text>
    </g>`;
  }
  function plugAt(x, y) {
    return `<path d="M394 377C470 380 ${x - 120} ${y + 60} ${x - 30} ${y}" stroke="#2B2B2B" stroke-width="10" fill="none" stroke-linecap="round"/>
      <g class="plug" style="cursor:grab"><rect x="${x - 30}" y="${y - 12}" width="18" height="24" rx="3" fill="#2B2B2B"/><rect x="${x - 14}" y="${y - 14}" width="30" height="28" rx="3" fill="#8A969B" stroke="#5F6A6E" stroke-width="2"/><rect x="${x - 6}" y="${y - 8}" width="16" height="16" fill="#C9D0D3"/></g>`;
  }
  function scene2() {
    const usb = !!S.up.usb;
    const p = drag && drag.plug ? drag : usb ? PLUGIN : PLUG0;
    return laptopSVG(usb) + unoSVG(DX3, { on: usb }) + plugAt(p.x, p.y) +
      (usb ? '' : `<text x="${PLUG0.x}" y="${PLUG0.y + 44}" font-size="13" fill="#CFE3DD" text-anchor="middle">USB 線的插頭（拖我）</text>`);
  }
  function render() {
    if (!svg) return;
    const st = step();
    const body = H().done && !drag ? doneScene() : st === 0 ? scene0() : st === 1 ? scene1() : scene2();
    svg.innerHTML = DEFS + `<rect x="0" y="0" width="1150" height="640" fill="url(#matgrid)"/>` + body;
    $('#hwBarTitle').textContent = H().done ? '認識硬件已完成' : `${st + 1}. ${STEPS[st].t}`;
    $('#hwBarHint').textContent = H().done ? '' : STEPS[st].bar;
    $('#hwFoot').innerHTML = H().done ? '' : STEPS[st].foot.map(t => `<span>${t}</span>`).join('');
  }
  function doneScene() {
    return unoSVG(0, { on: true }) + badgesSVG(true) + `<text x="600" y="200" font-size="22" fill="#E8F2EF" font-weight="800">認識硬件完成！</text>
      <text x="600" y="234" font-size="15" fill="#CFE3DD">你已經認識 UNO 板的 8 個部分、</text><text x="600" y="258" font-size="15" fill="#CFE3DD">麵包板哪些孔相通，</text><text x="600" y="282" font-size="15" fill="#CFE3DD">並用 USB 線把 UNO 接到電腦。</text>`;
  }

  /* static picture for later pages and the report: the UNO on a USB cable, L light zoomed in */
  function circuitSVG(opts = {}) {
    const labels = opts.labels ? badgesSVG(true) : '';
    return `<svg viewBox="-150 ${opts.labels ? 100 : 120} 760 ${opts.labels ? 420 : 370}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arduino UNO 經 USB 線連接電腦" style="background:#1E5A4B">${DEFS}<rect x="-150" y="100" width="760" height="420" fill="url(#matgrid)"/>
      <path d="M-150 ${UY + 66}H${UX - 44}" stroke="#2B2B2B" stroke-width="10"/><rect x="${UX - 46}" y="${UY + 54}" width="18" height="24" rx="3" fill="#2B2B2B"/><rect x="${UX - 30}" y="${UY + 52}" width="16" height="28" rx="2" fill="#8A969B"/>
      ${unoSVG(0, { on: true })}
      <path d="M${UX + 131} ${UY + 93}L${UX + UW + 70} ${UY + 60}" stroke="#FFD34D" stroke-width="1.5" stroke-dasharray="4 4"/>
      <circle cx="${UX + UW + 110}" cy="${UY + 60}" r="46" fill="#0F1B20" stroke="#FFD34D" stroke-width="2"/>
      <circle class="lbigglow" cx="${UX + UW + 110}" cy="${UY + 60}" r="40" fill="#FFB020" opacity="0"/>
      <rect class="lbig" x="${UX + UW + 92}" y="${UY + 50}" width="36" height="20" rx="3" fill="#6B5A2E"/>
      <text x="${UX + UW + 110}" y="${UY + 124}" font-size="13" fill="#FFD34D" text-anchor="middle" font-weight="700">L 燈（放大）</text>
      ${labels}</svg>`;
  }
  /* switch every L-light element inside root on/off */
  function setL(root, on) {
    $$('.uLedL, .lbig', root).forEach(e => e.setAttribute('fill', on ? '#FFB020' : '#6B5A2E'));
    $$('.lglow', root).forEach(e => e.setAttribute('opacity', on ? 0.45 : 0));
    $$('.lbigglow', root).forEach(e => e.setAttribute('opacity', on ? 0.35 : 0));
  }

  /* ---------- side panel ---------- */
  function stepBody(i) {
    const h = H();
    if (i === 0) {
      const n = Object.keys(h.labels).length;
      return `<p>UNO 板上有 8 個黃色號碼。把下面的標籤拖到右邊對應號碼的空格。</p>
        <div class="row"><button class="btn primary sm" data-check="0">檢查標籤</button><span class="pill ${n === 8 ? 'ok' : ''}">已貼 ${n} / 8</span><button class="btn sm ghost" data-hint="0">顯示提示（−2 分）</button></div>`;
    }
    if (i === 1) {
      const q = Math.min(h.quiz.q, QUIZ.length - 1);
      return `<div class="qnav">${QUIZ.map((_, k) => `<i class="${k < h.quiz.q ? 'ok' : k === q ? 'cur' : ''}"></i>`).join('')}</div>
        <div class="qbox">${QUIZ[q].ask}</div>
        <div class="row"><button class="btn primary sm" data-check="1">檢查答案</button><span class="pill">已選 ${h.quiz.sel.length} 個孔</span><button class="btn sm ghost" data-hint="1">顯示提示（−2 分）</button></div>`;
    }
    return `<p>USB 線一頭插電腦，另一頭插 UNO。把<b>插頭</b>拖到 UNO 上<b>正確的插口</b>。</p><p class="small muted">UNO 左邊有兩個插口：銀色方形的是 USB 插口，黑色圓形的是電源插口。</p>`;
  }
  const KNOW = [
    `<div><b>USB 插口：</b>連接電腦，上傳程式，同時為 UNO 供電。</div><div><b>13 號腳和 L 燈：</b>L 燈在板內接到 13 號腳。程式控制 13 號腳，L 燈就會跟着亮或熄。</div><div><b>GND 和 5V：</b>GND 是負極（−），5V 是正極（+）。兩者直接相連就會短路。</div>`,
    () => QUIZ.slice(0, Math.min(H().quiz.q + 1, 3)).map(q => `<div>${q.know}</div>`).join(''),
    `<div><b>插上 USB 線之後：</b>UNO 上綠色的 <b>ON</b> 燈會亮起，電腦會多了一個 <b>COM</b> 連接埠。上傳程式時就要選這個連接埠。</div>`,
  ];
  function renderPanel() {
    const h = H(), st = step();
    $('#hwSteps').innerHTML = STEPS.map((x, i) => {
      const done = h.done || i < h.step;
      const cls = done ? 'done' : i === st ? 'cur' : 'locked';
      return `<li class="${cls}"><div class="sh"><i>${done ? '✓' : i + 1}</i>${x.t}</div>${!h.done && i === st ? `<div class="sb">${stepBody(i)}</div>` : ''}</li>`;
    }).join('');
    $('#hwIssues').innerHTML = h.done
      ? alertBox('ok', '認識硬件完成！下一步：寫你的第一個程式。') + `<button class="btn go" id="hwNext">下一步：編寫程式</button>`
      : (issues ? issues.html : '');
    $('#hwStats').innerHTML = `<span class="pill ${h.errors ? 'err' : ''}">錯誤 ${h.errors} 次</span><span class="pill ${h.hints ? 'warn' : ''}">使用提示 ${h.hints} 次</span>`;
    const k = KNOW[h.done ? 2 : st];
    $('#hwKnow').innerHTML = typeof k === 'function' ? k() : k;
    $$('[data-check]', $('#hwPanel')).forEach(b => b.onclick = () => runCheck(+b.dataset.check));
    $$('[data-hint]', $('#hwPanel')).forEach(b => b.onclick = () => askHint(+b.dataset.hint));
    const nx = $('#hwNext'); if (nx) nx.onclick = () => { if (!S.t.code) S.t.code = now(); unlock('code'); goStage('code'); };
  }
  const say = (kind, html) => { issues = Object.assign(issues || {}, { html: alertBox(kind, html) }); };

  /* ---------- checking ---------- */
  function countError(sig, msg) {
    const h = H();
    if (sig === h.lastFailSig) return false;
    h.lastFailSig = sig; h.errors++; pushLog(h, msg); return true;
  }
  const recorded = c => c ? '<br><span class="small">已記錄 1 次錯誤。</span>' : '<br><span class="small">和上次一樣，這次不再重複扣分。</span>';
  function runCheck(i) {
    const h = H();
    if (h.done || i !== step()) return;
    if (i === 0) {
      const empty = LABELS.map((_, k) => k).filter(k => !h.labels[k]);
      if (empty.length) { issues = { bad: [] }; say('warn', `還有 <b>${empty.length}</b> 個號碼未貼標籤（${empty.map(k => k + 1).join('、')}）。全部貼好才檢查。`); render(); renderPanel(); return; }
      const bad = LABELS.map((l, k) => k).filter(k => h.labels[k] !== LABELS[k].key);
      if (!bad.length) {
        pushLog(h, '標籤全部正確');
        h.step = 1; issues = null; h.lastFailSig = ''; save();
        say('ok', '8 個標籤全部正確！下一步：麵包板小測。');
        render(); renderPanel(); return;
      }
      const sig = 'L:' + LABELS.map((_, k) => h.labels[k]).join(',');
      const c = countError(sig, `標籤錯了 ${bad.length} 個（${bad.map(k => (k + 1) + '=' + LBY(h.labels[k]).text).join('、')}）`);
      issues = { bad };
      say('err', `有 <b>${bad.length}</b> 個標籤放錯了（紅框）：<ul class="tight">${bad.map(k => `<li>號碼 ${k + 1} 不是「${LBY(h.labels[k]).text}」。${LBY(h.labels[k]).desc}</li>`).join('')}</ul>把紅框的標籤拖走，再試一次。${recorded(c)}`);
      save(); render(); renderPanel(); return;
    }
    if (i === 1) {
      const q = h.quiz.q, Q = QUIZ[q], sel = h.quiz.sel.slice();
      if (!sel.length) { say('warn', '你還未點選任何孔。'); renderPanel(); return; }
      const sig = 'Q' + q + ':' + sel.slice().sort().join(',');
      let wrong = [], msg = '';
      if (Q.rail) {
        wrong = sel.filter(id => HOLES[id].row !== Q.rail || id === Q.target);
        if (wrong.some(id => HOLES[id].row === 'tp')) msg = '你點了「+」電源軌（紅線旁）的孔。「+」軌和「−」軌是<b>兩條分開</b>的電源軌，不相通。';
        else if (wrong.some(id => id === Q.target)) msg = '最左邊那個孔本身不用點。';
        else if (wrong.length) msg = '你點了電源軌以外的孔。題目要的是和「−」電源軌相通的孔。';
        if (!wrong.length && sel.length < Q.need) { say('warn', `答對了 ${sel.length} 個，還要再點 ${Q.need - sel.length} 個。`); renderPanel(); return; }
      } else {
        wrong = sel.filter(id => !Q.ans.includes(id));
        const tgt = HOLES[Q.target];
        if (wrong.some(id => id === Q.target)) msg = `${Q.target} 本身不用點。`;
        else if (wrong.some(id => HOLES[id].col === tgt.col && HOLES[id].row.length === 1)) msg = `中間的坑把上下兩半分開。${'abcde'.includes(tgt.row) ? 'a–e' : 'f–j'} 以外的孔，和 ${Q.target} <b>不相通</b>。`;
        else if (wrong.some(id => HOLES[id].row === tgt.row)) msg = `同一<b>橫行</b>的孔（例如 ${tgt.row}${tgt.col + 1}）並不相通。相通的是<b>同一號碼</b>的直行。`;
        else if (wrong.length) msg = `有些孔和 ${Q.target} 不在同一組。相通的是同一號碼、同一半的五個孔。`;
        if (!wrong.length && sel.length < Q.ans.length) { say('warn', `答對了 ${sel.length} 個，還有 ${Q.ans.length - sel.length} 個相通的孔未點。`); renderPanel(); return; }
      }
      if (wrong.length) {
        const c = countError(sig, `麵包板第 ${q + 1} 題答錯（點了 ${wrong.join('、')}）`);
        quizMark = wrong;
        say('err', `${msg} 紅色的孔是錯的，點一下可以取消。${recorded(c)}`);
        save(); render(); renderPanel(); return;
      }
      pushLog(h, `麵包板第 ${q + 1} 題正確`);
      h.quiz.q++; h.quiz.sel = []; quizMark = null; h.lastFailSig = '';
      if (h.quiz.q >= QUIZ.length) { h.step = 2; say('ok', '麵包板小測全部正確！最後一步：用 USB 線把 UNO 接到電腦。'); }
      else say('ok', `正確！${Q.know}<br>下一題。`);
      save(); render(); renderPanel();
    }
  }
  function askHint(i) {
    const h = H();
    if (i !== step() || h.done) return;
    modal({
      title: '顯示提示？', html: '<p>每次使用提示會扣 2 分。建議先再想一想。</p>',
      actions: [{ label: '再想一想', kind: 'ghost' }, { label: '顯示提示', kind: 'primary', onClick: () => {
        h.hints++;
        if (i === 0) {
          const k = LABELS.findIndex((l, k) => h.labels[k] !== l.key);
          if (k < 0) return;
          const key = LABELS[k].key;
          Object.keys(h.labels).forEach(s => { if (h.labels[s] === key) delete h.labels[s]; });
          h.labels[k] = key; h.locked[k] = true;
          pushLog(h, `使用提示：號碼 ${k + 1} 是「${LABELS[k].text}」`);
          say('info', `提示：號碼 <b>${k + 1}</b> 是「<b>${LABELS[k].text}</b>」。${LABELS[k].desc}`);
          if (issues) issues.bad = (issues.bad || []).filter(x => x !== k);
        } else if (i === 1) {
          h.hinted['q' + h.quiz.q] = true;
          pushLog(h, `使用提示：麵包板第 ${h.quiz.q + 1} 題`);
          say('info', `提示：綠色光圈的孔就是答案。${QUIZ[h.quiz.q].know}`);
        }
        save(); render(); renderPanel();
      } }],
    });
  }

  /* ---------- pointer interaction ---------- */
  function svgPt(e) { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const slotAt = p => LABELS.findIndex((_, i) => { const r = SLOT(i); return inRect(p, { x: r.x - 30, y: r.y - 8, w: r.w + 40, h: r.h + 16 }); });
  const holeAt = p => { let best = null, bd = 11; for (const id in HOLES) { const q = HOLES[id]; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = id; } } return best; };
  function place(key, slot) {
    const h = H();
    if (h.locked[slot]) { toast('這一格是提示給你的答案，不用改。'); return; }
    const from = Object.keys(h.labels).find(s => h.labels[s] === key);
    if (from !== undefined && h.locked[from]) return;
    const prev = h.labels[slot];
    if (from !== undefined) delete h.labels[from];
    h.labels[slot] = key;
    if (prev && prev !== key && from !== undefined) h.labels[from] = prev;   // swap
    if (issues && issues.bad) issues.bad = issues.bad.filter(x => x !== slot && x !== +from);
    save();
  }
  function unplace(key) { const h = H(); const from = Object.keys(h.labels).find(s => h.labels[s] === key); if (from !== undefined && !h.locked[from]) { delete h.labels[from]; if (issues && issues.bad) issues.bad = issues.bad.filter(x => x !== +from); save(); } }
  function onDown(e) {
    if (!S || H().done) return;
    const p = svgPt(e), st = step();
    if (st === 0) {
      const g = e.target.closest('[data-chip]');
      if (g) {
        const key = g.dataset.chip, from = Object.keys(H().labels).find(s => H().labels[s] === key);
        if (from !== undefined && H().locked[from]) { toast('這一格是提示給你的答案，不用改。'); return; }
        drag = { key, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; svg.setPointerCapture(e.pointerId); return;
      }
      const slot = slotAt(p);
      if (slot >= 0 && selChip) { place(selChip, slot); selChip = null; render(); renderPanel(); }
      return;
    }
    if (st === 1) {
      const id = holeAt(p); if (!id) return;
      const h = H(); const k = h.quiz.sel.indexOf(id);
      if (k >= 0) h.quiz.sel.splice(k, 1); else h.quiz.sel.push(id);
      if (quizMark) quizMark = quizMark.filter(x => h.quiz.sel.includes(x));
      save(); render(); renderPanel(); return;
    }
    if (st === 2 && !S.up.usb && e.target.closest('.plug')) { drag = { plug: true, x: p.x, y: p.y }; svg.setPointerCapture(e.pointerId); }
  }
  function onMove(e) {
    const p = svgPt(e);
    if (drag) {
      drag.x = p.x; drag.y = p.y;
      if (drag.key && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 6) drag.moved = true;
      render(); return;
    }
    if (step() === 1 && !H().done) {
      const id = holeAt(p);
      if (id) { const q = HOLES[id]; showTip(RAIL_NAME[q.row] ? `${RAIL_NAME[q.row]}` : `孔 <b>${id}</b>`, e); } else hideTip();
    }
  }
  function onUp(e) {
    if (!drag) return;
    const p = svgPt(e), d = drag; drag = null;
    if (d.key) {
      if (!d.moved) { selChip = selChip === d.key ? null : d.key; render(); return; }
      const slot = slotAt(p);
      if (slot >= 0) place(d.key, slot); else if (p.y > 420) unplace(d.key);
      selChip = null; render(); renderPanel(); return;
    }
    if (d.plug) {
      if (inRect(p, { x: PORT.x - 30, y: PORT.y - 10, w: PORT.w + 30, h: PORT.h + 20 })) { plugIn(); return; }
      if (inRect(p, { x: JACK.x - 30, y: JACK.y - 10, w: JACK.w + 30, h: JACK.h + 20 })) {
        const c = countError('JACK', 'USB 插頭插錯了電源插口');
        say('err', `這是<b>電源插口</b>（黑色圓形），用來接火牛或電池盒，USB 插頭插不進去。USB 插口是<b>銀色方形</b>的那一個。${recorded(c)}`);
        save();
      }
      render(); renderPanel();
    }
  }
  function plugIn() {
    const h = H();
    S.up.usb = true;
    pushLog(h, 'USB 線已插好');
    h.step = 3; h.done = true; S.t.hwEnd = now(); issues = null;
    save(); unlock('code'); render(); renderPanel();
    toast(`電腦已偵測到新裝置：Arduino Uno（${S.up.com}）`, 'ok');
    modal({
      title: '認識硬件完成！',
      html: `<p>UNO 已經接到電腦：綠色的 <b>ON</b> 燈亮了，電腦找到 <b>Arduino Uno（${S.up.com}）</b>。</p><p style="margin-top:8px">下一步：寫你的第一個程式，令 <b>L 燈</b>閃起來。</p>`,
      actions: [{ label: '留在這頁', kind: 'ghost' }, { label: '下一步：編寫程式', kind: 'go', onClick: () => { if (!S.t.code) S.t.code = now(); goStage('code'); } }],
    });
  }
  function showTip(html, e) { const t = $('#tip'); t.innerHTML = html; t.hidden = false; t.style.left = (e.clientX + 14) + 'px'; t.style.top = (e.clientY + 16) + 'px'; }
  function hideTip() { $('#tip').hidden = true; }

  function build() {
    svg = $('#hwSvg');
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', () => { drag = null; render(); });
    svg.addEventListener('pointerleave', () => { if (!drag) hideTip(); });
    built = true;
  }
  function enter() {
    if (!built) build();
    issues = null; quizMark = null; selChip = null; drag = null;
    render(); renderPanel();
  }

  /* teacher demo: complete all three parts */
  function autoWire() {
    const h = H();
    LABELS.forEach((l, i) => { h.labels[i] = l.key; });
    h.quiz = { q: QUIZ.length, sel: [] };
    S.up.usb = true; h.step = 3; h.done = true; S.t.hwEnd = now();
    S.teacherUsed = true; save();
    if (built) { render(); renderPanel(); }
  }

  return { enter, circuitSVG, setL, autoWire, runCheck, LABELS, QUIZ, HOLES, SLOT, POOLPOS, POOL_ORDER, PORT, JACK, PLUG0, place, plugIn, unoSVG };
})();
stageInit.hw = () => HW.enter();
