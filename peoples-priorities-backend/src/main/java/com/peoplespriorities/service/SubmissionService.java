package com.peoplespriorities.service;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.peoplespriorities.dto.SubmissionRequest;
import com.peoplespriorities.dto.SubmissionResponse;
import com.peoplespriorities.event.SubmissionCreatedEvent;
import com.peoplespriorities.exception.AppException;
import com.peoplespriorities.model.Constituency;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.repository.ConstituencyRepository;
import com.peoplespriorities.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Service orchestrating the ingestion of text, voice, and photo submissions.
 *
 * <p><b>Async pipeline design</b>: This service is responsible only for fast I/O:
 * persisting submission metadata and uploading binary files to GCS. After saving,
 * it publishes a {@link SubmissionCreatedEvent} that triggers all AI processing
 * (transcription, photo analysis, clustering) on a dedicated thread pool.
 * HTTP response times are therefore O(DB write + GCS upload), not O(Gemini call).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ConstituencyRepository constituencyRepository;
    private final Storage storage;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${gcp.gcs.audio-bucket:peoples-priorities-audio}")
    private String audioBucket;

    @Value("${gcp.gcs.photo-bucket:peoples-priorities-photos}")
    private String photoBucket;

    /**
     * Handles text suggestions. Persists the submission immediately and publishes
     * an async event for translation and clustering.
     *
     * @param req the validated text submission request
     * @return lightweight response with submission ID and {@code pending} status
     */
    @Transactional
    public SubmissionResponse saveTextSubmission(SubmissionRequest req) {
        log.info("Saving text submission for constituency {}", req.getConstituencyId());

        Constituency constituency = resolveConstituency(req.getConstituencyId());

        Submission submission = Submission.builder()
                .constituency(constituency)
                .type("text")
                .rawContent(req.getContent())
                .translatedContent(req.getContent()) // async listener will translate if needed
                .languageDetected(req.getLanguage() != null ? req.getLanguage() : "en")
                .category(req.getCategory())
                .lat(req.getLat())
                .lng(req.getLng())
                .ward(req.getWard())
                .status("pending")
                .build();

        Submission saved = submissionRepository.save(submission);

        // Publish event — AI clustering triggered asynchronously
        eventPublisher.publishEvent(
            new SubmissionCreatedEvent(this, saved.getId(), constituency.getId(), "text")
        );

        log.info("Text submission {} persisted and AI event published", saved.getId());
        return mapToResponse(saved);
    }

    /**
     * Handles voice suggestions. Uploads audio to GCS synchronously (fast byte-stream push),
     * then delegates transcription and clustering to the async pipeline.
     *
     * @param audio          the WAV audio multipart file
     * @param language       BCP-47 language code (e.g. "hi-IN")
     * @param constituencyId the constituency this submission belongs to
     * @param lat            optional GPS latitude
     * @param lng            optional GPS longitude
     * @param ward           optional ward name
     * @return lightweight response with submission ID and {@code pending} status
     */
    @Transactional
    public SubmissionResponse saveVoiceSubmission(MultipartFile audio, String language, String constituencyId,
                                                  Double lat, Double lng, String ward) {
        log.info("Saving voice submission for constituency {}", constituencyId);

        Constituency constituency = resolveConstituency(constituencyId);
        UUID submissionId = UUID.randomUUID();

        // GCS upload is fast (byte stream) — stays synchronous
        String gcsUri = uploadFileToGcs(audioBucket, submissionId + ".wav", audio, "audio/wav");

        Submission submission = Submission.builder()
                .id(submissionId)
                .constituency(constituency)
                .type("voice")
                .rawContent("Transcription pending...")
                .translatedContent("Transcription pending...")
                .languageDetected(language != null ? language : "en")
                .category("Other")
                .lat(lat)
                .lng(lng)
                .ward(ward)
                .gcsUri(gcsUri)
                .status("pending")
                .build();

        Submission saved = submissionRepository.save(submission);

        // Transcription happens asynchronously in SubmissionEventListener
        eventPublisher.publishEvent(
            new SubmissionCreatedEvent(this, saved.getId(), constituency.getId(), "voice")
        );

        log.info("Voice submission {} persisted (GCS: {}), transcription dispatched async", saved.getId(), gcsUri);
        return mapToResponse(saved);
    }

    /**
     * Handles photo suggestions. Uploads photo to GCS synchronously, then delegates
     * Gemini Vision description and clustering to the async pipeline.
     *
     * @param photo          the JPEG photo multipart file
     * @param constituencyId the constituency this submission belongs to
     * @param lat            optional GPS latitude
     * @param lng            optional GPS longitude
     * @param ward           optional ward name
     * @return lightweight response with submission ID and {@code pending} status
     */
    @Transactional
    public SubmissionResponse savePhotoSubmission(MultipartFile photo, String constituencyId,
                                                  Double lat, Double lng, String ward) {
        log.info("Saving photo submission for constituency {}", constituencyId);

        Constituency constituency = resolveConstituency(constituencyId);
        UUID submissionId = UUID.randomUUID();

        // GCS upload is fast (byte stream) — stays synchronous
        String gcsUri = uploadFileToGcs(photoBucket, submissionId + ".jpg", photo, "image/jpeg");

        Submission submission = Submission.builder()
                .id(submissionId)
                .constituency(constituency)
                .type("photo")
                .rawContent("Image analysis pending...")
                .translatedContent("Image analysis pending...")
                .languageDetected("en")
                .category("Other")
                .lat(lat)
                .lng(lng)
                .ward(ward)
                .gcsUri(gcsUri)
                .status("pending")
                .build();

        Submission saved = submissionRepository.save(submission);

        // Vision description happens asynchronously in SubmissionEventListener
        eventPublisher.publishEvent(
            new SubmissionCreatedEvent(this, saved.getId(), constituency.getId(), "photo")
        );

        log.info("Photo submission {} persisted (GCS: {}), vision analysis dispatched async", saved.getId(), gcsUri);
        return mapToResponse(saved);
    }

    /**
     * Resolves and returns a single submission response by ID.
     *
     * @param id UUID of the submission to look up
     * @return the submission response DTO
     * @throws AppException if the submission is not found
     */
    public SubmissionResponse getSubmissionStatus(UUID id) {
        Submission sub = submissionRepository.findById(id)
                .orElseThrow(() -> new AppException("Submission not found with ID: " + id, HttpStatus.NOT_FOUND));
        return mapToResponse(sub);
    }

    /**
     * Resolves a constituency by ID or throws a {@link AppException}.
     *
     * @param constituencyId the ID to look up
     * @return the resolved {@link Constituency}
     * @throws AppException if no constituency matches the given ID
     */
    private Constituency resolveConstituency(String constituencyId) {
        return constituencyRepository.findById(constituencyId)
                .orElseThrow(() -> new AppException("Constituency not found: " + constituencyId, HttpStatus.BAD_REQUEST));
    }

    /**
     * Uploads a file to GCS. On failure (e.g. missing credentials in dev), logs a warning
     * and returns a placeholder URI so development can continue without cloud setup.
     *
     * @param bucketName  target GCS bucket
     * @param objectName  target object name within the bucket
     * @param file        multipart file to upload
     * @param contentType MIME type of the file
     * @return the {@code gs://} URI of the uploaded object
     */
    private String uploadFileToGcs(String bucketName, String objectName, MultipartFile file, String contentType) {
        try {
            byte[] bytes = file.getBytes();
            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(contentType).build();
            storage.create(blobInfo, bytes);
            log.info("Uploaded {} to GCS bucket {}", objectName, bucketName);
            return String.format("gs://%s/%s", bucketName, objectName);
        } catch (Exception e) {
            log.warn("GCS upload failed for {}/{} ({}). Using placeholder URI.", bucketName, objectName, e.getMessage());
            return String.format("gs://%s/%s-mock-placeholder", bucketName, objectName);
        }
    }

    private SubmissionResponse mapToResponse(Submission s) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .status(s.getStatus())
                .type(s.getType())
                .rawContent(s.getRawContent())
                .translatedContent(s.getTranslatedContent())
                .ward(s.getWard())
                .gcsUri(s.getGcsUri())
                .themeLabel(s.getTheme() != null ? s.getTheme().getLabel() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
