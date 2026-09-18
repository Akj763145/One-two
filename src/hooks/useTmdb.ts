import { useEffect, useState } from "react";

const mem = new Map<string, { t: number, data: any }>();

export function useTmdb<T = any>(key: string, fn: () => Promise<T>, ttlMs = 6 * 3600e3): T | undefined | { error: true } {
  const [state, set] = useState<T | undefined | { error: true }>(() => {
    const hit = mem.get(key);
    if (hit && Date.now() - hit.t < ttlMs) {
      return hit.data;
    }
    return undefined;
  });

  useEffect(() => {
    const hit = mem.get(key);
    if (hit && Date.now() - hit.t < ttlMs) {
      set(hit.data);
      return;
    }
    
    let alive = true;
    fn()
      .then((d) => { 
        mem.set(key, { t: Date.now(), data: d }); 
        if (alive) set(d); 
      })
      .catch((e) => { 
        console.error(e);
        if (alive) set({ error: true }); 
      });
      
    return () => { alive = false; };
  }, [key]);

  return state;
}
