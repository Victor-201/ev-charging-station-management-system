import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import OAuthButtons from '../../../src/components/social/OAuthButtons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

// Mock native modules
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
  },
}));

jest.mock('react-native-fbsdk-next', () => ({
  LoginManager: {
    logOut: jest.fn(),
    logInWithPermissions: jest.fn(),
  },
  AccessToken: {
    getCurrentAccessToken: jest.fn(),
  },
  Settings: {
    setAdvertiserTrackingEnabled: jest.fn(),
    setAutoLogAppEventsEnabled: jest.fn(),
  },
}));

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('OAuthButtons Component', () => {
  let store;
  const onSuccess = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    store = mockStore({
      auth: { loading: false, error: null },
    });
    jest.clearAllMocks();
  });

  it('renders Google and Facebook buttons', () => {
    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons />
      </Provider>
    );
    expect(getByText('Đăng nhập với Google')).toBeTruthy();
    expect(getByText('Đăng nhập với Facebook')).toBeTruthy();
  });

  it('handles Google sign-in successfully', async () => {
    GoogleSignin.signIn.mockResolvedValue({ idToken: 'fake-google-token' });

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onSuccess={onSuccess} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Google'));

    await waitFor(() => {
      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/socialLogin/pending');
      expect(actions[0].meta.arg).toEqual({ provider: 'google', token: 'fake-google-token' });
    });
  });

  it('handles Google sign-in cancellation', async () => {
    GoogleSignin.signIn.mockRejectedValue({ code: '-5' }); // User cancelled

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onError={onError} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Google'));

    await waitFor(() => {
      expect(store.getActions()).toHaveLength(0); // No action dispatched
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it('handles Facebook login successfully', async () => {
    LoginManager.logInWithPermissions.mockResolvedValue({ isCancelled: false });
    AccessToken.getCurrentAccessToken.mockResolvedValue({ accessToken: 'fake-fb-token' });

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onSuccess={onSuccess} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Facebook'));

    await waitFor(() => {
      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/socialLogin/pending');
      expect(actions[0].meta.arg).toEqual({ provider: 'facebook', token: 'fake-fb-token' });
    });
  });

  it('handles Facebook login cancellation', async () => {
    LoginManager.logInWithPermissions.mockResolvedValue({ isCancelled: true });

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onError={onError} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Facebook'));

    await waitFor(() => {
      expect(store.getActions()).toHaveLength(0);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  it('shows alert on Google sign-in error', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    GoogleSignin.signIn.mockRejectedValue({ code: 'some-error' });

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onError={onError} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Google'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Lỗi Google Login', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
      expect(onError).toHaveBeenCalled();
    });
  });

  it('shows alert on Facebook login error', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    LoginManager.logInWithPermissions.mockRejectedValue(new Error('Some FB error'));

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons onError={onError} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng nhập với Facebook'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Lỗi Facebook Login', 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.');
      expect(onError).toHaveBeenCalled();
    });
  });

  it('disables buttons when loading', () => {
    store = mockStore({ auth: { loading: true } });

    const { getByText } = render(
      <Provider store={store}>
        <OAuthButtons />
      </Provider>
    );

    expect(getByText('Đăng nhập với Google').props.accessibilityState.disabled).toBe(true);
    expect(getByText('Đăng nhập với Facebook').props.accessibilityState.disabled).toBe(true);
  });
});
