import { useEffect, useRef, useState } from "react";
import type { Language } from "../lib/types";
import { adManager } from "./AdManager";
import { InternalAdFallback } from "./InternalAdFallback";

export function AdSlot({ language }: { language: Language }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [adReady, setAdReady] = useState(false);

  useEffect(() => {
    let active = true;
    const target = targetRef.current;
    if (!target) return;

    // Let the main page paint before an optional third-party provider is touched.
    const timeout = window.setTimeout(() => {
      void adManager.render(target).then((ready) => {
        if (active) setAdReady(ready);
        if (!ready) adManager.cleanup(target);
      });
    }, 800);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      adManager.cleanup(target);
    };
  }, []);

  return <section className="ad-slot container" aria-label={adReady ? "Optional information" : "Meridian Malaysia information"}>
    <div className="ad-slot-inner">
      <div ref={targetRef} className="ad-viewport" aria-live="polite"/>
      {!adReady && <InternalAdFallback language={language}/>}
    </div>
  </section>;
}
