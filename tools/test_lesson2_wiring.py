import asyncio
from playwright.async_api import async_playwright
cases = {
 'correct': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:D13','a9'],['P:GND','a14']]},
 'res_on_cathode_side': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c14'},'wires':[['P:D13','a13'],['P:GND','a18']]},
 'no_resistor': {'led':{'h1':'e13','flipped':False},'res':None,'wires':[['P:D13','a13'],['P:GND','a14']]},
 'short_5v': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:5V','a20'],['P:GND','b20']]},
 'wrong_pin': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:D12','a9'],['P:GND','a14']]},
 'to_5v': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:5V','a9'],['P:GND','a14']]},
 'led_rail': {'led':{'h1':'tp5','flipped':False},'res':{'h1':'c9'},'wires':[]},
 'not_series': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c3'},'wires':[]},
 'gnd_nowhere': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:D13','a9'],['P:GND','a20']]},
 'via_rail': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:D13','a9'],['P:GND2','tn1'],['tn14','a14']]},
 'stray': {'led':{'h1':'e13','flipped':False},'res':{'h1':'c9'},'wires':[['P:D13','a9'],['P:GND','a14'],['a22','a24']]},
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        await pg.goto('file://'+__import__('os').path.abspath(__import__('os').path.dirname(__file__)+'/../lesson2/index.html'))
        await pg.evaluate("()=>{S=newState({name:'t',cls:'2A',no:'1'})}")
        for k,c in cases.items():
            r=await pg.evaluate('''(c)=>{const h={led:c.led,res:c.res,wires:c.wires.map((w,i)=>({id:'w'+i,a:w[0],b:w[1],color:'#000'}))};
              return HW.analyze(h).iss.map(i=>i.step+':'+i.code+(i.counts?'*':''))}''',c)
            print(f'{k:22s}',r)
        await b.close()
asyncio.run(main())

# ---- extension 1: Piezo on top of the finished LED circuit ----
BASE = {'led': {'h1': 'e13', 'flipped': False}, 'res': {'h1': 'c9'}, 'wires': [['P:D13', 'a9'], ['P:GND', 'a14']]}
c1cases = {
 'correct_gnd2':     {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a18'], ['P:GND2', 'a21']]},
 'correct_via_led':  {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a18'], ['b21', 'b14']]},
 'flipped_ok':       {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a21'], ['P:GND2', 'a18']]},
 'wrong_pin':        {'pz': {'h1': 'e18'}, 'wires': [['P:D12', 'a18'], ['P:GND2', 'a21']]},
 'on_5v':            {'pz': {'h1': 'e18'}, 'wires': [['P:5V', 'a18'], ['P:GND2', 'a21']]},
 'pz_short':         {'pz': {'h1': 'tn3'}, 'wires': []},
 'd8_short_gnd':     {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a14']]},
 'no_gnd':           {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a18']]},
 'gnd_nowhere':      {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a18'], ['P:GND2', 'a24']]},
 'breaks_led':       {'pz': {'h1': 'e18'}, 'wires': [['P:D8', 'a18'], ['P:GND2', 'a21'], ['b9', 'b21']]},
}
async def c1main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto('file://' + __import__('os').path.abspath(__import__('os').path.dirname(__file__) + '/../lesson2/index.html'))
        for k, c in c1cases.items():
            r = await pg.evaluate('''([c, base]) => {
              const mk = ws => ws.map((w, i) => ({id: 'w' + i, a: w[0], b: w[1], color: '#000'}));
              return HW.analyzeC1({pz: c.pz, wires: mk(c.wires)}, {led: base.led, res: base.res, wires: mk(base.wires)}).iss.map(i => i.step + ':' + i.code + (i.counts ? '*' : ''))}''', [c, BASE])
            print(f'c1 {k:18s}', r)
        await b.close()
asyncio.run(c1main())
