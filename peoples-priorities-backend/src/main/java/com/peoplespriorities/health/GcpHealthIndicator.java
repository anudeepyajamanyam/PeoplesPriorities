package com.peoplespriorities.health;

import com.google.cloud.storage.Storage;
import com.google.cloud.translate.Translate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

/**
 * Custom Spring Actuator HealthIndicator verifying connectivity to Google Cloud Services.
 *
 * <p>Pings GCS and Cloud Translation APIs to verify that credentials are valid and
 * network routes are open. Exposed via {@code /actuator/health}.
 */
@Component
@RequiredArgsConstructor
public class GcpHealthIndicator implements HealthIndicator {

    private final Storage storage;
    private final Translate translate;

    @Override
    public Health health() {
        Health.Builder builder = Health.up();
        boolean up = true;

        // Check Google Cloud Storage
        try {
            if (storage != null) {
                storage.list(Storage.BucketListOption.pageSize(1));
                builder.withDetail("storage", "UP");
            } else {
                builder.withDetail("storage", "UNAVAILABLE (Client is null)");
                up = false;
            }
        } catch (Exception e) {
            builder.withDetail("storage", "DOWN (" + e.getMessage() + ")");
            up = false;
        }

        // Check Google Cloud Translation
        try {
            if (translate != null) {
                translate.listSupportedLanguages(Translate.LanguageListOption.targetLanguage("en"));
                builder.withDetail("translate", "UP");
            } else {
                builder.withDetail("translate", "UNAVAILABLE (Client is null)");
                up = false;
            }
        } catch (Exception e) {
            builder.withDetail("translate", "DOWN (" + e.getMessage() + ")");
            up = false;
        }

        return up ? builder.build() : builder.down().build();
    }
}
