/* Landing page: stats rendered from COURSE_MODULES. */
(function () {
  "use strict";

  var Site = window.Site;
  var statsEl = document.getElementById("stats");
  var note = document.getElementById("hero-progress-note");

  function renderStats() {
    if (!statsEl) return;
    var s = Site.stats();
    var done = Site.loadProgress().size;
    var tiles = [
      { n: s.modules, label: "modules" },
      { n: s.lessons, label: "hands-on lessons" },
      { n: Site.formatDuration(s.minutes), label: "of guided reading" },
      { n: done + " / " + s.lessons, label: "lessons you've completed" }
    ];
    statsEl.innerHTML = tiles.map(function (tile) {
      return '<div class="stat"><b>' + Site.esc(tile.n) + "</b><span>" + tile.label + "</span></div>";
    }).join("");

    if (done > 0 && note) {
      note.innerHTML = "You've completed <strong>" + done + " of " + s.lessons +
        "</strong> lessons.";
    }
  }

  renderStats();
})();
