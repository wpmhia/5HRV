"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const TRACKING_FREE_PATHS = ["/calculator", "/calculator/result"];

export function SiteBehaviour() {
  const pathname = usePathname();
  const secret = process.env.NEXT_PUBLIC_SITEBEHAVIOUR_SECRET;

  if (!secret) return null;

  // Calculation and result pages are tracking-free zones: never load the
  // third-party script on them, so entered HRV data and results are never
  // exposed to the analytics provider.
  if (TRACKING_FREE_PATHS.includes(pathname)) return null;

  return (
    <>
      <Script
        id="sitebehaviour-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (
                window.location.search.includes(
                  "capture-sitebehaviour-heatmap"
                )
              ) {
                sessionStorage.setItem(
                  "capture-sitebehaviour-heatmap",
                  "_"
                );
              }

              window.sitebehaviourTrackingSecret =
                ${JSON.stringify(secret)};
            } catch (error) {
              console.error(
                "SiteBehaviour initialization failed",
                error
              );
            }
          `,
        }}
      />

      <Script
        id="site-behaviour-script-v2"
        strategy="afterInteractive"
        src={`https://sitebehaviour-cdn.fra1.cdn.digitaloceanspaces.com/index.min.js?sitebehaviour-secret=${encodeURIComponent(secret)}`}
      />
    </>
  );
}
