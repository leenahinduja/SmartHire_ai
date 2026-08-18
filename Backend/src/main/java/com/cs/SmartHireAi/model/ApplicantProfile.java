    package com.cs.SmartHireAi.model;

    import lombok.Getter;
    import lombok.Setter;

    @Getter @Setter
    public class ApplicantProfile {
        private Long id;
        private Long userId;
        private String phone;
        private String education;
        private String skills;
        private String githubLink;
        private String linkedinLink;
        private String address;
        private String city;
        private String state;
        private String country;
        private Integer atsScore;
    }
