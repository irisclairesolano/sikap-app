import React, { createContext, useContext, useState, ReactNode } from 'react';
import CustomAlert, { AlertButton } from '../components/common/CustomAlert';

interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onRequestClose?: () => void;
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({ title: '' });

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setConfig({ title, message, buttons });
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={config.title}
        message={config.message}
        buttons={
          config.buttons?.map((btn) => ({
            ...btn,
            onPress: () => {
              hideAlert();
              if (btn.onPress) btn.onPress();
            },
          })) || [{ text: 'OK', onPress: hideAlert }]
        }
        onRequestClose={() => {
          hideAlert();
          if (config.onRequestClose) {
            config.onRequestClose();
          }
        }}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
