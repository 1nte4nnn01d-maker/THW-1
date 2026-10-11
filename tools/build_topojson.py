"""Raster province map -> TopoJSON with shared arcs (no duplicated borders)."""
import numpy as np,json
from collections import defaultdict
lab=np.load('lab.npy').astype(np.int64);H,W=lab.shape;S=W+1
pad=np.full((H+2,W+2),-1,np.int64);pad[1:-1,1:-1]=lab
A=pad[:-1,1:-1];B=pad[1:,1:-1];hy,hx=np.nonzero(A!=B)          # horizontal unit edges, travelled west->east, right side = below
Lf=pad[1:-1,:-1];Rt=pad[1:-1,1:];vy,vx=np.nonzero(Lf!=Rt)      # vertical unit edges, travelled north->south, right side = west pixel
N1=np.concatenate([hy*S+hx,vy*S+vx]);N2=np.concatenate([hy*S+hx+1,(vy+1)*S+vx])
R=np.concatenate([B[hy,hx],Lf[vy,vx]]);L=np.concatenate([A[hy,hx],Rt[vy,vx]]);n=len(N1)
key=(np.minimum(R,L)+1)*100000+np.maximum(R,L)+1
ends=np.concatenate([N1,N2]);eid=np.concatenate([np.arange(n),np.arange(n)]);o=np.argsort(ends,kind='stable')
deg=np.bincount(ends,minlength=S*(H+1));off=np.concatenate([[0],np.cumsum(deg)]);se=eid[o]
d2=np.nonzero(deg==2)[0];same=key[se[off[d2]]]==key[se[off[d2]+1]]
isj=np.ones(S*(H+1),bool);isj[d2[same]]=False
N1l,N2l,Rl,Ll,isjl,sel,offl=N1.tolist(),N2.tolist(),R.tolist(),L.tolist(),isj.tolist(),se.tolist(),off.tolist()
vis=[False]*n;arcs=[];ar_r=[];ar_l=[]
def walk(e,nd):
    r,l=(Rl[e],Ll[e]) if N1l[e]==nd else (Ll[e],Rl[e]);pts=[nd]
    while True:
        vis[e]=True;m=N2l[e] if N1l[e]==nd else N1l[e];pts.append(m)
        if isjl[m]:break
        a,b=sel[offl[m]],sel[offl[m]+1];e2=b if a==e else a
        if vis[e2]:break
        nd,e=m,e2
    arcs.append(pts);ar_r.append(r);ar_l.append(l)
for j in np.nonzero(isj&(deg>0))[0].tolist():
    for k in range(offl[j],offl[j+1]):
        e=sel[k]
        if not vis[e]:walk(e,j)
for e in range(n):
    if not vis[e]:walk(e,N1l[e])           # closed loops without junctions
xy=lambda nd:(nd%S,nd//S)
reg=defaultdict(list)
for i in range(len(arcs)):
    if ar_r[i]>=0:reg[ar_r[i]].append(i)
    if ar_l[i]>=0:reg[ar_l[i]].append(~i)
def pts_of(ref):
    a=arcs[ref if ref>=0 else ~ref];return a if ref>=0 else a[::-1]
def ring_xy(ring):
    p=[];[p.extend(pts_of(r)[(1 if p else 0):]) for r in ring];return np.array([xy(q) for q in p],float)
def area(p):x,y=p[:,0],p[:,1];return .5*np.sum(x*np.roll(y,-1)-np.roll(x,-1)*y)
def inside(pt,p):
    x,y=pt;x1,y1,x2,y2=p[:,0],p[:,1],np.roll(p[:,0],-1),np.roll(p[:,1],-1)
    c=((y1>y)!=(y2>y))&(x<(x2-x1)*(y-y1)/np.where(y2==y1,1,y2-y1)+x1);return c.sum()%2==1
geoms=[]
for r in sorted(reg):
    refs=reg[r];st=lambda f:(pts_of(f)[0]);out=defaultdict(list)
    for f in refs:out[st(f)].append(f)
    used=set();rings=[]
    for f in refs:
        if f in used:continue
        ring=[];cur=f;s0=st(f)
        while True:
            used.add(cur);ring.append(cur);e=pts_of(cur)[-1]
            if e==s0:break
            nx=[g for g in out[e] if g not in used]
            if not nx:break
            cur=nx[0]
        rings.append(ring)
    info=[(ring,ring_xy(ring)) for ring in rings];info=[(a,p,area(p)) for a,p in info]
    outers=[(a,p,s) for a,p,s in info if s>0];holes=[(a,p,s) for a,p,s in info if s<=0]
    polys=[[a] for a,_,_ in outers]
    for a,p,_ in holes:
        c=[i for i,(oa,op,os_) in enumerate(outers) if inside(p[0],op)];
        if c:polys[min(c,key=lambda i:outers[i][2])].append(a)
        else:polys.append([a])
    geoms.append({'type':'Polygon','arcs':polys[0],'id':int(r)} if len(polys)==1 else {'type':'MultiPolygon','arcs':polys,'id':int(r)})
enc=[]
for a in arcs:
    q=[xy(nd) for nd in a];enc.append([list(q[0])]+[[q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]] for i in range(1,len(q))])
topo={'type':'Topology','transform':{'scale':[1,1],'translate':[0,0]},'arcs':enc,'objects':{'provinces':{'type':'GeometryCollection','geometries':geoms}}}
json.dump(topo,open('/home/claude/proj/data/provinces.topo.json','w'),separators=(',',':'))
print('arcs',len(arcs),'points',sum(len(a) for a in arcs),'provinces',len(geoms),'edges',n)
