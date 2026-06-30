package com.peoplespriorities.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Initialises the Firebase Admin SDK on startup.
 * Falls back to Application Default Credentials when no explicit path is set.
 * Logs a warning (instead of crashing) if credentials are unavailable so the
 * app can still start in dev without Firebase configured.
 */
@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.credentials-path:}")
    private String credentialsPath;

    @PostConstruct
    public void initialize() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }
        try {
            GoogleCredentials credentials;
            if (credentialsPath != null && !credentialsPath.isBlank()) {
                try (InputStream is = new FileInputStream(credentialsPath)) {
                    credentials = GoogleCredentials.fromStream(is);
                    log.info("Firebase initialised from service account file: {}", credentialsPath);
                }
            } else {
                credentials = GoogleCredentials.getApplicationDefault();
                log.info("Firebase initialised with Application Default Credentials");
            }
            FirebaseApp.initializeApp(FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build());
            log.info("Firebase Admin SDK ready");
        } catch (IOException e) {
            log.warn("Firebase init failed — JWT auth will not work until credentials are configured. Error: {}", e.getMessage());
        }
    }
}
