import json,re,glob,math,heapq,numpy as np
from collections import defaultdict
from shapely.geometry import shape
from shapely import clip_by_rect
from shapely.affinity import scale as sscale
from shapely.ops import transform
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt as EDT
from scipy.cluster.vq import kmeans2

SRC=glob.glob('/mnt/user-data/uploads/*.html')[0]
s=open(SRC,encoding='utf-8').read()
def arr(name):
    i=s.index(name+'=[')+len(name)+1;d=0
    for j in range(i,len(s)):
        d+=(s[j]=='[')-(s[j]==']')
        if d==0:return json.loads(s[i:j+1]),i,j+1
K=json.loads(re.search(r'const K=(\[.*?\]);',s).group(1))
iso2k={k[1]:i for i,k in enumerate(K)}
MW=1200;LT,LB=83.6,-56.0
my=lambda la:math.asinh(math.tan(math.radians(la)))
YT,YB=my(LT),my(LB);MH=round(MW*(YT-YB)/(2*math.pi))
def proj(x,y):
    x=np.asarray(x,float);y=np.clip(np.asarray(y,float),LB,LT)
    return (x+180)/360*MW,(YT-np.arcsinh(np.tan(np.radians(y))))/(YT-YB)*MH
OV={'KOS':'XK','FRO':'DK','SJM':'NO','GGY':'GB','JEY':'GB','IMN':'GB','ALA':'FI','CYN':'CY','SOL':'SO','PSE':'IL','MAC':'CN'}
up=lambda p:{k.upper():v for k,v in p.items()}
C=json.load(open('c10.json'))['features']
a3k={}
geo=defaultdict(list)
for f in C:
    p=up(f['properties']);a3=p.get('ADM0_A3')
    iso=p.get('ISO_A2_EH') or p.get('ISO_A2')
    if iso in (None,'-99','-1'):iso=OV.get(a3)
    iso=OV.get(a3,iso)
    if iso in iso2k:
        a3k[a3]=iso2k[iso];geo[iso2k[iso]].append(shape(f['geometry']))
print('countries matched',len(geo),'of',len(K),'missing',[K[i][0] for i in range(len(K)) if i not in geo])
A1=defaultdict(list)
for f in json.load(open('a1.json'))['features']:
    p=up(f['properties']);k=a3k.get(p.get('ADM0_A3'))
    if k is not None and f['geometry']:A1[k].append(shape(f['geometry']))
# --- projection + exaggeration of small countries
def prj(g):
    g=clip_by_rect(g,-180,LB,180,LT)
    return transform(proj,g) if not g.is_empty else g
CG={};AG=defaultdict(list)
for k,gs in geo.items():
    pg=[prj(g) for g in gs];pg=[g for g in pg if not g.is_empty]
    if not pg:continue
    b=np.array([g.bounds for g in pg]);x0,y0,x1,y1=b[:,0].min(),b[:,1].min(),b[:,2].max(),b[:,3].max()
    size=max(x1-x0,y1-y0,.05);f=1.0
    if size<30:f=min((size+2.5*math.exp(-size/4))/size,30)
    o=((x0+x1)/2,(y0+y1)/2)
    ex=lambda g:sscale(g,f,f,origin=o) if f>1 else g
    CG[k]=[ex(g) for g in pg]
    for g in A1.get(k,[]):
        q=prj(g)
        if not q.is_empty:AG[k].append(ex(q))
def polys(g):
    return list(g.geoms) if hasattr(g,'geoms') else [g]
def draw(dr,g,v):
    for pl in polys(g):
        if pl.geom_type!='Polygon' or pl.is_empty:continue
        c=[(x,y) for x,y in pl.exterior.coords]
        if len(c)>=3:dr.polygon(c,fill=v)
        else:dr.point(c[0],fill=v)
# country canvas, small countries drawn last
cim=Image.new('I',(MW,MH),0);cd=ImageDraw.Draw(cim)
for k in sorted(CG,key=lambda k:-sum(g.area for g in CG[k])):
    for g in CG[k]:draw(cd,g,k+1)
Cm=np.array(cim)
for k in CG:  # guarantee presence
    if not (Cm==k+1).any():
        c=CG[k][0].centroid;cd.ellipse([c.x-1.5,c.y-1.5,c.x+1.5,c.y+1.5],fill=k+1);Cm=np.array(cim)
# admin-1 canvas
items=[(k,g) for k in AG for g in AG[k]];items.sort(key=lambda t:-t[1].area)
pim=Image.new('I',(MW,MH),0);pd_=ImageDraw.Draw(pim);own=[-1]
for k,g in items:
    own.append(k);draw(pd_,g,len(own)-1)
