
const {MW,MH,K,PD,E,CAPS}=WORLD,SC=2;
const CS=50,FACT=1.75;const U=[["Ополчение",1,.5*CS,0],["Регулярная",1.6,2*CS,1],["Элита",2.5,5*CS,2],["Танки",4,9*CS,3]];
const BL=[["Ферма","wheat","#3fae4f"],["Завод","factory","#e0b020"],["Лагерь","tent","#d04a3f"]];
const FO=[["Индустриализация",300*CS,"+30% монет"],["Мобилизация",350*CS,"+25% призыва"],["Реформа армии",400*CS,"+1 уровень технологий"]];
const $=id=>document.getElementById(id),cv=$('cv'),lb=$('lb'),lg=lb.getContext('2d'),wrap=$('wrap');
const pid=WORLD.pid;
const L=Uint8Array.from(pid,v=>v>=0?1:0),N=K.length,fl=o=>ASSETS.flag(o);
const WS=K.map(()=>0),WT=PD.map((d,i)=>{const r=Math.sin(i*12.9898)*43758.5453,c=PD[CAPS[d[0]]],w=d[3]*(.7+.6*(r-Math.floor(r)))*(CAPS.includes(i)?1.8:1)/(1+Math.hypot(d[1]-c[1],d[2]-c[2])/120);WS[d[0]]+=w;return w});
const P=PD.map((d,i)=>{const o=d[0],pop=K[o][2]*1000*WT[i]/WS[o];return{i,o,vp:d[5]||1,x:d[1],y:d[2],ar:d[3],mi:!!d[4],pop,g:K[o][3]*WT[i]/WS[o],a:0,m:0,b:[0,0,0],n:new Set(),pc:pop*2}});
E.forEach(([a,b])=>{P[a].n.add(b);P[b].n.add(a)});const cap=CAPS,capSet=new Set(cap);const MIC=[];P.forEach((p,i)=>{if(p.mi)MIC.push(i)});
const A0=K.map(k=>.039*Math.sqrt(k[2]*1000*k[3]));P.forEach((p,i)=>{p.a=A0[p.o]*p.pop/(K[p.o][2]*1000)*(capSet.has(i)?1.3:1);p.m=p.a});
let PL=-1,turn=1,sel=-1,ct=0,over=false,dt=0,ST=[],up,fs,rules,W,J,sold,M,RC,init,PA,WG,REL,MOOD,DP,CAPT,AL,LWA,RLT,ALC,BOUGHT;
const wk=(a,b)=>Math.min(a,b)+'-'+Math.max(a,b),atWar=(a,b)=>wk(a,b) in W,pact=(a,b)=>PA[wk(a,b)]>turn,cnt=o=>{let c=0;for(const p of P)if(p.o==o)c++;return c};
const Q=K.map(k=>Math.min(1.6,Math.max(.5,Math.pow(k[3]/k[2]/20,.3))));const tech=()=>Math.min(3,up.tech+fs[2]+MOD.tech),am=o=>(1+(o==PL?up.atk*.1:0)+MODS[o].atk)*Q[o],dm=o=>(1+(o==PL?up.def*.1:0)+MODS[o].def)*Q[o];
const fmt=n=>n>=100?Math.round(n):n>=10?n.toFixed(0):n.toFixed(1),fp=n=>n>=1000?(n/1000).toFixed(1)+' млн':Math.round(n)+' тыс.';
const bc=(p,k)=>Math.round(20*CS*(1+p.g*.015)*(1+.5*p.b[k])*Math.max(.3,1+MODS[p.o].bc)),price=i=>{const p=P[i];return Math.round(((15+p.g*.6)*(1+.5*sold[p.o])+p.a*1.5)*CS*(1+.15*BOUGHT)*Math.max(.3,1+MOD.buy))};
var SUR={},VP0=[],VIS=new Uint8Array(0),ATTR=new Uint8Array(0),NEAR=new Set();
const INFL_T=5e5,MANP=.04,RCP=.02,DIV=10,CWIDTH=5,CAP_LOSS=.75,CAP_STEP=5;
const infl=o=>1+Math.max(0,(((M&&M[o])||0)-INFL_T)/1e6),armyCap=o=>eco(o).pp*MANP;
const calcVP0=()=>{const v=K.map(()=>0);PD.forEach(d=>{v[d[0]]+=d[5]||1});return v};
/* Fog of war: the exact army size is visible only in own provinces and provinces that border them. */
function fogCompute(){const v=new Uint8Array(P.length);NEAR=new Set();for(const p of P)if(p.o==PL){v[p.i]=1;for(const j of p.n){v[j]=1;if(P[j].o!=PL)NEAR.add(P[j].o)}}return v}
const seen=p=>{if(PL<0)return true;if(VIS.length!=P.length)VIS=fogCompute();return VIS[p.i]==1},armyLbl=p=>seen(p)?fmt(p.a):'';
/* Intelligence: exact numbers for you and your allies, a +-20% range for bordering countries, nothing for the rest. */
const intel=o=>{if(PL<0||o==PL||allied(PL,o))return 2;if(VIS.length!=P.length)VIS=fogCompute();return NEAR.has(o)?1:0},
 kfmt=n=>n>=1000?(n/1000).toFixed(1).replace(/\.0$/,'')+' млн':Math.round(n)+'к',
 rnd=(o,k)=>{const x=Math.sin(o*12.9898+turn*78.233+k*37.719)*43758.5453;return x-Math.floor(x)},
 armyBounds=o=>{const v=eco(o).ar;return[Math.round(v*(1-.2*rnd(o,1))),Math.round(v*(1+.2*rnd(o,2)))]},
 intelArmy=o=>{const l=intel(o);if(l==2){const v=eco(o).ar;return v>=1000?kfmt(v):fmt(v)+'к'}if(!l)return'Неизвестно';const[a,b]=armyBounds(o);return a==b?'≈'+kfmt(a):kfmt(a)+' – '+kfmt(b)},
 intelKey=o=>{const l=intel(o);if(l==2)return eco(o).ar;if(!l)return-1;const[a,b]=armyBounds(o);return(a+b)/2};
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
function eco(o){let gd=0,c=0,r=0,pp=0,ar=0;for(const p of P)if(p.o==o){c+=CS*(1+p.g*.015)*(1+(FACT+MODS[o].fact)*p.b[1]);gd+=p.g*(1+.6*p.b[1]);r+=p.pop*.0002+p.pop*.0012*p.b[2];pp+=p.pop;ar+=p.a}
 {const m=MODS[o];c*=1+.3*(o==PL?fs[0]:AFS[o][0]);c*=1+m.inc;if(m.tax)for(const p of P)if(p.o==o)c+=CS*m.tax*p.pop*.0001;r*=1+m.rec;}return{gd,c,r,pp,ar,net:c-(rules.upkeep?ar*.012*CS*infl(o)*Math.max(.3,1+MODS[o].up):0)}}
function reset(){up={tech:0,atk:0,def:0};fs=[0,0,0];rules={buy:true,upkeep:true};W={};J={};PA={};WG={};CAPT={};SUR={};VP0=calcVP0();AL={};LWA=-99;RLT={};ALC={};BOUGHT=0;ID=newID();PM=[];PRJ=[];ACH={};LOGS=[];EV={last:-99,cur:null,o:-1,next:150+Math.round(Math.random()*40-20)};initAI();calcMod();REL=K.map((k,o)=>45+((o*29)%20));MOOD=K.map(()=>0);sold=K.map(()=>0);M=[];RC=[];turn=1;over=false;sel=-1;
 K.forEach((k,o)=>{const e=eco(o);M[o]=e.c*8;RC[o]=e.r*10});init=K.map((k,o)=>cnt(o))}

// ---------- icons (drawn, no emoji) ----------
const IC={coin:['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z','#e8b923'],
wheat:['M11.2 9h1.6v13h-1.6zM12 1.5c1.7 1.4 2.5 3.1 2.5 5.2-1.7-.5-2.5-2.3-2.5-5.2zM12 1.5C10.3 2.9 9.5 4.6 9.5 6.7c1.7-.5 2.5-2.3 2.5-5.2zM12 7.5c2 .8 3.3 2.4 3.5 4.7-2-.5-3.3-2.2-3.5-4.7zM12 7.5c-2 .8-3.3 2.4-3.5 4.7 2-.5 3.3-2.2 3.5-4.7zM12 13c2 .8 3.3 2.4 3.5 4.7-2-.5-3.3-2.2-3.5-4.7zM12 13c-2 .8-3.3 2.4-3.5 4.7 2-.5 3.3-2.2 3.5-4.7z','#3fae4f'],
loaf:['M2.5 18.5c0-6 4-10.5 9.5-10.5s9.5 4.5 9.5 10.5v1.5h-19z','#d98b3a'],
helmet:['M12 2 3.5 5.5V11c0 5.2 3.6 9.3 8.5 11 4.9-1.7 8.5-5.8 8.5-11V5.5zM12 5l5.5 2.3V11c0 3.4-2.2 6.2-5.5 7.6V5z','#8fb2e8'],
flag:['M4.5 2h2v20h-2zM7.5 3h12.5l-3.3 4.7 3.3 4.8H7.5z','#e8e4d8'],
people:['M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-5 0-9 2.6-9 6v1.5h18V20c0-3.4-4-6-9-6z','#cfd6e4'],
build:['M12 2 1.5 11.5H4.5V21h6v-6h3v6h6v-9.5h3z','#d9a441'],
swords:['M12 2 1.5 21h21zM11 9h2v6h-2zM11 17h2v2h-2z','#e0605e'],
scroll:['M6 2h12a2 2 0 0 1 2 2v13a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V4a2 2 0 0 1 1-2zM8 7h8v1.6H8zM8 11h8v1.6H8zM8 15h5v1.6H8z','#e8dcc0'],
dove:['M4.5 2h2v20h-2zM7.5 3h12.5l-3.3 4.7 3.3 4.8H7.5z','#ffffff'],
factory:['M2 21V10l6 4v-4l6 4V3h5v18z','#e0b020'],
tent:['M12 3 1.5 20.5h21zM12 9.5 8 20.5h8z','#d04a3f'],sword2:['M20.50 3.50L19.72 6.40L11.94 14.18L13.85 16.09L12.58 17.36L10.32 15.10L6.92 18.49L7.42 18.99L6.00 20.40L3.60 18.00L5.01 16.58L5.51 17.08L8.90 13.68L6.64 11.42L7.91 10.15L9.82 12.06L17.60 4.28zM6.40 4.28L14.18 12.06L16.09 10.15L17.36 11.42L15.10 13.68L18.49 17.08L18.99 16.58L20.40 18.00L18.00 20.40L16.58 18.99L17.08 18.49L13.68 15.10L11.42 17.36L10.15 16.09L12.06 14.18L4.28 6.40L3.50 3.50z','#e0453d','nonzero'],deal:['M3 8h14l-3.5-3.5L15 3l6 6-6 6-1.5-1.5L17 10H3zM21 16H7l3.5 3.5L9 21l-6-6 6-6 1.5 1.5L7 14h14z','#6db3f2']};
const IP={};for(const k in IC)IP[k]=new Path2D(IC[k][0]);
const I=n=>'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="'+(IC[n][2]||'evenodd')+'" fill="'+IC[n][1]+'" d="'+IC[n][0]+'"/></svg>';
// ---------- extra icons ----------
Object.assign(IC,{supply:['M12 2 3 6.5v11L12 22l9-4.5v-11zM12 4.3l5.6 2.8L12 9.9 6.4 7.1zM5 8.7l6 3v7.7l-6-3zM13 19.4v-7.7l6-3v7.7z','#8fd19e'],check:['M9.5 16.6 5.4 12.5 4 13.9l5.5 5.5L20 8.9 18.6 7.5z','#7fe0a4'],disband:['M12 2 3.5 5.5V11c0 5.2 3.6 9.3 8.5 11 4.9-1.7 8.5-5.8 8.5-11V5.5zM5.2 4.8l14 14-1.4 1.4-14-14z','#e0605e'],sound:['M3 9v6h4l5 4V5L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z','currentColor'],mute:['M3 9v6h4l5 4V5L7 9zm13.3 1.3 1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z','currentColor'],close:['M6.4 4.9 12 10.5l5.6-5.6 1.5 1.5-5.6 5.6 5.6 5.6-1.5 1.5-5.6-5.6-5.6 5.6-1.5-1.5 5.6-5.6-5.6-5.6z','currentColor'],play:['M7 4.5v15l12-7.5z','currentColor'],
star:['M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.1 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z','#ffd24a'],
hand:['M1.28 13.38L10.31 10.79L11.52 15.02L2.49 17.61zM13.69 10.79L22.72 13.38L21.51 17.61L12.48 15.02zM8.70 11.90L15.30 11.90L15.30 16.90L8.70 16.90zM8.75 16.70L10.45 16.70L10.45 19.30L8.75 19.30zM11.15 17.20L12.85 17.20L12.85 20.00L11.15 20.00zM13.55 16.70L15.25 16.70L15.25 19.30L13.55 19.30zM11.05 1.00L12.95 1.00L12.95 7.40L11.05 7.40zM8.80 3.25L15.20 3.25L15.20 5.15L8.80 5.15z','#58d68d','nonzero'],
insult:['M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM7 9h10v2H7z','#e5534b'],
chain:['M9 7a5 5 0 0 0 0 10h2v-2H9a3 3 0 0 1 0-6h2V7zM15 7h-2v2h2a3 3 0 0 1 0 6h-2v2h2a5 5 0 0 0 0-10zM8 11h8v2H8z','#62a4ff'],
trend:['M3 19h18v2H3zM5 11h3v7H5zM10.5 6h3v12h-3zM16 9h3v9h-3z','currentColor'],list:['M4 5h16v2H4zM4 11h16v2H4zM4 17h16v2H4z','currentColor']});
for(const k in IC)if(!IP[k])IP[k]=new Path2D(IC[k][0]);
// ---------- view: WebGL (GPU) ----------
const V={s:1,x:0,y:0},DPR=Math.min(window.devicePixelRatio||1,2.5),minS=()=>Math.max(wrap.clientWidth/MW,.2),FF='"Exo 2","Trebuchet MS",Verdana,sans-serif';
const gl=cv.getContext('webgl',{antialias:false,alpha:false,preserveDrawingBuffer:true});
if(!gl)document.body.insertAdjacentHTML('afterbegin','<p style="padding:20px">Браузер не поддерживает WebGL.</p>');
const FS='precision highp float;uniform sampler2D uId,uLut,uOwn;uniform vec2 uTex,uRes,uOff,uBw;uniform float uScale,uSel,uPl,uSh;'+
'float idAt(vec2 c){if(c.x<0.||c.y<0.||c.x>=uTex.x||c.y>=uTex.y)return 0.;vec4 v=texture2D(uId,(c+.5)/uTex)*255.;return floor(v.r+.5)+floor(v.g+.5)*256.;}'+
'float sid(vec2 p){vec2 b=floor(p-.5),f=p-.5-b;float a=idAt(b),e=idAt(b+vec2(1.,0.)),c=idAt(b+vec2(0.,1.)),d=idAt(b+vec2(1.,1.));'+
'float wa=(1.-f.x)*(1.-f.y),we=f.x*(1.-f.y),wc=(1.-f.x)*f.y,wd=f.x*f.y;'+
'float sa=wa+(a==e?we:0.)+(a==c?wc:0.)+(a==d?wd:0.);float se=we+(e==a?wa:0.)+(e==c?wc:0.)+(e==d?wd:0.);'+
'float sc=wc+(c==a?wa:0.)+(c==e?we:0.)+(c==d?wd:0.);float sd=wd+(d==a?wa:0.)+(d==e?we:0.)+(d==c?wc:0.);'+
'float m=max(max(sa,se),max(sc,sd));if(sa>=m)return a;if(se>=m)return e;if(sc>=m)return c;return d;}'+
'vec2 lu(float id){float i=id-1.;return vec2((mod(i,64.)+.5)/64.,(floor(i/64.)+.5)/64.);}'+
'float nb(vec2 p,vec2 dd,float id,float oi,float k){float n=sid(p+dd*k);if(n==id)return 0.;if(n<.5)return 3.;float on=floor(texture2D(uOwn,lu(n)).r*255.+.5);if(on==oi)return 1.;return(on==uPl||oi==uPl)?4.:2.;}'+
'void main(){vec2 f=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);vec2 p=(f-uOff)/uScale;float id=sid(p);vec3 col;'+
'if(id<.5){col=vec3(.043,.133,.2);float ks=uSh/uScale;float near=0.;if(sid(p+vec2(ks,0.))>.5||sid(p-vec2(ks,0.))>.5||sid(p+vec2(0.,ks))>.5||sid(p-vec2(0.,ks))>.5)near=1.;col=mix(col,vec3(.075,.205,.3),near*.85);'+
'float gx=abs(p.x/100.-floor(p.x/100.+.5))*100.*uScale;float gy=abs(p.y/100.-floor(p.y/100.+.5))*100.*uScale;if(gx<.7||gy<.7)col+=.014;}'+
'else{vec4 L=texture2D(uLut,lu(id));col=L.rgb;float fl=L.a*255.;if(fl>200.)col+=.18;else if(fl>100.)col+=.06;'+
'float oi=floor(texture2D(uOwn,lu(id)).r*255.+.5);float kc=uBw.y/uScale,kp=uBw.x/uScale;'+
'float sc=max(max(nb(p,vec2(1.,0.),id,oi,kc),nb(p,vec2(-1.,0.),id,oi,kc)),max(nb(p,vec2(0.,1.),id,oi,kc),nb(p,vec2(0.,-1.),id,oi,kc)));'+
'float sp=max(max(nb(p,vec2(1.,0.),id,oi,kp),nb(p,vec2(-1.,0.),id,oi,kp)),max(nb(p,vec2(0.,1.),id,oi,kp),nb(p,vec2(0.,-1.),id,oi,kp)));'+
'if(sc>3.5)col=vec3(.96,.78,.33);else if(sc>2.5)col=mix(col,vec3(.02,.07,.11),.9);else if(sc>1.5)col=vec3(.03,.04,.07);else if(sp>.5)col*=.68;'+
'if(id==uSel&&(sc>.5||sp>.5))col=vec3(1.,.97,.82);}'+
'gl_FragColor=vec4(col,1.);}';
const lutD=new Uint8Array(64*64*4),ownD=new Uint8Array(64*64*4),loc={};let texLut,texOwn;
if(gl){const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
 const bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
 ['uId','uLut','uOwn','uTex','uRes','uOff','uBw','uScale','uSel','uPl','uSh'].forEach(n=>loc[n]=gl.getUniformLocation(pr,n));
 const tex=(u,w,h,d)=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,d);
  [[gl.TEXTURE_MIN_FILTER,gl.NEAREST],[gl.TEXTURE_MAG_FILTER,gl.NEAREST],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]].forEach(([a,b])=>gl.texParameteri(gl.TEXTURE_2D,a,b));return t};
 const idD=new Uint8Array(MW*MH*4);for(let i=0;i<pid.length;i++){const v=pid[i]+1;idD[4*i]=v&255;idD[4*i+1]=v>>8;idD[4*i+3]=255}
 tex(0,MW,MH,idD);texLut=tex(1,64,64,lutD);texOwn=tex(2,64,64,ownD);
 gl.uniform1i(loc.uId,0);gl.uniform1i(loc.uLut,1);gl.uniform1i(loc.uOwn,2);gl.uniform2f(loc.uTex,MW,MH)}
