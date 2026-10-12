// 3D-Renderer (Three.js) für Line Tower Wars – Stil des ersten 3D-Prototyps (Lambert/Flat-Shading, Sonnenschatten,
// Himmel+Nebel, Grasland mit Bäumen, Kachel-Pfad, Tore) + echte Spielanbindung: liest nur getSnapshot(), Eingaben via ui.js -> command().
// Kamera: Perspektive schräg (BTD6-artig), horizontales Wischen fliegt frei über beide Bahnen (Trägheit + Einrasten).
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
// ---------- Qualitätsstufen: Ultra (PC, automatisch) / Leicht (Handy); Auto-Absenkung bei < 38 fps ----------
const DESK=!matchMedia('(pointer:coarse)').matches&&innerWidth>=900;
const QP={ultra:{n:'Ultra',pr:Math.min(devicePixelRatio||1,2),sh:4096,bloom:1,parts:1500,amb:320,detail:1,outline:1},
 low:{n:'Leicht',pr:Math.min(devicePixelRatio||1,1.25),sh:1024,bloom:1,parts:400,amb:80,detail:0,outline:0}};
let Q=localStorage.getItem('ltw_q');if(!QP[Q])Q=DESK?'ultra':'low';let QC=QP[Q];
const COLS=11,ROWS=20,LGAP=21;
const cv=document.getElementById('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(QC.pr);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new THREE.Scene();const SKY=new THREE.Color(0xe6d3b8);scene.background=SKY.clone();scene.fog=new THREE.FogExp2(0xe6d3b8,.0105);
const cam=new THREE.PerspectiveCamera(42,1,.1,300);
const composer=new EffectComposer(renderer);composer.setPixelRatio(QC.pr);composer.addPass(new RenderPass(scene,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(512,512),QC.detail?.85:.45,.45,QC.detail?.82:.95);composer.addPass(bloom);composer.addPass(new OutputPass());
const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},vig:{value:.42}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform float vig;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 d=vUv-.5;float l=dot(c.rgb,vec3(.299,.587,.114));c.rgb=mix(vec3(l),c.rgb,1.08);c.rgb=mix(c.rgb*vec3(.92,.9,1.08),c.rgb*vec3(1.06,1.,.92),smoothstep(.2,.8,l));c.rgb*=1.-vig*dot(d,d)*2.;gl_FragColor=c;}'});composer.addPass(grade);
const tilt=new ShaderPass({uniforms:{tDiffuse:{value:null},px:{value:new THREE.Vector2(1/1920,1/1080)},amt:{value:1.3}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform vec2 px;uniform float amt;varying vec2 vUv;void main(){float k=smoothstep(.22,.5,abs(vUv.y-.45))*amt;vec4 c=vec4(0.);float w=0.;for(int i=-3;i<=3;i++)for(int j=-3;j<=3;j++){vec2 o=vec2(float(i),float(j))*px*k;float g=exp(-float(i*i+j*j)/8.);c+=texture2D(tDiffuse,vUv+o)*g;w+=g;}gl_FragColor=c/w;}'});tilt.enabled=!!QC.detail;composer.addPass(tilt);
scene.add(new THREE.HemisphereLight(0xb8c8ff,0x6a7a4a,1.25));{const f=new THREE.DirectionalLight(0x9db4ff,.45);f.position.set(30,14,40);scene.add(f);}
const sun=new THREE.DirectionalLight(0xffd9a0,2.9);sun.castShadow=true;sun.shadow.mapSize.set(QC.sh,QC.sh);sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:70});sun.shadow.radius=4;scene.add(sun,sun.target);
function ctex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t;}
const rnd=Math.random,hsl=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;
const TL=new THREE.TextureLoader();const BODEN=TL.load('assets/tex/boden.jpg',()=>{for(const c of BODEN.userData.cl)c.needsUpdate=true;});BODEN.colorSpace=THREE.SRGBColorSpace;BODEN.userData.cl=[];const bclone=()=>{const c=BODEN.clone();BODEN.userData.cl.push(c);return c;};BODEN.wrapS=BODEN.wrapT=THREE.RepeatWrapping;BODEN.anisotropy=8;
const TX={grass:ctex(256,256,(x,w,h)=>{x.fillStyle=hsl(84,30,48);x.fillRect(0,0,w,h);for(let i=0;i<220;i++){x.fillStyle=hsl(70+rnd()*40,22+rnd()*25,38+rnd()*18,.35);x.beginPath();x.arc(rnd()*w,rnd()*h,4+rnd()*22,0,7);x.fill();}
  for(let i=0;i<4200;i++){const X=rnd()*w,Y=rnd()*h;x.strokeStyle=hsl(65+rnd()*45,28+rnd()*30,40+rnd()*28,.7);x.lineWidth=1;x.beginPath();x.moveTo(X,Y);x.lineTo(X+(rnd()-.5)*3,Y-2-rnd()*4);x.stroke();}
  for(let i=0;i<40;i++){x.fillStyle=['#fff3c4','#f2b233','#c9b8ff','#ffffff'][i%4];x.fillRect(rnd()*w,rnd()*h,2,2);}}),
 rock:ctex(256,256,(x,w,h)=>{x.fillStyle=hsl(255,10,44);x.fillRect(0,0,w,h);for(let i=0;i<900;i++){x.fillStyle=hsl(240+rnd()*40,8+rnd()*12,22+rnd()*26,.5);x.fillRect(rnd()*w,rnd()*h,2+rnd()*10,1+rnd()*5);}
  x.strokeStyle='rgba(20,14,30,.6)';for(let i=0;i<26;i++){x.lineWidth=1+rnd()*2;x.beginPath();let X=rnd()*w,Y=rnd()*h;x.moveTo(X,Y);for(let k=0;k<5;k++){X+=(rnd()-.5)*40;Y+=rnd()*30;x.lineTo(X,Y);}x.stroke();}}),
 stone:ctex(128,128,(x,w,h)=>{x.fillStyle=hsl(40,28,78);x.fillRect(0,0,w,h);for(let i=0;i<500;i++){x.fillStyle=hsl(30+rnd()*20,20+rnd()*20,60+rnd()*25,.35);x.fillRect(rnd()*w,rnd()*h,1+rnd()*5,1+rnd()*5);}x.strokeStyle='rgba(90,70,50,.55)';x.lineWidth=3;x.strokeRect(1,1,w-2,h-2);})};
const MC={},M=c=>MC[c]||(MC[c]=new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.82,metalness:0}));
const ME=(c,e)=>{const k=c+'|'+e;return MC[k]||(MC[k]=new THREE.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:2.2,flatShading:true,roughness:.5}));};
const W=(pi,x,y,h=0)=>new THREE.Vector3(pi*LGAP+x,h,y);// x,y in Zellkoordinaten (Zellmitte = +.5)
function mk(geo,mat,y=0,par){const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;m.receiveShadow=true;par&&par.add(m);return m;}
const cyl=(a,b,h,s=8)=>new THREE.CylinderGeometry(a,b,h,s);
// ---------- Welt: Gras, Bäume ----------
const R3Dfx={},ISLG=[];const ISL=[[-2.4,15.2],[LGAP-2.4,LGAP+15.2]],SI=[[-17,-6.5],[LGAP+18.5,LGAP+29]];// Bahn-Inseln + Nachbarinseln (sichtbare Klippen statt Dunst)// schwebende Plateaus (x-Bereiche), z -7..ROWS+6
const FLOW_GLSL='float flow(vec2 p,float t){return sin(p.y*3.1-t*3.4+sin(p.x*4.3+t)*1.6)*.25+sin(p.y*7.3-t*5.2+p.x*2.1)*.25+.5;}';
const streamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{t:{value:0},danger:{value:0},fade:{value:1}},
 vertexShader:'varying vec3 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:FLOW_GLSL+'uniform float t,danger,fade;varying vec3 vW;varying vec2 vUv;void main(){float n=flow(vW.xz,t),n2=flow(vW.zx*1.7,t*1.3);vec3 gold=vec3(1.0,.72,.28),white=vec3(1.,.96,.85),vio=vec3(.62,.38,1.);vec3 c=mix(gold,white,n*n2);c=mix(c,vio,danger*(.5+.5*n));float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));float sp=step(.985,fract(sin(dot(floor(vW.xz*14.),vec2(12.9898,78.233))+floor(t*6.))*43758.5));c+=sp*1.5;vec3 rim=vec3(1.,.85,.55)*smoothstep(.16,.0,e)*.8;gl_FragColor=vec4(c*(1.+1.2*n*n2)+rim,(.8*smoothstep(0.,.16,e)+.15)*fade);}'});
const dm=new THREE.Object3D(),tc=new THREE.Color();
{const rockM=new THREE.MeshStandardMaterial({map:TX.rock,roughness:.95,flatShading:true,vertexColors:true}),bodenTop=new THREE.MeshStandardMaterial({map:(()=>{const t=bclone();t.repeat.set(1,1);return t;})(),roughness:.95,color:new THREE.Color(1.6,1.7,1.4)});
 const moss=new THREE.Color(0x5f7f38),stoneC=new THREE.Color(0xb8ab98),deep=new THREE.Color(0x7d7a86);
 function cliffLayer(w,d,h,y0,jit,mossK){const g=new THREE.BoxGeometry(w,h,d,Math.ceil(w*1.5),2,Math.ceil(d*1.5)),pa=g.attributes.position,col=[],c=new THREE.Color();
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),n=Math.sin(x*1.7+y*3.1)*.5+Math.sin(z*1.3-y*2.2)*.5;const ex=Math.abs(x)>w/2-.01,ez=Math.abs(z)>d/2-.01;
   if(ex)pa.setX(i,x+Math.sign(x)*(n*jit+(y<0?-jit*.4:0)));if(ez)pa.setZ(i,z+Math.sign(z)*(n*jit+(y<0?-jit*.4:0)));
   c.copy(deep).lerp(stoneC,.5+.5*(y/h+.5)*mossK);if(y>h/2-.01||(n>.35&&y>0))c.lerp(moss,.75*mossK+.15);col.push(c.r,c.g,c.b);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();const m=new THREE.Mesh(g,rockM);m.position.y=y0;m.castShadow=true;m.receiveShadow=true;return m;}
 const wfMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{t:{value:0}},fog:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float t;varying vec2 vUv;float h(float x){return fract(sin(x*91.7)*43758.5);}void main(){float x=floor(vUv.x*22.);float s=fract(vUv.y*3.+t*(1.2+h(x)*.8)+h(x+3.));float st=smoothstep(.0,.5,s)*smoothstep(1.,.6,s);float edge=smoothstep(0.,.18,vUv.x)*smoothstep(1.,.82,vUv.x);vec3 c=mix(vec3(.75,.88,1.),vec3(1.),st);gl_FragColor=vec4(c*1.15,(0.45+.45*st)*edge*smoothstep(0.,.35,vUv.y));}'});
 R3Dfx.wf=wfMat;
 for(const[x0,x1,side]of ISL.concat(SI.map(a=>[...a,1]))){const w=x1-x0,d=side?ROWS*.75:ROWS+5.6,cx=(x0+x1)/2,cz=side?ROWS/2-2:ROWS/2-.2,G=new THREE.Group();G.position.set(cx,side?-1.6:0,cz);scene.add(G);ISLG.push({G,w,d,side:!!side});
  const top=new THREE.Mesh(new THREE.BoxGeometry(w,.5,d),[rockM,rockM,bodenTop,rockM,rockM,rockM]);top.position.y=-.46;top.receiveShadow=true;
  {const uv=top.geometry.attributes.uv;for(let i=8;i<12;i++)uv.setXY(i,uv.getX(i)*w/3.2,uv.getY(i)*d/3.2);}G.add(top);
  const L=QC.detail?6:4;for(let k=0;k<L;k++){const f=1-k*.035,h=1.5;G.add(cliffLayer(w*f+.3,d*f+.3,h,-.72-h*(k+.5)+.1*k,.35+k*.08,k?Math.max(0,1-k*.25):1));}
  const under=new THREE.Mesh(new THREE.ConeGeometry(1,1,10,4),rockM);{const pa=under.geometry.attributes.position,col=[];for(let i=0;i<pa.count;i++){if(pa.getY(i)<.49){pa.setX(i,pa.getX(i)*(1+(rnd()-.5)*.4));pa.setZ(i,pa.getZ(i)*(1+(rnd()-.5)*.4));}col.push(deep.r,deep.g,deep.b);}under.geometry.setAttribute('color',new THREE.Float32BufferAttribute(col,3));under.geometry.computeVertexNormals();}
  under.rotation.x=Math.PI;under.scale.set(w*.5,16,d*.5);under.position.y=-.72-1.5*L-8;G.add(under);
  // Wasserfälle an Vorder- und Außenkante
  const wfs=[[cx<LGAP/2+COLS/2+2?w/2:-w/2,side?2:-1,0],[-w*.2,d/2,1],[w*.25,d/2,1]];for(const[x,z,front]of wfs.slice(0,QC.detail?3:2)){const wf=new THREE.Mesh(new THREE.PlaneGeometry(1.6,16),wfMat);wf.position.set(x+(front?0:Math.sign(x)*.45),-8.4,front?z+.6:z);if(!front)wf.rotation.y=Math.PI/2*Math.sign(x);if(side&&front)continue;G.add(wf);}}
 for(let i=0;i<(QC.detail?10:5);i++){const g=new THREE.Group(),k=1.5+rnd()*3.5;const t=new THREE.Mesh(new THREE.CylinderGeometry(k,k*.9,.6,8),[rockM,bodenTop,rockM]);const u=new THREE.Mesh(new THREE.ConeGeometry(k*.9,k*2.6,8),rockM);u.rotation.x=Math.PI;u.position.y=-k*1.6;g.add(t,u);
  for(let j=0;j<3;j++){const tr=new THREE.Mesh(new THREE.ConeGeometry(k*.22,k*.7,6),M(0x4d7a3a));tr.position.set((rnd()-.5)*k,k*.35,(rnd()-.5)*k);g.add(tr);}
  if(rnd()<.5){const tp=new THREE.Mesh(new THREE.ConeGeometry(k*.25,k*.9,4),M(0xc8b28a));tp.position.y=k*.5;g.add(tp);}
  const a=-Math.PI*.15-rnd()*Math.PI*.7,R0=45+rnd()*45;g.position.set(LGAP/2+COLS/2+Math.cos(a)*R0*1.2,-4+rnd()*12,ROWS/2+Math.sin(a)*R0);scene.add(g);}
 // Wolkenmeer tief unten (driftende Schichten)
 const cloudT=ctex(256,256,(x,w,h)=>{for(let i=0;i<60;i++){const X=40+rnd()*176,Y=40+rnd()*176,r=20+rnd()*50,gr=x.createRadialGradient(X,Y,0,X,Y,r);gr.addColorStop(0,'rgba(255,250,240,.55)');gr.addColorStop(1,'rgba(255,250,240,0)');x.fillStyle=gr;x.fillRect(0,0,w,h);}});
 R3Dfx.clouds=[];for(let i=0;i<(QC.detail?14:7);i++){const c=new THREE.Mesh(new THREE.PlaneGeometry(40,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:cloudT,transparent:true,depthWrite:false,opacity:.9,color:0xfff6ec}));c.position.set(-30+rnd()*90,-6-i*1.3,-25+rnd()*65);scene.add(c);R3Dfx.clouds.push(c);}
 const abM=streamMat.clone();R3Dfx.abM=abM;const ab=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4,ROWS+40).rotateX(-Math.PI/2),abM,1);dm.position.set((ISL[0][1]+ISL[1][0])/2,-9,ROWS/2);dm.updateMatrix();ab.setMatrixAt(0,dm.matrix);scene.add(ab);}
