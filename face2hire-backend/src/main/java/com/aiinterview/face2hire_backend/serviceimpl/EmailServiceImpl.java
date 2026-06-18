package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.logging.AppLogger;
import com.aiinterview.face2hire_backend.logging.AppLoggerFactory;
import com.aiinterview.face2hire_backend.service.EmailService;
import com.aiinterview.face2hire_backend.service.OtpService;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final OtpService otpServiceImpl;
    private final AppLoggerFactory loggerFactory;
    private AppLogger log;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Override
    public void sendOtpToEmail(String to, String subject, String htmlMessage) {
        try {
            log.info("📧 Sending email to: {}", to);
            log.debug("Subject: {}", subject);
            log.debug("From: {}", fromEmail);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlMessage, true);
            helper.setFrom(fromEmail);

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", to);

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to {}: {}", to, e.getMessage(), e);
//            throw new RuntimeException("Failed to send email to " + to + ": " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending email to {}: {}", to, e.getMessage(), e);
//            throw new RuntimeException("Unexpected error sending email to " + to + ": " + e.getMessage(), e);
        }
    }

    @Override
    public void sendOtpByType(User user, OtpType type) {
        try {
            log.info("📧 Sending OTP by type: {} to user: {}", type, user.getEmail());
            switch (type) {
                case REGISTRATION:
                    sendVerificationEmail(user);
                    break;
                case FORGOT_PASSWORD:
                    sendForgotPasswordOtp(user);
                    break;
                case UPDATE_EMAIL:
                    updateEmailOtp(user.getEmail());
                    break;
                default:
                    log.error("❌ Unsupported OTP type: {}", type);
                    throw new IllegalArgumentException("Unsupported OTP type: " + type);
            }
            log.info("✅ OTP sent successfully for type: {} to: {}", type, user.getEmail());
        } catch (MessagingException e) {
            log.error("❌ Failed to send OTP for type {} to {}: {}", type, user.getEmail(), e.getMessage(), e);
//            throw new RuntimeException("Failed to send OTP: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending OTP for type {} to {}: {}", type, user.getEmail(), e.getMessage(), e);
//            throw new RuntimeException("Unexpected error sending OTP: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendVerificationEmail(User user) throws MessagingException {
        log.info("📧 Sending verification email to: {}", user.getEmail());

        try {
            String otp = otpServiceImpl.generateOtp(user.getEmail(), OtpType.REGISTRATION);
            log.debug("Generated OTP for {}: {}", user.getEmail(), otp);

            String subject = "Email Verification Code";
            String htmlMessage = buildVerificationEmailHtml(otp, "Welcome to InterviewAI!",
                    "Please enter the verification code below to complete your registration:");

            sendOtpToEmail(user.getEmail(), subject, htmlMessage);
            log.info("✅ Verification email sent to: {}", user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send verification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Override
    public void sendForgotPasswordOtp(User user) throws MessagingException {
        log.info("📧 Sending forgot password OTP to: {}", user.getEmail());

        try {
            String otp = otpServiceImpl.generateOtp(user.getEmail(), OtpType.FORGOT_PASSWORD);
            log.debug("Generated forgot password OTP for {}: {}", user.getEmail(), otp);

            String subject = "InterviewAI - Password Reset OTP";
            String htmlMessage = buildForgotPasswordEmailHtml(otp);

            sendOtpToEmail(user.getEmail(), subject, htmlMessage);
            log.info("✅ Forgot password OTP sent to: {}", user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to send forgot password OTP to {}: {}", user.getEmail(), e.getMessage(), e);
        }
    }

    @Override
    public void updateEmailOtp(String email) throws MessagingException {
        log.info("📧 Sending update email OTP to: {}", email);

        try {
            String otp = otpServiceImpl.generateOtp(email, OtpType.UPDATE_EMAIL);
            log.debug("Generated update email OTP for {}: {}", email, otp);

            String subject = "InterviewAI - Email Update OTP";
            String htmlMessage = buildUpdateEmailHtml(otp);

            sendOtpToEmail(email, subject, htmlMessage);
            log.info("✅ Update email OTP sent to: {}", email);

        } catch (Exception e) {
            log.error("❌ Failed to send update email OTP to {}: {}", email, e.getMessage(), e);
        }
    }

    private String buildVerificationEmailHtml(String otp, String title, String message) {
        return String.format("""
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #6366F1; }
                        .header h1 { color: #333; margin: 0; }
                        .otp-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #6366F1; }
                        .otp-code { font-size: 36px; font-weight: bold; color: #6366F1; letter-spacing: 5px; margin: 10px 0; }
                        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #888; }
                        .expiry { color: #dc3545; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>%s</h1>
                        </div>
                        <p style="font-size: 16px; color: #333;">%s</p>
                        <div class="otp-box">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
                            <div class="otp-code">%s</div>
                        </div>
                        <p style="font-size: 14px; color: #666;">This code will expire in <span class="expiry">3 minutes</span>.</p>
                        <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
                        <div class="footer">
                            <p>© 2026 InterviewAI. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, title, message, otp);
    }

    private String buildForgotPasswordEmailHtml(String otp) {
        return String.format("""
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #dc3545; }
                        .header h1 { color: #333; margin: 0; }
                        .otp-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #dc3545; }
                        .otp-code { font-size: 36px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 10px 0; }
                        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #888; }
                        .expiry { color: #dc3545; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                        </div>
                        <p style="font-size: 16px; color: #333;">You requested to reset your password. Use the OTP below to proceed:</p>
                        <div class="otp-box">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                            <div class="otp-code">%s</div>
                        </div>
                        <p style="font-size: 14px; color: #666;">This OTP will expire in <span class="expiry">3 minutes</span>.</p>
                        <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email and ensure your account is secure.</p>
                        <div class="footer">
                            <p>© 2026 InterviewAI. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, otp);
    }

    private String buildUpdateEmailHtml(String otp) {
        return String.format("""
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745; }
                        .header h1 { color: #333; margin: 0; }
                        .otp-box { background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #28a745; }
                        .otp-code { font-size: 36px; font-weight: bold; color: #28a745; letter-spacing: 5px; margin: 10px 0; }
                        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #888; }
                        .expiry { color: #dc3545; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📧 Email Update Request</h1>
                        </div>
                        <p style="font-size: 16px; color: #333;">You requested to update your email address. Use the OTP below to verify:</p>
                        <div class="otp-box">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                            <div class="otp-code">%s</div>
                        </div>
                        <p style="font-size: 14px; color: #666;">This OTP will expire in <span class="expiry">3 minutes</span>.</p>
                        <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
                        <div class="footer">
                            <p>© 2026 InterviewAI. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, otp);
    }

    @PostConstruct
    public void init() {
        this.log = loggerFactory.getLogger(getClass());
        log.info("🚀 EmailService initialized successfully!");
        log.info("📧 From email: {}", fromEmail);
        log.info("✅ MailSender is {}", mailSender != null ? "configured" : "❌ NOT CONFIGURED!");

        if (mailSender != null) {
            log.info("✅ JavaMailSender bean is available");
        } else {
            log.error("❌ JavaMailSender bean is NULL! Email service will not work.");
        }
    }
}