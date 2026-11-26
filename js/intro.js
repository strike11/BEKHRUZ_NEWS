/*
 * Bekhruz News — opening titles.
 * Everything is a function of the music time, so the picture stays on the beat.
 *
 * Track map (assets/hawaiian-intro.mp3, ~97 BPM, one beat = 0.6185 s, first beat at 0.18 s):
 *   beats 0–7    solo ukulele        → the island is built, one piece per beat
 *   beat 8       band comes in       → "Aloha"
 *   beats 12–21  melody              → four sections of the edition
 *   beats 23–24  turnaround          → leaves close in, then burst open
 *   beats 24–35  high melody         → the title, falling flowers
 *   beats 36–40  last phrase         → fly into the sun, hand over to the first slide
 */
(function (global) {
  'use strict';

  const BEAT = 0.6185;
  const T0 = 0.18;
  const b = (k) => T0 + BEAT * k;
  const END = b(40);

  const clamp = (v, a, z) => Math.min(z == null ? 1 : z, Math.max(a == null ? 0 : a, v));
  const win = (t, a, z) => clamp((t - a) / (z - a));
  const lerp = (a, z, x) => a + (z - a) * x;
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn = (x) => x * x * x;
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const spring = (dt, k, w) => (dt <= 0 ? 0 : 1 - Math.exp(-(k || 8) * dt) * Math.cos((w || 12) * dt));
  const cq = (v) => `${(v / 19.2).toFixed(3)}cqw`; // 1920-wide picture units → stage-relative units

  function splitLetters(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-label', text);
    el.dataset.text = text;
    return Array.from(text).map((ch) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
      return s;
    });
  }

  const PAN = [
    [b(12) - 0.2, -150],
    [b(13.83) - 0.2, 140],
    [b(15.67) - 0.2, -120],
    [b(17.5) - 0.2, 150],
    [b(19.33) - 0.2, -135],
    [b(21.17) - 0.2, 135]
  ];
  function panAt(t) {
    let x = 0;
    for (let i = 0; i < PAN.length; i++) {
      const [tk, v] = PAN[i];
      const prev = i ? PAN[i - 1][1] : 0;
      if (t >= tk) x = lerp(prev, v, easeInOut(win(t, tk, tk + 0.85)));
    }
    return x;
  }

  function beatPulse(t) {
    if (t < T0) return 0;
    const since = (t - T0) % BEAT;
    return Math.exp(-since * 7) * (t < b(8) ? 0.45 : 1);
  }

  const LEAVES = [
    { base: [70, 1210], rot: 52, side: 1 },
    { base: [1850, -130], rot: 232, side: -1 },
    { base: [-130, -70], rot: 128, side: 1 },
    { base: [2050, 1190], rot: -52, side: -1 }
  ];

  class IntroPlayer {
    constructor({ audio, scene, onProgress, onComplete }) {
      this.audio = audio;
      this.scene = scene;
      this.onProgress = onProgress;
      this.onComplete = onComplete;
      this.running = false;
      this.duration = END;

      this.root = document.getElementById('intro');
      this.wash = document.getElementById('wash');

      const aloha = document.getElementById('aloha-word');
      this.alohaLetters = splitLetters(aloha);
      this.alohaSub = document.getElementById('aloha-sub');

      this.topics = Array.from(document.querySelectorAll('#topics .topic')).map((el) => ({
        el,
        num: el.querySelector('.topic-num'),
        line: el.querySelector('.topic-line'),
        rule: el.querySelector('.topic-rule')
      }));

      this.title = document.getElementById('title');
      this.titleStamp = this.title.querySelector('.stamp');
      this.titleEyebrow = this.title.querySelector('.eyebrow');
      this.titleMain = this.title.querySelector('.wm-main');
      this.titleLetters = splitLetters(this.titleMain);
      this.titleNews = this.title.querySelector('.wm-news');
      this.titleDate = this.title.querySelector('.title-date');

      this.buildLeaves();
    }

    // each leaf is its own layer that the browser only moves, never redraws
    buildLeaves() {
      const { monsteraPath, rng, make } = global.IslandArt;
      const host = document.getElementById('leaves');
      host.innerHTML = '';
      this.leafShade = document.createElement('div');
      this.leafShade.className = 'leaf-shade';
      host.appendChild(this.leafShade);
      const L = 1250;
      const box = { x: -0.62 * L, y: -1.16 * L, w: 1.24 * L, h: 1.98 * L };
      const r = rng(5);
      this.leaves = LEAVES.map((spec) => {
        const shape = monsteraPath(L, r);
        const el = document.createElement('div');
        el.className = 'leaf';
        const svg = make('svg', { viewBox: `${box.x} ${box.y} ${box.w} ${box.h}` });
        svg.style.left = cq(box.x);
        svg.style.top = cq(box.y);
        svg.style.width = cq(box.w);
        svg.style.height = cq(box.h);
        make('path', { d: shape.stem, fill: '#170c22' }, svg);
        make('path', { d: shape.blade, fill: '#170c22', 'fill-rule': 'evenodd', stroke: '#e8764f', 'stroke-opacity': 0.38, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
        make('path', { d: shape.veins, fill: 'none', stroke: '#23122f', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, svg);
        el.appendChild(svg);
        host.appendChild(el);
        return Object.assign({ el }, spec);
      });
    }

    reset() {
      this.apply(0);
      this.wash.style.opacity = '0';
    }

    start() {
      this.stop();
      this.wash.classList.remove('fade');
      this.reset();
      this.running = true;
      this.scene.follow = false;
      this.audio.volume = 1;
      try { this.audio.currentTime = 0; } catch (e) { /* not loaded yet */ }
      const played = this.audio.play();
      if (played && played.catch) played.catch(() => {});
      this.startWall = performance.now();
      this.lastAudio = -1;
      this.lastAudioWall = 0;
    }

    stop() {
      this.running = false;
    }

    // smooth clock: follows the audio, interpolates between its coarse updates
    clock(now) {
      const a = this.audio;
      if (!a.paused && a.currentTime > 0) {
        if (a.currentTime !== this.lastAudio) {
          this.lastAudio = a.currentTime;
          this.lastAudioWall = now;
        }
        return this.lastAudio + Math.min(0.25, (now - this.lastAudioWall) / 1000);
      }
      return (now - this.startWall) / 1000;
    }

    update(now) {
      if (!this.running) return;
      const t = this.clock(now);
      this.apply(t);
      if (this.onProgress) this.onProgress(Math.min(1, t / END));
      if (t >= END) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }

    apply(t) {
      const s = this.scene;
      const P = s.p;
      const beat = beatPulse(t);

      // ---- picture ----
      P.beat = beat;
      P.curtain = t < b(0) ? 1 : 1 - easeInOut(win(t, b(0), b(2) + 0.2));
      P.dim = 0;
      P.stars = lerp(0.95, 0.1, easeInOut(win(t, b(0), b(6))));
      P.sunY = lerp(810, 618, easeOut(win(t, b(0) - 0.1, b(0) + 2.8))) + 44 * easeInOut(win(t, b(24) - 0.3, b(37)));
      P.sunGlow = easeOut(win(t, b(0), b(0) + 1.8)) * (1 + 0.08 * easeOut(win(t, b(24), b(25))) + 1.1 * easeIn(win(t, b(36), END)));
      P.hzLine = easeOut(win(t, b(1), b(1) + 0.75));
      P.hzLineA = t < b(1) ? 0 : 1 - easeInOut(win(t, b(1) + 0.8, b(1) + 2.6));

      P.far = spring(t - b(2), 6, 7);
      P.islands = spring(t - b(3), 6, 7);
      P.clouds = easeOut(win(t, b(3), b(3) + 2));
      P.distant = spring(t - b(4), 7, 9);
      P.backL = spring(t - b(4) - 0.04, 7, 10);
      P.backR = spring(t - b(4) - 0.2, 7, 10);
      P.frontL = spring(t - b(5), 7, 10);
      P.frontR = spring(t - b(6), 7, 10);
      P.frontL2 = spring(t - b(7), 7, 10);
      P.birds = easeOut(win(t, b(7), b(7) + 1.4));
      P.motes = 0.85 * easeOut(win(t, b(8), b(9)));

      P.wind = 0.25 + 0.45 * easeInOut(win(t, b(8), b(8) + 1.6)) + 0.9 * Math.sin(Math.PI * win(t, b(23), b(25.5)));
      P.rays = Math.max(0, 0.42 * easeOut(win(t, b(8), b(8) + 1.6)) + 0.58 * easeOut(win(t, b(24), b(25.5))) - easeIn(win(t, b(36.5), b(39))));
      P.flash = (t >= b(8) ? 0.22 * (1 - easeOut(win(t, b(8), b(8) + 0.8))) : 0) +
        (t >= b(24) ? 0.7 * (1 - easeOut(win(t, b(24), b(24) + 1.1))) : 0);

      let zoom;
      if (t < b(24) - 0.05) {
        zoom = 1 + 0.045 * easeOut(win(t, b(8), b(8) + 0.5)) + 0.0025 * clamp(t - b(8), 0, 20);
      } else {
        zoom = 1.015 + 0.004 * (t - b(24)) + 1.9 * easeIn(win(t, b(36), END));
      }
      P.zoom = zoom;
      P.camX = t < b(24) - 0.05 ? panAt(t) : 0;
      P.camY = 0;

      s.petalsT = t >= b(26) ? t : null;
      s.petalStart = b(26);
      s.petalSpread = b(39) - b(26);
      s.petalAlpha = 1;

      // ---- "Aloha" ----
      const alohaOut = easeIn(win(t, b(11.4), b(12) - 0.1));
      this.alohaLetters.forEach((el, i) => {
        const at = b(8) + i * BEAT * 0.5;
        const sp = spring(t - at, 9, 13);
        const vis = clamp((t - at) * 7) * (1 - alohaOut);
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translateY(${((1 - sp) * -55 - alohaOut * 18).toFixed(2)}%) rotate(${((1 - sp) * -10).toFixed(2)}deg)`;
      });
      const subIn = easeOut(win(t, b(10), b(10) + 0.7));
      this.alohaSub.style.opacity = (subIn * (1 - alohaOut)).toFixed(3);
      this.alohaSub.style.transform = `translateY(${((1 - subIn) * 60).toFixed(1)}%)`;

      // ---- sections of the edition ----
      const topicCount = Math.max(1, this.topics.length);
      const topicStep = 11 / topicCount;
      this.topics.forEach((tp, i) => {
        const at = b(12 + topicStep * i);
        const end = i < topicCount - 1 ? b(12 + topicStep * (i + 1)) - 0.22 : b(23) - 0.14;
        const inn = easeOut(win(t, at, at + 0.45));
        const out = easeIn(win(t, end, end + 0.22));
        const active = t >= at && t < end + 0.24;
        tp.el.style.visibility = active ? 'visible' : 'hidden';
        if (!active) return;
        tp.num.style.opacity = (inn * (1 - out)).toFixed(3);
        tp.num.style.transform = `translateY(${((1 - inn) * 40).toFixed(1)}%)`;
        tp.line.style.transform = `translateY(${((1 - inn) * 108 - out * 108).toFixed(2)}%)`;
        tp.rule.style.transform = `scaleX(${(easeOut(win(t, at + 0.12, at + 0.6)) * (1 - out)).toFixed(3)})`;
      });

      // ---- leaves close in on the turnaround, burst open on the downbeat ----
      const burst = easeIn(win(t, b(24), b(24) + 0.8));
      this.leaves.forEach((lf, i) => {
        const at = b(23) + i * BEAT * 0.25;
        const inn = easeOut(win(t, at, at + 0.42));
        const on = t >= at && burst < 1;
        lf.el.style.visibility = on ? 'visible' : 'hidden';
        if (!on) return;
        const th = lf.rot * Math.PI / 180;
        const dx = Math.sin(th);
        const dy = -Math.cos(th);
        const back = (1 - inn) * 1050 + burst * 1350;
        const x = lf.base[0] - dx * back;
        const y = lf.base[1] - dy * back;
        const rot = lf.rot - (1 - inn) * 30 * lf.side + burst * 24 * lf.side;
        lf.el.style.transform = `translate(${cq(x)},${cq(y)}) rotate(${rot.toFixed(2)}deg) scale(${(1 + burst * 0.25).toFixed(3)})`;
      });
      const shade = 0.96 * easeIn(win(t, b(23), b(24) - 0.03)) * (1 - easeOut(win(t, b(24), b(24) + 0.35)));
      this.leafShade.style.opacity = shade.toFixed(3);

      // ---- title ----
      const tt = t - b(24);
      const titleOut = easeIn(win(t, b(36), b(38.2)));
      const titleOn = tt >= -0.02 && titleOut < 1;
      this.title.style.visibility = titleOn ? 'visible' : 'hidden';
      if (titleOn) {
        const breathe = 1 + beat * 0.008;
        this.title.style.opacity = (1 - titleOut).toFixed(3);
        this.title.style.transform = `scale(${(breathe * (1 + titleOut * 0.32)).toFixed(4)})`;

        const st = spring(tt, 9, 12);
        this.titleStamp.style.opacity = clamp(tt * 5).toFixed(3);
        this.titleStamp.style.transform = `scale(${(0.3 + 0.7 * st).toFixed(3)}) rotate(${((1 - st) * -28 - 4).toFixed(2)}deg)`;

        const ey = easeOut(win(tt, 0.35, 1.05));
        this.titleEyebrow.style.opacity = ey.toFixed(3);
        this.titleEyebrow.style.transform = `translateY(${((1 - ey) * 50).toFixed(1)}%)`;

        this.titleLetters.forEach((el, i) => {
          const lt = tt - 0.12 - i * 0.055;
          const sp = spring(lt, 10, 14);
          el.style.opacity = clamp(lt * 6).toFixed(3);
          el.style.transform = `translateY(${((1 - sp) * 65).toFixed(2)}%)`;
        });

        const nw = easeOut(win(t, b(25), b(25) + 0.9));
        this.titleNews.style.opacity = nw.toFixed(3);
        this.titleNews.style.setProperty('--rule', nw.toFixed(3));
        this.titleNews.style.letterSpacing = `${lerp(1.1, 0.62, nw).toFixed(3)}em`;

        const dt = easeOut(win(t, b(28), b(28) + 0.8));
        this.titleDate.style.opacity = dt.toFixed(3);
        this.titleDate.style.transform = `translateY(${((1 - dt) * 60).toFixed(1)}%)`;

        const sh = win(t, b(32), b(32) + 1.2);
        this.titleMain.style.setProperty('--shine', `${lerp(130, -30, easeInOut(sh)).toFixed(1)}%`);
      }

      // ---- hand-over glow ----
      this.wash.style.opacity = easeInOut(win(t, b(38) + 0.1, END)).toFixed(3);
    }
  }

  global.IntroPlayer = IntroPlayer;
  global.IntroTiming = { BEAT, T0, END, b };
})(window);
