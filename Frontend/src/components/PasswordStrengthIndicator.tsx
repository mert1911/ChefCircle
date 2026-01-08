import React from 'react';
import { validatePasswordClient, getPasswordRequirements } from '@/utils/password-validator';
import { CheckCircle2 } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  userInfo?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  showRequirements?: boolean;
  className?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  userInfo,
  showRequirements = true,
  className = ''
}) => {
  const validation = validatePasswordClient(password, undefined, userInfo);
  const requirements = getPasswordRequirements();

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Password Requirements */}
      {showRequirements && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h4>
          <div className="space-y-1">
            {requirements.map((requirement, index) => {
              // Check if this requirement is met
              const isMinLength = requirement.includes('characters long') && password.length >= 8;
              const hasUppercase = requirement.includes('uppercase') && /[A-Z]/.test(password);
              const hasLowercase = requirement.includes('lowercase') && /[a-z]/.test(password);
              const hasNumber = requirement.includes('number') && /\d/.test(password);
              const hasSpecial = requirement.includes('special character') && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
              const notCommon = requirement.includes('common password') && !validation.errors.some(error => error.includes('common'));
              const noPersonalInfo = requirement.includes('personal information') && !validation.errors.some(error => error.includes('personal'));
              
              const isMet = isMinLength || hasUppercase || hasLowercase || hasNumber || hasSpecial || notCommon || noPersonalInfo;
              
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {isMet ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span className={isMet ? 'text-green-700' : 'text-gray-600'}>
                    {requirement}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator; 