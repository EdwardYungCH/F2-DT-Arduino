/* =====================================================================
   實物挑戰、成績報告、教師模式、成績核對工具
   ===================================================================== */
const FULL_CODE = CODE_TEMPLATE.map(l => l.replace(/\{\{(b\d)\}\}/g, (_, id) => BLANKS.find(b => b.id === id).ans)).join('\n');

/* ---------------- 實物挑戰 ---------------- */
const REAL_ITEMS = [
  ['準備材料', '按上面的材料清單拿齊材料。220Ω（2 條紅色）和 10kΩ（1 條紅色）分開放好。'],
  ['先接線，後通電', '接線時<b>不要</b>插 USB 線，避免接錯時短路。'],
  ['照你的接線圖接駁 LED 部分', '三粒 LED、三粒 220Ω、三條信號線、GND 和電源軌。'],
  ['照你的接線圖接駁按鈕部分', '按鈕跨過中間的坑，腳向上下；5V、D2 和 10kΩ 下拉電阻。'],
  ['通電前再檢查一次', 'LED 長腳向信號腳；10kΩ 用在按鈕、220Ω 用在 LED；「−」電源軌已接到 GND。'],
  ['插上 USB 線', 'UNO 板上綠色的 ON 燈會亮起。'],
  ['把程式貼到 Arduino IDE', '按右邊的「複製完整程式」，在 IDE 中全選原有內容，再貼上。'],
  ['選擇 Board 和 Port，然後上傳', 'Tools → Board → Arduino Uno；Tools → Port → 有 (Arduino Uno) 字樣的 COM；按 Upload。'],
  ['測試', '平時綠燈；按一下按鈕，燈號轉黃、紅、紅＋黃，再回到綠燈。請老師過來確認。'],
];
stageInit.real = () => {
  const sec = $('#st-real');
  const done = REAL_ITEMS.filter((_, i) => S.real.checks[i]).length;
  sec.innerHTML = `<div class="real-layout">
    <div class="stack" style="gap:18px">
      <div class="intro-head" style="margin-bottom:4px"><div><div class="eyebrow">第 4 步</div><h2 style="font-size:28px;font-weight:900">實物挑戰：在真的 UNO 上做一次</h2><p class="muted" style="margin-top:6px">模擬器已經完成。現在用真的材料再做一次，每完成一項就剔一剔。</p></div></div>
      <div class="card"><h3>先認電阻 <span class="small muted" style="font-weight:400">（不計分）</span></h3><div id="resQuiz"></div></div>
      <details class="card fold-card" ${S.real.checks[0] ? '' : 'open'}><summary><h3 style="display:inline-flex;margin:0">材料清單</h3></summary><div style="margin-top:10px">${KIT.table(MATERIALS.main)}</div></details>
      <div class="card"><h3>清單 <span class="pill ${done === REAL_ITEMS.length ? 'ok' : ''}" id="realCount">${done} / ${REAL_ITEMS.length}</span></h3>
        <ul class="checklist">${REAL_ITEMS.map(([b, s], i) => `<li><label><input type="checkbox" id="rc${i}" data-i="${i}" ${S.real.checks[i] ? 'checked' : ''}><div><b>${i + 1}. ${b}</b><span>${s}</span></div></label></li>`).join('')}</ul>
      </div>
      <div class="card"><h3>你的接線圖</h3><div class="sos-stage">${HW.circuitSVG()}</div>
        <p class="small muted" style="margin-top:8px">D12 / D11 / D10 → 220Ω → 紅 / 黃 / 綠 LED → 「−」電源軌 → GND；5V → 按鈕 → D2，10kΩ 由 D2 接到 GND。</p></div>
    </div>
    <div class="stack" style="gap:18px">
      <div class="card"><h3>老師確認</h3>
        <div id="realConfirm">${S.real.confirmed ? alertBox('ok', '老師已確認你的實物過路燈成功運作。') : `<p class="muted">實物過路燈成功後，請老師輸入密碼確認。這項會印在成績報告上。</p><button class="btn teal" id="realConfirmBtn" style="margin-top:10px">老師確認</button>`}</div>
      </div>
      <div class="card"><h3>完整程式</h3><p class="muted small">上傳到真的 UNO 時用這段程式（就是你剛剛完成的版本）。</p>
        <div class="row" style="margin-top:10px"><button class="btn primary" id="copyCode">複製完整程式</button><span class="small muted" id="copyMsg"></span></div>
        <textarea id="codeText" readonly style="margin-top:10px;width:100%;height:120px;font-family:var(--f-mono);font-size:12px;border:1px solid var(--line);border-radius:6px;background:var(--surface-2);color:var(--ink);padding:8px">${esc(FULL_CODE)}</textarea>
      </div>
      <div class="card"><h3>遇到問題？</h3>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>情況</th><th>可能原因及解決方法</th></tr></thead><tbody>
          <tr><td>某粒 LED 完全不亮</td><td>那粒 LED 接反了（長腳要向信號腳）；它的短腳沒有接到「−」電源軌；或者電源軌未接到 GND。</td></tr>
          <tr><td>LED 非常暗</td><td>用錯了 10kΩ（1 條紅色）或 1kΩ 電阻。LED 要用 220Ω：紅紅黑黑棕，有 2 條紅色。</td></tr>
          <tr><td>不用按掣，燈號已經自己轉</td><td>漏接 10kΩ 下拉電阻，D2「浮空」亂跳；或者按鈕方向錯，兩邊本來已經接通。</td></tr>
          <tr><td>按掣完全沒有反應</td><td>按鈕沒有跨過中間的坑；5V 和 D2 接到了按鈕同一邊；或者 D2 的線插錯了孔。</td></tr>
          <tr><td>燈號次序不對</td><td>三條信號線接錯腳：紅 D12、黃 D11、綠 D10。</td></tr>
          <tr><td>上傳時出現 not in sync</td><td>Port 選錯了，或者 Board 不是 Arduino Uno。</td></tr>
        </tbody></table></div>
      </div>
      <div class="card"><h3>做完了？</h3>
        <p class="muted">做得快的同學可以試<b>延伸挑戰</b>（選做）：過路「嘀嘀」聲，以及用傾斜開關做單車防盜警報。延伸挑戰另外計分，不影響 100 分總分。</p>
        <div class="row" style="margin-top:12px"><button class="btn go" id="toExt">下一步：延伸挑戰</button><button class="btn" id="toReport">直接產生成績報告</button></div>
      </div>
    </div>
  </div>`;
  if (!S.real.resQuiz) S.real.resQuiz = {};
  KIT.quiz($('#resQuiz'), [
    { ask: '哪一粒是 <b>220Ω</b>（LED 用）？', ans: 220, tip: '數一數紅色環：220Ω 有 <b>2 條</b>紅色。' },
    { ask: '哪一粒是 <b>10kΩ</b>（按鈕的下拉電阻）？', ans: 10000, tip: '10kΩ 只有 <b>1 條</b>紅色（第 4 條）。沒有紅色的是 1kΩ。' },
  ], [10000, 220, 1000], S.real.resQuiz);
  $$('.checklist input', sec).forEach(cb => cb.onchange = () => {
    S.real.checks[cb.dataset.i] = cb.checked; save();
    $('#realCount').textContent = `${REAL_ITEMS.filter((_, i) => S.real.checks[i]).length} / ${REAL_ITEMS.length}`;
  });
  const cb = $('#realConfirmBtn'); if (cb) cb.onclick = () => askPassword('老師確認實物成功', () => {
    S.real.confirmed = true; S.real.confirmedAt = now(); save();
    $('#realConfirm').innerHTML = alertBox('ok', '老師已確認你的實物過路燈成功運作。');
    toast('已確認實物成功', 'ok');
  });
  $('#copyCode').onclick = async () => {
    const ta = $('#codeText');
    try { await navigator.clipboard.writeText(FULL_CODE); $('#copyMsg').textContent = '已複製，可以貼到 Arduino IDE。'; }
    catch (e) { ta.focus(); ta.select(); $('#copyMsg').textContent = '已選取全部程式，請按 Ctrl+C 複製。'; }
  };
  const leaveReal = target => {
    const go = () => { unlock(target); goStage(target); };
    if (!S.real.confirmed) {
      modal({ title: '未有老師確認實物成功', html: '<p>你可以先繼續，報告上會顯示「實物測試：未確認」。如果稍後老師確認了，回到這一頁，再下載一次報告就可以。</p>',
        actions: [{ label: '留在這頁', kind: 'ghost' }, { label: '繼續', kind: 'go', onClick: go }] });
    } else go();
  };
  $('#toExt').onclick = () => leaveReal('ext');
  $('#toReport').onclick = () => leaveReal('report');
};

