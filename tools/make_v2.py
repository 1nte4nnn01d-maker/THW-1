"""v2 gameplay patch: VP capitulation, fog of war, combat width, inflation, manpower cap, supply limits, smart AI hook, UI polish."""
import re,sys
R=sys.argv[1];g=open(R+'/js/game.js',encoding='utf-8').read()
def rep(old,new):
    global g
    assert g.count(old)==1,('count %d: '%g.count(old))+old[:70];g=g.replace(old,new)
def rx(pat,new):
    global g
    g,n=re.subn(pat,lambda _:new,g,count=1,flags=re.S);assert n==1,'rx '+pat[:50]
CONST="""var SUR={},VP0=[],VIS=new Uint8Array(0),ATTR=new Uint8Array(0);
const INFL_T=5e5,MANP=.04,RCP=.02,DIV=10,CWIDTH=5,CAP_LOSS=.75,CAP_STEP=5;
const infl=o=>(M&&M[o]>INFL_T)?1+M[o]/1e6:1,armyCap=o=>eco(o).pp*MANP;
const calcVP0=()=>{const v=K.map(()=>0);PD.forEach(d=>{v[d[0]]+=d[5]||1});return v};
/* Fog of war: the exact army size is visible only in own provinces and provinces that border them. */
function fogCompute(){const v=new Uint8Array(P.length);for(const p of P)if(p.o==PL){v[p.i]=1;for(const j of p.n)v[j]=1}return v}
const seen=p=>{if(PL<0)return true;if(VIS.length!=P.length)VIS=fogCompute();return VIS[p.i]==1},armyLbl=p=>seen(p)?fmt(p.a):'?';
/* Combat width: at most CWIDTH divisions (DIV thousand each) fight at once; the rest wait in reserve and replace dead waves. */
function battle(aS,aM,dS,dM,W){let a=aS,d=dS,n=0;while(a>1e-6&&d>1e-6&&n++<400){const wa=Math.min(a,W),wd=Math.min(d,W),pa=wa*aM,pd=wd*dM;
 if(pa>pd){a-=wa-(pa-pd)/aM;d-=wd}else{d-=wd-(pd-pa)/dM;a-=wa}}return{a:Math.max(0,a),d:Math.max(0,d)}}
/* Victory Points capitulation: starts after >75% of the country's VP is lost, +max 5% per turn (>=20 turns), decays when VP are retaken. */
function lostVP(d){let l=0;for(const p of P)if(PD[p.i][0]==d&&p.o!=d)l+=p.vp;return VP0[d]?l/VP0[d]:0}
function occupier(d){const t={};for(const p of P)if(PD[p.i][0]==d&&p.o!=d)t[p.o]=(t[p.o]||0)+p.vp;let b=-1,m=0;for(const k in t)if(t[k]>m){m=t[k];b=+k}return b}
function capTick(){for(let d=0;d<N;d++){if(!cnt(d)){delete SUR[d];continue}const lost=lostVP(d);
 if(lost>CAP_LOSS){SUR[d]=Math.min(100,(SUR[d]||0)+Math.min(CAP_STEP,1+(lost-CAP_LOSS)*16));
  if(SUR[d]>=100){const by=occupier(d);delete SUR[d];if(by>=0)capitulate(d,by)}
  else if(d==PL&&!FFW)msg('Капитуляция: '+Math.round(SUR[d])+'%. Потеряно '+Math.round(lost*100)+'% VP — отбей провинции!')}
 else if(SUR[d]>0){SUR[d]=Math.max(0,SUR[d]-CAP_STEP);if(!SUR[d])delete SUR[d]}}}
function eco(o){"""
rep("function eco(o){",CONST)
rep("return{i,o,x:d[1]","return{i,o,vp:d[5]||1,x:d[1]")
rep("ar*.012*CS*","ar*.012*CS*infl(o)*")
rep("dco=()=>U[dt][2]*Math.max(.3,1+MOD.dc)","dco=()=>U[dt][2]*Math.max(.3,1+MOD.dc)*infl(PL)")
rep("Math.min(p.pop*.25,RC[PL],M[PL]/dco())","Math.min(p.pop*.25,RC[PL],M[PL]/dco(),Math.max(0,armyCap(PL)-eco(PL).ar))")
rep("if(n<.01){msg('Подвинь ползунок.');return}","if(n<.01){msg(eco(PL).ar>=armyCap(PL)-.01?'Лимит армии: '+Math.round(MANP*100)+'% населения.':'Подвинь ползунок.');return}")
rep("RC[o]+=e.r;","RC[o]=Math.min(RC[o]+e.r,e.pp*RCP);")
# attack with combat width
rx(r"function attack\(a,b\)\{.*?(?=\nfunction push\()","""function attack(a,b){const A=P[a],B=P[b],o=A.o,d=B.o,s=A.a*.9;A.a-=s;let as=0;B.n.forEach(j=>{if(P[j].o==d)as+=P[j].a});
 const aM=am(o)*(ATTR[a]?.5:1),dM=dm(d)*1.25*(ATTR[b]?.5:1),dT=B.a+.12*as,r=battle(s,aM,dT,dM,CWIDTH*DIV);
 if(r.d<=1e-6&&r.a>0){B.o=o;B.a=r.a*(1+MODS[o].conq);B.m=B.a*1.5;B.pop*=.97;WG[wk(o,d)]=(WG[wk(o,d)]||0)+1;if(o==PL){msg('Победа! Провинция взята у '+K[d][0]+'.');ach('conq1')}if(d==PL)msg(K[o][0]+' захватил твою провинцию!');
  if(cap[d]==b&&(d==PL||o==PL))msg('Столица '+K[d][0]+' взята: это крупная потеря VP, но страна ещё сопротивляется.');
  if(!cnt(d)){Object.keys(W).forEach(k=>{if(k.split('-').includes(String(d)))delete W[k]});Object.keys(J).forEach(k=>{if(k.split('>').includes(String(d)))delete J[k]})}check()}
 else{B.a*=Math.max(.1,r.d/dT);if(o==PL)msg('Атака отбита: на фронте '+Math.round(CWIDTH)+' див. в линии, у врага осталось '+fmt(B.a)+' тыс.')}}""")
