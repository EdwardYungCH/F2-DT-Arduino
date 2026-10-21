"""Feed lesson 7 (mini piano) circuits straight into HW.analyze / analyzeC1 and check the issue codes."""
import asyncio, os, copy, sys
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath(os.path.dirname(__file__) + '/../lesson7/index.html')
def mk(t, h1, **k): return dict(id='p' + t + h1, type=t, h1=h1, **k)
# buttons: left legs f3 / f9 / f15 / f21 (left side → GND, right side → pin); buzzer f27–f30
BASE_PARTS = [mk('btn', 'f3', rot=False), mk('btn', 'f9', rot=False), mk('btn', 'f15', rot=False), mk('btn', 'f21', rot=False), mk('pz', 'f27')]
BASE_WIRES = [['P:GND', 'tn1'], ['j3', 'tn3'], ['j9', 'tn9'], ['j15', 'tn15'], ['j21', 'tn21'],
              ['P:D2', 'j5'], ['P:D3', 'j11'], ['P:D4', 'j17'], ['P:D5', 'j23'], ['P:D8', 'j27'], ['j30', 'tn30']]
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
def sw(old, new, base=None): return [new if x == old else x for x in (base or BASE_WIRES)]
FAIL = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: FAIL.append(msg)
MAIN = {
 'correct': (variant(), None),
 'do_sides_swapped': (variant(wires=sw(['P:D2', 'j5'], ['P:D2', 'j3'], sw(['j3', 'tn3'], ['j5', 'tn5']))), None),
 'gnd_straight_to_pin': (variant(wires=[['P:GND', 'j3'], ['P:GND2', 'j9'], ['P:GND3', 'j15'], ['j15', 'tn15']] + BASE_WIRES[4:]), None),
 'btn_rotated': (variant(patch=setp('f3', rot=True)), 'btn_rot'),
 'only_3_buttons': (variant(drop_parts=['f21'], drop_wires=[['j21', 'tn21'], ['P:D5', 'j23']]), 'btn_missing'),
 'btn_gnd_missing': (variant(drop_wires=[['j3', 'tn3']]), 'btn_gnd_missing'),
 'btn_on_plus_rail': (variant(wires=sw(['j3', 'tn3'], ['j3', 'tp3'])), 'btn_plus_rail'),
 'btn_to_5v': (variant(wires=sw(['j3', 'tn3'], ['j3', 'tp3']), add_wires=[['P:5V', 'tp30']]), 'btn_5v'),
 'pin_straight_to_gnd': (variant(add_wires=[['i5', 'tn5']]), 'short_D2'),
 'btn_bridged': (variant(drop_wires=[['j3', 'tn3']], add_wires=[['i3', 'i5']]), 'btn_bridged'),
 'key_missing': (variant(drop_wires=[['P:D3', 'j11']]), 'key_missing'),
 'key_nowhere': (variant(wires=sw(['P:D3', 'j11'], ['P:D3', 'j12'])), 'key_nowhere'),
 'key_wrong_pin': (variant(wires=sw(['P:D5', 'j23'], ['P:D6', 'j23'])), 'btn_wrong_pin'),
 'key_on_d8': (variant(wires=sw(['P:D5', 'j23'], ['P:D8', 'j23'], sw(['P:D8', 'j27'], ['P:D7', 'j27']))), 'btn_d8'),
 'two_pins_one_btn': (variant(wires=sw(['P:D3', 'j11'], ['P:D3', 'i3']), drop_wires=[['j3', 'tn3']]), 'two_pins_one_btn'),
 'pins_joined': (variant(add_wires=[['i5', 'i11']]), 'pins_joined'),
 'press_short': (variant(wires=sw(['P:D2', 'j5'], ['P:5V', 'j5'])), 'press_short'),
 'gnd_rail_unpowered': (variant(drop_wires=[['P:GND', 'tn1']]), 'rail_unpowered'),
 'gnd_on_plus_rail': (variant(wires=[['P:GND', 'tp1'], ['j3', 'tp3'], ['j9', 'tp9'], ['j15', 'tp15'], ['j21', 'tp21']] + BASE_WIRES[5:10] + [['j30', 'tp30']]), 'rail_gnd_plus'),
 'pz_missing': (variant(drop_parts=['f27'], drop_wires=[['P:D8', 'j27'], ['j30', 'tn30']]), 'pz_missing'),
 'pz_short': (variant(add_wires=[['i27', 'i30']]), 'pz_short'),
 'd8_missing': (variant(drop_wires=[['P:D8', 'j27']]), 'd8_missing'),
 'pz_on_d7': (variant(wires=sw(['P:D8', 'j27'], ['P:D7', 'j27'])), 'pz_wrong_pin'),
 'key_on_buzzer': (variant(wires=sw(['P:D5', 'j23'], ['P:D5', 'i27']), drop_wires=[['P:D8', 'j27']]), 'key_on_buzzer'),
 'pz_gnd_missing': (variant(drop_wires=[['j30', 'tn30']]), 'pz_gnd_missing'),
 'pz_plus_rail': (variant(wires=sw(['j30', 'tn30'], ['j30', 'tp30'])), 'pz_plus_rail'),
 'pz_to_5v': (variant(wires=sw(['j30', 'tn30'], ['j30', 'tp30']), add_wires=[['P:5V', 'tp1']]), 'pz_5v'),
 'stray_wire': (variant(add_wires=[['P:D12', 'a28']]), 'stray'),
 'short_5v_gnd': (variant(add_wires=[['P:5V', 'tn29']]), 'short_5V'),
}
LS = [mk('ls', 'd29', flipped=False), mk('res', 'c25', ohm=10000)]
OKW = [['P:5V', 'bp20'], ['P:GND2', 'bn20'], ['a25', 'bp25'], ['a30', 'bn30'], ['P:A0', 'a29']]
def c1v(parts=None, wires=None, patch=None):
    p = copy.deepcopy(parts or LS)
    if patch: patch(p)
    return {'parts': p, 'wires': wires if wires is not None else OKW}
