package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class User {
    private Long id;
    private String name;
    private String email;
    private String password;
    private String role;   // APPLICANT | RECRUITER
    private LocalDateTime createdAt;
}
