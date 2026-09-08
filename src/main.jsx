import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Activity, ArrowRight, BarChart3, Bell, Box, Boxes, CheckCircle2, ChevronDown,
  CircleDollarSign, Clock3, Factory, Globe2, Leaf, Layers3, MapPin, Menu,
  MessageCircle, Package, Play, Quote, Recycle, Search, Send, ShieldCheck,
  Sparkles, TestTube2, Truck, X, Plus, Minus, RotateCw, PackageCheck
} from 'lucide-react';
import earthTextureUrl from './assets/earth-blue-marble.jpg';
import earthBumpUrl from './assets/earth-bump.jpg';
import './styles.css';

const NAV = [
  ['home','Home',Leaf],['optimizer','Optimizer',Sparkles],['logistics','Logistics',Globe2],
  ['materials','Materials',Boxes],['simulator','Simulator',TestTube2],['impact','Impact',Leaf],
  ['quotes','Quotes',Quote],['statistics','Statistics',BarChart3],['reuse','Reuse & Recycle',Recycle],
  ['feedback','Feedback',MessageCircle]
];

const materials = [
  {name:'Molded Pulp', cost:21, carbon:20, protection:97, recycle:94, badge:'Best balance', desc:'Excellent fit for fragile products with low material footprint.'},
  {name:'Recycled Cardboard', cost:15, carbon:28, protection:93, recycle:91, badge:'Best value', desc:'Affordable, familiar and highly recyclable for general shipping.'},
  {name:'Virgin Cardboard', cost:18, carbon:42, protection:96, recycle:76, badge:'Premium print', desc:'Strong visual finish when branding quality matters most.'},
  {name:'Bio-based Film', cost:24, carbon:31, protection:95, recycle:72, badge:'Flexible', desc:'Useful for moisture protection and lightweight product formats.'}
];

const TYPE_META = {
  manufacturer: {label:'Manufacturers', singular:'Manufacturer', color:'#8dff67', Icon:Factory},
  material: {label:'Materials available', singular:'Material', color:'#58cfff', Icon:Leaf},
  product: {label:'Products available', singular:'Product', color:'#ffb15b', Icon:Box}
};

const SUPPLY_POINTS = [
  {id:'greenwrap',type:'manufacturer',name:'GreenWrap Co.',city:'Portland, USA',lat:45.52,lon:-122.68,detail:'Molded pulp & recycled corrugate',availability:'18 material lines',lead:'4–6 days'},
  {id:'ecoform',type:'manufacturer',name:'EcoForm India',city:'Pune, India',lat:18.52,lon:73.86,detail:'Fiber trays & protective inserts',availability:'12 production lines',lead:'1–2 days'},
  {id:'nordic',type:'manufacturer',name:'Nordic Pulp Labs',city:'Helsinki, Finland',lat:60.17,lon:24.94,detail:'High-performance molded fiber',availability:'9 material lines',lead:'7–9 days'},
  {id:'terra',type:'manufacturer',name:'TerraPack Brasil',city:'São Paulo, Brazil',lat:-23.55,lon:-46.63,detail:'Recycled board manufacturing',availability:'15 material lines',lead:'8–11 days'},
  {id:'bamboo',type:'material',name:'Bamboo Fiber',city:'Quito, Ecuador',lat:-0.18,lon:-78.47,detail:'Strong renewable cushioning fiber',availability:'42 t available',lead:'Ready to source'},
  {id:'mycelium',type:'material',name:'Mycelium Foam',city:'Berlin, Germany',lat:52.52,lon:13.41,detail:'Home-compostable protective foam',availability:'8.2 t available',lead:'3–5 days'},
  {id:'bagasse',type:'material',name:'Bagasse Pulp',city:'Bangkok, Thailand',lat:13.75,lon:100.50,detail:'Agricultural-waste molded pulp',availability:'63 t available',lead:'2–4 days'},
  {id:'kraft',type:'material',name:'Recycled Kraft',city:'Toronto, Canada',lat:43.65,lon:-79.38,detail:'FSC recycled kraft board',availability:'112 t available',lead:'4–7 days'},
  {id:'ecobox',type:'product',name:'EcoBox Series',city:'Shanghai, China',lat:31.23,lon:121.47,detail:'Recyclable food & retail boxes',availability:'2,400 units',lead:'Available now'},
  {id:'bottleguard',type:'product',name:'BottleGuard',city:'Mumbai, India',lat:19.08,lon:72.88,detail:'Fiber insert for glass bottles',availability:'6,800 units',lead:'Available now'},
  {id:'mailer',type:'product',name:'Mailer Pro',city:'Chicago, USA',lat:41.88,lon:-87.63,detail:'Return-ready recycled mailer',availability:'3,100 units',lead:'Available now'},
  {id:'freshtray',type:'product',name:'FreshTray',city:'Amsterdam, Netherlands',lat:52.37,lon:4.90,detail:'Compostable produce tray',availability:'5,500 units',lead:'2 days'}
];

