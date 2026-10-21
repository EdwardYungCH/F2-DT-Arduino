"""Lesson 6 extension challenges: potentiometer colour knob (wiring + code) and rainbow fade (code only)."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
URL = 'file://' + ROOT + '/lesson6/index.html'
OUT = os.environ.get('OUT', '/tmp/l6-ext/'); os.makedirs(OUT, exist_ok=True)
BIN = lambda i: 84 + i * 112
TRASH = (1050, 560)
FAIL = []
def ok(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.evaluate('''() => { S = newState({name:'何家明', cls:'2D', no:'18'});
          HW.autoWire(); S.hw.done = true; S.teacherUsed = false;
          BLANKS.forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false});
          S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true});
          S.real.confirmed = true; S.unlocked = 4; S.stage = 'ext'; save(); startApp(); }''')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x1-hub.png', full_page=True)
        hub = await pg.inner_text('#st-ext')
        ok('電位器調色' in hub and '彩虹漸變' in hub and '程式 8 分' in hub, 'hub: two challenges, challenge 2 is code-only')

        # ---- challenge 1: potentiometer colour knob ----
        await pg.click('[data-go="c1hw"]'); await pg.wait_for_timeout(300)
        async def c(x, y): return await pg.evaluate('''([x,y])=>{const s=document.querySelector('#hwSvg');const pt=s.createSVGPoint();pt.x=x;pt.y=y;const r=pt.matrixTransform(s.getScreenCTM());return [r.x,r.y]}''', [x, y])
        async def drag(a, bb):
            ax, ay = await c(*a); bx, by = await c(*bb)
            await pg.mouse.move(ax, ay); await pg.mouse.down()
            for i in range(1, 8): await pg.mouse.move(ax + (bx - ax) * i / 7, ay + (by - ay) * i / 7)
            await pg.mouse.up(); await pg.wait_for_timeout(120)
        P = await pg.evaluate('()=>{const o={};for(const k in HW.P) o[k]=[HW.P[k].x,HW.P[k].y];return o}')
        H = lambda k, dx=0, dy=0: (P[k][0] + dx, P[k][1] + dy)
        async def check(n):
            await pg.click(f'[data-check="{n}"]'); await pg.wait_for_timeout(150)
            t = (await pg.inner_text('#hwIssues')).replace('\n', ' '); print(f'   c1 step {n}:', t[:120]); return t
        async def wire(a, bb, color=None):
            if color is not None: await pg.click(f'#swatches .sw:nth-child({color})')
            await drag(H(a), H(bb))
        await drag((BIN(0), 566), H('f24', 20, 18))
        ok(await pg.evaluate("()=>S.ext.c1.hw.parts.length===1 && S.ext.c1.hw.parts[0].h1==='f24'"), 'pot dropped across the channel at f24')
        ok('正確' in await check(1), 'c1 step 1')
        t = await check(2)
        ok('5V' in t and '已記錄' not in t, 'c1 step 2 reminds 5V (hint only)')
        await wire('P:5V', 'tp8', 3)
        ok('正確' in await check(2), 'c1 step 2 5V to + rail')
        await wire('j24', 'tp24', 3); await wire('j26', 'tn26', 1)
        ok('正確' in await check(3), 'c1 step 3 outer legs to rails')
        await wire('P:A1', 'a25', 4)
        ok('A0' in await check(4), 'c1 step 4: A1 is wrong')
        await drag(H('P:A1'), TRASH)
        await wire('P:A0', 'a25', 4)
        ok('正確' in await check(4), 'c1 step 4 A0')
        await check(5)
        await pg.screenshot(path=OUT + 'x2-pot-wired.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        for k, v in {'e1': 'analogRead', 'e2': 'A1', 'e3': '1023', 'e4': 'val', 'e5': 'level'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#codePanel')
        ok('A0' in t and '255' in t and '太大' in t, 'c1 feedback: A0, 255, val too big')
        await pg.fill('#blank-e2', 'A0'); await pg.fill('#blank-e3', '255'); await pg.fill('#blank-e4', 'level')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        ok(await pg.is_visible('.np-knob'), 'c1 result has a knob slider')
        await pg.fill('.np-knob', '100'); await pg.wait_for_timeout(300)
        t = await pg.inner_text('#rgbNow')
        ok('1023' in t and '藍色' in t, f'knob at the end: A0 1023, blue ({t[:80]})')
        await pg.fill('.np-knob', '0'); await pg.wait_for_timeout(300)
        ok('紅色' in await pg.inner_text('#rgbNow'), 'knob at the start: red')
        await pg.screenshot(path=OUT + 'x3-knob.png')
        sc = await pg.evaluate('()=>extScores().c1')
        ok(sc and sc['total'] == 6 and sc['code'] == 1, f'c1 score {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)

        # ---- challenge 2: rainbow fade ----
        await pg.click('[data-go="c2code"]'); await pg.wait_for_timeout(300)
        for k, v in {'e1': '+', 'e2': '255', 'e3': '200', 'e4': '>', 'e5': 'i'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2000)
        ok("expected ')' before '+'" in await pg.inner_text('#ideOut'), 'c2 compile: i+ is an error')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#codePanel')
        ok('兩個加號' in t and '一次也不會做' in t and '太慢' in t and '慢慢變' in t, 'c2 feedback: ++, > never runs, too slow, fixed 255')
        await pg.fill('#blank-e1', '++'); await pg.fill('#blank-e2', 'i'); await pg.fill('#blank-e3', '20'); await pg.fill('#blank-e4', '<=')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        ok('20 毫秒' in await pg.inner_text('.modal'), "c2 result uses the student's delay (20 ms)")
        a = await pg.inner_text('#rgbNow'); await pg.wait_for_timeout(800); bb = await pg.inner_text('#rgbNow')
        ok(a != bb and 'i =' in bb, f'colour keeps fading ({a[:30]} → {bb[:30]})')
        await pg.screenshot(path=OUT + 'x4-rainbow.png')
        sc = await pg.evaluate('()=>extScores().c2')
        ok(sc and sc['total'] == 6 and sc['code'] == 4, f'c2 score {sc}')
        ok('delay(20);' in await pg.evaluate('()=>EXT.c2Code()'), 'copied c2 program keeps delay(20)')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x5-hub-done.png', full_page=True)
        await pg.click('#extReport'); await pg.wait_for_timeout(400)
        rep = await pg.inner_text('.rep')
        ok('電位器調色' in rep and '彩虹漸變' in rep and rep.count('6 / 10') >= 2, 'report lists both challenges')
        errs = [e for e in errs if 'ERR_TUNNEL' not in e]
        ok(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
