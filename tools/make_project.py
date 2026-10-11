"""Split the single-file game into a modular project and apply the gameplay patches (each patch is asserted)."""
import re,sys,json
SRC=sys.argv[1];OUT=sys.argv[2]
s=open(SRC,encoding='utf-8').read()
m=re.search(r'<style>(.*?)</style>',s,re.S);css=m.group(1)
sc=re.search(r'<script>(.*)</script>',s,re.S);js=sc.group(1)
head=s[:m.start()];mid=s[m.end():sc.start()]
def rep(old,new,cnt=1):
    global js
    assert js.count(old)>=1,'missing: '+old[:70]
    js=js.replace(old,new) if cnt==0 else js.replace(old,new,cnt)
def rx(pat,new,flags=re.S):
    global js
    js,n=re.subn(pat,lambda _:new,js,count=1,flags=flags);assert n==1,'rx missing: '+pat[:60]
def span(name):
    i=js.index(name+'=[');j0=i+len(name)+1;d=0
    for j in range(j0,len(js)):
        d+=(js[j]=='[')-(js[j]==']')
        if d==0:return j+1
# 1. data comes from WORLD (fetched JSON + TopoJSON), no coordinates in code
a=js.index('const MW=');e=span('CAPS');assert js[e]==';';k=js.index('const K=[',e);e2=span('K')
js=js[:a]+'const {MW,MH,K,PD,E,CAPS}=WORLD,SC=2;'+js[e2+1:]
rx(r'const pid=new Int16Array\(MW\*MH\)\.fill\(-1\);\{.*?p\+=n\}\}','const pid=WORLD.pid;')
rep("fl=o=>K[o][1].replace(/./g,c=>String.fromCodePoint(127397+c.charCodeAt(0)))","fl=o=>ASSETS.flag(o)")
rep("return{o,x:d[1]","return{i,o,x:d[1]")
# 2. remove hunger
rep("let gd=0,f=0,c=0,r=0,cv=0,ml=0,pp=0,ar=0;","let gd=0,c=0,r=0,pp=0,ar=0;")
rep("f+=p.pop*.0016*(1+.5*p.b[0]);","");rep("cv+=p.pop*.001;ml+=p.a*.05;","")
rep("f*=1+m.food}return{gd,f,c,r,cv,ml,pp,ar,net:","}return{gd,c,r,pp,ar,net:")
rep("M,F,RC,init","M,RC,init");rep("M=[];F=[];RC=[]","M=[];RC=[]");rep("F[o]=e.cv*5;","")
rep("bal=e.f-e.cv-e.ml,bord","bal=0,bord");rep("let bal=e.f-e.cv-e.ml,n=0;","let bal=0,n=0;")
rep("need=e.f<e.cv+e.ml,","need=false,");rep("g.food*(need?2.2:.7)*CS+","");rep("a.food*(need?3.5:1)*CS+","")
rep("if(s.food)l.push(s.food+' еды');","");rep("F[PL]+=a.food-g.food;F[o]+=g.food-a.food;","")
rep("g.food||","");rep("a.food||","");rep("food:0,","",0)
rep("+slr('Еда','wheat','food','g',F[PL])","");rep("+slr('Еда','wheat','food','a',F[o])","")
rep("if(o==PL){const bal=e.f-e.cv-e.ml;if(bal<0&&F[o]+bal*3<0&&turn%3==0)msg('Еды не хватает: −'+fmt(-bal)+' за ход. Построй фермы.')}","")
rep("RC[o]+=e.r;F[o]+=e.f-e.cv-e.ml;","RC[o]+=e.r;")
rep("if(F[o]<0){F[o]=0;cp.forEach(p=>p.a*=.92);if(o==PL)msg('Голод! Армия тает. Построй фермы.')}else cp.forEach(p=>{if(p.pop<p.pc&&e.f>e.cv+e.ml)p.pop*=1+.003*Math.max(0,1+MODS[o].pop)});","cp.forEach(p=>{if(p.pop<p.pc)p.pop*=1+.003*Math.max(0,1+MODS[o].pop)});")
rx(r"for\(const p of cp\)if\(p\.a<p\.m&&RC\[o\]>0\)\{const h=Math\.min\(p\.m-p\.a,Math\.max\(p\.m\*\.1\*\(1\+MODS\[o\]\.heal\),\.05\),RC\[o\]\);p\.a\+=h;RC\[o\]-=h\}","armyTurn(o,cp);")
rep("function nextTurn(){if(over||PL<0)return;ST=K.map(()=>0);","function nextTurn(){if(over||PL<0)return;ST=K.map(()=>0);SUPF=Supply.compute(P,cap);FARMS=Supply.farms(P,N);")
rx(r"\{t:'Великий голод'.*?popAll\(PL,\.97\)\}\}\]\},","")
rep("food:['Еда','%',1],","");rep("'rec','food','atk'","'rec','atk'");rep("еда +10%, ","");rep("Много еды и рекрутов","Много рекрутов")
js=re.sub(r",?food:-?[\d.]+,?",lambda m_:(',' if m_.group(0).startswith(',') and m_.group(0).endswith(',') else ''),js)
rep("M,F,RC,sold","M,RC,sold");rep("F=d.F;","")
# 3. supply UI
rep("fd=e.f-e.cv-e.ml,ratio=e.cv?e.f/e.cv:0;","SS=(SUPF=Supply.compute(P,cap),Supply.stat(P,SUPF,PL));")
rep("chip('wheat',ratio.toFixed(2),I('loaf')+fmt(e.ml),fd>=0?'':'dn')","chip('supply',(SS.all-SS.cut)+'/'+SS.all,'в котле: '+SS.cut,SS.cut?'dn':'')")
rep("st('wheat',Math.round(F[PL]),'запас еды')","(()=>{const s=Supply.stat(P,SUPF,PL);return st('supply',(s.all-s.cut)+'/'+s.all,'армий снабжается')})()")
rep("if(e.f<e.cv+e.ml)h.push('Не хватает еды: построй фермы в «Экономике».');","{const s=Supply.stat(P,SUPF,PL);if(s.cut)h.push('Армии в котле: верни связь с территорией страны, иначе они вымрут.')}")
rep("Авто: фермы, если не хватает еды, иначе заводы и лагеря.","Авто: заводы и лагеря. Фермы ускоряют лечение армий.")
rep("tile('helmet','Призыв','ct=ct==2?0:2;showCard()',ct==2?'on':'')+tile('list','Меню','more()')","tile('helmet','Призыв','ct=ct==2?0:2;showCard()',ct==2?'on':'')+tile('disband','Распустить<br>дивизию','disband('+sel+')','dng',!(p.a>.05),'Распустить армию в провинции')+tile('list','Меню','more()')")
rep("""if(p.mi)tg.push('<span class="tag">Малая страна</span>');""","""if(p.o==PL&&p.a>.05&&SUPF.length&&!SUPF[sel])tg.push('<span class="tag dng">'+I('supply')+'Окружение</span>');""")
# 4. icons instead of glyphs
rep("Object.assign(IC,{close:","""Object.assign(IC,{supply:['M12 2 3 6.5v11L12 22l9-4.5v-11zM12 4.3l5.6 2.8L12 9.9 6.4 7.1zM5 8.7l6 3v7.7l-6-3zM13 19.4v-7.7l6-3v7.7z','#8fd19e'],check:['M9.5 16.6 5.4 12.5 4 13.9l5.5 5.5L20 8.9 18.6 7.5z','#7fe0a4'],disband:['M12 2 3.5 5.5V11c0 5.2 3.6 9.3 8.5 11 4.9-1.7 8.5-5.8 8.5-11V5.5zM5.2 4.8l14 14-1.4 1.4-14-14z','#e0605e'],sound:['M3 9v6h4l5 4V5L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z','currentColor'],mute:['M3 9v6h4l5 4V5L7 9zm13.3 1.3 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z','currentColor'],close:""")
print('check marks:',js.count('✓'))
js=js.replace("' ✓'","' '+I('check')").replace("✓","")
# outputs
extra="""
.flag{display:inline-block;vertical-align:middle;width:1.35em;height:.92em;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.2)}
.flg .flag{width:36px;height:24px}.fg span .flag{width:26px;height:18px}
#ldr{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0a0f18;color:#e9edf6;z-index:99;font:600 15px Inter,system-ui,sans-serif;text-align:center;padding:24px;line-height:1.6}
#snd .ic{width:22px;height:22px}
"""
open(OUT+'/css/style.css','w',encoding='utf-8').write(css.strip()+extra)
open(OUT+'/js/game.js','w',encoding='utf-8').write(js)
mid=mid.replace('<div id="zb">','<div id="zb"><button id="snd" aria-label="Звук (M)" title="Звук (M)"></button>',1);assert 'id="snd"' in mid
idx=head+'<link rel="stylesheet" href="css/style.css">'+mid+'<div id="ldr">Загрузка карты…</div>\n<script src="js/loader.js"></script>\n<script>Loader.start(["js/assets.js","js/supply.js","js/audio.js","js/game.js","js/boot.js"],{tolerance:.75})</script>\n</body></html>\n'
open(OUT+'/index.html','w',encoding='utf-8').write(idx)
print('ok; sheet css:',re.findall(r'\.sheet[^{]*\{',css)[:4],'| game.js KB',len(js)//1024,'| css KB',len(css)//1024)
