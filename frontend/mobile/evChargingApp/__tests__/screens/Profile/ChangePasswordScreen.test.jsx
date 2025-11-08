import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ChangePasswordScreen from '../../../src/screens/Profile/ChangePasswordScreen';
import profileService from '../../../src/services/profileService';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock profileService
jest.mock('../../../src/services/profileService');

describe('ChangePasswordScreen', () => {
  let store;
  const mockProfile = { id: '1' };

  beforeEach(() => {
    store = mockStore({
      user: { profile: mockProfile },
    });
    profileService.changePassword.mockResolvedValue({});
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByLabelText('Mật khẩu hiện tại *')).toBeTruthy();
    expect(getByLabelText('Mật khẩu mới *')).toBeTruthy();
    expect(getByLabelText('Xác nhận mật khẩu mới *')).toBeTruthy();
    expect(getByText('Lưu thay đổi')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Lưu thay đổi'));

    await waitFor(() => {
      expect(getByText('Mật khẩu hiện tại là bắt buộc')).toBeTruthy();
    });
  });

  it('shows validation error for weak new password', async () => {
    const { getByLabelText, findByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Mật khẩu mới *'), 'weak');

    const errorText = await findByText('Mật khẩu ít nhất 6 ký tự');
    expect(errorText).toBeTruthy();
  });

  it('shows validation error for mismatched new passwords', async () => {
    const { getByLabelText, findByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Mật khẩu mới *'), 'NewPassword123');
    fireEvent.changeText(getByLabelText('Xác nhận mật khẩu mới *'), 'Different123');

    const errorText = await findByText('Mật khẩu mới không khớp');
    expect(errorText).toBeTruthy();
  });

  it('enables button when form is valid and dirty', async () => {
    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Mật khẩu hiện tại *'), 'OldPassword123');
    fireEvent.changeText(getByLabelText('Mật khẩu mới *'), 'NewPassword123');
    fireEvent.changeText(getByLabelText('Xác nhận mật khẩu mới *'), 'NewPassword123');

    await waitFor(() => {
      const saveButton = getByText('Lưu thay đổi');
      expect(saveButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('calls changePassword and navigates back on success', async () => {
    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Mật khẩu hiện tại *'), 'OldPassword123');
    fireEvent.changeText(getByLabelText('Mật khẩu mới *'), 'NewPassword123');
    fireEvent.changeText(getByLabelText('Xác nhận mật khẩu mới *'), 'NewPassword123');

    fireEvent.press(getByText('Lưu thay đổi'));

    await waitFor(() => {
      expect(profileService.changePassword).toHaveBeenCalledWith(mockProfile.id, {
        current_password: 'OldPassword123',
        new_password: 'NewPassword123',
      });
    });

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    }, { timeout: 1600 });
  });

  it('displays an error message on failure', async () => {
    const errorMessage = 'Mật khẩu hiện tại không đúng.';
    profileService.changePassword.mockRejectedValue({ 
      response: { data: { message: errorMessage } } 
    });

    const { getByLabelText, getByText, findByText } = render(
      <Provider store={store}>
        <ChangePasswordScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Mật khẩu hiện tại *'), 'WrongPassword');
    fireEvent.changeText(getByLabelText('Mật khẩu mới *'), 'NewPassword123');
    fireEvent.changeText(getByLabelText('Xác nhận mật khẩu mới *'), 'NewPassword123');

    fireEvent.press(getByText('Lưu thay đổi'));

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });
});
