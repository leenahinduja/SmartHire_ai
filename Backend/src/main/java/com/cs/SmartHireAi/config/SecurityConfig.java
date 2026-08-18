    package com.cs.SmartHireAi.config;

    import com.cs.SmartHireAi.service.UserDetailService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;
    import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
    import org.springframework.security.config.annotation.web.builders.HttpSecurity;
    import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
    import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
    import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.security.web.SecurityFilterChain;
    import org.springframework.web.cors.CorsConfiguration;
    import org.springframework.web.cors.CorsConfigurationSource;
    import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
    import org.springframework.security.config.http.SessionCreationPolicy;

    import java.util.List;

    @Configuration
    @EnableWebSecurity
    @EnableMethodSecurity
    public class SecurityConfig {

        @Autowired
        UserDetailService userDetailService;

        @Bean
        public PasswordEncoder passwordEncoder() {
            return new BCryptPasswordEncoder();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
            DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
            provider.setUserDetailsService(userDetailService);
            provider.setPasswordEncoder(passwordEncoder());
            return provider;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http
                    .sessionManagement(session -> session
                            .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                    )
                    .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ✅ Correctly linking CORS bean
                    .authenticationProvider(authenticationProvider())
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth

                            // 🔥 VERY IMPORTANT
                            .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()

                            .requestMatchers(
                                    "/auth/register",
                                    "/auth/login",
                                    "/auth/forget-password",
                                    "/auth/valid-token",
                                    "/auth/update-password",
                                    "/test-db",
                                    "/ats/calculate",
                                    "/job/all",
                                    "/job/search",
                                    "/interview/signal/**"
                            ).permitAll()
                            .requestMatchers("/round1/**").hasRole("RECRUITER")
                            .requestMatchers("/round2/**").authenticated()
                            .requestMatchers("/job/**").authenticated()
                            .requestMatchers("/coding/**").authenticated()
                            .requestMatchers("/round3/**").authenticated()
                            .requestMatchers("/interview/**").authenticated()
                            .requestMatchers("/applicant/**").hasRole("APPLICANT")
                            .requestMatchers("/applications/**").authenticated()


                            .anyRequest().authenticated()
                    )
                    .formLogin(form -> form
                            .loginProcessingUrl("/auth/login")
                            .usernameParameter("email")
                            .passwordParameter("password")
                            .successHandler((req, res, auth) -> {
                                req.getSession(true);
                                res.setStatus(200);
                                res.setContentType("application/json");

                                var user = userDetailService.loadUserByUsername(auth.getName());

                                String role = user.getAuthorities().iterator().next().getAuthority();

                                res.getWriter().write(
                                        "{ \"message\":\"Login successful\", " +
                                                "\"email\":\"" + auth.getName() + "\", " +
                                                "\"role\":\"" + role + "\", " +
                                                "\"name\":\"" + user.getUsername() + "\" }"
                                );
                            })
                            .failureHandler((req, res, ex) -> {
                                res.setStatus(401);
                                res.setContentType("application/json");
                                res.getWriter().write("{\"message\":\"Invalid credentials\"}");
                            })
                    );

            return http.build();
        }

        // 🔥 GLOBAL CORS CONFIG (MOST IMPORTANT)
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
            CorsConfiguration config = new CorsConfiguration();

            config.setAllowedOriginPatterns(List.of("http://localhost:4200"));
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(List.of("*"));
            config.setAllowCredentials(true);

            UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
            source.registerCorsConfiguration("/**", config);

            return source;
        }
    }