function hsl(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return[f(0)*255,f(8)*255,f(4)*255]}
const ocol=o=>'rgb('+hsl((o*137.508)%360,o==PL?62:44,46+(o%4)*4).map(Math.round)+')';
function draw(){if(!gl)return;P.forEach((p,i)=>{const c=hsl((p.o*137.508)%360,p.o==PL?62:44,46+(p.o%4)*4+(i%2)*3);lutD[4*i]=c[0];lutD[4*i+1]=c[1];lutD[4*i+2]=c[2];lutD[4*i+3]=i==sel?255:(sel>=0&&P[sel].n.has(i)?170:0);ownD[4*i]=p.o;ownD[4*i+3]=255});
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,texLut);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,64,64,gl.RGBA,gl.UNSIGNED_BYTE,lutD);
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,texOwn);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,64,64,gl.RGBA,gl.UNSIGNED_BYTE,ownD);req()}
let dirty=false;function req(){if(!dirty){dirty=true;requestAnimationFrame(()=>{dirty=false;render()})}}
function render(){if(!gl)return;const W_=wrap.clientWidth,H_=wrap.clientHeight,w=Math.round(W_*DPR),h=Math.round(H_*DPR);if(cv.width!=w||cv.height!=h){cv.width=lb.width=w;cv.height=lb.height=h}
 gl.viewport(0,0,w,h);gl.uniform2f(loc.uRes,w,h);gl.uniform2f(loc.uOff,V.x*DPR,V.y*DPR);gl.uniform1f(loc.uScale,V.s*DPR);gl.uniform2f(loc.uBw,(V.s<1.4?0:.7)*DPR,(V.s<1.2?1:1.6)*DPR);
 gl.uniform1f(loc.uSel,(sel>=0&&!P[sel].mi)?sel+1:0);gl.uniform1f(loc.uPl,PL);gl.uniform1f(loc.uSh,7*DPR);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);labels()}
const mr=()=>V.s<1?5:Math.max(7,Math.min(16,3+V.s*1.4));
function txt(t,x,y,fs,fill,w){lg.font=w+' '+fs+'px '+FF;lg.lineWidth=3;lg.strokeStyle='rgba(0,0,0,.78)';lg.fillStyle=fill;lg.strokeText(t,x,y);lg.fillText(t,x,y)}
function stamp(nm,x,y,s){lg.save();lg.translate(x-s/2,y-s/2);lg.scale(s/24,s/24);lg.fillStyle=IC[nm][1];lg.fill(IP[nm],IC[nm][2]||'evenodd');lg.restore()}
function labels(){lg.setTransform(1,0,0,1,0,0);lg.clearRect(0,0,lb.width,lb.height);if(PL<0)return;lg.setTransform(DPR,0,0,DPR,0,0);const W_=wrap.clientWidth,H_=wrap.clientHeight;lg.textAlign='center';lg.textBaseline='middle';lg.lineJoin='round';
 if(V.s<2.2){const sx=new Float64Array(N),sy=new Float64Array(N),sa=new Float64Array(N),bd=new Float64Array(N).fill(1e18),bx=new Float64Array(N),by=new Float64Array(N);
  for(const p of P){if(p.mi)continue;sx[p.o]+=p.x*p.ar;sy[p.o]+=p.y*p.ar;sa[p.o]+=p.ar}
  for(const p of P){if(p.mi||!sa[p.o])continue;const d=Math.hypot(p.x-sx[p.o]/sa[p.o],p.y-sy[p.o]/sa[p.o]);if(d<bd[p.o]){bd[p.o]=d;bx[p.o]=p.x;by[p.o]=p.y}}
  for(let o=0;o<N;o++){if(!sa[o])continue;const w=Math.sqrt(sa[o])*V.s;if(w<34)continue;txt(K[o][0],V.x+bx[o]*V.s,V.y+by[o]*V.s,Math.min(28,Math.max(10,w*.14)),o==PL?'#ffe29a':'rgba(255,255,255,.92)','700')}}
 if(V.s>=1.8)for(let i=0;i<P.length;i++){const p=P[i];if(p.mi)continue;const x=V.x+p.x*V.s,y=V.y+p.y*V.s;if(x<-30||y<-30||x>W_+30||y>H_+30)continue;const z=Math.sqrt(p.ar)*V.s;if(z<15)continue;
  const fs=Math.min(15,Math.max(9,z*.38));txt(armyLbl(p),x,y,fs,'#fff','700');
  if(capSet.has(i)&&z>=18){stamp('star',x,y-fs-1,Math.min(16,fs+3))}
  if(capSet.has(i)&&z>=40)txt(K[p.o][0],x,y+fs+3,Math.min(11,z*.2),'rgba(255,236,170,.95)','600');
  if(p.o==PL&&z>=30){const sz=Math.min(14,z*.3);p.b.forEach((n,k)=>{if(n)stamp(BL[k][1],x-sz*1.2+k*sz*1.2,y+fs*.9+sz*.6,sz)})}}
 for(const i of MIC){const p=P[i],x=V.x+p.x*V.s,y=V.y+p.y*V.s;if(x<-30||y<-30||x>W_+30||y>H_+30)continue;const R=mr();
  lg.beginPath();lg.arc(x,y,R,0,6.2832);lg.fillStyle=ocol(p.o);lg.fill();lg.lineWidth=p.o==PL?3:2;lg.strokeStyle=p.o==PL?'#f2c765':'rgba(255,255,255,.92)';lg.stroke();
  if(sel==i){lg.beginPath();lg.arc(x,y,R+4,0,6.2832);lg.strokeStyle='#fff3c8';lg.lineWidth=2.5;lg.stroke()}
  if(V.s>=1.4)txt(armyLbl(p),x,y,Math.min(13,R*.9),'#fff','700');
  if(V.s>=1.6)txt(K[p.o][0],x,y+R+9,11,'rgba(255,255,255,.95)','600')}}
function apply(){const W_=wrap.clientWidth,H_=wrap.clientHeight;V.s=Math.min(14,Math.max(minS(),V.s));const w=MW*V.s,h=MH*V.s;
 V.x=w<=W_?(W_-w)/2:Math.min(0,Math.max(W_-w,V.x));V.y=h<=H_?(H_-h)/2:Math.min(0,Math.max(H_-h,V.y));req()}
addEventListener('resize',()=>{apply()});addEventListener('orientationchange',()=>setTimeout(apply,250));
function zoomAt(cx,cy,f){const r=wrap.getBoundingClientRect(),o=V.s;V.s=Math.min(14,Math.max(minS(),V.s*f));const k=V.s/o;V.x=cx-r.left-(cx-r.left-V.x)*k;V.y=cy-r.top-(cy-r.top-V.y)*k;apply()}
function zoomBy(f){const r=wrap.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,f)}
function focusOn(i,s){V.s=s;V.x=wrap.clientWidth/2-P[i].x*s;V.y=wrap.clientHeight/2-P[i].y*s;apply()}
const ptrs=new Map();let pinch=0,moved=0;
$('zb').onpointerdown=e=>e.stopPropagation();
wrap.onpointerdown=e=>{wrap.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);moved=0;if(ptrs.size==2){const[a,b]=[...ptrs.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1])}};
wrap.onpointermove=e=>{if(!ptrs.has(e.pointerId))return;const o=ptrs.get(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size==1){V.x+=e.clientX-o[0];V.y+=e.clientY-o[1];moved+=Math.abs(e.clientX-o[0])+Math.abs(e.clientY-o[1]);apply()}
 else if(ptrs.size==2){const[a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)zoomAt((a[0]+b[0])/2,(a[1]+b[1])/2,d/pinch);pinch=d;moved=99}};
