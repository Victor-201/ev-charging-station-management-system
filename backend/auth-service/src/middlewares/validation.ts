import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    next();
  };
};

// Validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least one uppercase, lowercase, number and special character'),
  password_confirmation: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Password confirmation must match password',
      'any.required': 'Password confirmation is required'
    }),
  full_name: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  date_of_birth: Joi.date().max('now').required()
    .custom((value, helpers) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        return helpers.error('any.invalid', { message: 'User must be at least 18 years old' });
      }
      return value;
    })
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required',
      'any.invalid': 'User must be at least 18 years old'
    }),
  role: Joi.string().valid('user', 'staff', 'admin').default('user'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  verification_code: Joi.string().length(6).required(),
});

export const verifyEmailTokenSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'any.required': 'Verification token is required',
      'string.empty': 'Verification token cannot be empty'
    }),
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required(),
});


export const oauthLoginSchema = Joi.object({
  provider: Joi.string().valid('google', 'facebook').required(),
  provider_token: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Password must contain at least one uppercase, lowercase, number and special character'),
});

export const linkProviderSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  provider: Joi.string().valid('google', 'facebook').required(),
  provider_token: Joi.string().required(),
});

export const unlinkProviderSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  provider: Joi.string().valid('google', 'facebook').required(),
});