function scoreMaterial(m, priority, fragility) {
  const weights = priority === 'Cost' ? [.45,.15,.25,.15] : priority === 'Carbon' ? [.15,.45,.25,.15] : priority === 'Protection' ? [.12,.13,.55,.2] : [.25,.25,.3,.2];
  const costScore = 100 - ((m.cost - 15) / 9) * 100;
  const carbonScore = 100 - ((m.carbon - 20) / 22) * 100;
  let protection = m.protection;
  if (fragility === 'High' && protection < 95) protection -= 8;
  return Math.max(0, Math.round(costScore*weights[0] + carbonScore*weights[1] + protection*weights[2] + m.recycle*weights[3]));
}

function App(){
  const [page,setPage] = useState('home');
  const [mobile,setMobile] = useState(false);
  const [assistant,setAssistant] = useState(false);
  return <div className="appShell">
    <Sidebar page={page} setPage={(p)=>{setPage(p);setMobile(false)}} mobile={mobile}/>
    <div className="contentShell">
      <Topbar onMenu={()=>setMobile(!mobile)} onAssistant={()=>setAssistant(true)} />
      <main>
        {page==='home' && <Home go={setPage}/>} 
        {page==='optimizer' && <Optimizer/>}
        {page==='logistics' && <Logistics/>}
        {page==='materials' && <Materials/>}
        {page==='simulator' && <Simulator/>}
        {page==='impact' && <Impact/>}
        {page==='quotes' && <Quotes/>}
        {page==='statistics' && <Statistics/>}
        {page==='reuse' && <Reuse/>}
        {page==='feedback' && <Feedback/>}
      </main>
    </div>
    {mobile && <button className="mobileBackdrop" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}
    {assistant && <Assistant close={()=>setAssistant(false)}/>} 
  </div>
}

function BrandMark(){
  return <span className="brandMark" aria-hidden="true">
    <svg viewBox="0 0 64 64" role="img">
      <defs><linearGradient id="ecoLeafGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c7ff83"/><stop offset="1" stopColor="#49e9a9"/></linearGradient></defs>
      <circle cx="32" cy="32" r="26" className="brandOrbit"/>
      <path className="brandLeafA" fill="url(#ecoLeafGrad)" d="M18 36c2-14 13-23 29-25-1 16-9 29-24 31-4 .5-6-2-5-6Z"/>
      <path className="brandLeafB" d="M23 42c5-10 11-17 21-24"/>
      <path className="brandOrbitArc" d="M10 36c8 10 21 15 34 10 5-2 9-5 12-9"/>
      <circle cx="54" cy="35" r="3.2" className="brandNode"/>
    </svg>
  </span>
}

function Sidebar({page,setPage,mobile}){
  return <aside className={'sidebar '+(mobile?'open':'')}>
    <button className="brand" onClick={()=>setPage('home')}>
      <BrandMark/>
      <span><strong>EcoPack</strong><small>Packaging intelligence network</small></span>
    </button>
    <nav>{NAV.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon/><span>{label}</span>{id==='optimizer'&&<em>AI</em>}</button>)}</nav>
    <div className="sideImpact"><Leaf/><b>Smaller footprints.<br/>Smarter supply.</b><p>See materials, makers and products before you decide.</p></div>
    <div className="profile"><span>S</span><div><b>Student</b><small>student@ecopack.com</small></div></div>
  </aside>
}

