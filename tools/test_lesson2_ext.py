"""End-to-end test of the extension challenges (Piezo + initials), with deliberate mistakes."""
import asyncio, os
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson2/index.html')
OUT = os.environ.get('OUT', '/tmp/sos-test-ext/'); os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        # main lesson already finished
        await pg.evaluate('''() => { S = newState({name:'李小明', cls:'2B', no:'7'});
          HW.autoWire('main'); S.teacherUsed = false; S.hw.done = true; S.hw.step = 5;
          BLANKS.forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false});
          S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true});
          S.real.confirmed = true; S.unlocked = 4; S.stage = 'ext'; save(); startApp(); }''')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'e1-hub.png', full_page=True)

        async def c(x, y):
            return await pg.evaluate('''([x,y])=>{const s=document.querySelector('#hwSvg');const pt=s.createSVGPoint();pt.x=x;pt.y=y;const r=pt.matrixTransform(s.getScreenCTM());return [r.x,r.y]}''', [x, y])
        async def drag(a, bb):
            ax, ay = await c(*a); bx, by = await c(*bb)
            await pg.mouse.move(ax, ay); await pg.mouse.down()
            for i in range(1, 8): await pg.mouse.move(ax + (bx - ax) * i / 7, ay + (by - ay) * i / 7)
            await pg.mouse.up(); await pg.wait_for_timeout(150)
        P = await pg.evaluate('()=>{const o={};for(const k of ["e18","a18","a21","P:D12","P:D8","P:GND2"]) o[k]=[HW.P[k].x,HW.P[k].y];return o}')

        # ---- challenge 1: hardware
        await pg.click('[data-go="c1hw"]'); await pg.wait_for_timeout(300)
        await drag((105, 572), (P['e18'][0] + 30, P['e18'][1] - 34))
        await pg.click('[data-check="1"]'); await pg.wait_for_timeout(150)
        print('c1 step1:', await pg.inner_text('#hwIssues'))
        await drag(tuple(P['P:D12']), tuple(P['a18']))          # wrong pin
        await pg.click('[data-check="2"]'); await pg.wait_for_timeout(150)
        print('c1 wrong pin:', await pg.inner_text('#hwIssues'))
        await pg.screenshot(path=OUT + 'e2-c1-hw-error.png')
        await drag(tuple(P['P:D12']), tuple(P['P:D8']))        # move the wire end to D8
        await pg.click('[data-check="2"]'); await pg.wait_for_timeout(150)
        print('c1 step2:', await pg.inner_text('#hwIssues'))
        await pg.click('#swatches .sw:nth-child(4)')
        await drag(tuple(P['P:GND2']), tuple(P['a21']))
        await pg.click('[data-check="3"]'); await pg.wait_for_timeout(150)
        await pg.click('[data-check="4"]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'e3-c1-hw-done.png')
        print('c1 hw:', await pg.evaluate('()=>({e:S.ext.c1.hw.errors,done:S.ext.c1.hw.done})'))
        await pg.click('.modal .btn.go'); await pg.wait_for_timeout(300)

        # ---- challenge 1: code
        for k, v in {'e1': '13', 'e2': '1000', 'e3': 'OUTPUT', 'e4': 'Tone', 'e5': 'noTone', 'e6': 'buzzerPin'}.items():
            await pg.fill('#blank-' + k, v)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(1700)
        print('c1 compile:', (await pg.inner_text('#ideOut'))[:400])
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        print('c1 check:', await pg.inner_text('#codeExplain'))
        await pg.screenshot(path=OUT + 'e4-c1-code-err.png')
        await pg.fill('#blank-e1', '8'); await pg.fill('#blank-e4', 'tone')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        await pg.click('.modal .btn.go'); await pg.wait_for_timeout(150)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3300)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4200)
        await pg.screenshot(path=OUT + 'e5-c1-result.png')
        await pg.click('.modal .btn.go'); await pg.wait_for_timeout(300)
        print('c1 score:', await pg.evaluate('()=>extScores().c1'))

        # ---- challenge 2
        await pg.click('[data-go="c2code"]'); await pg.wait_for_timeout(300)
        await pg.fill('#c2Init', 'ctm'); await pg.click('#c2Set'); await pg.wait_for_timeout(150)
        await pg.fill('#regionTa', 'dash();\ndot();\ndash();\ndot()\n')
        await pg.click('#btnVerify'); await pg.wait_for_timeout(1700)
        print('c2 compile:', (await pg.inner_text('#ideOut'))[:300])
        await pg.click('#btnCheck'); await pg.wait_for_timeout(150)
        print('c2 check1:', await pg.inner_text('#codeExplain'))
        await pg.fill('#regionTa', 'dash();\ndot();\ndash();\ndot();\ndash();\ndash();\ndash();\n')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(150)
        print('c2 check2:', await pg.inner_text('#codeExplain'))
        await pg.fill('#regionTa', '// C\ndash();\ndot();\ndash();\ndot();\nletterGap();\n// T\ndash();\nletterGap();\n// M\ndash();\ndot();\n')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(150)
        print('c2 check3:', await pg.inner_text('#codeExplain'))
        await pg.screenshot(path=OUT + 'e6-c2-err.png')
        await pg.fill('#regionTa', '// C\ndash();\ndot();\ndash();\ndot();\nletterGap();\n// T\ndash();\nletterGap();\n// M\ndash();\ndash();\n')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        await pg.click('.modal .btn.go'); await pg.wait_for_timeout(150)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4200)
        await pg.screenshot(path=OUT + 'e7-c2-result.png')
        await pg.click('.modal .btn.go'); await pg.wait_for_timeout(300)
        print('c2 score:', await pg.evaluate('()=>extScores().c2'))

        # ---- teacher confirms both, report
        for k in ['c1', 'c2']:
            await pg.click(f'[data-confirm="{k}"]'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT + 'e8-hub-done.png', full_page=True)
        await pg.click('#extReport'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT + 'e9-report.png', full_page=True)
        async with pg.expect_download() as dl:
            await pg.click('#dlReport')
        d = await dl.value; path = OUT + 'report.html'; await d.save_as(path)
        rp = await ctx.new_page(); await rp.goto('file://' + path); await rp.wait_for_timeout(300)
        print('report verify:', (await rp.inner_text('.rver')).replace('\n', ' '))
        print('report ext:', (await rp.inner_text('.rep'))[-500:])
        await pg.click('#teacherBtn'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        await pg.click('#tpVerify'); await pg.wait_for_timeout(200)
        await pg.set_input_files('#vFile', [path]); await pg.wait_for_timeout(400)
        print('verifier:', await pg.inner_text('#vTbl'))
        async with pg.expect_download() as dl2:
            await pg.click('#vCsv')
        d2 = await dl2.value; await d2.save_as(OUT + 'out.csv')
        print(open(OUT + 'out.csv', encoding='utf-8-sig').read())
        print('ERRORS:', errs)
        await b.close()
asyncio.run(main())
