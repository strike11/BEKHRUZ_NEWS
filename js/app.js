/*
 * Bekhruz News — show control: title screen, opening titles, slides, music.
 */
(function (global) {
  'use strict';

  const STANDBY_LOOK = {
    curtain: 0, dim: 0.34, flash: 0, sunY: 664, sunGlow: 0.85, rays: 0, stars: 1,
    hzLine: 0, hzLineA: 0, wind: 0.35, camX: 0, camY: 0, zoom: 1, motes: 0.45, beat: 0,
    far: 1, islands: 1, clouds: 1, distant: 1, backL: 1, backR: 1, frontL: 1, frontL2: 1, frontR: 1, birds: 1
  };
  const SLIDE_LOOK = Object.assign({}, STANDBY_LOOK, {
    dim: 0.2, sunY: 626, sunGlow: 1, rays: 0.3, stars: 0.2, wind: 0.5, zoom: 1.04, motes: 0.6
  });
  const SLIDE_PAN = [0, -120, 110, -60, 130, -140];

  const BGM_VOLUME = 0.16;

  class Show {
    constructor() {
      this.stage = document.getElementById('stage');
      this.audio = document.getElementById('music');
      this.standby = document.getElementById('standby');
      this.introEl = document.getElementById('intro');
      this.slides = Array.from(document.querySelectorAll('#slides .slide'));
      this.hud = document.getElementById('hud');
      this.ticker = document.getElementById('ticker');
      this.progress = document.getElementById('progress-fill');
      this.wash = document.getElementById('wash');
      this.overview = document.getElementById('overview');
      this.overviewGrid = document.getElementById('overview-grid');
      this.controls = document.getElementById('controls');
      this.indicator = document.getElementById('ctrl-indicator');
      this.btnMusic = document.getElementById('ctrl-music');
      this.btnMute = document.getElementById('ctrl-mute');

      this.state = 'standby';
      this.index = 0;
      this.keepMusic = true;
      this.overviewOpen = false;
      this.fadeTimer = null;
      this.prerollTimer = null;

      this.fillDates();
      this.scene = new global.IslandScene(document.getElementById('scene'));
      this.scene.set(STANDBY_LOOK, true);
      this.intro = new global.IntroPlayer({
        audio: this.audio,
        scene: this.scene,
        onProgress: (r) => this.setProgress(r),
        onComplete: () => this.finishIntro()
      });

      this.buildOverview();
      this.bind();
      this.startClock();
      this.loop();
      this.updateUI();
    }

    // ---------- loop ----------
    loop() {
      let last = performance.now();
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.intro.update(now);
        this.scene.render(now, dt);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    // ---------- helpers ----------
    fillDates() {
      const d = new Date();
      const long = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const short = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      document.querySelectorAll('[data-date="long"]').forEach((el) => { el.textContent = long; });
      document.querySelectorAll('[data-date="short"]').forEach((el) => { el.textContent = short; });
    }

    startClock() {
      const el = document.getElementById('clock');
      const tick = () => {
        const d = new Date();
        el.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      tick();
      setInterval(tick, 5000);
    }

    setProgress(ratio) {
      this.progress.style.transform = `scaleX(${Math.max(0, Math.min(1, ratio)).toFixed(4)})`;
    }

    fadeAudio(to, ms, pauseAtEnd) {
      clearInterval(this.fadeTimer);
      const from = this.audio.volume;
      const steps = 24;
      let i = 0;
      this.fadeTimer = setInterval(() => {
        i++;
        this.audio.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
        if (i >= steps) {
          clearInterval(this.fadeTimer);
          this.fadeTimer = null;
          if (pauseAtEnd && to === 0) this.audio.pause();
        }
      }, ms / steps);
    }

    show(el, on) {
      el.classList.toggle('is-active', on);
    }

    // ---------- flow ----------
    startIntro() {
      if (this.state === 'preroll') return;
      this.closeOverview();
      this.intro.stop();
      clearTimeout(this.prerollTimer);
      clearInterval(this.fadeTimer);

      this.state = 'preroll';
      this.show(this.standby, false);
      this.slides.forEach((s) => this.show(s, false));
      this.hud.classList.remove('is-on');
      this.ticker.classList.remove('is-on');
      this.wash.classList.add('fade');
      this.wash.style.opacity = '0';
      this.scene.follow = true;
      this.scene.petalsT = null;
      this.scene.set({ curtain: 1 });
      if (!this.audio.paused) this.fadeAudio(0, 500, true);
      this.updateUI();

      this.prerollTimer = setTimeout(() => {
        this.state = 'intro';
        this.show(this.introEl, true);
        this.setProgress(0);
        this.intro.start();
        this.updateUI();
      }, 750);
    }

    finishIntro() {
      this.intro.stop();
      this.show(this.introEl, false);
      this.scene.petalsT = null;
      this.scene.follow = true;
      this.scene.set(Object.assign({}, SLIDE_LOOK, { camX: SLIDE_PAN[0] }), true);
      this.wash.classList.add('fade');
      requestAnimationFrame(() => { this.wash.style.opacity = '0'; });
      if (this.keepMusic) this.fadeAudio(BGM_VOLUME, 1400, false);
      else this.fadeAudio(0, 1000, true);
      this.goTo(0, true);
    }

    skipIntro() {
      this.intro.stop();
      this.state = 'handover';
      this.wash.classList.add('fade-quick');
      this.wash.style.opacity = '1';
      setTimeout(() => {
        this.wash.classList.remove('fade-quick');
        this.finishIntro();
      }, 380);
    }

    goTo(i, fromIntro) {
      if (!this.slides.length) return;
      this.closeOverview();
      if (this.state === 'intro') this.intro.stop();
      clearTimeout(this.prerollTimer);
      this.show(this.introEl, false);
      this.show(this.standby, false);

      this.state = 'slide';
      this.index = Math.max(0, Math.min(this.slides.length - 1, i));
      this.slides.forEach((s, k) => {
        s.classList.toggle('is-left', k < this.index);
        this.show(s, k === this.index);
      });
      if (!fromIntro) {
        this.scene.follow = true;
        this.scene.set(SLIDE_LOOK);
      }
      this.scene.set({ camX: SLIDE_PAN[this.index % SLIDE_PAN.length] });
      this.hud.classList.add('is-on');
      this.ticker.classList.add('is-on');
      this.setProgress((this.index + 1) / this.slides.length);
      this.updateUI();
    }

    next() {
      if (this.state === 'standby') this.startIntro();
      else if (this.state === 'intro') this.skipIntro();
      else if (this.state === 'slide' && this.index < this.slides.length - 1) this.goTo(this.index + 1);
    }

    prev() {
      if (this.state === 'slide' && this.index > 0) this.goTo(this.index - 1);
    }

    // ---------- overview ----------
    buildOverview() {
      this.overviewGrid.innerHTML = '';
      const card = (num, title, onClick) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ov-card';
        b.innerHTML = `<span class="ov-num">${num}</span><span class="ov-title"></span>`;
        b.querySelector('.ov-title').textContent = title;
        b.addEventListener('click', onClick);
        this.overviewGrid.appendChild(b);
        return b;
      };
      card('00', 'Opening titles', () => this.startIntro());
      this.slides.forEach((s, i) => {
        const c = card(String(i + 1).padStart(2, '0'), s.dataset.title || `Slide ${i + 1}`, () => this.goTo(i));
        c.dataset.index = String(i);
      });
    }

    toggleOverview() {
      this.overviewOpen = !this.overviewOpen;
      this.overview.classList.toggle('is-open', this.overviewOpen);
      this.overview.setAttribute('aria-hidden', String(!this.overviewOpen));
      this.overviewGrid.querySelectorAll('.ov-card').forEach((c) => {
        c.classList.toggle('is-current', this.state === 'slide' && c.dataset.index === String(this.index));
      });
    }

    closeOverview() {
      this.overviewOpen = false;
      this.overview.classList.remove('is-open');
      this.overview.setAttribute('aria-hidden', 'true');
    }

    // ---------- music / screen ----------
    toggleMusic() {
      this.keepMusic = !this.keepMusic;
      if (this.state === 'slide') {
        if (this.keepMusic) {
          if (this.audio.paused) {
            this.audio.volume = 0;
            this.audio.play().catch(() => {});
          }
          this.fadeAudio(BGM_VOLUME, 700, false);
        } else {
          this.fadeAudio(0, 700, true);
        }
      }
      this.updateUI();
    }

    toggleMute() {
      this.audio.muted = !this.audio.muted;
      this.updateUI();
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    }

    updateUI() {
      const label = this.state === 'slide'
        ? `${this.index + 1} / ${this.slides.length}`
        : this.state === 'standby' ? 'Ready' : 'Opening';
      this.indicator.textContent = label;
      this.btnMusic.classList.toggle('is-on', this.keepMusic);
      this.btnMute.classList.toggle('is-on', !this.audio.muted);
      this.btnMute.setAttribute('aria-label', this.audio.muted ? 'Unmute' : 'Mute');
    }

    // ---------- input ----------
    bind() {
      const on = (id, fn) => document.getElementById(id).addEventListener('click', (e) => {
        e.currentTarget.blur(); // so Space / Enter keep driving the show, not the button
        fn();
      });
      on('btn-start', () => this.startIntro());
      on('btn-fullscreen', () => this.toggleFullscreen());
      on('ctrl-prev', () => this.prev());
      on('ctrl-next', () => this.next());
      on('ctrl-deck', () => this.toggleOverview());
      on('ctrl-intro', () => this.startIntro());
      on('ctrl-music', () => this.toggleMusic());
      on('ctrl-mute', () => this.toggleMute());
      on('ctrl-full', () => this.toggleFullscreen());
      on('ov-close', () => this.closeOverview());

      document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;
        if (k === 'Escape' && this.overviewOpen) this.closeOverview();
        else if (k === 'g' || k === 'G') this.toggleOverview();
        else if (k === 'f' || k === 'F') this.toggleFullscreen();
        else if (k === 'm' || k === 'M') this.toggleMute();
        else if (k === 'b' || k === 'B') this.toggleMusic();
        else if (k === 'r' || k === 'R') this.startIntro();
        else if (k === ' ' || k === 'Enter' || k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown') this.next();
        else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') this.prev();
        else return;
        e.preventDefault();
      });

      // controls appear while the mouse moves
      let idle = null;
      const wake = () => {
        this.controls.classList.add('is-awake');
        clearTimeout(idle);
        idle = setTimeout(() => this.controls.classList.remove('is-awake'), 2200);
      };
      this.stage.addEventListener('mousemove', wake);
      this.controls.addEventListener('mouseenter', () => clearTimeout(idle));
      this.controls.addEventListener('mouseleave', wake);
    }
  }

  global.BekhruzShow = new Show();
})(window);
