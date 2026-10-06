"""Early (unfinished) report for lessons 1 to 4: only finished parts score, the student can carry on and hand in a full report later."""
import asyncio, os, re, sys
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.dirname(__file__) + '/..')
OUT = os.environ.get('OUT', '/tmp/early-test/'); os.makedirs(OUT, exist_ok=True)
FAIL = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)

async def run(p, n):
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(f'file://{ROOT}/lesson{n}/index.html'); await pg.wait_for_timeout(300)
    await pg.evaluate("() => { S = newState({name:'林小明', cls:'2B', no:'7'}); S.unlocked = 1; S.stage = 'hw'; save(); startApp(); }")
    await pg.wait_for_timeout(300)
    check(await pg.is_visible('#earlyBtn'), f'L{n} early button visible while unfinished')
    # finish the wiring only, and get some blanks right
    await pg.evaluate("""() => { HW.autoWire('main'); S.hw.done = true; S.hw.errors = 1; S.unlocked = 2;
      BLANKS.slice(0, 3).forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false});
      S.stage = 'code'; save(); goStage('code'); }""")
    await pg.wait_for_timeout(300)
    await pg.click('#earlyBtn'); await pg.wait_for_timeout(200)
    txt = await pg.inner_text('.modal')
    nb = await pg.evaluate('()=>BLANKS.length')
    check('未完成，先交報告' in txt and f'已答對 3 / {nb} 格' in txt, f'L{n} confirm dialog lists progress')
    await pg.screenshot(path=OUT + f'l{n}-1-confirm.png')
    await pg.click('.modal .actions .btn.go'); await pg.wait_for_timeout(400)
    stage = await pg.evaluate('() => S.stage')
    check(stage == 'report', f'L{n} goes to report stage (got {stage})')
    check(not await pg.is_visible('#earlyBtn'), f'L{n} early button hidden on report page')
    sc = await pg.evaluate('() => buildRecord()')
    check(sc['status'] == 'partial' and sc['score']['code'] == 0 and sc['score']['up'] == 0 and sc['score']['hw'] == 36, f"L{n} partial score {sc['score']}")
    body = await pg.inner_text('#st-report')
    check('這是未完成的報告' in body and '未完成（提早提交）' in body, f'L{n} report page marks unfinished')
    await pg.screenshot(path=OUT + f'l{n}-2-report.png', full_page=True)
    async with pg.expect_download() as dl:
        await pg.click('#dlReport')
    d = await dl.value
    check('未完成' in d.suggested_filename, f'L{n} file name marks unfinished: {d.suggested_filename}')
    f1 = OUT + f'l{n}-partial.html'; await d.save_as(f1)
    rp = await ctx.new_page(); await rp.goto('file://' + f1); await rp.wait_for_timeout(300)
    rt = await rp.inner_text('#r')
    check('驗證碼有效' in rt and '未完成（提早提交）' in rt and f'已答對 3 / {nb} 格' in rt, f'L{n} report file valid and marked unfinished')
    await rp.screenshot(path=OUT + f'l{n}-3-file.png', full_page=True); await rp.close()
    # carry on
    await pg.click('#resumeBtn'); await pg.wait_for_timeout(300)
    stage = await pg.evaluate('() => S.stage')
    check(stage == 'code', f'L{n} resume returns to where the student was (got {stage})')
    check(await pg.is_visible('#earlyBtn'), f'L{n} early button back after resuming')
    await pg.evaluate("""() => { BLANKS.forEach(b => S.code.blanks[b.id] = {val:b.ans, wrong:0, status:'ok', revealed:false}); S.code.done = true;
      Object.assign(S.up, {usb:true, board:'Arduino Uno', port:S.up.com, verified:true, uploaded:true}); S.unlocked = 5; save(); goStage('report'); }""")
    await pg.wait_for_timeout(300)
    check(not await pg.is_visible('#earlyBtn'), f'L{n} early button gone once finished')
    rec = await pg.evaluate('() => buildRecord()')
    check(rec['status'] == 'complete' and rec['score']['total'] > 80, f"L{n} full report after finishing {rec['score']}")
    check('這是未完成的報告' not in await pg.inner_text('#st-report'), f'L{n} full report page has no unfinished banner')
    async with pg.expect_download() as dl:
        await pg.click('#dlReport')
    d = await dl.value; f2 = OUT + f'l{n}-full.html'; await d.save_as(f2)
    check('未完成' not in d.suggested_filename, f'L{n} full file name: {d.suggested_filename}')
    # verifier: status column, latest copy noted
    await pg.evaluate('() => verifier()'); await pg.wait_for_timeout(300)
    await pg.set_input_files('.modal input[type=file]', [f1, f2]); await pg.wait_for_timeout(800)
    vt = await pg.inner_text('#vTbl')
    print(vt)
    check('未完成' in vt and '完成' in vt and '（這份最新）' in vt and '（較舊）' in vt, f'L{n} verifier shows status and latest copy')
    await pg.screenshot(path=OUT + f'l{n}-4-verifier.png')
    check(not errs, f'L{n} no page errors {errs}')
    await b.close()

async def main():
    async with async_playwright() as p:
        for n in (1, 2, 3, 4): await run(p, n)
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
