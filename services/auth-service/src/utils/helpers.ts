// Generate random OTP
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

// Generate random token
export const generateToken = (length: number = 32): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  
  return token;
};

// Mask email
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 2) + '***' + username.substring(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

// Mask phone
export const maskPhone = (phone: string): string => {
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 2);
};
