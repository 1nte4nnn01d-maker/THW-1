"""v4 patch: main menu + setup screen + settings + ideas + i18n, frozen match rules, peace/war supply logic, hover animation."""
import re,sys
R=sys.argv[1]
def edit(path,fn):
    t=open(R+'/'+path,encoding='utf-8').read();t=fn(t);open(R+'/'+path,'w',encoding='utf-8').write(t)
def mk(path):
    class E:
        def __init__(s):s.t=open(R+'/'+path,encoding='utf-8').read()
        def rep(s,a,b,n=1):
            assert s.t.count(a)==n,('%s count %d: '%(path,s.t.count(a)))+a[:70];s.t=s.t.replace(a,b)
        def rx(s,pat,new):
            s.t,k=re.subn(pat,lambda _:new,s.t,count=1,flags=re.S);assert k==1,path+' rx '+pat[:50]
        def save(s):open(R+'/'+path,'w',encoding='utf-8').write(s.t)
    return E()
# ---------------- game.js
g=mk('js/game.js')
g.rx(r"function plist\(\)\{.*?(?=\nfunction start\(\)\{)","")
g.rep("function start(){if(PK<0)return;PL=PK;reset();closeMore();","function start(){if(PK<0)return;PL=PK;reset();rules.buy=PREP.buy;DIF=PREP.dif;closeMore();Menu.hide();")
g.rep("""<label><input type="checkbox" '+(rules.buy?'checked':'')+' onchange="rules.buy=this.checked"> Покупка территорий</label>""","")
g.rep("+diffUI()+","+matchInfo()+")
g.rx(r"function diffUI\(\)\{[^\n]*\n","""function matchInfo(){return'<div class="sec">Параметры партии</div><div class="panel"><div class="row" style="margin-top:0"><span class="grow">Покупка территорий</span><b>'+(rules.buy?'Да':'Нет')+'</b></div><div class="row"><span class="grow">Сложность</span><b>'+['Легко','Средне','Хардкор'][DIF]+'</b></div><div class="mut" style="margin-top:6px">Заданы при старте партии и не меняются.</div></div>'}
""")
g.rep("function attack(a,b){const A=P[a],B=P[b],o=A.o,d=B.o,s=A.a*.9;A.a-=s;","function attack(a,b){const A=P[a],B=P[b],o=A.o,d=B.o,s=A.a*.9;A.a-=s;A.fl=B.fl=turn;")
g.rep("p.o==PL&&p.a>.05&&SUPF.length&&!SUPF[sel]","p.o==PL&&p.a>.05&&SUPF.length&&Supply.pocket(p,SUPF)")
g.save()
# ---------------- supply.js: logistics only where there is a war
s=mk('js/supply.js')
s.rep("ATTR_MIN: .05, ATTR_MAX: .10 };  // attrition per turn: overstack 5..10%, pocket 10%","ATTR_MIN: .05, ATTR_MAX: .10,     // attrition per turn: overstack 5..10%, pocket 10%\n                ENGAGE_TURNS: 3 };  // a province counts as \"in combat\" for this many turns after a battle")
s.rep("if (p.o === o && p.a > .05) { all++; if (!f[p.i]) cut++; }","if (p.o === o && p.a > .05) { all++; if (pocket(p, f)) cut++; }")
s.rx(r"  /\*\* Overstack attrition: always on occupied.*?return r; \};\n","""  /** Logistics are "on" only where there is a war: occupied foreign land, provinces touching an enemy, and provinces that
      fought during the last ENGAGE_TURNS turns. Home land in peace (or in the rear) consumes no supply: no stack limit, no attrition. */
  const engaged = p => !isHome(p) || bordersEnemy(p) || (typeof turn !== 'undefined' && p.fl != null && turn - p.fl <= CFG.ENGAGE_TURNS);
  /** Over the supply limit while logistics are on. */
  const overstack = p => engaged(p) && p.a > limit(p);
  /** Cut off from the main body while logistics are on (a real encirclement, not a quiet rear). */
  const pocket = (p, sup) => !sup[p.i] && engaged(p);
  /** attr[i]=1 when the army suffers attrition: pocket or overstack. */
  const attr = (P, sup) => { const r = new Uint8Array(P.length); for (const p of P) if (p.a > .05 && (pocket(p, sup) || overstack(p))) r[p.i] = 1; return r; };
""")
s.rep("return { ...CFG, compute, stat, farms, limit, attr, overstack, isHome, bordersEnemy };","return { ...CFG, compute, stat, farms, limit, attr, overstack, pocket, engaged, isHome, bordersEnemy };")
s.rep("const lim = Supply.limit(p), pocket = !SUPF[p.i], stack = Supply.overstack(p);","const lim = Supply.limit(p), cutOff = Supply.pocket(p, SUPF), stack = Supply.overstack(p);")
s.rep("if (pocket || stack) {","if (cutOff || stack) {");s.rep("if (pocket) { p.a = Math.max(0, p.a - p.m * Supply.ATTR_MAX); cut++; }","if (cutOff) { p.a = Math.max(0, p.a - p.m * Supply.ATTR_MAX); cut++; }")
s.save()
a=mk('js/ai.js');a.rep("if (p.a > lim) {","if (Supply.overstack(p)) {");a.save()
b=mk('js/boot.js');b.rep("const b = document.getElementById('snd');","const _load = loadFrom; loadFrom = function (s) { _load(s); if (PL >= 0) Menu.hide(); };\n  const b = document.getElementById('snd');");b.save()
# ---------------- audio: mp3 first
u=mk('js/audio.js');u.rep("['assets/audio/' + n + '.ogg', 'assets/audio/' + n + '.mp3']","['assets/audio/' + n + '.mp3', 'assets/audio/' + n + '.ogg']");u.save()
import json
m=json.load(open(R+'/assets/manifest.json',encoding='utf-8'))
for k in m['audio']:m['audio'][k]=[x for x in sorted(m['audio'][k],key=lambda x:x.endswith('.ogg'))]
json.dump(m,open(R+'/assets/manifest.json','w',encoding='utf-8'),indent=2,ensure_ascii=False)
# ---------------- index.html
h=mk('index.html')
h.rep('<div id="ldr">','<div id="mm"></div><div id="fps"></div>\n<div id="ldr">')
h.rep('"js/audio.js","js/game.js"','"js/audio.js","js/menu.js","js/game.js"')
h.save()
# ---------------- CSS
c=mk('css/style.css')
c.rx(r"\.btn\.pri:hover\{[^}]*\}","")  # re-added below
c.rx(r"\.btn:hover,\.tile:hover\{[^}]*\}",".btn:hover,.tile:hover{border-color:rgba(230,180,80,.6);background:rgba(230,180,80,.1);box-shadow:0 0 15px var(--gold);transform:scale(1.05)}\n.btn.pri:hover{background:linear-gradient(180deg,#f7d27a,#cf9833);box-shadow:0 0 18px var(--gold)}")
c.t=re.sub(r"(\n\.(?:btn|tile)\{[^}]*?)transition:all \.2s ease([;}])",lambda m:m.group(1)+"transition:all .2s ease-in-out"+m.group(2),c.t)
assert c.t.count('transition:all .2s ease-in-out')>=2
c.t+='''
/* main menu, setup, settings, ideas, fps */
#mm{position:fixed;inset:0;z-index:25;display:none;flex-direction:column;align-items:center;justify-content:center;padding:16px;background:rgba(10,15,24,.7);overflow:auto}
.mm-hero{margin-bottom:26px;padding:0}.mm-hero h1{font-size:clamp(34px,8vw,58px);letter-spacing:.14em;filter:drop-shadow(0 2px 14px rgba(230,180,80,.35))}.mm-hero p{max-width:460px;margin:10px auto 0;color:var(--ink2);font-weight:500}
.mm-btns{display:grid;gap:12px;width:min(320px,86vw)}
.mm-btn{min-height:54px;font-size:17px;font-weight:700;gap:10px}
.mm-box{width:min(600px,94vw);max-height:92vh;overflow:auto;padding:14px;border-radius:20px;background:rgba(14,21,36,.92);border:1px solid var(--ln);backdrop-filter:blur(10px);box-shadow:0 18px 60px rgba(0,0,0,.6)}
.mm-box .ch{margin-bottom:8px}
.switch{position:relative;display:inline-block;width:46px;height:26px;flex:none}.switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:1}
.switch span{position:absolute;inset:0;border-radius:26px;background:rgba(255,255,255,.16);transition:all .2s ease-in-out}
.switch span::before{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:all .2s ease-in-out}
.switch input:checked+span{background:var(--gold)}.switch input:checked+span::before{transform:translateX(20px)}
.switch input:focus-visible+span{box-shadow:0 0 0 2px var(--gold)}
.ideas{margin-top:10px}.idea{display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid rgba(255,255,255,.07)}
.like{display:inline-flex;align-items:center;gap:5px;min-width:56px;min-height:34px;padding:0 10px;border-radius:10px;border:1px solid var(--ln);background:rgba(255,255,255,.05);color:var(--ink2);font:700 13px inherit;cursor:pointer;transition:all .2s ease-in-out}
.like:hover{transform:scale(1.05);box-shadow:0 0 15px var(--gold)}.like.on{color:var(--gold);border-color:var(--gold)}
#fps{position:fixed;left:8px;bottom:8px;z-index:60;display:none;padding:3px 9px;border-radius:8px;background:rgba(10,15,24,.78);border:1px solid var(--ln);font:700 12px ui-monospace,Consolas,monospace;color:#8fe39b;pointer-events:none}
#fps.mid{color:#f2c765}#fps.bad{color:#ff8f88}
'''
# keep toasts above the menu
zt=re.search(r"#toast\{[^}]*z-index:(\d+)",c.t)
if not zt or int(zt.group(1))<=25:c.t=c.t.replace("#toast{","#toast{z-index:70;",1)
c.save()
print('v4 patched')
