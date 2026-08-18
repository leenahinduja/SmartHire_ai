package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.exceptions.UserDoesNotExistException;
import com.cs.SmartHireAi.model.ApplicantProfile;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.ApplicantProfileRepository;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.ResumeRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.regex.*;

@Service
public class ApplicantProfileService {

    @Autowired ApplicantProfileRepository profileRepo;
    @Autowired AuthRepository authRepo;
    @Autowired ResumeRepository resumeRepo;

    // ── Save profile ──────────────────────────────────────────────────────────
    public void saveProfile(ApplicantProfile profile, Authentication auth) {
        User user = authRepo.findByEmail(auth.getName());
        if (user == null) throw new UserDoesNotExistException();
        profile.setUserId(user.getId());
        profileRepo.save(profile);
    }

    // ── Update profile ────────────────────────────────────────────────────────
    public void updateProfile(ApplicantProfile profile, Authentication auth) {
        User user = authRepo.findByEmail(auth.getName());
        if (user == null) throw new UserDoesNotExistException();
        profile.setUserId(user.getId());
        profileRepo.update(profile);
    }

    // ── Get profile ───────────────────────────────────────────────────────────
    public ApplicantProfile getProfile(Authentication auth) {
        User user = authRepo.findByEmail(auth.getName());
        if (user == null) throw new UserDoesNotExistException();
        return profileRepo.findByUserId(user.getId());
    }

    // ── Upload resume (saves to disk + resumes table) ─────────────────────────
    public String uploadResume(MultipartFile file, Authentication auth) throws IOException {
        User user = authRepo.findByEmail(auth.getName());
        if (user == null) throw new UserDoesNotExistException();

        if (file.isEmpty()) throw new RuntimeException("File is empty");
        if (!"application/pdf".equals(file.getContentType()))
            throw new RuntimeException("Only PDF files are allowed");

        String uploadDir = "uploads/resumes/";
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, file.getBytes());

        String fileUrl = filePath.toString();
        resumeRepo.save(user.getId(), fileUrl);

        // Auto-populate applicant_profiles.skills from parsed resume
        try {
            String text = extractText(file);
            Map<String, String> parsed = parseResume(text);
            ApplicantProfile existing = profileRepo.findByUserId(user.getId());
            if (existing != null) {
                existing.setSkills(parsed.getOrDefault("skills", existing.getSkills()));
                existing.setGithubLink(parsed.getOrDefault("github_url", existing.getGithubLink()));
                existing.setLinkedinLink(parsed.getOrDefault("linkedin_url", existing.getLinkedinLink()));
                profileRepo.update(existing);
            }
        } catch (Exception ignored) {
            // Parsing failure should not block the upload
        }

        return fileUrl;
    }

    // ── PDF text extraction ───────────────────────────────────────────────────
    private String extractText(MultipartFile file) throws IOException {
        PDDocument document = PDDocument.load(file.getInputStream());
        String text = new PDFTextStripper().getText(document);
        document.close();
        return text;
    }

    // ── Resume parser (kept from original) ───────────────────────────────────
    private Map<String, String> parseResume(String text) {
        Map<String, String> data = new HashMap<>();
        data.put("email", extractByRegex(text, "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"));
        data.put("phone", extractByRegex(text, "\\b\\d{10}\\b"));

        String linkedin = extractByRegex(text, "https?://(www\\.)?linkedin\\.com/in/[a-zA-Z0-9_-]+");
        data.put("linkedin_url", linkedin.isEmpty() ? "" : linkedin);

        String github = extractByRegex(text, "https?://(www\\.)?github\\.com/[a-zA-Z0-9_-]+");
        data.put("github_url", github.isEmpty() ? "" : github);

        data.put("skills", extractSection(text, List.of(
                "Skills", "Technical Skills", "Key Skills", "Core Skills",
                "Professional Skills", "Technical Expertise", "Competencies")));

        return data;
    }

    private String extractByRegex(String text, String regex) {
        Matcher m = Pattern.compile(regex).matcher(text);
        return m.find() ? m.group() : "";
    }

    private String extractSection(String text, List<String> sectionNames) {
        String lower = text.toLowerCase();
        int start = -1;
        for (String s : sectionNames) {
            start = lower.indexOf(s.toLowerCase());
            if (start != -1) break;
        }
        if (start == -1) return "";
        int end = text.length();
        for (String next : List.of("Education", "Experience", "Projects", "Skills",
                "Achievements", "Summary", "Tools", "Frameworks")) {
            int idx = lower.indexOf(next.toLowerCase(), start + 10);
            if (idx != -1 && idx < end) end = idx;
        }
        return text.substring(start, end).trim();
    }
}
