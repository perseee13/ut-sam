/* Loads the JSON content once and exposes it through small query helpers. */
"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const course = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "course.json"), "utf8"));

const modules = course.modules;

/* flat list of every lesson with its position in the course */
const LESSONS = [];
modules.forEach(function (module, moduleIndex) {
  module.lessons.forEach(function (lesson, lessonIndex) {
    LESSONS.push({
      module: module,
      lesson: lesson,
      key: module.id + "/" + lesson.id,
      moduleIndex: moduleIndex,
      lessonIndex: lessonIndex
    });
  });
});

function moduleMinutes(module) {
  return module.lessons.reduce(function (sum, l) { return sum + (l.min || 0); }, 0);
}

function listModules() {
  return modules.map(function (module) {
    return {
      id: module.id,
      title: module.title,
      icon: module.icon,
      sum: module.sum,
      lessonCount: module.lessons.length,
      minutes: moduleMinutes(module)
    };
  });
}

function getModule(moduleId) {
  const module = modules.find(function (m) { return m.id === moduleId; });
  if (!module) return null;
  return Object.assign({}, module, {
    lessonCount: module.lessons.length,
    minutes: moduleMinutes(module)
  });
}

function getLesson(moduleId, lessonId) {
  const entry = LESSONS.find(function (e) {
    return e.module.id === moduleId && e.lesson.id === lessonId;
  }) || null;
  if (!entry) return null;

  const index = LESSONS.indexOf(entry);
  return {
    module: { id: entry.module.id, title: entry.module.title, icon: entry.module.icon },
    lesson: entry.lesson,
    position: { index: index + 1, total: LESSONS.length },
    modulePosition: { index: entry.lessonIndex + 1, total: entry.module.lessons.length },
    prev: index > 0 ? LESSONS[index - 1].key : null,
    next: index < LESSONS.length - 1 ? LESSONS[index + 1].key : null
  };
}

function getMeta() {
  return Object.assign({}, course.meta);
}

module.exports = {
  getCourse: function () { return { meta: getMeta(), modules: modules }; },
  getMeta: getMeta,
  listModules: listModules,
  getModule: getModule,
  getLesson: getLesson
};
