export const validateAssignmentToken = (token: string): string | null => {
  if (!token || token.trim().length === 0) {
    return 'Assignment code is required';
  }

  if (token.length < 10) {
    return 'Assignment code must be at least 10 characters';
  }

  // Check if it looks like a JWT token (for QR codes)
  if (token.split('.').length === 3) {
    // Basic JWT format validation
    try {
      const parts = token.split('.');
      if (parts[0] && parts[1] && parts[2]) {
        return null; // Looks like a valid JWT
      }
    } catch (error) {
      return 'Invalid assignment code format';
    }
  }

  // Additional validation can be added here
  return null;
};

export const validatePhoneNumber = (phone: string): string | null => {
  if (!phone || phone.trim().length === 0) {
    return 'Phone number is required';
  }

  // Basic phone number validation (adjust based on requirements)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }

  return null;
};

export const validateOTP = (otp: string): string | null => {
  if (!otp || otp.trim().length === 0) {
    return 'OTP is required';
  }

  if (otp.length !== 6) {
    return 'OTP must be 6 digits';
  }

  if (!/^\d+$/.test(otp)) {
    return 'OTP must contain only numbers';
  }

  return null;
};