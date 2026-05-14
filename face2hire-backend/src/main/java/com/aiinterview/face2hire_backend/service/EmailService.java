package com.aiinterview.face2hire_backend.service;


import com.aiinterview.face2hire_backend.entity.OtpType;
import com.aiinterview.face2hire_backend.entity.User;
import jakarta.mail.MessagingException;

public interface EmailService {
    void sendOtpToEmail(String to, String subject, String htmlMessage) throws MessagingException;

    void sendOtpByType(User user, OtpType type) throws MessagingException;

    void sendVerificationEmail(User user) throws MessagingException;

    void sendForgotPasswordOtp(User user) throws MessagingException;

    void updateEmailOtp(String email) throws MessagingException;
}
