package com.aiinterview.face2hire_backend.serviceimpl;


import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@AllArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final OtpServiceImpl otpServiceImpl;

    @Override
    public void sendOtpToEmail(String to, String subject, String htmlMessage)
            throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlMessage, true);
        mailSender.send(message);
    }

    @Override
    public void sendOtpByType(User user, OtpType type) throws MessagingException {
        switch (type) {
            case REGISTRATION:
                sendVerificationEmail(user);
                break;
            case FORGOT_PASSWORD:
                sendForgotPasswordOtp(user);
                break;
            default:
                throw new IllegalArgumentException("Unsupported OTP type: " + type);
        }
    }

    @Override
    public void sendVerificationEmail(User user) throws MessagingException {
        log.info("Sending verification email to {}", user.getEmail());

        String subject = "Email Verification Code";
        String otp = otpServiceImpl.generateOtp(user.getEmail(), OtpType.REGISTRATION);
        String verificationCode = otp;

        String htmlMessage = "<html>"
                + "<body style=\"font-family: Arial, sans-serif;\">"
                + "<div style=\"background-color: #f5f5f5; padding: 20px;\">"
                + "<h2 style=\"color: #333;\">Welcome to InterviewAI!</h2>"
                + "<p style=\"font-size: 16px;\">Please enter the verification code " +
                "below to complete " +
                "your registration:</p>"
                + "<div style=\"background-color: #fff; padding: 20px; border-radius: 5px; " +
                "box-shadow: 0 0 10px rgba(0,0,0,0.1);\">"
                + "<h3 style=\"color: #333;\">Your Verification Code:</h3>"
                + "<p style=\"font-size: 24px; font-weight: bold; color: #6366F1;\">"
                + verificationCode + "</p>"
                + "</div>"
                + "<p style=\"font-size: 12px; color: #888; margin-top: 20px;\">" +
                "This code expires in 3 minutes.</p>"
                + "</div>"
                + "</body>"
                + "</html>";

        sendOtpToEmail(user.getEmail(), subject, htmlMessage);
        log.info("Verification email sent to {}", user.getEmail());
    }

    @Override
    public void sendForgotPasswordOtp(User user) throws MessagingException {
        log.info("Sending forgot password OTP to {}", user.getEmail());

        String subject = "InterviewAI - Password Reset OTP";
        String otp = otpServiceImpl.generateOtp(user.getEmail(), OtpType.FORGOT_PASSWORD);
        log.info("otp for forgot password is:{}", otp);

        String htmlMessage = """
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p style="font-size: 16px;">You requested to reset your password. 
                        Use the OTP below:</p>
                        <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #333;">Your OTP Code:</h3>
                            <p style="font-size: 28px; font-weight: bold; color: #6366F1;">%s</p>
                        </div>
                        <p style="font-size: 12px; color: #888;">This OTP expires in 3 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                </body>
                </html>
                """.formatted(otp);

        sendOtpToEmail(user.getEmail(), subject, htmlMessage);
    }

    @Override
    public void updateEmailOtp(String email) throws MessagingException {
        log.info("Sending update email OTP to {}", email);

        String subject = "InterviewAI - Email Update OTP";
        String otp = otpServiceImpl.generateOtp(email, OtpType.UPDATE_EMAIL);
        log.info("otp for update email is:{}", otp);

        String htmlMessage = """
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="background-color: #f5f5f5; padding: 20px;">
                        <h2 style="color: #333;">Email update Request</h2>
                        <p style="font-size: 16px;">You requested to update  your email.
                         Use the OTP below:</p>
                        <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #333;">Your OTP Code:</h3>
                            <p style="font-size: 28px; font-weight: bold; color: #6366F1;">%s</p>
                        </div>
                        <p style="font-size: 12px; color: #888;">This OTP expires in 3 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                </body>
                </html>
                """.formatted(otp);

        sendOtpToEmail(email, subject, htmlMessage);
    }
}