C1 = {
 'ok': (c1v(), None),
 'ok_top_gnd': (c1v(wires=[['P:5V', 'bp20'], ['a25', 'bp25'], ['a30', 'P:GND3'], ['P:A0', 'a29']]), None),
 'ls_reversed': (c1v(patch=setp('d29', flipped=True)), 'ls_reversed'),
 'ls_220': (c1v(patch=setp('c25', ohm=220)), 'pu_value'),
 'no_5v': (c1v(wires=OKW[1:]), 'v5_missing'),
 'no_gnd_bottom': (c1v(wires=[OKW[0]] + OKW[2:]), 'rail_unpowered'),
 'no_a0': (c1v(wires=OKW[:4]), 'a0_missing'),
 'a0_long_leg': (c1v(wires=OKW[:4] + [['P:A0', 'b30']]), 'a0_gnd'),
 'a0_wrong_pin': (c1v(wires=OKW[:4] + [['P:A1', 'a29']]), 'a0_wrong_pin'),
 'pu_to_gnd': (c1v(wires=[OKW[0], OKW[1], ['a25', 'bn25'], OKW[3], OKW[4]]), 'pu_to_gnd'),
 'breaks_base': (c1v(wires=OKW + [['i3', 'i5']]), 'base_'),
 'stray': (c1v(wires=OKW + [['P:A3', 'a1']]), 'stray'),
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
        await pg.evaluate("() => { S = newState({name:'t', cls:'2A', no:'1'}); HW.autoWire('main'); HW.autoWire('c1'); }")
        got = await pg.evaluate("() => [HW.analyze().iss.map(i => i.code), HW.analyzeC1().iss.map(i => i.code)]")
        check(got == [[], []], f'teacher auto-wiring is clean {got}')
        km = await pg.evaluate("() => HW.keyMap()")
        check(km == {'do': 'pbtnf3', 're': 'pbtnf9', 'mi': 'pbtnf15', 'so': 'pbtnf21'}, f'key map from wiring {km}')
        n = await pg.evaluate("() => { const lay = HW.layout(), A = HW.analyze(); return WIRE.crowded(lay.parts.map(p => ({ name: p.type, legs: p.legs })), (a, b) => A.find(a) === A.find(b)).length; }")
        check(n == 0, f'suggested layout gives no crowding tip ({n})')
        n = await pg.evaluate("() => { const parts = S.hw.parts.concat(S.ext.c1.hw.parts), A = HW.analyzeC1(); return WIRE.crowded(parts.map(p => ({ name: p.type, legs: HW.legHoles(p) })), (a, b) => A.find(a) === A.find(b)).length; }")
        check(n == 0, f'challenge 1 layout gives no crowding tip ({n})')
        lst = await pg.evaluate("() => { const lay = HW.layout(), d = document.createElement('div'); d.innerHTML = WIRE.listHTML(lay.parts, lay.wires, {}); return d.innerText; }")
        check('Do 鍵 · D2' in lst and 'So 鍵 · D5' in lst and '蜂鳴器' in lst, f'real checklist names the keys: {lst[:160]}')
        check(not errs, f'no page errors {errs}')
        await b.close()
    print('FAILURES:', FAIL)
    sys.exit(1 if FAIL else 0)
asyncio.run(main())
