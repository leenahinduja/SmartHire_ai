package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.AuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class UserDetailService implements UserDetailsService {

    @Autowired
    AuthRepository authRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = authRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + email);
        }

        // Role stored as APPLICANT / RECRUITER — Spring expects ROLE_ prefix
        String springRole = (user.getRole() != null && !user.getRole().isBlank())
                ? user.getRole().trim().toUpperCase()
                : "APPLICANT";

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(springRole)
                .build();
    }
}