/* ---------------- report data ---------------- */
function buildRecord() {
  const sc = scores();
  const fin = sc.complete && S.finishedAt ? S.finishedAt : now();
  const secs = (a, b) => (a && b) ? Math.round((b - a) / 1000) : null;
  return {
    app: CONFIG.APP, v: CONFIG.VERSION, id: S.id,
    name: S.student.name, cls: S.student.cls, no: S.student.no, attempt: S.attempt,
    started: new Date(S.startedAt).toISOString(), finished: new Date(fin).toISOString(),
    dur: { hw: secs(S.t.hw, S.t.hwEnd), code: secs(S.t.code, S.t.codeEnd), up: secs(S.t.codeEnd, S.t.upEnd), total: secs(S.startedAt, fin) },
    score: sc,
    status: sc.complete ? 'complete' : 'partial',
    progress: { hw: !!S.hw.done, code: !!S.code.done, blanksOk: BLANKS.filter(b => (S.code.blanks[b.id] || {}).status === 'ok').length, blanksOf: BLANKS.length, up: !!S.up.uploaded },
    hw: { errors: S.hw.errors, hints: S.hw.hints, log: S.hw.log.slice(0, 40).map(l => clockOf(l.t) + '  ' + l.msg) },
    code: { checks: S.code.checks, blanks: !S.code.done ? [] : BLANKS.map(b => { const x = S.code.blanks[b.id] || {}; return { n: +b.id.slice(1), ask: b.ask, ans: b.ans, wrong: x.wrong || 0, revealed: !!x.revealed, hinted: !!x.hinted, pts: x.revealed ? 1 : Math.max(2, 5 - Math.min(3, x.wrong || 0) - (x.hinted ? 1 : 0)) }; }), log: S.code.log ? S.code.log.slice(0, 40).map(l => clockOf(l.t) + '  ' + l.msg) : [] },
    up: { errors: S.up.errors, log: S.up.log.slice(0, 40).map(l => clockOf(l.t) + '  ' + l.msg) },
    real: { confirmed: !!S.real.confirmed, checked: REAL_ITEMS.filter((_, i) => S.real.checks[i]).length, of: REAL_ITEMS.length },
    ext: extRecord(),
    teacherUsed: !!S.teacherUsed,
  };
}
function extRecord() {
  const e = S.ext, sc = extScores();
  const lg = o => (o.log || []).slice(0, 30).map(l => clockOf(l.t) + '  ' + l.msg);
  const one = k => ({ done: !!e[k].done, score: sc[k], hwErrors: e[k].hw.errors, hints: e[k].hw.hints, wrong: sc[k] ? sc[k].wrong : null, revealed: sc[k] ? sc[k].rev : null, codeHints: sc[k] ? sc[k].hn : null, flowErrors: e[k].flow.errors || 0, confirmed: !!e[k].confirmed, log: lg(e[k].hw).concat(lg(e[k].code), lg(e[k].flow)) });
  return { c1: one('c1'), c2: one('c2') };
}
const extSVG = () => HW.circuitSVG(S.hw);
function signRecord(rec) { const payload = JSON.stringify(rec); return { payload, sig: SHA.hmac(CONFIG.SIGN_KEY, payload) }; }
const codeOf = sig => { const s = sig.slice(0, 12).toUpperCase(); return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`; };

/* self-contained renderer: its source is copied into every report file */
function renderReportBody(d, ok, sig, svg) {
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var dur = function (s) { if (s == null) return '—'; s = Math.round(s); var m = Math.floor(s / 60); return m ? m + ' 分 ' + (s % 60) + ' 秒' : s + ' 秒'; };
  var dt = function (iso) { var x = new Date(iso); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + ' ' + p(x.getHours()) + ':' + p(x.getMinutes()); };
  var code = sig ? (sig.slice(0, 4) + '-' + sig.slice(4, 8) + '-' + sig.slice(8, 12)).toUpperCase() : '';
  var bar = function (label, v, max) { return '<div class="rb"><span>' + label + '</span><div class="rt"><i style="width:' + Math.round(v / max * 100) + '%"></i></div><b>' + v + ' / ' + max + '</b></div>'; };
  var list = function (arr, empty) { return arr && arr.length ? '<ul class="rlog">' + arr.map(function (x) { return '<li>' + E(x) + '</li>'; }).join('') + '</ul>' : '<p class="rmuted">' + empty + '</p>'; };
  var s = d.score;
  var part = d.status === 'partial', pg = d.progress || {};
  var h = '';
  h += '<div class="rhead"><div><div class="reye">設計與科技 · Arduino UNO 實作</div><h1>行人過路燈 · 成績報告</h1></div>';
  h += ok ? '<div class="rver ok">✔ 驗證碼有效<br><b>' + code + '</b></div>' : '<div class="rver bad">✘ 驗證失敗<br>報告內容被修改過</div>';
  h += '</div>';
  h += '<table class="rinfo"><tr><th>姓名</th><td>' + E(d.name) + '</td><th>班別</th><td>' + E(d.cls) + '</td><th>學號</th><td>' + E(d.no) + '</td></tr>';
  h += '<tr><th>開始</th><td>' + dt(d.started) + '</td><th>' + (part ? '交出' : '完成') + '</th><td>' + dt(d.finished) + '</td><th>嘗試次數</th><td>第 ' + E(d.attempt) + ' 次</td></tr></table>';
  if (d.teacherUsed) h += '<div class="rwarn">注意：這次任務期間曾經使用教師模式（跳頁或示範功能）。</div>';
  if (part) {
    var st = function (label, done, extra) { return '<tr><td>' + label + '</td><td>' + (done ? '<b style="color:#1F8049">已完成 ✔</b>' : '<b style="color:#B42B1C">未完成</b>（0 分' + (extra ? '，' + extra : '') + '）') + '</td></tr>'; };
    h += '<div class="rpartial"><b>未完成（提早提交）</b>：學生在完成全部任務前交出這份報告，只計已完成的部分。<table class="rtbl" style="margin-top:6px">' + st('硬件接線', pg.hw) + st('程式填空', pg.code, '已答對 ' + pg.blanksOk + ' / ' + pg.blanksOf + ' 格') + st('上傳流程', pg.up) + '</table></div>';
  }
  h += '<div class="rscore"><div class="rbig">' + s.total + '<small> / 100</small><div class="rgrade">' + E(s.grade) + '</div></div><div class="rbars">';
  h += bar('硬件接線', s.hw, 40) + bar('程式填空', s.code, 40) + bar('上傳流程', s.up, 20);
  h += '<p class="rmuted">實物測試：' + (d.real.confirmed ? '<b style="color:#1F8049">老師已確認成功 ✔</b>' : '未確認') + '　·　實物清單完成 ' + d.real.checked + ' / ' + d.real.of + ' 項</p>' + (d.ext && (d.ext.c1.done || d.ext.c2.done) ? '<p class="rmuted">延伸挑戰（不計入總分）：' + (d.ext.c1.done ? '過路嘀嘀聲 <b>' + d.ext.c1.score.total + '</b>/10' : '過路嘀嘀聲 未完成') + '　·　' + (d.ext.c2.done ? '單車防盜 <b>' + d.ext.c2.score.total + '</b>/10' : '單車防盜 未完成') + '</p>' : '') + '</div></div>';
  if (part && !pg.hw) h += '<h2>1. 硬件接線（0 / 40）</h2><p><b>未完成</b>（0 分）。下圖是交報告時的接線。</p>';
  else h += '<h2>1. 硬件接線（' + s.hw + ' / 40）</h2><p>接線錯誤 <b>' + d.hw.errors + '</b> 次（每次 −4）；使用提示 <b>' + d.hw.hints + '</b> 次（每次 −2）；最低 16 分。用時 ' + dur(d.dur.hw) + '。</p>' + list(d.hw.log, '沒有錯誤記錄。');
  if (svg) h += '<div class="rsvg">' + svg + '</div>';
  if (part && !pg.code) h += '<h2>2. 程式填空（0 / 40）</h2><p><b>未完成</b>（0 分）。交報告時已答對 ' + pg.blanksOk + ' / ' + pg.blanksOf + ' 格。</p>';
  else {
    h += '<h2>2. 程式填空（' + s.code + ' / 40）</h2><p>每格 5 分，每答錯一次 −1（最多 −3），使用提示 −1（每格最低 2 分），顯示答案只得 1 分。用時 ' + dur(d.dur.code) + '。</p>';
  h += '<table class="rtbl"><thead><tr><th>空格</th><th>內容</th><th>答案</th><th>答錯</th><th>提示</th><th>顯示答案</th><th>得分</th></tr></thead><tbody>' + d.code.blanks.map(function (b) { return '<tr><td>' + b.n + '</td><td>' + E(b.ask) + '</td><td class="rmono">' + E(b.ans) + '</td><td>' + b.wrong + '</td><td>' + (b.hinted ? '是' : '—') + '</td><td>' + (b.revealed ? '是' : '—') + '</td><td><b>' + b.pts + '</b> / 5</td></tr>'; }).join('') + '</tbody></table>';
  if (d.code.log && d.code.log.length) h += '<details><summary>填答記錄</summary>' + list(d.code.log, '') + '</details>';
  }
  if (part && !pg.up) h += '<h2>3. 上傳流程（0 / 20）</h2><p><b>未完成</b>（0 分）。</p>';
  else h += '<h2>3. 上傳流程（' + s.up + ' / 20）</h2><p>選板、選 Port 或上傳出錯 <b>' + d.up.errors + '</b> 次（每次 −3，最低 8 分）。用時 ' + dur(d.dur.up) + '。</p>' + list(d.up.log, '一次成功，沒有錯誤記錄。');
  if (d.ext) {
    var x1 = d.ext.c1, x2 = d.ext.c2, ok1 = function (v) { return v ? '<b style="color:#1F8049">老師已確認 ✔</b>' : '未確認'; };
    h += '<h2>4. 延伸挑戰（選做，不計入 100 分總分）</h2>';
    h += '<table class="rtbl"><thead><tr><th>挑戰</th><th>狀態</th><th>得分</th><th>記錄</th><th>實物</th></tr></thead><tbody>';
    var row = function (label, x) { return '<tr><td>' + label + '</td><td>' + (x.done ? '完成' : '未完成') + '</td><td>' + (x.done ? '<b>' + x.score.total + '</b> / 10<br><span class="rmuted">接線 ' + x.score.hw + '/4 · 程式 ' + x.score.code + '/4 · 上傳 ' + x.score.up + '/2</span>' : '—') + '</td><td class="rmuted">' + (x.done ? '接線錯誤 ' + x.hwErrors + ' 次、提示 ' + x.hints + ' 次、填錯 ' + x.wrong + ' 次' + (x.codeHints ? '、程式提示 ' + x.codeHints + ' 格' : '') + '、顯示答案 ' + x.revealed + ' 格、上傳錯誤 ' + x.flowErrors + ' 次' : '—') + '</td><td>' + (x.done ? ok1(x.confirmed) : '—') + '</td></tr>'; };
    h += row('1. 過路「嘀嘀」聲（蜂鳴器）', x1) + row('2. 單車防盜警報（傾斜開關）', x2);
    h += '</tbody></table>';
    if ((x1.log && x1.log.length) || (x2.log && x2.log.length)) h += '<details><summary>延伸挑戰記錄</summary>' + list((x1.log || []).map(function (l) { return '挑戰1 ' + l; }).concat((x2.log || []).map(function (l) { return '挑戰2 ' + l; })), '') + '</details>';
  }
  h += '<div class="rfoot">總用時 ' + dur(d.dur.total) + '　·　報告編號 ' + E(d.id) + '　·　驗證碼 ' + (ok ? code : '無效') + '</div>';
  return h;
}
const REPORT_CSS = `
.rep{background:#fff;color:#16222a;font:14.5px/1.6 "Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif;max-width:900px;margin:0 auto;padding:36px 40px;border-radius:6px;box-shadow:0 2px 24px rgba(0,0,0,.12);color-scheme:light}
.rep h1{font-size:26px;margin:2px 0 0;font-weight:900}
.rep h2{font-size:17px;margin:26px 0 6px;padding-top:14px;border-top:2px solid #16222a}
.rep p{margin:0 0 8px}
.reye{font-size:12px;letter-spacing:.12em;color:#6a7a83;font-weight:700}
.rhead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
.rver{border-radius:8px;padding:8px 14px;font-size:13px;text-align:right}
.rver.ok{background:#E2F4E9;color:#1F6B40}.rver.ok b{font-family:Consolas,monospace;font-size:15px;letter-spacing:.06em}
.rver.bad{background:#FCE3DF;color:#B42B1C;font-weight:700}
.rinfo{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}
.rinfo th{text-align:left;color:#6a7a83;font-weight:500;padding:4px 8px 4px 0;white-space:nowrap}
.rinfo td{padding:4px 18px 4px 0;font-weight:700}
.rwarn{background:#FBEFD6;color:#7A5200;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:13px}
.rscore{display:grid;grid-template-columns:170px 1fr;gap:24px;align-items:center;background:#F3F6F4;border-radius:10px;padding:18px 20px}
.rbig{font-size:64px;font-weight:700;line-height:1;font-family:"Chakra Petch",Consolas,sans-serif}
.rbig small{font-size:20px;color:#6a7a83}
.rgrade{font-size:18px;font-weight:900;margin-top:6px;font-family:"Noto Sans TC",sans-serif}
.rbars{display:flex;flex-direction:column;gap:9px}
.rb{display:grid;grid-template-columns:76px 1fr 64px;gap:10px;align-items:center;font-size:13px}
.rb b{text-align:right;font-family:Consolas,monospace}
.rt{height:10px;background:#fff;border:1px solid #cfd9d4;border-radius:5px;overflow:hidden}.rt i{display:block;height:100%;background:#0B767A}
.rmuted{color:#6a7a83;font-size:13px}
.rlog{margin:4px 0 8px;padding-left:1.2em;font-size:13px;color:#33434c}
.rtbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0}
.rtbl th,.rtbl td{text-align:left;padding:6px 8px;border-bottom:1px solid #dde5e1}
.rtbl th{font-size:12px;color:#6a7a83}
.rmono{font-family:Consolas,monospace}
.rsvg{margin:10px 0;border-radius:8px;overflow:hidden}.rsvg svg{display:block;width:100%;height:auto}
.rpartial{background:#FBEFD6;color:#5E4100;border-left:4px solid #D9961A;padding:10px 14px;border-radius:6px;margin:0 0 14px;font-size:14px}.rpartial .rtbl td{border-color:#EBD7AE}
.rfoot{margin-top:24px;padding-top:12px;border-top:1px solid #dde5e1;font-size:12px;color:#6a7a83}
.rep details{font-size:13px;margin-bottom:8px}.rep summary{cursor:pointer;color:#0B767A}
@media (max-width:600px){.rep{padding:20px}.rscore{grid-template-columns:1fr}}`;
(function () { const st = document.createElement('style'); st.textContent = REPORT_CSS; document.head.appendChild(st); })();

function reportFileHTML(rec, signed) {
  const svg = extSVG();
  const box = JSON.stringify({ payload: signed.payload, sig: signed.sig }).replace(/</g, '\\u003c');
  const shaSrc = $('#shaSrc').textContent.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>過路燈成績報告 · ${esc(rec.cls)} ${esc(rec.no)} ${esc(rec.name)}</title>
<style>body{margin:0;background:#E7ECEA;padding:24px 12px}${REPORT_CSS}</style></head>
<body><div class="rep" id="r"><noscript>請用 Chrome 或 Edge 等瀏覽器開啟這份報告。</noscript></div>
<template id="circuit">${svg}</template>
<script type="application/json" id="sos-report">${box}</script>
<script>${shaSrc}</script>
<script>
var KEY = ${JSON.stringify(CONFIG.SIGN_KEY)};
${renderReportBody.toString()}
(function(){var box=JSON.parse(document.getElementById('sos-report').textContent),d=null,ok=false;
try{d=JSON.parse(box.payload);ok=SHA.hmac(KEY,box.payload)===box.sig;}catch(e){}
document.getElementById('r').innerHTML=d?renderReportBody(d,ok,box.sig,document.getElementById('circuit').innerHTML):'<p>報告資料已損壞，無法讀取。</p>';})();
</script></body></html>`;
}

/* ---------------- report page ---------------- */
stageInit.report = () => {
  const lastExt = Math.max(S.ext.c1.t.end || 0, S.ext.c2.t.end || 0);
  if (mainDone() && (!S.finishedAt || lastExt > S.finishedAt)) { S.finishedAt = now(); save(); }
  const rec = buildRecord(); const signed = signRecord(rec);
  const sc = rec.score, partial = rec.status === 'partial';
  const sec = $('#st-report');
  sec.innerHTML = `${partial ? `<div class="partial-top">${alertBox('warn', `<b>這是未完成的報告（提早提交）。</b>只計已完成的部分，未完成的部分是 0 分。你可以先下載交給老師，之後再繼續做；完成後回來下載完整報告。`)}<button class="btn go" id="resumeBtn">返回繼續做</button></div>` : ''}<div class="report-top">
      <div class="score-card">
        <div class="eyebrow" style="color:#7FA7AC">第 6 步 · 成績</div>
        <div class="big">${sc.total}<small> / 100</small></div>
        <div class="grade">${sc.grade}</div>
        <div class="meta"><span>${esc(rec.cls)} · ${esc(rec.no)} · ${esc(rec.name)}</span><span>總用時 ${fmtDur(rec.dur.total)}</span></div>
        ${rec.ext.c1.done || rec.ext.c2.done ? `<div class="meta" style="margin-top:6px"><span>延伸挑戰（另計）</span><span>嘀嘀聲 ${rec.ext.c1.done ? rec.ext.c1.score.total + ' / 10' : '未完成'} · 單車防盜 ${rec.ext.c2.done ? rec.ext.c2.score.total + ' / 10' : '未完成'}</span></div>` : ''}
        <div class="meta" style="margin-top:6px"><span>驗證碼</span><span class="code">${codeOf(signed.sig)}</span></div>
      </div>
      <div class="card stack" style="gap:16px">
        <h3 style="margin:0">下載成績報告，交給老師</h3>
        <div class="bars">
          <div class="bar-row"><span>硬件接線</span><div class="t"><i style="width:${sc.hw / 40 * 100}%"></i></div><span class="v">${sc.hw} / 40</span></div>
          <div class="bar-row"><span>程式填空</span><div class="t"><i style="width:${sc.code / 40 * 100}%"></i></div><span class="v">${sc.code} / 40</span></div>
          <div class="bar-row"><span>上傳流程</span><div class="t"><i style="width:${sc.up / 20 * 100}%"></i></div><span class="v">${sc.up} / 20</span></div>
        </div>
        <ol class="goals small">
          <li>按「下載成績報告」，會得到一個 <b>.html</b> 檔案（檔名有你的班別、學號和姓名）。</li>
          <li>把這個檔案上傳到老師指定的地方（例如 Google Classroom）。</li>
          <li><b>不要修改檔案。</b>報告有驗證碼，內容被改過會顯示「驗證失敗」。</li>
        </ol>
        <div class="row"><button class="btn go lg" id="dlReport">下載成績報告</button><span class="small muted" id="dlMsg"></span></div>
        ${rec.real.confirmed || partial ? '' : `<p class="small muted">實物測試未有老師確認。如果稍後確認了，可以回到「實物挑戰」頁，再回來下載一次。</p>`}
        ${partial || (rec.ext.c1.done && rec.ext.c2.done) ? '' : `<p class="small muted">還有時間？可以回到「延伸挑戰」再做，完成後回來重新下載報告。</p>`}
      </div>
    </div>
    <div style="margin-top:22px"><div class="eyebrow" style="max-width:900px;margin:0 auto 8px">報告預覽</div><div class="rep">${renderReportBody(rec, true, signed.sig, extSVG())}</div></div>`;
  $('#dlReport').onclick = async () => {
    const fname = `過路燈${partial ? '_未完成' : ''}_${rec.cls}_${rec.no}_${rec.name}.html`.replace(/[\\/:*?"<>|\s]+/g, '_');
    const res = await saveFile(fname, reportFileHTML(rec, signed), 'text/html');
    $('#dlMsg').textContent = res === 'saved' ? `已下載：${fname}` : '未有下載，可以再按一次。';
    if (res === 'saved') { S.downloaded = (S.downloaded || 0) + 1; save(); }
  };
  const rb = $('#resumeBtn'); if (rb) rb.onclick = () => goStage(S.resume && S.resume !== 'report' ? S.resume : STAGES[Math.min(S.unlocked, 2)]);
};

/* ---------------- teacher mode ---------------- */
function setTeacher(on) {
  teacherOn = on; $('#teacherBar').hidden = !on; renderStepper();
}
$('#teacherBtn').onclick = () => teacherOn ? teacherPanel() : askPassword('進入教師模式', () => { setTeacher(true); teacherPanel(); });
$('#tbOpen').onclick = teacherPanel;
$('#tbExit').onclick = () => { setTeacher(false); toast('已登出教師模式'); if (S && STAGES.indexOf(stepperOf(S.stage)) > S.unlocked) goStage(STAGES[S.unlocked]); };
function teacherPanel() {
  const has = !!S;
  modal({
    title: '教師工具',
    html: `<div class="stack">
      <div><b>成績核對</b><p class="small muted">把學生交來的報告檔一次過拖入，核對驗證碼並匯出全班成績（CSV，可用 Excel 開啟）。</p><button class="btn teal" id="tpVerify" style="margin-top:6px">開啟成績核對工具</button></div>
      <div style="border-top:1px solid var(--line);padding-top:12px"><b>課堂示範</b>${has ? `<p class="small muted">目前學生：${esc(S.student.cls)} · ${esc(S.student.no)} · ${esc(S.student.name)}。使用以下功能會在該學生的報告上註明「曾使用教師模式」。</p>
        <div class="row" style="margin-top:6px">${STAGES.map((s, i) => `<button class="btn sm" data-jump="${s}">${['簡介', '接線', '編程', '實物', '延伸', '報告'][i]}</button>`).join('')}</div>
        <div class="tp-grid" style="margin-top:8px">
          <span class="small muted">主任務</span><div class="row"><button class="btn sm" data-auto="wire:main">自動完成接線</button><button class="btn sm" data-auto="fill:main">填上程式答案</button></div>
          <span class="small muted">延伸 1</span><div class="row"><button class="btn sm" data-auto="wire:c1">自動完成蜂鳴器接線</button><button class="btn sm" data-auto="fill:c1">填上程式答案</button></div>
          <span class="small muted">延伸 2</span><div class="row"><button class="btn sm" data-auto="wire:c2">自動完成傾斜開關接線</button><button class="btn sm" data-auto="fill:c2">填上程式答案</button></div>
        </div>` : '<p class="small muted">未有學生登入。可以先用一個示範名字登入（例如「老師示範」），再用跳頁和自動完成功能。</p>'}</div>
      <div style="border-top:1px solid var(--line);padding-top:12px"><b>這部電腦</b><p class="small muted">清除本機儲存的學生進度，讓下一位同學使用。</p><button class="btn sm" id="tpClear" style="margin-top:6px">清除學生進度</button></div>
      <p class="small muted" style="border-top:1px solid var(--line);padding-top:12px">教師密碼及報告密鑰在檔案開頭的 <code>CONFIG</code> 內修改。</p>
    </div>`,
    actions: [{ label: '關閉', kind: 'primary' }],
    onOpen: (back, close) => {
      $('#tpVerify', back).onclick = () => { close(); verifier(); };
      $$('[data-jump]', back).forEach(b => b.onclick = () => {
        const i = STAGES.indexOf(b.dataset.jump);
        if (i > S.unlocked) { S.teacherUsed = true; }
        if (b.dataset.jump === 'report' && !S.finishedAt) S.finishedAt = now();
        if (i > S.unlocked) S.unlocked = i;
        save(); close(); goStage(b.dataset.jump);
      });
      $$('[data-auto]', back).forEach(b => b.onclick = () => {
        const [act, ctx] = b.dataset.auto.split(':');
        const need = ctx === 'main' ? (act === 'wire' ? 1 : 2) : 4;
        if (S.unlocked < need) S.unlocked = need;
        if (ctx !== 'main' && act === 'fill' && !S.ext[ctx].hw.done) HW.autoWire(ctx);
        if (act === 'wire') { HW.autoWire(ctx); close(); goStage(ctx === 'main' ? 'hw' : ctx + 'hw'); toast('已完成示範接線，請按「完成接線檢查」', 'ok'); }
        else {
          if (ctx !== 'main' && !S.ext[ctx].hw.done) { S.ext[ctx].hw.done = true; S.ext[ctx].hw.step = 4; }
          IDE.fillAnswers(ctx); save(); close(); goStage(ctx === 'main' ? 'code' : ctx + 'code');
          toast('已填上答案，請按「檢查答案」', 'ok');
        }
      });
      $('#tpClear', back).onclick = () => {
        close();
        modal({ title: '清除學生進度？', html: '<p>這會刪除這部電腦上儲存的學生進度，不能復原。已下載的成績報告不受影響。</p>', actions: [{ label: '取消', kind: 'ghost' }, { label: '清除', kind: 'go', onClick: () => { forget(STORE_KEY); S = null; setTeacher(false); showLogin(); toast('已清除'); } }] });
      };
    },
  });
}

/* ---------------- verifier ---------------- */
let vRows = [];
function parseReport(text, fname) {
  const m = /<script type="application\/json" id="sos-report">([\s\S]*?)<\/script>/.exec(text);
  if (!m) return { fname, err: '不是過路燈成績報告' };
  try {
    const box = JSON.parse(m[1]); const d = JSON.parse(box.payload);
    const ok = SHA.hmac(CONFIG.SIGN_KEY, box.payload) === box.sig && d.app === CONFIG.APP;
    return { fname, d, ok, code: codeOf(box.sig), raw: box.sig + box.payload };
  } catch (e) { return { fname, err: '檔案損壞' }; }
}
function verifier() {
  modal({
    title: '成績核對工具',
    wide: true,
    html: `<div class="stack">
      <div class="drop" id="vDrop"><b>把學生的成績報告（.html）拖到這裏</b><br><span class="small">可以一次放很多個檔案</span><br><label class="btn sm" style="margin-top:10px">選擇檔案<input type="file" id="vFile" multiple accept=".html,.htm,text/html" hidden></label></div>
      <div class="row" style="justify-content:space-between"><span class="small muted" id="vSum"></span><div class="row"><button class="btn sm" id="vClear">清除列表</button><button class="btn sm teal" id="vCsv">匯出 CSV（Excel）</button></div></div>
      <div class="tbl-wrap"><table class="tbl" id="vTbl"></table></div>
    </div>`,
    actions: [{ label: '關閉', kind: 'primary' }],
    onOpen: back => {
      const drop = $('#vDrop', back);
      const take = files => Promise.all(Array.from(files).map(f => f.text().then(t => parseReport(t, f.name)))).then(rs => {
        rs.forEach(r => { if (r.d && vRows.some(x => x.raw === r.raw)) return; vRows.push(r); });
        drawV(back);
      });
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => take(e.dataTransfer.files));
      $('#vFile', back).onchange = e => take(e.target.files);
      $('#vClear', back).onclick = () => { vRows = []; drawV(back); };
      $('#vCsv', back).onclick = exportCsv;
      drawV(back);
    },
  });
}
function drawV(back) {
  const rows = vRows.slice().sort((a, b) => a.d && b.d ? (a.d.cls.localeCompare(b.d.cls) || (+a.d.no - +b.d.no)) : a.d ? -1 : 1);
  const keyCount = {}; rows.forEach(r => { if (r.d) { const k = r.d.cls + '-' + r.d.no; keyCount[k] = (keyCount[k] || 0) + 1; } });
  $('#vSum', back).textContent = vRows.length ? `共 ${vRows.length} 份 · 有效 ${vRows.filter(r => r.ok).length} 份 · 無效 ${vRows.filter(r => !r.ok).length} 份` : '未有檔案';
  $('#vTbl', back).innerHTML = vRows.length ? `<thead><tr><th>驗證</th><th>班別</th><th>學號</th><th>姓名</th><th>狀態</th><th>總分</th><th>等級</th><th>接線</th><th>程式</th><th>上傳</th><th>實物</th><th>延伸 1</th><th>延伸 2</th><th>嘗試</th><th>用時</th><th>備註</th></tr></thead><tbody>${rows.map(r => {
    if (!r.d) return `<tr class="bad"><td>✘</td><td colspan="15">${esc(r.fname)}：${r.err}</td></tr>`;
    const d = r.d, notes = [];
    if (!r.ok) notes.push('內容被修改過');
    if (d.teacherUsed) notes.push('曾用教師模式');
    if (keyCount[d.cls + '-' + d.no] > 1) { const latest = !rows.some(o => o.d && o !== r && o.d.cls === d.cls && o.d.no === d.no && o.d.finished > d.finished); notes.push('同一學生有多份' + (latest ? '（這份最新）' : '（較舊）')); }
    return `<tr class="${r.ok ? '' : 'bad'}"><td>${r.ok ? '<span class="pill ok">有效</span>' : '<span class="pill err">無效</span>'}</td><td>${esc(d.cls)}</td><td class="num">${esc(d.no)}</td><td>${esc(d.name)}</td><td>${d.status === 'partial' ? '<span class="pill warn">未完成</span>' : '完成'}</td><td class="num"><b>${d.score.total}</b></td><td>${esc(d.score.grade)}</td><td class="num">${d.score.hw}</td><td class="num">${d.score.code}</td><td class="num">${d.score.up}</td><td>${d.real.confirmed ? '✔' : '—'}</td><td class="num">${extCell(d, 'c1')}</td><td class="num">${extCell(d, 'c2')}</td><td class="num">${d.attempt}</td><td class="num">${fmtDur(d.dur.total)}</td><td class="small">${notes.join('、')}</td></tr>`;
  }).join('')}</tbody>` : '';
}
function extCell(d, k) {
  const x = d.ext && d.ext[k];
  if (!x || !x.done) return '—';
  return `${x.score.total}${x.confirmed ? ' ✔' : ''}`;
}
function exportCsv() {
  if (!vRows.length) { toast('請先放入成績報告檔案。'); return; }
  const head = ['班別', '學號', '姓名', '狀態', '總分', '等級', '硬件接線(40)', '程式填空(40)', '上傳流程(20)', '接線錯誤次數', '接線提示次數', '程式填錯次數', '程式提示格數', '顯示答案格數', '上傳錯誤次數', '實物老師確認', '延伸1嘀嘀聲(10)', '延伸1實物確認', '延伸2單車防盜(10)', '延伸2實物確認', '嘗試次數', '總用時(分鐘)', '完成時間', '曾用教師模式', '驗證', '驗證碼', '檔名'];
  const q = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const lines = [head.join(',')];
  vRows.filter(r => r.d).sort((a, b) => a.d.cls.localeCompare(b.d.cls) || (+a.d.no - +b.d.no)).forEach(r => {
    const d = r.d;
    lines.push([d.cls, d.no, d.name, d.status === 'partial' ? '未完成（提早提交）' : '完成', d.score.total, d.score.grade, d.score.hw, d.score.code, d.score.up, d.hw.errors, d.hw.hints, d.code.blanks.reduce((a, b) => a + b.wrong, 0), d.code.blanks.filter(b => b.hinted).length, d.code.blanks.filter(b => b.revealed).length, d.up.errors, d.real.confirmed ? '是' : '否', ...extCsv(d), d.attempt, d.dur.total != null ? (d.dur.total / 60).toFixed(1) : '', fmtTime(d.finished), d.teacherUsed ? '是' : '否', r.ok ? '有效' : '無效', r.code, r.fname].map(q).join(','));
  });
  vRows.filter(r => !r.d).forEach(r => lines.push(head.map((h, i) => i === head.length - 3 ? '無效' : i === head.length - 1 ? r.fname : '').map(q).join(',')));
  saveFile(`過路燈_成績_${fmtTime(Date.now()).slice(0, 10)}.csv`, '﻿' + lines.join('\r\n'), 'text/csv').then(r => { if (r === 'saved') toast('已匯出 CSV', 'ok'); });
}

function extCsv(d) {
  const e = d.ext || {}, a = e.c1 || {}, b = e.c2 || {};
  return [a.done ? a.score.total : '', a.done ? (a.confirmed ? '是' : '否') : '', b.done ? b.score.total : '', b.done ? (b.confirmed ? '是' : '否') : ''];
}

/* ---------------- boot ---------------- */
(function boot() {
  S = null;
  showLogin();
})();
