"use client";

import Link from "next/link";
import {
  ShieldCheck,
  PhoneCall,
  Globe,
  Lock,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-[#cfbeaa] bg-[#ede2d3] text-[#5a4637]">
      {/* Helpline strip */}
      <div className="border-b border-[#cfbeaa] bg-[#e0d2bf] py-4">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-[#2e2016]">
              24×7 Official Tourist Assistance &amp; Safety Grid
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:1363"
              className="flex items-center gap-2 rounded-lg bg-amber-600/10 border border-amber-700/20 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-600/20 transition-colors"
            >
              <PhoneCall className="size-3.5 text-amber-700" />
              <span>Tourist Helpline: 1363 / 1800-11-1363</span>
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-2 rounded-lg bg-red-600/10 border border-red-700/20 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-600/20 transition-colors"
            >
              <PhoneCall className="size-3.5 text-red-600" />
              <span>National Emergency: 112</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container-page py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                <ShieldCheck className="size-6 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#2e2016]">
                SafirPass
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#5a4637] max-w-sm">
              The AI-Powered Smart Tourist Identity, Safety &amp; Incident
              Response System. Privacy-first e-KYC, rotating cryptographic QR
              credentials, and automated 112 emergency dispatch.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-medium text-[#5a4637]">
              <span className="flex items-center gap-1 rounded-md bg-[#ded0bc] px-2.5 py-1 text-[#3b2b1e] border border-[#cbb79f]">
                <Lock className="size-3 text-blue-700" /> GDPR &amp; DPDP
                Compliant
              </span>
              <span className="flex items-center gap-1 rounded-md bg-[#ded0bc] px-2.5 py-1 text-[#3b2b1e] border border-[#cbb79f]">
                <Globe className="size-3 text-emerald-700" /> Ministry of
                Tourism Partner
              </span>
            </div>
          </div>

          {/* Platform Features Column (Always accessible to showcase features) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2e2016]">
              Platform Features
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-[#251a13] transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-[#251a13] transition-colors"
                >
                  Tourist Services
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="hover:text-[#251a13] transition-colors"
                >
                  Safety Grid &amp; SOS
                </Link>
              </li>
              <li>
                <Link
                  href="/technology"
                  className="hover:text-[#251a13] transition-colors"
                >
                  Security &amp; Cryptography
                </Link>
              </li>
              <li>
                <Link
                  href="/authorities"
                  className="hover:text-[#251a13] transition-colors"
                >
                  Authority Command Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#251a13] transition-colors"
                >
                  About SafirPass
                </Link>
              </li>
            </ul>
          </div>

          {/* User Tools (When Logged in) OR Public Services & Portal Access (Before Login) */}
          {user ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                My Tourist Tools
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/id"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    My Digital Tourist ID
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/verify"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    e-KYC Verification
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/consent"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Consent Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/sos"
                    className="text-red-700 hover:text-red-900 font-semibold transition-colors"
                  >
                    Emergency SOS
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2e2016]">
                Tourist Services
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/embassy"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Consular &amp; Embassy Access
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Hotel &amp; Telecom Verification
                  </Link>
                </li>
                <li>
                  <Link
                    href="/verify"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Authority QR Verifier
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:text-[#251a13] transition-colors"
                  >
                    Help &amp; Support FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth"
                    className="text-blue-700 hover:text-blue-900 font-semibold transition-colors"
                  >
                    Sign in / Register ID
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal & Government links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2e2016]">
              Official Indian Portals
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://indianvisaonline.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-[#251a13] transition-colors"
                >
                  <span>e-Visa India Portal</span>
                  <ArrowUpRight className="size-3 text-[#9e8b7c]" />
                </a>
              </li>
              <li>
                <a
                  href="https://tourism.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-[#251a13] transition-colors"
                >
                  <span>Ministry of Tourism</span>
                  <ArrowUpRight className="size-3 text-[#9e8b7c]" />
                </a>
              </li>
              <li>
                <a
                  href="https://boiprofile.gov.in/main"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-[#251a13] transition-colors"
                >
                  <span>Bureau of Immigration</span>
                  <ArrowUpRight className="size-3 text-[#9e8b7c]" />
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[#251a13] transition-colors"
                >
                  Data Privacy &amp; Protection
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-[#cfbeaa] pt-8 text-xs text-[#7c6654]">
          <p>
            © {new Date().getFullYear()} SafirPass. All rights reserved.
            Republic of India Smart Tourism Grid.
          </p>
          <p className="mt-2 md:mt-0">
            Zero PII stored on blockchain · Hardware device-bound crypto
            credentials
          </p>
        </div>
      </div>
    </footer>
  );
}
