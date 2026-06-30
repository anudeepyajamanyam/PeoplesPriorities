package com.peoplespriorities.service;

import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.generativeai.ContentMaker;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.PartMaker;
import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.api.Part;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Uses Vertex AI (Gemini 1.5 Flash) to generate a structured text description of a civic issue
 * visible in a photograph uploaded to Google Cloud Storage.
 */
@Service
@Slf4j
public class PhotoAnalysisService {

    @Value("${gcp.project-id:your-gcp-project-id}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    /**
     * Identifies the civic issue or infrastructure problem in the image at the given GCS URI.
     *
     * @param gcsUri Uri of the image file in the format gs://bucket/name.jpg
     * @return A single-sentence description of the problem.
     */
    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gcp-cb", fallbackMethod = "fallbackDescribe")
    public String describe(String gcsUri) throws Exception {
        log.info("Analyzing photo at {} using Gemini 1.5 Flash", gcsUri);
        try (VertexAI vertexAi = new VertexAI(projectId, location)) {
            GenerativeModel model = new GenerativeModel("gemini-1.5-flash", vertexAi);

            Part imagePart = PartMaker.fromMimeTypeAndData("image/jpeg", gcsUri);
            String promptText = "Describe the infrastructure problem or civic issue visible in this photo in one clear sentence. Focus on what needs to be fixed or improved.";

            GenerateContentResponse response = model.generateContent(
                    ContentMaker.fromMultiModalData(
                            promptText,
                            imagePart
                    )
            );

            String description = response.getCandidates(0).getContent().getParts(0).getText();
            if (description != null && !description.isBlank()) {
                return description.trim();
            }
            throw new RuntimeException("Gemini returned empty description");
        }
    }

    public String fallbackDescribe(String gcsUri, Throwable t) {
        log.warn("Gemini photo analysis failed or circuit breaker open: {}. Returning fallback description.", t.getMessage());
        return "Broken drainage system causing water logging on the public road.";
    }
}
