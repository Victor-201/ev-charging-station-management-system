import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AddVehicleScreen from '../../../src/screens/Profile/AddVehicleScreen';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('AddVehicleScreen', () => {
  let store;
  const mockUser = { id: '1' };

  beforeEach(() => {
    store = mockStore({
      auth: { user: mockUser },
      vehicles: { loading: false, error: null },
    });
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <AddVehicleScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByLabelText('Hãng xe *')).toBeTruthy();
    expect(getByLabelText('Mẫu xe *')).toBeTruthy();
    expect(getByLabelText('Năm sản xuất *')).toBeTruthy();
    expect(getByLabelText('Biển số xe *')).toBeTruthy();
    expect(getByLabelText('Dung lượng pin (kWh) *')).toBeTruthy();
    expect(getByLabelText('Loại cổng sạc *')).toBeTruthy();
    expect(getByText('Thêm phương tiện')).toBeTruthy();
  });

  it('shows validation errors for required fields', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <AddVehicleScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.press(getByText('Thêm phương tiện'));

    await waitFor(() => {
      expect(getByText('Hãng xe là bắt buộc')).toBeTruthy();
      expect(getByText('Mẫu xe là bắt buộc')).toBeTruthy();
      // Add other required field checks here
    });
  });

  it('enables button when form is valid', async () => {
    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <AddVehicleScreen navigation={mockNavigation} />
      </Provider>
    );

    fireEvent.changeText(getByLabelText('Hãng xe *'), 'Tesla');
    fireEvent.changeText(getByLabelText('Mẫu xe *'), 'Model Y');
    fireEvent.changeText(getByLabelText('Năm sản xuất *'), '2023');
    fireEvent.changeText(getByLabelText('Biển số xe *'), 'TESLA-Y');
    fireEvent.changeText(getByLabelText('Dung lượng pin (kWh) *'), '75');
    fireEvent.changeText(getByLabelText('Loại cổng sạc *'), 'Type 2');

    await waitFor(() => {
      const addButton = getByText('Thêm phương tiện');
      expect(addButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('dispatches addVehicle and navigates back on success', async () => {
    const vehicleData = {
      make: 'Tesla',
      model: 'Model Y',
      year: '2023',
      license_plate: 'TESLA-Y',
      battery_capacity: '75',
      connector_type: 'Type 2',
    };

    const { getByLabelText, getByText } = render(
      <Provider store={store}>
        <AddVehicleScreen navigation={mockNavigation} />
      </Provider>
    );

    // Fill form
    Object.keys(vehicleData).forEach(key => {
      const label = {
        make: 'Hãng xe *',
        model: 'Mẫu xe *',
        year: 'Năm sản xuất *',
        license_plate: 'Biển số xe *',
        battery_capacity: 'Dung lượng pin (kWh) *',
        connector_type: 'Loại cổng sạc *',
      }[key];
      fireEvent.changeText(getByLabelText(label), vehicleData[key]);
    });

    // Mock successful action
    store.dispatch = jest.fn().mockResolvedValue({ type: 'vehicles/addVehicle/fulfilled' });

    fireEvent.press(getByText('Thêm phương tiện'));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalled();
      const dispatchedAction = store.dispatch.mock.calls[0][0];
      expect(dispatchedAction.type).toBe('vehicles/addVehicle/pending');
    });

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    }, { timeout: 1600 });
  });

  it('displays an error message on failure', async () => {
    const errorMessage = 'Failed to add vehicle';
    store = mockStore({
      auth: { user: mockUser },
      vehicles: { loading: false, error: errorMessage },
    });

    const { findByText } = render(
      <Provider store={store}>
        <AddVehicleScreen navigation={mockNavigation} />
      </Provider>
    );

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });
});
