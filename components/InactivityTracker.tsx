"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function InactivityTracker() {
  const { data: session } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!session) return;

    function handleLogout() {
      signOut({ callbackUrl: "/login?reason=timeout" });
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
    }

    // Start inactivity countdown
    resetTimer();

    // User activity events that reset the timer
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    let lastActive = Date.now();
    const onUserActivity = () => {
      const now = Date.now();
      // Throttle event updates to at most once per 2 seconds
      if (now - lastActive > 2000) {
        lastActive = now;
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, onUserActivity, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, onUserActivity));
    };
  }, [session]);

  return null;
}