// Flora: Blumen, Farne, Blütenbüsche (Instancing) an Inselrändern und um das Feld
{const NF=QC.detail?900:260,fl=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.09,0),new THREE.MeshStandardMaterial({roughness:.6,flatShading:true}),NF),
 fe=new THREE.InstancedMesh(new THREE.ConeGeometry(.16,.42,5),new THREE.MeshStandardMaterial({roughness:.8,flatShading:true}),Math.round(NF*.45)),
 bb=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.32,0),new THREE.MeshStandardMaterial({roughness:.7,flatShading:true}),Math.round(NF*.12));
 const FC=[0xff9ec4,0xd9a6ff,0xffffff,0xffd36e,0xff7fae],BC=[0xffb3d1,0xf4a6d8,0xe8c4ff],spot=()=>{for(;;){const a=Math.random();if(a<.15){const I=SI[Math.random()<.5?0:1];return[I[0]+.5+Math.random()*(I[1]-I[0]-1),ROWS/2-2-ROWS*.36+Math.random()*ROWS*.72,-1.6];}
  const I=ISL[Math.random()<.5?0:1],x=I[0]+.3+Math.random()*(I[1]-I[0]-.6),z=-2.6+Math.random()*(ROWS+5);const lx=x-(I[0]<5?0:LGAP);if(lx>-.45&&lx<COLS+.45&&z>-.45&&z<ROWS+.45)continue;if(lx>COLS+.4&&lx<COLS+3.4&&z>1.3&&z<11)continue;
  const edge=Math.min(lx+2.4,15.2-lx,z+2.6,ROWS+2.6-z),nearF=Math.min(Math.abs(lx+.6),Math.abs(lx-COLS-.6),Math.abs(z+.6),Math.abs(z-ROWS-.6));if(edge<1.2||nearF<.8||Math.random()<.25)return[x,z,0];}};
 const put=(im,n,sc,cols,yk)=>{for(let i=0;i<n;i++){const[x,z,yo]=spot(),k=sc*(.7+Math.random()*.7);dm.position.set(x,yo-.2+yk*k,z);dm.rotation.set((Math.random()-.5)*.4,Math.random()*6,(Math.random()-.5)*.4);dm.scale.set(k,k*(im===fe?1.4:1),k);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);im.setColorAt(i,tc.set(cols[i%cols.length]).offsetHSL(0,0,(Math.random()-.5)*.08));}im.castShadow=im!==fl;im.receiveShadow=true;scene.add(im);};
 put(fl,NF,1,FC,.5);put(fe,fe.count,1,[0x4f8a34,0x6aa040,0x3d7a3a],.5);put(bb,bb.count,1,BC,.6);dm.rotation.set(0,0,0);dm.scale.setScalar(1);}
const amb=(()=>{const N=QC.amb,g=new THREE.BufferGeometry(),p=new Float32Array(N*3),sp=new Float32Array(N);for(let i=0;i<N;i++){const isl=ISL[i%2];p[i*3]=isl[0]+rnd()*(isl[1]-isl[0]);p[i*3+1]=rnd()*4;p[i*3+2]=-6+rnd()*(ROWS+11);sp[i]=.2+rnd()*.5;}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));const sprite=ctex(32,32,(x)=>{const gr=x.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,'#fff');gr.addColorStop(.35,'rgba(255,220,150,.8)');gr.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);});
 const m=new THREE.PointsMaterial({size:.16,map:sprite,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(2.6,2.1,1.3)});const pts=new THREE.Points(g,m);scene.add(pts);pts.userData.sp=sp;return pts;})();
{const g=new THREE.SphereGeometry(200,24,12),cs=[],c=new THREE.Color(),top=new THREE.Color(0x7d93d6),mid=new THREE.Color(0xc9c4d8),hor=new THREE.Color(0xffe2b4),abyss=new THREE.Color(0xd8d4dc);for(let i=0;i<g.attributes.position.count;i++){const y=g.attributes.position.getY(i)/200;if(y>=0){c.copy(hor).lerp(mid,Math.min(1,y*4));if(y>.25)c.lerp(top,(y-.25)/.75);}else c.copy(hor).lerp(abyss,Math.min(1,-y*5));cs.push(c.r,c.g,c.b);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(cs,3));const dome=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false}));dome.position.set(LGAP/2+COLS/2,0,ROWS/2);scene.add(dome);}
{const N=QC.detail?70:36,cone=new THREE.ConeGeometry(.75,1.3,7),trees=new THREE.InstancedMesh(cone,new THREE.MeshStandardMaterial({flatShading:true,roughness:.9}),N*2),trunks=new THREE.InstancedMesh(cyl(.12,.17,.6,6),M(0x6a4126),N);trees.castShadow=trunks.castShadow=true;
 const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.45,0),new THREE.MeshStandardMaterial({flatShading:true,map:TX.rock,roughness:.95}),60),bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.42,0),new THREE.MeshStandardMaterial({flatShading:true,roughness:.9}),80);rocks.castShadow=bush.castShadow=true;rocks.receiveShadow=true;
 const TC=[0x2f7a3a,0x3d8a3c,0x2a6a44,0x4e8f3a,0x5f7f2a],ok=(x,z)=>!((x>-1.5&&x<COLS+4.5)||(x>LGAP-1.5&&x<LGAP+COLS+4.5))||z<-4||z>ROWS+3;
 const pos=()=>{for(;;){if(Math.random()<.75){const I=SI[Math.random()<.5?0:1],x=I[0]+.8+Math.random()*(I[1]-I[0]-1.6),z=ROWS/2-2-ROWS*.33+Math.random()*ROWS*.66;return[x,z,-1.6];}const I=ISL[Math.random()<.5?0:1],x=I[0]+.6+Math.random()*(I[1]-I[0]-1.2),z=-2.6+Math.random()*2;if(ok(x,z))return[x,z,0];}};
 for(let i=0;i<N;i++){const[x,z,yo]=pos(),k=.75+Math.random()*.8,ry=Math.random()*6;dm.rotation.set(0,ry,0);tc.set(TC[i%TC.length]).offsetHSL(0,0,(Math.random()-.5)*.06);
  dm.position.set(x,yo+.3*k,z);dm.scale.setScalar(k);dm.updateMatrix();trunks.setMatrixAt(i,dm.matrix);
  dm.position.set(x,yo+1.0*k,z);dm.scale.set(k*1.1,k,k*1.1);dm.updateMatrix();trees.setMatrixAt(2*i,dm.matrix);trees.setColorAt(2*i,tc);
  dm.position.set(x,yo+1.65*k,z);dm.scale.set(k*.75,k*.8,k*.75);dm.updateMatrix();trees.setMatrixAt(2*i+1,dm.matrix);trees.setColorAt(2*i+1,tc.offsetHSL(0,0,.05));}
 for(let i=0;i<60;i++){const[x,z,yo]=pos(),k=.4+Math.random()*1.1;dm.position.set(x,yo+.1*k,z);dm.rotation.set(Math.random(),Math.random()*6,0);dm.scale.set(k,k*.7,k);dm.updateMatrix();rocks.setMatrixAt(i,dm.matrix);rocks.setColorAt(i,tc.set(0x8d8a84).offsetHSL(0,0,(Math.random()-.5)*.12));}
 for(let i=0;i<80;i++){let x,z;if(i<40){const l=i%2,side=Math.random()<.5;x=l*LGAP+(side?-1.3-Math.random()*1.5:COLS+3.6+Math.random()*1.2);z=Math.random()*ROWS;}else{const q=pos();x=q[0];z=q[1];}const k=.5+Math.random()*.6;dm.position.set(x,.2*k,z);dm.rotation.set(0,Math.random()*6,0);dm.scale.set(k,k*.75,k);dm.updateMatrix();bush.setMatrixAt(i,dm.matrix);bush.setColorAt(i,tc.set(TC[i%TC.length]).offsetHSL(.02,0,.04));}
 dm.rotation.set(0,0,0);dm.scale.setScalar(1);scene.add(trees,trunks,rocks,bush);}
function label(t,w=2){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');const tex=new THREE.CanvasTexture(c);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));s.scale.set(w*1.4,w*1.4/4,1);s.renderOrder=9;
 s.userData.set=t=>{x.clearRect(0,0,256,64);x.font='bold 32px system-ui,sans-serif';x.textAlign='center';x.fillStyle='#000a';x.beginPath();x.roundRect(6,6,244,52,20);x.fill();x.fillStyle='#fff';x.fillText(t,128,44);tex.needsUpdate=true;};s.userData.set(t);return s;}
const GATES=[];function gate(par,pi,y,c){const g=new THREE.Group();GATES.push(g);for(const s of[-1,1])mk(new THREE.BoxGeometry(.3,1.4,.3),M(c),.7,g).position.x=s*1.4;mk(new THREE.BoxGeometry(3.2,.3,.4),M(c),1.45,g);g.position.copy(W(pi,5.5,y));par.add(g);return g;}
// ---------- Bahnen ----------
const tileGeo=new THREE.BoxGeometry(.94,.12,.94);
const lanes=[0,1].map(pi=>{const grp=new THREE.Group();scene.add(grp);
 const base=new THREE.Mesh(new THREE.BoxGeometry(COLS+.6,.4,ROWS+.6),new THREE.MeshStandardMaterial({map:TX.stone,color:0xb8a888,roughness:.8}));base.position.copy(W(pi,COLS/2,ROWS/2,-.2));base.receiveShadow=true;grp.add(base);
 {const t=bclone();t.repeat.set(COLS/3.2,ROWS/3.2);t.offset.set(pi*.37,0);const gp=new THREE.Mesh(new THREE.PlaneGeometry(COLS,ROWS).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:t,roughness:.95,color:new THREE.Color(1.75,1.8,1.5)}));gp.position.copy(W(pi,COLS/2,ROWS/2,.062));gp.receiveShadow=true;grp.add(gp);}
 const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.01,.94),new THREE.MeshBasicMaterial({transparent:true,opacity:.12,depthWrite:false}),COLS*ROWS);const stream=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),streamMat,COLS*ROWS*2);stream.count=0;stream.frustumCulled=false;grp.add(stream);tiles.receiveShadow=true;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){dm.position.copy(W(pi,x+.5,y+.5,0));dm.updateMatrix();tiles.setMatrixAt(y*COLS+x,dm.matrix);tiles.setColorAt(y*COLS+x,tc.set(0x7fd65a));}grp.add(tiles);
 const hitPlane=new THREE.Mesh(new THREE.PlaneGeometry(COLS,ROWS),new THREE.MeshBasicMaterial({visible:false}));hitPlane.rotation.x=-Math.PI/2;hitPlane.position.copy(W(pi,COLS/2,ROWS/2,.06));hitPlane.userData={pi,ground:1};grp.add(hitPlane);
 gate(grp,pi,-.6,pi?0xd53a3a:0x3a7bd5);gate(grp,pi,ROWS+.6,pi?0x3a7bd5:0xd53a3a);
 const portal=mk(new THREE.TorusGeometry(.42,.09,6,20),ME(0xc08bff,0x5a2d82),.5);portal.position.copy(W(pi,5.5,.5,.5));grp.add(portal);
 const lab=label(pi?'KI':'Du',1.6);lab.position.copy(W(pi,5.5,-1.2,2.2));grp.add(lab);
 // Goldmine (Hügel, Stollen, Depot, Arbeiter) rechts neben dem Feld
 const mine=new THREE.Group();mine.position.copy(W(pi,COLS+1.8,3.2));
 const hill=mk(new THREE.DodecahedronGeometry(1.15,0),M(0x8c7a6b),.5,mine);hill.scale.y=.75;
 mk(new THREE.BoxGeometry(.7,.7,.3),M(0x222222),.4,mine).position.z=.98;const beam=mk(new THREE.BoxGeometry(.95,.14,.14),M(0x7a4a26),.82,mine);beam.position.z=1.05;
 const depot=new THREE.Group();depot.position.set(0,0,2.1);mine.add(depot);mk(new THREE.BoxGeometry(.6,.3,.45),M(0x6b4a2b),.15,depot);
 const gm=ME(0xffd23a,0x664400);const nug=[];for(let i=0;i<5;i++){const n=mk(new THREE.OctahedronGeometry(.13,0),gm,.36,depot);n.position.x=-.2+i*.1;nug.push(n);}
 const mlab=label('Goldmine',2.2);mlab.position.y=2.1;mine.add(mlab);
 const mhit=new THREE.Mesh(new THREE.BoxGeometry(2.6,2.6,3.4),new THREE.MeshBasicMaterial({visible:false}));mhit.position.set(0,1,.8);mhit.userData={pi,mine:1};mine.add(mhit);grp.add(mine);
 // Schrein (Säulen, Dach, schwebende Rune mit Licht)
 const shr=new THREE.Group();shr.position.copy(W(pi,COLS+1.8,13.5));const st=M(0xd9d2c3);
 mk(new THREE.BoxGeometry(1.6,.3,1.6),st,.15,shr);for(const[x,z]of[[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]])mk(cyl(.1,.1,1.2,6),st,.9,shr).position.set(x,.9,z);
 const roof=mk(new THREE.ConeGeometry(1.3,.7,4),M(0x7a3ab0),1.85,shr);roof.rotation.y=Math.PI/4;
 const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.26,0),new THREE.MeshBasicMaterial({color:0x7ff7ff}));orb.position.y=.85;shr.add(orb);const ol=new THREE.PointLight(0x7ff7ff,2,4);ol.position.y=.9;shr.add(ol);
 const slab=label('Schrein',2);slab.position.y=2.7;shr.add(slab);
 const shit=new THREE.Mesh(new THREE.BoxGeometry(2.2,3,2.2),new THREE.MeshBasicMaterial({visible:false}));shit.position.y=1.2;shit.userData={pi,schrein:1};shr.add(shit);grp.add(shr);
 return{pi,grp,tiles,hitPlane,portal,mine,depot,nug,mlab,shr,orb,ol,slab,mhit,shit,stream,workers:[],towers:new Map(),creeps:new Map(),proj:[],pathKey:'',mk:'',sk:''};});
