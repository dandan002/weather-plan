import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ text, children, className, style }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button onClick={handleCopy} className={className} style={style} type="button">
      {copied ? (
        <>
          <Check size={14} />
          {children ? 'Copied!' : <Check size={14} />}
        </>
      ) : (
        <>
          <Copy size={14} />
          {children}
        </>
      )}
    </button>
  );
}
