"use client";

import { useEffect, useRef, useState } from "react";

export default function CopyButton({ value, labels }: { value: string; labels: { copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked — the key is on screen to select by hand.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-card border border-line px-3 py-1.5 font-mono text-xs font-semibold text-muted transition hover:border-muted hover:text-paper"
    >
      {copied ? labels.copied : labels.copy}
    </button>
  );
}