const JIT=Array.from({length:COLS*ROWS},()=>Math.random()-.5);
function paintTiles(L,path,grid=L.gridOn){const on=path?(L.onSet=new Set(path.map(p=>p[0]+','+p[1]))):L.onSet||new Set();L.gridOn=grid;
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=y*COLS+x,pth=on.has(x+','+y),j=JIT[i];
  tc.set(pth?0xffe0a0:((x+y)%2?0xffffff:0x9aa080)).offsetHSL(pth?j*.01:j*.03,0,j*(pth?.05:.07));if(!pth&&grid&&(x+y)%2)tc.offsetHSL(0,0,.03);L.tiles.setColorAt(i,tc);
  dm.position.copy(W(L.pi,x+.5,y+.5,.068));dm.scale.set(1,1,1);dm.updateMatrix();L.tiles.setMatrixAt(i,dm.matrix);}
 if(path){let n=0;const add=(x,z,sx,sz)=>{dm.position.copy(W(L.pi,x,z,.075));dm.scale.set(sx,1,sz);dm.updateMatrix();L.stream.setMatrixAt(n++,dm.matrix);};const P=path;
  for(let i=0;i<P.length;i++){add(P[i][0]+.5,P[i][1]+.5,.7,.7);if(i){const a=P[i-1],b=P[i];add((a[0]+b[0])/2+.5,(a[1]+b[1])/2+.5,a[0]!==b[0]?1:.7,a[1]!==b[1]?1:.7);}}L.stream.count=n;if(L.painted)L.fadeT=performance.now();L.painted=1;L.stream.instanceMatrix.needsUpdate=true;}
 dm.scale.set(1,1,1);L.tiles.visible=!!grid;L.tiles.instanceColor.needsUpdate=true;L.tiles.instanceMatrix.needsUpdate=true;}
// ---------- Turm-Modelle (wie Prototyp) + sichtbare Upgrade-Stufen ----------
const TCOL={pfeil:0x8b5a2b,kanone:0x555a66,frost:0x6fd3ff,gift:0x6bdc3b,blitz:0xffd12e,element:0xb04cff};
const BASEC=[0xbdb6a6,0xc9c2b0,0xb8bcc6,0x9aa6c0,0x8aa0d8,0xe0b040];// Sockelmaterial: Stein -> Eisen -> Mithril -> Gold
const hx=n=>typeof n==='string'?parseInt(n.slice(1),16):n;
// ---------- Lichtschmiede-Türme (Stilguide §5): Pagode/Schild, 1,6 Zellen hoch, Ausbaustufen als Aura-Schilde ----------
const LM={sand:new THREE.MeshStandardMaterial({color:0xe2cfa6,roughness:.85,flatShading:true}),sandD:new THREE.MeshStandardMaterial({color:0xb89f78,roughness:.9,flatShading:true}),
 bronze:new THREE.MeshStandardMaterial({color:0xa8733f,roughness:.35,metalness:.75,flatShading:true}),gold:new THREE.MeshStandardMaterial({color:0xf2b233,roughness:.28,metalness:.85,flatShading:true}),
 blue:new THREE.MeshStandardMaterial({color:0x3e7bd6,roughness:.35,metalness:.15,flatShading:true}),iron:new THREE.MeshStandardMaterial({color:0x3a3848,roughness:.5,metalness:.6,flatShading:true}),
 glow:new THREE.MeshStandardMaterial({color:0xfff6e0,emissive:0xffd890,emissiveIntensity:3.2,roughness:.4}),flameB:new THREE.MeshStandardMaterial({color:0x9fd0ff,emissive:0x4a9cff,emissiveIntensity:3.5,transparent:true,opacity:.9}),
 ember:new THREE.MeshStandardMaterial({color:0xffb070,emissive:0xff6f4e,emissiveIntensity:3,roughness:.6}),cloth:new THREE.MeshStandardMaterial({color:0x3e7bd6,roughness:.7,side:THREE.DoubleSide,flatShading:true}),
 outline:new THREE.MeshBasicMaterial({color:0x3a2a3f,side:THREE.BackSide})};
const shieldM=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.6,roughness:.3,metalness:.6,transparent:true,opacity:.92});
function ol(m,k=1.07){if(!QC.outline)return m;const o=new THREE.Mesh(m.geometry,LM.outline);o.scale.setScalar(k);m.add(o);return m;}
function buildLicht(t){const g=new THREE.Group(),head=new THREE.Group();g.add(head);g.userData.head=head;const ty=t.type,up=t.up||[0,0],tier=Math.min(3,Math.max(up[0],up[1])),D=QC.detail;
 // Sockel (40 %): Achteck-Plinthe, Stufe, Bronzeband
 ol(mk(cyl(.5,.56,.2,8),LM.sandD,.1,g));ol(mk(cyl(.42,.47,.18,8),LM.sand,.29,g));const band=mk(new THREE.TorusGeometry(.43,.035,5,16),LM.bronze,.38,g);band.rotation.x=Math.PI/2;
 if(D)for(let i=0;i<8;i++){const a=i/8*Math.PI*2,b=mk(new THREE.BoxGeometry(.08,.16,.06),LM.bronze,.14,g);b.position.set(Math.cos(a)*.53,.14,Math.sin(a)*.53);b.rotation.y=-a;}
 if(ty==='m_bogen'){// Funkenwerfer: schlanke Pagode, Schleuder mit glühender Kugel
  ol(mk(cyl(.2,.28,.55,8),LM.sand,.66,g));ol(mk(new THREE.ConeGeometry(.42,.24,8),LM.blue,1.02,g));mk(cyl(.13,.17,.18,8),LM.sand,1.2,g);ol(mk(new THREE.ConeGeometry(.3,.2,8),LM.blue,1.36,g));
  if(D)for(let i=0;i<8;i++){const a=i/8*Math.PI*2,e=mk(new THREE.ConeGeometry(.03,.1,4),LM.gold,.96,g);e.position.set(Math.cos(a)*.4,.92,Math.sin(a)*.4);}
  head.position.y=1.46;for(const sx of[-1,1]){const f=mk(new THREE.BoxGeometry(.04,.2,.04),LM.bronze,.1,head);f.position.x=sx*.09;f.rotation.z=-sx*.35;}
  const orb=mk(new THREE.IcosahedronGeometry(.08,1),LM.glow,.2,head);orb.position.z=.04;g.userData.aim=1;}
 else if(ty==='m_kanone'){// Amboss-Glocke: Torbogen, schwebender Amboss
  for(const sx of[-1,1]){ol(mk(new THREE.BoxGeometry(.18,.82,.26),LM.sand,.79,g)).position.x=sx*.3;mk(new THREE.BoxGeometry(.22,.08,.3),LM.bronze,1.2,g).position.x=sx*.3;}
  ol(mk(new THREE.BoxGeometry(.9,.16,.34),LM.sand,1.3,g));const rf=ol(mk(new THREE.ConeGeometry(.6,.32,4),LM.blue,1.54,g));rf.rotation.y=Math.PI/4;rf.scale.z=.55;
  const anv=new THREE.Group();anv.position.y=.86;g.add(anv);mk(new THREE.BoxGeometry(.34,.12,.18),LM.iron,0,anv);mk(new THREE.BoxGeometry(.16,.12,.12),LM.iron,-.11,anv);const horn=mk(new THREE.ConeGeometry(.06,.18,6),LM.iron,0,anv);horn.rotation.z=Math.PI/2;horn.position.x=.25;
  mk(new THREE.BoxGeometry(.3,.02,.14),LM.glow,.065,anv);g.userData.anvil=anv;if(D){const bell=mk(new THREE.SphereGeometry(.1,10,6,0,Math.PI*2,0,Math.PI/2),LM.gold,1.14,g);bell.scale.y=1.3;}}
 else if(ty==='m_wacht'){// Wachfeuer: hohe Laternensäule, blaue Flamme
  ol(mk(cyl(.11,.16,.85,8),LM.sand,.82,g));mk(new THREE.TorusGeometry(.13,.03,5,12),LM.bronze,1.0,g).rotation.x=Math.PI/2;ol(mk(cyl(.2,.14,.08,8),LM.bronze,1.27,g));
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4,b=mk(new THREE.BoxGeometry(.03,.3,.03),LM.bronze,1.45,g);b.position.set(Math.cos(a)*.15,1.45,Math.sin(a)*.15);}
  ol(mk(new THREE.ConeGeometry(.23,.22,4),LM.blue,1.71,g)).rotation.y=Math.PI/4;mk(new THREE.SphereGeometry(.04,6,4),LM.gold,1.85,g);
  const fl=mk(new THREE.ConeGeometry(.08,.24,8),LM.flameB,1.44,g);fl.castShadow=false;g.userData.flame=fl;if(D){const l=new THREE.PointLight(0x6fb0ff,2.2,2.6);l.position.y=1.45;g.add(l);}}
 else if(ty==='m_kapelle'){// Esse des Mutes: runde Esse, Glutöffnung, Kuppel, Bodenringe
  ol(mk(cyl(.36,.42,.5,10),LM.sand,.66,g));const mouth=mk(new THREE.BoxGeometry(.24,.2,.06),LM.ember,.62,g);mouth.position.z=.38;g.userData.glow2=mouth;
  ol(mk(new THREE.SphereGeometry(.38,12,6,0,Math.PI*2,0,Math.PI/2),LM.blue,.91,g));ol(mk(cyl(.07,.09,.4,6),LM.bronze,1.3,g)).position.set(.14,1.3,-.08);
  const cr=mk(new THREE.OctahedronGeometry(.1,0),LM.glow,1.42,g);g.userData.spin=cr;if(D){const l=new THREE.PointLight(0xff8a50,1.6,2);l.position.set(0,.6,.55);g.add(l);}
  for(let i=0;i<2;i++){const ring=mk(new THREE.TorusGeometry(.6+i*.25,.025,4,32),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.7,.6),transparent:true,opacity:.55}),.04,g);ring.rotation.x=Math.PI/2;ring.castShadow=false;if(!i)g.userData.pulse=ring;}}
 else if(ty==='m_ballista'){// Lichtspeer: Gestell, zwei Bronzearme, Lichtspeer nach oben
  ol(mk(new THREE.BoxGeometry(.5,.24,.5),LM.sand,.5,g));head.position.y=.62;ol(mk(new THREE.BoxGeometry(.34,.18,.42),LM.blue,.09,head));
  for(const sx of[-1,1]){const arm=mk(new THREE.BoxGeometry(.06,.06,.6),LM.bronze,.24,head);arm.position.set(sx*.26,.24,.05);arm.rotation.y=sx*.5;arm.rotation.x=-.5;}
  const sp=new THREE.Group();sp.position.y=.2;sp.rotation.x=-.85;head.add(sp);mk(cyl(.025,.025,1.05,6),LM.glow,.4,sp);mk(new THREE.ConeGeometry(.07,.22,6),LM.gold,1.02,sp);g.userData.aim=1;}
 // Ausbaustufen: Aura-Schilde hinter dem Turm (1–3), Banner ab 2, goldene Kugel mit Strahlen ab 3; äußerer Ring färbt sich nach gewähltem 3. Ausbau
 for(let i=0;i<tier;i++){const c=i===2?(up[0]>=3?0xff6f4e:0x5aa0ff):0xf2b233,r=.42+i*.13;const sh=mk(new THREE.TorusGeometry(r,.035,5,24,Math.PI*1.1),shieldM(c),.95,g);sh.position.set(0,.95,-.32-i*.05);sh.rotation.z=-.05*Math.PI;sh.castShadow=false;}
 if(tier>=2){mk(cyl(.018,.018,.9,5),LM.bronze,.85,g).position.set(.4,.85,.2);const cl=mk(new THREE.PlaneGeometry(.26,.34,3,1),LM.cloth,1.12,g);cl.position.set(.53,1.12,.2);g.userData.cloth=cl;}
 if(tier>=3){const ob=new THREE.Group();ob.position.y=2.0;g.add(ob);mk(new THREE.IcosahedronGeometry(.13,1),LM.glow,0,ob);for(let i=0;i<8;i++){const ry=mk(new THREE.ConeGeometry(.025,.2,4),LM.gold,0,ob);const a=i/8*Math.PI*2;ry.position.set(Math.cos(a)*.22,Math.sin(a)*.22,0);ry.rotation.z=a-Math.PI/2;}g.userData.halo=ob;}
 for(let pa=0;pa<2;pa++)for(let i=0;i<up[pa];i++){const p=mk(new THREE.OctahedronGeometry(.05,0),pa?shieldM(0x5aa0ff):shieldM(0xff9a3a),.3,g);p.position.set(-.16+i*.16,.3,pa?-.5:.5);}
 if(t.camo){const e=mk(new THREE.SphereGeometry(.07,8,6),LM.flameB,.5,g);e.position.set(.38,.5,-.38);}
 if(t.off){const o2=mk(new THREE.TorusGeometry(.38,.05,4,12),new THREE.MeshBasicMaterial({color:0xff5050}),1.0,g);o2.rotation.x=Math.PI/2;}
 g.scale.setScalar(1+.025*(up[0]+up[1]));return g;}
