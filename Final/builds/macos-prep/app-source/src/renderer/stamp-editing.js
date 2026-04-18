// ═══════════════════════════════════════════════
// STAMP INLINE EDITING — double-click on stamp text
// ═══════════════════════════════════════════════
(function () {
  'use strict';

  // Keywords found in stamp labels → stampData field key
  var stampFieldMap = {
    'Змiн': 'title',
    'Познач': 'docNumber',
    'Матер': 'material',
    'Літер': 'letter',
    'Маса': 'mass',
    'Масшт': 'scale',
    'Аркуш': 'sheetNum',
    'Всього': 'sheetTotal',
    'Орган': 'org',
    'Розроб': 'developer',
    'Перевір': 'checker',
    'Дата': 'date',
  };

  function findStampField(textEl) {
    var text = textEl.textContent || '';

    // Check label keywords
    for (var keyword in stampFieldMap) {
      if (text.indexOf(keyword) !== -1) return stampFieldMap[keyword];
    }
    // Fallback: match against stampData values
    var sd = state.stampData || {};
    for (var key in sd) {
      if (sd[key] && text === sd[key]) return key;
    }
    return null;
  }

  if (typeof drawingSvg !== 'undefined') {
    drawingSvg.addEventListener('dblclick', function (e) {
      var target = e.target;
      if (target.tagName !== 'text') return;

      // Check if inside stamp group
      var stampGroup = target.closest('.page-stamp');
      if (!stampGroup) return;

      var stampKey = findStampField(target);
      if (!stampKey) return;

      e.preventDefault();
      e.stopPropagation();

      var currentVal = (state.stampData || {})[stampKey] || '';

      // Remove previous inline input if exists
      var oldInput = document.getElementById('stamp-inline-edit');
      if (oldInput) oldInput.remove();

      // Get screen position of the SVG text
      var bbox = target.getBBox();
      var svgPoint = drawingSvg.createSVGPoint();
      svgPoint.x = bbox.x;
      svgPoint.y = bbox.y;
      var screenPt = svgPoint.matrixTransform(drawingSvg.getScreenCTM());

      var input = document.createElement('input');
      input.id = 'stamp-inline-edit';
      input.type = 'text';
      input.value = currentVal;
      input.style.cssText =
        'position:fixed; left:' + (screenPt.x - 4) + 'px; top:' + (screenPt.y - 10) + 'px;' +
        'width:' + Math.max(bbox.width, 60) + 'px;' +
        'background:#1e1e1e; border:1px solid #007acc; color:#ccc;' +
        'padding:2px 6px; font-size:12px; z-index:99999; border-radius:2px; outline:none;';

      document.body.appendChild(input);
      input.focus();
      input.select();

      function finishEdit() {
        var newVal = input.value;
        if (newVal !== currentVal) {
          state.stampData[stampKey] = newVal;
          if (typeof renderStamp === 'function') renderStamp();
          if (typeof showStatus === 'function') showStatus('Штамп оновлено');
        }
        input.remove();
      }

      input.addEventListener('blur', finishEdit);
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = currentVal; input.blur(); }
      });
    });
  }
})();
