import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ScanFace,
  QrCode,
  Blocks,
  MapPinned,
  Siren,
  Landmark,
  WifiOff,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Smartphone,
  PhoneCall,
  Sparkles,
  Award,
  Globe2,
} from "lucide-react";

const PILLARS = [
  {
    icon: <ScanFace className="size-6 text-blue-600" />,
    title: "Authority-Verified e-KYC",
    body: "Passport and visa OCR extraction combined with real-time face liveness biometric scanning issues a tamper-evident digital credential bound to your physical smartphone.",
  },
  {
    icon: <ShieldCheck className="size-6 text-blue-600" />,
    title: "Granular Consent Engine",
    body: "Hotels, SIM providers, and rental desks receive only attribute fragments they legally need — you approve every data access request via real-time popups.",
  },
  {
    icon: <QrCode className="size-6 text-blue-600" />,
    title: "Selective Disclosure Dynamic QR",
    body: "Dynamic QR payloads encode only your chosen attribute fields in real time using cryptographic signatures. Share required details without exposing raw passport or document records.",
  },
  {
    icon: <Blocks className="size-6 text-blue-600" />,
    title: "Zero-PII Blockchain Anchor",
    body: "Only cryptographic credential Merkle roots, issuer keys, and revocation status flags are recorded on-chain. Zero personal identity records ever leave your phone.",
  },
  {
    icon: <MapPinned className="size-6 text-blue-600" />,
    title: "AI Safety & Spatial Geofencing",
    body: "Virtual boundaries designate restricted areas, disaster zones, or scam hotspots across digital maps. Anomaly detection alerts travellers before danger occurs.",
  },
  {
    icon: <Siren className="size-6 text-blue-600" />,
    title: "One-Touch Emergency SOS Grid",
    body: "A 3-second hold gesture locks high-accuracy GPS telemetry, classifies the incident via AI, and routes emergency tickets directly to nearby police & medical teams.",
  },
];

const STATS = [
  { value: "1363", label: "24×7 Multilingual Tourist Helpline" },
  { value: "112", label: "National Emergency Response Number" },
  { value: "100%", label: "Selective attribute control" },
  { value: "0", label: "Personal records written on-chain" },
];

