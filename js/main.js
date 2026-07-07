(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setupHeartLines() {
    var wrappers = Array.prototype.slice.call(document.querySelectorAll('[data-heart-line]'));

    var items = wrappers
      .map(function (wrapper) {
        var path = wrapper.querySelector('.heart-line__path');
        var heart = wrapper.querySelector('.heart-line__heart');
        var svg = wrapper.querySelector('.heart-line__svg');
        if (!path || !heart || !svg) return null;
        return {
          wrapper: wrapper,
          path: path,
          heart: heart,
          svg: svg,
          length: path.getTotalLength(),
        };
      })
      .filter(Boolean);

    if (!items.length) return;

    function update() {
      var vh = window.innerHeight;

      items.forEach(function (item) {
        var rect = item.wrapper.getBoundingClientRect();
        var total = rect.height + vh;
        var scrolled = vh - rect.top;
        var progress = clamp(scrolled / total, 0, 1);

        var point = item.path.getPointAtLength(progress * item.length);

        var svgRect = item.svg.getBoundingClientRect();
        var viewBox = item.svg.viewBox.baseVal;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeartLines);
  } else {
    setupHeartLines();
  }
})();