function Topbar({onMenu,onAssistant}){
  return <header className="topbar">
    <button className="menuBtn" onClick={onMenu}><Menu/></button>
    <div className="search"><Search/><input placeholder="Search materials, manufacturers, or products..."/><kbd>⌘ K</kbd></div>
    <div className="topActions"><button className="iconOnly"><Bell/></button><button className="askBtn" onClick={onAssistant}><Sparkles/> Ask Eco AI</button><button className="avatar">S</button><ChevronDown className="chev"/></div>
  </header>
}

function Home({go}){
  return <div className="page homePage homeV3">
    <section className="supplyHero">
      <div className="heroCopy supplyCopy">
        <div className="miniTag"><span/> GLOBAL SUPPLY · LIVE AVAILABILITY · LOWER IMPACT</div>
        <h1>A cleaner,<br/>more connected<br/><em>tomorrow.</em></h1>
        <p>Explore sustainable packaging manufacturers, materials and ready-to-source products on one interactive global network.</p>
        <div className="networkNumbers">
          <div><b>500+</b><span>Manufacturers</span></div>
          <div><b>1,200+</b><span>Materials</span></div>
          <div><b>2,500+</b><span>Products</span></div>
        </div>
        <div className="heroButtons"><button className="primary" onClick={()=>document.querySelector('.globeCanvas')?.scrollIntoView({behavior:'smooth',block:'center'})}>Explore the Globe <ArrowRight/></button><button className="secondary" onClick={()=>go('optimizer')}><Sparkles/> Start Optimizing</button></div>
        <div className="trustLine"><Leaf/> Real locations. Clear availability. Better packaging decisions.</div>
      </div>
      <SupplyGlobe/>
      <SupplySummary go={go}/>
    </section>

    <section className="featureRow premiumFeatures">
      <Feature icon={Quote} title="Get a Quote" desc="Instant pricing for sustainable packaging solutions." action="Get Quote" onClick={()=>go('quotes')} visual="quote"/>
      <Feature icon={BarChart3} title="View Statistics" desc="Track environmental, sourcing and cost impact." action="View Stats" onClick={()=>go('statistics')} visual="stats" badge="↓ 32% CO₂"/>
      <Feature icon={Box} title="Optimization" desc="Find the best packaging and supplier match." action="Start Optimizing" onClick={()=>go('optimizer')} visual="optimize"/>
      <Feature icon={Leaf} title="Explore Materials" desc="Compare eco-friendly materials and availability." action="Browse Materials" onClick={()=>go('materials')} visual="materials"/>
    </section>

    <section className="footerMotto"><Leaf/><span>Sustainable packaging isn't just a choice — it's a smarter supply decision.</span><b>A cleaner planet ships further.</b></section>
  </div>
}

function Feature({icon:Icon,title,desc,action,onClick,visual,badge}){
  return <button className="featureCard premiumFeature" onClick={onClick}>
    <span className="featureIcon"><Icon/></span>
    {badge && <span className="featureBadge">{badge}</span>}
    <div className={'featureArt '+visual} aria-hidden="true">
      {visual==='quote' && <><i/><i/><i/></>}
      {visual==='stats' && <><i/><i/><i/><i/></>}
      {visual==='optimize' && <><i/><i/><i/></>}
      {visual==='materials' && <><i/><i/><i/></>}
    </div>
    <div><h3>{title}</h3><p>{desc}</p></div>
    <b>{action} <ArrowRight/></b>
  </button>
}

