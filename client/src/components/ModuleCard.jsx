import { Link } from "react-router-dom";
import { formatDuration } from "../api.js";
import { moduleMinutes } from "../lib/course.js";
import { useProgress } from "../lib/progress.js";
import SpotlightCard from "../bits/SpotlightCard.jsx";

export default function ModuleCard({ module, index }) {
  const progress = useProgress();

  return (
    <SpotlightCard
      role="article"
      className="module-card"
      theme="dark"
      spotlightColor="rgba(94, 234, 212, 0.14)"
      intensity={0.16}
      spotlightSize={260}
    >
      <header className="module-head">
        <span className="module-icon" aria-hidden="true">{module.icon}</span>
        <div>
          <h3>{module.title}</h3>
          <p className="module-meta">
            Module {index + 1} · {module.lessons.length} lessons · {formatDuration(moduleMinutes(module))}
          </p>
        </div>
      </header>
      <p className="module-sum">{module.sum}</p>
      <ul className="module-lessons">
        {module.lessons.map(function (lesson, i) {
          const key = module.id + "/" + lesson.id;
          const done = progress.has(key);
          return (
            <li key={key}>
              <span className={done ? "is-done" : ""}>
                <span className="num">{i + 1}</span>
                <span>{lesson.title}</span>
                <span className="done-mark" aria-hidden="true">✓</span>
                <span className="l-min">{lesson.min || "?"}m</span>
              </span>
            </li>
          );
        })}
      </ul>
    </SpotlightCard>
  );
}
