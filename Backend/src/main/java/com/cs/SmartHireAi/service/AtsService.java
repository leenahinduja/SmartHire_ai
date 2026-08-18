package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.AtsResponse;
import com.cs.SmartHireAi.repository.ApplicantProfileRepository;
import com.cs.SmartHireAi.repository.AtsScoreRepository;
import com.cs.SmartHireAi.utils.ResumeParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AtsService {

    private final ApplicantProfileRepository applicantProfileRepo;
    private final AtsScoreRepository atsScoreRepo;

    public AtsResponse calculateATS(MultipartFile resume, String jobDescription,
                                    Long applicantId, Long jobId) throws Exception {

        InputStream is = resume.getInputStream();
        String resumeText = (resume.getOriginalFilename() != null
                && resume.getOriginalFilename().endsWith(".pdf"))
                ? ResumeParser.parsePDF(is)
                : ResumeParser.parseDOCX(is);

        resumeText = resumeText.toLowerCase();
        jobDescription = jobDescription.toLowerCase();

        Set<String> resumeWords = new HashSet<>(Arrays.asList(resumeText.split("\\W+")));
        String[] jobWords = jobDescription.split("\\W+");

        List<String> missingSkills = new ArrayList<>();
        int matched = 0;
        for (String word : jobWords) {
            if (resumeWords.contains(word)) matched++;
            else missingSkills.add(word);
        }

        int score = (int) ((matched * 100.0) / jobWords.length);

        // Save per-job ATS score to ats_scores table
        atsScoreRepo.save(applicantId, jobId, score);

        // Also update the general ats_score in applicant_profiles
        applicantProfileRepo.updateAtsScore(applicantId, score);

        return new AtsResponse(score, missingSkills, generateSuggestions(missingSkills));
    }

    private String generateSuggestions(List<String> missing) {
        if (missing.isEmpty()) return "Excellent resume match!";
        return "Add these keywords to improve your ATS score: " + String.join(", ", missing);
    }
}
