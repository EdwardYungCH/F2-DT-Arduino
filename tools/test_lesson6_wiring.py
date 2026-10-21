"""Feed lesson 6 (RGB mood lamp) circuits straight into HW.analyze / analyzeC1 and check the issue codes."""
import asyncio, os, copy, sys
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson6/index.html')
def mk(t, h1, **k): return dict(id='p' + t + h1, type=t, h1=h1, **k)
# RGB LED at f13–f16: G f13, B f14, − f15, R f16
BASE_PARTS = [mk('rgb', 'f13', flipped=False), mk('res', 'h9', ohm=220), mk('res', 'i14', ohm=220), mk('res', 'h16', ohm=220)]
BASE_WIRES = [['P:GND', 'tn8'], ['j15', 'tn15'], ['P:D9', 'j20'], ['P:D10', 'j9'], ['P:D11', 'j18']]
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
# flipped LED at f13: R f13, − f14, B f15, G f16 — a mirrored but correct layout
FLIP_PARTS = [mk('rgb', 'f13', flipped=True), mk('res', 'h9', ohm=220), mk('res', 'i15', ohm=220), mk('res', 'h16', ohm=220)]
FLIP_WIRES = [['P:GND', 'tn8'], ['j14', 'tn14'], ['P:D9', 'j9'], ['P:D11', 'j19'], ['P:D10', 'j20']]
MAIN = {
 'correct': (variant(), None),
 'gnd_direct_to_pin': (variant(wires=[['P:GND', 'j15'], ['P:D9', 'j20'], ['P:D10', 'j9'], ['P:D11', 'j18']]), None),
 'flipped_but_rewired': ({'parts': FLIP_PARTS, 'wires': FLIP_WIRES}, None),
 'flipped': (variant(patch=setp('f13', flipped=True)), 'rgb_reversed'),
 'no_rgb': (variant(drop_parts=['f13']), 'rgb_missing'),
 'k_not_wired': (variant(drop_wires=[['j15', 'tn15']]), 'k_missing'),
 'k_plus_rail': (variant(wires=sw(['j15', 'tn15'], ['j15', 'tp15'])), 'k_plus_rail'),
 'k_on_pin': (variant(wires=sw(['j15', 'tn15'], ['j15', 'P:D7'])), 'k_pin'),
 'no_gnd_pin': (variant(drop_wires=[['P:GND', 'tn8']]), 'rail_unpowered'),
 'gnd_on_plus_rail': (variant(wires=[['P:GND', 'tp8'], ['j15', 'tp15']] + BASE_WIRES[2:]), 'rail_gnd_plus'),
 'r_res_missing': (variant(drop_parts=['h16'], drop_wires=[['P:D9', 'j20']]), 'res_missing'),
 'r_no_resistor': (variant(drop_parts=['h16'], wires=sw(['P:D9', 'j20'], ['P:D9', 'j16'])), 'no_resistor'),
 'g_10k': (variant(patch=setp('h9', ohm=10000)), 'res_value'),
 'r_bypass': (variant(wires=sw(['P:D9', 'j20'], ['P:D9', 'j16'])), 'bypass'),
 'r_on_d8_not_pwm': (variant(wires=sw(['P:D9', 'j20'], ['P:D8', 'j20'])), 'not_pwm'),
 'b_on_d12_not_pwm': (variant(wires=sw(['P:D11', 'j18'], ['P:D12', 'j18'])), 'not_pwm'),
 'r_on_d6_pwm': (variant(wires=sw(['P:D9', 'j20'], ['P:D6', 'j20'])), 'wrong_pin'),
 'r_g_swapped': (variant(wires=[['P:GND', 'tn8'], ['j15', 'tn15'], ['P:D10', 'j20'], ['P:D9', 'j9'], ['P:D11', 'j18']]), 'swap'),
 'b_on_a0': (variant(wires=sw(['P:D11', 'j18'], ['P:A0', 'j18'])), 'analog_pin'),
 'r_to_5v': (variant(wires=sw(['P:D9', 'j20'], ['P:5V', 'j20'])), 'power'),
 'g_missing_wire': (variant(drop_wires=[['P:D10', 'j9']]), 'sig_missing'),
 'g_wire_nowhere': (variant(wires=sw(['P:D10', 'j9'], ['P:D10', 'j8'])), 'sig_nowhere'),
 'res_between_legs': (variant(drop_wires=[['P:D9', 'j20']], add_wires=[['i20', 'i13']]), 'res_between'),
 'pins_joined': (variant(wires=sw(['P:D11', 'j18'], ['P:D11', 'j21']), add_wires=[['i21', 'i20']]), 'pins_joined'),
 'stray_wire': (variant(add_wires=[['P:D4', 'a28']]), 'stray'),
 'short_5v_gnd': (variant(add_wires=[['P:5V', 'tn29']]), 'short_5V'),
 'short_d9_gnd': (variant(add_wires=[['P:D9', 'tn28']], wires=sw(['P:D9', 'j20'], ['j20', 'j20'])), 'short_D9'),
 'two_legs_joined': (variant(add_wires=[['j13', 'j14']]), 'rgb_short'),
}
POT = [mk('pot', 'f24')]
OKW = [['P:5V', 'tp8'], ['j24', 'tp24'], ['j26', 'tn26'], ['P:A0', 'a25']]
C1 = {
 'ok': ({'parts': POT, 'wires': OKW}, None),
 'ok_outer_swapped': ({'parts': POT, 'wires': [['P:5V', 'tp8'], ['j24', 'tn24'], ['j26', 'tp26'], ['P:A0', 'a25']]}, None),
 'no_5v': ({'parts': POT, 'wires': OKW[1:]}, 'v5_missing'),
 'no_5v_outer_hint': ({'parts': POT, 'wires': OKW[1:]}, 'rail_unpowered_plus'),
 'wiper_to_5v': ({'parts': POT, 'wires': OKW[:3] + [['a25', 'tp25'], ['P:A0', 'i20']]}, 'pot_wiper_power'),
 'a0_on_outer': ({'parts': POT, 'wires': [['P:5V', 'tp8'], ['j24', 'tp24'], ['P:A0', 'j26']]}, 'pot_a0_outer'),
 'both_5v': ({'parts': POT, 'wires': [['P:5V', 'tp8'], ['j24', 'tp24'], ['j26', 'tp26'], ['P:A0', 'a25']]}, 'pot_same'),
 'on_a1': ({'parts': POT, 'wires': OKW[:3] + [['P:A1', 'a25']]}, 'pot_wiper_pin'),
 'no_a0': ({'parts': POT, 'wires': OKW[:3]}, 'a0_missing'),
 'bottom_rail': ({'parts': POT, 'wires': [['P:5V', 'tp8'], ['j24', 'bp24'], ['j26', 'tn26'], ['P:A0', 'a25']]}, 'pot_bottom_rail'),
 '5v_minus_rail': ({'parts': POT, 'wires': [['P:5V', 'tn8'], ['j24', 'tp24'], ['j26', 'tn26'], ['P:A0', 'a25']]}, 'rail_5v_minus'),
 'breaks_base': ({'parts': POT, 'wires': OKW + [['i9', 'i13']]}, 'base_'),
}
JS = '''([kind, c, base]) => {
  const W = ws => ws.map((w, i) => ({id: 'w' + i, a: w[0], b: w[1], color: '#000'}));
  const h = {parts: c.parts, wires: W(c.wires)}, b = {parts: base.parts, wires: W(base.wires)};
  const r = kind === 'main' ? HW.analyze(h) : HW.analyzeC1(h, b);
  return r.iss.map(i => i.step + ':' + i.code + (i.counts ? '*' : '')); }'''
CROWD = '''() => { const lay = HW.layout(); return WIRE.crowded(lay.parts.map(p => ({ name: p.type, legs: p.legs })), () => false).length; }'''
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
        # the suggested layout must not raise a "neighbouring columns" tip
        await pg.evaluate("() => { S = newState({name:'t', cls:'2A', no:'1'}); HW.autoWire('main'); }")
        n = await pg.evaluate("() => { const lay = HW.layout(), A = HW.analyze(); return WIRE.crowded(lay.parts.map(p => ({ name: p.type, legs: p.legs })), (a, b) => A.find(a) === A.find(b)).length; }")
        check(n == 0, f'suggested layout gives no crowding tip ({n})')
        lst = await pg.evaluate("() => { const lay = HW.layout(), d = document.createElement('div'); d.innerHTML = WIRE.listHTML(lay.parts, lay.wires, {}); return d.querySelector('li').innerText; }")
        check('f15' in lst and '最長' in lst and 'G（綠）' in lst, f'real checklist names the RGB legs: {lst}')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
