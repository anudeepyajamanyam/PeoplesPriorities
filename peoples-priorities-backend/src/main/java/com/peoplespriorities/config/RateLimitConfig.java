package com.peoplespriorities.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token-bucket based rate limiter protecting submission endpoints from abuse.
 *
 * <p>Uses an in-memory {@link ConcurrentHashMap} keyed by client IP. Each IP gets
 * a sliding-window bucket of 10 requests per 60 seconds. This avoids a Redis round-trip
 * per request — acceptable given rate-limit state can be lost on restart (stateless pods
 * are safe since the attack surface is short-lived anyway).
 *
 * <p>For true distributed rate limiting across pods, replace the in-memory bucket map
 * with a Redis-backed implementation using Redisson {@code RRateLimiter}.
 */
@Configuration
@Slf4j
public class RateLimitConfig {

    private static final int MAX_REQUESTS = 10;
    private static final long WINDOW_MS = 60_000L;

    /**
     * Rate-limit filter bean registered in {@link SecurityConfig}.
     *
     * @return a {@link OncePerRequestFilter} that enforces per-IP request limits
     *         on the {@code /api/submissions/**} path.
     */
    @Bean
    public OncePerRequestFilter submissionRateLimitFilter() {
        return new SubmissionRateLimitFilter(MAX_REQUESTS, WINDOW_MS);
    }

    /**
     * Inner filter implementing sliding-window token bucket logic per client IP.
     */
    static class SubmissionRateLimitFilter extends OncePerRequestFilter {

        private final int maxRequests;
        private final long windowMs;
        private final Map<String, long[]> buckets = new ConcurrentHashMap<>();

        SubmissionRateLimitFilter(int maxRequests, long windowMs) {
            this.maxRequests = maxRequests;
            this.windowMs = windowMs;
        }

        @Override
        protected boolean shouldNotFilter(HttpServletRequest request) {
            // Only rate-limit POST requests to citizen submission endpoints
            return !request.getMethod().equalsIgnoreCase("POST") ||
                   !request.getRequestURI().startsWith("/api/submissions/");
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {
            String clientIp = extractClientIp(request);
            long now = System.currentTimeMillis();

            long[] bucket = buckets.compute(clientIp, (ip, existing) -> {
                if (existing == null) {
                    // [windowStart, count]
                    return new long[]{now, 1};
                }
                if (now - existing[0] > windowMs) {
                    // Window expired — reset
                    existing[0] = now;
                    existing[1] = 1;
                } else {
                    existing[1]++;
                }
                return existing;
            });

            if (bucket[1] > maxRequests) {
                log.warn("Rate limit exceeded for IP: {} ({} requests in window)", clientIp, bucket[1]);
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                    "{\"error\":\"Too many requests. Please wait before submitting again.\",\"retryAfterSeconds\":60}"
                );
                return;
            }

            filterChain.doFilter(request, response);
        }

        private String extractClientIp(HttpServletRequest request) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
            return request.getRemoteAddr();
        }
    }
}
