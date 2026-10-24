import { useEffect, useState } from 'react';

// Загрузка данных с API: { data, error, loading }.
// loader получает AbortSignal, чтобы при уходе со страницы запрос отменялся.
export const useApi = (loader, deps) => {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ data: prev.data, error: null, loading: true }));
    loader(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error?.name === 'AbortError') return;
        setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
};
