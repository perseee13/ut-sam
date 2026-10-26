export default function ApiDown({ error, title }) {
  return (
    <div className="app-error">
      <h2>{title || "Cannot reach the API"}</h2>
      <p>{String(error && error.message ? error.message : error)}</p>
      <p><strong>Fix in one command:</strong> restart the backend so it reloads the new Squid content, then reload this page.</p>
      <ul>
        <li><code>npm run dev:server</code> — API only, on http://localhost:4000</li>
        <li><code>npm run dev:client</code> — this app only, on http://localhost:5173 (proxies /api to :4000)</li>
      </ul>
      <p>If you already restarted it, hard-reload: <code>Ctrl+Shift+R</code>.</p>
    </div>
  );
}