wrap.onpointerup=wrap.onpointercancel=e=>{if(ptrs.size==1&&moved<8&&e.type=='pointerup')tap(e.clientX,e.clientY);ptrs.delete(e.pointerId);pinch=0};
wrap.onwheel=e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,e.deltaY<0?1.25:.8)};
function hitMicro(cx,cy){const r=wrap.getBoundingClientRect(),R=mr()+8;let best=-1,bd=1e9;for(const i of MIC){const p=P[i],d=Math.hypot(cx-r.left-(V.x+p.x*V.s),cy-r.top-(V.y+p.y*V.s));if(d<=R&&d<bd){bd=d;best=i}}return best}
function tap(cx,cy){if(PL<0||over)return;let j=hitMicro(cx,cy);
 if(j<0){const r=wrap.getBoundingClientRect(),x=Math.floor((cx-r.left-V.x)/V.s),y=Math.floor((cy-r.top-V.y)/V.s),i=y*MW+x;if(x<0||x>=MW||y<0||y>=MH||!L[i]){sel=-1;draw();showCard();return}j=pid[i]}
 if(sel>=0&&sel!=j&&P[sel].o==PL&&P[sel].a>.2&&P[sel].n.has(j)){
  if(P[j].o==PL)move(sel,j);else if(atWar(PL,P[j].o))attack(sel,j);else{msg('Сначала оправдай и объяви войну: '+K[P[j].o][0]+'.');sel=j}
 }else{if(sel!=j)ct=0;sel=j}
 draw();showCard();hud()}

// ---------- actions ----------

function move(a,b){const A=P[a],B=P[b],s=A.a*.9;A.a-=s;B.a+=s;B.m=Math.max(B.m,B.a);msg('Армия переброшена.')}
function attack(a,b){const A=P[a],B=P[b],o=A.o,d=B.o,s=A.a*.9;A.a-=s;let as=0;B.n.forEach(j=>{if(P[j].o==d)as+=P[j].a});
 const aM=am(o)*(ATTR[a]?.5:1),dM=dm(d)*1.25*(ATTR[b]?.5:1),dT=B.a+.12*as,r=battle(s,aM,dT,dM,CWIDTH*DIV);
 if(r.d<=1e-6&&r.a>0){B.o=o;B.a=r.a*(1+MODS[o].conq);B.m=B.a*1.5;B.pop*=.97;WG[wk(o,d)]=(WG[wk(o,d)]||0)+1;if(o==PL){msg('Победа! Провинция взята у '+K[d][0]+'.');ach('conq1')}if(d==PL)msg(K[o][0]+' захватил твою провинцию!');
  if(cap[d]==b&&(d==PL||o==PL))msg('Столица '+K[d][0]+' взята: это крупная потеря VP, но страна ещё сопротивляется.');
  if(!cnt(d)){Object.keys(W).forEach(k=>{if(k.split('-').includes(String(d)))delete W[k]});Object.keys(J).forEach(k=>{if(k.split('>').includes(String(d)))delete J[k]})}check()}
 else{B.a*=Math.max(.1,r.d/dT);if(o==PL)msg('Атака отбита: на фронте '+Math.round(CWIDTH)+' див. в линии, у врага осталось '+fmt(B.a)+' тыс.')}}
function push(o,k,lim,skip){const mine=[];P.forEach((p,i)=>{if(p.o==o)mine.push(i)});let n=0;for(const i of mine){const p=P[i];if(p.o!=o||p.a<.3||(lim&&n>=lim)||(skip&&skip.has(i)))continue;let b=-1,bd=1e18;p.n.forEach(j=>{if(atWar(o,P[j].o)&&P[j].a<bd){bd=P[j].a;b=j}});if(b>=0&&p.a*.9*am(o)>bd*dm(P[b].o)*1.25*k){n++;attack(i,b)}}}
function autoPush(){push(PL,1.15);msg('Армии пошли в наступление там, где есть перевес.');closeMore();draw();showCard();hud()}
function war(a,b){W[wk(a,b)]=turn;WG[wk(a,b)]=0;if(b==PL){msg(K[a][0]+' объявил тебе войну!');STOP=true;chron(K[a][0]+' объявил войну тебе.')}else if(a==PL){msg('Война объявлена: '+K[b][0]+'.');chron('Ты объявил войну: '+K[b][0]+'.')}else chron(K[a][0]+' напал на '+K[b][0]+'.');
 if(a==PL||b==PL){const x=a==PL?b:a;for(const c in AL){const ci=+c;if(ci!=x&&cnt(ci)&&!atWar(ci,x)&&!pact(ci,x)&&!AL[x]&&Math.random()<.7){W[wk(ci,x)]=turn;WG[wk(ci,x)]=0;msg('Союзник '+K[ci][0]+' вступил в войну против '+K[x][0]+'.')}}}
 for(const k in AAL){const[x,y]=k.split('-').map(Number);for(const[me,fr]of[[x,y],[y,x]]){if(me==PL||!cnt(me))continue;
  if(fr==b&&me!=a&&!atWar(me,a)&&!pact(me,a)&&!allied(me,a)&&Math.random()<.5){W[wk(me,a)]=turn;WG[wk(me,a)]=0;chron(K[me][0]+' вступил в войну на стороне '+K[b][0]+'.')}
  else if(fr==a&&me!=b&&!atWar(me,b)&&!pact(me,b)&&!allied(me,b)&&Math.random()<.35){W[wk(me,b)]=turn;WG[wk(me,b)]=0;chron(K[me][0]+' поддержал '+K[a][0]+' в войне.')}}}}
function justify(t){if(AL[t]){msg('Это твой союзник.');return}if(pact(PL,t)){msg('Действует пакт о ненападении.');return}J[PL+'>'+t]=turn;msg('Оправдание войны против '+K[t][0]+': '+jt()+' ход.');showCard();hud()}
function declare(t){const k=PL+'>'+t;if(J[k]===undefined||turn-J[k]<jt())return;if(AL[t]){msg('Это твой союзник.');return}if(pact(PL,t)){msg('Действует пакт о ненападении.');return}delete J[k];war(PL,t);draw();showCard();hud()}
function peace(t){const k=wk(PL,t);if(turn-W[k]>=5||Math.random()<.3){delete W[k];delete WG[k];PA[k]=turn+6;msg('Мир с '+K[t][0]+' заключён.')}else msg(K[t][0]+' отказывается от мира. Попробуй позже.');showCard();hud()}
function build(k){const p=P[sel];if(!p||p.o!=PL||p.b[k]>=4)return;const c=bc(p,k);if(M[PL]<c){msg('Не хватает монет: нужно '+c+'.');return}M[PL]-=c;p.b[k]++;msg(BL[k][0]+' построена.');labels();showCard();hud()}
function buy(i){const p=P[i],o=p.o;if(capSet.has(i)){msg(K[o][0]+': «Столицу не продаём».');return}
 if(sold[o]>=Math.ceil(init[o]*.25)||cnt(o)<=2){msg(K[o][0]+': «Не охренел ли ты просить так много?»');return}
 if(![...p.n].some(j=>P[j].o==PL)){msg('Покупать можно только провинции рядом с твоими.');return}
 const c=price(i);if(M[PL]<c){msg('Не хватает монет: нужно '+c+'.');return}M[PL]-=c;sold[o]++;BOUGHT++;p.o=PL;msg('Куплено у '+K[o][0]+' за '+c+'.');check();draw();showCard();hud()}
const maxD=p=>Math.max(0,Math.min(p.pop*.25,RC[PL],M[PL]/dco(),Math.max(0,armyCap(PL)-eco(PL).ar)));
function dl(){const p=P[sel],n=maxD(p)*(+$('sl').value)/100,u=U[dt];$('dl').innerHTML='Призвать '+fmt(n)+' тыс.  −'+fmt(n)+' нас.  −'+fmt(n)+' рекр.  −'+Math.round(n*dco())+' '+I('coin')+'  сила +'+fmt(n*u[1]*(fs[1]?1.25:1))}
function draft(){const p=P[sel];if(!p||p.o!=PL)return;const n=maxD(p)*(+$('sl').value)/100;if(n<.01){msg(eco(PL).ar>=armyCap(PL)-.01?'Лимит армии: '+Math.round(MANP*100)+'% населения.':'Подвинь ползунок.');return}
 p.pop-=n;RC[PL]-=n;M[PL]-=n*dco();p.a+=n*U[dt][1]*(fs[1]?1.25:1);p.m=Math.max(p.m,p.a);msg('Призвано '+fmt(n)+' тыс.');draw();showCard();hud()}
function upg(k){const c=k=='tech'?200*CS*(up.tech+1):150*CS*(up[k]+1);if(M[PL]<c||up[k]>=(k=='tech'?3:5))return;M[PL]-=c;up[k]++;msg('Улучшение куплено.');more();hud()}
function foc(k){if(fs[k]||M[PL]<FO[k][1])return;M[PL]-=FO[k][1];fs[k]=1;msg('Фокус выполнен: '+FO[k][0]+'.');more();hud()}
function check(){if(cnt(PL)>=P.length*.3){over=true;msg('ПОБЕДА! Ты контролируешь 30% провинций мира.')}else if(!cnt(PL)){over=true;msg('Поражение: твоя страна уничтожена.')}}
// ---------- AI & turn ----------
function ai(o,cp,e){aiDev(o,e);aiAlly(o,cp);const T=TR[o],bal=0,bord=cp.filter(p=>[...p.n].some(j=>P[j].o!=o)),foes=[...new Set(bord.flatMap(p=>[...p.n].map(j=>P[j].o).filter(x=>x!=o)))],at=foes.filter(t=>atWar(o,t));
 if(bal<0){const p=cp.filter(q=>q.b[0]<4).sort((a,b)=>b.pop-a.pop)[0];if(p&&M[o]>=bc(p,0)){M[o]-=bc(p,0);p.b[0]++}}
 else if(M[o]>250*CS&&Math.random()<.35){const p=cp[Math.random()*cp.length|0],k=Math.random()<.5?1:Math.random()<.5?2:0,c=bc(p,k);if(p.b[k]<4&&M[o]>c*2.5){M[o]-=c;p.b[k]++}}
 if(!at.length&&Object.keys(W).length<8&&Math.random()<.014*T.ag*[.6,1,1.5][DIF]*(AID[o].i==0?1.5:AID[o].i==1?.6:1)*(REL[o]<25&&foes.includes(PL)?3:1)){const c=foes.filter(t=>!pact(o,t)&&!allied(o,t)&&J[o+'>'+t]===undefined&&!(t==PL&&(turn<12||AL[o]))&&ST[o]>ST[t]*(t==PL&&REL[o]<25?1.2:1.7));if(c.length){const t=c[Math.random()*c.length|0];J[o+'>'+t]=turn;if(t==PL)msg(K[o][0]+' начал оправдывать войну против тебя (5 ходов).')}}
 for(const k in J){const[a,b]=k.split('>').map(Number);if(a==o&&a!=PL&&turn-J[k]>=Math.max(2,5-MODS[o].jt)){delete J[k];if(!atWar(a,b)&&!pact(a,b)&&!allied(a,b)&&cnt(b)&&ST[o]>ST[b]*1.5&&Object.keys(W).length<9)war(a,b)}}
 const fr=bord.filter(p=>[...p.n].some(j=>atWar(o,P[j].o))),pool=fr.length?fr:bord; aiArmy(o,cp,e,bord,foes,at)}
function nextTurn(){if(over||PL<0)return;ST=K.map(()=>0);SUPF=Supply.compute(P,cap);ATTR=Supply.attr(P,SUPF);VIS=fogCompute();FARMS=Supply.farms(P,N);for(const p of P)ST[p.o]+=p.a;
 for(let o=0;o<N;o++){const cp=P.filter(p=>p.o==o);if(!cp.length)continue;const e=eco(o);M[o]=Math.max(0,M[o]+e.net*(o==PL?1:[.85,1,1.2][DIF]));RC[o]=Math.min(RC[o]+e.r,e.pp*RCP);
  cp.forEach(p=>{if(p.pop<p.pc)p.pop*=1+.003*Math.max(0,1+MODS[o].pop)});
  armyTurn(o,cp);
  if(o!=PL)ai(o,cp,e)}
 for(const k of Object.keys(W)){const[a,b]=k.split('-').map(Number);if(a==PL||b==PL)continue;if((WG[k]||0)>=4||turn-W[k]>=14||!cnt(a)||!cnt(b)){delete W[k];delete WG[k];PA[k]=turn+8}}
 if(warAny())LWA=turn;for(let o=0;o<N;o++){let r=REL[o];r+=(50+10*idAff(o)-r)*.01;if(atWar(PL,o))r-=1.5;if(AL[o]){if(!cnt(o))delete AL[o];else r=Math.max(r,55)}REL[o]=Math.max(0,Math.min(100,r))}
 capTick();
 tickIdeo();tickAI();turn++;check();checkAch();saveTo('a');if(!FFW){draw();hud();showCard()}maybeEvent()}
// ---------- diplomacy ----------
let SM=null;(async()=>{try{if(window.claude)SM=await window.claude.use('sample')}catch(e){SM=null}})();
const TR=K.map((k,o)=>({ag:.25+((o*37)%9)/12,gr:.5+((o*53)%7)/10})),pick=a=>a[Math.random()*a.length|0];
const persona=o=>(TR[o].ag>.75?'воинственный':TR[o].ag>.5?'расчётливый':'миролюбивый')+(TR[o].gr>.9?', жадный':'');
function calcST(){ST=K.map(()=>0);for(const p of P)ST[p.o]+=p.a}
function dip(o){calcST();DP={o,g:{coin:0,rec:0,prov:-1},a:{coin:0,rec:0,prov:(sel>=0&&P[sel].o==o)?sel:-1},pact:false,peace:false,chat:[],busy:false};$('card').style.display='none';closeMore();dipUI()}
function closeDip(){DP=null;$('dip').style.display='none';showCard()}



function dealScore(o){const e=eco(o),need=false,T=TR[o],g=DP.g,a=DP.a,vp=i=>(15+P[i].g*.6+P[i].a*1.5)*CS;
 const recv=g.coin+g.rec*1.6*CS+(g.prov>=0?vp(g.prov)*1.2:0),give=a.coin+a.rec*2*CS+(a.prov>=0?vp(a.prov)*3.2:0);
 let ex=0;if(DP.pact)ex+=ST[o]<ST[PL]?35:-25*T.ag-10;
 if(DP.peace&&atWar(PL,o))ex+=(turn-W[wk(PL,o)]>=5?40:-30)+(ST[o]<ST[PL]*.7?60:0)-T.ag*30;
 ex+=(REL[o]-50)*.5+MOOD[o]*(15+recv*.12/CS);return{net:recv-give+ex*CS,recv,give}}
