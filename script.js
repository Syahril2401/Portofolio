/* ============================================================
   SMOOTH SCROLL — global, once per page
   ------------------------------------------------------------
   Lenis drives the REAL window scroll; it does not transform a wrapper, so
   `position: sticky` and `animation-timeline: scroll()/view()` keep working.

   This lives at the top of the file, outside every page-specific IIFE, because
   smooth scroll belongs to the site and not to one page. It used to be
   initialised inside the projects IIFE, which meant only index.html scrolled
   smoothly and every other page fell back to the native jump.

   Disabled entirely under prefers-reduced-motion.
   ============================================================ */
(function initSmoothScroll() {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || typeof window.Lenis !== 'function') return;

  var lenis = new window.Lenis({
    wheelMultiplier: 0.7,   // slightly slow the wheel, like the reference
    syncTouch: false,
    lerp: 0.1               // smoothing factor; lower = heavier/floatier
  });
  window.__lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* one listener, fanned out to anything that wants scroll updates. Pages add
     their own by pushing onto window.__onScroll; the project page uses it for
     the progress bar so the bar tracks Lenis' interpolated position rather than
     the browser's. */
  var subs = [];
  window.__onScroll = function (fn) { subs.push(fn); };
  lenis.on('scroll', function (e) {
    for (var i = 0; i < subs.length; i++) subs[i](e);
  });
})();

/* ============================================================
   I18N — language switch (ID / EN), global, once per page
   ------------------------------------------------------------
   One dictionary, two locales. Static HTML text is tagged with
   data-i18n="key" (and data-i18n-attr for attributes); JS-generated text
   reads window.__i18n.t('key'). The choice is saved in localStorage and
   applied on load, so it persists across pages and reloads.
   ============================================================ */
(function initI18n() {
  'use strict';

  var DICT = {
    id: {
      'menu.home': 'Beranda',
      'menu.project': 'Proyek',
      'menu.contact': 'Kontak',
      'menu.toggle': 'Menu',
      'hero.intro': 'Hai, saya Muhammad Syahril, seorang developer kreatif yang senang menghidupkan proyek Anda.',
      'portrait.hover': 'Arahkan',
      'portrait.tap': 'Ketuk',
      'about.title': 'Tentang',
      'about.body': 'Halo! Saya Syahril, mahasiswa Ilmu Komputer yang memiliki minat mendalam pada Artificial Intelligence, Computer Vision, serta Website & Mobile Development. Saya berfokus pada pengembangan solusi digital yang interaktif dan fungsional, mulai dari sistem deteksi bahasa isyarat real-time berbasis Python & MediaPipe, aplikasi web modern dengan Vue.js & Node.js, hingga aplikasi mobile menggunakan React Native / Expo. Saya selalu antusias mempelajari teknologi baru, memperdalam struktur data & algoritma, serta terbuka untuk berbagai peluang kolaborasi proyek teknologi.',
      'education.title': 'Pendidikan',
      'edu.cs': 'Ilmu Komputer',
      'edu.se': 'Rekayasa Perangkat Lunak',
      'when.present': '2024 - Sekarang',
      'projects.title': 'Proyek Unggulan',
      'skills.title': 'Keahlian',
      'certificate.title': 'Sertifikat',
      'footer.developed': 'Dikembangkan oleh saya 💙',
      'footer.contact': 'Kontak',
      'footer.back': 'Kembali ke proyek',
      'project.next': 'Lihat proyek berikutnya...',
      'project.nextAria': 'Proyek berikutnya',
      'project.progressAria': 'Progres ke proyek berikutnya',
      'contact.headline': 'Kirim saya pesan !',
      'contact.headlineSr': 'Kirim saya pesan!',
      'contact.mail': 'Email',
      'contact.copied': 'Email disalin ke papan klip: ',
      'contact.copyAria': 'Salin alamat email, tersalin',
      'skills.sub': 'Bahasa dan alat yang saya gunakan. Arahkan kursor ke orbit untuk memperlambatnya, atau baca daftar di bawah.',
      'type.computer-vision': 'Computer Vision',
      'type.ai-study': 'Platform belajar AI',
      'type.business': 'Platform bisnis'
    },
    en: {
      'menu.home': 'Home',
      'menu.project': 'Project',
      'menu.contact': 'Contact',
      'menu.toggle': 'Menu',
      'hero.intro': 'Hey, I’m Muhammad Syahril, a creative developer who loves to bring life to your projects.',
      'portrait.hover': 'Hover',
      'portrait.tap': 'Tap',
      'about.title': 'About',
      'about.body': 'Hi! I’m Syahril, a Computer Science student with a deep interest in Artificial Intelligence, Computer Vision, and Website & Mobile Development. I focus on building interactive, functional digital solutions - from a real-time sign-language detection system built on Python & MediaPipe, to modern web apps with Vue.js & Node.js, to mobile apps using React Native / Expo. I’m always eager to learn new technologies, deepen my data structures & algorithms, and open to any tech project collaboration.',
      'education.title': 'Education',
      'edu.cs': 'Computer Science',
      'edu.se': 'Software Engineering',
      'when.present': '2024 - Present',
      'projects.title': 'Showcased Projects',
      'skills.title': 'Skills',
      'certificate.title': 'Certificate',
      'footer.developed': 'Developed by me 💙',
      'footer.contact': 'Contact',
      'footer.back': 'Back to projects',
      'project.next': 'See next project...',
      'project.nextAria': 'Next project',
      'project.progressAria': 'Progress to next project',
      'contact.headline': 'Drop me a message !',
      'contact.headlineSr': 'Drop me a message!',
      'contact.mail': 'Mail',
      'contact.copied': 'Email copied to clipboard: ',
      'contact.copyAria': 'Copy email address, copied',
      'skills.sub': 'The languages and tools I reach for. Hover the orbits to slow them down, or read the list below.',
      'type.computer-vision': 'Computer Vision',
      'type.ai-study': 'AI study platform',
      'type.business': 'Business platform'
    }
  };

  var STORE_KEY = 'msa-lang';
  function read() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function write(l) {
    try { localStorage.setItem(STORE_KEY, l); } catch (e) {}
  }

  /* default ID (the ID button ships with .is-active) */
  var current = (read() === 'en' || read() === 'id') ? read() : 'id';

  function t(key) {
    var table = DICT[current] || DICT.id;
    return (key in table) ? table[key] : (DICT.en[key] != null ? DICT.en[key] : key);
  }

  /* fill every element tagged with data-i18n (text) / data-i18n-attr="attr:key" */
  function applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      /* format: "attr:key" (one pair) */
      var spec = el.getAttribute('data-i18n-attr').split(':');
      if (spec.length === 2) el.setAttribute(spec[0].trim(), t(spec[1].trim()));
    });
  }

  function highlightButtons() {
    document.querySelectorAll('.lang').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-lang') === current);
    });
  }

  /* listeners that want to re-render JS-built text when the language changes */
  var subs = [];

  function apply() {
    document.documentElement.setAttribute('lang', current);
    applyStatic();
    highlightButtons();
    for (var i = 0; i < subs.length; i++) { try { subs[i](current); } catch (e) {} }
  }

  function set(lang) {
    if (lang !== 'id' && lang !== 'en') return;
    if (lang === current) return;
    current = lang;
    write(current);
    apply();
  }

  window.__i18n = {
    t: t,
    lang: function () { return current; },
    set: set,
    onChange: function (fn) { subs.push(fn); }
  };

  /* wire the ID/EN buttons on whatever page we're on */
  function wire() {
    document.querySelectorAll('.lang').forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-lang')); });
    });
    apply();   /* apply the stored/default language on load */
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

