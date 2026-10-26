import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

const POLL_INTERVAL_MS = 3000;

function statusFor(value, thresholds, labels) {
  const v = Number(value);
  if (!Number.isFinite(v)) return labels[labels.length - 1];
  for (let i = 0; i < thresholds.length; i++) {
    if (v <= thresholds[i]) return labels[i];
  }
  return labels[labels.length - 1];
}

function safeToFixed(value, digits) {
  const v = Number(value);
  return Number.isFinite(v) ? v.toFixed(digits) : "0.00";
}

function formatTimestamp(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch (e) {
    return "—";
  }
}

export default function DataPage() {
  const [reading, setReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const timerRef = useRef(null);

  const fetchLatest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sensors/latest", { headers: { Accept: "application/json" } });
      if (res.status === 404) {
        setReading(null); setConnected(false); setError(null); setLoading(false); return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setReading(data); setConnected(true); setError(null);
    } catch (err) {
      setConnected(false); setError(err.message); console.error("[sensor] latest failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/sensors/history?limit=50", { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setHistory(Array.isArray(data.readings) ? data.readings : []);
    } catch (err) {
      console.error("[sensor] history failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
    timerRef.current = setInterval(fetchLatest, POLL_INTERVAL_MS);
    fetchHistory();
    return function () { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchLatest, fetchHistory]);

  const tStatus = reading ? statusFor(reading.turbidity, [1, 5], ["Clear", "Moderate", "High"]) : "—";
  const fStatus = reading ? statusFor(reading.tof, [50, 300, 500], ["Excellent", "Good", "Fair", "Poor"]) : "—";
  const lStatus = reading ? statusFor(reading.light, [50, 300], ["Low Light", "Moderate", "Bright"]) : "—";

  return (
    <div className="container section">
      <header className="dashboard-header">
        <h1>🌊 Sensor Monitor</h1>
        <p className="subtitle">Live readings from ESP32 water quality sensors</p>
        <Link to="/" className="back-home">← Back to Home</Link>
      </header>

      {connected ? (
        <div className="status-banner status-ok">
          <span className="status-dot" aria-hidden="true">●</span> ESP32 connected — live data
        </div>
      ) : error ? (
        <div className="status-banner status-error">
          <span className="status-dot" aria-hidden="true">●</span> Error: {error}
        </div>
      ) : loading ? (
        <div className="status-banner status-loading">
          <span className="status-dot pulse" aria-hidden="true">●</span> Connecting…
        </div>
      ) : (
        <div className="status-banner status-error">
          <span className="status-dot" aria-hidden="true">●</span> No sensor data yet. Is the ESP32 posting to /api/sensors?
        </div>
      )}

      <div className="sensor-grid">
        <article className="sensor-card card-turbidity">
          <div className="card-header"><span className="card-icon" aria-hidden="true">💧</span><span className="card-label">Turbidity</span></div>
          <div className="card-reading">{safeToFixed(reading?.turbidity, 2)}<span className="card-unit">NTU</span></div>
          <div className="card-status">{tStatus}</div>
          <div className="card-footer"><span className="card-updated">Updated {formatTimestamp(reading?.created_at)}</span></div>
        </article>
        <article className="sensor-card card-tof">
          <div className="card-header"><span className="card-icon" aria-hidden="true">📏</span><span className="card-label">TOF</span></div>
          <div className="card-reading">{safeToFixed(reading?.tof, 2)}<span className="card-unit">ppm</span></div>
          <div className="card-status">{fStatus}</div>
          <div className="card-footer"><span className="card-updated">Updated {formatTimestamp(reading?.created_at)}</span></div>
        </article>
        <article className="sensor-card card-light">
          <div className="card-header"><span className="card-icon" aria-hidden="true">☀️</span><span className="card-label">Light</span></div>
          <div className="card-reading">{safeToFixed(reading?.light, 2)}<span className="card-unit">lux</span></div>
          <div className="card-status">{lStatus}</div>
          <div className="card-footer"><span className="card-updated">Updated {formatTimestamp(reading?.created_at)}</span></div>
        </article>
      </div>

      <section className="history-section">
        <h2>History</h2>
        {history.length === 0 ? (
          <div className="empty-state"><p>No historical readings yet. Data will appear once the ESP32 starts sending readings.</p></div>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr><th>Time</th><th>Turbidity (NTU)</th><th>TOF (ppm)</th><th>Light (lux)</th></tr>
              </thead>
              <tbody>
                {history.slice().reverse().map(function (row, i) {
                  return (
                    <tr key={i}>
                      <td className="mono">{formatTimestamp(row.created_at)}</td>
                      <td className="mono">{safeToFixed(row.turbidity, 2)}</td>
                      <td className="mono">{safeToFixed(row.tof, 2)}</td>
                      <td className="mono">{safeToFixed(row.light, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}