function buildTower(t){const MK=t.wall?'mauer':t.type;if(MESHY[MK]){const g=new THREE.Group(),head=new THREE.Group();g.add(head);g.userData.head=head;g.add(MESHY[MK].clone());g.scale.setScalar(1+.025*((t.up||[0,0])[0]+(t.up||[0,0])[1]));return g;}if(t.race==='menschen'&&!t.wall)return buildLicht(t);const g=new THREE.Group(),head=new THREE.Group();g.add(head);g.userData.head=head;
 if(t.wall){mk(new THREE.BoxGeometry(.85,.5,.85),M(0x9aa0a6),.3,g);return g;}
 const lv=t.lv||0,ty=t.vis||t.type,RC=t.race&&typeof RACE!=='undefined'?RACE[t.race]:null;mk(cyl(.42,.48,.25,8),M(RC?new THREE.Color(hx(RC.acc)).multiplyScalar(.75-.04*Math.min(5,lv)).getHex():BASEC[Math.min(5,lv)]),.17,g);head.position.y=.3;const c=M(RC?hx(RC.c):TCOL[t.type]||0xcccccc);
 if(ty==='pfeil'){mk(cyl(.25,.32,.7,6),c,.35,head);mk(new THREE.ConeGeometry(.36,.4,6),M(RC?hx(RC.c2):t.up[1]>=3?0x3a6ad5:0xc0392b),.9,head);
  const bow=mk(new THREE.TorusGeometry(.22,.04,4,8,Math.PI),M(0x5a3a1a),.55,head);bow.position.z=.3;bow.rotation.z=Math.PI/2;g.userData.aim=1;}
 else if(ty==='kanone'){mk(new THREE.SphereGeometry(.33,8,6),c,.3,head);const b=mk(cyl(.11+lv*.012,.14+lv*.012,.6+lv*.04,8),M(0x2b2e35),.38,head);b.rotation.x=Math.PI/2.4;b.position.z=.28;g.userData.aim=1;}
 else if(ty==='frost'){mk(cyl(.18,.28,.5,6),M(0xe8f8ff),.25,head);const cr=mk(new THREE.OctahedronGeometry(.28,0),ME(0x9fe8ff,0x2a7fa8),.8,head);cr.scale.y=1.6+lv*.1;g.userData.spin=cr;}
 else if(ty==='gift'){mk(cyl(.3,.24,.45,7),M(0x5b3f7a),.22,head);mk(new THREE.SphereGeometry(.27,8,6),ME(0x7cff4a,0x2a6a10),.55,head);g.userData.bob=mk(new THREE.SphereGeometry(.09,6,4),M(0xb6ff8a),.85,head);}
 else if(ty==='blitz'){mk(cyl(.08,.2,.9,6),M(0x8890a0),.45,head);for(let i=0;i<3;i++){const r=mk(new THREE.TorusGeometry(.2-i*.04,.035,4,10),M(0xcc9a2a),.3+i*.22,head);r.rotation.x=Math.PI/2;}
  g.userData.spin=mk(new THREE.IcosahedronGeometry(.16+lv*.015,0),new THREE.MeshBasicMaterial({color:0xfff27a}),1.0,head);}
 else if(ty==='aura'){mk(cyl(.22,.28,.6,8),c,.3,head);const d=mk(new THREE.SphereGeometry(.3,10,6,0,Math.PI*2,0,Math.PI/2),ME(hx(RC?RC.c2:'#fff'),0x333333),.6,head);const ring=mk(new THREE.TorusGeometry(.55,.03,4,20),new THREE.MeshBasicMaterial({color:hx(RC?RC.c2:'#fff'),transparent:true,opacity:.5}),.05,g);ring.rotation.x=Math.PI/2;g.userData.pulse=ring;}
 else if(ty==='eco'){mk(new THREE.BoxGeometry(.62,.42,.55),c,.22,head);mk(cyl(.08,.1,.6,6),M(0x3a302a),.6,head).position.set(.18,.6,-.1);const gl=mk(new THREE.BoxGeometry(.24,.14,.05),new THREE.MeshBasicMaterial({color:hx(RC?RC.c2:'#f80')}),.15,head);gl.position.z=.28;g.userData.glow=gl;}
 else if(t.type==='element'){const E=t.el,ec=E?hx(E.c):0x777777;mk(new THREE.BoxGeometry(.6,.6,.6),M(0x4a4560),.3,head);mk(new THREE.ConeGeometry(.45,.5,4),M(0x2e2a3d),.85,head).rotation.y=Math.PI/4;
  const rm=new THREE.MeshBasicMaterial({color:ec});const rune=mk(new THREE.TorusGeometry(.42,.04,4,6),rm,1.35,g);rune.rotation.x=Math.PI/2;g.userData.rune=rune;
  const core=mk(new THREE.OctahedronGeometry(.14+(E?E.lv*.03:0),0),new THREE.MeshBasicMaterial({color:E&&E.runes.length>1?0xffffff:ec}),1.35,g);g.userData.spin=core;
  if(E){const l=new THREE.PointLight(ec,2+E.lv*.4,3);l.position.y=1.3;g.add(l);for(let i=0;i<E.lv;i++){const p=mk(new THREE.SphereGeometry(.06,6,4),rm,.12,g);p.position.set(-.3+i*.15,.12,.46);}}}
 if(RC){const k2=M(hx(RC.c2)),ac=M(hx(RC.acc));// Rassen-Silhouette
  if(RC.mark==='banner'){mk(cyl(.02,.02,.6,4),M(0x6b4a2a),1.0,g).position.x=.35;const fl=mk(new THREE.BoxGeometry(.02,.16,.24),k2,1.2,g);fl.position.set(.35,1.2,.12);}
  else if(RC.mark==='horns'){for(const sx of[-1,1]){const h=mk(new THREE.ConeGeometry(.07,.38,5),ac,.35,g);h.position.x=sx*.44;h.rotation.z=-sx*.7;}}
  else if(RC.mark==='eyes'){for(const sx of[-1,1]){const e=mk(new THREE.SphereGeometry(.06,6,4),new THREE.MeshBasicMaterial({color:hx(RC.c2)}),.2,g);e.position.set(sx*.13,.2,.45);}const sp=mk(new THREE.ConeGeometry(.05,.3,4),M(0xd9d3c1),.4,g);sp.position.set(-.35,.4,-.3);}
  else if(RC.mark==='moon'){const mo=mk(new THREE.TorusGeometry(.14,.04,4,10,Math.PI*1.3),new THREE.MeshBasicMaterial({color:hx(RC.acc)}),1.25,g);mo.position.x=.3;}
  else if(RC.mark==='gear'){const gr=mk(new THREE.TorusGeometry(.13,.05,4,8),k2,.25,g);gr.position.set(-.38,.25,.3);g.userData.gear=gr;}}
 if(t.off){const o2=mk(new THREE.TorusGeometry(.35,.05,4,10),new THREE.MeshBasicMaterial({color:0xff5050}),1.0,g);o2.rotation.x=Math.PI/2;}
 // Upgrade-Pips (Pfad A orange vorn, Pfad B blau hinten) + Krone ab Stufe 3 eines Pfades
 for(let pa=0;pa<2;pa++)for(let i=0;i<(t.up?t.up[pa]:0);i++){const p=mk(new THREE.SphereGeometry(.065,6,4),new THREE.MeshBasicMaterial({color:pa?0x5aa0ff:0xff9a3a}),.3,g);p.position.set(-.2+i*.2,.3,pa?-.46:.46);}
 if(t.up&&(t.up[0]>=3||t.up[1]>=3)){const cr=mk(new THREE.TorusGeometry(.5,.05,4,16),ME(0xffd23a,0x664400),.32,g);cr.rotation.x=Math.PI/2;g.userData.crown=cr;}
 if(t.camo){const e=mk(new THREE.SphereGeometry(.09,8,6),new THREE.MeshBasicMaterial({color:0xffffff}),.55,g);e.position.set(.35,.55,-.35);}
 if(RC){const rr=mk(new THREE.TorusGeometry(.47,.045,5,18),ME(hx(RC.c2),new THREE.Color(hx(RC.c2)).multiplyScalar(.25).getHex()),.3,g);rr.rotation.x=Math.PI/2;}
 g.scale.setScalar(1.08+.045*lv);return g;}
const HMOD={Ilka:'hero_ilka',Torvan:'hero_torvan'};
function buildHero(H){const g=buildHero0(H),HM=MESHY[HMOD[H.n]];if(HM){for(const c of g.children)if(c.isMesh)c.visible=false;g.traverse(c=>{if(c.isMesh&&c!==g.userData.tag)c.visible=false;});if(g.userData.tag)g.userData.tag.visible=true;g.add(HM.clone());g.userData.c=H.c+'#m';}return g;}
function buildHero0(H){const g=new THREE.Group(),col=hx(H.c);g.userData.c=H.c;
 mk(new THREE.ConeGeometry(.32,.7,8),M(new THREE.Color(col).multiplyScalar(.6).getHex()),.38,g);// Umhang
 mk(new THREE.CylinderGeometry(.2,.26,.55,8),M(col),.5,g);mk(new THREE.SphereGeometry(.17,10,8),M(0xf3d9b5),.92,g);
 const cr=mk(new THREE.CylinderGeometry(.17,.14,.1,6,1,true),ME(0xffc93c,0x664400),1.08,g);cr.material.side=THREE.DoubleSide;
 const sw=new THREE.Group();sw.position.set(.28,.6,0);mk(new THREE.BoxGeometry(.06,.6,.03),M(0xe8e8f0),.3,sw);g.add(sw);g.userData.sword=sw;
 const rg=mk(new THREE.TorusGeometry(.45,.03,4,20),new THREE.MeshBasicMaterial({color:col}),.03,g);rg.rotation.x=Math.PI/2;
 const tag=label('★1',1);tag.position.y=1.45;g.add(tag);g.userData.tag=tag;return g;}
// ---------- Kreaturen ----------
const eyeGeo=new THREE.SphereGeometry(.06,5,4),eyeMat=M(0x111111);const hbGeo=new THREE.PlaneGeometry(.6,.08),hbBg=new THREE.MeshBasicMaterial({color:0x222222,depthTest:false});
function buildCreep(c){const g=buildCreep0(c),U=MESHY['unit_'+c.type];if(U&&(c.type==='laeufer'||c.type==='flitzer'||c.type==='panzer'||c.type==='berserker')){const ud=g.userData;g.children.forEach(ch=>{if(ch!==ud.hb)ch.visible=false;});ud.body.visible=false;if(!U.userData.fitS){const b=new THREE.Box3().setFromObject(U),s=b.getSize(new THREE.Vector3());U.userData.fitS=Math.min(1,(c.type==='panzer'?.95:c.type==='berserker'?.9:.85)/Math.max(s.x,s.z,.01));}const m=new THREE.Group();m.add(U.clone());m.scale.setScalar(U.userData.fitS);m.userData.s0=U.userData.fitS;ud.mdl=m;g.add(m);}return g;}
function buildCreep0(c){const g=new THREE.Group();const col=hx(c.color);let body;
 if(c.fly){body=mk(new THREE.ConeGeometry(.22,.55,4),M(col),0,g);body.rotation.x=Math.PI/2;const w=mk(new THREE.BoxGeometry(.95,.05,.28),M(col),0,g);g.userData.wing=w;}
 else if(c.armor)body=mk(new THREE.DodecahedronGeometry(c.boss?.5:.32,0),M(col),c.boss?.5:.32,g);
 else body=mk(new THREE.IcosahedronGeometry(c.type==='flitzer'?.22:.28,0),M(col),.32,g);
 g.userData.body=body;g.userData.col=col;
 if(c.boss)for(const s of[-1,1]){const h=mk(new THREE.ConeGeometry(.09,.4,5),M(0xeeeeee),.95,g);h.position.x=s*.3;h.rotation.z=-s*.5;}
 if(c.heal){const l=new THREE.PointLight(0xff66aa,1.2,2);l.position.y=.6;g.add(l);}
 for(const s of[-1,1]){const e=new THREE.Mesh(eyeGeo,eyeMat);e.position.set(s*.11,c.fly?.05:.4,c.fly?.25:.23);g.add(e);}
 const bg=new THREE.Mesh(hbGeo,hbBg),fg=new THREE.Mesh(hbGeo,new THREE.MeshBasicMaterial({color:0x4cff4c,depthTest:false}));bg.renderOrder=fg.renderOrder=6;fg.position.z=.001;
 const hb=new THREE.Group();hb.add(bg,fg);hb.position.y=c.boss?1.3:.9;g.add(hb);g.userData.hb=hb;g.userData.fg=fg;
 if(c.camo)g.traverse(o=>{if(o.isMesh&&o.parent!==hb){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.45;}});
 return g;}
