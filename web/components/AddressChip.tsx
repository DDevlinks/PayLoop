"use client";

import { useEffect, useRef, useState } from "react";
import { explorer } from "@/lib/config";
import { shortAddress } from "@/lib/format";

// A Stellar address that is short by default but can be checked in full before
// signing (issue #71):
//  - the address itself is a button that expands/collapses the full value
//    (`aria-expanded`); screen readers always get the full address, because the
//    visible shortened text is hidden from them and the full value is read instead;
//  - a copy button with visible ("Copied ✓") and announced (live region) feedback;
//  - a link to the account on the explorer, opening in a new tab.
// Every control is a native <button>/<a>, so it is keyboard reachable and
// operable with Enter/Space without extra key handling.

export function AddressChip({
  address,
  className = "",
}: {
  address: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  if (!address) return null;

  async function copy() {
    let next: "copied" | "failed" = "copied";
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Clipboard blocked (e.g. an insecure context): say so instead of failing silently.
      next = "failed";
    }
    setStatus(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        title={expanded ? "Show short address" : "Show full address"}
        className={`rounded font-mono text-xs underline decoration-dotted underline-offset-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          expanded ? "break-all text-left" : ""
        }`}
      >
        <span aria-hidden="true">{expanded ? address : shortAddress(address)}</span>
        <span className="sr-only">{address}</span>
      </button>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy address ${shortAddress(address)}`}
        title="Copy address"
        className="rounded px-1 text-xs text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {status === "copied" ? "Copied ✓" : status === "failed" ? "Copy failed" : "Copy"}
      </button>
      <a
        href={explorer.account(address)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${shortAddress(address)} on the explorer (opens in a new tab)`}
        title="View on explorer"
        className="rounded px-1 text-xs text-brand-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        <span aria-hidden="true">↗</span>
      </a>
      <span role="status" aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Address copied to clipboard"
          : status === "failed"
            ? "Could not copy the address"
            : ""}
      </span>
    </span>
  );
}
