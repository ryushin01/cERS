import React, { ReactNode } from "react";

import Provider from "@components/common/Provider";
import ToastPopup from "@components/common/ToastPopup";
import { DESCRIPTION, FAVICON, OG_IMAGE, SITE_URL, TITLE } from "@constants/metadata";

import type { Metadata, Viewport } from "next";

/* Pretendard 글꼴은 CDN이 아니라 패키지에서 함께 빌드합니다(오프라인에서도 같은 글꼴) */
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${TITLE} 화면 미리보기` }],
  },
  icons: {
    icon: FAVICON,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/images/logo/logo-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/images/logo/logo-512x512.png" />
      </head>
      <body>
        <Provider>
          <div id="app">{children}</div>
          <ToastPopup />
          <div id="portal" />
        </Provider>
      </body>
    </html>
  );
}
