CREATE DATABASE IF NOT EXISTS smarthire_ai;
USE smarthire_ai;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150),
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255),
    role ENUM('APPLICANT','RECRUITER'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applicant_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    phone VARCHAR(15),
    education TEXT,
    skills TEXT,
    github_link VARCHAR(255),
    linkedin_link VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    ats_score INT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE recruiter_profiles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    company_name VARCHAR(255),
    company_website VARCHAR(255),
    designation VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE resumes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    resume_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

	CREATE TABLE jobs (
		id BIGINT PRIMARY KEY AUTO_INCREMENT,
		recruiter_id BIGINT,
		title VARCHAR(255),
		description TEXT,
		required_skills TEXT,
		location VARCHAR(150),
		salary_range VARCHAR(100),
		job_type VARCHAR(100),
		deadline DATE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (recruiter_id) REFERENCES users(id)
	);
    

CREATE TABLE applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT,
    applicant_id BIGINT,
    round1_status ENUM('PENDING','SELECTED','REJECTED') DEFAULT 'PENDING',
    round2_status ENUM('PENDING','SELECTED','REJECTED') DEFAULT 'PENDING',
    round3_status ENUM('PENDING','SELECTED','REJECTED') DEFAULT 'PENDING',
    round4_status ENUM('PENDING','SELECTED','REJECTED') DEFAULT 'PENDING',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE ats_scores (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    applicant_id BIGINT,
    job_id BIGINT,
    score INT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE mcq_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT,
    duration_minutes INT,
    total_marks INT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
ALTER TABLE mcq_tests
ADD start_time datetime;

ALTER TABLE mcq_tests
ADD end_time datetime;

ALTER TABLE mcq_tests
ADD is_released TINYINT(1) default 0;

Select * from mcq_tests;

CREATE TABLE mcq_questions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    test_id BIGINT,
    question TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    option_d TEXT,
    correct_option CHAR(1),
    FOREIGN KEY (test_id) REFERENCES mcq_tests(id)
);

CREATE TABLE mcq_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    applicant_id BIGINT,
    test_id BIGINT,
    score INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES mcq_tests(id)
);

CREATE TABLE coding_tests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT,
    problem_statement TEXT,
    duration_minutes INT,
    created_by BIGINT,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE coding_submissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    applicant_id BIGINT,
    test_id BIGINT,
    code TEXT,
    language VARCHAR(50),
    score INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (test_id) REFERENCES coding_tests(id)
);

CREATE TABLE interview_meetings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    job_id BIGINT,
    applicant_id BIGINT,
    meeting_link TEXT,
    meeting_time DATETIME,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    message TEXT,
    status ENUM('READ','UNREAD') DEFAULT 'UNREAD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE email_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient_email VARCHAR(255),
    subject VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE coding_activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id BIGINT,
    activity_type VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES coding_submissions(id)
);


	Select *
	from users;
    
    select *
    from jobs;
    
    
    Alter TABLE jobs 
    ADD active_yn int default 1;
    
    
    CREATE TABLE password_reset_tokens (
    id       BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id  BIGINT        NOT NULL,
    token    VARCHAR(255)  NOT NULL,
    expiry   DATETIME      NOT NULL,
    used_yn  TINYINT(1)    NOT NULL DEFAULT 0,

    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

DROP TABLE password_reset_tokens;

CREATE TABLE mcq_submissions (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id      BIGINT        NOT NULL,
    test_id      BIGINT        NOT NULL,
    score        INT           DEFAULT NULL,
    submitted_at TIMESTAMP     DEFAULT NULL,
    FOREIGN KEY (user_id)  REFERENCES users(id),
    FOREIGN KEY (test_id)  REFERENCES mcq_tests(id)
);

CREATE TABLE mcq_answers (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id   BIGINT  NOT NULL,
    question_id     BIGINT  NOT NULL,
    selected_option CHAR(1) NOT NULL,
    is_correct      TINYINT(1) DEFAULT 0,
    FOREIGN KEY (submission_id) REFERENCES mcq_submissions(id),
    FOREIGN KEY (question_id)   REFERENCES mcq_questions(id)
);
CREATE TABLE mcq_proctor_logs (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    submission_id BIGINT       NOT NULL,
    event_type    VARCHAR(100) NOT NULL,
    logged_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES mcq_submissions(id)
);
