"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { DQ_BOX } from "@/lib/style-tokens";

const TYPE_INTERVAL_MS = 40;

function TypewriterText({
  message,
  shouldReduceMotion,
}: {
  message: string;
  shouldReduceMotion: boolean;
}) {
  const [visibleLength, setVisibleLength] = useState(shouldReduceMotion ? message.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = window.setInterval(() => {
      setVisibleLength((len) => {
        if (len >= message.length) {
          window.clearInterval(id);
          return len;
        }
        return len + 1;
      });
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [message, shouldReduceMotion]);

  const isTyping = visibleLength < message.length;

  return (
    <p className="min-h-[3em] leading-relaxed">
      {message.slice(0, visibleLength)}
      {isTyping && <span className="animate-pulse">{"█"}</span>}
    </p>
  );
}

export function MessageWindow({ message }: { message: string }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={`${DQ_BOX} flex min-h-[140px] flex-col justify-between p-4 text-white`}
      aria-live="polite"
    >
      <div className="mb-1 text-xs text-gray-400">{"▼ メッセージ"}</div>
      <TypewriterText key={message} message={message} shouldReduceMotion={shouldReduceMotion} />
      <div className="text-right text-xs text-gray-400 motion-safe:animate-pulse">{"▼"}</div>
    </div>
  );
}
