import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import SafetyAssistantDrawer from "../components/SafetyAssistantDrawer";
import { AuthProvider } from "../lib/auth-context";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "SafirPass — AI-Powered Smart Tourist Identity, Safety & Incident Response System",
  description: "SafirPass is a privacy-first digital tourist identity platform for India & globally: verified e-KYC, selective disclosure QR credentials, PostGIS safety geofencing and automated emergency dispatch.",
  openGraph: {
    title: "SafirPass — Smart Tourist Identity Grid",
    description: "Verify once, travel freely across trusted services. Digital Tourist ID, consent-controlled data sharing and rapid incident response.",
    images: ["/assets/hero-immigration.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <SafetyAssistantDrawer />
          <Footer />
        </AuthProvider>

      </body>
    </html>
  );
}
