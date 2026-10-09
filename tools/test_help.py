"""Coding help in all five lessons: blank card, dictionary drawer, word tooltips, paid hints."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
OUT = os.environ.get('OUT', '/tmp/help-shots/'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

async def lesson(pg, n):
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(f'file://{ROOT}/lesson{n}/index.html'); await pg.wait_for_timeout(300)
    await pg.evaluate('''() => { S = newState({name:'測試', cls:'2A', no:'1'});
      if (HW.autoWire) HW.autoWire('main'); S.hw.done = true; S.unlocked = 2; S.stage = 'code'; save(); startApp(); }''')
    await pg.wait_for_timeout(400)
    first = await pg.evaluate('() => BLANKS[0].id')
    second = await pg.evaluate('() => BLANKS[1].id')
    await pg.click('#blank-' + first); await pg.wait_for_timeout(150)
    card = await pg.inner_text('.bcard')
    ok('要填' in card and '提示' in card, f'L{n}: card under blank {first} says what to fill')
    # dictionary drawer from the side bar
    ok(await pg.is_visible('#sideDict'), f'L{n}: 字典 button in IDE side bar')
    await pg.click('#sideDict'); await pg.wait_for_timeout(150)
    drawer = await pg.inner_text('#ideDict')
    ok('今堂用到的指令' in drawer, f'L{n}: drawer lists this lesson\'s commands')
    ok(('以前學過' in drawer) == (n > 1), f'L{n}: "以前學過" section only from lesson 2')
    await pg.click('[data-dk-close]'); await pg.wait_for_timeout(100)
    ok(not await pg.is_visible('#ideDict'), f'L{n}: drawer closes')
    # tooltip on a dictionary word
    k = await pg.evaluate("() => { const e = document.querySelector('#editor [data-k]'); return e && e.dataset.k; }")
    if k:
        await pg.hover(f'#editor [data-k="{k}"]'); await pg.wait_for_timeout(150)
        ok(await pg.is_visible('.dk-tipbox'), f'L{n}: tooltip on "{k}"')
    else: ok(False, f'L{n}: no dictionary words in code')
    # wrong twice -> hint button pulses, no free hint
    await pg.click('#blank-' + second)
    for v in ['zzz', 'zzzz']:
        await pg.fill('#blank-' + second, v); await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
    panel = await pg.inner_text('#codePanel')
    ok('💡 提示：' not in panel, f'L{n}: no free hint after 2 wrong answers')
    ok(await pg.evaluate(f"() => !!document.querySelector('.blist [data-hint=\"{second}\"].pulse')"), f'L{n}: hint button pulses after 2 wrong')
    before = await pg.evaluate("() => { S.code.done = true; const r = scores().code; S.code.done = false; return r; }")
    await pg.click(f'.blist [data-hint="{second}"]'); await pg.wait_for_timeout(200)
    await pg.click('.modal .actions .btn.primary'); await pg.wait_for_timeout(300)
    after = await pg.evaluate("() => { S.code.done = true; const r = scores().code; S.code.done = false; return r; }")
    hinted = await pg.evaluate(f"() => S.code.blanks['{second}'].hinted")
    ok(hinted, f'L{n}: hint used')
    ok(after < before, f'L{n}: hint costs points ({before} -> {after})')
    ok('💡 提示：' in await pg.inner_text('.bcard'), f'L{n}: card shows the hint text')
    ok('使用提示 1 格' in await pg.inner_text('#codePanel'), f'L{n}: stats line counts hints')
    lk = await pg.query_selector('.bcard [data-dk]')
    if lk:
        await lk.click(); await pg.wait_for_timeout(300)
        ok(await pg.is_visible('#ideDict .dk-item.flash'), f'L{n}: 看字典 flashes an entry')
    await pg.screenshot(path=f'{OUT}L{n}.png')
    # report shows the hint column
    await pg.evaluate('''() => { BLANKS.forEach(b => { const x = S.code.blanks[b.id]; x.val = b.ans; x.status = 'ok'; });
      S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true});
      S.real.confirmed = true; S.unlocked = 5; S.stage = 'report'; save(); startApp(); }''')
    await pg.wait_for_timeout(500)
    rep = await pg.inner_text('body')
    ok('使用提示 −1' in rep, f'L{n}: report explains hint cost')
    ok(not errs, f'L{n}: no page errors {errs}')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for n in range(1, 6):
            pg = await b.new_page(viewport={'width': 1366, 'height': 768})
            await lesson(pg, n); await pg.close()
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