function latLonToVec3(lat, lon, radius=2.02){
  const phi = (90-lat) * Math.PI/180;
  const theta = (lon+180) * Math.PI/180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function SupplyGlobe(){
  const mountRef = useRef(null);
  const markerRefs = useRef([]);
  const selectedRef = useRef(null);
  const [activeTypes,setActiveTypes] = useState(['manufacturer','material','product']);
  const [selected,setSelected] = useState(SUPPLY_POINTS[1]);

  useEffect(()=>{ selectedRef.current = selected; },[selected]);

  useEffect(()=>{
    const mount = mountRef.current;
    if(!mount) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.copy(latLonToVec3(16,60,5.55));
    camera.lookAt(0,0,0);

    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000,0);
    renderer.domElement.className='globeCanvas';
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;
    controls.enableDamping=true;
    controls.dampingFactor=.055;
    controls.rotateSpeed=.55;
    controls.minDistance=4.15;
    controls.maxDistance=6.6;
    controls.autoRotate=true;
    controls.autoRotateSpeed=.42;

    let resumeTimer;
    controls.addEventListener('start',()=>{controls.autoRotate=false; clearTimeout(resumeTimer)});
    controls.addEventListener('end',()=>{resumeTimer=setTimeout(()=>{controls.autoRotate=true},5000)});

    scene.add(new THREE.AmbientLight(0x8fd4ff,1.3));
    const sun = new THREE.DirectionalLight(0xffffff,3.1); sun.position.set(-3,3,5); scene.add(sun);
    const greenFill = new THREE.PointLight(0x6aff9e,18,15); greenFill.position.set(3,-1,4); scene.add(greenFill);

    const loader = new THREE.TextureLoader();
    const earthTex = loader.load(earthTextureUrl);
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const bumpTex = loader.load(earthBumpUrl);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2,96,96),
      new THREE.MeshPhongMaterial({map:earthTex,bumpMap:bumpTex,bumpScale:.035,specular:new THREE.Color(0x477aa2),shininess:17})
    );
    scene.add(globe);

    const atmos = new THREE.Mesh(
      new THREE.SphereGeometry(2.13,96,96),
      new THREE.MeshBasicMaterial({color:0x5ed7ff,transparent:true,opacity:.075,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})
    );
    scene.add(atmos);
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(2.055,96,96),
      new THREE.MeshBasicMaterial({color:0x7affab,transparent:true,opacity:.025,blending:THREE.AdditiveBlending,depthWrite:false})
    );
    scene.add(halo);

    const starsGeo=new THREE.BufferGeometry();
    const stars=[];
    for(let i=0;i<520;i++){
      const r=6+Math.random()*10, t=Math.random()*Math.PI*2, p=Math.acos(2*Math.random()-1);
      stars.push(r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t));
    }
    starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
    const starPoints=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x9deec4,size:.018,transparent:true,opacity:.36}));
    scene.add(starPoints);

    const clickTargets=[];
    const markers=[];
    SUPPLY_POINTS.forEach((point,index)=>{
      const meta=TYPE_META[point.type];
      const color=new THREE.Color(meta.color);
      const normal=latLonToVec3(point.lat,point.lon,1).normalize();
      const group=new THREE.Group();
      group.position.copy(latLonToVec3(point.lat,point.lon,2.03));
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
      group.userData.point=point;

      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.11,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85}));
      stem.position.y=.05; group.add(stem);
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.052,18,18),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:2.6,roughness:.28}));
      dot.position.y=.12; dot.userData.point=point; group.add(dot); clickTargets.push(dot);
      const ring=new THREE.Mesh(new THREE.RingGeometry(.073,.095,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.78,depthWrite:false}));
      ring.position.y=.105; ring.rotation.x=Math.PI/2; group.add(ring);
      const hit=new THREE.Mesh(new THREE.SphereGeometry(.11,12,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
      hit.position.y=.12; hit.userData.point=point; group.add(hit); clickTargets.push(hit);
      group.scale.setScalar(index===1?1.14:1);
      scene.add(group);
      markers.push({group,type:point.type,id:point.id});
    });
    markerRefs.current=markers;

    const hub={lat:13.08,lon:80.27};
    SUPPLY_POINTS.filter((_,i)=>i%2===0).forEach((point)=>{
      const start=latLonToVec3(point.lat,point.lon,2.035);
      const end=latLonToVec3(hub.lat,hub.lon,2.035);
      const mid=start.clone().add(end).multiplyScalar(.5).normalize().multiplyScalar(2.45+start.distanceTo(end)*.12);
      const curve=new THREE.QuadraticBezierCurve3(start,mid,end);
      const geometry=new THREE.TubeGeometry(curve,56,.006,5,false);
      const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(TYPE_META[point.type].color),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false});
      const arc=new THREE.Mesh(geometry,mat); arc.userData.type=point.type; scene.add(arc);
      markers.push({group:arc,type:point.type,id:'arc-'+point.id});
    });

    const raycaster=new THREE.Raycaster();
    const mouse=new THREE.Vector2();
    const pointerMove=(e)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      renderer.domElement.style.cursor=raycaster.intersectObjects(clickTargets,false).length?'pointer':'grab';
    };
    const pointerUp=(e)=>{
      const rect=renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-rect.left)/rect.width)*2-1;
      mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      const hit=raycaster.intersectObjects(clickTargets,false)[0];
      if(hit?.object?.userData?.point) setSelected(hit.object.userData.point);
    };
    renderer.domElement.addEventListener('pointermove',pointerMove);
    renderer.domElement.addEventListener('pointerup',pointerUp);

    const resize=()=>{
      const w=mount.clientWidth||700,h=mount.clientHeight||560;
      renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
    };
    const ro=new ResizeObserver(resize); ro.observe(mount); resize();

    let raf;
    const animate=()=>{raf=requestAnimationFrame(animate); controls.update(); atmos.rotation.y-=.00045; halo.rotation.y+=.0002; starPoints.rotation.y+=.00005; renderer.render(scene,camera)};
    animate();

    return ()=>{
      clearTimeout(resumeTimer); cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener('pointermove',pointerMove); renderer.domElement.removeEventListener('pointerup',pointerUp);
      renderer.dispose(); scene.traverse(o=>{if(o.geometry)o.geometry.dispose?.(); if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>m.dispose?.())}});
      if(renderer.domElement.parentNode===mount) mount.removeChild(renderer.domElement);
    };
  },[]);

  useEffect(()=>{
    markerRefs.current.forEach(({group,type})=>{group.visible=activeTypes.includes(type)});
  },[activeTypes]);

  useEffect(()=>{
    markerRefs.current.forEach(({group,id})=>{
      if(!id.startsWith('arc-')) group.scale.setScalar(id===selected.id?1.35:1);
    });
  },[selected]);

  const toggleType=(type)=>setActiveTypes(v=>v.includes(type)?(v.length===1?v:v.filter(x=>x!==type)):[...v,type]);
  const meta=TYPE_META[selected.type];
  const SelectedIcon=meta.Icon;

  return <div className="globeStage">
    <div className="globeTopBadge"><RotateCw/> Drag to rotate · scroll to zoom</div>
    <div className="globeMount" ref={mountRef}/>
    <div className="globeFilters">
      {Object.entries(TYPE_META).map(([type,m])=><button key={type} className={activeTypes.includes(type)?'on':''} style={{'--typeColor':m.color}} onClick={()=>toggleType(type)}><m.Icon/>{m.label}</button>)}
    </div>
    <div className="globeZoomHint"><Plus/><span>zoom</span><Minus/></div>
    <div className="selectedSupply" style={{'--selectedColor':meta.color}}>
      <span className="selectedIcon"><SelectedIcon/></span>
      <div><small>{meta.singular.toUpperCase()} · {selected.city}</small><b>{selected.name}</b><p>{selected.detail}</p><div><span>{selected.availability}</span><span>{selected.lead}</span></div></div>
    </div>
    <div className="globeLegendHint"><span className="liveDot"/> Demo sourcing data · click any location</div>
  </div>
}

