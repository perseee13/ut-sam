/* Thin API client for the Express backend. Responses are cached per session
   (the course content is static), so navigating between lessons is instant. */

const cache = new Map();

async function request(path) {
  const res = await fetch(path, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body && body.error) detail = body.error;
    } catch (err) { /* non-JSON error body */ }
    throw new Error("API " + res.status + " on " + path + " — " + detail);
  }
  return res.json();
}

export function fetchJson(path) {
  if (!cache.has(path)) {
    const pending = request(path).catch((err) => {
      cache.delete(path); /* let the next attempt retry after a failure */
      throw err;
    });
    cache.set(path, pending);
  }
  return cache.get(path);
}

export function getCourse() {
  return fetchJson("/api/course");
}

export function getModule(moduleId) {
  return fetchJson("/api/modules/" + encodeURIComponent(moduleId));
}

export function getLesson(moduleId, lessonId) {
  return fetchJson("/api/modules/" + encodeURIComponent(moduleId) +
    "/lessons/" + encodeURIComponent(lessonId));
}

export function formatDuration(minutes) {
  const value = Number(minutes) || 0;
  if (value < 60) return value + " min";
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  return hours + " h" + (rest ? " " + rest + " min" : "");
}
