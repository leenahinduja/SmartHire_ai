package com.cs.SmartHireAi.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String token) {
        String html = String.format("""
    <h2>SmartHire AI – Password Reset</h2>
    <p>Click the link below to reset your password (expires in 15 minutes):</p>
    <a href="http://localhost:4200/reset-password?token=%s">Reset Password</a>
    """, token);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Reset Password – SmartHire AI");
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendNotificationEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    public void sendEmailWithAttachment(String to, String subject, String body, String filename, byte[] attachmentBytes, String contentType) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            helper.addAttachment(filename, new org.springframework.core.io.ByteArrayResource(attachmentBytes), contentType);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email with attachment: " + e.getMessage());
        }
    }
}