function dealText(){const f=(s,n)=>{const l=[];if(s.coin)l.push(s.coin+' монет');if(s.rec)l.push(s.rec+' рекрутов');if(s.prov>=0)l.push('провинцию');return l.join(', ')||'ничего'};return'Игрок даёт: '+f(DP.g)+'. Игрок просит: '+f(DP.a)+'.'+(DP.pact?' Условие: пакт о ненападении на 10 ходов.':'')+(DP.peace?' Условие: мир.':'')}
function execDeal(o){const g=DP.g,a=DP.a,k=wk(PL,o);M[PL]+=a.coin-g.coin;M[o]+=g.coin-a.coin;RC[PL]+=a.rec-g.rec;RC[o]+=g.rec-a.rec;
 if(g.prov>=0)P[g.prov].o=o;if(a.prov>=0)P[a.prov].o=PL;if(DP.pact)PA[k]=turn+10;if(DP.peace&&atWar(PL,o)){delete W[k];delete WG[k];PA[k]=Math.max(PA[k]||0,turn+6)}
 REL[o]=Math.min(100,REL[o]+3);DP.g={coin:0,rec:0,prov:-1};DP.a={coin:0,rec:0,prov:-1};DP.pact=DP.peace=false;check();draw();hud()}
async function offer(){if(!DP||DP.busy)return;const o=DP.o,g=DP.g,a=DP.a;calcST();
 if(!(g.coin||g.rec||g.prov>=0||a.coin||a.rec||a.prov>=0||DP.pact||DP.peace)){$('dres').textContent='Сделка пуста.';return}
 if(DP.pact&&atWar(PL,o)&&!DP.peace){$('dres').textContent='Пакт во время войны невозможен: сначала мир.';return}
 const r=dealScore(o),ok=r.net>=0,txt=dealText(),msgs=ok?pick(['Договорились.','Это справедливая сделка.','Согласны. Приятно иметь с вами дело.']):'Нет, это невыгодно нам. Добавьте ценности примерно на '+Math.ceil(-r.net)+' монет.';
 if(ok)execDeal(o);else REL[o]=Math.max(0,REL[o]-1);
 if(ok)dipUI();$('dres').textContent=msgs;
 if(SM&&DP&&DP.o==o){DP.busy=true;try{const j=await SM.json('Ты лидер страны «'+K[o][0]+'» ('+persona(o)+') в стратегической игре. '+txt+' Решение игры: '+(ok?'сделка принята':'сделка отклонена, не хватает ценности')+'. Ответь игроку 1-2 предложениями по-русски в образе, объясни решение, без markdown. Верни только JSON {"reply":"..."}',{modelTier:'quick',cache:false});if(DP&&DP.o==o&&j&&typeof j.reply=='string'){DP.chat.push(['ai',j.reply.slice(0,400)]);chatUI()}}catch(e){}if(DP)DP.busy=false}}
// ---------- economy helpers, mass build, capitulation ----------
function fG(g){return g>=1000?(g/1000).toFixed(2)+' трлн $':Math.round(g)+' млрд $'}
function pls(n){return n%10==1&&n%100!=11?'провинцию':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?'провинции':'провинций'}
let MB={t:3,bud:0,init:false};
function mbPlan(){let bud=MB.bud;const e=eco(PL);let bal=0,n=0;const out=[],cand=P.map((p,i)=>i).filter(i=>P[i].o==PL).sort((a,b)=>P[b].g-P[a].g);
 for(const i of cand){const p=P[i];let k=MB.t;if(k==3)k=bal<0?0:(n%4==0?0:n%4==1?2:1);if(p.b[k]>=4)continue;const c=bc(p,k);if(bud<c)continue;bud-=c;out.push([i,k,c]);n++;if(k==0)bal+=p.pop*.0008}
 return out}

function mbInfo(){const el=$('mbi');if(!el)return;const l=mbPlan(),sp=l.reduce((s,x)=>s+x[2],0);$('mbv').textContent=MB.bud;el.textContent='Хватит на '+l.length+' '+pls(l.length)+' · потратим '+Math.round(sp)+' монет'}
function mbGo(){const l=mbPlan();if(!l.length){msg('На такой бюджет ничего не построить.');return}let sp=0;l.forEach(([i,k,c])=>{P[i].b[k]++;M[PL]-=c;sp+=c});msg('Построено '+l.length+' зданий за '+Math.round(sp)+' монет.');more();hud();labels()}
function capitulate(d,by){P.forEach(p=>{if(p.o==d)p.o=by});Object.keys(W).forEach(k=>{if(k.split('-').includes(String(d)))delete W[k]});Object.keys(J).forEach(k=>{if(k.split('>').includes(String(d)))delete J[k]});delete CAPT[d];
 if(d==PL||by==PL)msg(K[d][0]+' капитулировала перед '+K[by][0]+'.');chron(K[d][0]+' капитулировала перед '+K[by][0]+'.');if(d==PL)STOP=true;if(by==PL)ach('cap1');check();draw()}
// ---------- relations & alliances ----------
const warAny=()=>Object.keys(W).some(k=>k.split('-').includes(String(PL)));
function allyChance(o){if(AL[o])return 100;if(warAny()||atWar(PL,o))return 0;const rec=Math.min(1,(turn-LWA)/6);let c=(REL[o]-45)*1.6+MOOD[o]*10+(pact(PL,o)?8:0);if(TR[o].ag>.8)c*=.7;c*=Math.max(0,1+MOD.ally);return Math.round(Math.max(0,Math.min(95,c))*rec)}
function allyWhy(o){if(warAny())return'Идёт война: шанс 0%, пока она не закончится.';if(turn-LWA<6)return'После войны доверие ещё восстанавливается.';if(REL[o]<45)return'Слишком низкие отношения.';return''}
const relCost=o=>CS*Math.round(10+K[o][3]*.004);
function refresh(){if(DP&&$('drel'))dipUI();else showCard();hud()}
function relUp(o){if(atWar(PL,o)){msg('Во время войны отношения не улучшить.');return}if(RLT[o]===turn){msg('Сегодня уже улучшал. Подожди следующий ход.');return}const c=relCost(o);if(M[PL]<c){msg('Не хватает монет: нужно '+c+'.');return}
 M[PL]-=c;RLT[o]=turn;const g=Math.round((2+7*(1-REL[o]/120))*(1+MOD.relg));REL[o]=Math.min(100,REL[o]+g);MOOD[o]=Math.min(1,MOOD[o]+.15);msg(K[o][0]+': отношения +'+g+' ('+Math.round(REL[o])+'/100).');refresh()}
function insult(o){REL[o]=Math.max(0,REL[o]-12);MOOD[o]=Math.max(-1,MOOD[o]-.4);let ex='';if(AL[o]&&REL[o]<40){delete AL[o];ex=' Союз распался.'}msg(K[o][0]+': отношения −12 ('+Math.round(REL[o])+'/100).'+ex);
 if(DP&&DP.o==o)DP.chat.push(['ai',pick(TR[o].ag>.6?['Вы пожалеете об этих словах.','Мы этого не забудем.']:['Это было недостойно.','Мы разочарованы вашим тоном.'])]);refresh()}
function proposeAlly(o){if(AL[o])return;const ch=allyChance(o);if(ch<=0){msg(allyWhy(o)||'Шанс 0%.');return}if((ALC[o]||0)>turn){msg('Подожди ещё '+(ALC[o]-turn)+' ход(а).');return}
 if(Math.random()*100<ch){AL[o]=turn;REL[o]=Math.max(REL[o],65);msg(K[o][0]+' стала твоим союзником!')}else{ALC[o]=turn+3;REL[o]=Math.max(0,REL[o]-2);msg(K[o][0]+' отклонила союз (шанс был '+ch+'%).')}refresh()}
function breakAlly(o){delete AL[o];REL[o]=Math.max(0,REL[o]-25);for(const c in AL)REL[+c]=Math.max(0,REL[+c]-5);msg('Альянс с '+K[o][0]+' разорван.');refresh();if($('more').style.display=='block')more()}
function relHTML(o){const r=Math.round(REL[o]),col=r>65?'var(--grn)':r>35?'var(--gold)':'var(--red)',ch=allyChance(o),why=AL[o]?'':allyWhy(o);
 return'<div class="rel"><div class="rl"><span>Отношения</span><b>'+r+' / 100</b></div><div class="bar"><i style="width:'+r+'%;background:'+col+'"></i></div><div class="rl"><span>'+I('chain')+' Шанс альянса</span><b style="color:'+(AL[o]?'var(--grn)':ch>0?'var(--gold)':'var(--red)')+'">'+(AL[o]?'союзник':ch+'%')+'</b></div>'+(why?'<div class="rl"><span>'+why+'</span></div>':'')+'</div>'}
// ---------- UI ----------
function fC(n){const a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e4?Math.round(n/1e3)+'k':a>=1e3?(n/1e3).toFixed(1)+'k':Math.round(n)}
function msg(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(msg.t);msg.t=setTimeout(()=>e.style.display='none',3800)}
const chip=(ic,v,sub,cls)=>'<div class="chip">'+I(ic)+'<div class="v"><b>'+v+'</b><small class="'+(cls||'')+'">'+sub+'</small></div></div>';
const tile=(ic,cap,fn,cls,dis,tt)=>'<button class="tile '+(cls||'')+'" onclick="'+fn+'"'+(dis?' disabled':'')+(tt?' title="'+tt+'"':'')+'>'+I(ic)+'<span>'+cap+'</span></button>';
function hud(){if(PL<0){$('top').innerHTML='';return}const e=eco(PL),n=Math.round(e.net),SS=(SUPF=Supply.compute(P,cap),ATTR=Supply.attr(P,SUPF),VIS=fogCompute(),Supply.stat(P,SUPF,PL));
 $('top').innerHTML='<div class="pl"><span class="flg">'+fl(PL)+'</span><div class="v"><b>'+K[PL][0]+'</b><small>Ход '+turn+(ID.i>=0?' '+I(IDS[ID.i].ic):'')+'</small></div></div><div class="chips">'+
  chip('coin',fC(M[PL]),(n>=0?'+':'')+fC(n),n>=0?'up':'dn')+chip('supply',(SS.all-SS.cut)+'/'+SS.all,'в котле: '+SS.cut,SS.cut?'dn':'')+chip('sword2',fmt(RC[PL]),'+'+fmt(e.r),'up')+chip('flag',cnt(PL),'/'+P.length,'')+
  '</div><button class="btn pri" onclick="nextTurn()" aria-label="Следующий ход">'+I('play')+'<span class="hide-s">Ход</span></button>'}
function showCard(){const c=$('card');if(sel<0||PL<0){c.style.display='none';return}const p=P[sel],o=p.o,own=o==PL,e=eco(o),tg=[];{const sI=own?ID:AID[o];if(sI&&sI.i>=0)tg.push('<span class="tag">'+I(IDS[sI.i].ic)+IDS[sI.i].n+'</span>')}
 if(capSet.has(sel))tg.push('<span class="tag">'+I('star')+'Столица</span>');if(p.o==PL&&p.a>.05&&SUPF.length&&!SUPF[sel])tg.push('<span class="tag dng">'+I('supply')+'Окружение</span>');if(p.o==PL&&p.a>.05&&SUPF[sel]&&ATTR[sel])tg.push('<span class="tag dng">'+I('supply')+'Истощение: лимит '+Math.round(Supply.limit(p))+'</span>');
 if(!own){if(atWar(PL,o))tg.push('<span class="tag dng">Война</span>');else if(pact(PL,o))tg.push('<span class="tag">Пакт · '+(PA[wk(PL,o)]-turn)+' х.</span>');if(AL[o])tg.push('<span class="tag grn">Союзник</span>')}
 const inc=CS*(1+p.g*.015)*(1+(FACT+MODS[o].fact)*p.b[1]),fi=n=>fC(n);
 let h='<div class="ch"><span class="flg">'+fl(o)+'</span><div class="grow"><div class="ttl">'+K[o][0]+'</div><div class="tags">'+tg.join('')+'</div></div><button class="btn ico" onclick="sel=-1;showCard();draw()" aria-label="Закрыть">'+I('close')+'</button></div>';
 h+='<div class="stats"><div class="st">'+I('people')+'<div><b>'+fp(p.pop)+'</b><small>население</small></div></div><div class="st">'+I('helmet')+'<div><b>'+(seen(p)?armyLbl(p):'–')+'</b><small>'+(seen(p)?'из '+fmt(Math.max(p.m,p.a)):'туман войны')+'</small></div></div><div class="st">'+I('coin')+'<div><b>'+fi(inc)+'</b><small>доход/ход</small></div></div></div>';
 if(own){
  h+='<div class="bts">'+BL.map((b,k)=>'<div class="bt" style="--c:'+b[2]+'">'+I(b[1])+'<b>'+p.b[k]+'/4</b></div>').join('')+'</div>';
  h+='<div class="acts">'+tile('build','Строить','ct=ct==1?0:1;showCard()',ct==1?'on':'')+tile('helmet','Призыв','ct=ct==2?0:2;showCard()',ct==2?'on':'')+tile('disband','Распустить<br>дивизию','disband('+sel+')','dng',!(p.a>.05),'Распустить армию в провинции')+tile('list','Меню','more()')+'</div>';
  if(ct==1)h+='<div class="row">'+BL.map((b,k)=>'<button class="btn bld" style="--c:'+b[2]+'" onclick="build('+k+')"'+(p.b[k]>=4?' disabled':'')+'>'+I(b[1])+'<span>'+b[0]+' · '+bc(p,k)+'</span>'+I('coin')+'</button>').join('')+'</div>';
  if(ct==2)h+='<div class="row">'+U.map((u,k)=>'<button class="btn '+(dt==k?'on':'')+'" onclick="dt='+k+';showCard()"'+(tech()<u[3]?' disabled':'')+'>'+u[0]+' ×'+u[1]+'</button>').join('')+'</div><input id="sl" type="range" min="0" max="100" value="0" oninput="dl()" aria-label="Сколько призвать" style="margin-top:10px"><div id="dl" class="mut"></div><div class="row"><button class="btn pri" onclick="draft()">'+I('helmet')+'<span>Призвать</span></button></div>';
 }else{
  const jd=J[PL+'>'+o],ready=jd!==undefined&&turn-jd>=jt(),w_=atWar(PL,o);
  h+=relHTML(o)+'<div class="mut">Сила страны: '+intelArmy(o)+' · ВВП '+fG(e.gd)+'</div><div class="acts">'+
   (w_?tile('dove','Мир','peace('+o+')'):ready?tile('swords','Война','declare('+o+')','dng',false,'Объявить войну'):jd!==undefined?'<button class="tile" disabled>'+I('scroll')+'<span>Повод '+Math.min(jt(),turn-jd)+'/'+jt()+'</span></button>':tile('scroll','Повод<br>к войне','justify('+o+')','dng',false,'Оправдать войну (5 ходов)'))+
   tile('deal','Перего-<br>воры','dip('+o+')')+tile('hand','Улучшить<br>'+relCost(o)+' мон.','relUp('+o+')','',w_,'Улучшить отношения')+tile('insult','Оскорбить','insult('+o+')','dng',false,'Отправить оскорбление')+
   (rules.buy?tile('coin','Купить<br>'+fC(price(sel)),'buy('+sel+')'):'')+tile('list','Меню','more()')+'</div>'}
 c.innerHTML=h;c.style.display='block';if($('sl'))dl()}
