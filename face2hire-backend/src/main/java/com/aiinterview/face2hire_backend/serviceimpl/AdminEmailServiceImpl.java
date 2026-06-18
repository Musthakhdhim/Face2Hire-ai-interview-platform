package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.dto.EmailRequestDto;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.entity.UserNotifications;
import com.aiinterview.face2hire_backend.repository.UserNotificationRepository;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.AdminEmailService;
import com.aiinterview.face2hire_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminEmailServiceImpl implements AdminEmailService {

    private final UserRepository userRepository;
    private final UserNotificationRepository notificationRepository;
    private final EmailService emailService;

    @Override
    public void sendBulkEmail(EmailRequestDto request) {
        List<User> recipients = getRecipientsByType(request.getRecipientType());
        if (recipients.isEmpty()) {
            throw new RuntimeException("No recipients found for the selected type.");
        }

        int successCount = 0;
        int failCount = 0;
        for (User user : recipients) {
            try {
                sendCustomEmail(user, request.getSubject(), request.getBody());
                successCount++;
            } catch (MessagingException | IOException e) {
                log.error("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
                failCount++;
            }
        }

        log.info("Bulk email sent: {} successful, {} failed", successCount, failCount);
        if (failCount > 0) {
            throw new RuntimeException(String.format("Email sent with %d failures out of %d recipients", failCount, recipients.size()));
        }
    }

    private List<User> getRecipientsByType(String type) {
        List<User> allUsers = userRepository.findAll();
        List<User> filtered = new ArrayList<>();

        for (User user : allUsers) {
            if (!user.isActive() || !user.isVerified()) continue;

            UserNotifications notif = user.getNotifications();
            if (notif == null) {
                continue;
            }

            switch (type.toUpperCase()) {
                case "MARKETING":
                    if (notif.isMarketingEmails()) filtered.add(user);
                    break;
                case "EMAIL_UPDATES":
                    if (notif.isEmailUpdates()) filtered.add(user);
                    break;
                case "ALL_USERS":
                    filtered.add(user);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid recipient type: " + type);
            }
        }
        return filtered;
    }

    private void sendCustomEmail(User user, String subject, String body) throws MessagingException, IOException {
        String htmlMessage = String.format("""
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="background-color: #f5f5f5; padding: 20px;">
                    <h2 style="color: #333;">%s</h2>
                    <div style="background-color: #fff; padding: 20px; border-radius: 5px;">
                        <p>%s</p>
                    </div>
                    <hr />
                    <p style="font-size: 12px; color: #888;">You received this email because you opted in to receive communications from InterviewAI.</p>
                </div>
            </body>
            </html>
        """, subject, body.replace("\n", "<br/>"));
        emailService.sendOtpToEmail(user.getEmail(), subject, htmlMessage);
    }
}