const STEPS = [
  {
    step: "01",
    title: "Sign in with Google",
    body: "Create your account using Google OAuth or email. Your session is encrypted end-to-end and never shared with third parties.",
  },
  {
    step: "02",
    title: "Passport & Visa OCR + Liveness Scan",
    body: "Upload your passport and visa documents for automated text extraction, followed by a 5-second live face scan to confirm physical presence.",
  },
  {
    step: "03",
    title: "Receive Device-Bound Digital ID",
    body: "Once vetted by immigration records, a signed digital credential token is sealed inside your smartphone's secure enclave (TPM/Keychain).",
  },
  {
    step: "04",
    title: "Verify Once, Travel Freely",
    body: "Check into hotels, buy a SIM, enter national monuments, and rent cars without ever exposing raw physical passport documents again.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/60 via-white to-white py-12 md:py-16">
        <div className="container-page relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
                {/* <Sparkles className="size-3.5 text-blue-600" /> */}
                <span>
                  Republic of India Smart Tourism &amp; Safety Initiative
                </span>
              </div>

              <h1 className="font-serif text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.15]">
                Verify once. <br />
                <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  Travel freely. Stay protected.
                </span>
              </h1>

              <p className="text-base text-slate-600 md:text-lg leading-relaxed max-w-xl">
                SafirPass transforms international travel by replacing redundant
                passport photocopies with a privacy-first Digital Tourist ID —
                backed by authority e-KYC, selective disclosure QR credentials,
                and an AI-assisted emergency dispatch grid.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/auth"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span>Sign in &amp; Get Verified</span>
                  <ArrowRight className="size-5" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Explore How It Works
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> GDPR
                  &amp; DPDP Compliant
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> e-Visa
                  &amp; Form C Integrated
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Hardware
                  Device Binding
                </span>
              </div>
            </div>

            {/* Hero App Showcase Image Gallery */}
            <div className="relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
                  <img
                    src="/assets/hero-immigration.jpg"
                    alt="SafirPass Digital Tourist ID e-Gate Verification Kiosk"
                    className="w-full h-[380px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                      <ScanFace className="size-3.5" /> E-Gate Biometric
                      Verification
                    </span>
                    <h3 className="text-xl font-bold">
                      Seamless International Entry
                    </h3>
                    <p className="text-xs text-slate-200">
                      Instant immigration check-in with verified digital
                      passport token.
                    </p>
                  </div>
                </div>

                {/* Floating Card Overlay */}
                <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <QrCode className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Dynamic Credentials
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      Selective Disclosure Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat Strip */}
      <div className="border-y border-slate-200 bg-slate-50 py-8">
        <div className="container-page grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="border-l-4 border-blue-600 pl-4 space-y-1"
            >
              <p className="font-serif text-3xl font-extrabold text-slate-900">
                {s.value}
              </p>
              <p className="text-xs font-medium text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Problem vs Solution */}
      <section className="py-20 bg-white">
        <div className="container-page space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              The Problem We Solve
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Tourists repeat the same document exposure ritual a dozen times a
              trip
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Every hotel check-in, SIM counter, rental desk, and monument
              requires physical passport photocopies. Sensitive personal details
              get stored insecurely in physical registers, risking identity
              theft — while genuine emergencies stall because responders lack
              critical identity details.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
              <img
                src="/assets/india-tourism.jpg"
                alt="International tourists exploring Taj Mahal landmark in India"
                className="w-full h-[360px] object-cover"
              />
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Passport photocopies leaked in paper registers",
                  desc: "Physical documents stored in unencrypted hotel guest registers expose full passport numbers to unauthorized personnel.",
                },
                {
                  title: "No single verifiable proof when documents are lost",
                  desc: "Losing a physical passport leaves travellers stranded without instant digital identity verification.",
                },
                {
                  title: "Emergency responders lack vital context",
                  desc: "Police and paramedics arrive at incident scenes without knowing medical indicators or emergency contacts.",
                },
                {
                  title: "Fraudulent operators & tourist impersonation",
                  desc: "Unregistered guides and scam agencies exploit tourists who cannot verify official authority credentials.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                    0{idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nine Platform Pillars */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container-page space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Platform Blueprint
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Nine connected modules, one trusted traveller record
            </h2>
            <p className="text-base text-slate-600">
              From onboarding to consular rescue, every module shares the same
              verified identity while keeping raw personal data out of public
              circulation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50">
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {p.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Step-by-Step */}
      <section className="py-20 bg-white">
        <div className="container-page space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Simple Onboarding
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Four steps from arrival to a fully trusted credential
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              {STEPS.map((s) => (
                <div
                  key={s.step}
                  className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <span className="font-serif text-3xl font-extrabold text-blue-600">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl">
              <img
                src="/assets/digital-id.jpg"
                alt="Traveller holding smartphone displaying SafirPass Digital Tourist ID QR credential"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Safety & Authority Split */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container-page space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Dual Protection Grid
            </span>
            <h2 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl">
              Protection that works before and during an incident
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Traveller SOS Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg flex flex-col justify-between">
              <img
                src="/assets/emergency-response.jpg"
                alt="Emergency responders receiving instant tourist SOS alert telemetry"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-red-600">
                    <Siren className="size-3.5" /> For Travellers
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    One-Touch Emergency SOS
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    Press and hold the SOS panic button for 3 seconds. Your
                    precise GPS coordinates, medical profile, and emergency
                    contacts reach the nearest police control room or embassy
                    desk instantly.
                  </p>
                </div>
                <Link
                  href="/safety"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>Explore Safety Features</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Authority Command Center Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg flex flex-col justify-between">
              <img
                src="/assets/command-center.jpg"
                alt="Government emergency command center live incident radar dashboard"
                className="w-full h-56 object-cover"
              />
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                    <Building2 className="size-3.5" /> For Authorities
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Authority Command Center
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600">
                    A live radar of active alerts, geofence breaches, and
                    anonymized tourist density, complete with an incident
                    dispatch triage queue and scam trend analytics.
                  </p>
                </div>
                <Link
                  href="/authorities"
                  className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>View Command Center</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-12 md:py-16">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-8 sm:p-12 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3 relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Ready to create your Digital Tourist ID?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Sign in with Google, complete e-KYC once, and travel across
                trusted services without ever exposing raw passport documents
                again.
              </p>
            </div>
            <Link
              href="/auth"
              className="relative z-10 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-blue-500 transition-all hover:shadow-blue-500/25 shrink-0"
            >
              <span>Get Started Now</span>
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
