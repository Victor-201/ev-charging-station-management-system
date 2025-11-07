import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Register from '../../../src/screens/Auth/Register';
import * as authService from '../../../src/services/authService';

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {},
};

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock authService
jest.mock('../../../src/services/authService');

describe('Register Screen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: null,
        accessToken: null,
        refreshToken: null,
        loading: false,
        error: null,
      },
    });
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    expect(getByText('Tạo Tài Khoản')).toBeTruthy();
    expect(getByPlaceholderText('Nhập họ và tên của bạn')).toBeTruthy();
    expect(getByPlaceholderText('example@email.com')).toBeTruthy();
    expect(getByPlaceholderText('0123456789')).toBeTruthy();
    expect(getByText('Đăng ký')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const registerButton = getByText('Đăng ký');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(getByText('Họ tên là bắt buộc')).toBeTruthy();
      expect(getByText('Email là bắt buộc')).toBeTruthy();
      expect(getByText('Mật khẩu là bắt buộc')).toBeTruthy();
    });
  });

  it('shows validation error for invalid email', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const emailInput = getByPlaceholderText('example@email.com');
    fireEvent.changeText(emailInput, 'invalid-email');

    const errorText = await findByText('Email không hợp lệ');
    expect(errorText).toBeTruthy();
  });

  it('shows validation error for weak password', async () => {
    const { getByPlaceholderText, findByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const passwordInput = getByPlaceholderText('Tối thiểu 6 ký tự');
    fireEvent.changeText(passwordInput, '12345');

    const errorText = await findByText('Mật khẩu ít nhất 6 ký tự');
    expect(errorText).toBeTruthy();
  });

  it('shows validation error when passwords do not match', async () => {
    const { getByPlaceholderText, findByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const passwordInput = getByPlaceholderText('Tối thiểu 6 ký tự');
    const confirmPasswordInput = getByPlaceholderText('Nhập lại mật khẩu');

    fireEvent.changeText(passwordInput, 'Password123');
    fireEvent.changeText(confirmPasswordInput, 'Password456');

    const errorText = await findByText('Mật khẩu không khớp');
    expect(errorText).toBeTruthy();
  });

  it('shows validation error for invalid phone number', async () => {
    const { getByPlaceholderText, findByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const phoneInput = getByPlaceholderText('0123456789');
    fireEvent.changeText(phoneInput, '123'); // Too short

    const errorText = await findByText(/Số điện thoại không hợp lệ/);
    expect(errorText).toBeTruthy();
  });

  it('successfully registers with valid data', async () => {
    authService.default.register = jest.fn().mockResolvedValue({
      data: {
        message: 'Registration successful',
        user_id: '123',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên của bạn'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('0123456789'), '0123456789');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 6 ký tự'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    // Submit form
    const registerButton = getByText('Đăng ký');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(authService.default.register).toHaveBeenCalledWith({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0123456789',
        password: 'Password123',
      });
    });
  });

  it('displays error message on registration failure', async () => {
    const errorMessage = 'Email already exists';
    authService.default.register = jest.fn().mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Fill in the form
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên của bạn'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 6 ký tự'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    // Submit form
    const registerButton = getByText('Đăng ký');
    fireEvent.press(registerButton);

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });

  it('navigates to VerifyEmail screen on successful registration', async () => {
    authService.default.register = jest.fn().mockResolvedValue({
      data: {
        message: 'Registration successful',
      },
    });

    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Fill in the form
    const email = 'john@example.com';
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên của bạn'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('example@email.com'), email);
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 6 ký tự'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    // Submit form
    const registerButton = getByText('Đăng ký');
    fireEvent.press(registerButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('VerifyEmail', { email });
    }, { timeout: 3000 });
  });

  it('navigates to Login screen when clicking login link', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const loginLink = getByText('Đăng nhập');
    fireEvent.press(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  it('disables register button when form is invalid', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const registerButton = getByText('Đăng ký');
    expect(registerButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables register button when form is valid', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <Register navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    // Fill in valid data
    fireEvent.changeText(getByPlaceholderText('Nhập họ và tên của bạn'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('example@email.com'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Tối thiểu 6 ký tự'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu'), 'Password123');

    await waitFor(() => {
      const registerButton = getByText('Đăng ký');
      expect(registerButton.props.accessibilityState.disabled).toBe(false);
    });
  });
});

