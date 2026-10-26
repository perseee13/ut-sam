/* Squid Proxy page: render every squid lesson + quiz + progress. */
(function () {
  "use strict";

  var Site = window.Site;
  var list = document.getElementById("squid-lessons-list");
  var note = document.getElementById("squid-progress-note");
  var module = null;

  (Site.modules() || []).forEach(function (m) {
    if (m.id === "squid") module = m;
  });

  function updateNote(done) {
    if (!note || !module) return;
    if (done.size > 0) {
      var mine = module.lessons.filter(function (l) {
        return done.has("squid/" + l.id);
      }).length;
      note.innerHTML = "You've completed <strong>" + mine + " of " +
        module.lessons.length + "</strong> Squid Proxy lessons.";
    }
  }

  function blockHtml(block) {
    if (block.t === "h") return "<h2>" + Site.esc(block.x) + "</h2>";
    if (block.t === "p") return "<p>" + Site.inline(block.x) + "</p>";
    if (block.t === "ul") {
      return '<ul class="lesson-list">' + block.x.map(function (item) {
        return "<li>" + Site.inline(item) + "</li>";
      }).join("") + "</ul>";
    }
    if (block.t === "code") {
      var title = block.title
        ? '<span class="code-title">' + Site.esc(block.title) + "</span>"
        : "";
      return '<figure class="codeblock"><figcaption class="code-head">' +
        '<span class="code-lang">' + Site.esc(block.lang || "bash") + "</span>" +
        title +
        '<button type="button" class="code-copy" data-copy="' +
        Site.esc(block.x).replace(/"/g, "&quot;") + '">copy</button>' +
        "</figcaption><pre><code>" + Site.esc(block.x) + "</code></pre></figure>";
    }
    if (block.t === "tip") {
      return '<div class="callout callout-tip"><strong>Tip</strong><p>' +
        Site.inline(block.x) + "</p></div>";
    }
    if (block.t === "warn") {
      return '<div class="callout callout-warn"><strong>Watch out</strong><p>' +
        Site.inline(block.x) + "</p></div>";
    }
    return "";
  }

  function quizHtml(lesson, key) {
    return '<div class="quiz" data-quiz="' + key + '">' +
      "<h2>Check yourself</h2>" +
      '<p class="quiz-hint">Pick an answer — the explanation shows right away.</p>' +
      lesson.quiz.map(function (item, qi) {
        return '<div class="quiz-q"><p class="q-text">' + (qi + 1) + ". " +
          Site.esc(item.q) + "</p>" +
          '<div class="quiz-opts">' + item.opts.map(function (opt, oi) {
            return '<button type="button" class="quiz-opt" data-q="' + qi +
              '" data-o="' + oi + '" data-a="' + item.a + '">' +
              Site.esc(opt) + "</button>";
          }).join("") + "</div>" +
          '<p class="quiz-why" hidden>' + Site.inline(item.why) + "</p></div>";
      }).join("") + "</div>";
  }

  function render() {
    if (!module) {
      list.innerHTML = "<p>Could not find the Squid Proxy module.</p>";
      return;
    }
    document.title = "Squid Proxy — ServerPath";
    var done = Site.loadProgress();
    list.innerHTML = module.lessons.map(function (lesson, i) {
      var key = "squid/" + lesson.id;
      var isDone = done.has(key);
      return '<article class="lesson" id="' + Site.esc(lesson.id) + '">' +
        '<p class="lesson-crumb">Squid Proxy / Lesson ' + (i + 1) + " of " +
        module.lessons.length + "</p>" +
        '<div class="lesson-head"><h2>' + Site.esc(lesson.title) + "</h2>" +
        '<p class="lesson-summary">' + Site.esc(lesson.sum) + "</p>" +
        '<p class="lesson-meta"><span>' + lesson.min + " min</span>" +
        '<span class="' + (isDone ? "is-done" : "") + '">' +
        (isDone ? "✓ completed" : "not completed yet") + "</span></p></div>" +
        '<div class="lesson-body">' +
        lesson.blocks.map(blockHtml).join("") + "</div>" +
        quizHtml(lesson, key) +
        '<div class="lesson-foot"><button type="button" class="btn btn-primary complete-btn' +
        (isDone ? " is-done" : "") + '" data-key="' + key + '">' +
        (isDone ? "✓ Completed — undo?" : "Mark as complete") +
        "</button></div></article>";
    }).join("");
    updateNote(done);
  }

  list.addEventListener("click", function (event) {
    var copyBtn = event.target.closest(".code-copy");
    if (copyBtn) {
      Site.copyText(copyBtn.getAttribute("data-copy") || "").then(function () {
        copyBtn.textContent = "copied!";
        setTimeout(function () { copyBtn.textContent = "copy"; }, 1400);
      });
      return;
    }
    var opt = event.target.closest(".quiz-opt");
    if (opt && !opt.disabled) {
      var box = opt.closest(".quiz-q");
      var answer = Number(opt.getAttribute("data-a"));
      Array.prototype.forEach.call(box.querySelectorAll(".quiz-opt"), function (btn) {
        var oi = Number(btn.getAttribute("data-o"));
        btn.disabled = true;
        if (oi === answer) btn.classList.add("correct");
        else if (btn === opt) btn.classList.add("wrong");
      });
      box.querySelector(".quiz-why").hidden = false;
      return;
    }
    var doneBtn = event.target.closest(".complete-btn");
    if (doneBtn) {
      var done = Site.loadProgress();
      var key = doneBtn.getAttribute("data-key");
      if (done.has(key)) done.delete(key);
      else done.add(key);
      Site.saveProgress(done);
      render();
    }
  });

  render();
})();
