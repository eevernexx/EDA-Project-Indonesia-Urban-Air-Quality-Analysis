import { useEffect, useState } from "react";

const BASE = import.meta.env.BASE_URL;

export function useData(name) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}data/${name}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${name}.json (${r.status})`);
        return r.json();
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [name]);

  return { data, error };
}

export function rollingMean(values, window) {
  const out = new Array(values.length).fill(null);
  const minPeriods = Math.floor(window / 2);
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      if (values[j] != null && !Number.isNaN(values[j])) {
        sum += values[j];
        count += 1;
      }
    }
    out[i] = count >= minPeriods ? sum / count : null;
  }
  return out;
}
