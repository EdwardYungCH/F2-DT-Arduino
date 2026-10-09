"""Wiring help in lessons 2-5: pin / hole tags, zones, pin callouts, 'too crowded' tips, real-hardware checklist."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
FAIL = []
def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

async def lesson(pg, n):
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(f'file://{ROOT}/lesson{n}/index.html'); await pg.wait_for_timeout(300)
    await pg.evaluate("() => { S = newState({name:'測試', cls:'2A', no:'1'}); S.unlocked = 1; S.stage = 'hw'; save(); startApp(); }")
    await pg.wait_for_timeout(400)
    ok(await pg.evaluate("() => document.querySelectorAll('#gZone .zone').length") >= 1, f'L{n}: zones shown on the first (placing) step')
    steps = await pg.inner_text('#hwSteps')
    ok('麵包板 f' in steps, f'L{n}: step 1 names breadboard holes with the 麵包板 tag')
    # demo layout must be tidy: no "too crowded" tip
    await pg.evaluate("() => { HW.autoWire('main'); S.hw.done = false; S.hw.step = 0; save(); HW.enter('main'); }")
    await pg.wait_for_timeout(200)
    last = await pg.evaluate("() => document.querySelectorAll('#hwSteps [data-check]').length")
    await pg.click('#hwSteps [data-check]'); await pg.wait_for_timeout(200)
    ok('小提醒' not in await pg.inner_text('#hwIssues'), f'L{n}: suggested layout is not crowded')
    # a wire step shows callouts on the UNO pins it needs
    calls = await pg.evaluate("""() => { S.hw.wires = []; S.hw.step = S.hw.step; save(); HW.enter('main');
      for (let s = 1; s <= 8; s++) { S.hw.step = s - 1; HW.enter('main'); if (document.querySelectorAll('#gCall .pincall').length) return s; } return 0; }""")
    ok(calls > 0, f'L{n}: a wiring step marks the UNO pins it needs (step {calls})')
    # hover tooltip on a pin is the big UNO tag
    pt = await pg.evaluate("""() => { const s = document.querySelector('#hwSvg'); const q = HW.P['P:5V']; const p = s.createSVGPoint(); p.x = q.x; p.y = q.y;
      const r = p.matrixTransform(s.getScreenCTM()); return [r.x, r.y]; }""")
    await pg.mouse.move(pt[0], pt[1]); await pg.wait_for_timeout(150)
    ok('UNO 5V' in await pg.inner_text('#tip'), f'L{n}: hovering a pin shows "UNO 5V"')
    # crowded layout: move one part next to another part of a different circuit
    tip = await pg.evaluate("""() => {
      HW.autoWire('main'); S.hw.done = false;
      const parts = S.hw.parts || null;
      if (parts) { const res = parts.filter(p => p.type === 'res'); const r = res[res.length - 1]; r.h1 = 'i' + (+(/\\d+/.exec(r.h1)[0]) - 0); }
      save(); HW.enter('main'); return true; }""")
    if n == 2:
        await pg.evaluate("() => { S.ext.c1.hw.pz = { h1: 'f9' }; S.ext.c1.hw.wires = []; S.ext.c1.hw.step = 0; S.unlocked = 5; S.stage = 'c1hw'; save(); startApp(); }")
    else:
        await pg.evaluate("""() => { const p = S.hw.parts.find(x => x.type === 'led' || x.type === 'ls'); const q = /([a-j])(\\d+)/.exec(p.h1);
          const other = S.hw.parts.find(x => x !== p && x.type !== 'res' && x.type !== 'btn'); if (other) { const o = /([a-j])(\\d+)/.exec(p.h1); other.h1 = 'g' + (+o[2] + 2); }
          S.hw.step = 0; save(); HW.enter('main'); }""")
    await pg.wait_for_timeout(200)
    await pg.click('#hwSteps [data-check]'); await pg.wait_for_timeout(200)
    txt = await pg.inner_text('#hwIssues')
    ok('小提醒' in txt and '相鄰' in txt, f'L{n}: crowded parts give a "小提醒（不扣分）"')
    # real-hardware checklist
    await pg.evaluate("""() => { S = newState({name:'測試', cls:'2A', no:'1'}); HW.autoWire('main'); S.hw.done = true;
      BLANKS.forEach(b => S.code.blanks[b.id] = {val: b.ans, status: 'ok', wrong: 0}); S.code.done = true;
      Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true}); S.unlocked = 3; S.stage = 'real'; save(); startApp(); }""")
    await pg.wait_for_timeout(400)
    wl = await pg.inner_text('#wireList')
    ok('UNO GND' in wl and '麵包板' in wl and '插完後三項檢查' in wl, f'L{n}: real page lists parts and wires from the student layout')
    await pg.click('#wireList input[type=checkbox]'); await pg.wait_for_timeout(100)
    ok(await pg.evaluate("() => Object.values(S.real.wl).filter(Boolean).length") == 1, f'L{n}: ticks are saved')
    ok(await pg.is_visible('#wlPrint'), f'L{n}: print button')
    ok(not errs, f'L{n}: no page errors {errs}')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for n in range(2, 6):
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            await lesson(pg, n); await pg.close()
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
