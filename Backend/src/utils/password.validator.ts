export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidPersonalInfo: boolean;
}

// Default password policy configuration
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
  forbidPersonalInfo: true,
};

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
  'password1', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'sunshine', 'princess', 'football', 'baseball', 'superman',
  'michael', 'jordan', 'harley', 'ranger', 'shadow', 'jennifer',
  'hunter', 'buster', 'soccer', 'hockey', 'killer', 'trustno1',
  'charlie', 'london', 'purple', 'orange', 'maggie', 'starwars',
  'klaster', 'please', 'coffee', 'computer', 'maverick', 'cookie'
];

/**
 * Validates a password against the specified policy
 * @param password The password to validate
 * @param policy The password policy to apply (uses default if not provided)
 * @param userInfo Optional user information to check against (username, email, firstName, lastName)
 * @returns PasswordValidationResult with validation status, errors, and strength
 */
export const validatePassword = (
  password: string, 
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }
): PasswordValidationResult => {
  const errors: string[] = [];
  let strengthScore = 0;

  // Check if password is provided
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak'
    };
  }

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else if (password.length >= policy.minLength) {
    strengthScore += 1;
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character type validation
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (/[a-z]/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (/\d/.test(password)) {
    strengthScore += 1;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    strengthScore += 1;
  }

  // Common password validation
  if (policy.forbidCommonPasswords) {
    const lowercasePassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowercasePassword)) {
      errors.push('Password is too common. Please choose a more unique password');
    }
    
    // Check for common patterns
    if (/^(.)\1{2,}$/.test(password)) { // Repeated characters like "aaaa"
      errors.push('Password cannot consist of repeated characters');
    }
    
    if (/^(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
      errors.push('Password cannot contain sequential numbers');
    }
    
    if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(lowercasePassword)) {
      errors.push('Password cannot contain sequential letters');
    }
  }

  // Personal information validation
  if (policy.forbidPersonalInfo && userInfo) {
    const personalData = [
      userInfo.username?.toLowerCase(),
      userInfo.email?.toLowerCase().split('@')[0], // Email username part
      userInfo.firstName?.toLowerCase(),
      userInfo.lastName?.toLowerCase()
    ].filter(Boolean);

    for (const data of personalData) {
      if (data && data.length >= 3 && password.toLowerCase().includes(data)) {
        errors.push('Password cannot contain your personal information (username, email, name)');
        break;
      }
    }
  }

  // Additional strength checks
  if (password.length >= 12) strengthScore += 1; // Bonus for longer passwords
  if (/[A-Z].*[A-Z]/.test(password)) strengthScore += 0.5; // Multiple uppercase
  if (/\d.*\d/.test(password)) strengthScore += 0.5; // Multiple numbers
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) strengthScore += 0.5; // Multiple special chars

  // Determine password strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (strengthScore >= 6) {
    strength = 'strong';
  } else if (strengthScore >= 4.5) {
    strength = 'good';
  } else if (strengthScore >= 3) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};

/**
 * Get password policy requirements as a user-friendly string
 * @param policy The password policy to describe
 * @returns String description of password requirements
 */
export const getPasswordRequirementsText = (policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string => {
  const requirements = [];
  
  requirements.push(`At least ${policy.minLength} characters long`);
  
  if (policy.requireUppercase) requirements.push('One uppercase letter (A-Z)');
  if (policy.requireLowercase) requirements.push('One lowercase letter (a-z)');
  if (policy.requireNumbers) requirements.push('One number (0-9)');
  if (policy.requireSpecialChars) requirements.push('One special character (!@#$%^&* etc.)');
  if (policy.forbidCommonPasswords) requirements.push('Not a common password');
  if (policy.forbidPersonalInfo) requirements.push('Does not contain personal information');

  return `Password must contain:\n• ${requirements.join('\n• ')}`;
};

/**
 * Check if a password meets minimum security requirements for existing users
 * (More lenient than full policy for backward compatibility)
 */
export const validateExistingUserPassword = (password: string): PasswordValidationResult => {
  const minimumPolicy: PasswordPolicy = {
    minLength: 6, // More lenient for existing users
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: true,
    requireNumbers: false,
    requireSpecialChars: false,
    forbidCommonPasswords: true,
    forbidPersonalInfo: false,
  };

  return validatePassword(password, minimumPolicy);
}; 