function closeMore(){$('more').style.display='none'}
let MT=0;
function mbUI(){if(!MB.init){MB.bud=Math.floor(M[PL]*.3);MB.init=true}const mx=Math.floor(M[PL]);MB.bud=Math.min(MB.bud,mx);
 return'<div class="sec">'+I('build')+'Массовая стройка</div><div class="panel"><div class="row" style="margin-top:0">'+BL.map((b,k)=>'<button class="btn bld '+(MB.t==k?'on':'')+'" style="--c:'+b[2]+'" onclick="MB.t='+k+';more()">'+I(b[1])+'<span>'+b[0]+'</span></button>').join('')+'<button class="btn '+(MB.t==3?'on':'')+'" onclick="MB.t=3;more()">Авто</button></div><div class="dl"><span>Бюджет</span><input type="range" min="0" max="'+mx+'" step="'+Math.max(1,Math.floor(mx/200))+'" value="'+MB.bud+'" oninput="MB.bud=+this.value;mbInfo()" aria-label="Бюджет стройки"><b id="mbv">'+MB.bud+'</b></div><div id="mbi" class="mut"></div><div class="row"><button class="btn pri" onclick="mbGo()">'+I('build')+'<span>Построить везде</span></button></div><div class="mut" style="margin-top:6px">Авто: заводы и лагеря. Фермы ускоряют лечение армий. В провинции строится по одному зданию.</div></div>'}
function more(){if(PL<0)return;const m=$('more'),e=eco(PL),TB=[['swords','Война'],['coin','Экономика'],['star','Идеология'],['trend','Развитие'],['flag','Мир'],['list','Система']],fg=(a)=>'<div class="flags">'+a.join('')+'</div>';
 let h='<div class="in"><div class="ch"><div class="ttl grow">Меню</div><button class="btn ico" onclick="closeMore()" aria-label="Закрыть">'+I('close')+'</button></div><div class="tabs">'+TB.map((t,i)=>'<button class="tab '+(MT==i?'on':'')+'" onclick="MT='+i+';more()">'+I(t[0])+'<span>'+t[1]+'</span></button>').join('')+'</div>';
 if(MT==0){const ws=K.map((k,t)=>t).filter(t=>t!=PL&&atWar(PL,t)&&cnt(t)),pcs=K.map((k,t)=>t).filter(t=>t!=PL&&pact(PL,t)&&cnt(t)),als=Object.keys(AL).map(Number).filter(t=>cnt(t));
  h+='<div class="sec">'+I('swords')+'Войны</div>'+(ws.length?fg(ws.map(t=>'<div class="fg bad"><span>'+fl(t)+'</span><b>'+K[t][0]+'</b><small>'+(turn-W[wk(PL,t)])+' х.</small></div>')):'<div class="mut">Ты ни с кем не воюешь.</div>');
  const mine=Object.keys(J).filter(k=>k.split('>')[0]==PL),thr=Object.keys(J).filter(k=>k.split('>')[1]==PL);
  if(mine.length||thr.length)h+='<div class="sec">'+I('scroll')+'Поводы к войне</div>'+fg(mine.map(k=>{const t=+k.split('>')[1];return'<div class="fg"><span>'+fl(t)+'</span><small>ты → '+Math.min(jt(),turn-J[k])+'/'+jt()+'</small></div>'}).concat(thr.map(k=>{const t=+k.split('>')[0];return'<div class="fg bad"><span>'+fl(t)+'</span><small>на тебя '+Math.min(5,turn-J[k])+'/5</small></div>'})));
  h+='<div class="sec">'+I('chain')+'Альянсы</div>'+(als.length?fg(als.map(t=>'<div class="fg ok"><span>'+fl(t)+'</span><b>'+K[t][0]+'</b><button class="btn" style="margin-top:6px;min-height:30px;font-size:12px" onclick="breakAlly('+t+')">Разорвать</button></div>')):'<div class="mut">Союзников нет. Предложи альянс в переговорах: чем лучше отношения, тем выше шанс. Во время войны шанс 0%.</div>');
  if(pcs.length)h+='<div class="sec">'+I('dove')+'Пакты о ненападении</div>'+fg(pcs.map(t=>'<div class="fg"><span>'+fl(t)+'</span><b>'+K[t][0]+'</b><small>ещё '+(PA[wk(PL,t)]-turn)+' х.</small></div>'));
  h+='<div class="row" style="margin-top:14px"><button class="btn pri wide" onclick="autoPush()">'+I('swords')+'<span>Наступать всеми армиями</span></button></div>'}
 if(MT==1){const st=(ic,b,s)=>'<div class="st">'+I(ic)+'<div><b>'+b+'</b><small>'+s+'</small></div></div>';
  h+='<div class="sec">'+I('coin')+'Ресурсы</div><div class="res">'+st('coin',fC(M[PL]),(e.net>=0?'+':'')+fC(e.net)+' за ход')+(()=>{const s=Supply.stat(P,SUPF,PL);return st('supply',(s.all-s.cut)+'/'+s.all,'армий снабжается')})()+st('sword2',fmt(RC[PL]),'рекруты +'+fmt(e.r))+st('people',fp(e.pp),'население')+st('helmet',fmt(e.ar),'армия')+st('trend',fG(e.gd),'ВВП')+'</div>'+mbUI()}
 if(MT==2)h+=ideoUI();
 if(MT==3){h+=projUI();const tc=200*CS*(up.tech+1);
  h+='<div class="sec">'+I('helmet')+'Прокачка армии</div><div class="row" style="margin-top:0"><button class="btn" onclick="upg(\'tech\')"'+(up.tech>=3||M[PL]<tc?' disabled':'')+'>Технологии '+tech()+'/3 · '+tc+I('coin')+'</button><button class="btn" onclick="upg(\'atk\')"'+(up.atk>=5||M[PL]<150*CS*(up.atk+1)?' disabled':'')+'>Атака +'+up.atk*10+'% · '+150*CS*(up.atk+1)+I('coin')+'</button><button class="btn" onclick="upg(\'def\')"'+(up.def>=5||M[PL]<150*CS*(up.def+1)?' disabled':'')+'>Защита +'+up.def*10+'% · '+150*CS*(up.def+1)+I('coin')+'</button></div><div class="mut" style="margin-top:6px">Технологии 1: регулярная армия · 2: элита · 3: танки.</div>'+
  '<div class="sec">'+I('star')+'Национальные фокусы</div><div class="row" style="margin-top:0">'+FO.map((f,k)=>'<button class="btn '+(fs[k]?'on':'')+'" onclick="foc('+k+')"'+(fs[k]||M[PL]<f[1]?' disabled':'')+'>'+f[0]+(fs[k]?' '+I('check'):' · '+f[1]+I('coin'))+'<small style="margin-left:4px">'+f[2]+'</small></button>').join('')+'</div>'}
 if(MT==4)h+=worldUI();
 if(MT==5){h+='<div class="sec">Правила игры</div><div class="panel"><label><input type="checkbox" '+(rules.buy?'checked':'')+' onchange="rules.buy=this.checked"> Покупка территорий</label><label><input type="checkbox" '+(rules.upkeep?'checked':'')+' onchange="rules.upkeep=this.checked;hud()"> Содержание армии</label></div>'+diffUI()+'<div class="sec">Сохранения</div>'+
   ['a',1,2,3].map(s=>{const i=slotMeta(s);return'<div class="panel row" style="margin-top:0"><span class="grow">'+(s=='a'?'Автосохранение':'Слот '+s)+'<br><small>'+(i?i.f+' '+i.n+' · ход '+i.t:'пусто')+'</small></span>'+(s=='a'?'':'<button class="btn" onclick="saveTo('+s+')">Сохранить</button>')+'<button class="btn" onclick="loadFrom(\''+s+'\')"'+(i?'':' disabled')+'>Загрузить</button></div>'}).join('')+
   '<div class="row"><button class="btn dng" onclick="if(confirm(\'Начать новую игру? Несохранённое пропадёт.\'))location.reload()">Новая игра</button></div>'}
 m.innerHTML=h+'</div>';m.style.display='block';mbInfo();const tb=m.querySelector('.tab.on');if(tb)tb.scrollIntoView({inline:'center',block:'nearest'})}
let PK=-1,pq='';
function plist(){const q=pq.toLowerCase(),l=K.map((k,j)=>[j,cnt(j)]).filter(x=>x[1]>0&&(!q||K[x[0]][0].toLowerCase().includes(q))).sort((a,b)=>K[b[0]][3]-K[a[0]][3]);
 $('plist').innerHTML=l.map(x=>'<button class="pi '+(x[0]==PK?'on':'')+'" onclick="PK='+x[0]+';plist()"><span class="flg">'+fl(x[0])+'</span><span class="grow"><b>'+K[x[0]][0]+'</b><small>'+fG(K[x[0]][3])+' · '+x[1]+' пров.</small></span></button>').join('');
 $('pgo').disabled=PK<0;$('pgo').innerHTML=PK<0?'<span>Выбери страну</span>':I('play')+'<span>Играть за '+K[PK][0]+'</span>'}
function startScreen(){PK=K.findIndex(k=>k[0]=='Люксембург');if(PK<0||!cnt(PK))PK=K.findIndex(k=>k[0]=='Германия');pq='';
 const sv=['a',1,2,3].filter(s=>slotMeta(s));
 $('more').innerHTML='<div class="in"><div class="hero"><h1>ВЕЛИКАЯ ВОЙНА</h1><p>Реальная карта мира. Выбери державу и добейся господства над 30% провинций.</p></div><input id="pq" type="text" placeholder="Поиск страны…" aria-label="Поиск страны" oninput="pq=this.value;plist()"><div id="plist" class="plist"></div><div class="row"><button id="pgo" class="btn pri wide" onclick="start()"></button></div>'+
  (sv.length?'<div class="sec">Сохранения</div>'+sv.map(s=>{const i=slotMeta(s);return'<div class="panel row" style="margin-top:0"><span class="grow">'+i.f+' '+i.n+'<br><small>ход '+i.t+(s=='a'?' · авто':' · слот '+s)+'</small></span><button class="btn" onclick="loadFrom(\''+s+'\')">Загрузить</button></div>'}).join(''):'')+'</div>';
 $('more').style.display='block';plist();const se=document.querySelector('#plist .pi.on');if(se)se.scrollIntoView({block:'center'})}
