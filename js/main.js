(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function placeHeart(item, progress) {
    var point = item.path.getPointAtLength(progress * item.length);

    var svgRect = item.svg.getBoundingClientRect();
    var viewBox = item.svg.viewBox.baseVal;
    var rect = item.wrapper.getBoundingClientRect();
    var scaleX = svgRect.width / viewBox.width;
    var scaleY = svgRect.height / viewBox.height;

    var offsetX = svgRect.left - rect.left;
    var offsetY = svgRect.top - rect.top;

    var x = offsetX + (point.x - viewBox.x) * scaleX;
    var y = offsetY + (point.y - viewBox.y) * scaleY;

    var heartW = item.heart.offsetWidth;
    var heartH = item.heart.offsetHeight;

    item.heart.style.transform =
      'translate(' + (x - heartW / 2) + 'px,' + (y - heartH / 2) + 'px)';
  }

  function buildItem(wrapper) {
    var path = wrapper.querySelector('.heart-line__path');
    var heart = wrapper.querySelector('.heart-line__heart');
    var svg = wrapper.querySelector('.heart-line__svg');
    if (!path || !heart || !svg) return null;
    var speed = parseFloat(wrapper.getAttribute('data-heart-speed'));
    if (isNaN(speed)) speed = 1;
    return {
      wrapper: wrapper,
      path: path,
      heart: heart,
      svg: svg,
      length: path.getTotalLength(),
      speed: speed,
    };
  }

  function setupStaticHearts() {
    var wrappers = Array.prototype.slice.call(document.querySelectorAll('[data-heart-static]'));

    wrappers.forEach(function (wrapper) {
      var item = buildItem(wrapper);
      if (!item) return;
      var progress = parseFloat(wrapper.getAttribute('data-heart-static'));
      if (isNaN(progress)) progress = 0.5;
      placeHeart(item, progress);
      window.addEventListener('resize', function () {
        placeHeart(item, progress);
      });
    });
  }

  function setupHeartLines() {
    var wrappers = Array.prototype.slice.call(document.querySelectorAll('[data-heart-line]'));

    var items = wrappers.map(buildItem).filter(Boolean);

    setupStaticHearts();

    if (!items.length) return;

    function update() {
      var vh = window.innerHeight;

      items.forEach(function (item) {
        var rect = item.wrapper.getBoundingClientRect();
        var total = rect.height + vh;
        var scrolled = vh - rect.top;
        var progress = clamp((scrolled / total) * item.speed, 0, 1);

        placeHeart(item, progress);
      });

      ticking = false;
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  function setupIntro() {
    var intro = document.getElementById('intro');
    var seal = document.getElementById('intro-seal');
    var music = document.getElementById('bg-music');
    var soundToggle = document.getElementById('sound-toggle');
    if (!intro || !seal) return;

    document.documentElement.classList.add('intro-lock');

    seal.addEventListener('click', function () {
      intro.classList.add('is-hidden');
      document.documentElement.classList.remove('intro-lock');
      window.dispatchEvent(new Event('resize'));

      if (music) {
        music.play().catch(function () {});
      }
      if (soundToggle) {
        soundToggle.classList.add('is-visible');
      }
    });

    if (music && soundToggle) {
      soundToggle.addEventListener('click', function () {
        music.muted = !music.muted;
        soundToggle.classList.toggle('is-muted', music.muted);
      });
    }
  }

  var RSVP_ENDPOINT = 'https://script.google.com/macros/s/AKfycby5hXYIYI7Br5BOXaa25kwyC34Eh4g_PhowNcxlVHhLfTGiy8HI19mc5rpF-mA0DcuZhA/exec';

  function setupRsvpModal() {
    var openBtn = document.getElementById('rsvp-open');
    var modal = document.getElementById('rsvp-modal');
    var closeBtn = document.getElementById('rsvp-close');
    var overlay = document.getElementById('rsvp-overlay');
    var form = document.getElementById('rsvp-form');
    var formWrap = document.getElementById('rsvp-form-wrap');
    var thanks = document.getElementById('rsvp-thanks');
    if (!openBtn || !modal) return;

    function open() {
      resetForm();
      modal.classList.add('is-open');
      document.documentElement.classList.add('intro-lock');
    }

    function close() {
      modal.classList.remove('is-open');
      document.documentElement.classList.remove('intro-lock');
    }

    function resetForm() {
      if (form) form.reset();
      if (formWrap) formWrap.hidden = false;
      if (thanks) thanks.hidden = true;
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(form);
        var payload = {
          fullname: formData.get('fullname') || '',
          attendance: formData.get('attendance') || '',
          companion: formData.get('companion') || '',
          drinks: formData.getAll('drinks'),
          note: formData.get('note') || '',
        };

        if (formWrap) formWrap.hidden = true;
        if (thanks) thanks.hidden = false;

        fetch(RSVP_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        }).catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeartLines);
    document.addEventListener('DOMContentLoaded', setupIntro);
    document.addEventListener('DOMContentLoaded', setupRsvpModal);
  } else {
    setupHeartLines();
    setupIntro();
    setupRsvpModal();
  }
})();
