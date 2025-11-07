import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('emailSchema', () => {
    it('validates correct email', async () => {
      await expect(emailSchema.validate('test@example.com')).resolves.toBe('test@example.com');
    });

    it('rejects invalid email', async () => {
      await expect(emailSchema.validate('invalid-email')).rejects.toThrow('Email không hợp lệ');
    });

    it('rejects empty email', async () => {
      await expect(emailSchema.validate('')).rejects.toThrow('Email là bắt buộc');
    });
  });

  describe('passwordSchema', () => {
    it('validates strong password', async () => {
      await expect(passwordSchema.validate('Password123')).resolves.toBe('Password123');
    });

    it('rejects short password', async () => {
      await expect(passwordSchema.validate('Pass1')).rejects.toThrow('Mật khẩu ít nhất 6 ký tự');
    });

    it('rejects password without uppercase', async () => {
      await expect(passwordSchema.validate('password123')).rejects.toThrow(
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
      );
    });

    it('rejects password without lowercase', async () => {
      await expect(passwordSchema.validate('PASSWORD123')).rejects.toThrow(
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
      );
    });

    it('rejects password without number', async () => {
      await expect(passwordSchema.validate('Password')).rejects.toThrow(
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
      );
    });

    it('rejects empty password', async () => {
      await expect(passwordSchema.validate('')).rejects.toThrow('Mật khẩu là bắt buộc');
    });
  });

  describe('phoneSchema', () => {
    it('validates 10-digit phone number', async () => {
      await expect(phoneSchema.validate('0123456789')).resolves.toBe('0123456789');
    });

    it('validates 11-digit phone number', async () => {
      await expect(phoneSchema.validate('01234567890')).resolves.toBe('01234567890');
    });

    it('rejects short phone number', async () => {
      await expect(phoneSchema.validate('012345678')).rejects.toThrow(
        'Số điện thoại không hợp lệ (10-11 số)'
      );
    });

    it('rejects long phone number', async () => {
      await expect(phoneSchema.validate('012345678901')).rejects.toThrow(
        'Số điện thoại không hợp lệ (10-11 số)'
      );
    });

    it('rejects phone number with letters', async () => {
      await expect(phoneSchema.validate('012345678a')).rejects.toThrow(
        'Số điện thoại không hợp lệ (10-11 số)'
      );
    });

    it('allows null phone number', async () => {
      await expect(phoneSchema.validate(null)).resolves.toBeNull();
    });
  });

  describe('loginSchema', () => {
    it('validates correct login data', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
      };
      await expect(loginSchema.validate(data)).resolves.toEqual(data);
    });

    it('rejects login with invalid email', async () => {
      const data = {
        email: 'invalid-email',
        password: 'password123',
      };
      await expect(loginSchema.validate(data)).rejects.toThrow('Email không hợp lệ');
    });

    it('rejects login without password', async () => {
      const data = {
        email: 'test@example.com',
        password: '',
      };
      await expect(loginSchema.validate(data)).rejects.toThrow('Mật khẩu là bắt buộc');
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', async () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '0123456789',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      await expect(registerSchema.validate(data)).resolves.toEqual(data);
    });

    it('rejects registration with short full name', async () => {
      const data = {
        full_name: 'J',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      await expect(registerSchema.validate(data)).rejects.toThrow('Họ tên ít nhất 2 ký tự');
    });

    it('rejects registration with long full name', async () => {
      const data = {
        full_name: 'a'.repeat(101),
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      await expect(registerSchema.validate(data)).rejects.toThrow('Họ tên tối đa 100 ký tự');
    });

    it('rejects registration with mismatched passwords', async () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      };
      await expect(registerSchema.validate(data)).rejects.toThrow('Mật khẩu không khớp');
    });

    it('validates registration without phone number', async () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone_number: null,
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      await expect(registerSchema.validate(data)).resolves.toEqual(data);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('validates correct email', async () => {
      const data = { email: 'test@example.com' };
      await expect(forgotPasswordSchema.validate(data)).resolves.toEqual(data);
    });

    it('rejects invalid email', async () => {
      const data = { email: 'invalid-email' };
      await expect(forgotPasswordSchema.validate(data)).rejects.toThrow('Email không hợp lệ');
    });
  });

  describe('resetPasswordSchema', () => {
    it('validates correct reset password data', async () => {
      const data = {
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };
      await expect(resetPasswordSchema.validate(data)).resolves.toEqual(data);
    });

    it('rejects mismatched passwords', async () => {
      const data = {
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };
      await expect(resetPasswordSchema.validate(data)).rejects.toThrow('Mật khẩu không khớp');
    });

    it('rejects weak password', async () => {
      const data = {
        password: 'weak',
        confirmPassword: 'weak',
      };
      await expect(resetPasswordSchema.validate(data)).rejects.toThrow();
    });
  });

  describe('verifyEmailSchema', () => {
    it('validates correct verification data', async () => {
      const data = {
        email: 'test@example.com',
        verification_code: '123456',
      };
      await expect(verifyEmailSchema.validate(data)).resolves.toEqual(data);
    });

    it('rejects short verification code', async () => {
      const data = {
        email: 'test@example.com',
        verification_code: '12345',
      };
      await expect(verifyEmailSchema.validate(data)).rejects.toThrow(
        'Mã xác thực phải có 6 ký tự'
      );
    });

    it('rejects long verification code', async () => {
      const data = {
        email: 'test@example.com',
        verification_code: '1234567',
      };
      await expect(verifyEmailSchema.validate(data)).rejects.toThrow(
        'Mã xác thực phải có 6 ký tự'
      );
    });

    it('rejects empty verification code', async () => {
      const data = {
        email: 'test@example.com',
        verification_code: '',
      };
      await expect(verifyEmailSchema.validate(data)).rejects.toThrow(
        'Mã xác thực là bắt buộc'
      );
    });
  });
});