function start(){if(PK<0)return;PL=PK;reset();closeMore();focusOn(cap[PL],capSet.has(cap[PL])&&P[cap[PL]].mi?5:4);draw();hud();msg('Ты играешь за '+K[PL][0]+'. Золотая линия: твои границы.')}
function slr(label,ic,key,side,max){const id='v'+side+key;return'<div class="dl"><span>'+I(ic)+label+'</span><input type="range" min="0" max="'+Math.max(0,Math.floor(max))+'" value="'+Math.floor(DP[side][key])+'" oninput="DP.'+side+'.'+key+'=+this.value;$(\''+id+'\').textContent=this.value" aria-label="'+label+'"><b id="'+id+'">'+Math.floor(DP[side][key])+'</b></div>'}
function provOpts(l,cur){return'<option value="-1">— нет —</option>'+l.map(i=>'<option value="'+i+'"'+(i==cur?' selected':'')+'>№'+i+' · '+fp(P[i].pop)+' · арм. '+fmt(P[i].a)+'</option>').join('')}
function dipUI(){const o=DP.o,war_=atWar(PL,o),ch=allyChance(o),brd=(i,w)=>!capSet.has(i)&&[...P[i].n].some(j=>P[j].o==w);
 const mine=P.map((p,i)=>i).filter(i=>P[i].o==PL&&brd(i,o)).sort((a,b)=>P[b].pop-P[a].pop).slice(0,25),theirs=P.map((p,i)=>i).filter(i=>P[i].o==o&&brd(i,PL)).sort((a,b)=>P[b].pop-P[a].pop).slice(0,25);
 if(DP.a.prov>=0&&!theirs.includes(DP.a.prov))DP.a.prov=-1;
 let h='<div class="in"><div class="ch"><span class="flg">'+fl(o)+'</span><div class="grow"><div class="ttl">'+K[o][0]+'</div><div class="mut">'+persona(o)+' · '+ideoTag(o)+' · ВВП '+fG(eco(o).gd)+'</div></div><button class="btn ico" onclick="closeDip()" aria-label="Закрыть">'+I('close')+'</button></div><div id="drel" class="panel">'+relHTML(o)+'</div>';
 h+='<div class="acts">'+tile('hand','Улучшить<br>'+relCost(o)+' мон.','relUp('+o+')','',war_,'Улучшить отношения')+tile('insult','Оскорбить','insult('+o+')','dng',false,'Отправить оскорбление')+(AL[o]?tile('chain','Разорвать<br>альянс','breakAlly('+o+')','dng'):tile('chain','Альянс<br>шанс '+ch+'%','proposeAlly('+o+')','',ch<=0))+'</div>';
 h+='<div class="cols"><div><div class="sec">Ты даёшь</div>'+slr('Монеты','coin','coin','g',M[PL])+slr('Рекруты','sword2','rec','g',RC[PL])+'<div class="dl"><span>'+I('flag')+'Провинция</span><select onchange="DP.g.prov=+this.value" aria-label="Отдать провинцию">'+provOpts(mine,DP.g.prov)+'</select></div></div>'+
  '<div><div class="sec">Ты просишь</div>'+slr('Монеты','coin','coin','a',M[o])+slr('Рекруты','sword2','rec','a',RC[o])+'<div class="dl"><span>'+I('flag')+'Провинция</span><select onchange="DP.a.prov=+this.value" aria-label="Получить провинцию">'+provOpts(theirs,DP.a.prov)+'</select></div></div></div>';
 h+='<div class="sec">Условия</div><div class="panel"><label><input type="checkbox" onchange="DP.pact=this.checked"> Пакт о ненападении (10 ходов)</label>'+(war_?'<label><input type="checkbox" onchange="DP.peace=this.checked"> Закончить войну</label>':'')+'</div>';
 h+='<div class="row"><button class="btn pri wide" onclick="offer()">'+I('deal')+'<span>Предложить сделку</span></button></div><div id="dres" class="mut" style="margin-top:6px"></div>';
 h+=Diplomat.chatBlock()+'</div>';
 $('dip').innerHTML=h;$('dip').style.display='block';chatUI()}
// ---------- ideologies, AI development, world events, world tab ----------
const MK=['inc','tax','up','dc','rec','atk','def','heal','bc','fact','relg','ally','buy','pop','tech','jt','conq'];
const MODS=K.map(()=>{const m={};MK.forEach(k=>m[k]=0);return m});
const MOD=new Proxy({},{get:(_,k)=>(PL>=0&&MODS[PL]?MODS[PL][k]:0)||0});
Object.assign(IC,{crown:['M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5zM5 20.5h14V22H5z','#e6b450'],fsword:['M11 2h2l1.2 11h-4.4zM6.5 13h11v2h-11zM11 15h2v6h-2z','#d6694a'],
rstar:['M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.1 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z','#e5534b'],ballot:['M3 11h18v10H3zM8 3h8v7H8zM7 14h10v2H7z','#62a4ff'],
check:['M9.5 16.2 5.8 12.5 4.4 13.9l5.1 5.1L20 8.5 18.6 7.1z','#52c27d'],lock:['M7 10V8a5 5 0 0 1 10 0v2h2v11H5V10zm2 0h6V8a3 3 0 0 0-6 0z','#8e9ab2'],
medal:['M7 2h4l1 5 1-5h4l-3 8a6 6 0 1 1-4 0zM12 12.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z','#e6b450']});
for(const k in IC)if(!IP[k])IP[k]=new Path2D(IC[k][0]);
const IDS=[
{k:'f',n:'Фашизм',tag:'Эра завоеваний',ic:'fsword',col:'#d6694a',info:'Дешёвая мобилизация, быстрые войны и сильная атака. Друзей почти нет.',pros:['Дешёвый призыв','Дешёвая армия','Быстрые войны'],cons:['Шанс альянса −50%'],base:{ally:-.5},
 br:[{n:'Военная машина',nodes:[['Культ мундира',{dc:-.1,up:-.08}],['Блицкриг',{atk:.1,heal:.3}],['Танковые клинья',{atk:.08,conq:.2}],['Тотальная мобилизация',{dc:-.15,rec:.2,up:-.1}]]},
  {n:'Экспансия',nodes:[['Жизненное пространство',{jt:1}],['Пограничные инциденты',{jt:1,conq:.15}],['Реваншизм',{atk:.06,buy:-.1}],['Право сильного',{conq:.25,atk:.05}]]},
  {n:'Тотальное государство',nodes:[['Партия и нация',{rec:.2,pop:.05}],['Автаркия',{bc:-.1}],['Оборонная промышленность',{fact:.3,inc:.06}],['Единый вождь',{up:-.12,def:.08,inc:.05}]]}],cap:['Эра завоеваний',{atk:.12,dc:-.15,up:-.15,heal:.4}]},
{k:'d',n:'Демократия',tag:'Свободный мир',ic:'ballot',col:'#62a4ff',info:'Золотая середина: крепкая экономика, сильные союзы и дипломатия, умеренная армия.',pros:['Союзы и отношения','Рост населения','Бонусы везде понемногу'],cons:['Повод к войне на 1 ход дольше'],base:{jt:-1},
 br:[{n:'Свободный рынок',nodes:[['Свободные рынки',{inc:.08,bc:-.08}],['Фондовая биржа',{inc:.1}],['Инновации',{tech:1,inc:.05}],['Глобальная торговля',{inc:.12,buy:-.1}]]},
  {n:'Союзы и права',nodes:[['Свободные выборы',{pop:.1,ally:.2,relg:.5}],['Дипломатическая служба',{relg:.5,ally:.15}],['Международное право',{ally:.2,def:.05}],['Лидер свободного мира',{ally:.25,relg:.5,inc:.05}]]},
  {n:'Гражданская армия',nodes:[['Добровольцы',{dc:-.1,up:-.08}],['Профессиональная армия',{atk:.06,def:.06}],['Военные технологии',{tech:1,atk:.05}],['Армия свободы',{dc:-.1,up:-.08,def:.08,jt:1}]]}],cap:['Свободный мир',{inc:.12,ally:.2,atk:.06,def:.1,pop:.1}]},
{k:'s',n:'Социализм',tag:'Союз Советов',ic:'rstar',col:'#e5534b',info:'Плановая экономика: мощные заводы и фермы, огромные запасы рекрутов, глухая оборона.',pros:['Сильные заводы','Много рекрутов','Крепкая оборона'],cons:['Покупка земель дороже на 25%'],base:{buy:.25},
 br:[{n:'Плановая экономика',nodes:[['Пятилетний план',{fact:.4,bc:-.1}],['Тяжёлая индустрия',{inc:.1,bc:-.15}],['Стахановцы',{fact:.3,inc:.05}],['Госпланирование',{inc:.12}]]},
  {n:'Народная армия',nodes:[['Всеобщая воинская обязанность',{rec:.3,dc:-.1}],['Красная армия',{atk:.08,up:-.08}],['Тыловое снабжение',{heal:.4}],['Мировая революция',{atk:.08,rec:.2,up:-.1}]]},
  {n:'Единый фронт',nodes:[['Коллективизация',{rec:.1}],['Железный занавес',{def:.15,ally:-.15}],['Идеологическое единство',{pop:.08,inc:.05}],['Союз народов',{def:.1,rec:.15,ally:.1}]]}],cap:['Страна Советов',{inc:.15,rec:.3,def:.12,up:-.12}]},
{k:'m',n:'Монархизм',tag:'Эра золота',ic:'crown',col:'#e6b450',info:'Богатая казна и налоги с населения. Придворная армия дорога.',pros:['Много монет','Налог с населения','Дешёвая покупка земель'],cons:['Призыв дороже на 10%'],base:{dc:.1},
 br:[{n:'Казна',nodes:[['Королевская казна',{inc:.1,tax:.5}],['Налоговая реформа',{tax:1,buy:-.1}],['Королевский банк',{inc:.12,tax:.5}],['Монополии короны',{inc:.12,tax:.7}]]},
  {n:'Двор и дипломатия',nodes:[['Придворная дипломатия',{relg:.5,ally:.15}],['Династические браки',{ally:.25,relg:.3}],['Купеческие гильдии',{fact:.4,bc:-.15}],['Королевская пошлина',{inc:.08,buy:-.12}]]},
  {n:'Гвардия',nodes:[['Рыцарская гвардия',{def:.1,heal:.2}],['Наёмники',{dc:-.12,rec:.1}],['Крепостные ополчения',{rec:.2,tax:.3,pop:-.08}],['Королевские полки',{atk:.08,def:.08,up:-.1}]]}],cap:['Эра золота',{inc:.2,tax:1,ally:.15,buy:-.1}]}];
const NM={};IDS.forEach((d,i)=>{d.i=i;d.br.forEach((b,bi)=>b.nodes.forEach((n,j)=>{NM[d.k+bi+j]={id:d.k+bi+j,n:n[0],m:n[1],t:j+1,dur:[3,4,5,6][j],bi,j,d:i}}));NM[d.k+'X']={id:d.k+'X',n:d.cap[0],m:d.cap[1],t:6,dur:8,cap:1,d:i}});
const OLDID={f1:'f00',f2:'f10',f3a:'f01',f3b:'f03',f4:'f11',f5:'f02',d1:'d10',d2:'d00',d3a:'d20',d3b:'d02',d4:'d11',d5:'d13',s1:'s00',s2:'s20',s3a:'s01',s3b:'s10',s4:'s21',s5:'s13',m1:'m00',m2:'m01',m3a:'m12',m3b:'m22',m4:'m02',m5:'m03'};
const MLB={inc:['Доход','%',1],tax:['Налог с населения','',1],up:['Содержание армии','%',-1],dc:['Цена призыва','%',-1],rec:['Рекруты','%',1],atk:['Атака','%',1],def:['Защита','%',1],heal:['Лечение армий','%',1],bc:['Цена зданий','%',-1],fact:['Сила заводов','%',1],relg:['Улучшение отношений','%',1],ally:['Шанс альянса','%',1],buy:['Цена покупки земель','%',-1],pop:['Рост населения','%',1],tech:['Технологии','',1],jt:['Повод к войне','',1],conq:['Армия в захваченных','%',1]};
const mTxt=(m,tags)=>MK.filter(k=>m[k]).map(k=>{const v=m[k],b=MLB[k],good=v*b[2]>0,s=k=='jt'?(v>0?'−'+v+' х.':'+'+(-v)+' х.'):(k=='tax'||k=='tech')?(v>0?'+':'')+(+v.toFixed(1)):(v>0?'+':'')+Math.round(v*100)+'%';return tags?'<span class="tag '+(good?'grn':'dng')+'">'+b[0]+' '+s+'</span>':b[0]+' '+s}).join(tags?'':', ');
const newID=()=>({i:-1,done:[],cur:null,left:0,sw:-99});
let ID=newID(),EV={last:-99,cur:null,o:-1,next:150},AID=K.map(()=>newID()),AFS=K.map(()=>[0,0,0]),AAL={},PM=[],PRJ=[],ACH={},LOGS=[],DIF=1,STOP=false,FFW=0,WM=0;
const PRJL=[{id:'p1',n:'Магистральная сеть',m:{bc:-.15,inc:.05}},{id:'p2',n:'Военная академия',m:{atk:.06,heal:.3}},{id:'p3',n:'Национальная библиотека',m:{tech:1}},{id:'p4',n:'Система ПВО',m:{def:.12}},{id:'p5',n:'Космодром',m:{inc:.15}},{id:'p6',n:'Больницы нации',m:{pop:.1,heal:.3}}];
const ACHL=[['conq1','Первая кровь','Захвати первую провинцию'],['prov25','Держава','Владей 25 провинциями'],['prov100','Империя','Владей 100 провинциями'],['ally1','Друг народов','Заключи первый альянс'],['cap1','Капитуляция','Заставь страну капитулировать'],['rich','Казна полна','Накопи 40 доходов'],['ideo','Эпоха','Изучи вершину идеологии'],['fact10','Индустриализация','Построй 10 заводов'],['peace','Мирные годы','50 ходов без войны'],['top3','Топ-3 по ВВП','Войди в тройку по ВВП'],['proj3','Мегастройка','Построй 3 нац. проекта'],['win','Господство','Победи в игре']];
const idCost=t=>Math.round(eco(PL).c*(5+3*t)),jt=()=>Math.max(2,5-MOD.jt),dco=()=>U[dt][2]*Math.max(.3,1+MOD.dc)*infl(PL);
const sOf=o=>o==PL?ID:AID[o],brDone=(S,d,bi)=>d.br[bi].nodes.every((n,j)=>S.done.includes(d.k+bi+j));
function nstate(S,nd){const d=IDS[nd.d];if(S.done.includes(nd.id))return'done';if(S.cur==nd.id)return'cur';if(nd.cap)return d.br.filter((b,bi)=>brDone(S,d,bi)).length>=2?'open':'lock';return nd.j==0||S.done.includes(d.k+nd.bi+(nd.j-1))?'open':'lock'}
function calcModFor(o){const m=MODS[o];MK.forEach(k=>m[k]=0);const S=sOf(o);if(S&&S.i>=0){const d=IDS[S.i];for(const k in d.base)m[k]+=d.base[k];S.done.forEach(id=>{const nd=NM[id];if(nd)for(const k in nd.m)m[k]+=nd.m[k]})}
 if(o==PL){PRJ.forEach(id=>{const p=PRJL.find(x=>x.id==id);if(p)for(const k in p.m)m[k]+=p.m[k]});PM.forEach(x=>{for(const k in x)m[k]+=x[k]})}}
