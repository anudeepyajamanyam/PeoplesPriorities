package com.peoplespriorities.config;

import com.peoplespriorities.health.GcpHealthIndicator;
import com.peoplespriorities.security.FirebaseTokenFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Stateless JWT-based security configuration.
 * Citizens may submit and view priorities without authentication.
 * MP-specific approve/flag endpoints require a valid Firebase JWT.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           OncePerRequestFilter submissionRateLimitFilter) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public read endpoints
                .requestMatchers("GET",  "/api/priorities/**").permitAll()
                .requestMatchers("GET",  "/api/priorities/export").permitAll()
                .requestMatchers("GET",  "/api/themes/**").permitAll()
                .requestMatchers("GET",  "/api/dashboard/stats").permitAll()
                .requestMatchers("GET",  "/api/constituencies/**").permitAll()
                // Public submission endpoints (rate limited by filter above)
                .requestMatchers("POST", "/api/submissions/**").permitAll()
                .requestMatchers("POST", "/api/priorities/*/upvote").permitAll()
                .requestMatchers("POST", "/api/dashboard/admin/**").permitAll()
                // OpenAPI docs
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Actuator (health/prometheus exposed publicly; sensitive ops authenticated)
                .requestMatchers("/actuator/health/**", "/actuator/prometheus", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").authenticated()
                // Protected MP actions
                .requestMatchers("/api/priorities/*/approve").authenticated()
                .requestMatchers("/api/priorities/*/flag").authenticated()
                .anyRequest().authenticated()
            )
            // Rate limiter runs before Firebase auth filter
            .addFilterBefore(submissionRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new FirebaseTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }
}