// ---------- Projektile, Partikel, Effekte ----------
const projGeo={pfeil:new THREE.ConeGeometry(.05,.3,4).rotateX(Math.PI/2),kanone:new THREE.SphereGeometry(.12,6,4),def:new THREE.IcosahedronGeometry(.1,0)};
const PMAX=500,parts=new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.08),new THREE.MeshBasicMaterial(),PMAX);parts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
const P=[];for(let i=0;i<PMAX;i++){P.push({life:0});parts.setColorAt(i,tc.set(0xffffff));}scene.add(parts);let pIdx=0;
function burst(v,col,n,pw=2.5){tc.set(col);for(let i=0;i<n;i++){const p=P[pIdx];parts.setColorAt(pIdx,tc);pIdx=(pIdx+1)%PMAX;Object.assign(p,{life:.5+Math.random()*.3,x:v.x,y:v.y,z:v.z,vx:(Math.random()-.5)*pw,vy:Math.random()*pw+1,vz:(Math.random()-.5)*pw});}parts.instanceColor.needsUpdate=true;}
let fxObjs=[];
// ---------- Projektil-VFX: leuchtender Kern + Glow-Sprite, Partikel-Spur (Points, additiv), Einschlag (Blitz + Ring + Funken) ----------
const VFX=(()=>{const cvs=document.createElement('canvas');cvs.width=cvs.height=64;{const c=cvs.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.8)');g.addColorStop(.6,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);}
 const GT=new THREE.CanvasTexture(cvs);GT.colorSpace=THREE.SRGBColorSpace;
 const TL=new THREE.TextureLoader(),TX2={};for(const n of['light_02','flare_01','star_06','circle_05','magic_05','scorch_02'])TX2[n]=TL.load('assets/vfx/'+n+'.png');
 const AM=(map,color,op=1)=>new THREE.SpriteMaterial({map,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op});
 const planeG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const G={spear:new THREE.ConeGeometry(.06,.55,6).rotateX(Math.PI/2),arrow:new THREE.ConeGeometry(.035,.32,4).rotateX(Math.PI/2),orb:new THREE.IcosahedronGeometry(.075,1),chunk:new THREE.DodecahedronGeometry(.09,0),seed:new THREE.SphereGeometry(.06,8,6).scale(.8,.8,1.5),ball:new THREE.IcosahedronGeometry(.17,0),falcon:(()=>{const g=new THREE.ConeGeometry(.07,.5,5).rotateX(Math.PI/2);const w=new THREE.BoxGeometry(.62,.02,.16);const p=[...g.toNonIndexed().attributes.position.array,...w.toNonIndexed().attributes.position.array];const G2=new THREE.BufferGeometry();G2.setAttribute('position',new THREE.Float32BufferAttribute(p,3));G2.computeVertexNormals();return G2;})(),lance:new THREE.ConeGeometry(.05,.95,6).rotateX(Math.PI/2),shard:new THREE.OctahedronGeometry(.08,0).scale(.7,.7,1.6)};
 const BASE={pfeil:['arrow',0xfff0d0,0xffd890,.35],kanone:['ball',0x3a2c22,0xff8a30,.7],frost:['shard',0xdff6ff,0x5ab8ff,.45],gift:['orb',0xd0ff9a,0x52c23a,.45],blitz:['orb',0xf4f8ff,0x8ab8ff,.5]};
 const RS={menschen:['spear','orb',0xffffff,0xffb830],orks:['chunk','chunk',0xffc060,0xff4a1a],zwerge:['seed','seed',0xd8ff8a,0x5fd63a],untote:['orb','orb',0xe8d0ff,0x8a4ad0],elfen:['spear','shard',0xeaf6ff,0x7ab8ff]};
 const cache={};function sty(type,color){const k=type+'|'+color;if(cache[k])return cache[k];const T=(typeof TT!=='undefined'&&TT[type])||{},vis=T.vis||type;let s;
  if(type==='element'){const c=new THREE.Color(color||0xffffff);s={shape:'orb',core:c.clone().lerp(new THREE.Color(1,1,1),.55).getHex(),glow:c.getHex(),sz:.55};}
  else if(T.race&&RS[T.race]){const r=RS[T.race];s={shape:(vis==='pfeil'||type==='m_ballista')?r[0]:r[1],core:r[2],glow:r[3],sz:vis==='kanone'?.7:type==='m_bogen'?.75:.48};}
  else if(BASE[vis]){const b=BASE[vis];s={shape:b[0],core:b[1],glow:b[2],sz:b[3]};}
  else s={shape:'orb',core:0xffffff,glow:color||0xffffff,sz:.45};
  s.big=vis==='kanone';s.imp=s.big?'big':'small';
  const MS={m_bogen:{shape:'spear',core:0xffffff,glow:0xffb830,sz:.75,imp:'small'},m_kanone:{shape:'orb',core:0xfffbe8,glow:0xffd060,sz:.9,imp:'wave',big:false,ring:1},
   m_wacht:{shape:'shard',core:0xeaf8ff,glow:0x4aa8ff,sz:.7,imp:'crystal'},m_ballista:{shape:'lance',core:0xffffff,glow:0xffc030,sz:.95,imp:'lance',big:false},
   o_speer:{shape:'spear',core:0xfff0c0,glow:0xff5a14,sz:.8,imp:'lance',big:false},o_katapult:{shape:'ball',core:0xffa040,glow:0xff4010,sz:1.15,imp:'lava',big:false,arc:1.7},
   o_wyvern:{shape:'falcon',core:0xffd080,glow:0xff5010,sz:.95,imp:'burn',big:false,dive:1}};
  if(MS[type])Object.assign(s,MS[type]);return cache[k]=s;}
 // Spur
 const TN=2400,tp=new Float32Array(TN*3),tcl=new Float32Array(TN*3),ta=new Float32Array(TN),ts=new Float32Array(TN);let ti=0;
 const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(tp,3).setUsage(THREE.DynamicDrawUsage));tg.setAttribute('color',new THREE.BufferAttribute(tcl,3).setUsage(THREE.DynamicDrawUsage));tg.setAttribute('a',new THREE.BufferAttribute(ta,1).setUsage(THREE.DynamicDrawUsage));tg.setAttribute('s',new THREE.BufferAttribute(ts,1));
 const tm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{map:{value:GT},ps:{value:300}},vertexColors:true,
  vertexShader:'attribute float a,s;varying float vA;varying vec3 vC;uniform float ps;void main(){vA=a;vC=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=ps*s*(.35+.65*a)/-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;varying float vA;varying vec3 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC*2.2*vA,1.)*t.a*vA;}'});
 const trail=new THREE.Points(tg,tm);trail.frustumCulled=false;scene.add(trail);
 const tcol=new THREE.Color();function emit(v,col,s,j=0){const i=ti;ti=(ti+1)%TN;tp[i*3]=v.x+(Math.random()-.5)*j;tp[i*3+1]=v.y+(Math.random()-.5)*j;tp[i*3+2]=v.z+(Math.random()-.5)*j;tcol.set(col);tcl[i*3]=tcol.r;tcl[i*3+1]=tcol.g;tcl[i*3+2]=tcol.b;ta[i]=1;ts[i]=s;}
 // Einschläge
 const IMP=[],ringG=new THREE.RingGeometry(.6,.8,24).rotateX(-Math.PI/2);
 function impact(v,s){if(IMP.length>40)return;const b=s.big,L=[];const add=(o,life,s0,s1,op,spin=0,dl=0)=>{scene.add(o);o.material.opacity=0;L.push({o,life,s0,s1,op,spin,dl});};
  const ring=(c,life,s1,dl=0,op=.95)=>{const o=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:TX2.circle_05,color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));o.position.copy(v).setY(.07);add(o,life,.2,s1,op,0,dl);};
  if(s.imp==='wave'){// Glocke: goldene Klang-/Lichtwelle (Splash 1 Feld)
   {const o=new THREE.Sprite(AM(TX2.flare_01,0xffffff));o.position.copy(v);add(o,.22,.5,1.8,1,2);}
   {const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.5,.8,2.6,.8);}
   ring(s.glow,.45,2.4);ring(0xffffff,.4,1.6,.06,.7);if(QC.detail){ring(s.glow,.55,2.9,.14,.6);const o=new THREE.Sprite(AM(TX2.star_06,0xfff4c0));o.position.copy(v);add(o,.4,.4,1.6,1,4);}
   IMP.push({L,t:0});burst(v,s.glow,QC.detail?14:6,2.6);if(QC.detail)for(let i=0;i<18;i++){const a=i/18*6.283;emit(v.clone().add(new THREE.Vector3(Math.cos(a)*.9,0,Math.sin(a)*.9)),i%2?s.glow:0xffffff,.8,.1);}return;}
  if(s.imp==='crystal'){// Wachfeuer: blauer Kristall-Splitter
   {const o=new THREE.Sprite(AM(TX2.flare_01,0xffffff));o.position.copy(v);add(o,.14,.25,.9,1,-3);}
   {const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.28,.4,1.2,.9);}
   if(QC.detail){const o=new THREE.Sprite(AM(TX2.star_06,0xbfe6ff));o.position.copy(v);add(o,.32,.3,1.1,1,6);}ring(s.glow,.28,1.1);
   IMP.push({L,t:0});burst(v,0x8fd0ff,QC.detail?8:3,2.2);if(QC.detail)for(let i=0;i<10;i++)emit(v,i%2?0xffffff:s.glow,.8,.35);return;}
  if(s.imp==='lava'){// Felsfaust: Glutfels-Einschlag, Lavaring (Splash 1,5)
   v=v.clone().setY(.3);{const o=new THREE.Sprite(AM(TX2.flare_01,0xffe0a0));o.position.copy(v);add(o,.22,.6,2,1,2);}
   {const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.55,.9,3,.9);}ring(0xff5a10,.6,3.4);ring(0xffb040,.45,2.2,.05,.8);
   {const o=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:TX2.scorch_02,color:0x000000,transparent:true,opacity:.55,depthWrite:false}));o.position.copy(v).setY(.065);o.rotation.y=Math.random()*6;add(o,1.6,1.6,2.6,.55);}
   IMP.push({L,t:0});burst(v,0xff6a10,QC.detail?18:7,3.4);if(QC.detail)for(let i=0;i<22;i++){const a=Math.random()*6.283,rr=Math.random()*1.4;emit(v.clone().add(new THREE.Vector3(Math.cos(a)*rr,Math.random()*.5,Math.sin(a)*rr)),i%2?0xff4010:0xffb040,.8,.25);}return;}
  if(s.imp==='burn'){// Horst: Falkensturz + Glut
   {const o=new THREE.Sprite(AM(TX2.flare_01,0xffffff));o.position.copy(v);add(o,.16,.4,1.3,1,-4);}{const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.4,.5,1.6,.9);}ring(s.glow,.35,1.3);
   IMP.push({L,t:0});burst(v,0xff7020,QC.detail?10:4,2.4);if(QC.detail)for(let i=0;i<16;i++)emit(v.clone().add(new THREE.Vector3((Math.random()-.5)*.5,i*.06,(Math.random()-.5)*.5)),i%2?0xff5010:0xffc060,.75,.6);return;}
  if(s.imp==='lance'){// Lichtspeer: durchschlagender Goldspeer
   {const o=new THREE.Sprite(AM(TX2.flare_01,0xffffff));o.position.copy(v);add(o,.2,.5,1.7,1,4);}
   {const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.4,.6,2,.95);}
   ring(s.glow,.35,1.6);if(QC.detail){ring(0xffffff,.3,1,.05,.6);const o=new THREE.Sprite(AM(TX2.star_06,0xffffff));o.position.copy(v);add(o,.38,.5,1.6,1,-6);}
   IMP.push({L,t:0});burst(v,s.glow,QC.detail?12:5,3.4);if(QC.detail)for(let i=0;i<14;i++)emit(v,i%2?0xffffff:s.glow,1,.45);return;}
  {const o=new THREE.Sprite(AM(TX2.flare_01,0xffffff));o.position.copy(v);add(o,b?.22:.16,b?.6:.3,b?2.2:1.1,1,3);}// weiß-heißer Blitz
  {const o=new THREE.Sprite(AM(TX2.light_02,s.glow));o.position.copy(v);add(o,b?.45:.3,b?.8:.4,b?2.6:1.3,.9);}// getönter Glow
  if(QC.detail){const o=new THREE.Sprite(AM(TX2.star_06,s.core));o.position.copy(v);add(o,.35,.3,b?1.8:1,1,-5);}// Funkelstern
  {const o=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:TX2.circle_05,color:s.glow,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));o.position.copy(v).setY(.07);add(o,b?.5:.32,.2,b?3.2:1.5,.9);}// Schockwelle
  if(b){const o=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:TX2.scorch_02,color:0x000000,transparent:true,opacity:.5,depthWrite:false}));o.position.copy(v).setY(.065);o.rotation.y=Math.random()*6;add(o,2.5,1.4,1.6,.55);}// Brandfleck
  IMP.push({L,t:0});burst(v,s.glow,b?12:QC.detail?6:3,b?3.2:2);if(QC.detail)for(let i=0;i<(b?16:8);i++)emit(v,s.core,.9,.4);}
 function auraPulse(v,s){if(IMP.length>40)return;const L=[];const add=(o,life,s0,s1,op,dl=0)=>{scene.add(o);o.material.opacity=0;L.push({o,life,s0,s1,op,spin:0,dl});};
  const rg=(c,life,s1,dl,op)=>{const o=new THREE.Mesh(planeG,new THREE.MeshBasicMaterial({map:TX2.circle_05,color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));o.position.copy(v).setY(.07);add(o,life,.4,s1,op,dl);};
  rg(s.glow,.9,4.2,0,.55);if(QC.detail)rg(s.core,.8,3,.15,.35);{const o=new THREE.Sprite(AM(GT,s.glow));o.position.copy(v);add(o,.7,.6,1.6,.6);}IMP.push({L,t:0});
  if(QC.detail)for(let i=0;i<14;i++){const a=Math.random()*6.283,rr=Math.random()*1.6;emit(v.clone().add(new THREE.Vector3(Math.cos(a)*rr,Math.random()*1.2,Math.sin(a)*rr)),i%3?s.glow:s.core,.7,.05);}}
 const prevBy=new Map(),VT=new Set(['m_bogen','m_kanone','m_wacht','m_ballista','o_speer','o_katapult','o_wyvern']),AUR=new Map();
 function lane(L,ln,pi,dt,now){if(!L.vp)L.vp=[];const ps=ln.proj.filter(p=>VT.has(p.type));
  while(L.vp.length<ps.length){const g=new THREE.Group(),core=new THREE.Mesh(G.orb,new THREE.MeshBasicMaterial({toneMapped:false})),gl=new THREE.Sprite(AM(GT,0xffffff,.85)),hot=new THREE.Sprite(AM(TX2.star_06,0xffffff,1));hot.scale.setScalar(.32);g.add(core);g.add(gl);g.add(hot);g.userData={core,gl,hot};L.grp.add(g);L.vp.push(g);}
  const cur=[];L.vp.forEach((g,i)=>{const p=ps[i];g.visible=!!p;if(!p)return;const s=sty(p.type,p.color);let hh=s.big?.9:.8;if((s.arc||s.dive)&&p.ox!=null&&p.tx!=null){const a=Math.hypot(p.x-p.ox,p.y-p.oy),b=Math.hypot(p.tx-p.x,p.ty-p.y),f=a/Math.max(.01,a+b);hh=s.arc?.6+s.arc*Math.sin(Math.PI*f):.5+1.9*(1-f)*(1-f);}const np=W(pi,p.x,p.y,hh);
   const d=np.clone().sub(g.position);const jump=d.lengthSq()>4;g.position.copy(np);const {core,gl,hot}=g.userData;hot.material.rotation=now*6+i;if(core.geometry!==G[s.shape])core.geometry=G[s.shape];core.material.color.set(s.core);gl.material.color.set(s.glow);
   const fl=s.ring?1+.35*Math.sin(now*18+i):1+.15*Math.sin(now*30+i);gl.scale.setScalar(s.sz*.8*fl);if(!jump&&d.lengthSq()>1e-6){core.lookAt(np.clone().add(d));}if(s.shape==='chunk'||s.shape==='ball')core.rotation.x+=dt*9;
   if(QC.detail&&!jump){const wp=g.getWorldPosition(new THREE.Vector3()),prev=wp.clone().sub(d.clone());for(let k=0;k<5;k++)emit(prev.clone().lerp(wp,k/5),k%2?s.core:s.glow,s.sz*(k%2?.45:.9),s.shape==='seed'||s.big?.06:.02);}
   cur.push({x:p.x,y:p.y,type:p.type,s,w:g.getWorldPosition(new THREE.Vector3())});});
  for(const t of ln.towers||[]){if(t.type==='o_trommel'){const key=L.pi+':'+t.x+':'+t.y,nt=AUR.get(key)||0;if(now<nt)continue;const beat=(AUR.get(key+'b')||0)+1;AUR.set(key+'b',beat);AUR.set(key,now+(beat%2?.28:1.05));auraPulse(W(pi,t.x+.5,t.y+.5,.45),{glow:beat%2?0xff4a14:0xff8a2a,core:0xffc070});continue;}if(t.type!=='m_kapelle')continue;const key=L.pi+':'+t.x+':'+t.y,nt=AUR.get(key)||0;if(now<nt)continue;AUR.set(key,now+1.6+Math.random()*.4);// Esse: Glut-Aura-Puls
   const v=W(pi,t.x+.5,t.y+.5,.5);const sA={glow:0xff8a2a,core:0xffd080,imp:'aura'};auraPulse(v,sA);}
  const pv=prevBy.get(L)||[];for(const q of pv){if(!cur.some(c=>c.type===q.type&&Math.abs(c.x-q.x)+Math.abs(c.y-q.y)<1.2))impact(q.w,q.s);}prevBy.set(L,cur);}
 function tick(dt){const k=dt/.38;for(let i=0;i<TN;i++)if(ta[i]>0)ta[i]=Math.max(0,ta[i]-k);tg.attributes.position.needsUpdate=true;tg.attributes.color.needsUpdate=true;tg.attributes.a.needsUpdate=true;trail.visible=!!QC.detail;
  for(let i=IMP.length-1;i>=0;i--){const m=IMP[i];m.t+=dt;let alive=0;for(const l of m.L){if(m.t<l.dl){alive=1;continue;}const f=Math.min(1,(m.t-l.dl)/l.life),e=1-Math.pow(1-f,3);const s=l.s0+(l.s1-l.s0)*e;l.o.scale.set(s,s,s);l.o.material.opacity=l.op*Math.pow(1-f,1.5);if(l.spin)l.o.material.rotation=(l.o.material.rotation||0)+l.spin*dt;if(f<1)alive=1;}
   if(!alive){for(const l of m.L){scene.remove(l.o);l.o.material.dispose();}IMP.splice(i,1);}}}
 function chain(a,b,first){if(!QC.detail&&Math.random()<.5)return;const d=b.clone().sub(a);for(let k=0;k<(QC.detail?12:5);k++){const q=a.clone().add(d.clone().multiplyScalar(Math.random()));q.y+=(Math.random()-.5)*.2;emit(q,k%2?0xff5010:0xffc060,.7,.2);}
  if(first&&IMP.length<40){const L=[];const o=new THREE.Sprite(AM(GT,0xff6a20));o.position.copy(b);scene.add(o);o.material.opacity=0;L.push({o,life:.3,s0:.3,s1:1,op:.9,spin:0,dl:0});IMP.push({L,t:0});}}
 return{lane,tick,chain};})();