const calcMod=()=>{if(PL>=0)calcModFor(PL)};
function migID(o){if(!o)return null;const mp=id=>NM[id]?id:OLDID[id];return{i:o.i,done:(o.done||[]).map(mp).filter(Boolean),cur:o.cur?mp(o.cur)||null:null,left:o.left||0,sw:o.sw??-99}}
const chron=s=>{LOGS.push({t:turn,s});if(LOGS.length>80)LOGS.shift()};
function ach(id){if(ACH[id])return;ACH[id]=turn;const a=ACHL.find(x=>x[0]==id);msg('Достижение: '+a[1]+'!');chron('Достижение: '+a[1])}
// ---------- AI: ideology, development, alliances ----------
function aiPickIdeo(o){const T=TR[o],g=K[o][3]/K[o][2],h=i=>((o*(31+i*17))%11)/11*.5,a=(T.ag-.25)/.67,s=[a*a*.8+h(0),(1-a)*.35+Math.min(.4,g/90)+h(1),.3+h(2)+(Math.abs(a-.5)<.3?.15:0),(T.gr-.5)/.6*.6+(g>40?.2:0)+h(3)+.1];return s.indexOf(Math.max(...s))}
function initAI(){AID=K.map(()=>newID());AFS=K.map(()=>[0,0,0]);AAL={};K.forEach((k,o)=>{if(o!=PL&&cnt(o)>0){AID[o].i=aiPickIdeo(o);AID[o].sw=0}});K.forEach((k,o)=>calcModFor(o))}
function nextAINode(o,S){const d=IDS[S.i],pref=(o*7)%3,open=[];d.br.forEach((b,bi)=>b.nodes.forEach((n,j)=>{const nd=NM[d.k+bi+j];if(nstate(S,nd)=='open')open.push([(bi==pref?0:1)*10+j,nd])}));const cp=NM[d.k+'X'];if(nstate(S,cp)=='open')return cp;open.sort((a,b)=>a[0]-b[0]);return open.length?open[0][1]:null}
function aiDev(o,e){const S=AID[o];if(!S||S.i<0)return;
 if(S.cur){S.left-=.5;if(S.left<=0){S.done.push(S.cur);S.cur=null;calcModFor(o)}}else{const nd=nextAINode(o,S);if(nd){const c=e.c*(5+3*nd.t);if(M[o]>=c*1.4){M[o]-=c;S.cur=nd.id;S.left=nd.dur}}}
 for(let f=0;f<2;f++)if(!AFS[o][f]){const c=e.c*(7+2*f);if(M[o]>=c*1.6){M[o]-=c;AFS[o][f]=1}break}}
const allied=(a,b)=>(wk(a,b) in AAL)||(a==PL&&!!AL[b])||(b==PL&&!!AL[a]);
const nAL=o=>Object.keys(AAL).filter(k=>k.split('-').includes(String(o))).length;
function aiAlly(o,cp){if(Math.random()>.025||nAL(o)>=2)return;const nb=new Set();cp.forEach(p=>p.n.forEach(j=>{const x=P[j].o;if(x!=o&&x!=PL&&cnt(x)&&!atWar(o,x)&&!allied(o,x)&&nAL(x)<2)nb.add(x)}));
 const l=[...nb].filter(x=>AID[x].i==AID[o].i||Math.random()<.2);if(!l.length)return;const x=pick(l);AAL[wk(o,x)]=turn;chron(K[o][0]+' и '+K[x][0]+' заключили альянс.')}
function tickAI(){for(const k of Object.keys(AAL)){const[x,y]=k.split('-').map(Number);if(!cnt(x)||!cnt(y)||atWar(x,y))delete AAL[k]}}
function idAff(o){const a=ID.i,b=AID[o]?AID[o].i:-1;if(a<0||b<0)return 0;if(a==b)return 1;const s=[a,b].sort().join();return({'0,1':-1,'0,2':-1,'1,2':-.5,'2,3':-1,'1,3':.3,'0,3':.2})[s]||0}
const ideoTag=o=>{const S=sOf(o);return S&&S.i>=0?I(IDS[S.i].ic)+' '+IDS[S.i].n:''};
// ---------- player ideology ----------
function nodeHTML(d,nd){const s=nstate(ID,nd),c=idCost(nd.t),cp=M[PL]>=c;
 const tg=s=='done'?'<span class="tag grn">'+I('check')+'Изучено</span>':s=='cur'?'<span class="tag">В разработке · '+ID.left+' х.</span>':s=='lock'?'<span class="tag">'+I('lock')+(nd.cap?'Нужны 2 ветки':'Закрыто')+'</span>':'';
 return'<div class="node '+s+'" style="--c:'+d.col+'"><div class="ttl">'+nd.n+'</div><div class="mut">'+mTxt(nd.m)+'</div><div class="row" style="margin-top:8px">'+(s=='open'?'<button class="btn bld" style="--c:'+d.col+'" onclick="research(\''+nd.id+'\')"'+(ID.cur||!cp?' disabled':'')+'>'+fC(c)+I('coin')+'<span>· '+nd.dur+' х.</span></button>'+(ID.cur?'<small>идёт другая разработка</small>':!cp?'<small>не хватает монет</small>':''):tg)+'</div></div>'}
function ideoUI(){if(ID.i<0)return'<div class="sec">'+I('star')+'Выбери идеологию</div><div class="mut">У каждой идеологии 3 ветки развития и вершина, которая открывается после двух завершённых веток. Первый выбор бесплатный, смена потом дорогая и сбрасывает прогресс. ИИ-страны тоже выбирают идеологии и развивают их.</div>'+
  IDS.map((d,i)=>'<div class="panel idc" style="--c:'+d.col+'"><div class="ch">'+I(d.ic).replace('class="ic"','class="ic big"')+'<div class="grow"><div class="ttl">'+d.n+'</div><div class="mut">«'+d.tag+'» · ветки: '+d.br.map(b=>b.n).join(', ')+'</div></div></div><div class="mut">'+d.info+'</div><div class="tags" style="margin:8px 0">'+d.pros.map(x=>'<span class="tag grn">'+x+'</span>').join('')+d.cons.map(x=>'<span class="tag dng">'+x+'</span>').join('')+'</div><button class="btn pri" onclick="pickIdeo('+i+')">Выбрать</button></div>').join('');
 const d=IDS[ID.i];let h='<div class="panel idc" style="--c:'+d.col+'"><div class="ch">'+I(d.ic).replace('class="ic"','class="ic big"')+'<div class="grow"><div class="ttl">'+d.n+' · «'+d.tag+'»</div><div class="mut">'+d.info+'</div></div></div><div class="tags">'+(mTxt(MODS[PL],1)||'<span class="mut">Бонусов пока нет.</span>')+'</div></div>';
 if(ID.cur){const nd=NM[ID.cur];h+='<div class="panel"><b>В разработке: '+nd.n+'</b><div class="bar" style="margin:8px 0"><i style="width:'+Math.round((1-ID.left/nd.dur)*100)+'%;background:'+d.col+'"></i></div><small>Осталось ходов: '+ID.left+'</small></div>'}
 d.br.forEach((b,bi)=>{const dn=b.nodes.filter((n,j)=>ID.done.includes(d.k+bi+j)).length;h+='<div class="sec">Ветка '+(bi+1)+' · '+b.n+' <small>'+dn+'/4</small></div><div class="nodes">'+b.nodes.map((n,j)=>nodeHTML(d,NM[d.k+bi+j])).join('')+'</div>'});
 h+='<div class="sec">'+I('star')+'Вершина · '+d.cap[0]+'</div><div class="nodes">'+nodeHTML(d,NM[d.k+'X'])+'</div>';
 return h+'<div class="row" style="margin-top:14px"><button class="btn dng" onclick="switchIdeo()">Сменить идеологию · '+fC(Math.round(eco(PL).c*30))+I('coin')+'</button></div>'}
function pickIdeo(i){ID={i,done:[],cur:null,left:0,sw:turn};calcMod();msg('Идеология: '+IDS[i].n+' — «'+IDS[i].tag+'».');chron('Ты выбрал идеологию: '+IDS[i].n+'.');more();hud()}
function research(id){const nd=NM[id];if(!nd||ID.cur||ID.i<0||nd.d!=ID.i||nstate(ID,nd)!='open')return;const c=idCost(nd.t);if(M[PL]<c){msg('Не хватает монет: нужно '+fC(c)+'.');return}
 M[PL]-=c;ID.cur=id;ID.left=nd.dur;msg('Разработка начата: '+nd.n+' ('+nd.dur+' х.).');more();hud()}
function tickIdeo(){if(!ID.cur)return;ID.left--;if(ID.left<=0){const nd=NM[ID.cur];ID.done.push(ID.cur);ID.cur=null;ID.left=0;calcMod();msg('Изучено: '+nd.n+'.');chron('Изучено: '+nd.n+'.')}}
function switchIdeo(){const c=Math.round(eco(PL).c*30);if(turn-ID.sw<15){msg('Идеологию нельзя менять чаще, чем раз в 15 ходов.');return}if(M[PL]<c){msg('Не хватает монет: нужно '+fC(c)+'.');return}
 if(!confirm('Сменить идеологию? Прогресс ветки сбросится.'))return;M[PL]-=c;ID=newID();ID.sw=turn;calcMod();msg('Идеология сброшена. Выбери новую.');more();hud()}
// ---------- projects, difficulty ----------
function projUI(){const c=Math.round(eco(PL).c*18);return'<div class="sec">'+I('build')+'Национальные проекты</div><div class="mut">Постоянные бонусы для любой идеологии. Цена: '+fC(c)+'.</div><div class="nodes" style="margin-top:6px">'+PRJL.map(p=>{const d=PRJ.includes(p.id);return'<div class="node '+(d?'done':'open')+'" style="--c:var(--gold)"><div class="ttl">'+p.n+'</div><div class="mut">'+mTxt(p.m)+'</div><div class="row" style="margin-top:8px">'+(d?'<span class="tag grn">'+I('check')+'Построено</span>':'<button class="btn bld" style="--c:var(--gold)" onclick="buildProj(\''+p.id+'\')"'+(M[PL]<c?' disabled':'')+'>'+fC(c)+I('coin')+'</button>')+'</div></div>'}).join('')+'</div>'}
function buildProj(id){const c=Math.round(eco(PL).c*18);if(PRJ.includes(id)||M[PL]<c)return;M[PL]-=c;PRJ.push(id);calcMod();const p=PRJL.find(x=>x.id==id);msg('Проект построен: '+p.n+'.');chron('Проект: '+p.n+'.');more();hud()}
function diffUI(){return'<div class="sec">Сложность ИИ</div><div class="seg">'+['Лёгкая','Нормальная','Тяжёлая'].map((n,i)=>'<button class="btn '+(DIF==i?'on':'')+'" onclick="DIF='+i+';more()">'+n+'</button>').join('')+'</div><div class="mut" style="margin-top:6px">Влияет на агрессию и доходы ИИ-стран.</div>'}
// ---------- world tab ----------
function hints(){const e=eco(PL),h=[];if(ID.i<0&&turn>=2)h.push('Выбери идеологию во вкладке «Идеология»: это постоянные бонусы.');else if(ID.i>=0&&!ID.cur)h.push('Ветка идеологии простаивает: начни следующую разработку.');
 {const s=Supply.stat(P,SUPF,PL);if(s.cut)h.push('Армии в котле: верни связь с территорией страны, иначе они вымрут.')}if(SUR[PL])h.push('Капитуляция: '+Math.round(SUR[PL])+'%. Верни потерянные провинции.');if(infl(PL)>1)h.push('Инфляция ×'+infl(PL).toFixed(2)+': найм и содержание армии дорожают. Потрать казну.');if(M[PL]>12*e.c)h.push('Много монет простаивает: вложи в стройку, проекты или армию.');
 const en=K.map((k,o)=>o).filter(o=>o!=PL&&atWar(PL,o)&&cnt(o)&&intel(o)>0);if(en.length){calcST();const w=en.find(o=>ST[o]>ST[PL]);if(w!==undefined)h.push(K[w][0]+' сильнее тебя: призови армию или проси мира.')}
 if(!Object.keys(AL).length&&turn>=10&&!warAny())h.push('Нет союзников: улучши отношения и предложи альянс.');if(PRJ.length<2&&M[PL]>e.c*18)h.push('Хватает денег на национальный проект.');return h.slice(0,3)}
function rankHTML(){const mets=[['ВВП',o=>eco(o).gd,v=>fG(v)],['Армия',o=>intelKey(o),(v,o)=>intelArmy(o)],['Провинции',o=>cnt(o),v=>v],['Население',o=>eco(o).pp,v=>fp(v)]],m=mets[WM];
 const l=K.map((k,o)=>o).filter(o=>cnt(o)).map(o=>[o,m[1](o)]).filter(x=>WM!=1||x[1]>=0).sort((a,b)=>b[1]-a[1]),me=l.findIndex(x=>x[0]==PL),row=(x,i)=>'<div class="rk '+(x[0]==PL?'me':'')+'"><span class="n">'+(i+1)+'</span><span class="flg" style="font-size:20px">'+fl(x[0])+'</span><span class="grow"><b>'+K[x[0]][0]+'</b></span><span class="mut">'+ideoTag(x[0])+'</span><b>'+m[2](x[1],x[0])+'</b></div>';
 return'<div class="seg">'+mets.map((x,i)=>'<button class="btn '+(WM==i?'on':'')+'" onclick="WM='+i+';more()">'+x[0]+'</button>').join('')+'</div><div style="margin-top:8px">'+l.slice(0,8).map(row).join('')+(me>=8?'<div class="mut" style="text-align:center">…</div>'+row(l[me],me):'')+(WM==1?'<div class="mut" style="text-align:center;margin-top:6px">Остальные страны вне разведки: неизвестно</div>':'')+'</div>'}
