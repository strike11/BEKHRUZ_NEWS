/*
 * Bekhruz News — island sunset backdrop.
 * Sky, sun, sea, islands and swaying palms drawn on one canvas.
 * Every shape is painted once into a small bitmap; each frame only moves those bitmaps,
 * so the picture stays smooth on ordinary laptops and projectors.
 */
(function (global) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const W = 1920;
  const H = 1080;
  const HZ = 640; // horizon
  const SX = 960; // sun x
  const OX = 960; // zoom origin
  const OY = 600;
  const RAD = Math.PI / 180;
  const MAX_CANVAS_W = 2304;

  const COLORS = {
    sky: [[0, '#1d1533'], [0.3, '#3b2155'], [0.56, '#8b3767'], [0.76, '#dc5d4d'], [0.9, '#f49a57'], [1, '#ffd98d']],
    sea: [[0, '#f7ab67'], [0.05, '#e27b5d'], [0.22, '#9d4266'], [0.55, '#45204f'], [1, '#160c25']],
    far: ['#c45f78', '#ea8c70'],
    isle: ['#7b3160', '#a04566'],
    distant: '#4a1e4b',
    back: '#2b1337',
    front: '#150a20',
    rim: 'rgba(242, 136, 91, 0.42)'
  };

  // ---------- helpers ----------
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const n1 = (v) => (Math.round(v * 10) / 10).toString();

  function make(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    if (attrs) {
      for (const k in attrs) node.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  const qb = (a, b, c, t) => {
    const u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * b.x + t * t * c.x, y: u * u * a.y + 2 * u * t * b.y + t * t * c.y };
  };
  const qd = (a, b, c, t) => ({
    x: 2 * (1 - t) * (b.x - a.x) + 2 * t * (c.x - b.x),
    y: 2 * (1 - t) * (b.y - a.y) + 2 * t * (c.y - b.y)
  });

  // bounding box of a path made only of absolute coordinate pairs (M, L, Q, C)
  function bbox(...paths) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const d of paths) {
      const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
      for (let i = 0; i + 1 < nums.length; i += 2) {
        const x = +nums[i];
        const y = +nums[i + 1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { x0, y0, x1, y1 };
  }

  function grad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  function radial(ctx, r, stops) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }

  // ---------- shapes ----------

  // One palm frond drawn around its own origin (the crown).
  function frondPath(angleDeg, L, droopDeg, rand, leafLen, count) {
    const a = angleDeg * RAD;
    const towardDown = Math.cos(a) >= 0 ? 1 : -1;
    const b = a + towardDown * droopDeg * RAD;
    const P0 = { x: 0, y: 0 };
    const P1 = { x: Math.cos(a) * L * 0.55, y: Math.sin(a) * L * 0.55 };
    const P2 = { x: P1.x + Math.cos(b) * L * 0.5, y: P1.y + Math.sin(b) * L * 0.5 };
    const leafMax = L * leafLen;
    const w = Math.max(1.6, L * 0.02);
    let d = '';

    for (let i = 2; i <= count; i++) {
      const t = i / count;
      const p = qb(P0, P1, P2, t);
      const dv = qd(P0, P1, P2, t);
      const dl = Math.hypot(dv.x, dv.y) || 1;
      const tx = dv.x / dl;
      const ty = dv.y / dl;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.94)), 0.55);
      for (const s of [1, -1]) {
        let lx = -ty * s * 0.85 + tx * 0.55;
        let ly = tx * s * 0.85 + ty * 0.55 + 0.55 + t * 0.35;
        const ll = Math.hypot(lx, ly) || 1;
        lx /= ll;
        ly /= ll;
        const len = leafMax * env * (0.78 + rand() * 0.36);
        const tip = { x: p.x + lx * len, y: p.y + ly * len + len * 0.14 };
        const mid = { x: p.x + lx * len * 0.5, y: p.y + ly * len * 0.5 - len * 0.03 };
        d += `M${n1(p.x + tx * w * 0.5)},${n1(p.y + ty * w * 0.5)}` +
          `Q${n1(mid.x + tx * w * 0.7)},${n1(mid.y + ty * w * 0.7)} ${n1(tip.x)},${n1(tip.y)}` +
          `Q${n1(mid.x - tx * w * 0.7)},${n1(mid.y - ty * w * 0.7)} ${n1(p.x - tx * w * 0.5)},${n1(p.y - ty * w * 0.5)}Z`;
      }
    }

    const left = [];
    const right = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const p = qb(P0, P1, P2, t);
      const dv = qd(P0, P1, P2, t);
      const dl = Math.hypot(dv.x, dv.y) || 1;
      const nx = -dv.y / dl;
      const ny = dv.x / dl;
      const sw = L * 0.018 * (1 - t * 0.85);
      left.push(`${n1(p.x + nx * sw)},${n1(p.y + ny * sw)}`);
      right.unshift(`${n1(p.x - nx * sw)},${n1(p.y - ny * sw)}`);
    }
    d += `M${left.join('L')}L${right.join('L')}Z`;
    return d;
  }

  // Curved, slightly segmented trunk with a warm rim on the side facing the sun.
  function trunkPaths(base, crown, bend, wBase, wTop) {
    const dx = crown.x - base.x;
    const dy = crown.y - base.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const c = { x: (base.x + crown.x) / 2 + nx * bend, y: (base.y + crown.y) / 2 + ny * bend };
    const N = 34;
    const left = [];
    const right = [];
    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = qb(base, c, crown, t);
      const dv = qd(base, c, crown, t);
      const dl = Math.hypot(dv.x, dv.y) || 1;
      const px = -dv.y / dl;
      const py = dv.x / dl;
      let w = wBase + (wTop - wBase) * Math.pow(t, 0.75);
      w *= 1 + 0.35 * Math.pow(Math.max(0, 1 - t * 6), 2);
      w *= 1 + 0.05 * Math.max(0, Math.sin(t * 70));
      const L = { x: p.x + px * w / 2, y: p.y + py * w / 2 };
      const R = { x: p.x - px * w / 2, y: p.y - py * w / 2 };
      leftPts.push(L);
      rightPts.push(R);
      left.push(`${n1(L.x)},${n1(L.y)}`);
      right.unshift(`${n1(R.x)},${n1(R.y)}`);
    }
    const fill = `M${left.join('L')}L${right.join('L')}Z`;
    const mid = Math.floor(N / 2);
    const useLeft = Math.abs(leftPts[mid].x - SX) < Math.abs(rightPts[mid].x - SX);
    const edge = (useLeft ? leftPts : rightPts).slice(4);
    const rim = 'M' + edge.map((p) => `${n1(p.x)},${n1(p.y)}`).join('L');
    return { fill, rim };
  }

  // Monstera leaf with splits and holes. Base at (0,0), tip pointing up (negative y).
  function monsteraPath(L, rand) {
    const cy = -0.5 * L;
    const rx = 0.5 * L;
    const ry = 0.53 * L;
    const margin = (phi) => {
      const s = Math.sin(phi);
      const point = 1 + 0.16 * Math.pow(Math.max(0, -s), 6);
      return { x: Math.cos(phi) * rx * point * (1 - 0.08 * Math.max(0, -s)), y: cy + s * ry * point };
    };
    const splits = [];
    const start = Math.PI / 2 + 0.2;
    const end = Math.PI / 2 + 2 * Math.PI - 0.2;
    [0.55, 0.95, 1.33, 1.7, 2.05].forEach((u) => {
      splits.push(Math.PI / 2 + u + (rand() - 0.5) * 0.06);
      splits.push(Math.PI / 2 + 2 * Math.PI - u + (rand() - 0.5) * 0.06);
    });
    splits.sort((a, b) => a - b);

    const pts = [];
    const steps = 120;
    let si = 0;
    for (let i = 0; i <= steps; i++) {
      const phi = start + (end - start) * (i / steps);
      while (si < splits.length && splits[si] <= phi) {
        const sp = splits[si];
        const depth = 0.38 + rand() * 0.12;
        const m = margin(sp);
        const inner = { x: m.x * depth, y: cy + (m.y - cy) * depth };
        pts.push(margin(sp - 0.03), { x: inner.x - 2, y: inner.y }, { x: inner.x + 2, y: inner.y }, margin(sp + 0.03));
        si++;
      }
      pts.push(margin(phi));
    }
    pts.push({ x: 0, y: -0.06 * L });
    let blade = 'M' + pts.map((p) => `${n1(p.x)},${n1(p.y)}`).join('L') + 'Z';

    [[-0.22, -0.3], [0.2, -0.36], [-0.2, -0.55], [0.22, -0.6], [-0.15, -0.76], [0.14, -0.8]].forEach(([hx, hy]) => {
      const x = hx * L;
      const y = hy * L;
      const r1 = L * (0.03 + rand() * 0.015);
      const r2 = r1 * 0.45;
      blade += `M${n1(x - r1)},${n1(y)}A${n1(r1)},${n1(r2)} 0 1,0 ${n1(x + r1)},${n1(y)}A${n1(r1)},${n1(r2)} 0 1,0 ${n1(x - r1)},${n1(y)}Z`;
    });

    let veins = `M0,${n1(-0.04 * L)}Q${n1(0.02 * L)},${n1(-0.55 * L)} 0,${n1(-1.04 * L)}`;
    splits.forEach((sp) => {
      const m = margin(sp + 0.18);
      veins += `M0,${n1(cy + (m.y - cy) * 0.1)}L${n1(m.x * 0.82)},${n1(cy + (m.y - cy) * 0.82)}`;
    });

    const stem = `M${n1(-0.022 * L)},${n1(-0.05 * L)}Q${n1(0.01 * L)},${n1(0.3 * L)} ${n1(-0.01 * L)},${n1(0.75 * L)}L${n1(0.012 * L)},${n1(0.75 * L)}Q${n1(0.032 * L)},${n1(0.3 * L)} ${n1(0.022 * L)},${n1(-0.05 * L)}Z`;
    return { blade, veins, stem };
  }

  // ---------- palms ----------
  const CROWN = [
    [-170, 0.9, 72], [-146, 0.98, 64], [-122, 0.82, 58], [-98, 0.68, 46],
    [-74, 0.78, 56], [-48, 1.0, 64], [-20, 1.0, 72], [10, 0.88, 78],
    [166, 0.88, 76], [40, 0.6, 60], [140, 0.6, 62], [96, 0.42, 30]
  ];
  const CROWN_SMALL = [[-160, 0.9, 70], [-120, 0.85, 60], [-80, 0.75, 55], [-40, 0.95, 65], [-8, 0.9, 75], [170, 0.85, 75], [60, 0.55, 50], [125, 0.55, 50]];

  function palmGeometry(spec, seed) {
    const rand = rng(seed);
    const trunk = trunkPaths(spec.base, spec.crown, spec.bend, spec.wBase, spec.wTop);
    const crown = spec.crownSet || CROWN;
    const L = spec.size;
    const leafCount = Math.max(9, Math.round(L / 15));
    const fronds = crown.map(([ang, lf, droop]) => {
      const angle = ang + (rand() - 0.5) * 8;
      const d = frondPath(angle, L * lf * (0.94 + rand() * 0.12), droop, rand, 0.3, leafCount);
      let fold = -90 - angle;
      while (fold > 180) fold -= 360;
      while (fold < -180) fold += 360;
      return {
        d,
        fold: fold * 0.9,
        phase: rand() * Math.PI * 2,
        speed: 0.8 + rand() * 0.6,
        amp: 1.4 + rand() * 1.8,
        dir: Math.cos(angle * RAD) >= 0 ? 1 : -1
      };
    });
    const nuts = spec.nuts ? [[-0.6, 0.9], [0.7, 1.1], [0.05, 1.6]].map(([ox, oy]) => {
      const r = L * 0.035;
      return { x: spec.crown.x + ox * r * 1.6, y: spec.crown.y + oy * r, r };
    }) : [];
    return { spec, trunk, fronds, nuts, phase: rand() * Math.PI * 2 };
  }

  function grassPath(rand, x0, x1, yAt, count) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const x = x0 + (x1 - x0) * rand();
      const y = yAt(x) + 4;
      const blades = 3 + Math.floor(rand() * 4);
      for (let b = 0; b < blades; b++) {
        const h = 16 + rand() * 34;
        const lean = (rand() - 0.5) * 30;
        const bx = x + (rand() - 0.5) * 14;
        d += `M${n1(bx - 2.2)},${n1(y)}Q${n1(bx + lean * 0.4)},${n1(y - h * 0.6)} ${n1(bx + lean)},${n1(y - h)}Q${n1(bx + lean * 0.4 + 1)},${n1(y - h * 0.5)} ${n1(bx + 2.2)},${n1(y)}Z`;
      }
    }
    return d;
  }

  // ---------- the scene ----------
  const DEFAULTS = {
    curtain: 0, dim: 0, flash: 0,
    sunY: 640, sunGlow: 1, rays: 0, stars: 0.6,
    hzLine: 0, hzLineA: 0,
    wind: 0.4, camX: 0, camY: 0, zoom: 1, motes: 0.5,
    far: 1, islands: 1, clouds: 1, distant: 1, backL: 1, backR: 1,
    frontL: 1, frontL2: 1, frontR: 1, birds: 1,
    beat: 0
  };

  class IslandScene {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.p = Object.assign({}, DEFAULTS);
      this.target = Object.assign({}, DEFAULTS);
      this.follow = true; // ease toward target (false = the opening sets values directly)
      this.petalsT = null;
      this.S = 0;
      this.buildGeometry();
      this.buildParticles();
      this.resize();
      let timer = null;
      window.addEventListener('resize', () => {
        clearTimeout(timer);
        timer = setTimeout(() => this.resize(), 150);
      });
    }

    set(values, immediate) {
      Object.assign(this.target, values);
      if (immediate) Object.assign(this.p, values);
    }

    // shapes in 1920×1080 "world" units; built once
    buildGeometry() {
      const sr = rng(7);
      this.stars = Array.from({ length: 90 }, () => ({
        x: sr() * W, y: Math.pow(sr(), 1.6) * 380, r: 0.6 + sr() * 1.3, sp: 0.6 + sr() * 1.4, ph: sr() * 6.28
      }));

      this.clouds = [
        [150, 196, 540, 17, '#a9446f', 0.6], [720, 150, 360, 12, '#a9446f', 0.45], [1330, 214, 620, 19, '#bd5277', 0.55],
        [1540, 168, 260, 10, '#bd5277', 0.4], [90, 384, 440, 15, '#e4746a', 0.6], [1240, 362, 540, 16, '#ec8669', 0.6],
        [470, 476, 300, 10, '#ffb079', 0.55], [1190, 506, 380, 11, '#ffbf7f', 0.6], [-120, 528, 280, 9, '#ffae78', 0.45],
        [1690, 458, 320, 10, '#ffae78', 0.5], [860, 300, 220, 8, '#d1607a', 0.4]
      ];

      this.farD = 'M-400,660L-400,600C-200,592 -20,566 120,534C230,508 300,472 360,463C405,457 436,462 474,471C566,492 656,540 764,576C860,606 960,628 1080,660Z' +
        'M1120,660C1230,632 1340,602 1446,572C1528,548 1598,520 1650,515C1690,512 1722,519 1762,531C1866,562 2010,602 2320,622L2320,660Z';
      this.isleD = 'M-300,660C-150,630 40,612 170,606C250,602 316,588 378,590C452,592 530,616 660,660Z' +
        'M1300,660C1392,632 1474,616 1556,611C1636,606 1700,594 1764,596C1856,600 1990,626 2200,660Z';

      const wr = rng(11);
      this.waves = Array.from({ length: 22 }, () => {
        const y = HZ + 24 + Math.pow(wr(), 1.4) * (H - HZ - 40);
        const near = (y - HZ) / (H - HZ);
        return { x: -200 + wr() * (W + 400), y, w: 60 + wr() * 200 * (0.5 + near), h: 1.4 + near * 2, c: near < 0.3 ? '#ffc287' : '#d98aa0', a: 0.05 + wr() * 0.09, ph: wr() * 6.28 };
      });

      const gr = rng(23);
      this.glints = [];
      for (let i = 0; i < 13; i++) {
        const y = HZ + 6 + i * 5 + i * i * 1.05;
        const width = 70 + i * 13;
        const segs = 1 + Math.floor(gr() * 3);
        let x = SX - width / 2 + (gr() - 0.5) * 24;
        const segW = width / segs;
        for (let s = 0; s < segs; s++) {
          const ww = segW * (0.35 + gr() * 0.45);
          this.glints.push({ x: x + gr() * (segW - ww), y, w: ww, h: 1.6 + i * 0.16, a: 0.8 - i * 0.05, sp: 1.6 + gr() * 2.2, ph: gr() * 6.28 });
          x += segW;
        }
      }

      this.distantIslands = [
        'M1218,654C1250,640 1300,626 1350,624C1398,622 1430,632 1466,654Z',
        'M454,654C478,645 506,640 534,640C560,640 584,646 604,654Z'
      ];
      this.tinyPalms = [
        { base: { x: 1300, y: 640 }, crown: { x: 1290, y: 562 }, bend: 6, wBase: 6, wTop: 3.5, size: 46 },
        { base: { x: 1340, y: 632 }, crown: { x: 1356, y: 544 }, bend: -8, wBase: 6.5, wTop: 3.5, size: 52 },
        { base: { x: 1392, y: 634 }, crown: { x: 1414, y: 572 }, bend: -6, wBase: 5.5, wTop: 3, size: 40 },
        { base: { x: 524, y: 646 }, crown: { x: 516, y: 580 }, bend: 6, wBase: 5, wTop: 3, size: 38 }
      ].map((s, i) => palmGeometry(Object.assign({ crownSet: CROWN_SMALL }, s), 100 + i));

      this.birds = [[0, 0, 1], [-46, 22, 0.85], [-88, -14, 0.8], [-130, 30, 0.7], [-60, -40, 0.75], [-170, 4, 0.62]]
        .map(([ox, oy, sc], i) => ({ ox, oy, sc, ph: i * 1.7 }));

      this.palmBackL = palmGeometry({ base: { x: 560, y: 1220 }, crown: { x: 462, y: 566 }, bend: 46, wBase: 34, wTop: 17, size: 226, color: COLORS.back, rim: 2, nuts: true }, 21);
      this.palmBackR = palmGeometry({ base: { x: 1350, y: 1220 }, crown: { x: 1478, y: 588 }, bend: -44, wBase: 32, wTop: 16, size: 214, color: COLORS.back, rim: 2, nuts: true }, 22);
      this.palmFrontL2 = palmGeometry({ base: { x: -40, y: 1220 }, crown: { x: 150, y: 470 }, bend: 70, wBase: 46, wTop: 22, size: 300, color: COLORS.front, rim: 2.5, nuts: true }, 31);
      this.palmFrontL = palmGeometry({ base: { x: 70, y: 1260 }, crown: { x: 404, y: 246 }, bend: 130, wBase: 72, wTop: 30, size: 440, color: COLORS.front, rim: 3, nuts: true }, 32);
      this.palmFrontR = palmGeometry({ base: { x: 1880, y: 1270 }, crown: { x: 1588, y: 292 }, bend: -120, wBase: 68, wTop: 28, size: 420, color: COLORS.front, rim: 3, nuts: true }, 33);
      this.backPalms = [this.palmBackL, this.palmBackR];
      this.frontPalms = [this.palmFrontL2, this.palmFrontL, this.palmFrontR];

      const g2 = rng(41);
      const duneLeftY = (x) => 950 - 40 * Math.exp(-Math.pow((x + 60) / 260, 2)) + Math.max(0, (x - 200) * 0.28);
      const duneRightY = (x) => duneLeftY(W - x) + 8;
      this.duneL = {
        d: 'M-600,1600 -600,930 C-300,905 -60,896 180,930 C380,958 540,1010 700,1100 L760,1600Z',
        grass: grassPath(g2, -200, 560, duneLeftY, 16)
      };
      this.duneR = {
        d: `M${W + 600},1600 ${W + 600},940 C${W + 300},914 ${W + 60},906 ${W - 180},940 C${W - 380},966 ${W - 540},1016 ${W - 700},1110 L${W - 760},1600Z`,
        grass: grassPath(g2, W - 560, W + 200, duneRightY, 16)
      };
    }

    buildParticles() {
      const r = rng(77);
      this.motes = Array.from({ length: 34 }, () => ({
        x: 300 + r() * 1320, y: 260 + r() * 760, s: 6 + r() * 16, ph: r() * Math.PI * 2, r: 1 + r() * 2.2, a: 0.25 + r() * 0.5
      }));
      const pr = rng(91);
      this.petals = Array.from({ length: 64 }, (_, i) => ({
        t0: i / 64,
        x: pr() * (W + 200) - 100,
        vy: 115 + pr() * 85,
        amp: 30 + pr() * 70,
        freq: 0.9 + pr() * 1.2,
        spin: (pr() - 0.5) * 3,
        flip: 1.5 + pr() * 2.5,
        size: 11 + pr() * 9,
        kind: pr() < 0.62 ? 0 : 1,
        ph: pr() * Math.PI * 2
      }));
    }

    // paint a shape into its own bitmap at the current resolution
    sprite(paths, paint, pad) {
      const S = this.S;
      const bb = bbox(...paths);
      const pd = pad == null ? 4 : pad;
      const w = Math.max(1, Math.ceil((bb.x1 - bb.x0) * S + pd * 2));
      const h = Math.max(1, Math.ceil((bb.y1 - bb.y0) * S + pd * 2));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.setTransform(S, 0, 0, S, -bb.x0 * S + pd, -bb.y0 * S + pd);
      paint(g);
      return { c, x: bb.x0 - pd / S, y: bb.y0 - pd / S, w: w / S, h: h / S };
    }

    fillSprite(d, color) {
      return this.sprite([d], (g) => {
        g.fillStyle = color;
        g.fill(new Path2D(d));
      });
    }

    palmSprites(palm) {
      const spec = palm.spec;
      palm.trunkS = this.sprite([palm.trunk.fill], (g) => {
        g.fillStyle = spec.color;
        g.fill(new Path2D(palm.trunk.fill));
        if (spec.rim) {
          g.strokeStyle = COLORS.rim;
          g.lineWidth = spec.rim;
          g.lineCap = 'round';
          g.stroke(new Path2D(palm.trunk.rim));
        }
      });
      palm.fronds.forEach((f) => { f.s = this.fillSprite(f.d, spec.color); });
    }

    buildSprites() {
      // clouds
      const cloudPaths = [];
      this.clouds.forEach(([x, y, w, h], i) => {
        cloudPaths.push(`M${x},${y - h} L${x + w},${y + h}`);
      });
      this.cloudS = this.sprite(cloudPaths, (g) => {
        this.clouds.forEach(([x, y, w, h, c, o], i) => {
          g.globalAlpha = o;
          g.fillStyle = c;
          const pill = (px, py, pw, ph) => {
            g.beginPath();
            g.roundRect ? g.roundRect(px, py, pw, ph, ph / 2) : g.rect(px, py, pw, ph);
            g.fill();
          };
          pill(x, y, w, h);
          if (w > 350) pill(x + w * (i % 2 ? 0.12 : 0.3), y - h * 0.85, w * 0.55, h * 0.9);
        });
      }, 8);

      this.farS = this.sprite([this.farD], (g) => {
        g.fillStyle = grad(g, 0, 460, 0, HZ, [[0, COLORS.far[0]], [1, COLORS.far[1]]]);
        g.fill(new Path2D(this.farD));
      });
      this.isleS = this.sprite([this.isleD], (g) => {
        g.fillStyle = grad(g, 0, 590, 0, HZ, [[0, COLORS.isle[0]], [1, COLORS.isle[1]]]);
        g.fill(new Path2D(this.isleD));
      });

      // distant islets with their tiny palms, at rest
      const tinyPaths = [];
      this.tinyPalms.forEach((pm) => {
        tinyPaths.push(pm.trunk.fill);
        const c = pm.spec.crown;
        const bb = bbox(...pm.fronds.map((f) => f.d));
        tinyPaths.push(`M${c.x + bb.x0},${c.y + bb.y0} L${c.x + bb.x1},${c.y + bb.y1}`);
      });
      this.distS = this.sprite(this.distantIslands.concat(tinyPaths), (g) => {
        g.fillStyle = COLORS.distant;
        this.distantIslands.forEach((d) => g.fill(new Path2D(d)));
        this.tinyPalms.forEach((pm) => {
          g.fill(new Path2D(pm.trunk.fill));
          g.save();
          g.translate(pm.spec.crown.x, pm.spec.crown.y);
          pm.fronds.forEach((f) => g.fill(new Path2D(f.d)));
          g.restore();
        });
      });

      this.backPalms.concat(this.frontPalms).forEach((pm) => this.palmSprites(pm));

      const dune = (dn) => this.sprite([dn.d], (g) => {
        g.fillStyle = COLORS.front;
        g.fill(new Path2D(dn.d));
        g.fill(new Path2D(dn.grass));
      });
      this.duneLS = dune(this.duneL);
      this.duneRS = dune(this.duneR);

      // gradients live on the main canvas, in world units
      const ctx = this.ctx;
      this.skyG = grad(ctx, 0, -40, 0, HZ, COLORS.sky);
      this.seaG = grad(ctx, 0, HZ, 0, H + 40, COLORS.sea);
      this.rayG = radial(ctx, 1350, [[0, 'rgba(255,241,201,0.34)'], [0.35, 'rgba(255,226,168,0.14)'], [1, 'rgba(255,208,138,0)']]);
      this.glowOutG = radial(ctx, 600, [[0, 'rgba(255,210,127,0.55)'], [0.45, 'rgba(247,149,93,0.22)'], [1, 'rgba(226,88,76,0)']]);
      this.glowInG = radial(ctx, 290, [[0, 'rgba(255,244,207,0.95)'], [0.55, 'rgba(255,213,138,0.45)'], [1, 'rgba(255,180,107,0)']]);
      this.discG = grad(ctx, 0, -148, 0, 148, [[0, '#fff6dc'], [0.6, '#ffd98e'], [1, '#ffb466']]);
      const flash = ctx.createRadialGradient(960, 600, 0, 960, 600, 1150);
      flash.addColorStop(0, 'rgba(255,246,220,1)');
      flash.addColorStop(0.6, 'rgba(255,226,168,0.75)');
      flash.addColorStop(1, 'rgba(247,164,99,0.35)');
      this.flashG = flash;
      this.dimG = grad(ctx, 0, 0, 0, H, [[0, 'rgba(21,11,37,1)'], [0.45, 'rgba(21,11,37,0.5)'], [0.6, 'rgba(21,11,37,0.2)'], [0.7, 'rgba(21,11,37,0.45)'], [1, 'rgba(21,11,37,1)']]);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = window.devicePixelRatio || 1;
      const cw = Math.min(MAX_CANVAS_W, Math.round(rect.width * Math.min(dpr, 2)));
      const S = cw / W;
      this.canvas.width = cw;
      this.canvas.height = Math.round(H * S);
      if (Math.abs(S - this.S) > 0.001) {
        this.S = S;
        this.buildSprites();
      }
    }

    // world transform for a layer at a given depth (0 = sky, 1 = front palms)
    cam(depth) {
      const p = this.p;
      const S = this.S;
      const s = 1 + (p.zoom - 1) * depth;
      this.ctx.setTransform(S * s, 0, 0, S * s, S * (OX - p.camX * depth - OX * s), S * (OY - p.camY * depth - OY * s));
    }

    blit(sp, dx, dy) {
      this.ctx.drawImage(sp.c, sp.x + (dx || 0), sp.y + (dy || 0), sp.w, sp.h);
    }

    drawPalm(palm, reveal, time, beat) {
      if (reveal <= 0.001) return;
      const ctx = this.ctx;
      const spec = palm.spec;
      const u = Math.max(0, Math.min(1.25, reveal));
      const wind = this.p.wind;
      ctx.save();
      ctx.translate(0, (1 - reveal) * 1000);
      const lean = Math.sin(time * 0.5 + palm.phase) * (0.35 + wind * 0.9) + Math.sin(time * 1.3 + palm.phase) * wind * 0.25;
      ctx.translate(spec.base.x, spec.base.y);
      ctx.rotate(lean * RAD);
      ctx.translate(-spec.base.x, -spec.base.y);
      this.blit(palm.trunkS);
      const c = spec.crown;
      const sc = 0.35 + 0.65 * Math.min(1.08, u);
      for (const f of palm.fronds) {
        const sway = Math.sin(time * f.speed + f.phase) * f.amp * (0.35 + wind * 0.9) +
          Math.sin(time * 2.7 + f.phase * 2) * wind * 0.8 + beat * 1.1 * f.dir;
        const rot = (1 - u) * f.fold + sway;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(rot * RAD);
        ctx.scale(sc, sc);
        this.blit(f.s);
        ctx.restore();
      }
      if (palm.nuts.length) {
        ctx.fillStyle = spec.color;
        ctx.beginPath();
        for (const n of palm.nuts) {
          ctx.moveTo(n.x + n.r, n.y);
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.restore();
    }

    render(now, dt) {
      if (!this.S) {
        this.resize();
        if (!this.S) return;
      }
      const p = this.p;
      if (this.follow) {
        const k = 1 - Math.exp(-dt * 2.6);
        const kf = 1 - Math.exp(-dt * 7);
        for (const key in this.target) {
          const fast = key === 'curtain' || key === 'flash';
          p[key] += (this.target[key] - p[key]) * (fast ? kf : k);
        }
      }
      const ctx = this.ctx;
      const S = this.S;
      const time = now / 1000;
      const beat = p.beat || 0;
      const clamp01 = (v) => Math.max(0, Math.min(1, v));

      // sky
      ctx.globalAlpha = 1;
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.fillStyle = this.skyG;
      ctx.fillRect(0, -10, W, HZ + 60);

      if (p.stars > 0.01) {
        ctx.fillStyle = '#fff4dc';
        for (const s of this.stars) {
          ctx.globalAlpha = p.stars * (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(time * s.sp + s.ph)));
          ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
        }
        ctx.globalAlpha = 1;
      }

      // sunburst
      if (p.rays > 0.01) {
        this.cam(0.03);
        ctx.save();
        ctx.translate(SX, p.sunY);
        ctx.rotate((time * 2.2) * RAD);
        ctx.globalAlpha = clamp01(p.rays * (0.88 + beat * 0.12));
        ctx.fillStyle = this.rayG;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a0 = (i * 22.5 - 3.6) * RAD;
          const a1 = (i * 22.5 + 3.6) * RAD;
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 1350, a0, a1);
          ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // sun
      this.cam(0.04);
      const gs = Math.max(0.001, p.sunGlow * (1 + beat * 0.05));
      ctx.save();
      ctx.translate(SX, p.sunY);
      ctx.save();
      ctx.scale(gs, gs);
      ctx.fillStyle = this.glowOutG;
      ctx.fillRect(-600, -600, 1200, 1200);
      ctx.fillStyle = this.glowInG;
      ctx.fillRect(-290, -290, 580, 580);
      ctx.restore();
      ctx.fillStyle = this.discG;
      ctx.beginPath();
      ctx.arc(0, 0, 148, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // clouds
      if (p.clouds > 0.01) {
        this.cam(0.07);
        ctx.globalAlpha = clamp01(p.clouds);
        this.blit(this.cloudS, 35 + 75 * Math.sin(time * 0.045) + (1 - p.clouds) * -260, 0);
        ctx.globalAlpha = 1;
      }

      // mountains and islands rise from behind the sea
      this.cam(0.12);
      this.blit(this.farS, 0, (1 - p.far) * 230);
      this.cam(0.2);
      this.blit(this.isleS, 0, (1 - p.islands) * 120);

      // sea
      this.cam(0.26);
      ctx.fillStyle = this.seaG;
      ctx.fillRect(-1200, HZ, W + 2400, H - HZ + 900);
      ctx.fillStyle = 'rgba(255,227,168,0.55)';
      ctx.fillRect(-1200, HZ - 1, W + 2400, 2.5);
      const drift = Math.sin(time * 0.35) * 26;
      for (const w of this.waves) {
        ctx.globalAlpha = w.a * (0.7 + 0.3 * Math.sin(time * 0.8 + w.ph));
        ctx.fillStyle = w.c;
        ctx.fillRect(w.x + drift, w.y, w.w, w.h);
      }
      const glintVis = clamp01((HZ + 150 - p.sunY) / 120);
      if (glintVis > 0.01) {
        ctx.fillStyle = '#ffe2a6';
        for (const g of this.glints) {
          ctx.globalAlpha = glintVis * g.a * (0.12 + 0.88 * (0.5 + 0.5 * Math.sin(time * g.sp + g.ph)));
          ctx.fillRect(g.x, g.y, g.w, g.h);
        }
      }
      ctx.globalAlpha = 1;
      if (p.hzLineA > 0.01) {
        const hw = 1100 * p.hzLine;
        ctx.globalAlpha = p.hzLineA * 0.35;
        ctx.fillStyle = '#ffe9b8';
        ctx.fillRect(SX - hw, HZ - 7, hw * 2, 14);
        ctx.globalAlpha = p.hzLineA;
        ctx.fillStyle = '#fff7e0';
        ctx.fillRect(SX - hw, HZ - 1.5, hw * 2, 3);
        ctx.globalAlpha = 1;
      }

      // distant islets rise out of the water
      this.cam(0.3);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1200, -1200, W + 2400, HZ + 12 + 1200);
      ctx.clip();
      this.blit(this.distS, 0, (1 - p.distant) * 110);
      ctx.restore();

      // birds
      if (p.birds > 0.01) {
        this.cam(0.4);
        const span = W + 900;
        const bx = ((time * 46) % span) - 450;
        const by = 250 + Math.sin(time * 0.35) * 26;
        ctx.globalAlpha = clamp01(p.birds);
        ctx.strokeStyle = '#2a1434';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (const b of this.birds) {
          const f = 0.35 + 0.75 * (0.5 + 0.5 * Math.sin(time * 7.5 + b.ph));
          const x = bx + b.ox;
          const y = by + b.oy;
          const s = b.sc;
          ctx.moveTo(x - 15 * s, y);
          ctx.quadraticCurveTo(x - 7 * s, y - 8 * s * f, x, y);
          ctx.quadraticCurveTo(x + 7 * s, y - 8 * s * f, x + 15 * s, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // palms
      this.cam(0.62);
      this.drawPalm(this.palmBackL, p.backL, time, beat);
      this.drawPalm(this.palmBackR, p.backR, time, beat);
      this.cam(1);
      this.drawPalm(this.palmFrontL2, p.frontL2, time, beat);
      this.drawPalm(this.palmFrontL, p.frontL, time, beat);
      this.drawPalm(this.palmFrontR, p.frontR, time, beat);
      this.blit(this.duneLS, 0, (1 - p.frontL) * 420);
      this.blit(this.duneRS, 0, (1 - p.frontR) * 420);

      // screen overlays
      ctx.setTransform(S, 0, 0, S, 0, 0);
      if (p.flash > 0.005) {
        ctx.globalAlpha = clamp01(p.flash);
        ctx.fillStyle = this.flashG;
        ctx.fillRect(0, 0, W, H);
      }
      if (p.dim > 0.005) {
        ctx.globalAlpha = clamp01(p.dim);
        ctx.fillStyle = this.dimG;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalAlpha = 1;

      this.drawParticles(time);

      if (p.curtain > 0.003) {
        ctx.setTransform(S, 0, 0, S, 0, 0);
        ctx.globalAlpha = clamp01(p.curtain);
        ctx.fillStyle = '#07040d';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }

    drawParticles(time) {
      const ctx = this.ctx;
      const p = this.p;
      ctx.setTransform(this.S, 0, 0, this.S, 0, 0);

      if (p.motes > 0.01) {
        ctx.fillStyle = '#ffe2a6';
        for (const m of this.motes) {
          const y = ((m.y - time * m.s) % 820 + 820) % 820 + 200;
          const x = m.x + Math.sin(time * 0.4 + m.ph) * 34;
          const tw = 0.55 + 0.45 * Math.sin(time * 1.7 + m.ph * 3);
          ctx.globalAlpha = m.a * tw * p.motes;
          ctx.beginPath();
          ctx.arc(x, y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (this.petalsT != null) {
        const t = this.petalsT;
        const start = this.petalStart || 0;
        const spread = this.petalSpread || 8;
        for (const f of this.petals) {
          const age = t - (start + f.t0 * spread);
          if (age < 0) continue;
          const y = -50 + age * f.vy;
          if (y > H + 60) continue;
          const x = f.x + Math.sin(age * f.freq + f.ph) * f.amp + age * 18;
          const flip = Math.cos(age * f.flip + f.ph);
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(age * f.spin + f.ph);
          ctx.scale(flip * 0.8 + 0.2 * (flip >= 0 ? 1 : -1), 1);
          ctx.globalAlpha = Math.min(1, age * 3) * (this.petalAlpha == null ? 1 : this.petalAlpha);
          if (f.kind === 0) this.drawPlumeria(ctx, f.size);
          else this.drawPetal(ctx, f.size);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
    }

    drawPlumeria(ctx, r) {
      ctx.fillStyle = '#fff4e2';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const pt = (x, y) => [x * c - y * s, x * s + y * c];
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(...pt(-r * 0.55, -r * 0.3), ...pt(-r * 0.42, -r * 1.05), ...pt(0.1 * r, -r));
        ctx.bezierCurveTo(...pt(r * 0.42, -r * 0.92), ...pt(r * 0.3, -r * 0.3), 0, 0);
      }
      ctx.fill();
      ctx.fillStyle = '#ffc94f';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPetal(ctx, r) {
      ctx.fillStyle = '#ee5a5e';
      ctx.beginPath();
      ctx.moveTo(0, r * 0.7);
      ctx.bezierCurveTo(-r * 0.75, r * 0.2, -r * 0.6, -r * 0.8, 0, -r * 0.75);
      ctx.bezierCurveTo(r * 0.6, -r * 0.8, r * 0.75, r * 0.2, 0, r * 0.7);
      ctx.fill();
    }
  }

  global.IslandScene = IslandScene;
  global.IslandArt = { monsteraPath, rng, make, NS, W, H };
})(window);
