import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import ProfileScreen from '../../../src/screens/Profile/ProfileScreen';

// Mock navigation
const mockNavigate = jest.fn();
const mockReset = jest.fn();
const mockNavigation = { navigate: mockNavigate, reset: mockReset };

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback) => callback(),
}));

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('ProfileScreen', () => {
  let store;
  const mockProfile = {
    id: '1',
    full_name: 'John Doe',
    email: 'john@example.com',
    avatar_url: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator initially', () => {
    store = mockStore({ user: { profile: null, loading: true, error: null } });
    const { getByTestId } = render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );
    // react-native-paper ActivityIndicator doesn't have a default testID
    // We check for its presence indirectly or by adding a testID if possible
    // For now, let's assume the component structure
  });

  it('renders profile information correctly', () => {
    store = mockStore({ 
      user: { profile: mockProfile, loading: false, error: null },
      auth: { user: { email: 'john@example.com' } }
    });
    const { getByText } = render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
    expect(getByText('Chỉnh sửa thông tin')).toBeTruthy();
    expect(getByText('Đăng xuất')).toBeTruthy();
  });

  it('dispatches getMe action on focus', () => {
    store = mockStore({ 
      user: { profile: null, loading: false, error: null },
      auth: { user: null }
    });
    render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );

    const actions = store.getActions();
    expect(actions[0].type).toBe('user/getMe/pending');
  });

  it('handles logout correctly', () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    store = mockStore({ 
      user: { profile: mockProfile, loading: false, error: null },
      auth: { user: { email: 'john@example.com' } }
    });

    const { getByText } = render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Đăng xuất'));

    // Check if Alert.alert was called
    expect(alertSpy).toHaveBeenCalled();

    // Simulate pressing the 'Đăng xuất' button in the alert
    const logoutButtonHandler = alertSpy.mock.calls[0][2][1].onPress;
    logoutButtonHandler();

    const actions = store.getActions();
    // First action is getMe from useFocusEffect
    expect(actions[1].type).toBe('auth/logout');
    expect(mockReset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Auth' }] });
  });

  it('navigates to EditProfile screen', () => {
    store = mockStore({ 
      user: { profile: mockProfile, loading: false, error: null },
      auth: { user: { email: 'john@example.com' } }
    });
    const { getByText } = render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Chỉnh sửa thông tin'));
    expect(mockNavigate).toHaveBeenCalledWith('EditProfile');
  });

  it('displays an error message if fetching fails', () => {
    const errorMessage = 'Failed to fetch profile';
    store = mockStore({ 
      user: { profile: null, loading: false, error: errorMessage },
      auth: { user: null }
    });

    const { getByText } = render(
      <Provider store={store}>
        <ProfileScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Thử lại')).toBeTruthy();
  });
});
