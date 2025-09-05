import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerNotificationRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <NotificationContext.Provider value={{ 
      refreshTrigger, 
      triggerNotificationRefresh 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
