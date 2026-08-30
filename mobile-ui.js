/* On a narrow screen each long section becomes a labelled panel, so the page
   can be scanned before it is read. The wrapping runs at every width and the
   stylesheet decides where the button appears and the body collapses, which
   means there is no resize handling to get wrong. */
(function () {
  var d = document;
  var seq = 0;

  function titleCase(s) {
    return s.toLowerCase()
            .replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); })
            .replace(/\bXwin\b/g, 'XWIN');
  }

  /* The eyebrow, not the heading. It is short enough to sit on one line at
     320px, it is the same shape in every section, and it leaves the heading
     to be read in full once the panel is open. Headings are the fallback for
     a section that has no eyebrow, with any full stop dropped — a button is
     a label, not a sentence. */
  function labelFor(sec) {
    var head = sec.querySelector('.section-head');
    var eb = (head && head.querySelector('.eyebrow-label')) || sec.querySelector('.eyebrow-label');
    if (eb && eb.textContent.trim()) {
      return { label: titleCase(eb.textContent.trim()), hide: [eb] };
    }
    var h2 = (head && head.querySelector('h2')) || sec.querySelector('h2');
    if (!h2) return null;
    var t = h2.textContent.trim().replace(/\.$/, '');
    if (!t) return null;
    return { label: t.length <= 46 ? t : t.slice(0, 44) + '…', hide: [h2] };
  }

  function wrap(sec, label, hide, open) {
    var w = d.createElement('div');
    w.className = 'm-acc';

    var id = 'm-acc-' + (++seq);
    var b = d.createElement('button');
    b.type = 'button';
    b.className = 'm-acc-btn';
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.setAttribute('aria-controls', id);
    b.innerHTML = '<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    b.firstChild.textContent = label;

    var body = d.createElement('div');
    body.className = 'm-acc-body';
    body.id = id;

    sec.parentNode.insertBefore(w, sec);
    w.appendChild(b);
    w.appendChild(body);
    body.appendChild(sec);

    (hide || []).forEach(function (e) { if (e) e.classList.add('m-acc-hide'); });
    if (open) w.classList.add('open');

    b.addEventListener('click', function () {
      var o = w.classList.toggle('open');
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  }

  var sections = Array.prototype.slice.call(d.body.children).filter(function (e) {
    return e.tagName === 'SECTION' &&
           e.querySelector('.section-head') &&
           (e.className || '').indexOf('cta') < 0 &&
           !e.querySelector('.final-cta') &&
           !e.querySelector('.cta-actions');
  });

  sections.forEach(function (s, i) {
    var r = labelFor(s);
    if (!r || !r.label) return;
    /* The first panel starts open. Everything collapsed means a reader who
       taps nothing meets no evidence at all, and the record in Japan is what
       this page rests on. */
    wrap(s, r.label, r.hide, i === 0);
  });
})();
