"""Lesson 5 extension challenges: admin button (wiring + ||) and slow gate (for loops, code only)."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
URL = 'file://' + ROOT + '/lesson5/index.html'
OUT = os.environ.get('OUT', '/tmp/l5-ext/'); os.makedirs(OUT, exist_ok=True)
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
        ok('程式 8 分' in await pg.inner_text('#st-ext'), 'hub: challenge 2 is code-only (8 + 2)')

        # ---- challenge 1: admin button ----
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
        await drag((BIN(0), 568), H('f24', 20, 20))
        ok('方向' in await check(1), 'c1 step 1: button lying the wrong way')
        cx, cy = await c(*H('f24', 20, 20)); await pg.mouse.click(cx, cy); await pg.wait_for_timeout(100)
        await pg.click('#stRot'); await pg.wait_for_timeout(100)
        ok('正確' in await check(1), 'c1 step 1 rotated')
        await wire('j24', 'tp24', 3); await wire('P:D2', 'j26', 4)
        ok('正確' in await check(2), 'c1 step 2')
        await drag((BIN(1), 574), H('h26', 40)); await wire('j30', 'tn30', 1)
        ok('正確' in await check(3), 'c1 step 3 pull-down')
        await check(4)
        await pg.screenshot(path=OUT + 'x1-button.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        for k, v in {'e1': '2', 'e2': 'INPUT', 'e3': '&&', 'e4': 'digitalRead', 'e5': 'LOW'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#codePanel')
        ok('而且' in t and '放開' in t, 'c1 feedback: && vs ||, LOW')
        await pg.fill('#blank-e3', '||'); await pg.fill('#blank-e5', 'HIGH')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        await pg.click('.modal .np-admin'); await pg.wait_for_timeout(900)
        ang = int(await pg.inner_text('.np-ang'))
        ok(ang >= 85, f'admin button opens the gate without a car ({ang}°)')
        await pg.screenshot(path=OUT + 'x2-admin.png')
        sc = await pg.evaluate('()=>extScores().c1')
        ok(sc and sc['total'] == 7, f'c1 score {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)

        # ---- challenge 2: slow gate ----
        await pg.click('[data-go="c2code"]'); await pg.wait_for_timeout(300)
        for k, v in {'e1': '0', 'e2': '90', 'e3': 'angle', 'e4': '20', 'e5': '-'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2000)
        ok("expected primary-expression before ')' token" in await pg.inner_text('#ideOut'), 'c2 compile: angle- is an error')
        await pg.fill('#blank-e5', '++'); await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        ok('減 1' in await pg.inner_text('#codePanel'), 'c2 feedback: ++ counts up')
        await pg.fill('#blank-e5', '--')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        await pg.click('.modal .np-drive'); await pg.wait_for_timeout(1800)
        a1 = int(await pg.inner_text('.np-ang')); await pg.wait_for_timeout(700)
        a2 = int(await pg.inner_text('.np-ang'))
        ok(10 < a1 < 85 and a2 > a1, f'gate rises slowly ({a1}° then {a2}°)')
        await pg.screenshot(path=OUT + 'x3-slow.png')
        sc = await pg.evaluate('()=>extScores().c2')
        ok(sc and sc['total'] == 9 and sc['code'] == 7, f'c2 score {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x4-hub.png', full_page=True)
        await pg.click('#extReport'); await pg.wait_for_timeout(400)
        rep = await pg.inner_text('.rep')
        ok('管理員按鈕' in rep and '慢慢開閘' in rep and '7 / 10' in rep and '9 / 10' in rep, 'report lists both challenges')
        errs = [e for e in errs if 'ERR_TUNNEL' not in e]
        ok(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