const selRing=new THREE.Mesh(new THREE.RingGeometry(.95,1,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7}));selRing.rotation.x=-Math.PI/2;scene.add(selRing);
const pvTile=new THREE.Mesh(new THREE.BoxGeometry(.98,.05,.98),new THREE.MeshBasicMaterial({color:0x5CE07A,transparent:true,opacity:.6}));scene.add(pvTile);
const linePool=[];const pvRing=selRing.clone();pvRing.material=selRing.material.clone();pvRing.material.color.set(0x78dcff);scene.add(pvRing);
// ---------- Kamera: schräg, Fit (Feld + Mine + Schrein), freies Schwenken ----------
const PITCH=.74;let VH=800;// ~49° (tiefer als zuvor, BTD6-artig)
let camX=COLS/2+1.2,camTX=camX,vel=0,dist=30,aspect=1,camLane=0,drag=null,dragged=false;
const laneCX=pi=>pi*LGAP+COLS/2+1.2;
let tz=ROWS/2+.9;let ZM=1;const ZO={x:0,z:0},ZMIN=.2;
function fitDist(){const ib=2*(R3D.insetB||0)/Math.max(1,VH),xr=aspect>1.2?COLS+2.2:COLS+.9,pts=[W(0,-.3,-1.0,1.2),W(0,xr,-1.0,1.2),W(0,-.3,ROWS+.4),W(0,xr,ROWS+.4)];tz=ROWS/2+.9;let d=30;
 const span=d=>{placeCam(laneCX(0),d,1);const v=pts.map(p=>p.clone().project(cam));return{ok:v.every(q=>q.z<1&&q.z>-1),x0:Math.min(...v.map(q=>q.x)),x1:Math.max(...v.map(q=>q.x)),y0:Math.min(...v.map(q=>q.y)),y1:Math.max(...v.map(q=>q.y))};};
 const ctr=d=>{for(let k=0;k<8;k++){const q=span(d);tz-=((q.y1+q.y0)/2-ib/2)*d*.3;}return span(d);};
 let lo=6,hi=90;for(let i=0;i<26;i++){const m=(lo+hi)/2,q=ctr(m);if(q.ok&&q.x0>-.99&&q.x1<.99&&q.y0>-.985+ib&&q.y1<.97)hi=m;else lo=m;}d=hi;ctr(d);
 dist=d;placeCam(camX,d);}
function placeCam(x,d=dist,raw){const z=raw?1:ZM,X=x+(raw?0:ZO.x),T=tz+(raw?0:ZO.z);d*=z;cam.position.set(X,Math.sin(PITCH)*d,T+Math.cos(PITCH)*d);cam.lookAt(X,0,T-.3);cam.updateMatrixWorld();cam.updateProjectionMatrix();
 sun.position.set(x-13,13,ROWS/2-9);sun.target.position.set(x,0,ROWS/2);}
let ptrs=0;cv.addEventListener('pointerdown',e=>{ptrs++;if(drag&&ptrs>1)return;drag={right:e.button===2||e.button===1,x:e.clientX,y:e.clientY,x0:e.clientX,t:performance.now(),moved:0};vel=0;});
cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;drag.moved+=Math.abs(dx)+Math.abs(e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;
 if(ptrs>=2)return;if(drag.right||ZM<.98&&!R3D.lockPan){if(drag.moved>6){dragged=true;panBy(drag.px??e.clientX-dx,drag.py??drag.y,e.clientX,e.clientY);}drag.px=e.clientX;drag.py=e.clientY;return;}if(R3D.lockPan)return;if(Math.abs(e.clientX-drag.x0)>14){dragged=true;const k=(cam.position.y/cam.position.length())*dist*.0035*(900/Math.max(400,cv.clientHeight));const mv=-dx*k*1.4;camTX=camX=Math.max(laneCX(0)-3,Math.min(laneCX(1)+3,camX+mv));vel=mv/Math.max(1,(performance.now()-drag.t))*16;drag.t=performance.now();}});
const endDrag=()=>{if(!drag)return;if(dragged&&ZM>=.98&&!drag.right){const pr=camX+vel*12,lane=pr>(laneCX(0)+laneCX(1))/2?1:0;camTX=laneCX(lane);if(lane!==camLane){camLane=lane;R3D.onLane&&R3D.onLane(lane);}}drag=null;};
const pu=e=>{PT.delete(e.pointerId);pinch=null;ptrs=Math.max(0,ptrs-1);if(!ptrs)endDrag();};
// ---------- Zoom (Mausrad / Pinch, zum Zeiger hin) + Schwenken im Zoom ----------
const gPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),gRay=new THREE.Raycaster(),gN=new THREE.Vector2();
function groundAt(cx,cy){const r=cv.getBoundingClientRect();gN.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);gRay.setFromCamera(gN,cam);const p=new THREE.Vector3();return gRay.ray.intersectPlane(gPlane,p)?p:null;}
function clampZO(){const f=(1-ZM)/(1-ZMIN),lx=(COLS/2+1)*f,lz=(ROWS/2+1)*f;ZO.x=Math.max(-lx,Math.min(lx,ZO.x));ZO.z=Math.max(-lz,Math.min(lz,ZO.z));if(ZM>=.999){ZO.x=ZO.z=0;}zBtn.style.display=ZM<.98?'block':'none';}
function panBy(x0,y0,x1,y1){const a=groundAt(x0,y0),b=groundAt(x1,y1);if(!a||!b)return;ZO.x-=b.x-a.x;ZO.z-=b.z-a.z;clampZO();placeCam(camX);}
function zoomAt(cx,cy,f){const a=groundAt(cx,cy);ZM=Math.max(ZMIN,Math.min(1,ZM*f));clampZO();placeCam(camX);const b=groundAt(cx,cy);if(a&&b){ZO.x+=a.x-b.x;ZO.z+=a.z-b.z;}clampZO();placeCam(camX);}
const zBtn=document.createElement('button');zBtn.textContent='⤢ Ansicht';zBtn.title='Zoom zurücksetzen';zBtn.style.cssText='position:fixed;right:8px;top:48px;z-index:8;display:none;padding:4px 10px;border-radius:12px;border:1px solid #f2d38a;background:rgba(20,15,40,.75);color:#f2d38a;font:bold 13px system-ui';document.body.appendChild(zBtn);
zBtn.addEventListener('click',()=>{ZM=1;ZO.x=ZO.z=0;clampZO();placeCam(camX);});
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,Math.exp(e.deltaY*.0015));},{passive:false});
const PT=new Map();let pinch=null;
cv.addEventListener('pointerdown',e=>{PT.set(e.pointerId,{x:e.clientX,y:e.clientY});if(PT.size===2){const[a,b]=[...PT.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),cx:(a.x+b.x)/2,cy:(a.y+b.y)/2};}});
cv.addEventListener('pointermove',e=>{if(!PT.has(e.pointerId))return;PT.set(e.pointerId,{x:e.clientX,y:e.clientY});if(PT.size<2||!pinch)return;const[a,b]=[...PT.values()],d=Math.hypot(a.x-b.x,a.y-b.y),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;dragged=true;
 panBy(pinch.cx,pinch.cy,cx,cy);if(pinch.d>10&&d>10)zoomAt(cx,cy,pinch.d/d);pinch={d,cx,cy};});cv.addEventListener('pointerup',pu);cv.addEventListener('pointercancel',pu);cv.addEventListener('contextmenu',e=>e.preventDefault());
