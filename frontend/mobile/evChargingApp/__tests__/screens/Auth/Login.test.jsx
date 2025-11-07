import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Login from '../../../src/screens/Auth/Login';
import * as authSlice from '../../../src/store/slices/authSlice';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  reset: jest.fn(),
};

// Mock useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Login Screen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        accessToken: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    });
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    expect(getByText('Đăng Nhập')).toBeTruthy();
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu của bạn')).toBeTruthy();
    expect(getByText('Đăng nhập')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    const loginButton = getByText('Đăng nhập');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(getByText('Email là bắt buộc')).toBeTruthy();
      expect(getByText('Mật khẩu là bắt buộc')).toBeTruthy();
    });
  });

  it('enables login button when form is valid', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu của bạn'), 'password123');

    await waitFor(() => {
      const loginButton = getByText('Đăng nhập');
      expect(loginButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('calls doLogin on submit with correct data', async () => {
    const loginAction = jest.spyOn(authSlice, 'login').mockReturnValue({ type: 'auth/login/fulfilled' });

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    const email = 'test@example.com';
    const password = 'password123';

    fireEvent.changeText(getByPlaceholderText('example@email.com'), email);
    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu của bạn'), password);

    const loginButton = getByText('Đăng nhập');
    fireEvent.press(loginButton);

    await waitFor(() => {
      const dispatchedActions = store.getActions();
      expect(dispatchedActions).toContainEqual(expect.objectContaining({ type: 'auth/login/pending' }));
    });
  });

  it('displays error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    store = mockStore({
      auth: {
        loading: false,
        error: errorMessage,
      },
    });

    const { findByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });

  it('navigates to ForgotPassword screen', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    fireEvent.press(getByText('Quên mật khẩu?'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('navigates to Register screen', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    fireEvent.press(getByText('Đăng ký'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });
});
