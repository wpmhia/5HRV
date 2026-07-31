import Script from "next/script";

export function SiteBehaviour() {
  const secret = process.env.NEXT_PUBLIC_SITEBEHAVIOUR_SECRET;

  if (!secret) return null;

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
