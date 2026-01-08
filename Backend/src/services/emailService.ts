import nodemailer from 'nodemailer';
import { MAIL_USER, MAIL_PASS, FRONTEND_URL } from '../config';

// Gmail email service for password reset functionality
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const frontendUrl = FRONTEND_URL;
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  try {
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: 'Chef Circle <chefcircle.seba@gmail.com>',
      to: email,
      subject: 'Password Reset Request - Chef Circle',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🍳 Chef Circle</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your Culinary Journey</p>
          </div>
          
          <div style="padding: 40px 30px; background: white; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hi there! 👋
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your Chef Circle account. If you made this request, 
              click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                🔐 Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #059669; font-size: 14px; word-break: break-all; background: #ecfdf5; padding: 12px; border-radius: 4px; border-left: 4px solid #10b981;">
              ${resetUrl}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                <strong>⚠️ Important security information:</strong>
              </p>
              <ul style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>This link will expire in <strong>1 hour</strong> for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone else</li>
              </ul>
            </div>
            
            <p style="color: #374151; font-size: 16px; margin-top: 30px;">
              Happy cooking! 👨‍🍳<br>
              <strong>The Chef Circle Team</strong>
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request - Chef Circle
        
        Hi there!
        
        We received a request to reset your password for your Chef Circle account.
        
        If you made this request, click the link below to set a new password:
        ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this reset, please ignore this email.
        
        Happy cooking!
        The Chef Circle Team
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Password reset email sent successfully to:', email);
    console.log('📧 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Fallback to console log if email fails
    console.log('\n=================================');
    console.log('EMAIL FAILED - CONSOLE FALLBACK');
    console.log('=================================');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=================================\n');
    
    throw new Error('Failed to send password reset email');
  }
}; 