rep("function push(o,k,lim){","function push(o,k,lim,skip){");rep("||(lim&&n>=lim))continue","||(lim&&n>=lim)||(skip&&skip.has(i)))continue")
rx(r"for\(const ds of Object\.keys\(CAPT\)\)\{.*?capitulate\(d,c\.by\)\}","capTick();")
rep("CAPT={};AL={};LWA=-99;","CAPT={};SUR={};VP0=calcVP0();AL={};LWA=-99;");rep("CAPT=d.CAPT||{};","CAPT=d.CAPT||{};SUR=d.SUR||{};VP0=calcVP0();");rep("MOOD,CAPT,AL,LWA,","MOOD,CAPT,SUR,AL,LWA,")
rx(r"\n if\(pool\.length&&at\.length\)for\(let k=0;k<5.*?push\(o,1\.6,3\+Math\.floor\(cp\.length/12\)\)\}"," aiArmy(o,cp,e,bord,foes,at)}")
rep("SUPF=Supply.compute(P,cap);FARMS=Supply.farms(P,N);for(const p of P)ST","SUPF=Supply.compute(P,cap);ATTR=Supply.attr(P,SUPF);VIS=fogCompute();FARMS=Supply.farms(P,N);for(const p of P)ST")
rep("SS=(SUPF=Supply.compute(P,cap),Supply.stat(P,SUPF,PL));","SS=(SUPF=Supply.compute(P,cap),ATTR=Supply.attr(P,SUPF),VIS=fogCompute(),Supply.stat(P,SUPF,PL));")
rep("txt(fmt(p.a),x,y,fs,'#fff','700')","txt(armyLbl(p),x,y,fs,'#fff','700')");rep("txt(fmt(p.a),x,y,Math.min(13,R*.9),'#fff','700')","txt(armyLbl(p),x,y,Math.min(13,R*.9),'#fff','700')")
rep("<b>'+fmt(p.a)+'</b><small>из '+fmt(Math.max(p.m,p.a))+'</small>","<b>'+armyLbl(p)+'</b><small>'+(seen(p)?'из '+fmt(Math.max(p.m,p.a)):'туман войны')+'</small>")
rep("Окружение</span>');","Окружение</span>');if(p.o==PL&&p.a>.05&&SUPF[sel]&&ATTR[sel])tg.push('<span class=\"tag dng\">'+I('supply')+'Истощение: лимит '+Math.round(Supply.limit(p))+'</span>');")
rep("иначе они вымрут.');}","иначе они вымрут.')}if(SUR[PL])h.push('Капитуляция: '+Math.round(SUR[PL])+'%. Верни потерянные провинции.');if(infl(PL)>1)h.push('Инфляция ×'+infl(PL).toFixed(2)+': найм и содержание армии дорожают. Потрать казну.');") if "иначе они вымрут.');}" in g else None
open(R+'/js/game.js','w',encoding='utf-8').write(g)
# ---- supply.js: per-province supply limit, attrition, no healing under attrition
s=open(R+'/js/supply.js',encoding='utf-8').read()
s=s.replace("HEAL_CAP: .30 };","HEAL_CAP: .30,\n                LIM_BASE: 30, LIM_POP: .012, LIM_CAMP: 15, LIM_CAPITAL: 60,  // supply limit of a province (thousand troops)\n                ATTR_MIN: .05, ATTR_MAX: .10 };  // attrition per turn: overstack 5..10%, pocket 10%")
s=s.replace("  return { ...CFG, compute, stat, farms };","""  const limit = p => CFG.LIM_BASE + CFG.LIM_POP * p.pop + CFG.LIM_CAMP * p.b[2] + (typeof cap !== 'undefined' && cap[p.o] === p.i ? CFG.LIM_CAPITAL : 0);
  /** attr[i]=1 when the army is cut off from the main body or exceeds the province's supply limit. */
  const attr = (P, sup) => { const r = new Uint8Array(P.length); for (const p of P) if (p.a > .05 && (!sup[p.i] || p.a > limit(p))) r[p.i] = 1; return r; };
  return { ...CFG, compute, stat, farms, limit, attr };""")
