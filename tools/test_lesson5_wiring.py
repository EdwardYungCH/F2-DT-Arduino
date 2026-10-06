"""Feed lesson 5 circuits straight into HW.analyze / analyzeC1 and check the issue codes."""
import asyncio, os, copy, sys
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson5/index.html')
def mk(t, h1, **k): return dict(id='p' + t + h1, type=t, h1=h1, **k)
BASE_PARTS = [mk('ls', 'f7', flipped=False), mk('res', 'h3', ohm=10000), mk('led', 'f13', color='red', flipped=False), mk('res', 'h9', ohm=220),
              mk('led', 'f19', color='green', flipped=False), mk('res', 'h15', ohm=220)]
BASE_WIRES = [['P:5V', 'tp1'], ['P:GND', 'tn1'], ['j3', 'tp3'], ['P:A0', 'j7'], ['j8', 'tn8'], ['P:D12', 'j9'], ['P:D10', 'j15'], ['j14', 'tn14'], ['j20', 'tn20'],
              ['P:SVG', 'tn2'], ['P:SV5', 'tp2'], ['P:SVS', 'P:D9']]
def variant(parts=None, wires=None, drop_parts=(), drop_wires=(), add_wires=(), patch=None):
    p = copy.deepcopy(parts or BASE_PARTS); w = [x for x in (wires or BASE_WIRES) if x not in drop_wires] + list(add_wires)
    p = [x for x in p if x['h1'] not in drop_parts]
    if patch: patch(p)
    return {'parts': p, 'wires': w}
def setp(h1, **k):
    def f(ps):
        for x in ps:
            if x['h1'] == h1: x.update(k)
    return f
def sw(*pairs):
    w = list(BASE_WIRES)
    for old, new in pairs: w = [new if x == old else x for x in w]
    return w
FAIL = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)
MAIN = {
 'correct': (variant(), None),
 'servo_via_breadboard': (variant(wires=sw((['P:SVS', 'P:D9'], ['P:SVS', 'a28'])), add_wires=[['P:D9', 'b28']]), None),
 'servo_power_reversed': (variant(wires=sw((['P:SVG', 'tn2'], ['P:SVG', 'tp2']), (['P:SV5', 'tp2'], ['P:SV5', 'tn2']))), 'servo_power_rev'),
 'servo_red_orange_swapped': (variant(wires=sw((['P:SV5', 'tp2'], ['P:SV5', 'P:D9']), (['P:SVS', 'P:D9'], ['P:SVS', 'tp2']))), 'servo_swap'),
 'servo_signal_d10': (variant(wires=sw((['P:SVS', 'P:D9'], ['P:SVS', 'P:D11']))), 'servo_sig_pin'),
 'servo_signal_missing': (variant(drop_wires=[['P:SVS', 'P:D9']]), 'servo_sig_missing'),
 'servo_red_missing': (variant(drop_wires=[['P:SV5', 'tp2']]), 'servo_red_missing'),
 'servo_brown_to_plus': (variant(wires=sw((['P:SVG', 'tn2'], ['P:SVG', 'tp4']))), 'servo_brown_5v'),
 'led_red_green_swapped': (variant(wires=sw((['P:D12', 'j9'], ['P:D10', 'j9']), (['P:D10', 'j15'], ['P:D12', 'j15']))), 'swap'),
 'led_green_reversed': (variant(patch=setp('f19', flipped=True)), 'reversed'),
 'led_on_d9_net': (variant(wires=sw((['P:D12', 'j9'], ['P:D13', 'j9']))), 'wrong_pin'),
 'sensor_reversed': (variant(patch=setp('f7', flipped=True)), 'ls_reversed'),
 'sensor_220': (variant(patch=setp('h3', ohm=220)), 'pu_value'),
 'a0_missing': (variant(drop_wires=[['P:A0', 'j7']]), 'a0_missing'),
 'rails_swapped': (variant(wires=sw((['P:5V', 'tp1'], ['P:5V', 'tn1']), (['P:GND', 'tn1'], ['P:GND', 'tp1']))), 'rail_5v_minus'),
}
BTN = [mk('btn', 'f24', rot=False), mk('res', 'h26', ohm=10000)]
BW = [['j24', 'tp24'], ['P:D2', 'j26'], ['j30', 'tn30']]
C1 = {
 'ok': ({'parts': BTN, 'wires': BW}, None),
 'rotated': ({'parts': [mk('btn', 'f24', rot=True), mk('res', 'h26', ohm=10000)], 'wires': BW}, 'btn_rot'),
 'no_pulldown': ({'parts': [mk('btn', 'f24', rot=False)], 'wires': BW[:2]}, 'no_pulldown'),
 'pulldown_220': ({'parts': [mk('btn', 'f24', rot=False), mk('res', 'h26', ohm=220)], 'wires': BW}, 'pd_value'),
 'pulldown_to_plus': ({'parts': BTN, 'wires': BW[:2] + [['j30', 'tp30']]}, 'pd_to_5v'),
 'wrong_pin': ({'parts': BTN, 'wires': [['j24', 'tp24'], ['P:D3', 'j26'], ['j30', 'tn30']]}, 'sw_pin'),
 'no_5v': ({'parts': BTN, 'wires': BW[1:]}, 'v5_missing'),
 'press_short': ({'parts': [mk('btn', 'f24', rot=False)], 'wires': BW[:2] + [['i26', 'tn26']]}, 'press_short'),
 'breaks_base': ({'parts': BTN, 'wires': BW + [['i7', 'i24']]}, 'base_'),
}
JS = '''([kind, c, base]) => {
  const W = ws => ws.map((w, i) => ({id: 'w' + i, a: w[0], b: w[1], color: '#000'}));
  const h = {parts: c.parts, wires: W(c.wires)}, b = {parts: base.parts, wires: W(base.wires)};
  const r = kind === 'main' ? HW.analyze(h) : HW.analyzeC1(h, b);
  return r.iss.map(i => i.step + ':' + i.code + (i.counts ? '*' : '')); }'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL)
        base = variant()
        for kind, cs in [('main', MAIN), ('c1', C1)]:
            for k, (c, want) in cs.items():
                got = await pg.evaluate(JS, [kind, c, base])
                ok = (not got) if want is None else any((':' + want) in g for g in got)
                check(ok, f'{kind:4s} {k:26s} {got}')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
