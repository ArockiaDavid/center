import { useState, useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME = 60 * 1000; // 1 minute before logout
const CHECK_INTERVAL = 1000; // Check every second

const useAutoLogout = (onLogout) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_TIME / 1000);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  const onStayLoggedIn = useCallback(() => {
    resetTimer();
    setShowWarning(false);
  }, [resetTimer]);

  useEffect(() => {
    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click'
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Timer to check for inactivity
    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (timeSinceLastActivity >= IDLE_TIMEOUT) {
        // Time to logout
        clearInterval(interval);
        onLogout();
      } else if (timeSinceLastActivity >= IDLE_TIMEOUT - WARNING_TIME) {
        // Show warning
        setShowWarning(true);
        const timeLeft = Math.ceil((IDLE_TIMEOUT - timeSinceLastActivity) / 1000);
        setRemainingTime(timeLeft);
      }
    }, CHECK_INTERVAL);

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [lastActivity, onLogout, resetTimer]);

  // Reset timer on mount
  useEffect(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    showWarning,
    remainingTime,
    onStayLoggedIn
  };
};

export default useAutoLogout;