/* ============================================================
   Muhammad Syahril — interactions
   Vanilla JS, no dependencies.

   Scroll is left entirely to the browser: every scroll-linked effect
   (cover fades, title fades, sticky-heading settle, progress bar) is a
   native `animation-timeline`, so this file contains no scroll loop and
   never intercepts the wheel. Interrupting the wheel and easing toward
   a target adds lag — a 12%-per-frame chase needs ~390ms to cover one
   100px mouse notch, which is what makes a custom scroller feel heavy.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- project data ----------
     Localised fields (type/blurb/body) carry both locales as { id, en }.
     `typeKey` lets the type label also come from the shared dictionary.
     A helper `pick()` below reads the field for the active language. */
    var PROJECTS = [
    { uid: 'asl-hand-sign',        name: 'ASL Hand Sign',        year: 2025,
      type: 'Computer Vision', typeKey: 'type.computer-vision',
      bg: '#E4F7F1', fg: '#0B3D34',
      cover: 'ASL_handsign/dashboard.png',
      blurb: {
        en: 'Real-time sign-language-to-text translation with MediaPipe and deep learning.',
        id: 'Penerjemahan bahasa isyarat ke teks secara real-time dengan MediaPipe dan deep learning.'
      },
      body: {
        en: [
          'HandSign translates sign language into text in real time. It watches the camera, reads the hand through MediaPipe, and runs a deep-learning model over the landmarks to work out which sign is being made - then puts the word on screen.',
          'The point is speed. A conversation cannot wait for a confirmation screen, so the recognition pipeline is built to stay short: the hand is tracked, the gesture is classified, and the text appears while the next sign is still being formed.',
          'It exists because the barrier is not the technology but the assumption - most people do not know any sign language, so a deaf person has to bring an interpreter everywhere. Removing the interpreter from the equation removes the reason for a lot of those conversations to be skipped.',
          'I worked on the recognition pipeline and the web front end that surfaces the result, keeping the feedback loop tight enough to feel immediate rather than laggy.'
        ],
        id: [
          'HandSign menerjemahkan bahasa isyarat menjadi teks secara real-time. Ia membaca kamera, mengenali tangan lewat MediaPipe, dan menjalankan model deep learning pada titik-titik tangan untuk menentukan isyarat yang dibuat - lalu menampilkan katanya di layar.',
          'Intinya adalah kecepatan. Sebuah percakapan tidak bisa menunggu layar konfirmasi, jadi pipeline pengenalannya dibuat ringkas: tangan dilacak, gestur diklasifikasikan, dan teks muncul saat isyarat berikutnya masih dibentuk.',
          'Proyek ini ada karena hambatannya bukan teknologi, melainkan asumsi - kebanyakan orang tidak mengerti bahasa isyarat, sehingga penyandang tuli harus selalu membawa penerjemah. Menghilangkan penerjemah dari persamaan menghilangkan alasan banyak percakapan terlewat.',
          'Saya mengerjakan pipeline pengenalan dan antarmuka web yang menampilkan hasilnya, menjaga umpan balik tetap cepat agar terasa langsung, bukan tersendat.'
        ]
      },
      gallery: ['ASL_handsign/dashboard.png'] },
    { uid: 'lumora',               name: 'Lumora',               year: 2026,
      type: 'AI study platform', typeKey: 'type.ai-study',
      bg: '#FFF1E0', fg: '#4A2A05',
      cover: 'Lumora/lumora-thumbnail.png',
      blurb: {
        en: 'An AI-powered study workspace: planning, SRL assessment, notes, and progress analytics.',
        id: 'Ruang belajar bertenaga AI: perencanaan, asesmen SRL, catatan, dan analitik progres.'
      },
      body: {
        en: [
          'Lumora is a study platform that puts a whole learning workspace in one place: an AI study planner, an assessment of self-regulated learning, rich notes, and progress analytics.',
          'The SRL assessment is the part I find most useful. It scores four competencies - self-regulation, metacognition, motivation, and strategy use - and tracks how they move over weeks, so a student can see which habit is actually holding them back.',
          'On top of that, the planner turns a syllabus into a schedule, notes stay tied to the topics they came from, and the analytics view shows planned hours against actual hours so consistency is visible rather than guessed.'
        ],
        id: [
          'Lumora adalah platform belajar yang menyatukan seluruh ruang belajar dalam satu tempat: perencana belajar berbasis AI, asesmen self-regulated learning, catatan yang kaya, dan analitik progres.',
          'Asesmen SRL adalah bagian yang paling berguna menurut saya. Ia menilai empat kompetensi regulasi diri, metakognisi, motivasi, dan penggunaan strategi serta melacak pergerakannya dari minggu ke minggu, sehingga siswa bisa melihat kebiasaan mana yang sebenarnya menahan mereka.',
          'Selain itu, perencana mengubah silabus menjadi jadwal, catatan tetap terhubung ke topik asalnya, dan tampilan analitik menunjukkan jam yang direncanakan dibanding jam nyata sehingga konsistensi terlihat, bukan ditebak.'
        ]
      },
      gallery: ['Lumora/lumora-dashboard.png','Lumora/lumora-planner.png','Lumora/lumora-progress.png','Lumora/lumora-targets.png','Lumora/lumora-notes.png'] },
    { uid: 'mario-cuci-sepatu',    name: 'Mario Cuci Sepatu',    year: 2026,
      type: 'Business platform', typeKey: 'type.business',
      bg: '#DCEBF7', fg: '#0B2B45',
      cover: 'MarioCuciSepatu/thumbnail-cucisepatu.WEBP',
      blurb: {
        en: 'An ordering, admin, and reporting platform for a shoe-cleaning business.',
        id: 'Platform pemesanan, admin, dan pelaporan untuk bisnis cuci sepatu.'
      },
      body: {
        en: [
          'Mario Cuci Sepatu is a platform for a shoe-cleaning business: a customer-facing site to browse services and place orders, an admin dashboard to run the day, and a financial report to see whether it is working.',
          'The admin side is built around the working day. It opens on today orders today, revenue today, queue and then the totals behind them, with quick actions for adding a service, managing orders, or opening a report.',
          'The financial report is filterable by day, week, month, or year, and breaks revenue into completed and cancelled orders so a quiet month is easy to read. Orders move through a visible queue, so nothing sits in an inbox waiting to be noticed.'
        ],
        id: [
          'Mario Cuci Sepatu adalah platform untuk bisnis cuci sepatu: situs untuk pelanggan menelusuri layanan dan memesan, dasbor admin untuk menjalankan operasional harian, dan laporan keuangan untuk melihat apakah bisnisnya berjalan.',
          'Sisi admin dibangun seputar hari kerja. Ia membuka di hari ini pesanan hari ini, pendapatan hari ini, antrean lalu total di baliknya, dengan aksi cepat untuk menambah layanan, mengelola pesanan, atau membuka laporan.',
          'Laporan keuangan bisa difilter per hari, minggu, bulan, atau tahun, dan memisahkan pendapatan menjadi pesanan selesai dan dibatalkan sehingga bulan yang sepi mudah dibaca. Pesanan bergerak melalui antrean yang terlihat, jadi tidak ada yang tertinggal tanpa diperhatikan.'
        ]
      },
      gallery: ['MarioCuciSepatu/1.dashboard.png','MarioCuciSepatu/2.user.png','MarioCuciSepatu/3.dashboard admin.png','MarioCuciSepatu/4.financial report.png'] }
  ];

  /* read a localised field: a {id,en} object -> the active locale; a plain
     string/array -> returned as-is (so untouched fields still work). */
  function pick(field) {
    var lang = window.__i18n ? window.__i18n.lang() : 'id';
    if (field && typeof field === 'object' && !Array.isArray(field)) {
      return (field[lang] != null) ? field[lang] : field.en;
    }
    return field;
  }
  window.__pickLocale = pick;

  /* Exposed so the project detail page (a separate IIFE further down this
     file) can read the same list. One source of truth for the project data:
     the home sticky list and the detail pages must never drift apart. */
  window.PROJECTS = PROJECTS;

  var DEFAULT_BG = '#F4F3EC';
  var DEFAULT_FG = '#221F21';

  /* the diagonal ↘ arrow that trails every project title */
  var ARROW = '<svg class="pj-arrow" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 13v5h-5"/></svg>';

  /* ============================================================
     1. BUILD THE PROJECTS — sticky-story layout
     ------------------------------------------------------------
     Left: ONE photo panel pinned (sticky) at the focus line, holding every
     cover stacked; only the active cover is shown (cross-fade). Right: the
     list of titles scrolls past, each title in a tall slot so they're
     spaced like the reference (~25dvh apart). The title crossing the focus
     line is active — it lights up, gets the arrow, swaps the photo and the
     page colours. Titles are <button>s (keyboard-reachable, clickable).
     ============================================================ */
  var track = document.getElementById('projects-track');
  var hasProjects = !!track;

  var coverEls = [];    // the stacked cover <img>, one per project
  var nameSlots = [];   // the title slot wrappers (used to detect active)
  var labelEls  = [];   // the <a> title link inside each title slot

  /* --- left column: ONE sticky panel, all covers stacked --- */
  var colPhotos = document.createElement('div');
  colPhotos.className = 'col-photos';
  var stage = '<div class="photo-stage"><div class="project-photo">';
  PROJECTS.forEach(function (p, i) {
    stage +=
      '<img class="stage-cover' + (i === 0 ? ' is-active' : '') + '" ' +
        'src="' + (p.cover || ('cover-' + p.uid + '.webp')) + '" ' +
        'alt="' + p.type + ' cover for ' + p.name + '" ' +
        (i === 0 ? '' : 'loading="lazy" ') + '/>';
  });
  stage += '</div></div>';
  colPhotos.innerHTML = stage;
  coverEls = Array.prototype.slice.call(colPhotos.querySelectorAll('.stage-cover'));

  /* Wrap each character of a title in its own span so CSS can run a slow
     wave across them on hover. Each letter gets a staggered delay via
     --i; spaces are preserved (and kept non-breaking so they don't
     collapse at the line edges). */
  function waveLetters(text) {
    var out = '';
    var n = 0;
    for (var c = 0; c < text.length; c++) {
      var ch = text.charAt(c);
      if (ch === ' ') { out += '<span class="ch" aria-hidden="true">&nbsp;</span>'; n++; continue; }
      out += '<span class="ch" aria-hidden="true" style="--i:' + n + '">' + ch + '</span>';
      n++;
    }
    return out;
  }

  /* --- right column: the scrolling list of titles --- */
  var colNames = document.createElement('div');
  colNames.className = 'col-names';
  PROJECTS.forEach(function (p, i) {
    var ns = document.createElement('div');
    ns.className = 'slot slot-name';
    ns.style.setProperty('--pj-fg', p.fg);
    /* An <a>, not a <button>: a project title is a destination, so it has a
       real href (project.html?p=<uid>) and middle-click / open-in-new-tab work.
       aria-pressed is meaningless on a link, so it is not set here — the
       scroll-driven "active" state is exposed with aria-current on the link
       that matches the project currently in focus. */
    var btn = document.createElement('a');
    btn.className = 'pj-label';
    btn.href = 'project.html?p=' + encodeURIComponent(p.uid);
    function typeLabel() {
      return (window.__i18n && p.typeKey) ? window.__i18n.t(p.typeKey) : p.type;
    }
    btn.innerHTML =
      '<span class="project-name">' + waveLetters(p.name) + '</span>' +
      ARROW +
      '<span class="pj-meta" aria-hidden="true">' + typeLabel() + ' - ' + p.year + '</span>';
    ns.appendChild(btn);
    colNames.appendChild(ns);
    nameSlots.push(ns);
    labelEls.push(btn);
    /* keep the type label in sync when the language changes */
    if (window.__i18n) {
      var metaEl = btn.querySelector('.pj-meta');
      window.__i18n.onChange(function () {
        metaEl.textContent = typeLabel() + ' - ' + p.year;
      });
    }
  });

  if (hasProjects) {
    track.appendChild(colPhotos);
    track.appendChild(colNames);
  }

  /* ============================================================
     2. SCROLL
     Native scrolling stays ON so `position: sticky` keeps working.
     A transformed ancestor would silently break it.
     ============================================================ */
  var maxScroll = 0;

  function measure() {
    maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  /* Lenis itself is initialised once, globally, at the top of this file — the
     smooth scroll must run on every page, not only the home page. */

  /* Programmatic jumps go through Lenis when it's active so there is still
     exactly ONE scroll implementation; otherwise fall back to native. */
  function scrollToY(y) {
    var to = Math.max(0, Math.min(y, maxScroll));
    if (window.__lenis) {
      window.__lenis.scrollTo(to);
    } else {
      window.scrollTo({ top: to, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  function goTo(selector) {
    var el = document.querySelector(selector);
    if (!el) return;
    scrollToY(el.getBoundingClientRect().top + window.scrollY);
  }

  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure).catch(function () {});
  }

  /* ============================================================
     3. ACTIVE PROJECT -> background / text colour
     The one effect that genuinely needs JS: it depends on which card is
     nearest the viewport centre, not on a scroll percentage.
     ============================================================ */
  var activeIndex = -1;
  var lastBg = DEFAULT_BG, lastFg = DEFAULT_FG;

  /* The active project is the title crossing the focus line (viewport
     centre). The sticky photo cross-fades to its cover, the title lights
     up and gets the arrow, and the page colours follow. */
  function updateActive() {
    if (!hasProjects) return;
    var vh = window.innerHeight;
    var best = -1, bestDist = Infinity;
    /* A title only counts as active when its centre is within this band of
       the viewport centre. Outside it (e.g. while still on the hero) no
       project is active, so the page stays on the neutral default colour. */
    var ACTIVE_BAND = vh * 0.5;
    for (var i = 0; i < nameSlots.length; i++) {
      var r = nameSlots[i].getBoundingClientRect();
      var centre = r.top + r.height / 2;
      var d = Math.abs(centre - vh / 2);
      if (d < ACTIVE_BAND && d < bestDist) { bestDist = d; best = i; }
    }
    if (best === activeIndex) return;
    activeIndex = best;
    for (var j = 0; j < nameSlots.length; j++) {
      var on = (j === best);
      nameSlots[j].classList.toggle('is-active', on);
      if (coverEls[j]) coverEls[j].classList.toggle('is-active', on);
      if (on) labelEls[j].setAttribute('aria-current', 'true');
      else   labelEls[j].removeAttribute('aria-current');
    }
    var p = best >= 0 ? PROJECTS[best] : null;
    var bg = p ? p.bg : DEFAULT_BG;
    var fg = p ? p.fg : DEFAULT_FG;
    if (bg === lastBg && fg === lastFg) return;
    lastBg = bg; lastFg = fg;
    document.body.style.setProperty('--bg-color', bg);
    document.body.style.setProperty('--text-color', fg);
  }

  /* ============================================================
     4. HEADER — hide on scroll down, return on scroll up
     ============================================================ */
  var header = document.getElementById('header');
  var lastScrollY = window.scrollY;
  var HIDE_AFTER = 90;

  function updateHeader() {
    if (!header) return;
    var y = window.scrollY;
    var delta = y - lastScrollY;
    if (Math.abs(delta) < 1) return;          // ignore trackpad jitter
    header.classList.toggle('is-hidden', y > HIDE_AFTER && delta > 0);
    lastScrollY = y;
  }

  function onScroll() {
    updateActive();
    updateHeader();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  window.addEventListener('resize', function () { measure(); onScroll(); }, { passive: true });
  window.addEventListener('load', onScroll);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(onScroll).catch(function () {});
  }

  /* ============================================================
     5. HERO — split the intro into per-word spans
     The reveal animation is pure CSS (animation-timeline: view()), so
     there is no timer here. JS only wraps each word so the browser has
     something to measure.
     ============================================================ */
  var heroIntro = document.getElementById('heroIntro');
  if (heroIntro) {
    /* Build the per-word spans from a plain string. Called on load and again
       whenever the language changes, so the reveal always has fresh words. */
    function buildHero(text) {
      var frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(tok));
          return;
        }
        var s = document.createElement('span');
        s.className = 'w';
        // the name gets full contrast; the rest starts dimmed
        if (tok.indexOf('Muhammad') === 0 || tok === 'Syahril,') s.classList.add('accent');
        s.textContent = tok;
        frag.appendChild(s);
      });
      heroIntro.innerHTML = '';
      heroIntro.appendChild(frag);
      if (reduceMotion) {
        heroIntro.querySelectorAll('.w').forEach(function (w) { w.classList.add('in'); });
      }
    }

    var i18n = window.__i18n;
    buildHero(i18n ? i18n.t('hero.intro') : heroIntro.textContent.trim());
    if (i18n) i18n.onChange(function () { buildHero(i18n.t('hero.intro')); });
  }

  /* ============================================================
     6. REVEAL ON SCROLL (used by any .reveal element)
     ============================================================ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     7. PORTRAIT sketch <-> photo
     ============================================================ */
  var portrait = document.getElementById('portrait');
  if (portrait) {
    if (finePointer) {
      ['mouseenter', 'focus'].forEach(function (ev) {
        portrait.addEventListener(ev, function () { portrait.classList.add('is-revealed'); });
      });
      ['mouseleave', 'blur'].forEach(function (ev) {
        portrait.addEventListener(ev, function () { portrait.classList.remove('is-revealed'); });
      });
    } else {
      var hint = portrait.querySelector('.portrait-hint');
      if (hint) {
        /* touch devices say "Tap"; keep it localized and in sync with lang */
        hint.removeAttribute('data-i18n');   // JS owns this one now
        var setTapHint = function () {
          hint.textContent = window.__i18n ? window.__i18n.t('portrait.tap') : 'Tap';
        };
        setTapHint();
        if (window.__i18n) window.__i18n.onChange(setTapHint);
      }
      portrait.addEventListener('click', function () {
        portrait.classList.toggle('is-revealed');
      });
    }
  }

  /* ============================================================
     8. MENU OVERLAY
     ============================================================ */
  var menu = document.getElementById('menu');
  var toggle = document.getElementById('menuToggle');
  var langButtons = document.querySelectorAll('.lang');

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    requestAnimationFrame(function () {
      document.body.classList.add('menu-open');
    });
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    header.classList.remove('is-hidden');
  }
  function closeMenu() {
    if (!menu) return;
    document.body.classList.remove('menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (reduceMotion) menu.hidden = true;
    else setTimeout(function () { menu.hidden = true; }, 900);
  }
  function menuIsOpen() { return document.body.classList.contains('menu-open'); }

  if (toggle) {
    toggle.addEventListener('click', function () {
      menuIsOpen() ? closeMenu() : openMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuIsOpen()) closeMenu();
  });

  /* menu links close the overlay and jump to their block */
  document.querySelectorAll('.menu-item').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      e.preventDefault();
      closeMenu();
      setTimeout(function () { goTo(href); }, reduceMotion ? 0 : 260);
    });
  });

  /* any other in-page link */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    if (a.classList.contains('menu-item')) return;
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      goTo(href);
    });
  });

  /* language toggle is handled globally by the initI18n module at the top of
     this file (reads data-lang, applies the dictionary, persists the choice). */

  /* ============================================================
     9. CLICK A PROJECT NAME -> centre its slot; photo + colours follow
     ============================================================ */
  /* The titles are real links to their own page, so there is no click handler
     here any more: navigating is the browser's job. The scroll-driven "active"
     state still follows whichever title is nearest the focus line. */

  onScroll();

})();

