package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.exceptions.EmailAlreadyExistsException;
import com.cs.SmartHireAi.exceptions.EmailInvalidException;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.AuthRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AuthService {

    @Autowired AuthRepository authRepository;
    @Autowired EmailService emailService;

    private final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // ── Register ──────────────────────────────────────────────────────────────
    public void register(User user)
            throws EmailInvalidException, EmailAlreadyExistsException {

        if (!isEmailValid(user.getEmail())) throw new EmailInvalidException();
        if (authRepository.findByEmail(user.getEmail()) != null) throw new EmailAlreadyExistsException();

        // Validate role
        String role = user.getRole();
        if (role == null || (!role.equals("APPLICANT") && !role.equals("RECRUITER"))) {
            role = "APPLICANT"; // default
        }

        authRepository.save(user.getName(), user.getEmail(),
                encoder.encode(user.getPassword()), role);
    }

    // ── List users ────────────────────────────────────────────────────────────
    public List<Map<String, Object>> getUsers() {
        return authRepository.getUsers();
    }

    // ── Forget password ───────────────────────────────────────────────────────
    public void forgetPassword(Map<String, String> body) throws EmailInvalidException {
        User user = authRepository.findByEmail(body.get("email"));
        if (user == null) throw new EmailInvalidException();

        Map<?, ?> existing = authRepository.checkTokenExistsForEmail(body.get("email"));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(15);

        if (existing == null) {
            authRepository.saveResetToken(UUID.randomUUID().toString(), user.getId(), expiry);
        } else {
            authRepository.updateTokenExpiry(user.getId(), expiry);
        }

        Map<?, ?> tokenRow = authRepository.getTokenByUserId(user.getId());
        emailService.sendPasswordResetEmail(user.getEmail(), (String) tokenRow.get("token"));
    }

    // ── Validate token ────────────────────────────────────────────────────────
    public boolean isTokenValid(String token) {
        return authRepository.findValidToken(token) != null;
    }

    // ── Update password ───────────────────────────────────────────────────────
    public boolean updatePassword(Map<String, String> data) {
        Map<String, Object> tokenRow = authRepository.findValidToken(data.get("token"));
        if (tokenRow == null) return false;

        Long userId = ((Number) tokenRow.get("user_id")).longValue();
        authRepository.updatePassword(encoder.encode(data.get("password")), data.get("token"), userId);
        return true;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private boolean isEmailValid(String email) {
        if (email == null) return false;
        Pattern p = Pattern.compile("^[A-Za-z0-9_+.]+@[A-Za-z0-9_+.]+\\.[a-z]{2,}$");
        Matcher m = p.matcher(email);
        return m.matches();
    }
}
