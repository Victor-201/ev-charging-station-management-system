import authReducer, {
  login,
  register,
  socialLogin,
  logout,
  setAccessToken,
} from '../../../src/store/slices/authSlice';
import authService from '../../../src/services/authService';

jest.mock('../../../src/services/authService');
jest.mock('jwt-decode', () => () => ({ id: '1', email: 'test@example.com' }));

describe('authSlice', () => {
  const initialState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle logout', () => {
    const state = authReducer({ ...initialState, accessToken: 'some-token' }, logout());
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should handle setAccessToken', () => {
    const token = 'fake-jwt-token';
    const state = authReducer(initialState, setAccessToken(token));
    expect(state.accessToken).toBe(token);
    expect(state.user).toEqual({ id: '1', email: 'test@example.com' });
  });

  describe('login async thunk', () => {
    it('should handle pending state', () => {
      const state = authReducer(initialState, login.pending());
      expect(state.loading).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const payload = { accessToken: 'token', refreshToken: 'refresh' };
      const state = authReducer(initialState, login.fulfilled(payload));
      expect(state.loading).toBe(false);
      expect(state.accessToken).toBe(payload.accessToken);
      expect(state.refreshToken).toBe(payload.refreshToken);
      expect(state.user).not.toBeNull();
    });

    it('should handle rejected state', () => {
      const error = { message: 'Login failed' };
      const state = authReducer(initialState, login.rejected(null, { payload: error }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('register async thunk', () => {
    it('should handle fulfilled state', () => {
      const state = authReducer(initialState, register.fulfilled());
      expect(state.loading).toBe(false);
    });

    it('should handle rejected state', () => {
      const error = { message: 'Registration failed' };
      const state = authReducer(initialState, register.rejected(null, { payload: error }));
      expect(state.loading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('socialLogin async thunk', () => {
    it('should handle fulfilled state', () => {
      const payload = { accessToken: 'social-token' };
      const state = authReducer(initialState, socialLogin.fulfilled(payload));
      expect(state.loading).toBe(false);
      expect(state.accessToken).toBe(payload.accessToken);
    });
  });
});
