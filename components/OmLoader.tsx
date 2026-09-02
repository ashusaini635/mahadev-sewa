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
        @keyframes omFill {
          0% {
            clip-path: inset(100% 0 0 0);
            filter: drop-shadow(0 0 2px rgba(234, 88, 12, 0.3));
          }
          60% {
            clip-path: inset(0% 0 0 0);
            filter: drop-shadow(0 0 16px rgba(234, 88, 12, 0.8))
              drop-shadow(0 0 30px rgba(249, 115, 22, 0.6));
          }
          88% {
            clip-path: inset(0% 0 0 0);
            filter: drop-shadow(0 0 25px rgba(249, 115, 22, 0.95))
              drop-shadow(0 0 40px rgba(234, 88, 12, 0.7));
          }
          100% {
            clip-path: inset(100% 0 0 0);
            filter: drop-shadow(0 0 2px rgba(234, 88, 12, 0.3));
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
            transform: scale(0.9);
          }
          50% {
            opacity: 0.65;
            transform: scale(1.1);
          }
        }

        .om-fill-animated {
          animation: omFill 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .ring-animated {
          animation: ringSpin 12s linear infinite;
        }

        .glow-aura {
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
      `}</style>

      <div className="relative flex items-center justify-center">
        {/* Glowing Aura backdrop */}
        <div className="glow-aura absolute h-44 w-44 rounded-full bg-gradient-to-tr from-orange-400/30 to-amber-300/40 blur-2xl" />

        {/* Outer rotating spiritual dashed ring */}
        <div className="ring-animated absolute h-36 w-36 rounded-full border-2 border-dashed border-orange-400/40" />

        {/* Middle subtle ring */}
        <div className="absolute h-28 w-28 rounded-full border border-orange-300/50" />

        {/* Base Om — clearly visible at all times */}
        <div className="pointer-events-none select-none text-7xl opacity-35 sm:text-8xl">
          🕉️
        </div>

        {/* Filled Om — fills up from bottom to top until complete and radiant */}
        <div className="om-fill-animated absolute inset-0 pointer-events-none select-none flex items-center justify-center text-7xl sm:text-8xl">
          🕉️
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