Pm=np.array(pim);own=np.array(own)
lab=np.full((MH,MW),-1,np.int64);land=Cm>0
ok=land&(Pm>0)&(own[Pm]==Cm-1)
lab[ok]=Pm[ok];nxt=len(own)+1
for k in CG:
    ys,xs=np.nonzero(Cm==k+1)
    y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    sub=lab[y0:y1,x0:x1];m=Cm[y0:y1,x0:x1]==k+1;src=np.where(m&(sub>=0),sub,-1)
    if (src>=0).sum()==0:sub[m]=nxt;nxt+=1;continue
    if ((src<0)&m).any():
        _,(iy,ix)=EDT(src<0,return_indices=True);fill=src[iy,ix];sub[m&(sub<0)]=fill[m&(sub<0)]
H,W=lab.shape
rowlat=np.degrees(np.arctan(np.sinh(YT-(np.arange(H)+.5)/H*(YT-YB))))
rw=np.cos(np.radians(rowlat))**2;RW=np.repeat(rw[:,None],W,1)
def compact(lab):
    u,inv=np.unique(lab[lab>=0],return_inverse=True);o=np.full_like(lab,-1);o[lab>=0]=inv;return o,len(u)
lab,n=compact(lab)
cown=np.zeros(n,int)
fl=lab.ravel();cm=Cm.ravel()
for p in range(n):pass
cown=np.zeros(n,int);idx=np.nonzero(fl>=0)[0];cown[fl[idx]]=cm[idx]-1
# --- merge tiny provinces inside a country
MINPX=28
def nbrs(lab):
    d=defaultdict(lambda:defaultdict(int))
    for a,b in ((lab[:,:-1],lab[:,1:]),(lab[:-1],lab[1:])):
        m=(a>=0)&(b>=0)&(a!=b);aa,bb=a[m],b[m]
        for x,y in zip(*np.unique(np.stack([np.minimum(aa,bb),np.maximum(aa,bb)]),axis=1,return_counts=False) if False else (aa,bb)):d[x][y]+=1;d[y][x]+=1
    return d
adj=nbrs(lab)
px=np.bincount(fl[fl>=0],minlength=n).astype(float)
ys,xs=np.divmod(np.arange(fl.size),W)
cx=np.bincount(fl[idx],weights=xs[idx],minlength=n);cy=np.bincount(fl[idx],weights=ys[idx],minlength=n)
par=list(range(n))
def fnd(a):
    while par[a]!=a:par[a]=par[par[a]];a=par[a]
    return a
byc=defaultdict(set)
for p in range(n):byc[cown[p]].add(p)
for k,ps in byc.items():
    h=[(px[p],p) for p in ps];heapq.heapify(h)
    while h and len(ps)>1:
        v,p=heapq.heappop(h)
        if p not in ps or v!=px[p]:continue
        if v>=MINPX:break
        cand={q:c for q,c in adj[p].items() if q in ps and q!=p}
        t=max(cand,key=cand.get) if cand else min((q for q in ps if q!=p),key=lambda q:(cx[q]/max(px[q],1)-cx[p]/max(px[p],1))**2+(cy[q]/max(px[q],1)-cy[p]/max(px[p],1))**2)
        for q,c in adj[p].items():
            if q==t:continue
            adj[t][q]+=c;adj[q][t]+=c;adj[q].pop(p,None)
        adj[t].pop(p,None);del adj[p]
        px[t]+=px[p];cx[t]+=cx[p];cy[t]+=cy[p];par[p]=t;ps.discard(p);heapq.heappush(h,(px[t],t))
