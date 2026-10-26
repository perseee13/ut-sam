import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import "./styles.css";
import "./extras.css";
import "./light-theme.css";
import "./topic-dark.css";

class BootBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error };
  }
  componentDidCatch(error, info) {
    console.error("Boot error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ maxWidth: 680, margin: "60px auto", padding: 24, fontFamily: "monospace", color: "#f2ebff", background: "#1c1530", border: "1px solid #f87171", borderRadius: 12 }}>
          <h2 style={{ color: "#f87171", margin: "0 0 8px" }}>Page failed to render</h2>
          <p>{String((this.state.error && this.state.error.message) || this.state.error).slice(0, 500)}</p>
          <p style={{ color: "#9989bf" }}>Check DevTools (F12) Console for the stack. Try Ctrl+Shift+R.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BootBoundary>
          <App />
        </BootBoundary>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

