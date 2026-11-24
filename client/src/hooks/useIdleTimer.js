import { useEffect, useRef, useCallback } from 'react';

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'touchstart', 'scroll', 'wheel', 'click',
];

/**
 * useIdleTimer
 * @param {object} options
 * @param {number}   options.idleMs        - ms of inactivity before logout  (default 10 min)
 * @param {number}   options.warningMs     - ms before logout to show warning (default 1 min)
 * @param {function} options.onWarning     - called when the warning countdown starts
 * @param {function} options.onIdle        - called when the idle timeout fires (logout)
 * @param {boolean}  options.enabled       - only run when user is authenticated
 */
export default function useIdleTimer({
  idleMs = 10 * 60 * 1000,
  warningMs = 60 * 1000,
  onWarning,
  onIdle,
  enabled = true,
}) {
  const idleTimerRef    = useRef(null);
  const warnTimerRef    = useRef(null);
  const warningFiredRef = useRef(false);

  const clearTimers = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warnTimerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    warningFiredRef.current = false;

    // Schedule warning
    warnTimerRef.current = setTimeout(() => {
      warningFiredRef.current = true;
      onWarning?.();
    }, idleMs - warningMs);

    // Schedule logout
    idleTimerRef.current = setTimeout(() => {
      onIdle?.();
    }, idleMs);
  }, [enabled, idleMs, warningMs, onWarning, onIdle, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    resetTimer();

    ACTIVITY_EVENTS.forEach(evt =>
      window.addEventListener(evt, resetTimer, { passive: true })
    );

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(evt =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, [enabled, resetTimer, clearTimers]);

  // Expose a manual reset (e.g. called when user clicks "Stay logged in")
  return { resetTimer };
}
