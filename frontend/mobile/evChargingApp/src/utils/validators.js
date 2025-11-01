// src/utils/validators.js
import * as yup from 'yup';

export const emailSchema = yup.string().email('Email không hợp lệ').required('Email là bắt buộc');
export const passwordSchema = yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Mật khẩu là bắt buộc');

export const loginSchema = yup.object().shape({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = yup.object().shape({
  fullName: yup.string().required('Họ tên là bắt buộc'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Mật khẩu không khớp').required('Xác nhận mật khẩu là bắt buộc'),
});

export const forgotPasswordSchema = yup.object().shape({
  email: emailSchema,
});
