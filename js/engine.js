/**
 * BEKHRUZ NEWS — Rebuilt Modular Presentation Engine
 * Supports: Standby -> 3D Intro -> Dynamic Slide Registry -> Overview Grid (G) -> Audio Fade/BGM Control.
 */
(function (global) {
  'use strict';

  class BekhruzNewsEngine {
    constructor() {
      this.stage = document.getElementById('stage');
      this.canvasEl = document.getElementById('broadcast-canvas');
      this.audio = document.getElementById('intro-audio');

      this.sceneStandby = document.getElementById('scene-standby');
      this.sceneIntro = document.getElementById('scene-intro');
      this.slides = Array.from(document.querySelectorAll('#slides-container .scene-slide'));

      this.hudTop = document.querySelector('.broadcast-hud-top');
      this.lowerThird = document.getElementById('lower-third');
      this.liveClock = document.getElementById('live-clock');
      this.progressFill = document.getElementById('engine-progress-fill');
      this.ctrlIndicator = document.getElementById('ctrl-indicator');

      this.overviewModal = document.getElementById('overview-modal');
      this.overviewGrid = document.getElementById('overview-grid');

      this.btnStartAir = document.getElementById('btn-start-air');
      this.btnFullscreenStandby = document.getElementById('btn-fullscreen-standby');
      this.btnReplayIntro = document.getElementById('btn-replay-intro');
      this.btnCloseOverview = document.getElementById('btn-close-overview');

      this.ctrlPrev = document.getElementById('ctrl-prev');
      this.ctrlNext = document.getElementById('ctrl-next');
      this.ctrlGrid = document.getElementById('ctrl-grid');
      this.ctrlReplay = document.getElementById('ctrl-replay');
      this.ctrlBgm = document.getElementById('ctrl-bgm');
      this.ctrlMute = document.getElementById('ctrl-mute');
      this.ctrlFullscreen = document.getElementById('ctrl-fullscreen');

      this.state = 'standby'; // 'standby' | 'intro' | 'slide'
      this.slideIndex = 0;
      this.keepBgm = true; // Keep soft Hawaiian ukulele in slides by default
      this.overviewOpen = false;
      this.fadeTimer = null;

      this.canvasCtrl = new global.BroadcastCanvas(this.canvasEl);
      this.introDirector = new global.IntroDirector({
        audio: this.audio,
        canvasController: this.canvasCtrl,
        onProgress: (ratio) => this.setProgress(ratio * 100),
        onComplete: () => this.onIntroComplete()
      });

      this.init();
    }

    init() {
      this.startRenderLoop();
      this.startClock();
      this.buildOverviewGrid();
      this.bindEvents();
      this.updateControlsUI();
    }

    startRenderLoop() {
      let lastTs = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - lastTs) / 1000);
        lastTs = now;
        this.canvasCtrl.render(dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    startClock() {
      const update = () => {
        if (!this.liveClock) return;
        const d = new Date();
        this.liveClock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
          .map((n) => String(n).padStart(2, '0'))
          .join(':');
      };
      update();
      setInterval(update, 1000);
    }

    setProgress(percent) {
      if (this.progressFill) {
        this.progressFill.style.width = `${Math.max(0, Math.min(100, percent)).toFixed(1)}%`;
      }
    }

    clearAudioFade() {
      if (this.fadeTimer) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }

    fadeAudioTo(targetVol, durationMs = 900, pauseAtEnd = false) {
      this.clearAudioFade();
      const startVol = this.audio.volume;
      const steps = 18;
      let step = 0;
      this.fadeTimer = setInterval(() => {
        step++;
        const ratio = step / steps;
        this.audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * ratio));
        if (step >= steps) {
          this.clearAudioFade();
          if (pauseAtEnd && targetVol === 0) {
            this.audio.pause();
          }
        }
      }, durationMs / steps);
    }

    deactivateAll() {
      this.sceneStandby.classList.remove('active');
      this.sceneIntro.classList.remove('active');
      this.slides.forEach((s) => s.classList.remove('active'));
    }

    startIntro() {
      this.closeOverview();
      this.clearAudioFade();
      this.introDirector.stop();
      this.deactivateAll();
      this.state = 'intro';
      this.sceneIntro.classList.add('active');
      this.canvasCtrl.setMode('intro', 0);
      this.setProgress(0);
      this.updateControlsUI();
      this.introDirector.start();
    }

    onIntroComplete() {
      if (this.keepBgm) {
        this.fadeAudioTo(0.16, 1200, false);
      } else {
        this.fadeAudioTo(0, 1000, true);
      }
      this.goToSlide(0);
    }

    goToSlide(index) {
      if (!this.slides.length) return;
      this.closeOverview();
      this.introDirector.stop();
      this.deactivateAll();

      this.state = 'slide';
      this.slideIndex = Math.max(0, Math.min(this.slides.length - 1, index));
      this.slides[this.slideIndex].classList.add('active');

      this.hudTop.classList.add('visible');
      this.lowerThird.classList.add('visible');
      this.canvasCtrl.setMode('studio', 0);

      const progress = ((this.slideIndex + 1) / this.slides.length) * 100;
      this.setProgress(progress);
      this.updateControlsUI();
      this.highlightOverviewCard();
    }

    next() {
      if (this.state === 'standby') {
        this.startIntro();
      } else if (this.state === 'intro') {
        this.onIntroComplete();
      } else if (this.slideIndex < this.slides.length - 1) {
        this.goToSlide(this.slideIndex + 1);
      }
    }

    prev() {
      if (this.state === 'slide' && this.slideIndex > 0) {
        this.goToSlide(this.slideIndex - 1);
      } else if (this.state === 'slide' && this.slideIndex === 0) {
        this.startIntro();
      }
    }

    buildOverviewGrid() {
      if (!this.overviewGrid) return;
      this.overviewGrid.innerHTML = '';

      const introCard = document.createElement('button');
      introCard.type = 'button';
      introCard.className = 'overview-card';
      introCard.innerHTML = `
        <div class="overview-card-num">00 • INTRO</div>
        <div class="overview-card-title">3D Hawaiian Broadcast Intro</div>
      `;
      introCard.addEventListener('click', () => this.startIntro());
      this.overviewGrid.appendChild(introCard);

      this.slides.forEach((slide, idx) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'overview-card';
        card.dataset.slideIdx = String(idx);
        const title = slide.dataset.title || `Slide ${idx + 1}`;
        card.innerHTML = `
          <div class="overview-card-num">SLIDE ${String(idx + 1).padStart(2, '0')}</div>
          <div class="overview-card-title">${title}</div>
        `;
        card.addEventListener('click', () => this.goToSlide(idx));
        this.overviewGrid.appendChild(card);
      });
    }

    highlightOverviewCard() {
      if (!this.overviewGrid) return;
      const cards = this.overviewGrid.querySelectorAll('.overview-card');
      cards.forEach((c) => c.classList.remove('current'));
      const active = this.overviewGrid.querySelector(`[data-slide-idx="${this.slideIndex}"]`);
      if (active) active.classList.add('current');
    }

    toggleOverview() {
      this.overviewOpen = !this.overviewOpen;
      if (this.overviewModal) {
        this.overviewModal.classList.toggle('open', this.overviewOpen);
        this.overviewModal.setAttribute('aria-hidden', String(!this.overviewOpen));
      }
    }

    closeOverview() {
      this.overviewOpen = false;
      if (this.overviewModal) {
        this.overviewModal.classList.remove('open');
        this.overviewModal.setAttribute('aria-hidden', 'true');
      }
    }

    toggleBgm() {
      this.keepBgm = !this.keepBgm;
      if (this.state === 'slide') {
        if (this.keepBgm) {
          if (this.audio.paused) this.audio.play().catch(() => {});
          this.fadeAudioTo(0.16, 600, false);
        } else {
          this.fadeAudioTo(0, 600, true);
        }
      }
      this.updateControlsUI();
    }

    toggleMute() {
      this.audio.muted = !this.audio.muted;
      this.updateControlsUI();
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.stage.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    updateControlsUI() {
      if (this.ctrlIndicator) {
        if (this.state === 'standby') this.ctrlIndicator.textContent = 'STANDBY';
        else if (this.state === 'intro') this.ctrlIndicator.textContent = 'INTRO';
        else this.ctrlIndicator.textContent = `SLIDE ${this.slideIndex + 1}/${this.slides.length}`;
      }
      if (this.ctrlMute) {
        this.ctrlMute.textContent = this.audio.muted ? '🔇' : '🔊';
      }
      if (this.ctrlBgm) {
        this.ctrlBgm.classList.toggle('active', this.keepBgm);
      }
    }

    bindEvents() {
      this.btnStartAir.addEventListener('click', () => this.startIntro());
      this.btnFullscreenStandby.addEventListener('click', () => this.toggleFullscreen());
      if (this.btnReplayIntro) this.btnReplayIntro.addEventListener('click', () => this.startIntro());
      if (this.btnCloseOverview) this.btnCloseOverview.addEventListener('click', () => this.closeOverview());

      this.ctrlPrev.addEventListener('click', () => this.prev());
      this.ctrlNext.addEventListener('click', () => this.next());
      this.ctrlGrid.addEventListener('click', () => this.toggleOverview());
      this.ctrlReplay.addEventListener('click', () => this.startIntro());
      this.ctrlBgm.addEventListener('click', () => this.toggleBgm());
      this.ctrlMute.addEventListener('click', () => this.toggleMute());
      this.ctrlFullscreen.addEventListener('click', () => this.toggleFullscreen());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.overviewOpen) {
          e.preventDefault();
          this.closeOverview();
        } else if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          this.toggleOverview();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          this.toggleFullscreen();
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          this.toggleMute();
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          this.toggleBgm();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.startIntro();
        } else if (e.key === ' ' || e.key === 'Enter') {
          if (this.state === 'standby') {
            e.preventDefault();
            this.startIntro();
          } else if (e.key === ' ') {
            e.preventDefault();
            this.next();
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        }
      });
    }
  }

  global.BekhruzNewsEngine = new BekhruzNewsEngine();
})(window);
