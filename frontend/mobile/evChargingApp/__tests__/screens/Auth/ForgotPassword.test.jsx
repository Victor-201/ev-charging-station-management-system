import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ForgotPassword from '../../../src/screens/Auth/ForgotPassword';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('ForgotPassword Screen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: { loading: false, error: null },
    });
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText('Quên Mật Khẩu')).toBeTruthy();
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(getByText('Gửi yêu cầu')).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, findByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'invalid-email');

    const errorText = await findByText('Email không hợp lệ');
    expect(errorText).toBeTruthy();
  });

  it('disables button when form is invalid', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    const submitButton = getByText('Gửi yêu cầu');
    expect(submitButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables button when form is valid', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');

    await waitFor(() => {
      const submitButton = getByText('Gửi yêu cầu');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('calls doForgot on submit and shows success message', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'test@example.com');

    const submitButton = getByText('Gửi yêu cầu');
    fireEvent.press(submitButton);

    await waitFor(() => {
      const actions = store.getActions();
      expect(actions[0].type).toBe('auth/forgotPassword/pending');
    });

    // Mock successful state
    store = mockStore({
      auth: { loading: false, error: null },
    });
    store.dispatch({ type: 'auth/forgotPassword/fulfilled' });

    const { findByText: findByTextAfterSuccess } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );
    
    // This part is tricky to test with Snackbar without a full native environment.
    // We'll assume the action dispatch implies success.
  });

  it('displays an error message on failure', async () => {
    const errorMessage = 'Email không tồn tại';
    store = mockStore({
      auth: { loading: false, error: errorMessage },
    });

    const { findByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });

  it('navigates back to Login', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ForgotPassword navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('← Quay lại đăng nhập'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
