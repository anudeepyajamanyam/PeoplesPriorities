package com.peoplespriorities.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Domain event published when a new citizen submission is persisted.
 *
 * <p>Listeners on this event handle all asynchronous post-processing:
 * speech transcription, photo description, and AI theme clustering.
 * Publishing this event immediately releases the HTTP request thread
 * back to the servlet container, giving sub-100ms response times
 * for all submission endpoints regardless of AI pipeline latency.
 */
@Getter
public class SubmissionCreatedEvent extends ApplicationEvent {

    private final java.util.UUID submissionId;
    private final String constituencyId;
    private final String submissionType;

    /**
     * @param source         the service that created the submission
     * @param submissionId   UUID of the newly persisted submission
     * @param constituencyId constituency the submission belongs to
     * @param submissionType "text", "voice", or "photo"
     */
    public SubmissionCreatedEvent(Object source,
                                  java.util.UUID submissionId,
                                  String constituencyId,
                                  String submissionType) {
        super(source);
        this.submissionId = submissionId;
        this.constituencyId = constituencyId;
        this.submissionType = submissionType;
    }
}