/* ============================================================
   CONTACT PAGE — pointer-driven headline + link copy
   ------------------------------------------------------------
   The original maps the pointer to a normalised offset and feeds it to a
   WebGL SDF shader that reveals the glyphs. The maths is reproduced here and
   applied to two DOM layers:

       x = clamp((clientX - w/2) / w,           -0.5,  0.5)
       y = clamp(-(clientY - h/2) / h,          -0.5,  0.5) * ((h-256)/h)

   The crisp layer takes a fraction of that offset and the blurred duplicate
   takes a larger one, so the soft edge leads and the solid glyph lags —
   which is what gives the same "the text reacts under the cursor" read.
   ============================================================ */
(function () {
  'use strict';

  var stage    = document.getElementById('contactStage');
  var headline = document.getElementById('contactHeadline');
  if (!stage || !headline) return;          /* not the contact page */

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var glow   = headline.querySelector('.contact-glow');
  var text   = headline.querySelector('.contact-text');
  var sr     = document.getElementById('contactSr');

  /* ---------- pointer follow ---------- */
  if (!reduce && fine) {
    var tx = 0, ty = 0, gx = 0, gy = 0, cx = 0, cy = 0, raf = 0, nx = 0, ny = 0;

    function onMove(e) {
      var w = window.innerWidth, h = window.innerHeight;
      var nx = Math.min(.5, Math.max(-.5, (e.clientX - .5 * w) / w));
      var ny = Math.min(.5, Math.max(-.5, -(e.clientY - .5 * h) / h)) *
               ((h - 256) / h);
      /* the solid layer moves less than the blurred one, so the soft edge
         leads and the glyph body lags — same read as the shader reveal */
      tx = nx * 40;  ty = ny * 20;
      gx = nx * 88;  gy = ny * 42;
      if (!raf) raf = requestAnimationFrame(step);
    }

    function step() {
      cx += (tx - cx) * 0.12;  cy += (ty - cy) * 0.12;
      gx += ((nx * 88) - gx) * 0.10;
      gy += ((ny * 42) - gy) * 0.10;
      raf = 0;
      var cs = text.style, gs = glow.style;
      cs.setProperty('--tx', cx.toFixed(2) + 'px');
      cs.setProperty('--ty', cy.toFixed(2) + 'px');
      gs.setProperty('--gx', cx.toFixed(2) + 'px');
      gs.setProperty('--gy', cy.toFixed(2) + 'px');
      if (Math.abs(tx - cx) > 0.2 || Math.abs(ty - cy) > 0.2) {
        raf = requestAnimationFrame(step);
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ---------- Mail: copy to clipboard, headline confirms ---------- */
  var copyBtns = document.querySelectorAll('[data-copy]');
  Array.prototype.forEach.call(copyBtns, function (btn) {
    var link = btn.closest('.c-link');
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy') || '';
      if (!value) return;
      var done = function () {
        var tc = function (k, f) { return window.__i18n ? window.__i18n.t(k) : f; };
        stage.classList.add('is-copied');
        if (link) link.classList.add('is-open');
        if (sr) sr.textContent = tc('contact.copied', 'Email copied to clipboard: ') + value;
        btn.setAttribute('aria-label', tc('contact.copyAria', 'Copy email address, copied'));
        clearTimeout(btn._t);
        btn._t = setTimeout(function () {
          stage.classList.remove('is-copied');
          if (link) link.classList.remove('is-open');
          if (sr) sr.textContent = tc('contact.headlineSr', 'Drop me a message!');
          btn.removeAttribute('aria-label');
        }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, done);
      } else {
        /* file:// or an insecure origin: fall back to a temporary selection */
        try {
          var ta = document.createElement('textarea');
          ta.value = value;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        } catch (e) { /* nothing else to try */ }
        done();
      }
    });
  });
})();

/* ============================================================
   PROJECT DETAIL PAGE
   Mirrors the reference layout:
     cover (6 cols, 16:9)
     title  (64px serif)
     type ................ year      (justify-between)
     description (6 cols, centred)
     ── scroll 130dvh ──
     "See next project..." + next cover (3 cols) + next name
   One template; the ?p=<uid> query picks the project, and the
   next project is whichever entry follows it in PROJECTS.
   ============================================================ */
(function renderProjectPage() {
  'use strict';
  var main = document.getElementById('pjMain');
  if (!main) return;                       /* not the detail page */

  var LIST = window.PROJECTS || [];
  if (!LIST.length) return;                /* data missing: leave the page alone */

  var q = new URLSearchParams(location.search).get('p');
  var idx = -1;
  LIST.forEach(function (p, i) { if (p.uid === q) idx = i; });
  if (idx < 0) idx = 0;                    /* unknown slug -> first project */
  var p = LIST[idx];
  var next = LIST[(idx + 1) % LIST.length];

  var i18n = window.__i18n;
  var pick = window.__pickLocale || function (f) { return f; };
  function tt(k, fallback) { return i18n ? i18n.t(k) : fallback; }

  document.title = p.name + ' - Muhammad Syahril';
  var desc = document.querySelector('meta[name="description"]');
  if (desc && p.blurb) desc.setAttribute('content', pick(p.blurb));

  /* page colours follow the project, same as the home list */
  document.body.style.setProperty('--bg-color', p.bg);
  document.body.style.setProperty('--text-color', p.fg);

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function figure(src, alt, cls) {
    return '<figure class="' + cls + '"><img src="' + esc(src) + '" alt="' +
           esc(alt) + '" loading="lazy" decoding="async" /></figure>';
  }

  var html = '';

  /* ---- cover, at 16:9 like the reference ---- */
  html += '<section class="pj-gallery">' +
            figure(p.cover, p.name + ' cover', 'pj-shot pj-shot--cover') +
          '</section>';

  /* ---- title ---- */
  html += '<h1 class="pj-h1">' + esc(p.name) + '</h1>';

  /* ---- type / year, one at each end ---- */
  var typeLabel = (i18n && p.typeKey) ? i18n.t(p.typeKey) : p.type;
  html += '<div class="pj-meta">' +
            '<h3 class="pj-type">' + esc(typeLabel) + '</h3>' +
            '<h3 class="pj-year">' + esc(p.year) + '</h3>' +
          '</div>';

  /* ---- description ---- */
  html += '<div class="pj-desc">';
  (pick(p.body) || [pick(p.blurb)]).forEach(function (par) {
    html += '<p>' + esc(par) + '</p>';
  });
  html += '</div>';

  /* ---- supporting shots, after the text so the title is never pushed
         down by a stack of full-width screenshots ---- */
  var extra = (p.gallery || []).filter(function (src) { return src !== p.cover; });
  if (extra.length) {
    html += '<section class="pj-gallery pj-gallery--extra">';
    extra.forEach(function (src, i) {
      html += figure(src, p.name + ' - screenshot ' + (i + 1), 'pj-shot');
    });
    html += '</section>';
  }

  /* ---- see next project ----
     The reference wraps this in a 130dvh block with a sticky top-0 panel, so
     the panel is pinned through 30dvh of scroll before it settles. A bare
     position:sticky bottom:0 instead pulls the panel UP over the description. */
  html += '<div class="pj-next-wrap">';
  html += '<section class="pj-next" aria-label="' + esc(tt('project.nextAria','Next project')) + '">' +
            /* A square progress bar. It fills left-to-right as the pinned panel
               travels through the wrapper; at 100% the page moves on to the next
               project, so the bar is the progress indicator for that move. */
            '<div class="pj-progress" role="progressbar" aria-label="' + esc(tt('project.progressAria','Progress to next project')) + '"' +
                 ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
              '<span class="pj-progress-fill"></span>' +
            '</div>' +
            '<h2 class="pj-next-label">' + esc(tt('project.next','See next project...')) + '</h2>' +
            '<div class="pj-next-row">' +
              figure(next.cover, next.name + ' cover', 'pj-next-shot') +
              '<a class="pj-next-name" href="project.html?p=' + encodeURIComponent(next.uid) + '">' +
                esc(next.name) +
              '</a>' +
            '</div>' +
          '</section>';
  html += '</div>';

  main.innerHTML = html;

  /* re-localise the injected text when the language changes (no full rebuild,
     so the progress bar and scroll wiring below stay intact) */
  if (i18n) {
    i18n.onChange(function () {
      var typeEl = main.querySelector('.pj-type');
      if (typeEl) typeEl.textContent = (p.typeKey ? i18n.t(p.typeKey) : p.type);
      var descEl = main.querySelector('.pj-desc');
      if (descEl) {
        descEl.innerHTML = '';
        (pick(p.body) || [pick(p.blurb)]).forEach(function (par) {
          var el = document.createElement('p');
          el.textContent = par;
          descEl.appendChild(el);
        });
      }
      var nextLabel = main.querySelector('.pj-next-label');
      if (nextLabel) nextLabel.textContent = i18n.t('project.next');
      if (desc && p.blurb) desc.setAttribute('content', pick(p.blurb));
    });
  }

  /* ---- the progress bar ----
     The bar fills as the sticky panel travels down through .pj-next-wrap.
     When it reaches 100% the page moves on to the next project by itself, so
     the bar doubles as the progress indicator for that transition.

     Auto-advance is deliberately one-way and latched: once it has fired for a
     given project it never fires again for that visit, and a click on the next
     project's name (or any manual navigation) cancels it. Without the latch,
     scrolling back up and down would bounce the reader between two projects. */
  var wrap   = main.querySelector('.pj-next-wrap');
  var bar    = main.querySelector('.pj-progress');
  var fill   = main.querySelector('.pj-progress-fill');
  var nextHref = 'project.html?p=' + encodeURIComponent(next.uid);

  if (wrap && bar && fill) {
    var lastY = window.scrollY;
    var armed = true;    /* still allowed to fire */
    var gone  = false;   /* already fired */

    function update() {
      /* Measured against the WHOLE document, the way the reference does it:
           s = limit - wrap.clientHeight
           a = (clamp(scroll, s, limit) - s) / (limit - s)

       The difference matters. Measuring against the wrapper's own height makes
       the bar fill over only the last ~30dvh, so it snaps from empty to full
       almost at once. Measuring against the page makes the fill run across the
       whole 130dvh the panel is pinned for — so at roughly half-way down the
       page the bar is half full, which is what the reference does. */
      /* `limit` is the scroll LIMIT (max scrollY), not the document height —
         that is what the reference's `t.limit` is, and the difference is the
         whole behaviour. */
      var limit = document.documentElement.scrollHeight - window.innerHeight;
      var s = limit - wrap.offsetHeight;
      var span = limit - s;
      if (span <= 0) return;

      var y = window.scrollY;
      var k = (Math.min(Math.max(y, s), limit) - s) / span;

      fill.style.transform = 'scaleX(' + k.toFixed(4) + ')';
      bar.setAttribute('aria-valuenow', Math.round(k * 100));

      if (k >= 0.999 && armed && !gone) {
        armed = false;
        gone = true;
        /* a short beat so the completed bar is visible before the swap */
        setTimeout(function () { location.href = nextHref; }, 450);
      }
      lastY = window.scrollY;
    }

    /* Subscribe to Lenis rather than listening to the window scroll event.
       Lenis eases the scroll position over several frames, and it fires its
       own event each one — so the bar tracks the INTERPOLATED position and
       glides with the motion instead of snapping to the browser's discrete
       scroll values. When Lenis is absent (reduced motion, or the CDN failed)
       this falls back to the native scroll event. */
    if (typeof window.__onScroll === 'function') {
      window.__onScroll(update);
    } else {
      var ticking = false;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }, { passive: true });
    }

    /* any deliberate navigation cancels the auto-advance */
    main.addEventListener('click', function (e) {
      if (e.target.closest('.pj-next-name')) armed = false;
    });
    window.addEventListener('keydown', function (e) {
      /* Escape, arrows and space are navigation intents, not "keep reading" */
      if (['Escape','ArrowUp','ArrowDown','PageUp','PageDown',' '].indexOf(e.key) >= 0) armed = false;
    });

    window.addEventListener('resize', update, { passive: true });
    update();
  }
})();