function SupplySummary({go}){
  const cards=[
    {type:'manufacturer',value:'500+',label:'supplier locations',name:'EcoForm India',sub:'Pune · molded fiber',Icon:Factory},
    {type:'material',value:'1,200+',label:'material listings',name:'Bamboo Fiber',sub:'42 t available now',Icon:Leaf},
    {type:'product',value:'2,500+',label:'ready products',name:'BottleGuard',sub:'6,800 units available',Icon:PackageCheck}
  ];
  return <aside className="supplySummary glass">
    <div className="summaryHead"><div><span className="liveDot"/><small>INTERACTIVE SUPPLY NETWORK</small></div><b>Availability snapshot</b></div>
    {cards.map(c=>{const meta=TYPE_META[c.type]; return <div className="supplyStat" key={c.type} style={{'--typeColor':meta.color}}><span><c.Icon/></span><div><b>{c.value}</b><small>{c.label}</small></div></div>})}
    <div className="liveSources">
      {cards.map(c=><button key={c.name} onClick={()=>go(c.type==='material'?'materials':c.type==='manufacturer'?'logistics':'optimizer')} style={{'--typeColor':TYPE_META[c.type].color}}><span><c.Icon/></span><div><b>{c.name}</b><small>{c.sub}</small></div><ArrowRight/></button>)}
    </div>
    <button className="networkAction" onClick={()=>go('materials')}>Browse sourcing network <ArrowRight/></button>
  </aside>
}

