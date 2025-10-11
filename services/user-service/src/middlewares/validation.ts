import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).optional(),
  avatar_url: Joi.string().uri().optional(),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    }),
});

export const addVehicleSchema = Joi.object({
  plate_number: Joi.string().required().max(20),
  brand: Joi.string().required().max(50),
  model: Joi.string().required().max(50),
  battery_kwh: Joi.number().positive().optional(),
  color: Joi.string().max(30).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
});

export const updateVehicleSchema = Joi.object({
  plate_number: Joi.string().max(20).optional(),
  brand: Joi.string().max(50).optional(),
  model: Joi.string().max(50).optional(),
  battery_kwh: Joi.number().positive().optional(),
  color: Joi.string().max(30).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
});

export const subscriptionSchema = Joi.object({
  plan_id: Joi.string().required(),
  auto_renew: Joi.boolean().optional().default(true),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().positive().required(),
  bank_account: Joi.string().required(),
  bank_code: Joi.string().required(),
});

export const notificationSchema = Joi.object({
  user_id: Joi.string().required(),
  title: Joi.string().required().max(200),
  message: Joi.string().required().max(1000),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'sms')).min(1).required(),
  data: Joi.object().optional(),
});

export const scheduleNotificationSchema = Joi.object({
  to_user: Joi.string().required(),
  send_at: Joi.date().iso().required(),
  title: Joi.string().required().max(200),
  message: Joi.string().required().max(1000),
  channels: Joi.array().items(Joi.string().valid('push', 'email', 'sms')).optional(),
});

// Validation middleware
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        error: 'Validation error',
        details,
      });
      return;
    }

    next();
  };
};
