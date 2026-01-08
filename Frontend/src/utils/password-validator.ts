export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
  score: number;
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

// Default password policy matching backend
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

// Common weak passwords to reject (subset of backend list)
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '123456789', 'qwerty', 'abc123',
  'password1', 'admin', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'sunshine', 'princess', 'football', 'baseball', 'superman',
  'michael', 'jordan', 'harley', 'ranger', 'shadow', 'jennifer',
  'hunter', 'buster', 'soccer', 'hockey', 'killer', 'trustno1'
];

/**
 * Client-side password validation (for immediate feedback)
 * This mirrors the backend validation but provides instant feedback
 */
export const validatePasswordClient = (
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
  let score = 0;

  // Check if password is provided
  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      strength: 'weak',
      score: 0
    };
  }

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else if (password.length >= policy.minLength) {
    score += 1;
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character type validation
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    score += 1;
  }

  // Common password validation
  if (policy.forbidCommonPasswords) {
    const lowercasePassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowercasePassword)) {
      errors.push('Password is too common. Please choose a more unique password');
    }
    
    // Check for common patterns
    if (/^(.)\1{2,}$/.test(password)) {
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
      userInfo.email?.toLowerCase().split('@')[0],
      userInfo.firstName?.toLowerCase(),
      userInfo.lastName?.toLowerCase()
    ].filter(Boolean);

    for (const data of personalData) {
      if (data && data.length >= 3 && password.toLowerCase().includes(data)) {
        errors.push('Password cannot contain your personal information');
        break;
      }
    }
  }

  // Additional strength scoring
  if (password.length >= 12) score += 1;
  if (/[A-Z].*[A-Z]/.test(password)) score += 0.5;
  if (/\d.*\d/.test(password)) score += 0.5;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) score += 0.5;

  // Determine strength
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score >= 6) {
    strength = 'strong';
  } else if (score >= 4.5) {
    strength = 'good';
  } else if (score >= 3) {
    strength = 'fair';
  } else {
    strength = 'weak';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
};

/**
 * Get password requirements text for display
 */
export const getPasswordRequirements = (policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): string[] => {
  const requirements = [];
  
  requirements.push(`At least ${policy.minLength} characters long`);
  
  if (policy.requireUppercase) requirements.push('One uppercase letter (A-Z)');
  if (policy.requireLowercase) requirements.push('One lowercase letter (a-z)');
  if (policy.requireNumbers) requirements.push('One number (0-9)');
  if (policy.requireSpecialChars) requirements.push('One special character (!@#$%^&* etc.)');
  if (policy.forbidCommonPasswords) requirements.push('Not a common password');
  if (policy.forbidPersonalInfo) requirements.push('Does not contain personal information');

  return requirements;
};

/**
 * Get strength color for UI display
 */
export const getStrengthColor = (strength: 'weak' | 'fair' | 'good' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'fair':
      return 'text-orange-500';
    case 'good':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get strength background color for progress bars
 */
export const getStrengthBgColor = (strength: 'weak' | 'fair' | 'good' | 'strong'): string => {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

/**
 * Calculate strength percentage for progress display
 */
export const getStrengthPercentage = (strength: 'weak' | 'fair' | 'good' | 'strong', score: number): number => {
  const maxScore = 7; // Maximum possible score
  return Math.min((score / maxScore) * 100, 100);
}; 