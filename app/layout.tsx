import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OCG 2003 | 2003年の日本OCGをもう一度",
  description: "2003年12月31日時点の日本OCGを再現する、スマートフォン向けシングルプレイカードゲーム。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15130f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
