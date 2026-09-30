"""End-to-end test of lesson 3 extension challenges (crossing beeps, bike alarm), with deliberate mistakes."""
import asyncio, os
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson3/index.html')
OUT = os.environ.get('OUT', '/tmp/l3-ext/'); os.makedirs(OUT, exist_ok=True)
BIN = lambda i: 84 + i * 112
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.evaluate('''() => { S = newState({name:'何家明', cls:'2D', no:'18'});
          HW.autoWire('main'); S.teacherUsed = false; S.hw.done = true; S.hw.step = 8;
          BLANKS.forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false});
          S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true});
          S.real.confirmed = true; S.unlocked = 4; S.stage = 'ext'; save(); startApp(); }''')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x1-hub.png', full_page=True)
        async def c(x, y): return await pg.evaluate('''([x,y])=>{const s=document.querySelector('#hwSvg');const pt=s.createSVGPoint();pt.x=x;pt.y=y;const r=pt.matrixTransform(s.getScreenCTM());return [r.x,r.y]}''', [x, y])
        async def drag(a, bb):
            ax, ay = await c(*a); bx, by = await c(*bb)
            await pg.mouse.move(ax, ay); await pg.mouse.down()
            for i in range(1, 8): await pg.mouse.move(ax + (bx - ax) * i / 7, ay + (by - ay) * i / 7)
            await pg.mouse.up(); await pg.wait_for_timeout(120)
        P = await pg.evaluate('()=>{const o={};for(const k in HW.P) o[k]=[HW.P[k].x,HW.P[k].y];return o}')
        H = lambda k, dx=0, dy=0: (P[k][0] + dx, P[k][1] + dy)
        async def check(n, label=''):
            await pg.click(f'[data-check="{n}"]'); await pg.wait_for_timeout(150)
            t = (await pg.inner_text('#hwIssues')).replace('\n', ' '); print(f'  step {n} {label}:', t[:140]); return t
        # ---- challenge 1: piezo
        await pg.click('[data-go="c1hw"]'); await pg.wait_for_timeout(300)
        await drag((BIN(0), 575), H('d11', 30, -29)); await check(1)
        await drag(H('P:D9'), H('a11')); await check(2, 'D9')
        await drag(H('P:D9'), H('P:D8')); await check(2)
        await drag(H('P:GND2'), H('a14')); await check(3); await check(4)
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        for k, v in {'e1': '8', 'e2': '5', 'e3': 'tone', 'e4': 'notone', 'e5': '400'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        print('c1 check:', (await pg.inner_text('#codePanel .blist')).replace('\n', ' | ')[:400])
        await pg.fill('#blank-e2', '10'); await pg.fill('#blank-e4', 'noTone')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4300)
        await pg.click('#c1Press'); await pg.wait_for_timeout(2400)
        await pg.screenshot(path=OUT + 'x2-c1-result.png')
        print('c1 phase:', await pg.inner_text('#c1Phase'))
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        # ---- challenge 2: tilt switch
        await pg.click('[data-go="c2hw"]'); await pg.wait_for_timeout(300)
        await drag((BIN(0), 575), H('d3', 20, -25)); await check(1)
        await drag(H('i19'), H('a3')); await drag(H('P:D3'), H('a5')); await check(2)
        await check(3, 'no pull-down')
        await pg.screenshot(path=OUT + 'x3-c2-float.png')
        await drag((BIN(2), 574), H('c5', 40)); await drag(H('P:GND2'), H('a9')); await check(3, '220 by mistake')
        await drag(H('c5', 40), (991, 560)); await drag((BIN(1), 574), H('c5', 40)); await check(3); await check(4)
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        for k, v in {'e1': '3', 'e2': 'INPUT', 'e3': 'digitalRead', 'e4': 'HIGH', 'e5': '20', 'e6': 'LOW'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        print('c2 check:', (await pg.inner_text('#codeExplain')).replace('\n', ' '), '|', (await pg.inner_text('#codePanel .blist li:nth-child(4)')).replace('\n', ' '))
        await pg.fill('#blank-e4', 'LOW'); await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4300)
        await pg.click('#c2Shake'); await pg.wait_for_timeout(450)
        await pg.screenshot(path=OUT + 'x4-c2-result.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        print('scores:', await pg.evaluate('()=>extScores()'))
        for k in ['c1', 'c2']:
            await pg.click(f'[data-confirm="{k}"]'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT + 'x5-hub-done.png', full_page=True)
        await pg.click('#extReport'); await pg.wait_for_timeout(500)
        async with pg.expect_download() as dl: await pg.click('#dlReport')
        d = await dl.value; path = OUT + 'report.html'; await d.save_as(path)
        rp = await ctx.new_page(); await rp.goto('file://' + path); await rp.wait_for_timeout(300)
        print('report verify:', (await rp.inner_text('.rver')).replace('\n', ' '))
        print('report ext:', (await rp.inner_text('.rep'))[-420:])
        await pg.click('#teacherBtn'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        await pg.click('#tpVerify'); await pg.set_input_files('#vFile', [path]); await pg.wait_for_timeout(400)
        print('verifier:', await pg.inner_text('#vTbl'))
        print('ERRORS:', errs)
        await b.close()
asyncio.run(main())
