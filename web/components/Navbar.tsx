"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "./WalletProvider";
import { useTheme } from "./ThemeProvider";
import { LogoMark } from "./LogoMark";
import { shortAddress } from "@/lib/format";
import { config } from "@/lib/config";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "New invoice" },
  { href: "/history", label: "History" },
  { href: "/withdraw", label: "Withdraw" },
  { href: "/activity", label: "Activity" },
  { href: "/help", label: "Help" },
];

export function Navbar() {
  const {
    address,
    walletName,
    connecting,
    disconnect,
    error,
    clearError,
    openWalletPicker,
    wrongNetwork,
  } = useWallet();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function openTour() {
    window.dispatchEvent(new CustomEvent("payloop:open-tour"));
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">
            <LogoMark className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">PayLoop</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={openTour}
            title="How it works"
            aria-label="Open walkthrough"
            className="btn-ghost hidden h-9 w-9 px-0 text-sm font-bold sm:grid place-items-center"
          >
            ?
          </button>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
            className="btn-ghost h-9 w-9 px-0 text-base"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {address ? (
            <button
              onClick={() => void disconnect()}
              title={`${walletName} · click to disconnect`}
              className="btn-ghost font-mono text-xs"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wrongNetwork ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {shortAddress(address)}
            </button>
          ) : (
            <button
              onClick={openWalletPicker}
              disabled={connecting}
              className="btn-primary text-sm"
            >
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-ghost px-2.5 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 bg-ink-900/95 px-4 py-2 lg:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={openTour}
            className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            ? How it works
          </button>
        </nav>
      )}

      {/* Wallet state banners */}
      {wrongNetwork && (
        <div
          role="status"
          aria-live="polite"
          className="border-t border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100"
        >
          <div className="mx-auto max-w-5xl">
            Your wallet is on another Stellar network. Switch it to {config.network} before
            creating or paying an invoice.
          </div>
        </div>
      )}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="border-t border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-rose-300">Wallet error:</span>
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              aria-label="Dismiss error"
              className="rounded p-1 text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
