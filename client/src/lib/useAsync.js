import { useEffect, useState } from "react";

/* Minimal async state hook: { status: "loading" | "ready" | "error", data, error } */
export function useAsync(loader, deps) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading", data: null, error: null });

    loader().then(
      (data) => { if (alive) setState({ status: "ready", data, error: null }); },
      (error) => { if (alive) setState({ status: "error", data: null, error }); }
    );

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
