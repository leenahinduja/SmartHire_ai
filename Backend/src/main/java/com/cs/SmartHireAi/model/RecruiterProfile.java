package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class RecruiterProfile {
    private Long id;
    private Long userId;
    private String companyName;
    private String companyWebsite;
    private String designation;
}
