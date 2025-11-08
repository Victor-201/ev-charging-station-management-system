import userReducer, {
  getMe,
  updateProfile,
  clearProfile,
} from '../../../src/store/slices/userSlice';

describe('userSlice', () => {
  const initialState = {
    profile: null,
    loading: false,
    error: null,
  };

  const mockProfile = { id: '1', full_name: 'John Doe', email: 'john@example.com' };

  it('should handle initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle clearProfile', () => {
    const state = userReducer({ ...initialState, profile: mockProfile }, clearProfile());
    expect(state.profile).toBeNull();
  });

  describe('getMe async thunk', () => {
    it('should handle pending state', () => {
      const state = userReducer(initialState, getMe.pending());
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const state = userReducer(initialState, getMe.fulfilled(mockProfile));
      expect(state.loading).toBe(false);
      expect(state.profile).toEqual(mockProfile);
    });

    it('should handle rejected state', () => {
      const error = { message: 'Failed to fetch profile' };
      const state = userReducer(initialState, getMe.rejected(null, { payload: error }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('updateProfile async thunk', () => {
    it('should handle pending state', () => {
      const state = userReducer(initialState, updateProfile.pending());
      expect(state.loading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const updatedUser = { ...mockProfile, full_name: 'Johnathan Doe' };
      const payload = { user: updatedUser };
      const state = userReducer({ ...initialState, profile: mockProfile }, updateProfile.fulfilled(payload));
      expect(state.loading).toBe(false);
      expect(state.profile.full_name).toBe('Johnathan Doe');
    });

    it('should handle rejected state', () => {
      const error = { message: 'Failed to update profile' };
      const state = userReducer(initialState, updateProfile.rejected(null, { payload: error }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });
});
