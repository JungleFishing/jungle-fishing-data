/* Jungle Fishing · homepage water widgets
   Updates the hero "Rio Negro · Manaus" level and the small Water Tracker
   chart on the homepage from data.json (refreshed every morning by the
   GitHub job). Loaded from the homepage footer code via jsDelivr. If the
   data can't load, the numbers typed into Webflow stay as they are. */
(function () {
  var URL = 'https://raw.githubusercontent.com/JungleFishing/jungle-fishing-data/main/data.json';
  var DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function day(t) { return Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)) / 864e5; }
  function fmt(t) { return new Date(day(t) * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); }

  function hero(m) {
    var last = m[m.length - 1], lt = day(last[0]);
    var wk = m.filter(function (q) { var g = lt - day(q[0]); return g >= 5 && g <= 9; })
      .sort(function (a, b) { return Math.abs(lt - day(a[0]) - 7) - Math.abs(lt - day(b[0]) - 7); })[0];
    var unit = document.querySelector('.hero_water-widget .hero_water-stat-unit');
    if (unit && unit.previousElementSibling) unit.previousElementSibling.textContent = last[1].toFixed(1);
    var status = document.querySelector('.hero_water-widget .hero_water-status');
    if (status && wk) {
      var ch = last[1] - wk[1];
      status.textContent = ch <= -0.15 ? '▼ Falling' : ch >= 0.15 ? '▲ Rising' : '■ Steady';
    }
    var note = document.querySelector('.hero_water-widget .hero_water-status-note');
    if (note) note.textContent = 'As of ' + fmt(last[0]);
  }

  function panel(m) {
    var lines = document.querySelectorAll('.water-tracker_panel svg polyline');
    if (lines.length < 2) return;
    var year = +m[m.length - 1][0].slice(0, 4);
    // same scale the Webflow drawing uses: 460 x 170 box, ~36.6 px per month, ~10 px per metre
    function x(t) { var mo = +t.slice(5, 7) - 1, d = +t.slice(8, 10); return 10.2 + (mo + (d - 1) / DIM[mo]) * 36.56; }
    function y(v) { return Math.max(4, Math.min(166, 89 - (v - 22.06) * 9.956)); }
    function pts(yr) {
      var rows = m.filter(function (q) { return +q[0].slice(0, 4) === yr; });
      var keep = rows.filter(function (q, i) { return i % 5 === 0 || i === rows.length - 1; });
      return keep.map(function (q) { return x(q[0]).toFixed(1) + ',' + y(q[1]).toFixed(1); }).join(' ');
    }
    var cur = pts(year), prev = pts(year - 1);
    if (cur) lines[0].setAttribute('points', cur);
    if (prev) lines[1].setAttribute('points', prev);
    document.querySelectorAll('.water-tracker_panel .water-tracker_legend-item').forEach(function (el) {
      if (/2026|▮/.test(el.textContent) && el.classList.contains('is-invert')) el.textContent = '▮ ' + year;
      else if (/^\s*\d{4}\s*$/.test(el.textContent)) el.textContent = String(year - 1);
    });
  }

  fetch(URL + '?h=' + Math.floor(Date.now() / 36e5))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      var m = d && d.stations && d.stations.manaus && d.stations.manaus.daily;
      if (!m || !m.length) return;
      hero(m); panel(m);
    })
    .catch(function () {});
})();
