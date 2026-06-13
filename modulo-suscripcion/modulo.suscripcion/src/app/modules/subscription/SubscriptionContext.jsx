import React, { createContext, useContext, useState, useEffect } from "react";

const SubscriptionContext = createContext(undefined);

export function SubscriptionProvider({ children }) {
  const [deadline, setDeadlineState] = useState(() => {
    return localStorage.getItem("subscription_deadline");
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("userRole");
  });

  const [isWarningPhase, setIsWarningPhase] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const setDeadline = (date) => {
    localStorage.setItem("subscription_deadline", date);
    setDeadlineState(date);
  };

  const clearDeadline = () => {
    localStorage.removeItem("subscription_deadline");
    setDeadlineState(null);
  };

  // Sync role to localStorage whenever it changes via context
  useEffect(() => {
    if (userRole) {
      localStorage.setItem("userRole", userRole);
    } else {
      localStorage.removeItem("userRole");
    }
  }, [userRole]);

  useEffect(() => {
    const checkSubscription = () => {
      if (!deadline) {
        setIsWarningPhase(false);
        setIsExpired(false);
        return;
      }

      const now = new Date();
      const cutoffDayNum = parseInt(deadline, 10);

      if (!isNaN(cutoffDayNum) && cutoffDayNum >= 1 && cutoffDayNum <= 31 && deadline.length <= 2) {
        // Monthly recurring logic
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const actualCutoffDay = Math.min(cutoffDayNum, daysInMonth);

        if (currentDay > actualCutoffDay) {
          setIsExpired(true);
          setIsWarningPhase(false);
        } else if (actualCutoffDay - currentDay <= 5) {
          setIsExpired(false);
          setIsWarningPhase(true);
        } else {
          setIsExpired(false);
          setIsWarningPhase(false);
        }
      } else {
        // Fallback for absolute date (ISO string)
        const deadlineDate = new Date(deadline);
        const diffMs = deadlineDate.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffMs <= 0) {
          setIsExpired(true);
          setIsWarningPhase(false);
        } else if (diffDays <= 5) {
          setIsExpired(false);
          setIsWarningPhase(true);
        } else {
          setIsExpired(false);
          setIsWarningPhase(false);
        }
      }
    };

    checkSubscription();
    // Check every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <SubscriptionContext.Provider
      value={{
        deadline,
        setDeadline,
        clearDeadline,
        isWarningPhase,
        isExpired,
        userRole,
        setUserRole,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}