// ---------- API für ui.js ----------
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();const toScreen=v=>{const q=v.clone().project(cam),r=cv.getBoundingClientRect();return[r.left+(q.x+1)/2*r.width,r.top+(1-q.y)/2*r.height];};
let lastT=performance.now();
// Idle-Animationen der Lichtschmiede-Türme (Code, keine Skelett-Anim.)
const IDC={m_bogen:[0xffc060,.95,.55,3.1,.18],m_kanone:[0xffd27a,.85,.7,1.3,.22],m_wacht:[0x6ab8ff,1.12,.6,4.2,.3],m_kapelle:[0xff8a2a,.72,.75,0,.35]};
function IDLE(o,t,now){const c=IDC[t.type];if(!c)return;const u=o.userData,b=u.base||1;
 if(!u.ig){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:DZ.RT,color:c[0],blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));s.position.y=c[1]/b;u.ig=s;o.add(s);}
 const s=u.ig;let k;if(t.type==='m_kapelle')k=.75+.25*Math.sin(now*11+t.id)*Math.sin(now*7.3)+.1*Math.sin(now*23);else k=.75+.25*Math.sin(now*c[3]+t.id);
 s.material.opacity=Math.max(0,k)*(QC.detail?.9:.6);s.scale.setScalar(c[2]*(1+c[4]*(k-.75))/b);
 if(t.type==='m_kanone'){o.rotation.z=Math.sin(now*1.3+t.id)*.035;o.rotation.x=Math.cos(now*1.1+t.id)*.02;}
 if(t.type==='m_wacht'&&QC.detail)s.material.rotation=now*.6;}
// ===== Design-Pass: Lichtgeister, Kontakt-AO, Kamera-Wackeln =====
const DZ=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.35,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
 const RT=new THREE.CanvasTexture(c);RT.colorSpace=THREE.SRGBColorSpace;
 // Flügel-Textur (Schmetterling)
 const w=document.createElement('canvas');w.width=w.height=64;const y=w.getContext('2d');const wg=y.createRadialGradient(20,30,2,26,32,30);wg.addColorStop(0,'#fff');wg.addColorStop(.5,'rgba(255,220,120,.8)');wg.addColorStop(1,'rgba(255,180,40,0)');y.fillStyle=wg;y.beginPath();y.ellipse(30,24,26,18,-.5,0,7);y.fill();y.beginPath();y.ellipse(26,46,16,12,.4,0,7);y.fill();
 const WT=new THREE.CanvasTexture(w);WT.colorSpace=THREE.SRGBColorSpace;
 const wingG=new THREE.PlaneGeometry(.48,.48).translate(.24,0,0),wingM=new THREE.MeshBasicMaterial({map:WT,color:0xffd77a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide});
 const glowM=new THREE.SpriteMaterial({map:RT,color:0xffc850,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
 const pool=[],live=[];
 function spirit(v){const max=QC.detail?28:8;if(live.length>=max)return;let s=pool.pop();
  if(!s){const g=new THREE.Group(),m=wingM.clone(),l=new THREE.Mesh(wingG,m),r=new THREE.Mesh(wingG,m);r.scale.x=-1;const gl=new THREE.Sprite(glowM.clone());gl.scale.setScalar(.45);g.add(l,r,gl);g.userData={l,r,gl,m};s=g;}
  s.position.copy(v).setY(.45);s.userData.t=0;s.userData.ph=Math.random()*6;s.userData.dir=Math.random()*6.28;s.visible=true;scene.add(s);live.push(s);}
 function tick(dt,now){for(let i=live.length-1;i>=0;i--){const s=live[i],u=s.userData;u.t+=dt;const f=u.t/1.9;if(f>=1){scene.remove(s);live.splice(i,1);pool.push(s);continue;}
  u.dir+=dt*1.6;s.position.y+=dt*(1.1+f*.8);s.position.x+=Math.cos(u.dir)*dt*.5;s.position.z+=Math.sin(u.dir)*dt*.5;s.rotation.y=-u.dir;
  const fl=Math.sin(now*22+u.ph);u.l.rotation.y=.25+fl*.9;u.r.rotation.y=-.25-fl*.9;const op=f<.15?f/.15:1-(f-.15)/.85;u.m.opacity=op;u.gl.material.opacity=op*.8;s.scale.setScalar(.8+f*.4);}}
 // Kontakt-AO (weicher dunkler Fleck unter Türmen/Kreaturen)
 const aoM=new THREE.MeshBasicMaterial({map:RT,color:0x000000,transparent:true,opacity:.42,depthWrite:false}),aoG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
 const ao=(o,s)=>{if(!QC.detail||o.userData.ao)return;const m=new THREE.Mesh(aoG,aoM);m.scale.set(s,1,s);m.position.y=.03;m.renderOrder=-1;o.add(m);o.userData.ao=m;};
 let shk=0;return{RT,spirit,tick,ao,shake(a){if(QC.detail||a>.2)shk=Math.max(shk,a);},cam(dt,on){if(shk<=0)return null;shk=Math.max(0,shk-dt*1.8);if(!on)return null;const a=shk*shk*.25;return[(Math.random()-.5)*a,(Math.random()-.5)*a];}};})();
