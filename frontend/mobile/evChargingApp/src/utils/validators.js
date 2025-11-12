// src/utils/validators.js
import * as yup from 'yup';

// Base schemas
export const emailSchema = yup
  .string()
  .email('Email không hợp lệ')
  .required('Email là bắt buộc');

export const passwordSchema = yup
  .string()
  .min(6, 'Mật khẩu ít nhất 6 ký tự')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
  )
  .required('Mật khẩu là bắt buộc');

export const phoneSchema = yup
  .string()
  .matches(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ (10-11 số)')
  .nullable();

// Login schema
export const loginSchema = yup.object().shape({
  email: emailSchema,
  password: yup.string().required('Mật khẩu là bắt buộc'), // Không validate pattern khi login
});

// Register schema
export const registerSchema = yup.object().shape({
  full_name: yup
    .string()
    .min(2, 'Họ tên ít nhất 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .required('Họ tên là bắt buộc'),
  email: emailSchema,
  phone_number: phoneSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Mật khẩu không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
});

// Forgot password schema
export const forgotPasswordSchema = yup.object().shape({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = yup.object().shape({
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Mật khẩu không khớp')
    .required('Xác nhận mật khẩu là bắt buộc'),
});

// Verify email schema
export const verifyEmailSchema = yup.object().shape({
  email: emailSchema,
  verification_code: yup
    .string()
    .length(6, 'Mã xác thực phải có 6 ký tự')
    .required('Mã xác thực là bắt buộc'),
});

// Update profile schema
export const updateProfileSchema = yup.object().shape({
  full_name: yup
    .string()
    .min(2, 'Họ tên ít nhất 2 ký tự')
    .max(100, 'Họ tên tối đa 100 ký tự')
    .required('Họ tên là bắt buộc'),
  phone_number: phoneSchema,
});

// Change password schema
export const changePasswordSchema = yup.object().shape({
  current_password: yup.string().required('Mật khẩu hiện tại là bắt buộc'),
  password: passwordSchema, // Re-uses the strong password validation
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Mật khẩu mới không khớp')
    .required('Xác nhận mật khẩu mới là bắt buộc'),
});

// Vehicle schema
export const vehicleSchema = yup.object().shape({
  brand: yup.string().required('Hãng xe là bắt buộc'),
  model: yup.string().required('Mẫu xe là bắt buộc'),
  year: yup
    .number()
    .typeError('Năm sản xuất phải là số')
    .required('Năm sản xuất là bắt buộc')
    .min(1990, 'Năm sản xuất phải sau 1990')
    .max(new Date().getFullYear() + 1, `Năm sản xuất không được lớn hơn ${new Date().getFullYear() + 1}`),
  plate_number: yup.string().required('Biển số xe là bắt buộc'),
});
