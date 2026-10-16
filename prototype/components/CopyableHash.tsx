"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Copy } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface CopyableHashProps {
  value: string;
  label?: string;
  truncateLength?: number;
  className?: string;
  monoClass?: string;
}

export const CopyableHash: React.FC<CopyableHashProps> = ({
  value,
  label,
  truncateLength = 12,
  className = "",
  monoClass = "text-xs text-stone-700 dark:text-stone-300",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayText =
    value.length > truncateLength * 2
      ? `${value.slice(0, truncateLength)}…${value.slice(-truncateLength / 2)}`
      : value;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 font-mono-num ${className}`}
      title={value}
    >
      {label && (
        <span className="text-[10px] uppercase font-semibold text-stone-500 dark:text-stone-400 select-none">
          {label}:
        </span>
      )}
      <span className={`tracking-tight ${monoClass}`}>{displayText}</span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar valor completo"
        className="p-1 -mr-0.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors focus:outline-none"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </span>
  );
};