/* ============================================================
   SKILLS PAGE — orbiting icons
   ------------------------------------------------------------
   The original was a React component holding the orbit angle in
   `useState` and re-rendering every frame. Here the same maths runs
   in one rAF loop, but it only writes two custom properties
   (--sk-cos / --sk-sin) per icon, so the compositor does the
   transform and React is not involved at all.

   Pause behaviour matches the original: pointer over the stage
   stops the loop; hover/focus on one icon scales it and reveals
   its label.
   ============================================================ */
(function skillsPage() {
  'use strict';
  var stage = document.getElementById('skStage');
  var listEl = document.getElementById('skList');
  if (!stage || !listEl) return;          /* not the skills page */

  /* ---------- the skills ----------
     Real SVGs rather than brand marks that would need an image
     request; each carries its language's own accent colour. */
  var ICON = {
    javascript:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect width="24" height="24" rx="2" fill="#F7DF1E"/>' +
        '<path fill="#323330" d="M16.8 16.3c-.1-.2-.4-.3-.6-.2-.2.1-.5.4-.5.8 0 .4.3 1.4 1.7 1.4 1.2 0 1.5-.7 1.5-1.2v-1.6h-1.6v.3h.8v.2c0 .4-.2.6-.5.6-.4 0-.6-.4-.7-.6 0-.2 0-.2.1-.3l-.2-.2zm-3.9 0c-.1-.2-.3-.3-.5-.2-.2 0-.5.2-.6.5-.1.4-.1 1.6 1.6 1.6 1 0 1.6-.4 1.6-1.5v-2.4h-1.5v.3h.7v1.6c-.1.2-.2.3-.4.3-.3 0-.5-.3-.5-.6v-.2c.1-.2.1-.2 0-.2zm-4.3-1.5h1.3v.3h-.8c-.5 0-.6.2-.6.4 0 .3.3.4.7.5.8.2 1.2.5 1.2 1.1 0 .7-.6 1.1-1.4 1.1-.7 0-1.2-.2-1.5-.7l.3-.2c.2.3.6.5 1.2.5.5 0 .8-.2.8-.5 0-.3-.2-.4-.7-.5-.8-.2-1.3-.5-1.3-1.1 0-.6.5-1 1.3-1 .6 0 1 .2 1.3.6l-.3.2c-.2-.3-.5-.4-1-.4z"/>' +
      '</svg>',
    python:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#3776AB" d="M11.9 1.5c-1.7 0-3.1.1-4 .4-.6.2-1.1.6-1.3 1.1-.2.4-.3 1-.3 1.7v2.6h7.7v.9H4.2c-.9 0-1.7.5-2.2 1.3-.4.7-.6 1.5-.6 2.3 0 .9.2 1.8.6 2.4.4.6.9.9 1.7.9h1.5V12c0-1 .2-1.9.6-2.5.5-.7 1.3-1 2.4-1h4.5c.9 0 1.6-.5 1.6-1.4V5.9c0-.9-.8-1.6-1.7-1.8-.8-.4-1.7-.6-3-.6zm-3 1.4a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"/>' +
        '<path fill="#FFD43B" d="M17.6 8v3.6c0 1-.4 1.9-1 2.5-.6.6-1.4.9-2.5.9H12c-.9 0-1.6.5-1.6 1.4v2.8c0 .9.8 1.6 1.7 1.8.9.4 1.9.5 3 .5 1.1 0 2.1-.2 2.7-.5.7-.3 1.3-1 1.3-1.7v-2.6h-7.7v-.9h9.8c.9 0 1.4-.5 1.7-1.4.3-.8.4-1.7.4-2.4 0-.8-.2-1.6-.6-2.2-.4-.7-1-1.2-1.9-1.2zm-3 10.8a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"/>' +
      '</svg>',
    c:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#5C6BC0" d="M16.6 8.1c-1-.9-2.3-1.4-3.9-1.4-2.3 0-4 1.1-4 2.8 0 1.4.9 2.3 2.7 2.7l1.6.4c1.2.3 1.7.7 1.7 1.4 0 .8-.8 1.4-2 1.4-1.3 0-2.3-.5-3-1.5l-1.9 1.4c1.1 1.6 2.8 2.5 4.9 2.5 2.4 0 4-1.1 4-2.9 0-1.5-1-2.4-2.8-2.8l-1.6-.4c-1.1-.3-1.6-.6-1.6-1.3 0-.7.7-1.2 1.8-1.2 1.1 0 2 .4 2.7 1.2l1.4-1.3zM12 1.6C6.3 1.6 1.6 6.3 1.6 12S6.3 22.4 12 22.4s10.4-4.7 10.4-10.4S17.7 1.6 12 1.6zm0 18.6c-4.5 0-8.2-3.7-8.2-8.2S7.5 3.8 12 3.8s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2z"/>' +
      '</svg>',
    java:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#5382A1" d="M12 1.6c-2.1 0-3.6.3-3.6 2.3v3.2h3.6V6.1c0-.9.3-1.4 1.3-1.4h5.9c.9 0 1.3.4 1.3 1.4v1h3.6V3.9c0-2-1.5-2.3-3.6-2.3z"/>' +
        '<path fill="#F89820" d="M8.4 8.2v3.2H12V8.2H8.4zm0 3.9v3.2H12v-3.2H8.4z"/>' +
        '<path fill="#5382A1" d="M3.6 6.8H0v3.6c0 2 1.5 2.3 3.6 2.3h3V8.2H3.6c-1 0-1.3-.4-1.3-1.4v-.9h1.3zm16.8 0h-3V11h3.6V8.2h.7c1 0 1.3.4 1.3 1.4v.9h-2.6zm-2.6 3.9h-3.6v3.2H20c1.9 0 3.4-.3 3.4-2.3v-3.5c0-2-1.5-2.3-3.4-2.3h-2.2zm-.6-11.5c1.9 0 3.4.3 3.4 2.3v3.2h-3.6V6.8h.7c1 0 1.3-.4 1.3-1.4v-.9h-1.8zM5.4 20.9c.9.3 1.9.5 3 .5h5.9c.9 0 1.3-.4 1.3-1.4v-1h-3.6v1c0 .9-.3 1.4-1.3 1.4h-3.2c-.7 0-1-.1-1.2-.3-.1-.2-.1-.5-.1-1v-.5l-.8-.1z"/>' +
      '</svg>',
    php:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<ellipse cx="8.1" cy="17.2" rx="6.6" ry="4.8" fill="#777BB4"/>' +
        '<ellipse cx="8.1" cy="16.4" rx="6.6" ry="4.8" fill="#4F5B95"/>' +
        '<text x="8.1" y="18.6" font-family="Georgia,serif" font-size="6.2" font-weight="bold" fill="#fff" text-anchor="middle">php</text>' +
      '</svg>',
    vue:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#41B883" d="M19.5 3.3 12 16.5 4.5 3.3H0l12 21L24 3.3h-4.5z"/>' +
        '<path fill="#35495E" d="M14.6 3.3h-2.6l-.4.8-.4-.8H8.6L12 8.9l3.4-5.6h-2.4l-.4.8-.4-.8z"/>' +
      '</svg>',
    typescript:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<rect width="24" height="24" rx="2" fill="#3178C6"/>' +
        '<path fill="#fff" d="M6.3 14.4c0 .5.1.9.3 1.1.2.2.5.4 1 .4.4 0 .7-.1.9-.3.2-.2.3-.5.3-1V8.9h2v6c0 1.1-.3 2-.9 2.6-.6.6-1.4.9-2.4.9-1 0-1.8-.3-2.4-.9-.6-.6-.9-1.5-.9-2.6h2c0 .5.1.9.3 1.1.2.2.5.4 1 .4.4 0 .7-.1.9-.3.2-.2.3-.5.3-1V8.9h2.2v5.5h-2.4zm7.2.2c.2.4.5.6 1 .6.4 0 .6-.1.8-.3.2-.2.3-.4.3-.7 0-.3-.1-.5-.4-.7-.2-.2-.6-.4-1.1-.6l-.4-.2c-.9-.4-1.4-.7-1.7-1-.3-.3-.5-.7-.5-1.2 0-.5.2-.9.5-1.2.3-.3.8-.5 1.4-.5.5 0 1 .1 1.4.3.4.2.7.5.9.9l-1.7.9c-.1-.3-.3-.5-.5-.6-.2-.1-.4-.2-.6-.2-.3 0-.5.1-.7.2-.2.1-.2.3-.2.5 0 .2.1.4.3.5.2.1.5.3 1 .5l.4.2c1 .4 1.6.8 1.9 1.2.3.4.5.9.5 1.4 0 .6-.2 1.1-.6 1.4-.4.4-1 .6-1.6.6-.7 0-1.3-.2-1.7-.6-.4-.4-.7-.9-.8-1.6l2-.6z"/>' +
      '</svg>',
    reactnative:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="2.2" fill="#61DAFB"/>' +
        '<g stroke="#61DAFB" stroke-width="1.1" fill="none">' +
          '<ellipse cx="12" cy="12" rx="10" ry="4"/>' +
          '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/>' +
          '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>' +
        '</g>' +
      '</svg>',
    html:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#E34F26" d="M2 1.6h20l-1.8 20.4L12 24 3.8 21.9 2 1.6z"/>' +
        '<path fill="#fff" d="M6.6 10.5l-.2-2.6 11.2.0.2-2.5H6.2L6 3.6l.7 7.4h10v2.7l-2.7.7-2.8-.7-.2-1.9H7.4l.3 3.9L12 17.3l5-1.3.7-7.2H6.6z"/>' +
      '</svg>',
    css:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#1572B6" d="M2 1.6h20l-1.8 20.4L12 24 3.8 21.9 2 1.6z"/>' +
        '<path fill="#fff" d="M18.5 3.6 6.2 3.6l.2 2.5 11.3 0-.2 2.6h-7l.3 2.4h6.7l-.3 3.3-2.8.7-2.9-.7-.2-1.9H7.6l.3 3.5L12 17.3l5-1.3.7-7.2z"/>' +
      '</svg>',
    node:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#339933" d="M12 1.5c-.3 0-.6.1-.9.2l-2.9 1.7c-.4.2-.2.3-.1.4.6-.2.7-.3 1.3-.6.1 0 .2 0 .2 0l2.3 1.3c.1 0 .2 0 .3 0l8.8-5.1c.1 0 .1-.1.1-.2V6.9c0-.1-.1-.2-.1-.2L12.9 1.7c-.1 0-.1-.2-.3-.2h-.6zm-3.9 6c-.7 0-1.3.3-1.3.7s.6.7 1.3.7c.9 0 1.5-.3 1.5-.7s-.6-.7-1.5-.7zm7.7 0c-.7 0-1.3.3-1.3.7s.6.7 1.3.7c.9 0 1.5-.3 1.5-.7s-.6-.7-1.5-.7zM3.1 10.1c0 .4 0 .6.4.7l8.8 5.1c.4.2.8.2 1.2 0l8.8-5.1c.4-.2.4-.4.4-.7v-8.4c0-.4-.1-.6-.4-.8L12.7 1c-.4-.2-.8-.2-1.2 0L2.7 6c-.3.2-.4.4-.4.8v8.4c0 .4.1.6.4.8l.4.2z"/>' +
      '</svg>',
    go:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#00ADD8" d="M3.6 12c0-1.4.5-2.6 1.4-3.5.8-.8 1.8-1.2 3-1.2 1.3 0 2.3.4 3.1 1.2.8.8 1.2 2 1.2 3.5s-.4 2.6-1.2 3.5c-.8.8-1.8 1.2-3.1 1.2-1.2 0-2.2-.4-3-1.2-.9-.9-1.4-2.1-1.4-3.5m1.9 0c0 .9.3 1.7.8 2.2.5.5 1.2.8 2 .8s1.5-.3 2-.8c.5-.5.8-1.3.8-2.2s-.3-1.7-.8-2.2c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8c-.5.5-.8 1.3-.8 2.2m4.6-.2c0-.5.4-.8 1.1-.8s1.1.3 1.1.8-.4.8-1.1.8-1.1-.3-1.1-.8m4.2-.5c.2-.6.6-1 1.2-1.3.6-.3 1.3-.3 2-.1l-.4 1.6c-.4-.1-.8-.2-1.1 0-.3.1-.5.4-.5.9 0 .4.2.7.5.9.3.1.7 0 1.1-.2l.3 1.4c-.7.3-1.3.4-1.9.2-.6-.2-1-.5-1.3-1-.2-.5-.2-1 .1-1.4"/>' +
      '</svg>',
    mysql:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path fill="#00758F" d="M12 1.5c-1 0-1.8.8-1.8 1.8 0 .5.2.9.6 1.3-.7.3-1.4.5-2 .5-2.1 0-3.8-1.1-3.8-2.4 0-.5-.4-.9-.9-.9s-.9.4-.9.9c0 2.4 3.1 4.3 6.9 4.3 3.8 0 6.9-1.9 6.9-4.3 0-.5-.4-.9-.9-.9s-.9.4-.9.9c0 1.3-1.7 2.4-3.8 2.4-.6 0-1.3-.2-2-.5.4-.4.6-.8.6-1.3 0-1-.8-1.8-1.8-1.8s-1.8.8-1.8 1.8 2.4 1.8 2.4 4.1c0 1.1-.4 2-1.1 2.7-.7.7-1.7 1.1-2.8 1.1-1.9 0-3.4-1.1-3.4-2.5 0-.6-.5-1-1-1s-1 .4-1 1c0 2.5 2.6 4.5 5.4 4.5 1.6 0 3-.6 4-1.6.8-.8 1.2-1.9 1.2-3.2 0-1-.2-1.8-.6-2.5.5-.2 1.1-.3 1.7-.3 1.4 0 2.4.5 2.4 1.2 0 .3-.2.5-.5.6-.4.1-.7.4-.7.8 0 .5.4.9.9.9.8 0 1.5-.6 1.5-1.5 0-1.6-1.9-2.8-4.3-2.8-1 0-1.9.2-2.7.5.1-.2.1-.4.1-.6 0-.7-.5-1.2-1.2-1.2z"/>' +
      '</svg>',
    ai:
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="3.1" fill="none" stroke="#0B3D34" stroke-width="1.7"/>' +
        '<ellipse cx="12" cy="12" rx="10" ry="3.8" fill="none" stroke="#0B3D34" stroke-width="1.5"/>' +
        '<ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)" fill="none" stroke="#0B3D34" stroke-width="1.5"/>' +
        '<ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(120 12 12)" fill="none" stroke="#0B3D34" stroke-width="1.5"/>' +
      '</svg>'
  };
  var TINT = {
    javascript:  ['rgba(247,223,30,.45)',  'rgba(247,223,30,.20)'],
    python:      ['rgba(55,118,171,.45)',  'rgba(55,118,171,.22)'],
    c:           ['rgba(92,107,192,.45)',  'rgba(92,107,192,.22)'],
    java:        ['rgba(248,152,32,.45)',  'rgba(248,152,32,.22)'],
    php:         ['rgba(79,91,149,.45)',   'rgba(79,91,149,.22)'],
    vue:         ['rgba(65,184,131,.45)',  'rgba(65,184,131,.22)'],
    typescript:  ['rgba(49,120,198,.45)',  'rgba(49,120,198,.22)'],
    reactnative: ['rgba(97,218,251,.45)',  'rgba(97,218,251,.22)'],
    html:        ['rgba(227,79,38,.45)',   'rgba(227,79,38,.22)'],
    css:         ['rgba(21,114,182,.45)',  'rgba(21,114,182,.22)'],
    node:        ['rgba(51,153,51,.45)',   'rgba(51,153,51,.22)'],
    go:          ['rgba(0,173,216,.45)',   'rgba(0,173,216,.22)'],
    mysql:       ['rgba(0,117,143,.45)',   'rgba(0,117,143,.22)'],
    ai:          ['rgba(11,61,52,.45)',    'rgba(11,61,52,.20)']
  };
  /* Inner ring: four skills a quarter turn apart. Outer ring: four more. */
  /* Three boxes. `group` drives the readable list; `tag` is the right-hand
     column on the row.

     Sources, so a claim here is traceable:
       repo  — the language GitHub reports for a public repo (pushed 2022-2026)
       readme — appears as a badge in the profile README
     Go, MySQL, React Native and Node.js are readme-only: no repo uses them,
     but they are real, so they stay. */
  var GROUPS = [
    { id:'lang',   label:'Programming Language'   },
    { id:'front',  label:'Frontend & Mobile'      },
    { id:'back',   label:'Backend, Database & AI' }
  ];

  /* `group` picks the box; `radius` picks the orbit ring. They are separate
     on purpose: the boxes are grouped semantically (markup belongs with
     frontend, not next to C), while the orbit splits 7/7 so neither ring
     looks crowded. */
  var SKILLS = [
    /* inner orbit — seven */
    { id:'javascript',  label:'JavaScript', tag:'Language', group:'lang',  src:'repo',   radius:100, size:40, speed: 1,   phase:0 },
    { id:'python',      label:'Python',     tag:'Language', group:'lang',  src:'repo',   radius:100, size:44, speed: 1,   phase:Math.PI*2/7 },
    { id:'c',           label:'C',          tag:'Language', group:'lang',  src:'repo',   radius:100, size:40, speed: 1,   phase:Math.PI*4/7 },
    { id:'java',        label:'Java',       tag:'Language', group:'lang',  src:'repo',   radius:100, size:40, speed: 1,   phase:Math.PI*6/7 },
    { id:'php',         label:'PHP',        tag:'Language', group:'lang',  src:'repo',   radius:100, size:40, speed: 1,   phase:Math.PI*8/7 },
    { id:'vue',         label:'Vue',        tag:'Frontend', group:'front', src:'repo',   radius:100, size:40, speed: 1,   phase:Math.PI*10/7 },
    { id:'typescript',  label:'TypeScript', tag:'Frontend', group:'front', src:'repo',   radius:100, size:40, speed: 1,   phase:Math.PI*12/7 },
    /* outer orbit — seven, counter-rotating */
    { id:'reactnative', label:'React Native',   tag:'Mobile',   group:'front', src:'readme', radius:180, size:44, speed:-0.6, phase:0 },
    { id:'html',        label:'HTML',           tag:'Markup',   group:'front', src:'repo',   radius:180, size:44, speed:-0.6, phase:Math.PI*2/7 },
    { id:'css',         label:'CSS',            tag:'Markup',   group:'front', src:'repo',   radius:180, size:44, speed:-0.6, phase:Math.PI*4/7 },
    { id:'node',        label:'Node.js',        tag:'Backend',  group:'back',  src:'readme', radius:180, size:44, speed:-0.6, phase:Math.PI*6/7 },
    { id:'go',          label:'Go',             tag:'Backend',  group:'back',  src:'readme', radius:180, size:44, speed:-0.6, phase:Math.PI*8/7 },
    { id:'mysql',       label:'MySQL',          tag:'Database', group:'back',  src:'readme', radius:180, size:44, speed:-0.6, phase:Math.PI*10/7 },
    { id:'ai',          label:'Computer Vision', tag:'AI',       group:'back',  src:'repo',   radius:180, size:44, speed:-0.6, phase:Math.PI*12/7 }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c];
    });
  }

  /* ---------- build the icons ---------- */
  var items = [];
  SKILLS.forEach(function (sk) {
    var el = document.createElement('div');
    el.className = 'sk-item';
    var tint = TINT[sk.id] || ['rgba(0,0,0,.3)','rgba(0,0,0,.15)'];
    el.style.cssText =
      '--sk-r:' + sk.radius + 'px;' +
      '--sk-size:' + sk.size + 'px;' +
      '--sk-tint:' + tint[0] + ';' +
      '--sk-tint-2:' + tint[1];
    el.setAttribute('role', 'listitem');
    el.innerHTML =
      '<div class="sk-chip">' + ICON[sk.id] +
        '<span class="sk-label">' + esc(sk.label) + '</span>' +
      '</div>';
    /* the label is decoration; the list below carries the real text */
    el.setAttribute('aria-label', sk.label + ' - ' + sk.tag);
    stage.appendChild(el);

    /* keyboard parity with hover */
    el.tabIndex = 0;
    el.addEventListener('focus', function () { el.setAttribute('data-hovered',''); });
    el.addEventListener('blur',  function () { el.removeAttribute('data-hovered'); });

    items.push({ el: el, sk: sk, angle: sk.phase });
  });

  /* ---------- the readable list, grouped by category ----------
     One <section> per group with its own heading, then the rows that belong
     to it. A group with no skills is skipped, so the data above is the only
     place that decides what appears. */
  listEl.classList.add('sk-boxes');
  listEl.innerHTML = GROUPS.map(function (g) {
    var rows = SKILLS.filter(function (sk) { return sk.group === g.id; });
    if (!rows.length) return '';
    return '<section class="sk-group" aria-labelledby="skg-' + g.id + '">' +
             '<h3 class="sk-group-title" id="skg-' + g.id + '">' + esc(g.label) + '</h3>' +
             '<div class="sk-rows" role="list">' +
               rows.map(function (sk) {
                 return '<div class="sk-row" role="listitem">' +
                          '<span class="sk-row-name">' + esc(sk.label) + '</span>' +
                          '<span class="sk-row-tag">' + esc(sk.tag) + '</span>' +
                        '</div>';
               }).join('') +
             '</div>' +
           '</section>';
  }).join('');

  /* ---------- size the rings from the same radii ---------- */
  var rings = stage.querySelectorAll('.sk-ring');
  stage.querySelectorAll('.sk-item').forEach(function (el) {
    var r = parseFloat(el.style.getPropertyValue('--sk-r')) || 100;
    el.style.setProperty('--sk-r', r + 'px');
  });
  function sizeRings() {
    var w = stage.clientWidth;
    /* shrink the orbits on narrow screens so the outer ring never overflows */
    var scale = Math.min(1, (w / 2 - 24) / 180);
    var inner = 100 * scale, outer = 180 * scale;
    rings[0].style.width = rings[0].style.height = (inner * 2) + 'px';
    rings[1].style.width = rings[1].style.height = (outer * 2) + 'px';
    items.forEach(function (it) {
      var base = it.sk.radius;
      var r = base === 100 ? inner : outer;
      it.el.style.setProperty('--sk-r', r + 'px');
    });
  }
  sizeRings();
  window.addEventListener('resize', sizeRings, { passive: true });

  /* ---------- the loop ----------
     One rAF for the whole system. Each frame writes only --sk-cos and
     --sk-sin; the browser turns those into the transform. */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var time = 0, raf = 0, last = performance.now();

  function place() {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var a = time * it.sk.speed + it.sk.phase;
      it.el.style.setProperty('--sk-cos', Math.cos(a).toFixed(4));
      it.el.style.setProperty('--sk-sin', Math.sin(a).toFixed(4));
    }
  }

  function frame(now) {
    var dt = (now - last) / 1000;
    last = now;
    /* clamp dt: a backgrounded tab returns a huge delta and the icons
       would jump several turns on the first frame back */
    time += Math.min(dt, 0.05);
    place();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reduce) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* reduced motion: park the icons on their phase-shifted starting points */
  if (reduce) { place(); }
  else { start(); }

  /* pause while the pointer is over the stage, as the original did */
  stage.addEventListener('pointerenter', function () { stop(); });
  stage.addEventListener('pointerleave', function () { start(); });
  stage.addEventListener('focusin',  function () { stop(); });
  stage.addEventListener('focusout', function () { start(); });

  /* don't burn frames on a hidden tab */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
