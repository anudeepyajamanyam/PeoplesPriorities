package com.peoplespriorities.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activates Spring's {@code @Scheduled} support for the AI orchestration job.
 */
@Configuration
@EnableScheduling
public class SchedulerConfig {
}
