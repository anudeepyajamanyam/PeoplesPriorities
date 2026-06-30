package com.peoplespriorities.event;

import com.peoplespriorities.model.Submission;
import com.peoplespriorities.repository.SubmissionRepository;
import com.peoplespriorities.service.AIOrchestrationJob;
import com.peoplespriorities.service.PhotoAnalysisService;
import com.peoplespriorities.service.SpeechIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Async event listener that drives the post-submission AI processing pipeline.
 *
 * <p>Runs on the dedicated {@code ai-task-executor} thread pool so that the main
 * HTTP servlet threads are never blocked by GCP API latency. The pipeline:
 * <ol>
 *   <li>For {@code voice}: transcribe audio from GCS and persist transcript.</li>
 *   <li>For {@code photo}: describe image using Gemini Vision and persist description.</li>
 *   <li>For all types: if pending submissions ≥ 5, trigger theme clustering + priority ranking.</li>
 * </ol>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SubmissionEventListener {

    private static final int CLUSTERING_THRESHOLD = 1;

    private final SubmissionRepository submissionRepository;
    private final SpeechIngestionService speechIngestionService;
    private final PhotoAnalysisService photoAnalysisService;
    private final AIOrchestrationJob aiOrchestrationJob;

    /**
     * Handles post-submission AI enrichment asynchronously.
     *
     * <p>This method intentionally does not propagate exceptions to the event publisher —
     * failures are logged and the submission remains in {@code pending} status for the
     * scheduled fallback job to pick up on its next run.
     *
     * @param event the {@link SubmissionCreatedEvent} published by {@link com.peoplespriorities.service.SubmissionService}
     */
    @EventListener
    @Async("ai-task-executor")
    @Transactional
    public void handleSubmissionCreated(SubmissionCreatedEvent event) {
        log.info("[async] Processing submission {} (type={}, constituency={})",
                event.getSubmissionId(), event.getSubmissionType(), event.getConstituencyId());

        try {
            enrichSubmissionIfNeeded(event);
            triggerClusteringIfThresholdMet(event.getConstituencyId());
        } catch (Exception ex) {
            log.error("[async] AI pipeline failed for submission {}: {}",
                    event.getSubmissionId(), ex.getMessage(), ex);
            // Submission stays in 'pending' — scheduled AIOrchestrationJob will retry
        }
    }

    /**
     * Enriches voice and photo submissions with their AI-generated text content.
     *
     * @param event the submission event carrying type and ID context
     */
    private void enrichSubmissionIfNeeded(SubmissionCreatedEvent event) throws Exception {
        if ("voice".equals(event.getSubmissionType()) || "photo".equals(event.getSubmissionType())) {
            Submission submission = submissionRepository.findById(event.getSubmissionId())
                    .orElse(null);

            if (submission == null) {
                log.warn("[async] Submission {} not found in DB for enrichment — skipping", event.getSubmissionId());
                return;
            }

            if ("voice".equals(event.getSubmissionType()) && submission.getGcsUri() != null) {
                String language = submission.getLanguageDetected() != null ? submission.getLanguageDetected() : "en-IN";
                String transcript = speechIngestionService.transcribe(submission.getGcsUri(), language);

                String translated = transcript;
                if (!"en".equalsIgnoreCase(language) && !language.startsWith("en")) {
                    translated = speechIngestionService.translateToEnglish(transcript, language);
                }

                submission.setRawContent(transcript);
                submission.setTranslatedContent(translated);
                submissionRepository.save(submission);
                log.info("[async] Voice submission {} enriched with transcript ({} chars)", event.getSubmissionId(), transcript.length());

            } else if ("photo".equals(event.getSubmissionType()) && submission.getGcsUri() != null) {
                String description = photoAnalysisService.describe(submission.getGcsUri());
                submission.setRawContent(description);
                submission.setTranslatedContent(description);
                submissionRepository.save(submission);
                log.info("[async] Photo submission {} enriched with AI description ({} chars)", event.getSubmissionId(), description.length());
            }
        }
    }

    /**
     * Triggers the AI clustering pipeline for the constituency when enough pending
     * submissions have accumulated, providing near-real-time theme updates.
     *
     * @param constituencyId constituency to evaluate
     */
    private void triggerClusteringIfThresholdMet(String constituencyId) {
        long pendingCount = submissionRepository
                .findByConstituencyIdAndStatus(constituencyId, "pending")
                .size();

        if (pendingCount >= CLUSTERING_THRESHOLD) {
            log.info("[async] {} pending submissions in {} — triggering AI clustering pipeline",
                    pendingCount, constituencyId);
            aiOrchestrationJob.runPipelineForConstituency(constituencyId);
        } else {
            log.debug("[async] Only {} pending submissions in {} — clustering deferred (threshold: {})",
                    pendingCount, constituencyId, CLUSTERING_THRESHOLD);
        }
    }
}
