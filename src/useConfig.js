import { useEffect, useState } from 'react';
import api from './api';

let cache = null;

// Prize ladder config, fetched once and shared across pages.
export default function useConfig() {
  const [cfg, setCfg] = useState(cache);
  useEffect(() => {
    if (cache) return;
    api
      .get('/game/config')
      .then((r) => {
        cache = r.data;
        setCfg(r.data);
      })
      .catch(() => {});
  }, []);
  return cfg;
}
