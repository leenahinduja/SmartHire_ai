package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public class AuthRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    // ── Register ──────────────────────────────────────────────────────────────
    public void save(String name, String email, String password, String role) {
        String sql = """
                INSERT INTO users (name, email, password, role, created_at)
                VALUES (?, ?, ?, ?, NOW())
                """;
        jdbcTemplate.update(sql, name, email, password, role);
    }

    // ── Find by email ─────────────────────────────────────────────────────────
    public User findByEmail(String email) {
        String sql = "SELECT * FROM users WHERE email = ?";
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rn) -> {
                User u = new User();
                u.setId(rs.getLong("id"));
                u.setName(rs.getString("name"));
                u.setEmail(rs.getString("email"));
                u.setPassword(rs.getString("password"));
                u.setRole(rs.getString("role"));
                return u;
            }, email);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // ── Find by id ────────────────────────────────────────────────────────────
    public User findById(Long id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rn) -> {
                User u = new User();
                u.setId(rs.getLong("id"));
                u.setName(rs.getString("name"));
                u.setEmail(rs.getString("email"));
                u.setPassword(rs.getString("password"));
                u.setRole(rs.getString("role"));
                return u;
            }, id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // ── All active users ──────────────────────────────────────────────────────
    public List<Map<String, Object>> getUsers() {
        return jdbcTemplate.queryForList(
                "SELECT id, name, email, role, created_at FROM users");
    }

    // ── Password reset token (stored in password_reset_tokens if you add it) ─
    // Using a simple inline table approach: password_reset_tokens
    // schema: id, user_id, token, expiry, used_yn
    public void saveResetToken(String token, Long userId, LocalDateTime expiry) {
        String sql = """
                INSERT INTO password_reset_tokens (user_id, token, expiry, used_yn)
                VALUES (?, ?, ?, 0)
                """;
        jdbcTemplate.update(sql, userId, token, expiry);
    }

    public Map<String, Object> findValidToken(String token) {
        String sql = """
                SELECT * FROM password_reset_tokens
                WHERE token = ? AND expiry > NOW() AND used_yn = 0
                """;
        try {
            return jdbcTemplate.queryForMap(sql, token);
        } catch (Exception e) {
            return null;
        }
    }

    public Map<String, Object> checkTokenExistsForEmail(String email) {
        String sql = """
                SELECT prt.user_id FROM users u
                INNER JOIN password_reset_tokens prt ON u.id = prt.user_id
                WHERE u.email = ? AND prt.used_yn = 0
                LIMIT 1
                """;
        try {
            return jdbcTemplate.queryForMap(sql, email);
        } catch (Exception e) {
            return null;
        }
    }

    public void updateTokenExpiry(Long userId, LocalDateTime expiry) {
        jdbcTemplate.update(
                "UPDATE password_reset_tokens SET expiry = ? WHERE user_id = ? AND used_yn = 0",
                expiry, userId);
    }

    public Map<String, Object> getTokenByUserId(Long userId) {
        return jdbcTemplate.queryForMap(
                "SELECT token FROM password_reset_tokens WHERE user_id = ? AND used_yn = 0 ORDER BY id DESC LIMIT 1",
                userId);
    }

    public void updatePassword(String hashedPassword, String token, Long userId) {
        jdbcTemplate.update("UPDATE users SET password = ? WHERE id = ?", hashedPassword, userId);
        jdbcTemplate.update(
                "UPDATE password_reset_tokens SET used_yn = 1 WHERE token = ? AND user_id = ?",
                token, userId);
    }
}
