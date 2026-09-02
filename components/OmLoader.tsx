"use client";

import React from "react";

interface OmLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export function OmLoader({
  message = "Loading Mahadev Seva...",
  subMessage = "🚩 हर हर महादेव 🚩",
  fullScreen = true,
}: OmLoaderProps) {
  return (
    <div
      className={`${
        fullScreen
          ? "fixed inset-0 z-50 min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100"
          : "w-full py-16"
      } flex flex-col items-center justify-center p-4`}
    >
      <style jsx>{`
        @keyframes omReveal {
          0% {
            opacity: 0.15;
            transform: scale(0.9);
            filter: drop-shadow(0 0 5px rgba(234, 88, 12, 0.2));
          }
          50% {
            opacity: 1;
            transform: scale(1.06);
            filter: drop-shadow(0 0 25px rgba(249, 115, 22, 0.85))
              drop-shadow(0 0 45px rgba(234, 88, 12, 0.4));
          }
          100% {
            opacity: 0.15;
            transform: scale(0.9);
            filter: drop-shadow(0 0 5px rgba(234, 88, 12, 0.2));
          }
        }

        @keyframes ringSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
          }
        }

        .om-animated {
          animation: omReveal 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .ring-animated {
          animation: ringSpin 12s linear infinite;
        }

        .glow-aura {
          animation: pulseGlow 2.2s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex items-center justify-center">
        {/* Glowing Aura backdrop */}
        <div className="glow-aura absolute h-44 w-44 rounded-full bg-gradient-to-tr from-orange-400/30 to-amber-300/40 blur-2xl" />

        {/* Outer rotating spiritual dashed ring */}
        <div className="ring-animated absolute h-36 w-36 rounded-full border-2 border-dashed border-orange-400/40" />

        {/* Middle subtle ring */}
        <div className="absolute h-28 w-28 rounded-full border border-orange-300/50" />

        {/* Base Transparent Om (Ghost silhouette) */}
        <div className="pointer-events-none select-none text-7xl font-bold text-orange-400/20 sm:text-8xl">
          🕉️
        </div>

        {/* Animated Om that transitions from transparent to full non-transparent */}
        <div className="om-animated absolute pointer-events-none select-none text-7xl sm:text-8xl">
          <span className="bg-gradient-to-t from-orange-700 via-orange-600 to-amber-500 bg-clip-text text-transparent">
            🕉️
          </span>
        </div>
      </div>

      {/* Loading message */}
      <div className="mt-8 text-center">
        <h2 className="text-base sm:text-lg font-semibold tracking-wide text-orange-900">
          {message}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium tracking-widest text-orange-700/80 animate-pulse">
          {subMessage}
        </p>
      </div>
    </div>
  );
}

