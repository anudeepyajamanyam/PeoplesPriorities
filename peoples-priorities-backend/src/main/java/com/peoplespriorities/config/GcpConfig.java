package com.peoplespriorities.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.cloud.translate.Translate;
import com.google.cloud.translate.TranslateOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

/**
 * Provides GCP client beans.
 * Services that need Vertex AI or Speech create their own short-lived clients
 * (recommended pattern for thread safety). Storage and Translate are long-lived
 * singletons provided here.
 */
@Configuration
@Slf4j
public class GcpConfig {

    @Value("${gcp.project-id:}")
    private String projectId;

    @Bean
    public GoogleCredentials googleCredentials() {
        try {
            return GoogleCredentials.getApplicationDefault();
        } catch (IOException e) {
            log.warn("GCP Application Default Credentials not found: {}. Cloud services will be unavailable.", e.getMessage());
            return null;
        }
    }

    @Bean
    public Storage gcpStorage(GoogleCredentials credentials) {
        if (credentials == null) {
            return StorageOptions.getDefaultInstance().getService();
        }
        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }

    @Bean
    public Translate gcpTranslate(GoogleCredentials credentials) {
        if (credentials == null) {
            return TranslateOptions.getDefaultInstance().getService();
        }
        return TranslateOptions.newBuilder()
                .setCredentials(credentials)
                .build()
                .getService();
    }
}
