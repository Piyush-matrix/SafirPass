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
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      {/* Helpline strip */}
      <div className="border-b border-slate-800 bg-slate-950 py-4">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-white">
              24×7 Official Tourist Assistance &amp; Safety Grid
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:1363"
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <PhoneCall className="size-3.5 text-amber-400" />
              <span>Tourist Helpline: 1363 / 1800-11-1363</span>
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <PhoneCall className="size-3.5 text-red-400" />
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
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                SafirPass
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              The AI-Powered Smart Tourist Identity, Safety &amp; Incident
              Response System. Privacy-first e-KYC, rotating cryptographic QR
              credentials, and automated 112 emergency dispatch.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 border border-slate-700">
                <Lock className="size-3 text-blue-400" /> GDPR &amp; DPDP
                Compliant
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 border border-slate-700">
                <Globe className="size-3 text-emerald-400" /> Ministry of
                Tourism Partner
              </span>
            </div>
          </div>

          {/* Platform Features Column (Always accessible to showcase features) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform Features
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-white transition-colors"
                >
                  Tourist Services
                </Link>
              </li>
              <li>
                <Link
                  href="/safety"
                  className="hover:text-white transition-colors"
                >
                  Safety Grid &amp; SOS
                </Link>
              </li>
              <li>
                <Link
                  href="/technology"
                  className="hover:text-white transition-colors"
                >
                  Security &amp; Cryptography
                </Link>
              </li>
              <li>
                <Link
                  href="/authorities"
                  className="hover:text-white transition-colors"
                >
                  Authority Command Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About SafirPass
                </Link>
              </li>
            </ul>
          </div>

          {/* User Tools (When Logged in) OR Public Services & Portal Access (Before Login) */}
          {user ? (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                My Tourist Tools
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-white transition-colors"
                  >
                    Dashboard Overview
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/id"
                    className="hover:text-white transition-colors"
                  >
                    My Digital Tourist ID
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/verify"
                    className="hover:text-white transition-colors"
                  >
                    e-KYC Verification
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/consent"
                    className="hover:text-white transition-colors"
                  >
                    Consent Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/sos"
                    className="hover:text-white text-red-400 font-semibold transition-colors"
                  >
                    Emergency SOS
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Tourist Services
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/embassy"
                    className="hover:text-white transition-colors"
                  >
                    Consular &amp; Embassy Access
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="hover:text-white transition-colors"
                  >
                    Hotel &amp; Telecom Verification
                  </Link>
                </li>
                <li>
                  <Link
                    href="/verify"
                    className="hover:text-white transition-colors"
                  >
                    Authority QR Verifier
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help &amp; Support FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Sign in / Register ID
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Legal & Government links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Official Indian Portals
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://indianvisaonline.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>e-Visa India Portal</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://tourism.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Ministry of Tourism</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://boiprofile.gov.in/main"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>Bureau of Immigration</span>
                  <ArrowUpRight className="size-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Data Privacy &amp; Protection
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-slate-800 pt-8 text-xs text-slate-500">
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
