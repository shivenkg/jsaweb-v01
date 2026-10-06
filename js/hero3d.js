/* ===================== 3D HERO — MESSY → SMOOTH NETWORK LOOP =====================
   A background network graph that continuously cycles:
     MESSY  (tangled, jittering, random edges flickering)
     ──────►  ORGANIZE  (nodes lerp to clean grid positions, ~2.8 s ease)
     SMOOTH (clean grid, data-flow particles travel along edges)
     ──────►  DISSOLVE  (nodes drift back toward chaos, ~2.5 s ease)
     repeat.
   ─────────────────────────────────────────────────────────────────────────── */
(function(){
  const canvas = document.getElementById('hero-canvas');
  const hero   = document.querySelector('.hero');
  let W = hero.clientWidth, H = hero.clientHeight;

  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 120);
  camera.position.set(0, 0, 14);

  const currentTheme = ()=>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

  /* ─── brand palette ─── */
  const BLUE   = new THREE.Color(0x2E9BFF);
  const CYAN   = new THREE.Color(0x00D4FF);
  const PURPLE = new THREE.Color(0x6B2FD6);
  const SKY    = new THREE.Color(0x7DD4FF);
  const PALE   = new THREE.Color(0xB8E8FF);

  /* ═══════════════════════════════════════════════════
     NODE LAYOUT — two sets of positions per node
     ═══════════════════════════════════════════════════ */
  const NODE_COUNT = 60;

  // SMOOTH layout: clean 6×5 grid + extra depth layer
  // spans X:[-5.5..5.5] Y:[-3..3] Z:[-3..3]
  const smoothPos = [];
  const COLS = 7, ROWS = 5;
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      smoothPos.push(new THREE.Vector3(
        (c/(COLS-1)-0.5)*11,
        (r/(ROWS-1)-0.5)*6,
        Math.sin(c*0.9+r*0.7)*1.4
      ));
    }
  }
  // extra ring around the grid for visual interest
  const EXTRA = NODE_COUNT - COLS*ROWS;
  for(let i=0; i<EXTRA; i++){
    const a  = (i/EXTRA)*Math.PI*2;
    const ra = 6.5 + Math.sin(i*1.3)*0.8;
    smoothPos.push(new THREE.Vector3(
      Math.cos(a)*ra,
      Math.sin(a)*ra*0.55,
      Math.cos(a*2)*2.0
    ));
  }

  // MESSY layout: random scatter in a larger volume
  const messyPos = [];
  for(let i=0; i<NODE_COUNT; i++){
    messyPos.push(new THREE.Vector3(
      (Math.random()-0.5)*22,
      (Math.random()-0.5)*14,
      (Math.random()-0.5)*10 - 2
    ));
  }

  /* ─── EDGES: connect grid-adjacent nodes (smooth layout) ─── */
  const EDGES = [];
  const edgePairs = new Set();
  function addEdge(a, b){
    const key = Math.min(a,b)+'_'+Math.max(a,b);
    if(edgePairs.has(key)) return;
    edgePairs.add(key);
    EDGES.push([a,b]);
  }
  // grid adjacency (horizontal + vertical + one diagonal)
  for(let r=0; r<ROWS; r++){
    for(let c=0; c<COLS; c++){
      const idx = r*COLS+c;
      if(c<COLS-1) addEdge(idx, idx+1);          // right
      if(r<ROWS-1) addEdge(idx, idx+COLS);        // down
      if(r<ROWS-1&&c<COLS-1) addEdge(idx,idx+COLS+1); // diag
    }
  }
  // connect outer ring nodes to nearest grid node
  for(let i=COLS*ROWS; i<NODE_COUNT; i++){
    let nearest=-1, nearD=1e9;
    const p=smoothPos[i];
    for(let j=0;j<COLS*ROWS;j++){
      const d=p.distanceTo(smoothPos[j]);
      if(d<nearD){nearD=d;nearest=j;}
    }
    addEdge(i,nearest);
    // one more connection
    let second=-1, secD=1e9;
    for(let j=0;j<COLS*ROWS;j++){
      if(j===nearest) continue;
      const d=p.distanceTo(smoothPos[j]);
      if(d<secD){secD=d;second=j;}
    }
    if(secD<6.5) addEdge(i,second);
  }

  // messy "noise" edges — random connections only shown in chaotic phase
  const NOISE_EDGES = [];
  for(let i=0;i<40;i++){
    const a=Math.floor(Math.random()*NODE_COUNT);
    const b=Math.floor(Math.random()*NODE_COUNT);
    if(a!==b) NOISE_EDGES.push([a,b]);
  }

  /* ═══════════════════════════════════════════════════
     THREE.JS OBJECTS
     ═══════════════════════════════════════════════════ */

  // Current interpolated node positions (what we actually render)
  const nodePos = smoothPos.map(p=>p.clone());
  // Interactive physics offset vector per node driven by mouse motion
  const nodeOffset = [];
  for(let i=0; i<NODE_COUNT; i++) nodeOffset.push(new THREE.Vector3(0,0,0));

  // ─── NODE POINTS (instanced small boxes for crisp look) ───
  const nodeGeo  = new THREE.SphereGeometry(0.10, 8, 8);
  const nodeMat  = new THREE.MeshBasicMaterial({color:0x2E9BFF, transparent:true, opacity:0.92});
  const nodeIM   = new THREE.InstancedMesh(nodeGeo, nodeMat, NODE_COUNT);
  nodeIM.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NODE_COUNT*3), 3);
  scene.add(nodeIM);

  // per-node colour palette (fixed) — light theme
  const NODE_COLORS = [];
  const palette = [BLUE, CYAN, SKY, PURPLE, PALE];
  for(let i=0;i<NODE_COUNT;i++){
    NODE_COLORS.push(palette[i%palette.length].clone());
    NODE_COLORS[i].toArray(nodeIM.instanceColor.array, i*3);
  }
  nodeIM.instanceColor.needsUpdate = true;
  nodeMat.vertexColors = true;

  // per-node colour palette — dark theme (deep-orange family, matches the site's dark colour scheme)
  const ORANGE_DEEP   = new THREE.Color(0xFF4B00);
  const ORANGE_BRIGHT = new THREE.Color(0xFF8A2E);
  const ORANGE_AMBER  = new THREE.Color(0xFFA23D);
  const NODE_COLORS_DARK = [];
  const darkPalette = [ORANGE_DEEP, ORANGE_BRIGHT, ORANGE_AMBER, ORANGE_DEEP, ORANGE_BRIGHT];
  for(let i=0;i<NODE_COUNT;i++){
    NODE_COLORS_DARK.push(darkPalette[i%darkPalette.length].clone());
  }

  // Theme-aware node colouring: deep orange nodes in dark theme, brand-blue in light theme
  function applyNodeThemeColors(theme){
    const src = theme === 'dark' ? NODE_COLORS_DARK : NODE_COLORS;
    for(let i=0;i<NODE_COUNT;i++){
      src[i].toArray(nodeIM.instanceColor.array, i*3);
    }
    nodeIM.instanceColor.needsUpdate = true;
  }
  // apply initial theme
  applyNodeThemeColors(currentTheme());

  // ─── SMOOTH EDGES (structural connections) ───
  // Each edge is a single Line2D (two-point LineSegments)
  const edgePosArr = new Float32Array(EDGES.length * 6); // 2 verts × 3 floats each
  const smoothEdgeGeo = new THREE.BufferGeometry();
  smoothEdgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePosArr, 3));
  smoothEdgeGeo.setDrawRange(0, EDGES.length*2);
  const smoothEdgeMat = new THREE.LineBasicMaterial({
    color: 0x2E9BFF, transparent:true, opacity:0.5, vertexColors:false
  });
  scene.add(new THREE.LineSegments(smoothEdgeGeo, smoothEdgeMat));

  // ─── MESSY NOISE EDGES ───
  const noisePosArr = new Float32Array(NOISE_EDGES.length * 6);
  const noiseEdgeGeo = new THREE.BufferGeometry();
  noiseEdgeGeo.setAttribute('position', new THREE.BufferAttribute(noisePosArr, 3));
  noiseEdgeGeo.setDrawRange(0, NOISE_EDGES.length*2);
  const noiseEdgeMat = new THREE.LineBasicMaterial({
    color: 0xB23368, transparent:true, opacity:0.5
  });
  scene.add(new THREE.LineSegments(noiseEdgeGeo, noiseEdgeMat));

  // ─── DATA-FLOW PARTICLES (travel along smooth edges in SMOOTH phase) ───
  const FLOW_COUNT = 80;
  const flowGeo = new THREE.BufferGeometry();
  const flowPos = new Float32Array(FLOW_COUNT * 3);
  flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
  const flowMat = new THREE.PointsMaterial({
    color: 0x00D4FF, size:0.14, transparent:true, opacity:0.9,
    sizeAttenuation:true, depthWrite:false
  });
  const flowPoints = scene.add(new THREE.Points(flowGeo, flowMat)) || scene.children[scene.children.length-1];
  // actually get the reference properly:
  const flowPts = new THREE.Points(flowGeo, flowMat);
  scene.add(flowPts);

  // each flow particle tracks which edge it rides and its progress [0-1]
  const flowData = [];
  for(let i=0;i<FLOW_COUNT;i++){
    flowData.push({
      edgeIdx: Math.floor(Math.random()*EDGES.length),
      t: Math.random(),
      speed: 0.004 + Math.random()*0.012
    });
  }

  // ─── JITTER offsets for messy state ───
  const jitter = [];
  for(let i=0;i<NODE_COUNT;i++) jitter.push(new THREE.Vector3(
    (Math.random()-0.5)*0.5,
    (Math.random()-0.5)*0.5,
    (Math.random()-0.5)*0.3
  ));

  // ─── AMBIENT BACKGROUND DOTS (very faint starfield) ───
  const bgCount = 500;
  const bgPos   = new Float32Array(bgCount*3);
  for(let i=0;i<bgCount;i++){
    bgPos[i*3]   = (Math.random()-0.5)*60;
    bgPos[i*3+1] = (Math.random()-0.5)*40;
    bgPos[i*3+2] = (Math.random()-0.5)*20 - 8;
  }
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos,3));
  const bgColorByTheme = {dark:0x2244AA, light:0x8899AA};
  const bgMat = new THREE.PointsMaterial({color:bgColorByTheme[currentTheme()], size:0.028, transparent:true, opacity:0.30});
  scene.add(new THREE.Points(bgGeo, bgMat));

  /* ═══════════════════════════════════════════════════
     HOLOGRAPHIC CORE — a glowing energy source anchored behind
     the network graph. Purely atmospheric: low-opacity, slow
     rotation, sits at negative Z so it never competes with the
     node grid in the foreground.
     ═══════════════════════════════════════════════════ */
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 0, -6.5);
  scene.add(coreGroup);

  const coreColorsByTheme = {
    dark:  { a: 0xFF4B00, b: 0xFF8A2E },   // deep orange family
    light: { a: 0x2E9BFF, b: 0x6B2FD6 }    // brand blue → purple
  };

  // wireframe icosahedron core
  const coreGeo = new THREE.IcosahedronGeometry(2.3, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: coreColorsByTheme[currentTheme()].a,
    wireframe: true, transparent: true, opacity: 0.22
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreGroup.add(coreMesh);

  // fresnel-style outer glow shell (additive, brighter at the rim)
  const glowGeo = new THREE.IcosahedronGeometry(2.7, 3);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { cCore: { value: new THREE.Color(coreColorsByTheme[currentTheme()].a) } },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vPos;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position,1.0);
        vPos = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }`,
    fragmentShader: `
      varying vec3 vNormal; varying vec3 vPos; uniform vec3 cCore;
      void main(){
        vec3 viewDir = normalize(-vPos);
        float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.4);
        gl_FragColor = vec4(cCore, fresnel * 0.35);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  coreGroup.add(glowMesh);

  // HUD-style rings (sci-fi "targeting" accent)
  const hudRings = [];
  function makeHudRing(radius, tube, tiltX, tiltZ, colorHex, speed){
    const geo = new THREE.TorusGeometry(radius, tube, 8, 96);
    const mat = new THREE.MeshBasicMaterial({color:colorHex, transparent:true, opacity:0.28, blending:THREE.AdditiveBlending, depthWrite:false});
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(tiltX, 0, tiltZ);
    mesh.userData.speed = speed;
    coreGroup.add(mesh);
    hudRings.push(mesh);
  }
  makeHudRing(3.4, 0.012, Math.PI/2.3, 0.25, coreColorsByTheme[currentTheme()].b, 0.08);
  makeHudRing(4.0, 0.008, Math.PI/1.8, -0.4, coreColorsByTheme[currentTheme()].a, -0.05);

  function applyCoreTheme(theme){
    const c = coreColorsByTheme[theme] || coreColorsByTheme.dark;
    coreMat.color.set(c.a);
    glowMat.uniforms.cCore.value.set(c.a);
    hudRings[0].material.color.set(c.b);
    hudRings[1].material.color.set(c.a);
  }

  // ─── SCAN SWEEP — a thin bright band drifting top-to-bottom, radar-style ───
  const sweepGeo = new THREE.PlaneGeometry(26, 0.55);
  const sweepMat = new THREE.MeshBasicMaterial({
    color: coreColorsByTheme[currentTheme()].b, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite:false
  });
  const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
  sweepMesh.position.set(0, 6, -3);
  scene.add(sweepMesh);

  /* ─── 3D INTERACTIVE CURSOR BEACON & LIGHT ─── */
  const beaconGroup = new THREE.Group();
  const beaconColorsByTheme = {
    dark:  { core: 0xFF8A2E, ring: 0xFF4B00 },
    light: { core: 0x00D4FF, ring: 0x2E9BFF }
  };
  const bColor = beaconColorsByTheme[currentTheme()];
  const beaconCoreGeo = new THREE.SphereGeometry(0.18, 16, 16);
  const beaconCoreMat = new THREE.MeshBasicMaterial({color: bColor.core, transparent:true, opacity:0.9});
  const beaconCore = new THREE.Mesh(beaconCoreGeo, beaconCoreMat);
  beaconGroup.add(beaconCore);

  const beaconHaloGeo = new THREE.RingGeometry(0.35, 0.45, 32);
  const beaconHaloMat = new THREE.MeshBasicMaterial({color: bColor.ring, transparent:true, opacity:0.65, side:THREE.DoubleSide});
  const beaconHalo = new THREE.Mesh(beaconHaloGeo, beaconHaloMat);
  beaconGroup.add(beaconHalo);

  const beaconLight = new THREE.PointLight(bColor.core, 1.8, 8);
  beaconGroup.add(beaconLight);
  beaconGroup.position.set(0, 0, 0);
  scene.add(beaconGroup);

  function applyBeaconTheme(theme){
    const c = beaconColorsByTheme[theme] || beaconColorsByTheme.dark;
    beaconCoreMat.color.set(c.core);
    beaconHaloMat.color.set(c.ring);
    beaconLight.color.set(c.core);
  }

  /* ═══════════════════════════════════════════════════
     ANIMATION STATE MACHINE
     ═══════════════════════════════════════════════════
     Phases (looped):
       0  HOLD_MESSY      ~1.5 s   jittering chaos
       1  ORGANIZE        ~2.8 s   lerp messy→smooth  (ease-in-out)
       2  HOLD_SMOOTH     ~2.0 s   clean network + data flow
       3  DISSOLVE        ~2.5 s   lerp smooth→messy  (ease-in-out)
  ═══════════════════════════════════════════════════ */
  const PHASE_DUR = [1.5, 2.8, 2.0, 2.5];
  const PHASE_TOTAL = PHASE_DUR.reduce((a,b)=>a+b,0);

  function easeInOut(t){ return t<0.5 ? 2*t*t : -1+(4-2*t)*t; }
  function easeOut(t){ return 1-(1-t)*(1-t); }
  function easeIn(t){ return t*t*t; }

  const clock = new THREE.Clock();
  let loopTime = 0; // time within current loop
  let scrollFactor = 0, rawScrollY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let curMouseX = 0, curMouseY = 0;
  let mouseSpeed = 0;
  let isMouseInside = false;
  let jitterT = 0;

  window.addEventListener('mousemove', e=>{
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    const heroRect = hero.getBoundingClientRect();
    isMouseInside = (e.clientY >= heroRect.top && e.clientY <= heroRect.bottom);
  }, {passive:true});

  window.addEventListener('touchmove', e=>{
    if(!e.touches||!e.touches[0]) return;
    targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
    const heroRect = hero.getBoundingClientRect();
    isMouseInside = (e.touches[0].clientY >= heroRect.top && e.touches[0].clientY <= heroRect.bottom);
  }, {passive:true});

  window.addEventListener('mouseleave', ()=>{
    targetMouseX = 0;
    targetMouseY = 0;
    isMouseInside = false;
  });

  window.addEventListener('scroll', ()=>{
    scrollFactor = Math.min(window.scrollY/hero.clientHeight, 1);
    rawScrollY   = window.scrollY;
  });

  /* ─── helpers to update geometry from current nodePos & mouse offsets ─── */
  const _dummy = new THREE.Object3D();
  function updateNodeMeshes(pulseFn){
    for(let i=0;i<NODE_COUNT;i++){
      _dummy.position.set(
        nodePos[i].x + nodeOffset[i].x,
        nodePos[i].y + nodeOffset[i].y,
        nodePos[i].z + nodeOffset[i].z
      );
      const pushDist = Math.hypot(nodeOffset[i].x, nodeOffset[i].y);
      const hoverScale = 1.0 + Math.min(pushDist * 0.45, 0.65);
      const baseScale = pulseFn ? pulseFn(i) : 1.0;
      _dummy.scale.setScalar(baseScale * hoverScale);
      _dummy.updateMatrix();
      nodeIM.setMatrixAt(i, _dummy.matrix);
    }
    nodeIM.instanceMatrix.needsUpdate = true;
  }

  function updateEdgeGeo(posArr, edgeList){
    for(let e=0;e<edgeList.length;e++){
      const [a,b] = edgeList[e];
      const pa = nodePos[a], pb = nodePos[b];
      const oa = nodeOffset[a], ob = nodeOffset[b];
      posArr[e*6+0]=pa.x + oa.x; posArr[e*6+1]=pa.y + oa.y; posArr[e*6+2]=pa.z + oa.z;
      posArr[e*6+3]=pb.x + ob.x; posArr[e*6+4]=pb.y + ob.y; posArr[e*6+5]=pb.z + ob.z;
    }
  }

  /* ─── per-node jitter (messy shaking) ─── */
  function applyJitter(strength){
    jitterT += 0.05;
    for(let i=0;i<NODE_COUNT;i++){
      nodePos[i].x = messyPos[i].x + Math.sin(jitterT*1.7+i*0.9)*jitter[i].x*strength*2;
      nodePos[i].y = messyPos[i].y + Math.cos(jitterT*1.3+i*1.1)*jitter[i].y*strength*2;
      nodePos[i].z = messyPos[i].z + Math.sin(jitterT*2.1+i*0.5)*jitter[i].z*strength*2;
    }
  }

  /* ─── flow particle update (speeds up with mouse interaction) ─── */
  function updateFlow(){
    for(let i=0;i<FLOW_COUNT;i++){
      const fd = flowData[i];
      const speedBoost = 1.0 + mouseSpeed * 2.5;
      fd.t += fd.speed * speedBoost;
      if(fd.t>1){ fd.t-=1; fd.edgeIdx=Math.floor(Math.random()*EDGES.length); }
      const [a,b] = EDGES[fd.edgeIdx];
      const pa = nodePos[a], pb = nodePos[b];
      const oa = nodeOffset[a], ob = nodeOffset[b];
      const ax = pa.x + oa.x, ay = pa.y + oa.y, az = pa.z + oa.z;
      const bx = pb.x + ob.x, by = pb.y + ob.y, bz = pb.z + ob.z;
      flowPos[i*3]   = ax + (bx-ax)*fd.t;
      flowPos[i*3+1] = ay + (by-ay)*fd.t;
      flowPos[i*3+2] = az + (bz-az)*fd.t;
    }
    flowGeo.attributes.position.needsUpdate = true;
  }

  /* ═══════════════════════════════════════════════════
     MAIN LOOP
  ═══════════════════════════════════════════════════ */
  function animate(){
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const globalT = clock.getElapsedTime();

    loopTime = (loopTime + dt) % PHASE_TOTAL;

    // Smoothly damp mouse motion and compute kinetic speed
    const deltaX = targetMouseX - curMouseX;
    const deltaY = targetMouseY - curMouseY;
    curMouseX += deltaX * 0.085;
    curMouseY += deltaY * 0.085;
    mouseSpeed = Math.min(Math.hypot(deltaX, deltaY) * 25, 3.5);

    // Map 2D mouse coordinates (-1..1) to 3D world focal plane (z = 0)
    const planeDist = camera.position.z;
    const vFovRad = (camera.fov * Math.PI) / 180;
    const viewH = 2 * Math.tan(vFovRad / 2) * planeDist;
    const viewW = viewH * camera.aspect;
    const targetWorldX = (curMouseX * viewW) * 0.46;
    const targetWorldY = (-curMouseY * viewH) * 0.46;

    // Update 3D interactive cursor beacon
    beaconGroup.position.x += (targetWorldX - beaconGroup.position.x) * 0.16;
    beaconGroup.position.y += (targetWorldY - beaconGroup.position.y) * 0.16;
    beaconGroup.position.z = 0.5 + Math.sin(globalT * 3) * 0.15;
    beaconHalo.rotation.z += 0.03 + mouseSpeed * 0.08;
    beaconHalo.scale.setScalar(1 + 0.15 * Math.sin(globalT * 4.5));
    beaconGroup.visible = isMouseInside;

    // Interactive node physics: magnetic repulsion & elastic wave offset
    for(let i=0; i<NODE_COUNT; i++){
      const dx = (nodePos[i].x) - beaconGroup.position.x;
      const dy = (nodePos[i].y) - beaconGroup.position.y;
      const dist = Math.hypot(dx, dy);
      const maxRadius = 3.8;

      if(dist < maxRadius && isMouseInside){
        const force = (1 - dist / maxRadius);
        const pushStrength = force * 1.6;
        const normX = dx / (dist || 1);
        const normY = dy / (dist || 1);
        nodeOffset[i].x += (normX * pushStrength - nodeOffset[i].x) * 0.24;
        nodeOffset[i].y += (normY * pushStrength - nodeOffset[i].y) * 0.24;
        nodeOffset[i].z += (force * 2.0 - nodeOffset[i].z) * 0.24;
      } else {
        nodeOffset[i].x *= 0.88;
        nodeOffset[i].y *= 0.88;
        nodeOffset[i].z *= 0.88;
      }
    }

    /* ── determine current phase ── */
    let phase = 0, phaseT = loopTime;
    for(let p=0; p<PHASE_DUR.length; p++){
      if(phaseT < PHASE_DUR[p]){ phase=p; phaseT/=PHASE_DUR[p]; break; }
      phaseT -= PHASE_DUR[p];
    }

    /* ── 1. update node positions ── */
    if(phase===0){
      // HOLD_MESSY: jitter around messy positions
      applyJitter(1.0);
      smoothEdgeMat.opacity = 0.0;
      noiseEdgeMat.opacity  = 0.18 + 0.10*Math.sin(globalT*4);
      flowMat.opacity       = 0.0;
      updateNodeMeshes();

    } else if(phase===1){
      // ORGANIZE: lerp from messy → smooth
      const lerpFac = easeInOut(phaseT);
      jitterT += 0.05;
      for(let i=0;i<NODE_COUNT;i++){
        const jStr = (1-lerpFac)*1.0;
        const mx = messyPos[i].x + Math.sin(jitterT*1.7+i*0.9)*jitter[i].x*jStr*2;
        const my = messyPos[i].y + Math.cos(jitterT*1.3+i*1.1)*jitter[i].y*jStr*2;
        const mz = messyPos[i].z + Math.sin(jitterT*2.1+i*0.5)*jitter[i].z*jStr*2;
        nodePos[i].set(
          mx + (smoothPos[i].x - mx)*lerpFac,
          my + (smoothPos[i].y - my)*lerpFac,
          mz + (smoothPos[i].z - mz)*lerpFac
        );
      }
      smoothEdgeMat.opacity = easeOut(phaseT) * 0.55;
      noiseEdgeMat.opacity  = (1-lerpFac) * 0.18;
      flowMat.opacity       = 0.0;
      updateNodeMeshes();

    } else if(phase===2){
      // HOLD_SMOOTH: nodes settled, gentle breathing scale, data flow active
      for(let i=0;i<NODE_COUNT;i++) nodePos[i].copy(smoothPos[i]);
      smoothEdgeMat.opacity = 0.50 + 0.05*Math.sin(globalT*1.2);
      noiseEdgeMat.opacity  = 0.0;
      flowMat.opacity = Math.min(phaseT*4, 1)*0.75;
      updateFlow();

      // Node breathing pulse combined with mouse proximity scaling
      updateNodeMeshes(i => 1.0 + 0.15*Math.sin(globalT*2.2 + i*0.4));

    } else if(phase===3){
      // DISSOLVE: lerp smooth → messy
      const lerpFac = easeIn(phaseT);
      jitterT += 0.05;
      for(let i=0;i<NODE_COUNT;i++){
        const jStr = lerpFac;
        const mx = messyPos[i].x + Math.sin(jitterT*1.7+i*0.9)*jitter[i].x*jStr*2;
        const my = messyPos[i].y + Math.cos(jitterT*1.3+i*1.1)*jitter[i].y*jStr*2;
        const mz = messyPos[i].z + Math.sin(jitterT*2.1+i*0.5)*jitter[i].z*jStr*2;
        nodePos[i].set(
          smoothPos[i].x + (mx - smoothPos[i].x)*lerpFac,
          my + (smoothPos[i].y - my)*lerpFac,
          mz + (smoothPos[i].z - mz)*lerpFac
        );
      }
      smoothEdgeMat.opacity = (1-easeOut(phaseT)) * 0.50;
      noiseEdgeMat.opacity  = easeOut(phaseT) * 0.18;
      flowMat.opacity       = Math.max(0, (1-phaseT*3)) * 0.75;
      if(flowMat.opacity>0) updateFlow();
      updateNodeMeshes();
    }

    /* ── 3. update edge geometry with interactive flex ── */
    updateEdgeGeo(edgePosArr, EDGES);
    smoothEdgeGeo.attributes.position.needsUpdate = true;
    updateEdgeGeo(noisePosArr, NOISE_EDGES);
    noiseEdgeGeo.attributes.position.needsUpdate = true;

    /* ── 4. node colour: shift with theme & mouse excitation ── */
    const smoothness = phase===2 ? 1 : phase===1 ? easeInOut(phaseT) : phase===3 ? 1-easeIn(phaseT) : 0;
    const isDarkTheme = currentTheme() === 'dark';
    const baseColors = isDarkTheme ? NODE_COLORS_DARK : NODE_COLORS;
    const messyTarget = isDarkTheme ? PURPLE : new THREE.Color(0xB23368);
    const highlightColor = isDarkTheme ? new THREE.Color(0xFF8A2E) : new THREE.Color(0x00D4FF);

    for(let i=0;i<NODE_COUNT;i++){
      const base = baseColors[i];
      const messy = base.clone().lerp(messyTarget, 0.4);
      let col = messy.lerp(base, smoothness);

      // Mouse proximity excitation glow
      const pushDist = Math.hypot(nodeOffset[i].x, nodeOffset[i].y);
      if(pushDist > 0.05){
        col = col.clone().lerp(highlightColor, Math.min(pushDist * 0.8, 0.9));
      }
      col.toArray(nodeIM.instanceColor.array, i*3);
    }
    nodeIM.instanceColor.needsUpdate = true;

    /* ── 5. camera: multi-axis dynamic mouse parallax & perspective tilt ── */
    const targetCamX = curMouseX * 3.2 + Math.sin(globalT*0.065)*1.0;
    const targetCamY = -curMouseY * 2.0 + Math.cos(globalT*0.048)*0.45;
    camera.position.x += (targetCamX - camera.position.x) * 0.045;
    camera.position.y += (targetCamY - camera.position.y) * 0.045;
    camera.position.z = 14 + rawScrollY*0.012;

    // 3D perspective pitch, yaw and roll tilt
    camera.rotation.y = -camera.position.x * 0.018;
    camera.rotation.x = camera.position.y * 0.016;
    camera.rotation.z = -curMouseX * 0.008;

    /* ── 6. scroll fade ── */
    const fade = Math.max(0, 1 - scrollFactor*1.5);
    nodeIM.material.opacity        = 0.92*fade;
    smoothEdgeMat.opacity         *= fade;
    noiseEdgeMat.opacity          *= fade;
    flowMat.opacity               *= fade;
    bgMat.opacity                  = 0.30*fade;

    /* ── 7. holographic core: interactive 3D orientation & kinetic HUD spin ── */
    coreMesh.rotation.y = globalT * 0.09 + curMouseX * 0.35;
    coreMesh.rotation.x = globalT * 0.05 - curMouseY * 0.25;
    glowMesh.rotation.y = -globalT * 0.05;
    hudRings.forEach(r => {
      r.rotation.z += (r.userData.speed * 0.01) * (1 + mouseSpeed * 1.5);
    });
    coreGroup.position.x += (curMouseX * 2.2 - coreGroup.position.x) * 0.05;
    coreGroup.position.y += (-curMouseY * 1.4 - coreGroup.position.y) * 0.05;
    coreMat.opacity  = 0.22 * fade;
    glowMat.uniforms && (glowMesh.material.opacity = fade);
    hudRings.forEach(r => { r.material.opacity = 0.28 * fade; });

    // scan sweep: drifts from top to bottom
    const sweepCycle = 6.5;
    const sweepPhase = (globalT % sweepCycle) / sweepCycle;
    sweepMesh.position.y = 7 - sweepPhase * 14;
    const edgeFade = Math.sin(sweepPhase * Math.PI);
    sweepMat.opacity = 0.10 * edgeFade * fade;

    renderer.render(scene, camera);
  }
  animate();

  /* ── resize ── */
  window.addEventListener('resize', ()=>{
    W=hero.clientWidth; H=hero.clientHeight;
    camera.aspect=W/H; camera.updateProjectionMatrix();
    renderer.setSize(W,H);
  });

  /* ── theme reactivity ── */
  window.addEventListener('themechange', e=>{
    const theme = (e.detail&&e.detail.theme)||currentTheme();
    bgMat.color.set(bgColorByTheme[theme]);
    try{ applyNodeThemeColors(theme); }catch(err){/* graceful */}
    try{ applyCoreTheme(theme); }catch(err){/* graceful */}
    try{ applyBeaconTheme(theme); }catch(err){/* graceful */}
  });
})();
