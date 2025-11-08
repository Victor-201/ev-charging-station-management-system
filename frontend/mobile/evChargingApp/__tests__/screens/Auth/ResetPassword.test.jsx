import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ResetPassword from '../../../src/screens/Auth/ResetPassword';
import authService from '../../../src/services/authService';

// Mock navigation and route
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };
const mockRoute = { params: { token: 'test-token' } };

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock authService
jest.mock('../../../src/services/authService');

describe('ResetPassword Screen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: { loading: false, error: null },
    });
    authService.resetPassword = jest.fn().mockResolvedValue({});
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    expect(getByText('Đặt Lại Mật Khẩu')).toBeTruthy();
    expect(getByPlaceholderText('Nhập mật khẩu mới')).toBeTruthy();
    expect(getByPlaceholderText('Nhập lại mật khẩu mới')).toBeTruthy();
    expect(getByText('Đặt lại mật khẩu')).toBeTruthy();
  });

  it('shows an error if no token is provided', async () => {
    const { findByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={{ params: {} }} />
      </Provider>
    );

    const errorText = await findByText('Không tìm thấy mã đặt lại mật khẩu. Vui lòng thử lại từ email của bạn.');
    expect(errorText).toBeTruthy();
  });

  it('shows validation error for mismatched passwords', async () => {
    const { getByPlaceholderText, findByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu mới'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu mới'), 'Password456');

    const errorText = await findByText('Mật khẩu không khớp');
    expect(errorText).toBeTruthy();
  });

  it('enables button when form is valid', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu mới'), 'NewPassword123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu mới'), 'NewPassword123');

    await waitFor(() => {
      const submitButton = getByText('Đặt lại mật khẩu');
      expect(submitButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('calls resetPassword on submit and navigates to Login', async () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu mới'), 'NewPassword123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu mới'), 'NewPassword123');

    const submitButton = getByText('Đặt lại mật khẩu');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith({ 
        token: 'test-token', 
        password: 'NewPassword123' 
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    }, { timeout: 2100 }); // Wait for setTimeout in component
  });

  it('shows an error message on failure', async () => {
    const errorMessage = 'Mã đặt lại không hợp lệ hoặc đã hết hạn.';
    authService.resetPassword.mockRejectedValue({ 
      response: { data: { message: errorMessage } } 
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByPlaceholderText('Nhập mật khẩu mới'), 'NewPassword123');
    fireEvent.changeText(getByPlaceholderText('Nhập lại mật khẩu mới'), 'NewPassword123');

    fireEvent.press(getByText('Đặt lại mật khẩu'));

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });

  it('navigates back to Login', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ResetPassword navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.press(getByText('← Quay lại đăng nhập'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