function worldUI(){const hs=hints(),alive=K.map((k,o)=>o).filter(o=>cnt(o)),dist=IDS.map((d,i)=>[d,alive.filter(o=>sOf(o)&&sOf(o).i==i).length]);
 let h='<div class="sec">'+I('play')+'Пропуск ходов</div><div class="seg"><button class="btn" onclick="ffwd(5)">5 ходов</button><button class="btn" onclick="ffwd(10)">10 ходов</button><button class="btn" onclick="ffwd(25)">25 ходов</button></div><div class="mut" style="margin-top:6px">Остановится при войне против тебя, захвате столицы или мировом событии. Следующее мировое событие примерно через '+Math.max(1,EV.next-turn)+' ходов.</div>';
 if(hs.length)h+='<div class="sec">'+I('star')+'Советник</div>'+hs.map(x=>'<div class="hint">'+x+'</div>').join('');
 h+='<div class="sec">'+I('trend')+'Рейтинг стран</div>'+rankHTML();
 h+='<div class="sec">'+I('star')+'Идеологии мира</div>'+dist.map(x=>'<div class="rk"><span class="grow">'+I(x[0].ic)+' <b>'+x[0].n+'</b></span><div class="bar" style="width:40%"><i style="width:'+Math.round(x[1]/Math.max(1,alive.length)*100)+'%;background:'+x[0].col+'"></i></div><b>'+x[1]+'</b></div>').join('');
 const al=Object.keys(AAL).map(k=>k.split('-').map(Number)),mine=Object.keys(AL).map(Number).filter(cnt);
 h+='<div class="sec">'+I('chain')+'Блоки и альянсы</div>'+((al.length||mine.length)?'<div class="flags">'+mine.map(o=>'<div class="fg ok"><span>'+fl(PL)+fl(o)+'</span><small>ты + '+K[o][0]+'</small></div>').join('')+al.slice(0,10).map(([a,b])=>'<div class="fg"><span>'+fl(a)+fl(b)+'</span><small>'+K[a][0]+' + '+K[b][0]+'</small></div>').join('')+'</div>':'<div class="mut">Пока никто не объединился.</div>');
 h+='<div class="sec">'+I('medal')+'Достижения · '+Object.keys(ACH).length+'/'+ACHL.length+'</div><div class="achs">'+ACHL.map(a=>'<div class="ach '+(ACH[a[0]]?'on':'')+'">'+I('medal')+'<b>'+a[1]+'</b><small>'+a[2]+'</small></div>').join('')+'</div>';
 h+='<div class="sec">Хроника</div>'+(LOGS.length?LOGS.slice(-20).reverse().map(x=>'<div class="log"><b>х.'+x.t+'</b>'+x.s+'</div>').join(''):'<div class="mut">Пока тихо.</div>');return h}
function checkAch(){if(PL<0)return;const n=cnt(PL);if(n>=25)ach('prov25');if(n>=100)ach('prov100');if(Object.keys(AL).length)ach('ally1');if(M[PL]>=40*eco(PL).c&&turn>5)ach('rich');
 if(ID.i>=0&&ID.done.includes(IDS[ID.i].k+'X'))ach('ideo');if(P.reduce((s,p)=>s+(p.o==PL?p.b[1]:0),0)>=10)ach('fact10');if(turn>=50&&turn-LWA>=50)ach('peace');if(PRJ.length>=3)ach('proj3');
 if(over&&n>=P.length*.3)ach('win');if(turn%10==0){const l=K.map((k,o)=>o).filter(o=>cnt(o)).map(o=>[o,eco(o).gd]).sort((a,b)=>b[1]-a[1]);if(l.findIndex(x=>x[0]==PL)<3)ach('top3')}}
function ffwd(n){if(PL<0||over||EV.cur)return;closeMore();FFW=1;STOP=false;let i=0;for(;i<n&&!STOP&&!over&&!EV.cur;i++)nextTurn();FFW=0;draw();hud();showCard();msg(STOP||EV.cur?'Пропуск остановлен на '+i+'-м ходу: важное событие.':'Пропущено ходов: '+i+'.')}
// ---------- epic world events (about every 150 turns) ----------
const INC=()=>Math.max(60,eco(PL).c),nbList=()=>{const s=new Set();P.forEach(p=>{if(p.o==PL)p.n.forEach(j=>{const o=P[j].o;if(o!=PL&&cnt(o))s.add(o)})});return[...s]},allC=f=>K.forEach((k,o)=>{if(cnt(o))f(o)}),popAll=(o,f)=>P.forEach(p=>{if(p.o==o)p.pop*=f}),pm=m=>{PM.push(m);calcMod()};
const EVS=[
{t:'Великая депрессия',x:()=>'Мировые рынки рухнули: все страны потеряли 35% казны.',pre:()=>allC(o=>{M[o]*=.65}),ch:[{l:'Затянуть пояса',d:()=>'Ничего не делать',f:()=>{}},{l:'Новый курс',d:()=>'−'+fC(2*INC())+' монет, доход +6% навсегда',f:()=>{M[PL]-=2*INC();pm({inc:.06})}},{l:'Протекционизм',d:()=>'Заводы сильнее на 20%, здания дешевле на 5%, отношения со всеми −3',f:()=>{pm({fact:.2,bc:-.05});allC(o=>{if(o!=PL)REL[o]=Math.max(0,REL[o]-3)})}}]},
{t:'Мировая пандемия',x:()=>'Эпидемия охватила планету: население всех стран упало на 4%.',pre:()=>allC(o=>popAll(o,.96)),ch:[{l:'Карантин и вакцина',d:()=>'−'+fC(3*INC())+' монет, рост населения +5% навсегда',f:()=>{M[PL]-=3*INC();pm({pop:.05})}},{l:'Открытые границы',d:()=>'+'+fC(2*INC())+' монет от торговли, население ещё −3%',f:()=>{M[PL]+=2*INC();popAll(PL,.97)}},{l:'Военная медицина',v:()=>ID.i==0||ID.i==2,d:()=>'−'+fC(INC())+' монет, лечение армий +30% навсегда',f:()=>{M[PL]-=INC();pm({heal:.3})}}]},
{t:'Научная революция',x:()=>'Прорыв в науке открывает новые возможности.',ch:[{l:'Академии наук',d:()=>'−'+fC(2*INC())+' монет, доход +5% навсегда',f:()=>{M[PL]-=2*INC();pm({inc:.05})}},{l:'Военные лаборатории',d:()=>'−'+fC(2*INC())+' монет, атака +5%, защита +3% навсегда',f:()=>{M[PL]-=2*INC();pm({atk:.05,def:.03})}},{l:'Аграрная наука',d:()=>'−'+fC(2*INC())+' монет, рост населения +3% навсегда',f:()=>{M[PL]-=2*INC();pm({pop:.03})}}]},
{t:'Золотая лихорадка',x:()=>'В недрах найдены огромные запасы золота.',ch:[{l:'Государственная добыча',d:()=>'+'+fC(10*INC())+' монет',f:()=>{M[PL]+=10*INC()}},{l:'Частные компании',d:()=>'+'+fC(6*INC())+' монет, налог с населения +0.3 навсегда',f:()=>{M[PL]+=6*INC();pm({tax:.3})}},{l:'Королевская монополия',v:()=>ID.i==3,d:()=>'+'+fC(14*INC())+' монет (монархизм)',f:()=>{M[PL]+=14*INC()}}]},
{t:'Гонка вооружений',x:()=>'Все ИИ-державы наращивают армии на 10%.',pre:()=>allC(o=>{if(o!=PL)P.forEach(p=>{if(p.o==o){p.a*=1.1;p.m=Math.max(p.m,p.a)}})}),ch:[{l:'Ответить тем же',d:()=>'−'+fC(4*INC())+' монет, армия +15%',f:()=>{M[PL]-=4*INC();P.forEach(p=>{if(p.o==PL){p.a*=1.15;p.m=Math.max(p.m,p.a)}})}},{l:'Договор об ограничении',d:()=>'Отношения с соседями +8',f:()=>{nbList().forEach(o=>{REL[o]=Math.min(100,REL[o]+8)})}},{l:'Сэкономить',d:()=>'+'+fC(2*INC())+' монет',f:()=>{M[PL]+=2*INC()}}]},
{t:'Революционная волна',x:()=>'Волна революций сотрясает мир: отношения всех стран ухудшились.',pre:()=>allC(o=>{if(o!=PL)REL[o]=Math.max(0,REL[o]-5)}),ch:[{l:'Поддержать реформы',d:()=>'−'+fC(2*INC())+' монет, рост населения +5%, доход +3% навсегда',f:()=>{M[PL]-=2*INC();pm({pop:.05,inc:.03})}},{l:'Жёсткий порядок',d:()=>'Содержание армии −6%, защита +5% навсегда',f:()=>{pm({up:-.06,def:.05})}},{l:'Экспорт революции',v:()=>ID.i==2,d:()=>'Армии соседей −10%, отношения с ними −10 (социализм)',f:()=>{nbList().forEach(o=>{popAll(o,1);P.forEach(p=>{if(p.o==o)p.a*=.9});REL[o]=Math.max(0,REL[o]-10)})}}]},

{t:'Эпоха перемен',init:()=>ID.i>=0,x:()=>'Общество требует нового курса. Пора решить, куда вести страну.',ch:[{l:'Сменить курс бесплатно',d:()=>'Идеология сбрасывается, выбери новую без платы',f:()=>{ID=newID();calcMod()}},{l:'Ускорить реформы',d:()=>ID.cur?'−'+fC(3*INC())+' монет, текущая разработка быстрее на 3 хода':'+'+fC(4*INC())+' монет',f:()=>{if(ID.cur){M[PL]-=3*INC();ID.left=Math.max(1,ID.left-3)}else M[PL]+=4*INC()}},{l:'Остаться при своём',d:()=>'+'+fC(2*INC())+' монет',f:()=>{M[PL]+=2*INC()}}]}];
function maybeEvent(){if(over||EV.cur||PL<0||turn<EV.next)return;const ok=EVS.filter(e=>!e.init||e.init());if(!ok.length)return;const e=pick(ok);EV.cur=e;EV.next=turn+150+Math.round(Math.random()*40-20);if(e.pre)e.pre();chron('Мировое событие: '+e.t+'.');STOP=true;showEvent()}
function showEvent(){const e=EV.cur;$('ev').innerHTML='<div class="evb"><span class="tag">'+I('star')+'Мировое событие</span><div class="ttl" style="font-size:22px;margin-top:6px">'+e.t+'</div><p>'+e.x()+'</p>'+e.ch.map((c,i)=>c.v&&!c.v()?'':'<button class="btn wide" style="margin-top:8px;flex-direction:column;align-items:flex-start;height:auto;padding:10px 14px;text-align:left" onclick="chooseEv('+i+')"><b>'+c.l+'</b><small>'+c.d()+'</small></button>').join('')+'</div>';$('ev').style.display='block'}
function chooseEv(i){const e=EV.cur;if(!e)return;e.ch[i].f();M[PL]=Math.max(0,M[PL]);chron('Ты выбрал: '+e.ch[i].l+'.');EV.cur=null;$('ev').style.display='none';draw();hud();showCard();if($('more').style.display=='block')more()}
// ---------- save ----------
const SK=s=>'ww8-'+s;
function slotMeta(s){try{return JSON.parse(localStorage.getItem(SK(s)+'m'))}catch(e){return null}}
function snap(){return{PL,turn,M,RC,sold,W,J,up,fs,rules,over,init,PA,WG,REL,MOOD,CAPT,SUR,AL,LWA,RLT,ALC,BOUGHT,ID,evl:EV.last,evn:EV.next,AID,AFS,AAL,PM,PRJ,ACH,LOGS:LOGS.slice(-40),DIF,cs:CS,P:P.map(p=>[p.o,+p.a.toFixed(3),+p.m.toFixed(3),Math.round(p.pop*100)/100,p.b[0],p.b[1],p.b[2]])}}
function saveTo(s){try{localStorage.setItem(SK(s),JSON.stringify(snap()));localStorage.setItem(SK(s)+'m',JSON.stringify({t:turn,f:fl(PL),n:K[PL][0]}));if(s!='a'){msg('Сохранено в слот '+s+'.');more()}return true}catch(e){if(s!='a')msg('Сохранение недоступно в этом браузере.');return false}}
function loadFrom(s){try{const d=JSON.parse(localStorage.getItem(SK(s)));PL=d.PL;turn=d.turn;M=d.cs?d.M:d.M.map(x=>x*CS);RC=d.RC;sold=d.sold;W=d.W;J=d.J;PA=d.PA;WG=d.WG;CAPT=d.CAPT||{};SUR=d.SUR||{};VP0=calcVP0();AL=d.AL||{};BOUGHT=d.BOUGHT||0;ID=migID(d.ID)||newID();PM=d.PM||[];PRJ=d.PRJ||[];ACH=d.ACH||{};LOGS=d.LOGS||[];DIF=d.DIF??1;EV={last:d.evl??-99,cur:null,o:-1,next:d.evn??(d.turn+150)};AID=d.AID||null;AFS=d.AFS||K.map(()=>[0,0,0]);AAL=d.AAL||{};if(!AID)initAI();else K.forEach((k,o)=>calcModFor(o));$('ev').style.display='none';LWA=d.LWA??-99;RLT=d.RLT||{};ALC=d.ALC||{};REL=d.REL;MOOD=d.MOOD;DP=null;$('dip').style.display='none';up=d.up;fs=d.fs;rules=d.rules;over=d.over;init=d.init;sel=-1;
 P.forEach((p,i)=>{const v=d.P[i];p.o=v[0];p.a=v[1];p.m=v[2];p.pop=v[3];p.b=[v[4],v[5],v[6]]});$('more').style.display='none';focusOn(cap[PL],3.5);draw();hud();showCard();msg('Игра загружена: ход '+turn+'.')}catch(e){msg('Не удалось загрузить сохранение.')}}
// ---------- UI ----------






up={tech:0,atk:0,def:0};fs=[0,0,0];rules={buy:true,upkeep:true};W={};J={};
V.s=minS();apply();draw();startScreen();
