"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT_ID, ADSENSE_DEFAULT_SLOT } from "@/lib/constants";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  adSlot?: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}

export function AdUnit({
  adSlot = ADSENSE_DEFAULT_SLOT,
  adFormat = "auto",
  fullWidthResponsive = true,
  className,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
