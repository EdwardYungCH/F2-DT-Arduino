"""Feed lesson 3 circuits straight into HW.analyze / analyzeC1 / analyzeC2 and print the issue codes."""
import asyncio, os, json, copy
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson3/index.html')
def mk(t, h1, **k): return dict(id='p' + t + h1, type=t, h1=h1, **k)
BASE_PARTS = [mk('led', 'f5', color='red', flipped=False), mk('led', 'f11', color='yellow', flipped=False), mk('led', 'f17', color='green', flipped=False),
              mk('res', 'h1', ohm=220), mk('res', 'h7', ohm=220), mk('res', 'h13', ohm=220), mk('btn', 'f19', rot=False), mk('res', 'h21', ohm=10000)]
BASE_WIRES = [['P:D12', 'j1'], ['P:D11', 'j7'], ['P:D10', 'j13'], ['P:GND', 'tn1'], ['j6', 'tn6'], ['j12', 'tn12'], ['j18', 'tn18'], ['P:5V', 'j19'], ['P:D2', 'j21'], ['j25', 'tn25']]
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
cases = {
 'correct': variant(),
 'led_reversed_red': variant(patch=setp('f5', flipped=True)),
 'led_10k_on_yellow': variant(patch=setp('h7', ohm=10000)),
 'pulldown_220': variant(patch=setp('h21', ohm=220)),
 'swap_red_yellow': variant(wires=[['P:D11', 'j1'], ['P:D12', 'j7']] + BASE_WIRES[2:]),
 'no_gnd_rail': variant(drop_wires=[['P:GND', 'tn1']]),
 'green_no_gnd': variant(drop_wires=[['j18', 'tn18']]),
 'btn_rotated': variant(patch=setp('f19', rot=True)),
 'btn_missing': variant(drop_parts=['f19']),
 '5v_d2_same_side': variant(wires=BASE_WIRES[:7] + [['P:5V', 'j19'], ['P:D2', 'i19'], ['j25', 'tn25']]),
 'no_pulldown': variant(drop_parts=['h21'], drop_wires=[['j25', 'tn25']]),
 'pulldown_to_5v_rail': variant(drop_wires=[['j25', 'tn25']], add_wires=[['j25', 'tp25']]),
 'press_short': variant(drop_parts=['h21'], drop_wires=[['j25', 'tn25']], add_wires=[['i21', 'tn21']]),
 'd2_on_3': variant(wires=BASE_WIRES[:8] + [['P:D3', 'j21'], ['j25', 'tn25']]),
 'red_on_5v': variant(wires=[['P:5V', 'j1']] + BASE_WIRES[1:7] + [['P:3V3', 'j19'], ['P:D2', 'j21'], ['j25', 'tn25']]),
 'extra_220_unused': variant(add_wires=[], patch=lambda ps: ps.append(mk('res', 'b3', ohm=220))),
}
C1 = {
 'ok': {'parts': [mk('pz', 'd11')], 'wires': [['P:D8', 'a11'], ['P:GND2', 'a14']]},
 'via_top_rail': {'parts': [mk('pz', 'd11')], 'wires': [['P:D8', 'a11'], ['a14', 'tn14']]},
 'wrong_pin': {'parts': [mk('pz', 'd11')], 'wires': [['P:D9', 'a11'], ['P:GND2', 'a14']]},
 'no_gnd': {'parts': [mk('pz', 'd11')], 'wires': [['P:D8', 'a11']]},
 'breaks_base': {'parts': [mk('pz', 'd11')], 'wires': [['P:D8', 'a11'], ['P:GND2', 'a14'], ['i1', 'b11']]},
}
C2 = {
 'ok': {'parts': [mk('tilt', 'd3'), mk('res', 'c5', ohm=10000)], 'wires': [['i19', 'a3'], ['P:D3', 'a5'], ['P:GND2', 'a9']]},
 'no_pulldown': {'parts': [mk('tilt', 'd3')], 'wires': [['i19', 'a3'], ['P:D3', 'a5']]},
 'pd_220': {'parts': [mk('tilt', 'd3'), mk('res', 'c5', ohm=220)], 'wires': [['i19', 'a3'], ['P:D3', 'a5'], ['P:GND2', 'a9']]},
 'wrong_pin': {'parts': [mk('tilt', 'd3'), mk('res', 'c5', ohm=10000)], 'wires': [['i19', 'a3'], ['P:D4', 'a5'], ['P:GND2', 'a9']]},
 'short_when_closed': {'parts': [mk('tilt', 'd3')], 'wires': [['i19', 'a3'], ['P:D3', 'a5'], ['P:GND2', 'b5']]},
}
JS = '''([kind, c, base]) => {
  const W = ws => ws.map((w, i) => ({id: 'w' + i, a: w[0], b: w[1], color: '#000'}));
  const h = {parts: c.parts, wires: W(c.wires)}, b = {parts: base.parts, wires: W(base.wires)};
  const r = kind === 'main' ? HW.analyze(h) : kind === 'c1' ? HW.analyzeC1(h, b) : HW.analyzeC2(h, b);
  return r.iss.map(i => i.step + ':' + i.code + (i.counts ? '*' : '')); }'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL)
        base = variant()
        for kind, cs in [('main', cases), ('c1', C1), ('c2', C2)]:
            for k, c in cs.items():
                print(f'{kind:4s} {k:22s}', await pg.evaluate(JS, [kind, c, base]))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