s=re.sub(r"/\*\* One turn of army upkeep.*?\n\}\n(?=\nlet DISB)","""/** One turn of army upkeep for country o: attrition (cut off / over the supply limit) or healing from farms. */
function armyTurn(o, cp) {
  const fN = FARMS[o] / Math.max(1, cp.length); let cut = 0, over = 0;
  for (const p of cp) {
    if (p.a <= 0) continue;
    const lim = Supply.limit(p), pocket = !SUPF[p.i], stack = p.a > lim;
    if (pocket || stack) {                              // "Истощение": no recovery, -50% combat efficiency (see attack())
      if (pocket) { p.a = Math.max(0, p.a - p.m * Supply.ATTR_MAX); cut++; }
      else { p.a -= p.a * Math.min(Supply.ATTR_MAX, Supply.ATTR_MIN + Supply.ATTR_MIN * (p.a - lim) / lim); over++; }
      if (p.a < .001) { p.a = 0; p.m = 0; }
      continue;
    }
    const miss = p.m - p.a; if (miss <= 0) continue;
    const rate = Math.min(Supply.HEAL_CAP, (Supply.HEAL_BASE + Supply.HEAL_FARM * Math.min(p.b[0], 5) + Supply.HEAL_NATION * Math.min(fN, 2)) * (1 + MODS[o].heal));
    // never back to 100% in one turn: at most 60% of the missing strength (top-off only for the last 2%)
    const h = Math.min(p.m * rate, miss <= p.m * .02 ? miss : miss * .6, RC[o]);
    if (h > 0) { p.a += h; RC[o] -= h; }
  }
  if (o === PL && !FFW) {
    if (cut) msg('Окружение: ' + cut + ' арм. без снабжения теряют ' + Math.round(Supply.ATTR_MAX * 100) + '% силы за ход.');
    if (over) msg('Истощение: ' + over + ' стек(ов) выше лимита снабжения теряют 5–10% в ход.');
  }
}
""",s,flags=re.S)
open(R+'/js/supply.js','w',encoding='utf-8').write(s)
# ---- index.html: load ai.js
h=open(R+'/index.html',encoding='utf-8').read();h=h.replace('"js/supply.js",','"js/supply.js","js/ai.js",');assert 'ai.js' in h;open(R+'/index.html','w',encoding='utf-8').write(h)
print('v2 patched')
