"""Feed lesson 4 circuits straight into HW.analyze / analyzeC1 and check the issue codes."""
import asyncio, os, copy, sys
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson4/index.html')
def mk(t, h1, **k): return dict(id='p' + t + h1, type=t, h1=h1, **k)
BASE_PARTS = [mk('ls', 'f7', flipped=False), mk('res', 'h3', ohm=10000), mk('led', 'f15', color='yellow', flipped=False), mk('res', 'h11', ohm=220)]
BASE_WIRES = [['P:5V', 'tp1'], ['P:GND', 'tn1'], ['j3', 'tp3'], ['P:A0', 'j7'], ['j8', 'tn8'], ['P:D9', 'j11'], ['j16', 'tn16']]
def variant(parts=None, wires=None, drop_parts=(), drop_wires=(), add_wires=(), patch=None, add_parts=()):
    p = copy.deepcopy(parts or BASE_PARTS) + list(add_parts); w = [x for x in (wires or BASE_WIRES) if x not in drop_wires] + list(add_wires)
    p = [x for x in p if x['h1'] not in drop_parts]
    if patch: patch(p)
    return {'parts': p, 'wires': w}
def setp(h1, **k):
    def f(ps):
        for x in ps:
            if x['h1'] == h1: x.update(k)
    return f
def sw(old, new): return [new if x == old else x for x in BASE_WIRES]
FAIL = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)
# name: (circuit, expected code that must appear (None = no issues), counted?)
MAIN = {
 'correct': (variant(), None),
 'direct_5v_to_res': (variant(wires=sw(['j3', 'tp3'], ['P:5V', 'j3']), drop_wires=[['P:5V', 'tp1']]), None),
 'ls_reversed_gnd': (variant(patch=setp('f7', flipped=True)), 'ls_reversed'),
 'ls_res_on_short_leg': (variant(parts=[mk('ls', 'f7', flipped=True), mk('res', 'h3', ohm=10000), mk('led', 'f15', color='yellow', flipped=False), mk('res', 'h11', ohm=220)], wires=BASE_WIRES[:3]), 'ls_reversed'),
 'pullup_220': (variant(patch=setp('h3', ohm=220), wires=BASE_WIRES[:5] + [['P:D9', 'j11'], ['j16', 'tn16']], parts=[mk('ls', 'f7', flipped=False), mk('res', 'h3', ohm=10000), mk('led', 'f15', color='yellow', flipped=False), mk('res', 'h11', ohm=220)]), 'pu_value'),
 'pullup_missing': (variant(drop_parts=['h3'], drop_wires=[['j3', 'tp3']]), 'pu_missing'),
 'pullup_to_gnd_rail': (variant(wires=sw(['j3', 'tp3'], ['j3', 'tn3'])), 'pu_to_gnd'),
 'ls_short_leg_plus_rail': (variant(wires=sw(['j8', 'tn8'], ['j8', 'tp8'])), 'ls_to_5v'),
 'a0_missing': (variant(drop_wires=[['P:A0', 'j7']]), 'a0_missing'),
 'a0_on_short_leg': (variant(wires=sw(['P:A0', 'j7'], ['P:A0', 'i8'])), 'a0_gnd'),
 'a0_on_short_leg_no_gnd': (variant(wires=sw(['P:A0', 'j7'], ['P:A0', 'i8']), drop_wires=[['j8', 'tn8']]), 'a0_on_gnd_side'),
 'a1_instead': (variant(wires=sw(['P:A0', 'j7'], ['P:A1', 'j7'])), 'a0_wrong_pin'),
 'a0_to_5v': (variant(add_wires=[['P:A0', 'tp20']], drop_wires=[['P:A0', 'j7']]), 'a0_5v'),
 'rails_swapped': (variant(wires=[['P:5V', 'tn1'], ['P:GND', 'tp1']] + BASE_WIRES[2:]), 'rail_5v_minus'),
 'no_5v': (variant(drop_wires=[['P:5V', 'tp1']]), 'v5_missing'),
 'led_reversed': (variant(patch=setp('f15', flipped=True)), 'reversed'),
 'led_10k': (variant(parts=[mk('ls', 'f7', flipped=False), mk('res', 'h3', ohm=10000), mk('led', 'f15', color='yellow', flipped=False), mk('res', 'h11', ohm=10000)]), 'res_value'),
 'led_on_d13': (variant(wires=sw(['P:D9', 'j11'], ['P:D13', 'j11'])), 'wrong_pin'),
 'led_no_gnd': (variant(drop_wires=[['j16', 'tn16']]), 'gnd_missing'),
 'stray_wire': (variant(add_wires=[['P:D4', 'a28']]), 'stray'),
 'short_5v_gnd': (variant(add_wires=[['tp29', 'tn29']]), 'short_5V'),
}
POT = [mk('pot', 'f20')]
C1 = {
 'ok': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tn22'], ['P:A1', 'a21']]}, None),
 'ok_outer_swapped': ({'parts': POT, 'wires': [['j20', 'tn20'], ['j22', 'tp22'], ['P:A1', 'a21']]}, None),
 'wiper_to_5v': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tn22'], ['a21', 'tp25'], ['P:A1', 'i20']]}, 'pot_wiper_power'),
 'a1_on_outer': ({'parts': POT, 'wires': [['j20', 'tp20'], ['P:A1', 'j22']]}, 'pot_a1_outer'),
 'both_5v': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tp22'], ['P:A1', 'a21']]}, 'pot_same'),
 'on_a0': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tn22'], ['P:A2', 'a21']]}, 'pot_wiper_pin'),
 'no_a1': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tn22']]}, 'a1_missing'),
 'bottom_rail': ({'parts': POT, 'wires': [['j20', 'bp20'], ['j22', 'tn22'], ['P:A1', 'a21']]}, 'pot_bottom_rail'),
 'breaks_base': ({'parts': POT, 'wires': [['j20', 'tp20'], ['j22', 'tn22'], ['P:A1', 'a21'], ['i7', 'i22']]}, 'base_'),
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
                check(ok, f'{kind:4s} {k:24s} {got}')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
