/**
 * BEKHRUZ NEWS — Choreographed to the exact ukulele plucks, bass drop,
 * 126.3 BPM island swing groove, turnaround strums, and 15.75s high-tremolo solo
 * of assets/hawaiian-intro.mp3!
 */
(function (global) {
  'use strict';

  // Exact musical timestamps in assets/hawaiian-intro.mp3:
  // 0.18s: Solo Ukulele Strum #1
  // 1.15s: Solo Ukulele Strum #2
  // 2.15s - 3.92s: 8 Rapid Descending Ukulele Plucks (Cards 1..8 pop into orbit!)
  // 4.10s - 4.45s: Pickup Bass Slide
  // 4.50s: Full Rhythm & Upright Bass Drop (~126.3 BPM, beat interval = 0.475s)
  // 7.35s - 14.80s: Main Melody A-Section (4 kinetic headline phrases)
  // 14.85s, 15.10s, 15.35s, 15.60s: 4 Rhythmic Turnaround Strums
  // 15.75s - 20.50s: Dazzling High-Tremolo Ukulele Solo Climax -> Grand 3D Title Lockup + Hibiscus Shower!
  // 20.50s - 24.25s: Joyful Melodic Resolution -> Enters Waikiki Beach Studio on the 24.25s acoustic break!

  const CARD_SPAWN_PLUCKS = [2.15, 2.40, 2.65, 2.90, 3.15, 3.40, 3.65, 3.90];
  const TURNAROUND_STRUMS = [14.85, 15.10, 15.35, 15.60];
  const BPM_INTERVAL = 0.475; // ~126.3 BPM

  const ORBIT_CARD_DATA = [
    {
      channel: 'ALOHA-01',
      tag: 'WAIKIKI',
      title: 'HONOLULU SUNSET LIVE',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="url(#g1)"/>
        <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f97316"/><stop offset="65%" stop-color="#fbbf24"/><stop offset="66%" stop-color="#0d9488"/><stop offset="100%" stop-color="#042f2e"/></linearGradient></defs>
        <circle cx="80" cy="44" r="18" fill="#fef08a" opacity="0.9"/>
        <path d="M90,52 L115,34 L132,32 L152,52 Z" fill="#451a03"/>
        <path d="M18,75 Q26,42 36,20" stroke="#271206" stroke-width="4" stroke-linecap="round"/>
        <path d="M36,20 Q54,14 64,26 M36,20 Q52,24 56,38 M36,20 Q20,16 12,28 M36,20 Q22,26 18,40" stroke="#064e3b" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`
    },
    {
      channel: 'ALOHA-02',
      tag: 'SURF',
      title: 'NORTH SHORE BARREL',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#064e63"/>
        <path d="M0,65 Q45,10 95,25 Q125,35 110,55 Q95,65 80,50 Q92,38 72,36 Q42,35 25,68 Z" fill="#2dd4bf"/>
        <path d="M20,68 Q55,22 95,30" stroke="#fef9c3" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="95" cy="52" rx="16" ry="4" transform="rotate(-24 95 52)" fill="#fbbf24" stroke="#fff" stroke-width="1.2"/>
      </svg>`
    },
    {
      channel: 'ALOHA-03',
      tag: 'VOLCANO',
      title: 'KILAUEA LAVA WATCH',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#1c1018"/>
        <circle cx="80" cy="20" r="14" fill="#f97316" opacity="0.45"/>
        <polygon points="20,76 64,28 96,28 140,76" fill="#2e160b" stroke="#ea580c" stroke-width="1.5"/>
        <path d="M70,28 Q80,45 74,76 M82,28 Q90,50 98,76 M76,28 Q64,48 52,76" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="75" cy="18" r="3" fill="#fef08a"/><circle cx="86" cy="14" r="2.5" fill="#fb923c"/><circle cx="68" cy="12" r="2" fill="#f43f5e"/>
      </svg>`
    },
    {
      channel: 'ALOHA-04',
      tag: 'REEF',
      title: 'HONU SEA TURTLE',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#043f4e"/>
        <ellipse cx="80" cy="42" rx="22" ry="16" fill="#065f46" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="108" cy="42" r="7" fill="#10b981"/>
        <path d="M88,26 Q102,12 114,22 Q100,28 88,26 Z" fill="#10b981"/>
        <path d="M88,58 Q102,72 114,62 Q100,56 88,58 Z" fill="#10b981"/>
        <path d="M60,30 Q48,22 44,30 M60,54 Q48,62 44,54" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
      </svg>`
    },
    {
      channel: 'ALOHA-05',
      tag: 'LUAU',
      title: 'UKULELE & HULA',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#3b1728"/>
        <circle cx="62" cy="46" r="14" fill="#d97706" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="78" cy="38" r="11" fill="#d97706" stroke="#fef08a" stroke-width="1.5"/>
        <circle cx="72" cy="42" r="4" fill="#451a03"/>
        <line x1="86" y1="33" x2="118" y2="16" stroke="#fde68a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="42" cy="24" r="8" fill="#f43f5e"/><circle cx="42" cy="24" r="2.5" fill="#fef08a"/>
      </svg>`
    },
    {
      channel: 'ALOHA-06',
      tag: 'ISLANDS',
      title: 'ARCHIPELAGO SUMMIT',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#06374b"/>
        <circle cx="28" cy="24" r="5" fill="#2dd4bf" stroke="#fef08a" stroke-width="1.2"/>
        <circle cx="52" cy="30" r="7" fill="#2dd4bf" stroke="#fef08a" stroke-width="1.2"/>
        <circle cx="76" cy="36" r="6" fill="#2dd4bf" stroke="#fef08a" stroke-width="1.2"/>
        <circle cx="96" cy="42" r="8" fill="#2dd4bf" stroke="#fef08a" stroke-width="1.2"/>
        <circle cx="124" cy="56" r="13" fill="#f97316" stroke="#fef08a" stroke-width="1.8"/>
      </svg>`
    },
    {
      channel: 'ALOHA-07',
      tag: 'TROPICS',
      title: 'PINEAPPLE & TRADE',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#1e293b"/>
        <ellipse cx="52" cy="48" rx="13" ry="17" fill="#f59e0b" stroke="#fef08a" stroke-width="1.5"/>
        <path d="M52,30 L44,14 M52,30 L52,11 M52,30 L60,14" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
        <path d="M84,56 L98,42 L112,48 L128,26 L142,20" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round"/>
      </svg>`
    },
    {
      channel: 'ALOHA-08',
      tag: 'MAUNA KEA',
      title: 'PACIFIC SPACE DOME',
      svg: `<svg viewBox="0 0 160 80" fill="none">
        <rect width="160" height="80" fill="#091526"/>
        <path d="M10,76 L55,44 L105,44 L150,76 Z" fill="#334155"/>
        <path d="M58,44 A14,14 0 0,1 86,44 Z" fill="#f8fafc"/>
        <path d="M88,44 A11,11 0 0,1 110,44 Z" fill="#e2e8f0"/>
        <circle cx="34" cy="20" r="1.5" fill="#fef08a"/><circle cx="122" cy="18" r="2" fill="#fef08a"/><circle cx="80" cy="12" r="1.8" fill="#2dd4bf"/>
      </svg>`
    }
  ];

  function buildRealisticPalmJungle() {
    const container = document.getElementById('palm-jungle-layer');
    if (!container) return;

    function generateFrondSVG(x1, y1, cx, cy, x2, y2, leafletCount, swayClass, tint) {
      let leaflets = '';
      for (let i = 2; i <= leafletCount; i++) {
        const t = i / leafletCount;
        const inv = 1 - t;
        const px = inv * inv * x1 + 2 * inv * t * cx + t * t * x2;
        const py = inv * inv * y1 + 2 * inv * t * cy + t * t * y2;
        const tx = 2 * inv * (cx - x1) + 2 * t * (x2 - cx);
        const ty = 2 * inv * (cy - y1) + 2 * t * (y2 - cy);
        const len = Math.hypot(tx, ty) || 1;
        const nx = -ty / len;
        const ny = tx / len;

        const env = Math.sin(t * Math.PI);
        const lLen = 18 + env * 54;
        const droop = 14 + t * 26;

        const lx1 = px + nx * lLen * 0.75 + (tx / len) * 14;
        const ly1 = py + ny * lLen * 0.75 + droop;
        const lx2 = px - nx * lLen * 0.85 + (tx / len) * 12;
        const ly2 = py - ny * lLen * 0.85 + droop * 1.15;

        leaflets += `<path d="M${px.toFixed(1)},${py.toFixed(1)} Q${((px + lx1) * 0.5).toFixed(1)},${(py - 4).toFixed(1)} ${lx1.toFixed(1)},${ly1.toFixed(1)} Q${((px + lx1) * 0.5).toFixed(1)},${(py + 3).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} Z" fill="${tint}"/>`;
        leaflets += `<path d="M${px.toFixed(1)},${py.toFixed(1)} Q${((px + lx2) * 0.5).toFixed(1)},${(py + 2).toFixed(1)} ${lx2.toFixed(1)},${ly2.toFixed(1)} Q${((px + lx2) * 0.5).toFixed(1)},${(py + 7).toFixed(1)} ${px.toFixed(1)},${py.toFixed(1)} Z" fill="${tint}"/>`;
      }
      return `
        <g class="palm-crown-frond ${swayClass}">
          <path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" stroke="#fbbf24" stroke-width="2.6" stroke-linecap="round" fill="none" opacity="0.7"/>
          ${leaflets}
        </g>
      `;
    }

    function createPalmTreeSVG(sideClass) {
      const fronds = [
        generateFrondSVG(95, 195, 220, 65, 390, 95, 26, 'frond-sway-1', 'url(#leafGradBright)'),
        generateFrondSVG(95, 195, 240, 130, 420, 215, 28, 'frond-sway-2', 'url(#leafGradMid)'),
        generateFrondSVG(95, 195, 190, 195, 345, 325, 24, 'frond-sway-3', 'url(#leafGradDark)'),
        generateFrondSVG(95, 195, 160, 25, 300, 20, 22, 'frond-sway-4', 'url(#leafGradBright)'),
        generateFrondSVG(95, 195, 35, 75, -40, 120, 18, 'frond-sway-5', 'url(#leafGradMid)'),
        generateFrondSVG(95, 195, 120, 250, 230, 410, 20, 'frond-sway-2', 'url(#leafGradDark)')
      ].join('');

      return `
        <svg class="palm-tree-svg ${sideClass}" viewBox="0 0 460 720" preserveAspectRatio="xMinYMin slice">
          <defs>
            <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#1c0d06"/>
              <stop offset="65%" stop-color="#451a03"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </linearGradient>
            <linearGradient id="leafGradBright" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#065f46"/>
              <stop offset="65%" stop-color="#047857"/>
              <stop offset="100%" stop-color="#fbbf24"/>
            </linearGradient>
            <linearGradient id="leafGradMid" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#064e3b"/>
              <stop offset="75%" stop-color="#0f766e"/>
              <stop offset="100%" stop-color="#f97316"/>
            </linearGradient>
            <linearGradient id="leafGradDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#022c22"/>
              <stop offset="100%" stop-color="#115e59"/>
            </linearGradient>
          </defs>
          <path d="M-25,740 Q15,520 52,360 Q75,260 86,195 L106,198 Q98,265 82,365 Q52,525 22,740 Z" fill="url(#trunkGrad)"/>
          <g stroke="rgba(251,191,36,0.28)" stroke-width="1.6" fill="none">
            <path d="M5,660 Q22,655 34,664"/><path d="M16,600 Q33,595 44,604"/><path d="M27,540 Q44,535 55,544"/>
            <path d="M38,480 Q54,475 64,484"/><path d="M48,420 Q64,415 73,424"/><path d="M59,360 Q73,355 82,364"/>
            <path d="M69,300 Q82,296 90,304"/><path d="M78,245 Q90,242 98,249"/>
          </g>
          ${fronds}
          <circle cx="88" cy="204" r="11" fill="#451a03" stroke="#d97706" stroke-width="1.5"/>
          <circle cx="103" cy="208" r="12" fill="#271206" stroke="#f59e0b" stroke-width="1.5"/>
          <circle cx="95" cy="218" r="11" fill="#3b1908" stroke="#fbbf24" stroke-width="1.2"/>
          <g transform="translate(8, 575)">
            <path d="M-20,140 Q30,60 120,85 Q65,135 -20,140 Z" fill="url(#leafGradMid)"/>
            <path d="M-10,145 Q55,35 155,45 Q95,115 -10,145 Z" fill="url(#leafGradBright)" opacity="0.88"/>
            <g transform="translate(52, 88)">
              <circle cx="0" cy="-14" r="13" fill="#f43f5e"/><circle cx="14" cy="-4" r="13" fill="#e11d48"/>
              <circle cx="9" cy="12" r="13" fill="#f43f5e"/><circle cx="-9" cy="12" r="13" fill="#fb7185"/>
              <circle cx="-14" cy="-4" r="13" fill="#e11d48"/><circle cx="0" cy="0" r="6" fill="#7f1d1d"/>
              <line x1="0" y1="0" x2="12" y2="-10" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="13" cy="-11" r="3" fill="#fde047"/>
            </g>
          </g>
        </svg>
      `;
    }

    container.innerHTML = createPalmTreeSVG('palm-tree-left') + createPalmTreeSVG('palm-tree-right');
  }

  class BroadcastCanvas {
    constructor(canvas2d) {
      this.canvas = canvas2d;
      this.ctx = canvas2d.getContext('2d');
      this.webglContainer = document.getElementById('webgl-globe-container');
      this.sunGlowEl = document.getElementById('sunset-sun-glow');

      this.width = 0;
      this.height = 0;
      this.rotation = 3.82; // Facing Hawaii
      this.mode = 'standby';
      this.introTime = 0;
      this.beatPulse = 0; // 0..1 rhythmic bounce impulse

      buildRealisticPalmJungle();

      this.particles = this.buildParticles(75);
      this.shockwaves = [];
      this.hibiscusBursts = [];

      this.initWebGLGlobe();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    triggerShockwave(color = '#fef08a', maxRadiusRatio = 0.45) {
      this.shockwaves.push({
        r: 0.04,
        maxR: maxRadiusRatio,
        alpha: 0.95,
        color
      });
    }

    triggerHibiscusBurst(count = 24) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = 0.18 + Math.random() * 0.42;
        this.hibiscusBursts.push({
          x: 0.5,
          y: 0.5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 5,
          size: 10 + Math.random() * 14,
          alpha: 1,
          petalColor: i % 2 === 0 ? '#f43f5e' : '#fbbf24'
        });
      }
    }

    initWebGLGlobe() {
      if (!global.THREE || !this.webglContainer) return;
      const THREE = global.THREE;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 100);
      this.camera.position.set(0, 0, 3.35);

      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.webglContainer.innerHTML = '';
      this.webglContainer.appendChild(this.renderer.domElement);

      this.globeGroup = new THREE.Group();
      this.globeGroup.rotation.z = -0.15;
      this.globeGroup.rotation.x = 0.22;
      this.scene.add(this.globeGroup);

      const ambient = new THREE.AmbientLight(0x88ccee, 0.88);
      this.scene.add(ambient);

      const sunLight = new THREE.DirectionalLight(0xffb347, 1.5);
      sunLight.position.set(4, 2, 4);
      this.scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.88);
      rimLight.position.set(-4, -2, -2);
      this.scene.add(rimLight);

      const loader = new THREE.TextureLoader();
      const texData = global.EARTH_TEXTURES || {};
      const dayTex = texData.day ? loader.load(texData.day) : null;
      const bumpTex = texData.bump ? loader.load(texData.bump) : null;
      const waterTex = texData.water ? loader.load(texData.water) : null;

      const earthGeo = new THREE.SphereGeometry(1, 64, 64);
      const earthMat = new THREE.MeshPhongMaterial({
        map: dayTex,
        bumpMap: bumpTex,
        bumpScale: 0.04,
        specularMap: waterTex,
        specular: new THREE.Color(0xffaa44),
        shininess: 32
      });
      this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
      this.globeGroup.add(this.earthMesh);

      const cloudCanvas = this.createCloudTextureCanvas();
      const cloudTex = new THREE.CanvasTexture(cloudCanvas);
      const cloudGeo = new THREE.SphereGeometry(1.016, 48, 48);
      const cloudMat = new THREE.MeshLambertMaterial({
        map: cloudTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      this.globeGroup.add(this.cloudMesh);

      const haloGeo = new THREE.SphereGeometry(1.09, 48, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.14,
        side: THREE.BackSide
      });
      this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
      this.globeGroup.add(this.haloMesh);

      this.build3DHawaiiArcs();
    }

    createCloudTextureCanvas() {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 512;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);

      for (let i = 0; i < 320; i++) {
        const x = Math.random() * c.width;
        const y = 60 + Math.random() * (c.height - 120);
        const rx = 18 + Math.random() * 65;
        const ry = 5 + Math.random() * 16;
        const grad = ctx.createRadialGradient(x, y, 1, x, y, rx);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return c;
    }

    latLonToVector3(lat, lon, radius = 1) {
      const THREE = global.THREE;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    }

    build3DHawaiiArcs() {
      const THREE = global.THREE;
      if (!THREE) return;

      const honolulu = { lat: 21.3, lon: -157.8 };
      const destinations = [
        { lat: 35.7, lon: 139.7 },
        { lat: 37.7, lon: -122.4 },
        { lat: -33.9, lon: 151.2 },
        { lat: 1.3, lon: 103.8 },
        { lat: 40.7, lon: -74.0 },
        { lat: -17.5, lon: -149.5 }
      ];

      const hPos = this.latLonToVector3(honolulu.lat, honolulu.lon, 1.012);
      const pinGeo = new THREE.SphereGeometry(0.028, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(hPos);
      this.earthMesh.add(pinMesh);

      const ringGeo = new THREE.RingGeometry(0.038, 0.058, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      this.hawaiiRing = new THREE.Mesh(ringGeo, ringMat);
      this.hawaiiRing.position.copy(this.latLonToVector3(honolulu.lat, honolulu.lon, 1.015));
      this.hawaiiRing.lookAt(new THREE.Vector3(0, 0, 0));
      this.earthMesh.add(this.hawaiiRing);

      this.pulseBeads = [];

      destinations.forEach((dest, idx) => {
        const start = this.latLonToVector3(honolulu.lat, honolulu.lon, 1.005);
        const end = this.latLonToVector3(dest.lat, dest.lon, 1.005);
        const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.26);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.0055, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: idx % 2 === 0 ? 0xfbbf24 : 0x2dd4bf,
          transparent: true,
          opacity: 0.75
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        this.earthMesh.add(tubeMesh);

        const beadGeo = new THREE.SphereGeometry(0.015, 12, 12);
        const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bead = new THREE.Mesh(beadGeo, beadMat);
        this.earthMesh.add(bead);
        this.pulseBeads.push({ bead, curve, phase: idx * 0.18 });
      });
    }

    buildParticles(count) {
      const list = [];
      for (let i = 0; i < count; i++) {
        list.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 2.5 + 1.0,
          vy: -(Math.random() * 0.00055 + 0.00018),
          vx: (Math.random() - 0.5) * 0.00035,
          alpha: Math.random() * 0.7 + 0.2,
          color: i % 3 === 0 ? '#fb7185' : i % 2 === 0 ? '#fbbf24' : '#2dd4bf'
        });
      }
      return list;
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = Math.max(1, Math.floor(this.width * dpr));
      this.canvas.height = Math.max(1, Math.floor(this.height * dpr));
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (this.renderer && this.camera) {
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / Math.max(1, this.height);
        this.camera.updateProjectionMatrix();
      }
    }

    setMode(mode, introTime = 0, beatPulse = 0) {
      this.mode = mode;
      this.introTime = introTime;
      this.beatPulse = beatPulse;
    }

    render(dt) {
      const w = this.width;
      const h = this.height;
      if (!w || !h) return;

      let spinSpeed = 0.22;
      let globeScale = 1.0;

      if (this.mode === 'intro') {
        const t = this.introTime;
        if (t < 2.15) {
          // Act I: Solo Ukulele Strums (0.0 - 2.15s) — focused on Hawaii in the Pacific
          const p = Math.min(1, t / 1.8);
          globeScale = 0.42 + 0.56 * easeOutCubic(p) + this.beatPulse * 0.07;
          spinSpeed = 0.18;
        } else if (t < 4.50) {
          // Rapid descending ukulele notes (2.15 - 4.50s) — cards spawn around Earth
          globeScale = 0.98 + this.beatPulse * 0.06;
          spinSpeed = 0.45;
        } else if (t < 14.80) {
          // Act II & III: Full 126.3 BPM Ukulele Groove (4.50 - 14.80s)
          spinSpeed = 0.65;
          globeScale = 1.02 + this.beatPulse * 0.065;
        } else if (t < 15.75) {
          // Turnaround Strums (14.80 - 15.75s) — dramatic zoom buildup
          const p = (t - 14.80) / 0.95;
          globeScale = 1.02 + p * 0.16 + this.beatPulse * 0.08;
          spinSpeed = 1.25;
        } else {
          // Act IV: High Tremolo Solo Climax & Resolution (15.75 - 24.3s)
          spinSpeed = 0.42;
          globeScale = 1.12 + this.beatPulse * 0.045;
        }
      } else if (this.mode === 'studio') {
        spinSpeed = 0.15;
        globeScale = 1.08 + this.beatPulse * 0.025;
      }

      this.rotation += dt * spinSpeed;

      // Pulse sunset glow with ukulele beat
      if (this.sunGlowEl) {
        const s = 1 + this.beatPulse * 0.12;
        this.sunGlowEl.style.transform = `translate(-50%, 38%) scale(${s.toFixed(3)})`;
      }

      if (this.renderer && this.scene && this.camera && this.earthMesh) {
        this.earthMesh.rotation.y = this.rotation;
        if (this.cloudMesh) {
          this.cloudMesh.rotation.y = this.rotation * 1.14;
        }
        this.globeGroup.scale.setScalar(globeScale);

        if (this.hawaiiRing) {
          const s = 1 + Math.sin(performance.now() * 0.008) * 0.3 + this.beatPulse * 0.4;
          this.hawaiiRing.scale.set(s, s, 1);
        }

        if (this.pulseBeads) {
          const nowT = performance.now() * 0.00065;
          for (const item of this.pulseBeads) {
            const u = (nowT + item.phase) % 1;
            const pos = item.curve.getPoint(u);
            item.bead.position.copy(pos);
          }
        }

        this.renderer.render(this.scene, this.camera);
      }

      // 2D Overlay: Shockwaves, Hibiscus Flower Bursts & Tropical Fireflies
      const ctx = this.ctx;
      ctx.clearRect(0, 0, w, h);

      // 1. Ukulele Strum Shockwaves
      const minDim = Math.min(w, h);
      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += dt * 0.55;
        sw.alpha -= dt * 1.25;
        if (sw.alpha <= 0 || sw.r >= sw.maxR) {
          this.shockwaves.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.5, sw.r * minDim, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Hibiscus Petal Bursts
      for (let i = this.hibiscusBursts.length - 1; i >= 0; i--) {
        const hb = this.hibiscusBursts[i];
        hb.x += hb.vx * dt;
        hb.y += hb.vy * dt;
        hb.vy += 0.12 * dt; // gentle gravity
        hb.rot += hb.vRot * dt;
        hb.alpha -= dt * 0.38;
        if (hb.alpha <= 0) {
          this.hibiscusBursts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(hb.x * w, hb.y * h);
        ctx.rotate(hb.rot);
        ctx.globalAlpha = Math.max(0, hb.alpha);
        // Draw 5-petal hibiscus flower
        for (let p = 0; p < 5; p++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.beginPath();
          ctx.arc(0, -hb.size * 0.45, hb.size * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = hb.petalColor;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, hb.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.restore();
      }

      // 3. Floating Tropical Fireflies
      ctx.save();
      for (const p of this.particles) {
        p.x += p.vx * (dt * 60);
        p.y += p.vy * (dt * 60);
        if (p.y < 0) p.y = 1;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * (1 + this.beatPulse * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class IntroDirector {
    constructor({ audio, canvasController, onProgress, onComplete }) {
      this.audio = audio;
      this.canvasController = canvasController;
      this.onProgress = onProgress;
      this.onComplete = onComplete;

      this.flareH = document.getElementById('intro-flare-h');
      this.flareCore = document.getElementById('intro-flare-core');
      this.rings = document.getElementById('intro-rings');
      this.lockup = document.getElementById('intro-lockup');
      this.hudTop = document.querySelector('.broadcast-hud-top');
      this.hudActLabel = document.getElementById('hud-act-label');
      this.lowerThird = document.getElementById('lower-third');
      this.spectrumEl = document.getElementById('spectrum-bars');
      this.orbitStage = document.getElementById('orbit-cards-stage');
      this.kineticWords = Array.from(document.querySelectorAll('.kinetic-word'));
      this.pluckCallout1 = document.getElementById('pluck-callout-1');
      this.pluckCallout2 = document.getElementById('pluck-callout-2');

      this.rafId = null;
      this.running = false;
      this.triggeredEvents = new Set();
      this.triggeredWords = new Set();
      this.climaxTriggered = false;
      this.bars = [];
      this.orbitCards = [];
      // Full 4-Act Ukulele Intro runs 00:00 -> 00:24.25 (right on the sharp acoustic break!)
      this.duration = 24.25;

      this.buildSpectrumBars(36);
      this.buildOrbitCards();
    }

    buildSpectrumBars(count) {
      if (!this.spectrumEl) return;
      this.spectrumEl.innerHTML = '';
      this.bars = [];
      for (let i = 0; i < count; i++) {
        const bar = document.createElement('div');
        bar.className = 'spectrum-bar';
        this.spectrumEl.appendChild(bar);
        this.bars.push(bar);
      }
    }

    buildOrbitCards() {
      if (!this.orbitStage) return;
      this.orbitStage.innerHTML = '';
      this.orbitCards = ORBIT_CARD_DATA.map((item, idx) => {
        const el = document.createElement('div');
        el.className = 'orbit-card';
        el.innerHTML = `
          <div class="orbit-card-header">
            <span>🌺 ${item.channel}</span>
            <span class="orbit-card-tag">${item.tag}</span>
          </div>
          <div class="orbit-card-art">${item.svg}</div>
          <div class="orbit-card-title">${item.title}</div>
        `;
        this.orbitStage.appendChild(el);
        return {
          el,
          spawnAt: CARD_SPAWN_PLUCKS[idx] || 2.2,
          baseAngle: (idx / ORBIT_CARD_DATA.length) * Math.PI * 2,
          yWaveOffset: (idx % 2 === 0 ? 1 : -1) * (18 + (idx % 3) * 14)
        };
      });
    }

    resetVisuals() {
      this.triggeredEvents.clear();
      this.triggeredWords.clear();
      this.climaxTriggered = false;
      this.kineticWords.forEach((w) => w.classList.remove('pop'));
      if (this.rings) this.rings.classList.remove('visible');
      if (this.lockup) {
        this.lockup.classList.remove('revealed');
        this.lockup.style.transform = '';
      }
      if (this.hudTop) this.hudTop.classList.remove('visible');
      if (this.lowerThird) this.lowerThird.classList.remove('visible');
      if (this.spectrumEl) this.spectrumEl.classList.remove('visible');
      if (this.pluckCallout1) this.pluckCallout1.className = 'pluck-callout';
      if (this.pluckCallout2) this.pluckCallout2.className = 'pluck-callout';
      if (this.hudActLabel) this.hudActLabel.textContent = 'ALOHA • LIVE';
      if (this.flareH) {
        this.flareH.style.opacity = '0';
        this.flareH.style.transform = 'translateY(-50%) scaleX(0.1)';
      }
      if (this.flareCore) {
        this.flareCore.style.opacity = '0';
        this.flareCore.style.transform = 'translate(-50%, -50%) scale(0)';
      }
      this.orbitCards.forEach((c) => {
        c.el.style.opacity = '0';
      });
    }

     fireOnce(key, fn) {
      if (!this.triggeredEvents.has(key)) {
        this.triggeredEvents.add(key);
        fn();
      }
    }

    computeBeatPulse(t) {
      // Before 4.50s, pulse on exact solo ukulele plucks
      const soloPlucks = [0.18, 1.15, ...CARD_SPAWN_PLUCKS, 4.15];
      let pulse = 0;
      for (const pt of soloPlucks) {
        const dist = t - pt;
        if (dist >= 0 && dist < 0.25) {
          pulse = Math.max(pulse, 1 - dist / 0.25);
        }
      }
      // From 4.50s onward, lock to the 126.3 BPM rhythm section groove!
      if (t >= 4.50) {
        const beatPhase = ((t - 4.50) % BPM_INTERVAL) / BPM_INTERVAL;
        const groovePulse = Math.pow(Math.max(0, 1 - beatPhase * 1.8), 2);
        pulse = Math.max(pulse, groovePulse);
      }
      return pulse;
    }

    start() {
      this.stop();
      this.resetVisuals();
      this.running = true;

      this.audio.volume = 1;
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }

      const startWall = performance.now();
      const tick = () => {
        if (!this.running) return;
        const t = !this.audio.paused && this.audio.currentTime > 0
          ? this.audio.currentTime
          : (performance.now() - startWall) / 1000;

        this.updateTimeline(t);

        if (typeof this.onProgress === 'function') {
          this.onProgress(Math.min(1, t / this.duration));
        }

        if (t >= this.duration) {
          this.finish();
          return;
        }
        this.rafId = requestAnimationFrame(tick);
      };
      this.rafId = requestAnimationFrame(tick);
    }

    updateTimeline(t) {
      const beatPulse = this.computeBeatPulse(t);
      this.canvasController.setMode('intro', t, beatPulse);

      if (t >= 0.15 && this.hudTop) this.hudTop.classList.add('visible');

      // =====================================================
      // ACT I (0.00s - 4.45s): SOLO UKULELE CALL & 8 PLUCKS
      // =====================================================
      if (t < 4.50 && this.hudActLabel) {
        this.hudActLabel.textContent = 'ACT I • UKULELE CALL';
      }

      // 0.18s: First Ukulele Strum
      if (t >= 0.16) {
        this.fireOnce('strum-1', () => {
          this.canvasController.triggerShockwave('#fef08a', 0.42);
          if (this.pluckCallout1) this.pluckCallout1.classList.add('pop');
        });
      }

      // 1.15s: Second Ukulele Strum
      if (t >= 1.12) {
        this.fireOnce('strum-2', () => {
          this.canvasController.triggerShockwave('#2dd4bf', 0.48);
          if (this.pluckCallout2) this.pluckCallout2.classList.add('pop');
        });
      }

      // Opening horizontal flare
      if (t < 2.1) {
        const p = Math.min(1, t / 1.2);
        const fade = t > 1.2 ? Math.max(0, 1 - (t - 1.2) / 0.9) : 1;
        if (this.flareH) {
          this.flareH.style.opacity = String(0.95 * fade);
          this.flareH.style.transform = `translateY(-50%) scaleX(${0.15 + p * 1.15})`;
        }
      }

      // 2.15s - 3.92s: 8 Rapid Descending Ukulele Plucks -> Spawn Cards 1..8!
      CARD_SPAWN_PLUCKS.forEach((pt, idx) => {
        if (t >= pt) {
          this.fireOnce(`card-pluck-${idx}`, () => {
            this.canvasController.triggerShockwave(idx % 2 === 0 ? '#fbbf24' : '#fb7185', 0.34);
          });
        }
      });

      // Hide opening callout pills right on the 4.45s bass drop
      if (t >= 4.35) {
        this.fireOnce('hide-callouts', () => {
          if (this.pluckCallout1) this.pluckCallout1.classList.add('hide');
          if (this.pluckCallout2) this.pluckCallout2.classList.add('hide');
        });
      }

      // =====================================================
      // ACT II (4.50s - 7.30s): RHYTHM & UPRIGHT BASS DROP!
      // =====================================================
      if (t >= 4.50) {
        this.fireOnce('bass-drop', () => {
          this.canvasController.triggerShockwave('#f97316', 0.56);
          this.canvasController.triggerHibiscusBurst(16);
          if (this.rings) this.rings.classList.add('visible');
          if (this.lowerThird) this.lowerThird.classList.add('visible');
          if (this.spectrumEl) this.spectrumEl.classList.add('visible');
        });
        if (t < 7.30 && this.hudActLabel) {
          this.hudActLabel.textContent = 'ACT II • ISLAND GROOVE';
        }
      }

      // =====================================================
      // ACT III (7.30s - 15.70s): MAIN MELODY & TURNAROUND
      // =====================================================
      if (t >= 7.30 && t < 15.75 && this.hudActLabel) {
        this.hudActLabel.textContent = 'ACT III • TROPICAL HEADLINES';
      }

      for (const wordEl of this.kineticWords) {
        const triggerAt = parseFloat(wordEl.dataset.at || '0');
        if (t >= triggerAt && !this.triggeredWords.has(wordEl)) {
          this.triggeredWords.add(wordEl);
          wordEl.classList.add('pop');
          this.canvasController.triggerShockwave('#fef08a', 0.44);
        }
      }

      // 14.85s - 15.60s: 4 Rhythmic Turnaround Strums before Climax
      TURNAROUND_STRUMS.forEach((st, idx) => {
        if (t >= st) {
          this.fireOnce(`turnaround-${idx}`, () => {
            this.canvasController.triggerShockwave('#f43f5e', 0.5);
          });
        }
      });

      // =====================================================
      // ACT IV (15.75s - 24.25s): HIGH-TREMOLO CLIMAX & TITLE
      // =====================================================
      if (t >= 15.72 && !this.climaxTriggered) {
        this.climaxTriggered = true;
        if (this.lockup) this.lockup.classList.add('revealed');
        if (this.hudActLabel) this.hudActLabel.textContent = '🌺 ALOHA • LIVE ON AIR';
        this.canvasController.triggerHibiscusBurst(36);
        this.canvasController.triggerShockwave('#fef08a', 0.65);
      }

      // Second celebratory hibiscus burst at the 20.5s melodic resolution
      if (t >= 20.45) {
        this.fireOnce('resolution-burst', () => {
          this.canvasController.triggerHibiscusBurst(24);
          this.canvasController.triggerShockwave('#2dd4bf', 0.55);
        });
      }

      // Lens flare flash on 15.72s tremolo climax
      if (t >= 15.72 && t < 17.0 && this.flareCore) {
        const p = (t - 15.72) / 1.28;
        const scale = p < 0.25 ? (p / 0.25) * 3.1 : 3.1 + (p - 0.25) * 1.5;
        const opacity = p < 0.2 ? p / 0.2 : Math.max(0, 1 - (p - 0.2) / 0.8);
        this.flareCore.style.opacity = String(opacity);
        this.flareCore.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      // Beat-bounce the revealed 3D Title Lockup during Act IV
      if (this.climaxTriggered && this.lockup) {
        const bounceScale = 1 + beatPulse * 0.032;
        const swayDeg = Math.sin(t * 3.3) * 1.1;
        this.lockup.style.transform = `translateZ(0) scale(${bounceScale.toFixed(3)}) rotateZ(${swayDeg.toFixed(2)}deg)`;
      }

      this.updateOrbitCards(t, beatPulse);
      if (t >= 4.50) {
        this.animateSpectrum(t, beatPulse);
      }
    }

    updateOrbitCards(t, beatPulse) {
      if (!this.orbitCards.length || !this.orbitStage) return;
      const stageW = this.orbitStage.clientWidth || 1280;
      const stageH = this.orbitStage.clientHeight || 720;

      const climaxWiden = t > 15.72 ? Math.min(1, (t - 15.72) / 1.2) : 0;

      const radiusX = stageW * (0.28 + climaxWiden * 0.14);
      const radiusZ = stageW * (0.24 + climaxWiden * 0.08);
      const orbitSpeed = t < 4.50 ? 0.38 : t < 15.72 ? 0.78 : 0.42;

      for (const card of this.orbitCards) {
        if (t < card.spawnAt) {
          card.el.style.opacity = '0';
          continue;
        }
        // Spring pop-in when each card's ukulele note plucks!
        const sinceSpawn = t - card.spawnAt;
        const spawnPop = Math.min(1, sinceSpawn / 0.28);

        const angle = card.baseAngle + t * orbitSpeed;
        const x = Math.sin(angle) * radiusX;
        const z = Math.cos(angle) * radiusZ - 120;
        const y =
          Math.sin(angle * 2 + card.baseAngle) * (stageH * 0.08) +
          card.yWaveOffset -
          beatPulse * 10;

        const normZ = (z + radiusZ + 120) / (radiusZ * 2);
        const cardOpacity = spawnPop * (0.24 + 0.76 * normZ) * (1 - climaxWiden * 0.35);
        const rotY = (angle * 180) / Math.PI;
        const cardScale = (0.7 + 0.3 * spawnPop) * (1 + beatPulse * 0.045);

        card.el.style.opacity = cardOpacity.toFixed(3);
        card.el.style.zIndex = String(Math.round(normZ * 20));
        card.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${cardScale.toFixed(3)})`;
      }
    }

    animateSpectrum(t, beatPulse) {
      const len = this.bars.length;
      const isTremolo = t >= 15.72 && t < 20.5;
      const speedMult = isTremolo ? 28 : 16;

      for (let i = 0; i < len; i++) {
        const centerDist = Math.abs(i - len / 2) / (len / 2);
        const envelope = 1 - centerDist * 0.6;
        const wave =
          Math.sin(t * speedMult + i * 0.6) * 0.45 +
          Math.cos(t * (speedMult * 1.4) - i * 0.4) * 0.35 +
          0.55 +
          beatPulse * 0.45;
        const height = Math.max(5, Math.min(44, wave * 32 * envelope));
        this.bars[i].style.height = `${height.toFixed(1)}px`;
      }
    }

    stop() {
      this.running = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    finish() {
      this.stop();
      if (typeof this.onComplete === 'function') {
        this.onComplete();
      }
    }
  }

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  global.BroadcastCanvas = BroadcastCanvas;
  global.IntroDirector = IntroDirector;
})(window);
