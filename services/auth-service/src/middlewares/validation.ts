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
  name: Joi.string().min(2).max(255).required(),
  vehicle: Joi.object({
    plate_number: Joi.string().required(),
    brand: Joi.string().required(),
    model: Joi.string().required(),
    battery_kwh: Joi.number().optional(),
  }).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyOTPSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  otp: Joi.string().length(6).required(),
  type: Joi.string().valid('email', 'phone').required(),
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