function PageHeader({eyebrow,title,desc,action}){return <div className="pageHeader"><div><small>{eyebrow}</small><h2>{title}</h2><p>{desc}</p></div>{action}</div>}

function Optimizer(){
  const [weight,setWeight]=useState(350), [fragility,setFragility]=useState('High'), [priority,setPriority]=useState('Balanced'), [budget,setBudget]=useState(25);
  const ranked = useMemo(()=>materials.map(m=>({...m,score:scoreMaterial(m,priority,fragility)})).sort((a,b)=>b.score-a.score),[priority,fragility]);
  const best=ranked[0];
  return <div className="page innerPage"><PageHeader eyebrow="AI OPTIMIZER" title="Build the right package." desc="Change the constraints and EcoPack recalculates the best material direction instantly."/>
    <div className="optimizerLayout"><section className="controlPanel glass"><h3><Sparkles/> Product brief</h3><label>Product name<input defaultValue="Glass Skincare Bottle"/></label><label>Weight <b>{weight} g</b><input type="range" min="100" max="1200" value={weight} onChange={e=>setWeight(+e.target.value)}/></label><label>Fragility<select value={fragility} onChange={e=>setFragility(e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Optimization priority<select value={priority} onChange={e=>setPriority(e.target.value)}><option>Balanced</option><option>Cost</option><option>Carbon</option><option>Protection</option></select></label><label>Target budget <b>₹{budget}</b><input type="range" min="15" max="35" value={budget} onChange={e=>setBudget(+e.target.value)}/></label><div className="infoNote"><CheckCircle2/> Changes update your recommendation in real time.</div></section>
      <section className="resultPanel"><div className="bestPick glass"><div><small>RECOMMENDED PACKAGE</small><h3>{best.name}</h3><p>{best.desc}</p><div className="bestMetrics"><span><b>₹{best.cost}</b> unit cost</span><span><b>{best.carbon}g</b> CO₂e</span><span><b>{best.protection}%</b> protection</span><span><b>{best.recycle}%</b> recyclable</span></div></div><div className="scoreRing"><b>{best.score}</b><small>/100 fit</small></div></div>
      <div className="ranking glass"><div className="panelHead"><h3>AI Ranking</h3><span>Live</span></div>{ranked.map((m,i)=><div className="rankRow" key={m.name}><b>0{i+1}</b><div><strong>{m.name}</strong><small>{m.badge}</small><i><u style={{width:m.score+'%'}}/></i></div><em>{m.score}</em></div>)}</div></section></div>
  </div>
}

function Logistics(){return <div className="page innerPage"><PageHeader eyebrow="LOGISTICS" title="Plan a cleaner route." desc="Compare shipping modes and understand the trade-off between speed and emissions."/><div className="routeHero glass"><div><MapPin/><small>ORIGIN</small><b>Chennai, India</b></div><span className="routeLine"><i/><Truck/><i/></span><div><MapPin/><small>DESTINATION</small><b>Bengaluru, India</b></div></div><div className="cards3"><Route title="Road freight" time="6.5 hrs" co2="8.4 kg CO₂e" recommended/><Route title="Rail + local road" time="10.2 hrs" co2="5.7 kg CO₂e"/><Route title="Express road" time="5.1 hrs" co2="11.6 kg CO₂e"/></div></div>}
function Route({title,time,co2,recommended}){return <div className={'glass routeCard '+(recommended?'recommended':'')}><Truck/><small>{recommended?'RECOMMENDED':'ROUTE OPTION'}</small><h3>{title}</h3><span><Clock3/> {time}</span><span><Leaf/> {co2}</span><button className="secondary">Select route <ArrowRight/></button></div>}

function Materials(){return <div className="page innerPage"><PageHeader eyebrow="MATERIAL LIBRARY" title="Compare eco-friendly materials." desc="Evaluate cost, carbon, protection and recyclability side-by-side."/><div className="materialGrid">{materials.map((m,i)=><div className="materialCard glass" key={m.name}><div className="materialVisual"><Package/><span>{i+1}</span></div><small>{m.badge}</small><h3>{m.name}</h3><p>{m.desc}</p><div className="materialStats"><span>₹{m.cost}<small>cost</small></span><span>{m.carbon}g<small>CO₂e</small></span><span>{m.protection}%<small>protect</small></span><span>{m.recycle}%<small>recycle</small></span></div><button className="secondary">Use material <ArrowRight/></button></div>)}</div></div>}

function Simulator(){const [test,setTest]=useState('Drop'),[intensity,setIntensity]=useState(70); const base={Drop:97,Vibration:94,Compression:92,Transport:90}[test]; const score=Math.max(68,Math.round(base-(intensity-70)*.18)); return <div className="page innerPage"><PageHeader eyebrow="VIRTUAL TESTING" title="Test before you manufacture." desc="Run a visual prototype simulation for common packaging stresses."/><div className="simLayout"><div className="simStage glass"><div className="simTop"><span>● SIMULATION LIVE</span><b>{test} test · {intensity}%</b></div><div className={'simScene '+test.toLowerCase()}><div className="floorGrid"/><div className="simPackage"><Leaf/><b>ECOPACK</b><small>MOLDED PULP</small></div><strong>{test==='Drop'?'↓':test==='Vibration'?'↔':test==='Compression'?'⇣':'→'}</strong></div><div className="testButtons">{['Drop','Vibration','Compression','Transport'].map(t=><button className={test===t?'active':''} onClick={()=>setTest(t)} key={t}><Activity/>{t}</button>)}</div></div><div className="simResults glass"><small>VIRTUAL TEST RESULT</small><div className="bigScore">{score}<span>/100</span></div><strong className="pass">PASS</strong><p>Estimated structural performance under the selected test.</p><label>Intensity <b>{intensity}%</b><input type="range" min="30" max="100" value={intensity} onChange={e=>setIntensity(+e.target.value)}/></label>{[['Impact strength',score],['Vibration durability',score-3],['Stacking strength',score-6],['Material separation',94]].map(([t,v])=><Progress key={t} label={t} value={v}/>)}</div></div></div>}
function Progress({label,value}){return <div className="progressRow"><div><span>{label}</span><b>{value}%</b></div><i><u style={{width:value+'%'}}/></i></div>}

function Impact(){return <div className="page innerPage"><PageHeader eyebrow="IMPACT" title="Measure what your packaging saves." desc="Translate packaging decisions into environmental and commercial outcomes."/><div className="impactGrid"><BigStat icon={Leaf} value="2.8 t" label="CO₂ avoided"/><BigStat icon={ShieldCheck} value="420 kg" label="Plastic avoided"/><BigStat icon={CircleDollarSign} value="₹1.4 L" label="Cost savings"/><BigStat icon={Recycle} value="91%" label="Recyclability"/></div><div className="impactBreakdown glass"><h3>Environmental impact breakdown</h3><Progress label="Material footprint" value={71}/><Progress label="Transport efficiency" value={84}/><Progress label="Recyclability" value={91}/><Progress label="Material reduction" value={76}/></div></div>}
function BigStat({icon:Icon,value,label}){return <div className="bigStat glass"><span><Icon/></span><b>{value}</b><small>{label}</small><em>Improved vs. baseline</em></div>}

function Quotes(){const [qty,setQty]=useState(1000),[mat,setMat]=useState('Molded Pulp'); const m=materials.find(x=>x.name===mat); const total=Math.round(qty*m.cost*(qty>=5000?.92:qty>=2000?.96:1)); return <div className="page innerPage"><PageHeader eyebrow="QUOTES" title="Estimate your packaging cost." desc="Get a fast prototype quote from quantity and material choice."/><div className="quoteLayout"><div className="glass quoteForm"><label>Quantity<input type="number" min="100" value={qty} onChange={e=>setQty(Math.max(100,+e.target.value||100))}/></label><label>Material<select value={mat} onChange={e=>setMat(e.target.value)}>{materials.map(m=><option key={m.name}>{m.name}</option>)}</select></label><div className="infoNote"><Leaf/> Bulk pricing is automatically applied above 2,000 units.</div></div><div className="glass quoteResult"><small>ESTIMATED QUOTE</small><h3>₹{total.toLocaleString('en-IN')}</h3><p>Approx. ₹{Math.round(total/qty)} per package</p><div><span>Quantity <b>{qty.toLocaleString('en-IN')}</b></span><span>Material <b>{mat}</b></span><span>Estimated CO₂e <b>{Math.round(qty*m.carbon/1000)} kg</b></span></div><button className="primary">Generate quote <ArrowRight/></button></div></div></div>}

function Statistics(){return <div className="page innerPage"><PageHeader eyebrow="STATISTICS" title="See the trade-offs." desc="A concise dashboard of cost, protection, carbon and circularity performance."/><div className="statsLayout"><div className="glass chartCard"><h3>Carbon breakdown</h3>{[['Manufacturing',48],['Material',29],['Transport',17],['End-of-life',6]].map(([n,v])=><div className="barRow" key={n}><span>{n}</span><i><u style={{width:v*1.8+'%'}}/></i><b>{v}%</b></div>)}</div><div className="glass chartCard"><h3>Decision score</h3><div className="radialScore"><b>86</b><small>/100</small></div><p>Balanced across sustainability, protection and cost.</p></div></div></div>}

function Reuse(){const ideas=[['Refillable inner tray','Keep the outer box and replace only the insert.',Recycle],['Second-life storage','Convert the structure into a drawer or organiser.',Boxes],['Mono-material design','Reduce mixed components for easier recycling.',Leaf],['Return-ready format','Design the closure so the shipper can be reused.',Truck]]; return <div className="page innerPage"><PageHeader eyebrow="CIRCULAR DESIGN" title="Keep value moving." desc="Build reuse and end-of-life thinking into the package from the beginning."/><div className="reuseGrid">{ideas.map(([t,d,Icon])=><div className="glass reuseCard" key={t}><span><Icon/></span><h3>{t}</h3><p>{d}</p><button className="secondary">Use concept <ArrowRight/></button></div>)}</div></div>}

function Feedback(){const [sent,setSent]=useState(false); return <div className="page innerPage"><PageHeader eyebrow="FEEDBACK" title="Help EcoPack improve." desc="Share what worked, what felt unclear and what you would like to see next."/><div className="feedbackCard glass">{sent?<div className="thanks"><CheckCircle2/><h3>Thanks for the feedback.</h3><p>Your prototype response has been saved in this session.</p><button className="secondary" onClick={()=>setSent(false)}>Send another</button></div>:<form onSubmit={e=>{e.preventDefault();setSent(true)}}><label>Name<input placeholder="Your name" required/></label><label>What should we improve?<textarea placeholder="Tell us what would make EcoPack better..." required/></label><label>Experience<select><option>Excellent</option><option>Good</option><option>Okay</option><option>Needs improvement</option></select></label><button className="primary" type="submit"><Send/> Send feedback</button></form>}</div></div>}

function Assistant({close}){const [q,setQ]=useState(''),[msgs,setMsgs]=useState([{who:'ai',text:'Hi! I can explain materials, optimization scores, sustainability impact, or packaging trade-offs.'}]); const send=()=>{if(!q.trim())return; const text=q.trim(); setMsgs(m=>[...m,{who:'user',text},{who:'ai',text:'For this EcoPack prototype, I would compare protection first, then carbon, cost and recyclability. Molded pulp is usually the strongest balanced option for fragile products.'}]); setQ('')}; return <div className="assistantBackdrop"><aside className="assistantDrawer"><div className="assistantHead"><div><Sparkles/><span><b>Eco AI</b><small>Packaging assistant</small></span></div><button onClick={close}><X/></button></div><div className="messages">{msgs.map((m,i)=><div key={i} className={'msg '+m.who}>{m.text}</div>)}</div><div className="chatInput"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about packaging..."/><button onClick={send}><Send/></button></div></aside></div>}

createRoot(document.getElementById('root')).render(<App/>);
