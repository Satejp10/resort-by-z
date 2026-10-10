import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resort",
  description: "Resort — your memories, beautifully organized.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* cover: lets us use env(safe-area-inset-*) on notched devices */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#202124" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint — avoids flash of wrong theme.
            Reads the same persisted shape zustand writes to localStorage. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t="system";var s=localStorage.getItem("gp-ente-photos");if(s){var j=JSON.parse(s);var st=j&&j.state&&j.state.theme;if(st==="light"||st==="dark"||st==="system")t=st}var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(err){}})()`,
          }}
        />
      </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
