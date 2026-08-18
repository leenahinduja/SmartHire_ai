package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.exceptions.EmailAlreadyExistsException;
import com.cs.SmartHireAi.exceptions.EmailInvalidException;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:4200")

public class AuthController {

    @Autowired AuthService authService;

    // POST /auth/register
    // Body: { "name": "...", "email": "...", "password": "...", "role": "APPLICANT|RECRUITER" }
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            authService.register(user);
            return ResponseEntity.ok(Map.of("message", "Registered successfully"));
        } catch (EmailInvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (EmailAlreadyExistsException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // GET /auth/users
    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {
        return authService.getUsers();
    }

    // POST /auth/forget-password
    // Body: { "email": "..." }
    @PostMapping("/forget-password")
    public ResponseEntity<?> forgetPassword(@RequestBody Map<String, String> body) {
        try {
            authService.forgetPassword(body);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        } catch (EmailInvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // POST /auth/valid-token
    // Body: { "token": "..." }
    @PostMapping("/valid-token")
    public ResponseEntity<?> validToken(@RequestBody Map<String, String> body) {
        if (authService.isTokenValid(body.get("token"))) {
            return ResponseEntity.ok(Map.of("message", "Token is valid"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Token expired or invalid"));
    }

    // POST /auth/update-password
    // Body: { "token": "...", "password": "..." }
    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody Map<String, String> data) {
        if (authService.updatePassword(data)) {
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Token expired or invalid"));
    }

    @GetMapping("/test-db")
    public ResponseEntity<?> testDb() {
        return ResponseEntity.ok(Map.of("message", "Database connected successfully"));
    }
}
