import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import ToastBanner, { ToastConfig } from '../components/common/ToastBanner';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';

interface ToastContextType {
  showToast: (config: ToastConfig | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);

  const showToast = useCallback((config: ToastConfig | string) => {
    if (typeof config === 'string') {
      setCurrentToast({
        id: String(Date.now()),
        message: sanitizeErrorMessage(config),
        type: 'info',
      });
    } else {
      setCurrentToast({
        ...config,
        id: String(Date.now()),
        message: sanitizeErrorMessage(config.message),
      });
    }
  }, []);

  const hideToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastBanner toast={currentToast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
