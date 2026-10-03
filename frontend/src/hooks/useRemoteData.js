import { useEffect, useState, useCallback } from "react";
/** The caller memoizes fetcher; outdated responses never overwrite current data. */
export default function useRemoteData(fetcher) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ fetcher: null, attempt: -1, data: null, error: null });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(fetcher).then(
      (data) => { if (active) setState({ fetcher, attempt, data, error: null }); },
      (error) => { if (active) setState({ fetcher, attempt, data: null, error }); },
    );
    return () => { active = false; };
  }, [fetcher, attempt]);
  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const loading = state.fetcher !== fetcher || state.attempt !== attempt;
  return { data: loading ? null : state.data, error: loading ? null : state.error, loading, reload };
}
