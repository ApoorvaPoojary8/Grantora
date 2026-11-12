package com.grantora.security;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) ->
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED)
                )
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/error"
                ).permitAll()

                .requestMatchers("/api/users/**").hasRole("ADMIN")

                .requestMatchers("/api/applications/me").hasRole("BENEFICIARY")
                .requestMatchers("/api/applications/admin").hasRole("ADMIN")
                .requestMatchers("/api/applications/disbursement/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/submit")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/withdraw")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.DELETE, "/api/applications/*")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/decision")
                    .hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/escalate")
                    .hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/assignment")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/applications/*/documents")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.PATCH, "/api/applications/**")
                    .hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/applications/**")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.PUT, "/api/applications/**")
                    .hasRole("BENEFICIARY")
                .requestMatchers(HttpMethod.GET, "/api/applications")
                    .hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.GET, "/api/applications/**")
                    .hasAnyRole("ADMIN", "OFFICER", "BENEFICIARY")
                .requestMatchers("/api/applications/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/schemes/**")
                    .authenticated()

                .requestMatchers("/api/schemes/**").hasRole("ADMIN")

                .requestMatchers("/api/beneficiaries/**").authenticated()

                .requestMatchers("/api/verification/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/workflow/deadlines").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers(HttpMethod.PUT, "/api/workflow/deadlines").hasRole("ADMIN")
                .requestMatchers("/api/workflow/escalations/**").hasAnyRole("ADMIN", "OFFICER")
                .requestMatchers("/api/workflow/notifications/**").authenticated()

                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        configuration.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        );

        configuration.setAllowedHeaders(
            List.of("Authorization", "Content-Type")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter>
            jwtFilterRegistration(JwtAuthenticationFilter filter) {

        FilterRegistrationBean<JwtAuthenticationFilter> registration =
            new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }
}
