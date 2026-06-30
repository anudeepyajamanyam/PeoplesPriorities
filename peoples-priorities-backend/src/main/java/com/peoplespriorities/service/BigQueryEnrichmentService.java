package com.peoplespriorities.service;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.TableResult;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service to fetch demographic data and existing infrastructure context for
 * a constituency ward from Google Cloud BigQuery.
 */
@Service
@Slf4j
public class BigQueryEnrichmentService {

    @Data
    @Builder
    public static class WardContext {
        private int population;
        private String existingInfraNote;
    }

    /**
     * Queries the BigQuery table `peoples_priorities.ward_demographics` for context.
     * Falls back to a mock data set if the query fails or is not configured.
     */
    public WardContext getWardContext(String constituencyId, String ward) {
        log.info("Fetching demographic context from BigQuery for constituency: {} ward: {}", constituencyId, ward);
        
        String query = String.format(
                "SELECT population, existing_infra_note FROM `peoples_priorities.ward_demographics` " +
                "WHERE constituency_id = '%s' AND ward_name = '%s' LIMIT 1",
                constituencyId, ward != null ? ward.replace("'", "\\'") : ""
        );

        try {
            BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
            QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query).build();
            TableResult results = bigquery.query(queryConfig);

            for (FieldValueList row : results.iterateAll()) {
                int population = (int) row.get("population").getLongValue();
                String note = row.get("existing_infra_note").getStringValue();
                return WardContext.builder()
                        .population(population)
                        .existingInfraNote(note)
                        .build();
            }
        } catch (Exception e) {
            log.warn("BigQuery demographic lookup failed: {}. Using demo fallback.", e.getMessage());
        }

        // Demo Fallback
        int pop = 50000;
        String note = "No recent development recorded";
        if (ward != null) {
            if (ward.toLowerCase().contains("vidyaranyapura")) {
                pop = 68000;
                note = "Vidyaranyapura school zone has double-lane layout but water logging remains unresolved.";
            } else if (ward.toLowerCase().contains("hebbal")) {
                pop = 95000;
                note = "Hebbal traffic junctions are overloaded; drainage pipelines are over 15 years old.";
            } else if (ward.toLowerCase().contains("yelahanka")) {
                pop = 120000;
                note = "Primary health center building exists but lacks equipment and medical officers.";
            }
        }

        return WardContext.builder()
                .population(pop)
                .existingInfraNote(note)
                .build();
    }
}
