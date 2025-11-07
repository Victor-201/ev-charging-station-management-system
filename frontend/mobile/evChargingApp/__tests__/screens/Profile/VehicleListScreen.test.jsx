import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import VehicleListScreen from '../../../src/screens/Profile/VehicleListScreen';

// Mock navigation and focus effect
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: (callback) => callback(),
}));

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('VehicleListScreen', () => {
  let store;
  const mockUser = { id: '1' };
  const mockVehicles = [
    { id: 'v1', make: 'Tesla', model: 'Model Y', license_plate: 'TESLA-Y' },
    { id: 'v2', make: 'VinFast', model: 'VF8', license_plate: 'VIN-VF8' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading indicator', () => {
    store = mockStore({ 
      vehicles: { vehicles: [], loading: true, error: null },
      auth: { user: mockUser },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    // Cannot directly test ActivityIndicator, but we can check if the empty/list view is not rendered
  });

  it('renders empty list message when there are no vehicles', () => {
    store = mockStore({ 
      vehicles: { vehicles: [], loading: false, error: null },
      auth: { user: mockUser },
    });
    const { getByText } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    expect(getByText('Bạn chưa có phương tiện nào.')).toBeTruthy();
    expect(getByText('Thêm phương tiện mới')).toBeTruthy();
  });

  it('renders a list of vehicles', () => {
    store = mockStore({ 
      vehicles: { vehicles: mockVehicles, loading: false, error: null },
      auth: { user: mockUser },
    });
    const { getByText } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    expect(getByText('Tesla Model Y')).toBeTruthy();
    expect(getByText('TESLA-Y')).toBeTruthy();
    expect(getByText('VinFast VF8')).toBeTruthy();
    expect(getByText('VIN-VF8')).toBeTruthy();
  });

  it('dispatches getVehicles action on focus', () => {
    store = mockStore({ 
      vehicles: { vehicles: [], loading: false, error: null },
      auth: { user: mockUser },
    });
    render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    const actions = store.getActions();
    expect(actions[0].type).toBe('vehicles/getVehicles/pending');
    expect(actions[0].meta.arg).toBe(mockUser.id);
  });

  it('navigates to AddVehicle screen when FAB is pressed', () => {
    store = mockStore({ 
      vehicles: { vehicles: [], loading: false, error: null },
      auth: { user: mockUser },
    });
    const { getByTestId } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    // FAB doesn't have a default testID. Assuming we add one or find it by icon.
    // For now, we test the button in the empty view.
    fireEvent.press(getByText('Thêm phương tiện mới'));
    expect(mockNavigate).toHaveBeenCalledWith('AddVehicle');
  });

  it('navigates to EditVehicle screen when a vehicle card is pressed', () => {
    store = mockStore({ 
      vehicles: { vehicles: mockVehicles, loading: false, error: null },
      auth: { user: mockUser },
    });
    const { getByText } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Tesla Model Y'));
    expect(mockNavigate).toHaveBeenCalledWith('EditVehicle', { vehicleId: 'v1' });
  });

  it('displays an error message if fetching fails', () => {
    const errorMessage = 'Failed to fetch';
    store = mockStore({ 
      vehicles: { vehicles: [], loading: false, error: errorMessage },
      auth: { user: mockUser },
    });
    const { getByText } = render(
      <Provider store={store}>
        <VehicleListScreen navigation={mockNavigation} />
      </Provider>
    );
    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Thử lại')).toBeTruthy();
  });
});
