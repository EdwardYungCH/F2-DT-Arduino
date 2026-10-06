"""Lesson 4 extension challenges: potentiometer sensitivity knob (wiring + code) and darker-is-brighter (code only)."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
URL = 'file://' + ROOT + '/lesson4/index.html'
OUT = os.environ.get('OUT', '/tmp/l4-ext/'); os.makedirs(OUT, exist_ok=True)
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
          S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true, baud:9600, monitorOk:true});
          S.real.confirmed = true; S.unlocked = 4; S.stage = 'ext'; save(); startApp(); }''')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x1-hub.png', full_page=True)
        ok('程式 8 分' in await pg.inner_text('#st-ext'), 'hub: challenge 2 is code-only (8 + 2)')

        # ---- challenge 1: potentiometer ----
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
        await drag((BIN(0), 566), H('f20', 20, 18))
        ok(await pg.evaluate("()=>S.ext.c1.hw.parts.length===1 && S.ext.c1.hw.parts[0].h1==='f20'"), 'pot dropped across the channel at f20')
        ok('正確' in await check(1), 'c1 step 1')
        await wire('j20', 'tp20', 3); await wire('j22', 'tn22', 1)
        ok('正確' in await check(2), 'c1 step 2 outer legs to rails')
        await wire('P:A2', 'a21', 2)
        ok('A1' in await check(3), 'c1 step 3: A2 is wrong')
        await drag(H('P:A2'), TRASH)
        await wire('P:A1', 'a21', 2)
        ok('正確' in await check(3), 'c1 step 3 A1')
        await check(4)
        await pg.screenshot(path=OUT + 'x2-pot-wired.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        for k, v in {'e1': 'analogRead', 'e2': 'A0', 'e3': 'println', 'e4': 'println', 'e5': 'threshold'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#codePanel')
        ok('A0 是光感應器' in t and '不換行' in t, 'c1 feedback: A0 taken, print vs println')
        await pg.fill('#blank-e2', 'A1'); await pg.fill('#blank-e3', 'print')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        ok(await pg.is_visible('.np-knob'), 'c1 result has a knob slider')
        lit = lambda: pg.evaluate("()=>+document.querySelector('.modal [data-led=\"yellow\"] .ledglow').getAttribute('opacity')")
        await pg.fill('.np-knob', '20'); await pg.wait_for_timeout(500)
        ok(await lit() == 1, 'low knob threshold: LED on in classroom light')
        await pg.fill('.np-knob', '90'); await pg.wait_for_timeout(700)
        ok(await lit() == 0, 'high knob threshold: LED off')
        last = (await pg.inner_text('.smon-out')).strip().splitlines()[-1]
        ok(len(last.split(' ')) == 2 and last.split(' ')[1] == '921', f'monitor prints "val threshold" ({last})')
        await pg.screenshot(path=OUT + 'x3-knob.png')
        sc = await pg.evaluate('()=>extScores().c1')
        ok(sc and sc['total'] == 7, f'c1 score {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)

        # ---- challenge 2: darker is brighter ----
        await pg.click('[data-go="c2code"]'); await pg.wait_for_timeout(300)
        for k, v in {'e1': 'Map', 'e2': '1024', 'e3': '255', 'e4': 'digitalWrite', 'e5': 'level'}.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2000)
        ok("'Map' was not declared" in await pg.inner_text('#ideOut'), 'c2 compile: Map undeclared')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        t = await pg.inner_text('#codePanel')
        ok('1023' in t and '亮度' in t and '大小寫' in t, 'c2 feedback: case, 1024 vs 1023, digitalWrite cannot dim')
        await pg.fill('#blank-e1', 'map'); await pg.fill('#blank-e2', '1023'); await pg.fill('#blank-e4', 'analogWrite')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200); await pg.click('.modal .actions .btn.go')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4500)
        ok(not await pg.is_visible('.smon'), 'c2 result has no serial monitor')
        await pg.click('.modal [data-dk="100"]'); await pg.wait_for_timeout(500)
        hi = await lit()
        await pg.click('.modal [data-dk="0"]'); await pg.wait_for_timeout(500)
        lo = await lit()
        ok(hi > 0.9 and lo < 0.2, f'brightness follows darkness (dark {hi:.2f}, torch {lo:.2f})')
        await pg.screenshot(path=OUT + 'x4-dimmer.png')
        sc = await pg.evaluate('()=>extScores().c2')
        ok(sc and sc['total'] == 7 and sc['code'] == 5, f'c2 score {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x5-hub-done.png', full_page=True)
        await pg.click('#extReport'); await pg.wait_for_timeout(400)
        rep = await pg.inner_text('.rep')
        ok('調校靈敏度' in rep and '越暗越亮' in rep and '7 / 10' in rep and '7 / 10' in rep and '程式 5/8' in rep, 'report lists both challenges')
        errs = [e for e in errs if 'ERR_TUNNEL' not in e]
        ok(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