const R3D={onLane:null,lockPan:false,goLane(i){ZM=1;ZO.x=ZO.z=0;camTX=laneCX(i);if(i!==camLane){camLane=i;R3D.onLane&&R3D.onLane(i);}},
 dbg(cx,cy){const r=cv.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);const h=ray.intersectObjects(lanes.flatMap(L=>[L.mhit,L.shit,L.hitPlane]),false);return h.map(x=>[x.object.userData,x.point.x.toFixed(2),x.point.z.toFixed(2)]);},
 zoom(cx,cy,f){zoomAt(cx,cy,f);},consumeDrag(){const d=dragged;dragged=false;return d;},
 resize(w,h){if(!w||!h)return;VH=h;renderer.setSize(w,h,true);composer.setSize(w,h);tilt.uniforms.px.value.set(1/w,1/h);aspect=w/h;cam.aspect=aspect;cam.fov=aspect<.8?46:38;cam.updateProjectionMatrix();if(R3D._wh!==w+'x'+h){R3D._wh=w+'x'+h;fitDist();}placeCam(camX);},
 pick(cx,cy){const r=cv.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,cam);
  const hits=ray.intersectObjects(lanes.flatMap(L=>[L.mhit,L.shit,L.hitPlane]),false);if(!hits.length)return null;const h=hits[0],u=h.object.userData;
  if(u.mine)return{mine:u.pi};if(u.schrein)return{schrein:u.pi};const fx=h.point.x-u.pi*LGAP,fy=h.point.z,x=Math.floor(fx),y=Math.floor(fy);if(x<0||y<0||x>=COLS||y>=ROWS)return null;return{pi:u.pi,x,y,fx,fy};},
 cellScreen(x,y){return toScreen(W(camLane,x+.5,y+.5,.06));},
 depot(){return toScreen(lanes[0].depot.getWorldPosition(new THREE.Vector3()));},
 project(pi,x,y){return toScreen(W(pi,x,y,.4));},
 render(S,U){{const cw=cv.parentElement;if(cw&&(cw.clientWidth!==this._w||cw.clientHeight!==this._h)){this._w=cw.clientWidth;this._h=cw.clientHeight;cv.style.width=cv.style.height='0px';const w=cw.clientWidth,h=cw.clientHeight;this.resize(w,h);this._w=w;this._h=h;}}const now=S.t,tn=performance.now(),rdt=Math.min(.05,(tn-lastT)/1000);lastT=tn;
  if(U.view!==camLane&&!drag){camLane=U.view;camTX=laneCX(camLane);}
  if(!drag){camX+=(camTX-camX)*Math.min(1,rdt*6);}placeCam(camX);
  S.lanes.forEach((ln,pi)=>{const L=lanes[pi];
   const pk=ln.path.map(p=>p.join(',')).join(';');if(pk!==L.pathKey){L.pathKey=pk;paintTiles(L,ln.path);}if(!!(U&&U.sel)!==!!L.gridOn)paintTiles(L,null,!!(U&&U.sel));
   const mk2=ln.mine.w+'|'+ln.mine.lvl;if(mk2!==L.mk){L.mk=mk2;L.mlab.userData.set(`⛏${ln.mine.w}  ${ln.mine.gps.toFixed(1)}/s`);}
   const rn=Object.values(ln.runes||{}).reduce((a,b)=>a+b,0);if(rn!==L.sk){L.sk=rn;L.slab.userData.set(rn?`Schrein ✦${rn}`:'Schrein');}
   L.portal.rotation.z=now*2;L.orb.rotation.y=now*1.5;L.orb.position.y=.85+Math.sin(now*2)*.08;
   L.nug.forEach((n,i)=>n.visible=i<1+ln.mine.lvl*2);
   // Arbeiter: tragen Goldsack vom Stollen zum Depot
   while(L.workers.length<ln.mine.w){const w=new THREE.Group();mk(new THREE.BoxGeometry(.16,.22,.12),M([0x4a6fa5,0xa54a4a,0x4aa55a][L.workers.length%3]),.11,w);mk(new THREE.SphereGeometry(.08,6,4),M(0xe8c9a0),.3,w);
    w.userData.sack=mk(new THREE.SphereGeometry(.08,6,4),ME(0xffd23a,0x664400),.24,w);w.userData.sack.position.z=-.1;L.mine.add(w);L.workers.push(w);}
   L.workers.forEach((w,i)=>{w.visible=i<ln.mine.w;const ph=ln.mine.ph[i]??0,tt=ph<.5?ph*2:2-ph*2;w.position.set(-.3+(i%3)*.2,Math.abs(Math.sin(now*10+i))*.04,1.15+tt*.85);w.rotation.y=ph<.5?0:Math.PI;w.userData.sack.visible=ph<.5;});
   // Türme
   const seen=new Set();for(const t of ln.towers){seen.add(t.id);const key=[t.type,t.lv,t.up.join(),t.camo,t.off,t.el?t.el.n+t.el.lv:''].join('|');let o=L.towers.get(t.id);
    if(!o||o.userData.key!==key){const isNew=!o;if(o)L.grp.remove(o);o=buildTower(t);o.userData.key=key;o.userData.base=o.scale.x;o.position.copy(W(pi,t.x+.5,t.y+.5,.06));L.grp.add(o);L.towers.set(t.id,o);if(!t.wall)DZ.ao(o,1.25/(o.scale.x||1));if(!isNew)burst(o.position.clone().setY(.8),0xffd23a,14);}
    const ab=now-(t.born??-9),au=now-(t.upT??-9);let sc=1;if(ab<.25)sc=ab<.17?Math.max(.05,ab/.17*1.15):1.15-(ab-.17)/.08*.15;if(au<.3)sc*=1+.2*Math.sin(au/.3*Math.PI);o.scale.setScalar(o.userData.base*sc);
    IDLE(o,t,now);const u=o.userData;if(u.aim&&t.ang!=null)u.head.rotation.y=Math.atan2(Math.cos(t.ang),Math.sin(t.ang));if(u.spin)u.spin.rotation.y=now*2;if(u.bob)u.bob.position.y=.85+Math.sin(now*4+t.id)*.06;if(u.rune)u.rune.rotation.z=now;if(u.crown)u.crown.rotation.z=now*.8;if(u.pulse){const k=(now*.7+t.id*.13)%1;u.pulse.scale.setScalar(1+k*3);u.pulse.material.opacity=.5*(1-k);}if(u.gear)u.gear.rotation.z=now*3;if(u.anvil)u.anvil.position.y=.86+Math.sin(tn/600+t.id)*.05;if(u.flame){const f=1+Math.sin(tn/70+t.id)*.12;u.flame.scale.set(1,f,1);}if(u.halo){u.halo.rotation.z=tn/1500;u.halo.position.y=2+Math.sin(tn/1000)*.06;}if(u.cloth)u.cloth.rotation.y=Math.sin(tn/400+t.id)*.35;if(u.glow)u.glow.material.color.setScalar(.7+.3*Math.sin(now*8));}
   // Held
   if(ln.hero){const H=ln.hero;if(!L.hero||L.hero.userData.c.split('#')[0]!==H.c||(MESHY[HMOD[H.n]]&&!L.hero.userData.c.includes('#'))){if(L.hero)L.grp.remove(L.hero);L.hero=buildHero(H);L.grp.add(L.hero);}const o=L.hero,np=W(pi,H.x,H.y,0);o.position.copy(np);o.position.y=H.moving?Math.abs(Math.sin(now*12))*.08:Math.sin(now*2.1)*.035+.035;o.userData.sword.rotation.x=-.5+Math.max(0,Math.sin(now*14))*(H.moving?0:.8);{const ta=Math.atan2(Math.cos(H.ang),Math.sin(H.ang));let d=ta-o.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));o.rotation.y+=d*Math.min(1,rdt*6);}if(o.userData.lv!==H.lvl){o.userData.lv=H.lvl;o.userData.tag.userData.set('★'+H.lvl);o.scale.setScalar(1+H.lvl*.03);}}
   for(const[id,o]of L.towers)if(!seen.has(id)){L.grp.remove(o);L.towers.delete(id);}
   // Kreaturen
   const cs=new Set();for(const c of ln.creeps){cs.add(c.id);let o=L.creeps.get(c.id);if(!o){o=buildCreep(c);L.grp.add(o);L.creeps.set(c.id,o);}
    o.userData.ly=c.y;o.userData.boss=c.boss;if(!c.fly)DZ.ao(o,c.boss?1.1:.7);
    const p=W(pi,c.x,c.y,c.fly?1.2+Math.sin(now*4+c.id)*.08:0),prev=o.position.clone();o.position.copy(p);const dx=p.x-prev.x,dz=p.z-prev.z;if(Math.abs(dx)+Math.abs(dz)>1e-4)o.rotation.y=Math.atan2(dx,dz);
    const b=o.userData.body,hit=now-c.hitT<.07;b.material=hit?M(0xffffff):c.slow?ME(o.userData.col,0x1a4a6a):c.dot?ME(o.userData.col,0x2a5a00):M(o.userData.col);
    if(o.userData.mdl){const md=o.userData.mdl,sp=c.type==='flitzer'?13:c.type==='panzer'?6:9;const ph=Math.sin(now*sp+c.id),q=Math.abs(ph);md.position.y=q*.05;md.rotation.z=ph*.06;md.rotation.x=.06+q*.05;const s0=md.userData.s0*(hit?1.12:1);md.scale.set(s0*(1+(1-q)*.05),s0*(1-(1-q)*.07),s0*(1+(1-q)*.03));}
    if(o.userData.wing)o.userData.wing.rotation.z=Math.sin(now*14)*.35;b.scale.y=now-c.hitT<.12?.8:1;
    const hb=o.userData.hb;hb.visible=c.hp<c.max;if(hb.visible){hb.quaternion.copy(o.quaternion).invert().multiply(cam.quaternion);const f=Math.max(0,c.hp/c.max);o.userData.fg.scale.x=f;o.userData.fg.position.x=-(1-f)*.3;o.userData.fg.material.color.setHSL(f*.33,1,.5);}}
   for(const[id,o]of L.creeps)if(!cs.has(id)){const lk=(o.userData.ly||0)>ROWS-1.3;if(lk){burst(o.position.clone().setY(.4),o.userData.col,10);if(pi===0)DZ.shake(o.userData.boss?1:.45);}else{burst(o.position.clone().setY(.5),0xffd23a,QC.detail?14:6,2);DZ.spirit(o.position);if(o.userData.boss)DZ.shake(.7);}L.grp.remove(o);L.creeps.delete(id);}
   // Projektile (Pool)
   {const OP=ln.proj.filter(p=>!['m_bogen','m_kanone','m_wacht','m_ballista'].includes(p.type));   while(L.proj.length<OP.length){const m=new THREE.Mesh(projGeo.def,new THREE.MeshBasicMaterial());m.castShadow=true;L.grp.add(m);L.proj.push(m);}
   L.proj.forEach((m,i)=>{const p=OP[i];m.visible=!!p;if(!p)return;const np=W(pi,p.x,p.y,.8),d=np.clone().sub(m.position);m.position.copy(np);m.geometry=projGeo[p.type]||projGeo.def;
    m.material.color.set(p.type==='kanone'?0x222222:p.type==='pfeil'?0x5a3a1a:p.color||0xffffff);if(d.lengthSq()>1e-6)m.rotation.y=Math.atan2(d.x,d.z);});}
   VFX.lane(L,ln,pi,rdt,now);});
  VFX.tick(rdt);
  // Effekte
  for(const o of fxObjs)scene.remove(o);fxObjs=[];
  S.lanes.forEach((ln,pi)=>{for(const f of ln.fx){let o=null;
   if(f.k==='bolt'){const pts=[W(pi,f.a.x,f.a.y,1)];for(let i=1;i<4;i++)pts.push(W(pi,f.a.x+(f.b.x-f.a.x)*i/4+(Math.random()-.5)*.3,f.a.y+(f.b.y-f.a.y)*i/4+(Math.random()-.5)*.3,.8+Math.random()*.3));pts.push(W(pi,f.b.x,f.b.y,.4));if(f.ty==='o_schamane')VFX.chain(pts[0],pts[pts.length-1],f.t>.12);
    o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:f.c||'#fff35c'}));}
   else if(f.k==='boom'){o=new THREE.Sprite(new THREE.SpriteMaterial({map:DZ.RT,color:0xff9a3c,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:Math.min(.55,f.t*1.6)}));o.scale.setScalar(f.r*1.6*(1.2-f.t*1.5)+.1);o.position.copy(W(pi,f.x,f.y,.3));}
   else if(f.k==='burst'){o=new THREE.Sprite(new THREE.SpriteMaterial({map:DZ.RT,color:0xffd77a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:Math.min(.7,f.t*1.4)}));o.scale.setScalar(f.r*1.1*(1.3-f.t)+.1);o.position.copy(W(pi,f.x,f.y,.5));if(f.t>.45)burst(W(pi,f.x,f.y,.5),0xF2B233,4,2.5);}
   else if(f.k==='spark'&&Math.random()<.5)burst(W(pi,f.x,f.y,.5),f.c||0xffffff,2,1.5);
   if(o){scene.add(o);fxObjs.push(o);}}});
  for(let i=0;i<PMAX;i++){const p=P[i];if(p.life>0){p.life-=rdt;p.vy-=9*rdt;p.x+=p.vx*rdt;p.y=Math.max(.05,p.y+p.vy*rdt);p.z+=p.vz*rdt;dm.position.set(p.x,p.y,p.z);dm.scale.setScalar(Math.max(0,p.life*2));}else dm.scale.setScalar(0);dm.updateMatrix();parts.setMatrixAt(i,dm.matrix);}
  parts.instanceMatrix.needsUpdate=true;dm.scale.setScalar(1);
  // Linien-Vorschau (Ziehen zum Bauen)
  const LN=U.line||[];while(linePool.length<LN.length){const m=pvTile.clone();m.material=pvTile.material.clone();scene.add(m);linePool.push(m);}
  linePool.forEach((m,i)=>{const q=LN[i];m.visible=!!q;if(q){m.position.copy(W(0,q.x+.5,q.y+.5,.1));m.material.color.set(q.ok?0x5CE07A:0xFF4D5E);}});
  // Auswahl / Vorschau
  selRing.visible=false;if(U.selId!=null){const t=S.lanes[0].towers.find(t=>t.id===U.selId);if(t){selRing.visible=true;selRing.scale.set(t.rng,t.rng,1);selRing.position.copy(W(0,t.x+.5,t.y+.5,.1));}}
  pvTile.visible=!!U.pv&&!LN.length;pvRing.visible=false;if(U.pv){pvTile.position.copy(W(0,U.pv.x+.5,U.pv.y+.5,.1));pvTile.material.color.set(U.pvOk?0x5CE07A:0xFF4D5E);if(U.pvRng>0){pvRing.visible=true;pvRing.scale.set(U.pvRng,U.pvRng,1);pvRing.position.copy(W(0,U.pv.x+.5,U.pv.y+.5,.11));}}
  // Event-Stimmung (Himmel) & Leak-Blitz
  tc.copy(SKY);if(S.evt)tc.lerp(new THREE.Color({blutmond:0x8a2020,frost:0xbfe8ff,goldrausch:0xffe080,turbo:0xb0b0b0,rabatt:0xc0a0ff,boost:0xa0ffa0}[S.evt.k]||0x8fd3f5),.5);
  const lk=S.lanes[0].fx.find(f=>f.k==='leak');if(lk)tc.lerp(new THREE.Color(0xff3040),Math.min(.6,lk.t*1.5));{const ls=S.lanes[0].fx.find(f=>f.k==='pulse'&&f.c==='gold');if(ls)tc.lerp(new THREE.Color(0xffd75a),Math.min(.5,ls.t*.8));}scene.background.copy(tc);scene.fog.color.copy(tc);
  streamMat.uniforms.t.value=tn/1000;if(R3Dfx.abM)R3Dfx.abM.uniforms.t.value=tn/1000;if(R3Dfx.wf)R3Dfx.wf.uniforms.t.value=tn/1000;for(const c of R3Dfx.clouds||[])c.position.x+=rdt*.35*(c.position.y<-20?1.4:1),c.position.x>60&&(c.position.x=-40);{// Weg nur als kurze, schwache Vorschau beim Bauen/Mauern (blendet nach ~1,5 s aus)
   const since=lanes[0].fadeT?(tn-lanes[0].fadeT)/1000:9,tgt=U&&U.sel?.38:since<1.5?.38*(1-since/1.5):0;R3Dfx.pf=(R3Dfx.pf||0)+(tgt-(R3Dfx.pf||0))*Math.min(1,rdt*8);streamMat.uniforms.fade.value=R3Dfx.pf;for(const L of lanes)L.stream.visible=R3Dfx.pf>.01;}{const n=S.lanes[0].creeps.length;streamMat.uniforms.danger.value+=(Math.min(1,Math.max(0,(n-6)/14))-streamMat.uniforms.danger.value)*Math.min(1,rdt*2);}
  {const pa=amb.geometry.attributes.position,sp=amb.userData.sp;for(let i=0;i<sp.length;i++){let y=pa.array[i*3+1]+sp[i]*rdt*.5;if(y>4.5)y=0;pa.array[i*3+1]=y;pa.array[i*3]+=Math.sin(tn/1300+i)*rdt*.08;}pa.needsUpdate=true;}
  DZ.tick(rdt,tn/1000);const sk=DZ.cam(rdt,true);if(sk){cam.position.x+=sk[0];cam.position.y+=sk[1];}
  if(QC.bloom)composer.render();else renderer.render(scene,cam);if(sk){cam.position.x-=sk[0];cam.position.y-=sk[1];}
  this._fc=(this._fc||0)+1;if(!this._ft)this._ft=tn;if(tn-this._ft>4000){this.fps=this._fc*1000/(tn-this._ft);this._fc=0;this._ft=tn;if(Q==='ultra'&&!localStorage.getItem('ltw_q')&&this.fps<38&&!this._lowered&&!navigator.webdriver){this._lowered=1;this.setQuality('low',false);}}},
 setQuality(q,save=true){if(!QP[q])return;Q=q;QC=QP[q];bloom.strength=QC.detail?.85:.45;bloom.threshold=QC.detail?.82:.95;if(save)localStorage.setItem('ltw_q',q);renderer.setPixelRatio(QC.pr);composer.setPixelRatio(QC.pr);tilt.enabled=!!QC.detail;sun.shadow.mapSize.set(QC.sh,QC.sh);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
  if(this._w)this.resize(this._w,this._h);const b=document.getElementById('bQ');if(b)b.textContent=QC.n;},
 get quality(){return Q;}};
{const b=document.getElementById('bQ');if(b){b.textContent=QC.n;b.title='Grafikqualität (Ultra/Leicht)';b.onclick=()=>R3D.setQuality(Q==='ultra'?'low':'ultra');}}
// ---------- Meshy-GLB-Hook: assets/meshy/manifest.json {"m_bogen":"turm_laterne.glb", ...}; geladene Modelle ersetzen Platzhalter ----------
const MESHY={};
const fitBox=(o,sx,sy,sz)=>{const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());const w=new THREE.Group();o.position.sub(c);w.add(o);w.scale.set(sx/s.x,sy/s.y,sz/s.z);return w;};
const deco=(o,e)=>{if(o.userData.deco)return;o.userData.deco=1;if(e.main)for(let pi=0;pi<2;pi++){const w=new THREE.Group();w.add(o.clone());w.scale.setScalar(e.main[2]);w.position.copy(W(pi,e.main[0],e.main[1],0));w.rotation.y=.6;scene.add(w);}if(!QC.detail)return;for(const I of ISLG){if(!I.side)continue;const w=new THREE.Group();w.add(o.clone());w.scale.setScalar(e.scale||2);w.position.set((e.x||0)*(I.G.position.x<0?-1:1),-.21,Math.max(-I.d/2+1.5,Math.min(I.d/2-1.5,e.z||0)));w.rotation.y=(I.G.position.x<0?1:-1)*(Math.PI/2+(e.z>0?.5:-.4));I.G.add(w);}};
const SPECIAL={land_a:deco,land_b:deco,land_c:deco,
 tor(o,e){const s=new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3()),f=(e.width||8)/s.x;for(const g of GATES){for(const c of g.children)if(c.isMesh)c.visible=false;const w=new THREE.Group();w.add(o.clone());w.scale.setScalar(f);g.add(w);}},
 klippe(o,e){if(!QC.detail)return;for(const I of ISLG){if(I.side)continue;const m=fitBox(o.clone(),I.w*1.02,e.depth||9,I.d*1.02);m.position.y=-.72-(e.depth||9)/2+.3;I.G.add(m);}},
 monument(o,e){if(!QC.detail)return;for(const I of ISLG){if(!I.side)continue;const w=new THREE.Group();w.add(o.clone());w.scale.setScalar(e.scale||4);w.position.set(0,-.21,-1);w.rotation.y=I.G.position.x<0?Math.PI/2:-Math.PI/2;I.G.add(w);}}};R3D.meshy=MESHY;
fetch('assets/meshy/manifest.json').then(r=>r.ok?r.json():null).then(mf=>{if(!mf)return;const ld=new GLTFLoader();let _env=null;const ENVT=()=>_env||(_env=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture);for(const[k,f]of Object.entries(mf)){if(k.startsWith('_'))continue;const e=typeof f==='string'?{file:f}:f;
 ld.load('assets/meshy/'+e.file,gl=>{const o=gl.scene;o.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;{const mm=m.material;if(mm&&mm.isMeshStandardMaterial){if(mm.map){mm.map.colorSpace=THREE.SRGBColorSpace;mm.emissiveMap=mm.map;mm.emissive=new THREE.Color(0xffffff);mm.emissiveIntensity=.15;}mm.envMap=ENVT();mm.envMapIntensity=.9;mm.needsUpdate=true;}}if(e.color)m.material=new THREE.MeshStandardMaterial({color:e.color,roughness:.75,metalness:.15});}});const b=new THREE.Box3().setFromObject(o),sz=b.getSize(new THREE.Vector3());const sc=(e.height||1.6)/Math.max(.001,sz.y);o.scale.setScalar(sc);o.position.y=-b.min.y*sc;{const c=b.getCenter(new THREE.Vector3());o.position.x=-c.x*sc;o.position.z=-c.z*sc;}if(e.rotY)o.rotation.y=e.rotY;MESHY[k]=o;SPECIAL[k]&&SPECIAL[k](o,e);
  for(const L of lanes)for(const t of L.towers.values())t.userData.key='';if(k==='schrein'||k==='goldmine')for(const L of lanes){const G=k==='schrein'?L.shr:L.mine;if(G.userData.meshy)continue;G.userData.meshy=1;for(const c of G.children)if(c.isMesh&&c!==L.shit&&c!==L.mhit)c.visible=false;const m=o.clone();if(e.pos)m.position.add(new THREE.Vector3(...e.pos));G.add(m);}},undefined,err=>console.warn('Meshy-Modell fehlt',e.file,err));}}).catch(()=>{});
window.R3D=R3D;
const s=document.createElement('script');s.src='ui.js?v=19';document.body.appendChild(s);
