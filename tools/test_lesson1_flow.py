"""End-to-end test of lesson 1 (Arduino 初體驗): labels, breadboard quiz, USB, fill-in, first upload, real page, report, verifier."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
URL = 'file://' + ROOT + '/lesson1/index.html'
OUT = os.environ.get('OUT', '/tmp/l1-test/'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(400)
        await pg.fill('#inName', '陳小明'); await pg.fill('#inCls', '2A'); await pg.fill('#inNo', '5')
        await pg.click('#loginBtn'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT + '01-intro.png', full_page=True)
        await pg.click('#introNext'); await pg.wait_for_timeout(300)

        async def c(x, y): return await pg.evaluate('''([x,y])=>{const s=document.querySelector('#hwSvg');const pt=s.createSVGPoint();pt.x=x;pt.y=y;const r=pt.matrixTransform(s.getScreenCTM());return [r.x,r.y]}''', [x, y])
        async def drag(a, bb):
            ax, ay = await c(*a); bx, by = await c(*bb)
            await pg.mouse.move(ax, ay); await pg.mouse.down()
            for i in range(1, 8): await pg.mouse.move(ax + (bx - ax) * i / 7, ay + (by - ay) * i / 7)
            await pg.mouse.up(); await pg.wait_for_timeout(120)
        async def click_svg(x, y):
            sx, sy = await c(x, y); await pg.mouse.click(sx, sy); await pg.wait_for_timeout(80)
        G = await pg.evaluate('''()=>({slots:HW.LABELS.map((_,i)=>HW.SLOT(i)), pool:HW.POOL_ORDER.map((_,j)=>HW.POOLPOS(j)), order:HW.POOL_ORDER, keys:HW.LABELS.map(l=>l.key),
            holes:Object.fromEntries(Object.entries(HW.HOLES).map(([k,v])=>[k,[v.x,v.y]])), plug:HW.PLUG0, port:HW.PORT, jack:HW.JACK})''')
        slotc = lambda i: (G['slots'][i]['x'] + G['slots'][i]['w'] / 2, G['slots'][i]['y'] + G['slots'][i]['h'] / 2)
        def poolc(key):
            j = G['order'].index(key); q = G['pool'][j]; return (q['x'] + 69, q['y'] + 6 + 21)

        # ---- 1. labels: swap GND and 13 on purpose ----
        keys = G['keys']; want = list(keys); want[3], want[4] = want[4], want[3]
        for i, k in enumerate(want): await drag(poolc(k), slotc(i))
        n = await pg.evaluate('()=>Object.keys(S.hw.labels).length')
        check(n == 8, f'all 8 labels placed by dragging ({n})')
        await pg.click('[data-check="0"]'); await pg.wait_for_timeout(200)
        txt = await pg.inner_text('#hwIssues')
        check('2' in txt and '放錯' in txt, 'wrong labels reported: ' + txt.replace('\n', ' ')[:90])
        await pg.screenshot(path=OUT + '02-labels-wrong.png')
        await pg.click('[data-check="0"]'); await pg.wait_for_timeout(150)
        check(await pg.evaluate('()=>S.hw.errors') == 1, 'same layout checked twice counts once')
        await drag(slotc(3), slotc(4))            # swap the two labels back
        await pg.click('[data-check="0"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate('()=>S.hw.step') == 1, 'labels correct -> breadboard quiz')

        # ---- 2. breadboard quiz ----
        H = G['holes']
        for h in ['a7', 'b7', 'd7', 'e7', 'f7']: await click_svg(*H[h])
        await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        txt = await pg.inner_text('#hwIssues')
        check('坑' in txt, 'across-the-trench mistake explained: ' + txt.replace('\n', ' ')[:70])
        await pg.screenshot(path=OUT + '03-quiz-wrong.png')
        await click_svg(*H['f7']); await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        for h in ['f20', 'g20', 'i20']: await click_svg(*H[h])
        await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        e_before = await pg.evaluate('()=>S.hw.errors')
        check('還有 1 個' in await pg.inner_text('#hwIssues') and e_before == 2, 'incomplete answer: hint only, no error')
        await pg.click('[data-hint="1"]'); await pg.wait_for_timeout(150); await pg.click('.modal .actions .btn.primary'); await pg.wait_for_timeout(200)
        await click_svg(*H['j20']); await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        await click_svg(*H['tp5']); await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        check('「+」' in await pg.inner_text('#hwIssues'), 'plus-rail mistake explained')
        await click_svg(*H['tp5'])
        for h in ['tn5', 'tn10', 'tn22']: await click_svg(*H[h])
        await pg.click('[data-check="1"]'); await pg.wait_for_timeout(200)
        check(await pg.evaluate('()=>S.hw.step') == 2, 'quiz done -> USB step')
        await pg.wait_for_timeout(800)
        check(await pg.is_visible('.pq-svg'), 'practice quiz (pins vs holes) opens after the breadboard quiz')
        await pg.click('[data-pq="f12"]'); await pg.wait_for_timeout(100)
        check('麵包板的孔' in await pg.inner_text('#pqFb'), 'practice: clicking column 12 for D12 explains the difference')
        for t in ['P:D12', 'f13', 'P:D9', 'j7']: await pg.click(f'[data-pq="{t}"]'); await pg.wait_for_timeout(80)
        check(await pg.evaluate('()=>S.hw.pinQuiz.done') is True, 'practice quiz done (not scored)')
        await pg.screenshot(path=OUT + '03b-pinquiz.png')
        await pg.click('.modal .actions .btn'); await pg.wait_for_timeout(200)

        # ---- 3. USB ----
        pl = (G['plug']['x'], G['plug']['y'])
        await drag(pl, (G['jack']['x'] + 30, G['jack']['y'] + 30))
        check('電源插口' in await pg.inner_text('#hwIssues'), 'plug into the power jack is an error')
        await drag(pl, (G['port']['x'] + 20, G['port']['y'] + 30))
        st = await pg.evaluate('()=>({d:S.hw.done,e:S.hw.errors,h:S.hw.hints,usb:S.up.usb,sc:scores().hw})')
        check(st['d'] and st['usb'] and st['e'] == 4 and st['h'] == 1 and st['sc'] == 22, f'hardware done {st}')
        await pg.screenshot(path=OUT + '04-hw-done.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(400)

        # ---- code ----
        vals = {'b1': 'output', 'b2': 'digitalWrite', 'b3': 'HIGH', 'b4': '1', 'b5': 'LOW', 'b6': '1000'}
        for k, v in vals.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(250)
        fb = await pg.inner_text('#codePanel')
        check('大小寫' in fb and '毫秒' in fb, 'feedback for case and seconds')
        await pg.screenshot(path=OUT + '05-code-wrong.png')
        await pg.fill('#blank-b1', 'OUTPUT'); await pg.fill('#blank-b4', '1000')
        await pg.click('#btnCheck'); await pg.wait_for_timeout(250)
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(200)
        check(await pg.evaluate('()=>S.code.done && scores().code') == 37, 'code done, 2 wrong answers -> 28/30 -> 37/40')
        # first upload mistake is free
        await pg.click('#btnUpload'); await pg.wait_for_timeout(1500)
        u = await pg.evaluate('()=>({e:S.up.errors, log:S.up.log.map(l=>l.msg)})')
        check(u['e'] == 0 and '不扣分' in ' '.join(u['log']), f'first upload mistake not counted {u}')
        check('不扣分' in await pg.inner_text('#codeExplain'), 'explanation says no deduction')
        await pg.click('[data-menu="tools"]'); await pg.hover('.menu .mi:has-text("Board")'); await pg.wait_for_timeout(80)
        await pg.hover('.menu .mi:has-text("Arduino AVR Boards")'); await pg.wait_for_timeout(80)
        await pg.click('.menu .mi span:text-is("Arduino Nano")'); await pg.wait_for_timeout(80)
        await pg.click('[data-menu="tools"]'); await pg.hover('.menu .mi:has-text("Port")'); await pg.wait_for_timeout(80)
        await pg.click('.menu .mi:has-text("(Arduino Uno)")'); await pg.wait_for_timeout(80)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(2700)
        check(await pg.evaluate('()=>S.up.errors') == 1, 'second mistake (wrong board) counted')
        await pg.click('#boardSelBtn'); await pg.click('.menu .mi:has-text("Arduino Uno")'); await pg.wait_for_timeout(100)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4800)
        await pg.screenshot(path=OUT + '06-result.png')
        await pg.fill('#spd', '200'); await pg.dispatch_event('#spd', 'input'); await pg.wait_for_timeout(250)
        check('delay(200);' in await pg.inner_text('#spdCode'), 'speed slider updates the delay shown')
        s = await pg.evaluate('()=>scores()')
        check(s['complete'] and s['up'] == 17 and s['total'] == 22 + 37 + 17, f'scores {s}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(400)

        # ---- real page ----
        await pg.screenshot(path=OUT + '07-real.png', full_page=True)
        for i in range(3): await pg.check(f'#rc{i}')
        await pg.click('#realConfirmBtn'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        check(await pg.evaluate('()=>S.real.confirmed'), 'teacher confirmed real UNO')
        await pg.click('#toExt'); await pg.wait_for_timeout(300)
        await pg.click('#extReport'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT + '08-report.png', full_page=True)
        async with pg.expect_download() as dl:
            await pg.click('#dlReport')
        d = await dl.value; path = OUT + 'report.html'; await d.save_as(path)
        check(d.suggested_filename.startswith('Arduino初體驗_2A_5_'), 'report file name ' + d.suggested_filename)
        rp = await ctx.new_page(); rp.on('pageerror', lambda e: errs.append('REPORTERR ' + str(e)))
        await rp.goto('file://' + path); await rp.wait_for_timeout(300)
        rt = await rp.inner_text('#r')
        check('驗證碼有效' in rt and '認識硬件（22 / 40）' in rt, 'report file verifies')
        txt = open(path, encoding='utf-8').read()
        open(OUT + 'tampered.html', 'w', encoding='utf-8').write(txt.replace('\\"total\\":', '\\"total\\":1', 1))
        await rp.goto('file://' + OUT + 'tampered.html'); await rp.wait_for_timeout(300)
        check('驗證失敗' in await rp.inner_text('.rver'), 'tampered report fails')
        # a lesson-2 report must be rejected
        await pg.click('#teacherBtn'); await pg.fill('#pwIn', 'dt2026'); await pg.click('.modal .btn.primary'); await pg.wait_for_timeout(200)
        await pg.click('#tpVerify'); await pg.wait_for_timeout(200)
        files = [path, OUT + 'tampered.html']
        l2 = '/tmp/sos-test/report.html'
        if os.path.exists(l2): files.append(l2)
        await pg.set_input_files('#vFile', files); await pg.wait_for_timeout(500)
        vt = await pg.inner_text('#vTbl'); print(vt)
        check('有效' in vt and '無效' in vt, 'verifier shows valid and invalid')
        async with pg.expect_download() as dl2:
            await pg.click('#vCsv')
        d2 = await dl2.value; await d2.save_as(OUT + 'out.csv')
        csv = open(OUT + 'out.csv', encoding='utf-8-sig').read(); print(csv)
        check('認識硬件(40)' in csv and '延伸2修好程式(10)' in csv, 'CSV headers')
        errs = [e for e in errs if 'ERR_TUNNEL' not in e]
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
