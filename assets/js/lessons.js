/* =========================================================
   ServerPath — shared helpers.
   Load this file BEFORE any data-*.js file and before the
   page-specific scripts (app.js, learn.js).
   ========================================================= */
window.COURSE_MODULES = window.COURSE_MODULES || [];

window.Site = (function () {
  "use strict";

  var STORAGE_KEY = "serverpath.progress.v1";

  /* Escape text before inserting it into HTML. */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /* Tiny inline markup for lesson text: `code` and **bold**. */
  function inline(value) {
    return esc(value)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function loadProgress() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(list) ? list : []);
    } catch (err) {
      return new Set();
    }
  }

  function saveProgress(set) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
    } catch (err) {
      /* Private browsing or blocked storage: progress simply won't persist. */
    }
  }

  function modules() { return window.COURSE_MODULES || []; }

  function allLessons() {
    var out = [];
    modules().forEach(function (module, moduleIndex) {
      (module.lessons || []).forEach(function (lesson, lessonIndex) {
        out.push({
          module: module,
          lesson: lesson,
          key: module.id + "/" + lesson.id,
          moduleIndex: moduleIndex,
          lessonIndex: lessonIndex
        });
      });
    });
    return out;
  }

  function findLesson(moduleId, lessonId) {
    var found = null;
    allLessons().forEach(function (entry) {
      if (entry.module.id === moduleId && entry.lesson.id === lessonId) found = entry;
    });
    return found;
  }

  function stats() {
    var list = allLessons();
    var minutes = list.reduce(function (sum, entry) { return sum + (entry.lesson.min || 0); }, 0);
    return { modules: modules().length, lessons: list.length, minutes: minutes };
  }

  function formatDuration(minutes) {
    minutes = Number(minutes) || 0;
    if (minutes < 60) return minutes + " min";
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    return hours + " h" + (rest ? " " + rest + " min" : "");
  }

  function firstLesson() { return allLessons()[0] || null; }

  /* Copy text with a clipboard-API → textarea fallback. */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); resolve(); } catch (err) { reject(err); }
      document.body.removeChild(area);
    });
  }

  return {
    esc: esc,
    inline: inline,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    modules: modules,
    allLessons: allLessons,
    findLesson: findLesson,
    stats: stats,
    formatDuration: formatDuration,
    firstLesson: firstLesson,
    copyText: copyText,
    STORAGE_KEY: STORAGE_KEY
  };
})();
