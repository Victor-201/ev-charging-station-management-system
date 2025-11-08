import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import EditVehicleScreen from '../../../src/screens/Profile/EditVehicleScreen';

// Mock navigation and route
const mockGoBack = jest.fn();
const mockNavigation = { goBack: mockGoBack };
const mockRoute = { params: { vehicleId: 'v1' } };

// Mock store
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('EditVehicleScreen', () => {
  let store;
  const mockVehicle = {
    id: 'v1',
    make: 'Tesla',
    model: 'Model Y',
    year: 2023,
    license_plate: 'TESLA-Y',
    battery_capacity: 75,
    connector_type: 'Type 2',
  };

  beforeEach(() => {
    store = mockStore({
      vehicles: { vehicles: [mockVehicle], loading: false, error: null },
    });
    jest.clearAllMocks();
  });

  it('renders with pre-filled vehicle data', () => {
    const { getByDisplayValue } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    expect(getByDisplayValue('Tesla')).toBeTruthy();
    expect(getByDisplayValue('Model Y')).toBeTruthy();
    expect(getByDisplayValue('2023')).toBeTruthy();
    expect(getByDisplayValue('TESLA-Y')).toBeTruthy();
    expect(getByDisplayValue('75')).toBeTruthy();
    expect(getByDisplayValue('Type 2')).toBeTruthy();
  });

  it('enables save button when form is dirty and valid', async () => {
    const { getByDisplayValue, getByText } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByDisplayValue('Model Y'), 'Model 3');

    await waitFor(() => {
      const saveButton = getByText('Lưu thay đổi');
      expect(saveButton.props.accessibilityState.disabled).toBe(false);
    });
  });

  it('dispatches updateVehicle and navigates back on success', async () => {
    const { getByDisplayValue, getByText } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.changeText(getByDisplayValue('Model Y'), 'Model 3');

    // Mock successful action
    store.dispatch = jest.fn().mockResolvedValue({ type: 'vehicles/updateVehicle/fulfilled' });

    fireEvent.press(getByText('Lưu thay đổi'));

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalled();
      const dispatchedAction = store.dispatch.mock.calls[0][0];
      expect(dispatchedAction.type).toBe('vehicles/updateVehicle/pending');
    });

    await waitFor(() => {
      expect(mockGoBack).toHaveBeenCalled();
    }, { timeout: 1600 });
  });

  it('shows confirmation alert on delete and dispatches deleteVehicle', async () => {
    const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByText } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    fireEvent.press(getByText('Xóa phương tiện'));

    expect(alertSpy).toHaveBeenCalled();

    // Simulate pressing 'Xóa'
    const deleteButtonHandler = alertSpy.mock.calls[0][2][1].onPress;
    
    // Mock successful action
    store.dispatch = jest.fn().mockResolvedValue({ type: 'vehicles/deleteVehicle/fulfilled' });

    await deleteButtonHandler();

    await waitFor(() => {
      expect(store.dispatch).toHaveBeenCalled();
      const dispatchedAction = store.dispatch.mock.calls[0][0];
      expect(dispatchedAction.type).toBe('vehicles/deleteVehicle/pending');
      expect(dispatchedAction.meta.arg).toBe(mockVehicle.id);
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('displays an error message on failure', async () => {
    const errorMessage = 'Failed to update';
    store = mockStore({
      vehicles: { vehicles: [mockVehicle], loading: false, error: errorMessage },
    });

    const { findByText } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    );

    const error = await findByText(errorMessage);
    expect(error).toBeTruthy();
  });

  it('shows message if vehicle not found', () => {
    const { getByText } = render(
      <Provider store={store}>
        <EditVehicleScreen navigation={mockNavigation} route={{ params: { vehicleId: 'not-found' } }} />
      </Provider>
    );
    expect(getByText('Không tìm thấy phương tiện.')).toBeTruthy();
  });
});