lab=np.where(lab>=0,np.array([fnd(i) for i in range(n)])[np.maximum(lab,0)],-1)
lab,n=compact(lab);fl=lab.ravel();idx=np.nonzero(fl>=0)[0]
cown=np.zeros(n,int);cown[fl[idx]]=cm[idx]-1
# --- split huge provinces so they play like normal ones
order=np.argsort(fl,kind='stable');cnts=np.bincount(fl[idx],minlength=n);starts=np.concatenate([[0],np.cumsum(cnts)])+(fl<0).sum()
ae=np.bincount(fl[idx],weights=RW.ravel()[idx],minlength=n)
def splitall(MAXA):
    L=lab.copy().ravel();nx=n
    for p in np.nonzero(ae>MAXA)[0]:
        pts=order[starts[p]:starts[p+1]];kk=int(math.ceil(ae[p]/MAXA))
        xy=np.stack([pts%W,pts//W],1).astype(float)
        np.random.seed(p);_,l=kmeans2(xy,kk,minit='points',seed=p)
        for c in range(1,kk):
            sel=pts[l==c]
            if len(sel):L[sel]=nx;nx+=1
    return L.reshape(lab.shape)
for MAXA in (300,380,500,700,900):
    L2=splitall(MAXA);L2,n2=compact(L2)
    print('MAXA',MAXA,'provinces',n2)
    if n2<=3800:break
lab,n=L2,n2;fl=lab.ravel();idx=np.nonzero(fl>=0)[0]
cown=np.zeros(n,int);cown[fl[idx]]=cm[idx]-1
# renumber grouped by country
perm=np.argsort(cown,kind='stable');inv=np.empty(n,int);inv[perm]=np.arange(n)
lab=np.where(lab>=0,inv[np.maximum(lab,0)],-1);fl=lab.ravel();cown=cown[perm]
cnts=np.bincount(fl[idx],minlength=n);ae=np.bincount(fl[idx],weights=RW.ravel()[idx],minlength=n)
order=np.argsort(fl,kind='stable');starts=np.concatenate([[0],np.cumsum(cnts)])+(fl<0).sum()
PD=[]
for p in range(n):
    pts=order[starts[p]:starts[p+1]];x=pts%W;y=pts//W;j=np.argmin((x-x.mean())**2+(y-y.mean())**2)
    PD.append([int(cown[p]),int(x[j]),int(y[j]),max(1,int(round(ae[p])))])
# --- adjacency incl. short sea links
R=9
dist,(iy,ix)=EDT(lab<0,return_indices=True);near=lab[iy,ix];E=set()
for dy,dx in ((0,1),(1,0),(1,1),(1,-1)):
    if dx>=0:a=near[:H-dy,:W-dx];b=near[dy:,dx:];da=dist[:H-dy,:W-dx];db=dist[dy:,dx:]
    else:a=near[:H-dy,1:];b=near[dy:,:W-1];da=dist[:H-dy,1:];db=dist[dy:,:W-1]
    m=(a!=b)&(da+db<=R);pr=np.unique(np.stack([np.minimum(a[m],b[m]),np.maximum(a[m],b[m])]),axis=1)
    E.update(map(tuple,pr.T.tolist()))
par=list(range(n))
for a,b in E:par[fnd(a)]=fnd(b)
gx=np.array([d[1] for d in PD]);gy=np.array([d[2] for d in PD])
comp=defaultdict(list)
for p in range(n):comp[fnd(p)].append(p)
main=max(comp.values(),key=len);mm=np.array(main)
for c in comp.values():
    if c is main or fnd(c[0])==fnd(main[0]):continue
    best=min(((gx[a]-gx[b])**2+(gy[a]-gy[b])**2,a,b) for a in c for b in mm[np.argsort((gx[mm]-gx[c[0]])**2+(gy[mm]-gy[c[0]])**2)[:30]])
    E.add((min(best[1],best[2]),max(best[1],best[2])));par[fnd(best[1])]=fnd(best[2])
E=sorted(E)
# --- capitals
import sys
caps=[-1]*len(K);pp=json.load(open('pp.json'))['features']
for f in pp:
    p=up(f['properties'])
    if p.get('ADM0CAP')!=1:continue
    k=a3k.get(p.get('ADM0_A3'))
    if k is None or caps[k]>=0 or k not in CG:continue
    lo,la=f['geometry']['coordinates'];X,Y=proj([lo],[la]);X,Y=float(X[0]),float(Y[0])
    g=CG[k];b=np.array([q.bounds for q in g])
    # same transform as country: recompute factor via area ratio is overkill; use nearest province of the country
    ps=[p_ for p_ in range(n) if cown[p_]==k]
    caps[k]=min(ps,key=lambda q:(gx[q]-X)**2+(gy[q]-Y)**2) if len(ps)<=3 or True else ps[0]
for k in range(len(K)):
    if caps[k]<0:
        ps=[p for p in range(n) if cown[p]==k]
        if ps:caps[k]=max(ps,key=lambda q:PD[q][3])
print('provinces',n,'edges',len(E),'MW,MH',MW,MH,'no capital:',[K[k][0] for k in range(len(K)) if caps[k]<0])
# --- encode RLE
flat=np.where(fl<0,46655,fl);ch=np.flatnonzero(np.diff(flat))+1;st=np.concatenate([[0],ch]);ln=np.diff(np.concatenate([st,[flat.size]]))
def b36(v,w):
    c='0123456789abcdefghijklmnopqrstuvwxyz';r=''
    for _ in range(w):r=c[v%36]+r;v//=36
    return r
out=[]
for v,l in zip(flat[st],ln):
    while l>0:t=min(l,1295);out.append(b36(int(v),3)+b36(t,2));l-=t
RLE=''.join(out)
_,pa,pb=arr('PD');_,ea,eb=arr('E');_,ca,cb=arr('CAPS')
t=s
for (a,b),rep in sorted([((pa,pb),json.dumps(PD)),((ea,eb),json.dumps([[int(a),int(b)] for a,b in E])),((ca,cb),json.dumps([int(c) for c in caps]))],reverse=True):
    t=t[:a]+rep+t[b:]
t=re.sub(r'RLE="[^"]+"','RLE="'+RLE+'"',t,count=1)
t=t.replace('MH=715','MH=%d'%MH,1)
open('/mnt/user-data/outputs/Великая_война_реальная_карта_мира.html','w',encoding='utf-8').write(t)
print('RLE kb',len(RLE)//1024,'file kb',len(t.encode())//1024)
# ---- export for the modular project
np.save('lab.npy',lab.astype(np.int16))
json.dump({'MW':MW,'MH':MH,'K':K,'PD':PD,'E':[[int(a),int(b)] for a,b in E],'CAPS':[int(c) for c in caps]},open('/home/claude/proj/data/game.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
