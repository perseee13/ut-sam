/* Helpers for navigating the course data the API returns. */

export function flatLessons(modules) {
  const out = [];
  (modules || []).forEach(function (module) {
    module.lessons.forEach(function (lesson) {
      out.push({
        module: module,
        lesson: lesson,
        key: module.id + "/" + lesson.id
      });
    });
  });
  return out;
}

export function findLessonEntry(modules, key) {
  return flatLessons(modules).find(function (entry) { return entry.key === key; }) || null;
}

export function moduleMinutes(module) {
  return module.lessons.reduce(function (sum, lesson) { return sum + (lesson.min || 0); }, 0);
}

export function courseMinutes(modules) {
  return (modules || []).reduce(function (sum, module) { return sum + moduleMinutes(module); }, 0);
}

export function courseLessonCount(modules) {
  return (modules || []).reduce(function (sum, module) { return sum + module.lessons.length; }, 0);
}
