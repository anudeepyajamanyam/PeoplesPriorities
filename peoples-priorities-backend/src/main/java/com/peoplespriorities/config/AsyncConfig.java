package com.peoplespriorities.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configures the dedicated async thread pool used exclusively for the AI processing pipeline.
 *
 * <p>Using a separate executor (rather than the default Spring async executor) provides:
 * <ul>
 *   <li>Bounded concurrency — prevents GCP API call fan-out from exhausting the JVM thread pool.</li>
 *   <li>Back-pressure — a bounded queue causes callers to block when the pool is saturated,
 *       giving the DB a chance to breathe under burst load.</li>
 *   <li>Observability — all AI tasks share a named prefix visible in thread dumps.</li>
 * </ul>
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncConfig {

    @Value("${async.ai-executor.core-pool-size:10}")
    private int corePoolSize;

    @Value("${async.ai-executor.max-pool-size:50}")
    private int maxPoolSize;

    @Value("${async.ai-executor.queue-capacity:500}")
    private int queueCapacity;

    @Value("${async.ai-executor.thread-name-prefix:ai-task-}")
    private String threadNamePrefix;

    /**
     * Task executor bean wired explicitly by name in {@code @Async("ai-task-executor")}.
     *
     * @return configured {@link ThreadPoolTaskExecutor}
     */
    @Bean("ai-task-executor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix(threadNamePrefix);
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        log.info("AI Task Executor initialized: core={}, max={}, queue={}",
                corePoolSize, maxPoolSize, queueCapacity);
        return executor;
    }
}
