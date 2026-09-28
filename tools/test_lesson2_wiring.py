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
