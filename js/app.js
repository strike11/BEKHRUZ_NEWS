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
  const SLIDE_PAN = [0, -125, -45, 75, 115, -110, -75, 130, -140, 85];

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
      this.videoEl = document.getElementById('brazil-video');

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
      this.bindMedia();
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
      const prevIndex = this.index;
      this.index = Math.max(0, Math.min(this.slides.length - 1, i));
      if (prevIndex !== this.index) this.closeAllMorphedTiles();
      if (this.videoEl && prevIndex !== this.index && !this.videoEl.paused) {
        this.videoEl.pause();
      }
      if (this.zePopup && !this.zePopup.closed && this.slides[this.index].id !== 'slide-weather-map') {
        try { this.zePopup.close(); } catch (e) {}
      }
      this.slides.forEach((s, k) => {
        s.classList.toggle('is-left', k < this.index);
        this.show(s, k === this.index);
      });
      if (this.slides[this.index] && this.slides[this.index].id === 'slide-weather-map') {
        this.ensureSatelliteMap();
      }
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
      card('OPEN', 'Opening titles', () => this.startIntro());
      this.slides.forEach((s, i) => {
        const num = s.dataset.num || String(i + 1).padStart(2, '0');
        const c = card(num, s.dataset.title || `Slide ${i + 1}`, () => this.goTo(i));
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

      document.querySelectorAll('[data-goto]').forEach((el) => {
        el.addEventListener('click', () => {
          const raw = el.dataset.goto;
          const byId = document.getElementById(raw);
          if (byId) {
            const idx = this.slides.indexOf(byId);
            if (idx !== -1) this.goTo(idx);
            return;
          }
          const target = parseInt(raw, 10);
          if (!Number.isNaN(target)) this.goTo(target);
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;
        if (k === 'Escape' && this.overviewOpen) this.closeOverview();
        else if (k === 'Escape' && this.hasOpenMorphedTile()) this.closeAllMorphedTiles();
        else if (k === 'g' || k === 'G') this.toggleOverview();
        else if (k === 'f' || k === 'F') this.toggleFullscreen();
        else if (k === 'm' || k === 'M') this.toggleMute();
        else if (k === 'b' || k === 'B') this.toggleMusic();
        else if (k === 'r' || k === 'R') this.startIntro();
        else if (k >= '0' && k <= '9' && Number(k) < this.slides.length) this.goTo(Number(k));
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

    // ---------- interactive satellite map & brazil live stream video ----------
    ensureSatelliteMap() {
      if (this.satMap) {
        setTimeout(() => this.satMap.invalidateSize(), 120);
        setTimeout(() => this.satMap.invalidateSize(), 550);
        return;
      }
      const host = document.getElementById('satellite-map');
      if (!host || !global.L) return;

      const L = global.L;
      const map = L.map(host, {
        center: [5, -68],
        zoom: 3,
        minZoom: 2,
        maxZoom: 10,
        zoomControl: true,
        attributionControl: false
      });
      this.satMap = map;

      // 1. High-resolution Satellite Earth imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 10
      }).addTo(map);

      // 2. Live NASA/NOAA GOES-East ABI GeoColor Satellite Cloud Layer (same source as Zoom Earth)
      this.cloudsLayer = L.tileLayer(
        'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.jpg',
        { maxNativeZoom: 7, maxZoom: 10, opacity: 0.78 }
      ).addTo(map);

      // 3. Country borders & place labels
      L.tileLayer(
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 10, opacity: 0.9 }
      ).addTo(map);

      // 4. Live RainViewer precipitation radar layer
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then((r) => r.json())
        .then((data) => {
          if (data && data.radar && data.radar.past && data.radar.past.length) {
            const latest = data.radar.past[data.radar.past.length - 1];
            this.radarLayer = L.tileLayer(
              `${data.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
              { maxNativeZoom: 7, maxZoom: 10, opacity: 0.72 }
            ).addTo(map);
          }
        })
        .catch(() => {});

      // 5. Interactive weather points
      const makePin = (color, label) => L.divIcon({
        className: 'ze-storm-pin',
        html: `<div class="ze-pin-ring" style="--pin:${color}"></div><div class="ze-pin-dot" style="--pin:${color}"></div><span class="ze-pin-tag">${label}</span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      this.weatherPoints = {
        brazil: { coords: [-28.23, -52.4], color: '#ff3b30', tag: "TUPANCIRETÃ · 71 MPH", place: "Tupanciretã, Rio Grande do Sul, Brazil", wind: "114 km/h (71 mph) · tornado, NW gusts", temp: "19°C (66°F)", trend: "Cooling −7°C · cold front", trendKind: 'cool', note: "\"A tornado with 114 km/h winds hit Tupanciretã in southern Brazil, and temperatures dropped 7 degrees as a cold front moved in.\"" },
        saopaulo: { coords: [-23.55, -46.63], color: '#fb7185', tag: "SÃO PAULO · 42 MPH", place: "São Paulo, Brazil", wind: "68 km/h (42 mph) · gusty easterly", temp: "22°C (72°F)", trend: "Cooling −4°C · storm front", trendKind: 'cool', note: "\"São Paulo is seeing gusts up to 68 km/h and heavy storms that are cooling the city by 4 degrees.\"" },
        amazon: { coords: [-3.12, -60.02], color: '#34d399', tag: "AMAZON · 31°C", place: "Manaus, Amazonas, Brazil", wind: "24 km/h (15 mph) · humid easterly trade wind", temp: "31°C (88°F)", trend: "Warming +2°C · tropical humidity", trendKind: 'warm', note: "\"The Amazon stays hot and humid at 31 degrees, with thunderstorms building over the basin.\"" },
        argentina: { coords: [-34.6, -58.38], color: '#60a5fa', tag: "BUENOS AIRES · 32 MPH", place: "Buenos Aires, Argentina", wind: "52 km/h (32 mph) · cold southerly Pampero", temp: "16°C (61°F)", trend: "Cooling −6°C · cold air outbreak", trendKind: 'cool', note: "\"Buenos Aires is getting a cold Pampero wind at 52 km/h, dropping temperatures by 6 degrees.\"" },
        mexico: { coords: [19.43, -99.13], color: '#fbbf24', tag: "MEXICO CITY · 26°C", place: "Mexico City, Mexico", wind: "30 km/h (19 mph) · warm NE breeze", temp: "26°C (79°F)", trend: "Warming +3°C · dry and sunny", trendKind: 'warm', note: "\"Central Mexico is warm and dry at 26 degrees under a strong high-pressure system.\"" },
        oklahoma: { coords: [35.47, -97.52], color: '#ff9500', tag: "OKLAHOMA · 60 MPH", place: "Oklahoma & Kansas, USA", wind: "96 km/h (60 mph) · northerly squall winds", temp: "11°C (52°F)", trend: "Cooling −9°C · cold front", trendKind: 'cool', note: "\"Oklahoma and Kansas face 60 mph wind gusts as a cold front drops temperatures by 9 degrees.\"" },
        texas: { coords: [31.97, -99.9], color: '#f97316', tag: "TEXAS · 48 MPH", place: "Texas (Dallas – Austin), USA", wind: "78 km/h (48 mph) · gusty northwesterly", temp: "18°C (64°F)", trend: "Cooling −6°C in 24 hours", trendKind: 'cool', note: "\"A squall line is crossing central Texas with 48 mph gusts, and it is 6 degrees colder than yesterday.\"" },
        arizona: { coords: [33.45, -112.07], color: '#ffcc00', tag: "ARIZONA · 34°C", place: "Arizona & Nevada, USA", wind: "18 km/h (11 mph) · dry southwesterly", temp: "34°C (94°F)", trend: "Warming +6°C · heat dome", trendKind: 'warm', note: "\"A heat dome keeps Arizona at 34 degrees, six degrees above the seasonal average.\"" },
        california: { coords: [34.05, -118.24], color: '#f59e0b', tag: "CALIFORNIA · 26 MPH", place: "Los Angeles, California, USA", wind: "42 km/h (26 mph) · dry Santa Ana winds", temp: "29°C (84°F)", trend: "Warming +5°C · hot dry air", trendKind: 'warm', note: "\"Dry Santa Ana winds are pushing Los Angeles up to 29 degrees, five degrees warmer than normal.\"" },
        washington: { coords: [47.61, -122.33], color: '#38bdf8', tag: "SEATTLE · 36 MPH", place: "Washington & Oregon, USA", wind: "58 km/h (36 mph) · wet Pacific westerly", temp: "9°C (48°F)", trend: "Cooling −4°C · Pacific cyclone", trendKind: 'cool', note: "\"A Pacific storm is bringing rain and 36 mph winds to Seattle, with temperatures down 4 degrees.\"" },
        colorado: { coords: [39.74, -104.99], color: '#60a5fa', tag: "COLORADO · 45 MPH", place: "Colorado & Wyoming, USA", wind: "72 km/h (45 mph) · cold mountain NW wind", temp: "3°C (37°F)", trend: "Cooling −10°C · sleet in the mountains", trendKind: 'cool', note: "\"The Rockies are dropping 10 degrees fast, with 45 mph mountain gusts and sleet.\"" },
        minnesota: { coords: [44.98, -93.27], color: '#818cf8', tag: "MINNESOTA · −2°C", place: "Minnesota & North Dakota, USA", wind: "64 km/h (40 mph) · icy Arctic northerly", temp: "−2°C (28°F)", trend: "Cooling −11°C · Arctic air", trendKind: 'cool', note: "\"Arctic air has pushed Minnesota below freezing, 11 degrees colder than yesterday.\"" },
        illinois: { coords: [41.88, -87.63], color: '#38bdf8', tag: "CHICAGO · 47 MPH", place: "Illinois & Michigan, USA", wind: "76 km/h (47 mph) · stormy Great Lakes wind", temp: "7°C (45°F)", trend: "Cooling −8°C · cold front", trendKind: 'cool', note: "\"Chicago is seeing 47 mph Great Lakes gusts that are delaying flights, with temperatures down 8 degrees.\"" },
        louisiana: { coords: [29.95, -90.07], color: '#2dd4bf', tag: "NEW ORLEANS · 41 MPH", place: "Louisiana & Mississippi, USA", wind: "66 km/h (41 mph) · stormy southerly from the Gulf", temp: "24°C (75°F)", trend: "Warming +3°C · tropical downpours", trendKind: 'warm', note: "\"Warm Gulf air is bringing heavy rain and 41 mph gusts to New Orleans, with flood risk rising.\"" },
        georgia: { coords: [33.75, -84.39], color: '#fb923c', tag: "ATLANTA · 31 MPH", place: "Georgia & North Carolina, USA", wind: "50 km/h (31 mph) · gusty southwesterly", temp: "20°C (68°F)", trend: "Warming +2°C · ahead of the front", trendKind: 'warm', note: "\"Atlanta is slightly warmer at 20 degrees before a storm front arrives from the west.\"" },
        florida: { coords: [25.76, -80.19], color: '#f43f5e', tag: "FLORIDA · 34 MPH", place: "Miami & Orlando, Florida, USA", wind: "54 km/h (34 mph) · humid southeasterly breeze", temp: "28°C (82°F)", trend: "Warming +4°C · subtropical flow", trendKind: 'warm', note: "\"Florida is hot and humid at 28 degrees, with tropical showers along the coast.\"" },
        newyork: { coords: [40.71, -74.01], color: '#a78bfa', tag: "NEW YORK · 39 MPH", place: "New York & Pennsylvania, USA", wind: "62 km/h (39 mph) · Atlantic northeasterly", temp: "12°C (54°F)", trend: "Cooling −5°C · Atlantic cyclone", trendKind: 'cool', note: "\"The U.S. East Coast is wet and windy, with gusts of 39 mph and temperatures down 5 degrees.\"" },
        hawaii: { coords: [21.31, -157.86], color: '#fbbf24', tag: "HAWAII · 28°C", place: "Honolulu, Hawaii, USA", wind: "28 km/h (17 mph) · gentle NE trade wind", temp: "28°C (82°F)", trend: "Warming +2°C · sunny breeze", trendKind: 'warm', note: "\"Hawaii enjoys perfect weather at 28 degrees with a gentle trade wind.\"" },
        alaska: { coords: [61.22, -149.9], color: '#93c5fd', tag: "ALASKA · −9°C", place: "Anchorage, Alaska, USA", wind: "48 km/h (30 mph) · frosty northerly", temp: "−9°C (16°F)", trend: "Cooling −6°C · polar front", trendKind: 'cool', note: "\"Alaska is freezing at minus 9 degrees with snow and 30 mph northerly winds.\"" }
      };

      this.pins = {};
      Object.keys(this.weatherPoints).forEach((key) => {
        const pt = this.weatherPoints[key];
        const marker = L.marker(pt.coords, { icon: makePin(pt.color, pt.tag) }).addTo(map);
        marker.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev);
          this.showWeatherCheatSheet(pt);
        });
        this.pins[key] = marker;
      });

      // Clicking any arbitrary spot on the map probes wind, temp, and warming/cooling
      map.on('click', (ev) => {
        this.probeMapPoint(ev.latlng.lat, ev.latlng.lng);
      });

      const closeCs = document.getElementById('zec-close');
      if (closeCs) {
        closeCs.addEventListener('click', (e) => {
          e.stopPropagation();
          const box = document.getElementById('ze-cheatsheet');
          if (box) box.classList.remove('is-open');
        });
      }

      L.DomEvent.disableClickPropagation(document.getElementById('ze-cheatsheet'));

      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 650);
    }

    showWeatherCheatSheet(pt) {
      const box = document.getElementById('ze-cheatsheet');
      if (!box) return;
      box.classList.add('is-open');
      const placeEl = document.getElementById('zec-place');
      const windEl = document.getElementById('zec-wind');
      const tempEl = document.getElementById('zec-temp');
      const trendEl = document.getElementById('zec-trend');
      const noteEl = document.getElementById('zec-note');

      if (placeEl) placeEl.textContent = pt.place;
      if (windEl) windEl.textContent = pt.wind;
      if (tempEl) tempEl.textContent = pt.temp;
      if (trendEl) {
        trendEl.textContent = pt.trend;
        trendEl.className = `zec-val ${pt.trendKind === 'warm' ? 'zec-trend-warm' : 'zec-trend-cool'}`;
      }
      if (noteEl) noteEl.textContent = pt.note;
    }

    probeMapPoint(lat, lng) {
      const L = global.L;
      if (!this.satMap || !L) return;
      if (this.probeMarker) this.satMap.removeLayer(this.probeMarker);

      const pin = L.divIcon({
        className: 'ze-storm-pin',
        html: '<div class="ze-pin-ring" style="--pin:#38bdf8"></div><div class="ze-pin-dot" style="--pin:#38bdf8"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      this.probeMarker = L.marker([lat, lng], { icon: pin }).addTo(this.satMap);

      const where = `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(1)}°${lng >= 0 ? 'E' : 'W'}`;
      this.showWeatherCheatSheet({
        place: `Selected point (${where})`,
        wind: 'Loading…',
        temp: 'Loading…',
        trend: 'Loading…',
        trendKind: 'cool',
        note: ''
      });

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max&past_days=1&forecast_days=2&timezone=auto`;
      fetch(url)
        .then((r) => r.json())
        .then((d) => {
          if (!d || !d.current) throw new Error('no data');
          const tC = Math.round(d.current.temperature_2m);
          const tF = Math.round(tC * 1.8 + 32);
          const wKmh = Math.round(d.current.wind_speed_10m);
          const wMph = Math.round(wKmh * 0.621371);
          const gKmh = Math.round(d.current.wind_gusts_10m || wKmh);
          const dirs = ['northerly', 'northeasterly', 'easterly', 'southeasterly', 'southerly', 'southwesterly', 'westerly', 'northwesterly'];
          const dir = dirs[Math.round(((d.current.wind_direction_10m || 0) % 360) / 45) % 8];
          let diff = 0;
          if (d.daily && d.daily.temperature_2m_max && d.daily.temperature_2m_max.length >= 2) {
            diff = Math.round(d.daily.temperature_2m_max[1] - d.daily.temperature_2m_max[0]);
          }
          const warm = diff >= 0;
          const n = Math.max(1, Math.abs(diff));
          this.showWeatherCheatSheet({
            place: `Selected point (${where})`,
            wind: `${wKmh} km/h (${wMph} mph) · ${dir}, gusts to ${gKmh} km/h`,
            temp: `${tC}°C (${tF}°F)`,
            trend: warm ? `Warming +${n}°C vs. yesterday` : `Cooling −${n}°C vs. yesterday`,
            trendKind: warm ? 'warm' : 'cool',
            note: `"It is ${tC} degrees here with a ${dir} wind at ${wKmh} km/h, and it is ${warm ? 'warming up' : 'getting colder'} by ${n} degrees."`
          });
        })
        .catch(() => {
          this.showWeatherCheatSheet({
            place: `Selected point (${where})`,
            wind: 'No data', temp: 'No data', trend: 'No data', trendKind: 'cool',
            note: 'Live weather data is unavailable for this point.'
          });
        });
    }

    bindMedia() {
      const urlDisplay = document.getElementById('wv-url-display');
      const flyBtns = Array.from(document.querySelectorAll('[data-map-fly]'));
      this.currentZeUrl = 'https://zoom.earth/maps/satellite/#view=5,-68,3z';

      flyBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.currentTarget.blur();
          this.ensureSatelliteMap();
          const parts = (btn.dataset.mapFly || '').split(',').map(Number);
          const label = btn.dataset.mapLabel || 'https://zoom.earth/maps/satellite/';
          this.currentZeUrl = label;
          if (urlDisplay) urlDisplay.textContent = label;
          if (this.satMap && parts.length === 3) {
            this.satMap.flyTo([parts[0], parts[1]], parts[2], { duration: 1.1 });
            const pinKey = btn.dataset.mapPin;
            if (pinKey && this.weatherPoints && this.weatherPoints[pinKey]) {
              this.showWeatherCheatSheet(this.weatherPoints[pinKey]);
            }
          }
          if (this.zePopup && !this.zePopup.closed) {
            try { this.zePopup.location.href = label; this.zePopup.focus(); } catch (err) {}
          }
          flyBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        });
      });

      const cloudsBtn = document.getElementById('wv-toggle-clouds');
      if (cloudsBtn) {
        cloudsBtn.addEventListener('click', (e) => {
          e.currentTarget.blur();
          this.ensureSatelliteMap();
          if (!this.satMap || !this.cloudsLayer) return;
          if (this.satMap.hasLayer(this.cloudsLayer)) {
            this.satMap.removeLayer(this.cloudsLayer);
            cloudsBtn.classList.remove('is-active');
          } else {
            this.cloudsLayer.addTo(this.satMap);
            cloudsBtn.classList.add('is-active');
          }
        });
      }

      const popupBtn = document.getElementById('wv-popup-ze');
      if (popupBtn) {
        popupBtn.addEventListener('click', (e) => {
          e.currentTarget.blur();
          const box = document.getElementById('satellite-map');
          const r = box ? box.getBoundingClientRect() : { left: 120, top: 120, width: 1280, height: 720 };
          const left = Math.round((window.screenX || window.screenLeft || 0) + r.left);
          const top = Math.round((window.screenY || window.screenTop || 0) + r.top + 40);
          const width = Math.max(720, Math.round(r.width));
          const height = Math.max(460, Math.round(r.height));
          this.zePopup = window.open(
            this.currentZeUrl || 'https://zoom.earth/maps/satellite/',
            'ZoomEarthLiveWindow',
            `popup=yes,width=${width},height=${height},left=${left},top=${top}`
          );
        });
      }

      // Maria Fernanda Brazil live stream video player
      const v = this.videoEl;
      if (!v) return;
      const bigPlay = document.getElementById('stream-big-play');
      const btnPlay = document.getElementById('stream-btn-play');
      const btnRestart = document.getElementById('stream-btn-restart');
      const btnMute = document.getElementById('stream-btn-mute');
      const progWrap = document.getElementById('stream-progress-wrap');
      const progBar = document.getElementById('stream-progress-bar');
      const tc = document.getElementById('stream-timecode');

      const fmt = (sec) => {
        const s = Math.max(0, Math.floor(sec || 0));
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
      };

      const syncVideoUI = () => {
        const playing = !v.paused && !v.ended;
        if (bigPlay) bigPlay.classList.toggle('is-hidden', playing);
        if (btnPlay) btnPlay.textContent = playing ? 'Pause' : 'Play';
        if (btnMute) btnMute.textContent = v.muted ? 'Muted' : 'Sound On';
        const dur = v.duration || 46;
        const cur = v.currentTime || 0;
        if (progBar) progBar.style.width = `${Math.min(100, (cur / dur) * 100).toFixed(2)}%`;
        if (tc) tc.textContent = `${fmt(cur)} / ${fmt(dur)}`;
      };

      const togglePlay = () => {
        if (v.paused || v.ended) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      };

      if (bigPlay) bigPlay.addEventListener('click', (e) => { e.stopPropagation(); e.currentTarget.blur(); togglePlay(); });
      if (btnPlay) btnPlay.addEventListener('click', (e) => { e.stopPropagation(); e.currentTarget.blur(); togglePlay(); });
      v.addEventListener('click', () => togglePlay());

      if (btnRestart) {
        btnRestart.addEventListener('click', (e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          v.currentTime = 0;
          v.play().catch(() => {});
        });
      }

      if (btnMute) {
        btnMute.addEventListener('click', (e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          v.muted = !v.muted;
          syncVideoUI();
        });
      }

      if (progWrap) {
        progWrap.addEventListener('click', (e) => {
          e.stopPropagation();
          const rect = progWrap.getBoundingClientRect();
          if (!rect.width) return;
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          v.currentTime = ratio * (v.duration || 46);
          syncVideoUI();
        });
      }

      // Duck background music while live stream video is playing so Maria Fernanda's voice is clear
      v.addEventListener('play', () => {
        if (!this.audio.paused) this.fadeAudio(0.02, 350, false);
        syncVideoUI();
      });
      v.addEventListener('pause', () => {
        if (this.state === 'slide' && this.keepMusic) this.fadeAudio(BGM_VOLUME, 600, false);
        syncVideoUI();
      });
      v.addEventListener('ended', () => {
        if (this.state === 'slide' && this.keepMusic) this.fadeAudio(BGM_VOLUME, 600, false);
        syncVideoUI();
      });
      v.addEventListener('timeupdate', syncVideoUI);
      v.addEventListener('loadedmetadata', syncVideoUI);

      // End of the report: violent glitch over the whole show, then a hard cut to the "signal lost" slide
      this.glitchArmed = true;
      v.addEventListener('timeupdate', () => {
        const dur = v.duration || 0;
        if (!dur) return;
        if (v.currentTime < dur - 1.6) this.glitchArmed = true;
        if (this.glitchArmed && !v.paused && v.currentTime >= dur - 1.0) {
          this.glitchArmed = false;
          this.startSignalLoss();
        }
      });
      v.addEventListener('ended', () => {
        if (this.glitchArmed) {
          this.glitchArmed = false;
          this.startSignalLoss();
        }
      });

      this.bindMorphTiles();
    }

    glitchNoise(ms) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = this.actx || (this.actx = new AC());
        if (ctx.state === 'suspended') ctx.resume();
        const len = Math.floor(ctx.sampleRate * ms / 1000);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let gate = 1;
        for (let i = 0; i < len; i++) {
          if (i % 1800 === 0) gate = Math.random() < 0.35 ? 0 : 1;
          data[i] = (Math.random() * 2 - 1) * gate * (0.5 + 0.5 * Math.sin(i / 90));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.value = 0.28;
        src.connect(g);
        g.connect(ctx.destination);
        src.start();
      } catch (e) { /* audio is optional */ }
    }

    setGlitch(on, hard) {
      this.stage.classList.toggle('is-glitching', on);
      this.stage.classList.toggle('is-glitch-hard', Boolean(on && hard));
    }

    startSignalLoss() {
      const lostIdx = this.slides.findIndex((s) => s.id === 'slide-signal-lost');
      if (lostIdx === -1 || this.signalLossBusy) return;
      this.signalLossBusy = true;
      clearTimeout(this.glitchTimer);
      this.setGlitch(true, false);
      this.glitchNoise(1500);
      this.glitchTimer = setTimeout(() => {
        // hard cut while the picture is still tearing
        this.setGlitch(true, true);
        this.goTo(lostIdx);
        this.glitchTimer = setTimeout(() => {
          this.setGlitch(false);
          this.signalLossBusy = false;
        }, 650);
      }, 1050);
    }

    hasOpenMorphedTile() {
      return Boolean(document.querySelector('.tile-morph-overlay.is-open, .excel-modal.is-open'));
    }

    closeAllMorphedTiles() {
      document.querySelectorAll('.tile-morph-overlay.is-open').forEach((ov) => {
        ov.classList.remove('is-open');
        ov.setAttribute('aria-hidden', 'true');
        const hostCard = ov.closest('.card-media-dense');
        if (hostCard) hostCard.classList.remove('has-morphed');
      });
      document.querySelectorAll('.excel-modal.is-open').forEach((em) => {
        em.classList.remove('is-open');
        em.setAttribute('aria-hidden', 'true');
      });
    }

    bindMorphTiles() {
      document.querySelectorAll('.card-media-dense').forEach((hostCard) => {
        const overlay = hostCard.querySelector('.tile-morph-overlay');
        if (!overlay) return;
        const morphCard = overlay.querySelector('.tile-morph-card');
        const visualBox = overlay.querySelector('.tm-visual');
        const tagEl = overlay.querySelector('.tm-tag');
        const titleEl = overlay.querySelector('.tm-title');
        const s1El = overlay.querySelector('.tm-s1');
        const s2El = overlay.querySelector('.tm-s2');
        const closeBtn = overlay.querySelector('.tm-close');

        const openTile = (tile) => {
          const imgWrap = tile.querySelector('.mc-img-wrap');
          if (imgWrap && visualBox) {
            visualBox.innerHTML = imgWrap.innerHTML;
            visualBox.className = `tm-visual ${imgWrap.className.replace('mc-img-wrap', '').trim()}`;
            const clonedTag = visualBox.querySelector('.mc-tag');
            if (clonedTag) clonedTag.remove();
          }
          if (tagEl) tagEl.textContent = tile.dataset.tag || '';
          if (titleEl) titleEl.textContent = tile.dataset.title || '';
          if (s1El) s1El.textContent = tile.dataset.s1 || '';
          if (s2El) s2El.textContent = tile.dataset.s2 || '';

          // FLIP morph from clicked tile bounds to expanded card bounds
          const tileRect = tile.getBoundingClientRect();
          hostCard.classList.add('has-morphed');
          overlay.classList.add('is-open');
          overlay.setAttribute('aria-hidden', 'false');

          const targetRect = morphCard.getBoundingClientRect();
          if (tileRect.width && targetRect.width) {
            const dx = (tileRect.left + tileRect.width / 2) - (targetRect.left + targetRect.width / 2);
            const dy = (tileRect.top + tileRect.height / 2) - (targetRect.top + targetRect.height / 2);
            const sx = Math.max(0.18, tileRect.width / targetRect.width);
            const sy = Math.max(0.18, tileRect.height / targetRect.height);

            morphCard.style.transition = 'none';
            morphCard.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
            morphCard.offsetHeight; // force reflow
            morphCard.style.transition = 'transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)';
            morphCard.style.transform = 'none';
          }
        };

        const closeTile = () => {
          overlay.classList.remove('is-open');
          overlay.setAttribute('aria-hidden', 'true');
          hostCard.classList.remove('has-morphed');
        };

        hostCard.querySelectorAll('.media-card').forEach((tile) => {
          tile.addEventListener('click', (e) => {
            e.stopPropagation();
            openTile(tile);
          });
          tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              openTile(tile);
            }
          });
        });

        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.currentTarget.blur();
            closeTile();
          });
        }
        morphCard.addEventListener('click', (e) => {
          e.stopPropagation();
          closeTile();
        });
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) closeTile();
        });
      });

      const excelModal = document.getElementById('excel-modal');
      const btnOpenExcel = document.getElementById('btn-open-excel');
      const btnCloseExcel = document.getElementById('btn-close-excel');
      if (excelModal && btnOpenExcel) {
        btnOpenExcel.addEventListener('click', (e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          excelModal.classList.add('is-open');
          excelModal.setAttribute('aria-hidden', 'false');
        });
      }
      if (excelModal && btnCloseExcel) {
        btnCloseExcel.addEventListener('click', (e) => {
          e.stopPropagation();
          e.currentTarget.blur();
          excelModal.classList.remove('is-open');
          excelModal.setAttribute('aria-hidden', 'true');
        });
      }
      if (excelModal) {
        excelModal.addEventListener('click', (e) => {
          if (e.target === excelModal) {
            excelModal.classList.remove('is-open');
            excelModal.setAttribute('aria-hidden', 'true');
          }
        });
      }
    }
  }

  global.BekhruzShow = new Show();
})(window);
