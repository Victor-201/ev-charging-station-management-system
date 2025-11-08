import React, { useEffect } from 'react';
import { Provider as ReduxProvider, useSelector } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigation from './src/navigation';
import store from './src/store/store';
import { theme } from './src/config/theme';
import notificationService from './src/services/notificationService';

const Root = () => {
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const setupNotifications = async () => {
      if (isAuthenticated) {
        const permissionGranted = await notificationService.requestUserPermission();
        if (permissionGranted) {
          const fcmToken = await notificationService.getFCMToken();
          if (fcmToken) {
            await notificationService.registerFCMToken(fcmToken);
          }
          notificationService.listenForMessages();
        }
      }
    };

    setupNotifications();
  }, [isAuthenticated]);

  return <AppNavigation />;
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={theme}>
        <Root />
      </PaperProvider>
    </ReduxProvider>
  );
}
