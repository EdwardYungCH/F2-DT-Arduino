"""Lesson 1 extension challenges: heartbeat (fill-in) and fix-the-broken-program (compile errors + a logic error)."""
import asyncio, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
URL = 'file://' + ROOT + '/lesson1/index.html'
OUT = os.environ.get('OUT', '/tmp/l1-ext/'); os.makedirs(OUT, exist_ok=True)
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
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.evaluate('''() => { S = newState({name:'何家明', cls:'2D', no:'18'});
          HW.autoWire(); S.teacherUsed = false;
          BLANKS.forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false});
          S.code.done = true; Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true});
          S.real.confirmed = true; S.unlocked = 4; S.stage = 'ext'; save(); startApp(); }''')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x1-hub.png', full_page=True)

        # ---- challenge 1: heartbeat ----
        await pg.click('[data-go="c1code"]'); await pg.wait_for_timeout(300)
        vals = {'e1': '0.1', 'e2': 'LOW', 'e3': 'digitalWrite', 'e4': '100', 'e5': '800'}
        for k, v in vals.items(): await pg.fill('#blank-' + k, v)
        await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        check('毫秒' in await pg.inner_text('#codePanel'), 'c1: seconds vs milliseconds feedback')
        await pg.fill('#blank-e1', '100'); await pg.click('#btnCheck'); await pg.wait_for_timeout(200)
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(150)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(3000)
        await pg.click('#btnUpload'); await pg.wait_for_timeout(5000)
        await pg.screenshot(path=OUT + 'x2-heart.png')
        sc = await pg.evaluate('()=>extScores().c1')
        check(sc and sc['total'] == 9 and sc['code'] == 7, f'c1 done {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)

        # ---- challenge 2: fix the program ----
        await pg.click('[data-go="c2code"]'); await pg.wait_for_timeout(300)
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2200)
        out = await pg.inner_text('#ideOut')
        check("'pinmode' was not declared" in out and "suggested alternative: 'pinMode'" in out, 'c2: undeclared pinmode + suggestion')
        check("Fix_Me.ino:10:" in out and "expected ';' before 'delay'" in out, 'c2: missing semicolon on line 10')
        check("stray '\\357' in program" in out, 'c2: full-width semicolon -> stray \\357')
        await pg.screenshot(path=OUT + 'x3-errors.png')
        ta = '#dbgTa'
        async def edit(js):
            await pg.evaluate('(js) => { const t = document.querySelector("#dbgTa"); t.value = (new Function("s", "return " + js))(t.value); t.dispatchEvent(new Event("input")); }', js)
        await edit("s.replace('pinmode', 'pinMode')")
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2200)
        out = await pg.inner_text('#ideOut')
        check('pinmode' not in out and "before 'delay'" in out, 'after fixing pinMode, the next error remains')
        check('1 / 4' in await pg.inner_text('#bugPills'), 'progress pill 1 / 4')
        await edit("s.replace('HIGH)\\n', 'HIGH);\\n').replace('；', ';')")
        await pg.click('#btnVerify'); await pg.wait_for_timeout(2200)
        check(await pg.evaluate('()=>S.ext.c2.code.compileOk'), 'compiles after the 3 syntax fixes')
        check('3 / 4' in await pg.inner_text('#bugPills'), 'progress pill 3 / 4')
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4800)
        check('不對' in await pg.inner_text('.modal h3'), 'logic error: upload works but L light is wrong')
        await pg.screenshot(path=OUT + 'x4-wrong-run.png')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(200)
        check('邏輯錯誤' in await pg.inner_text('#codeExplain'), 'logic error explained')
        await pg.click('#btnUpload'); await pg.wait_for_timeout(4800)
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(200)
        w = await pg.evaluate('()=>S.ext.c2.code.wrongRuns')
        check(w == 1 and 'delay(1000);' in await pg.inner_text('#codeExplain'), f'same code uploaded twice counts once ({w}), stronger hint shown')
        await edit("s.replace('LOW);\\n}', 'LOW);\\n  delay(1000);\\n}')")
        await pg.click('#btnUpload'); await pg.wait_for_timeout(5200)
        await pg.screenshot(path=OUT + 'x5-fixed.png')
        sc = await pg.evaluate('()=>extScores().c2')
        check(sc and sc['total'] == 9 and sc['code'] == 7, f'c2 done {sc}')
        await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT + 'x6-hub-done.png', full_page=True)
        # parser sanity: some odd but valid programs, and broken ones
        r = await pg.evaluate('''() => [
          parseDebug(FIXED_CODE).errs.length,
          parseDebug(FIXED_CODE.replace('delay(1000);\\n}', 'delay(1000);')).errs.map(e=>e.msg),
          parseDebug(FIXED_CODE.replace('digitalWrite(13, LOW);', 'digitalWrite(13, low);')).errs.map(e=>e.msg),
          parseDebug(FIXED_CODE.replace('delay(1000);', 'delay(1000, 5);')).errs.map(e=>e.kind),
          runDebug(parseDebug(FIXED_CODE.replace('digitalWrite(13, LOW);\\n  delay(1000);', 'digitalWrite(13, LOW); delay(300);')).fns),
        ]''')
        check(r[0] == 0, 'fixed program compiles')
        check(any("expected '}' at end of input" in m for m in r[1]), 'missing } detected')
        check(any("'low' was not declared" in m for m in r[2]), 'lower-case low detected')
        check('args' in r[3], 'wrong argument count detected')
        check(r[4]['ok'], 'two statements on one line still run')
        # report shows both challenges
        await pg.click('#extReport'); await pg.wait_for_timeout(400)
        rep = await pg.inner_text('.rep')
        check('心跳燈' in rep and '修好壞掉的程式' in rep and '9 / 10' in rep, 'report lists both challenges')
        errs = [e for e in errs if 'ERR_TUNNEL' not in e]
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
