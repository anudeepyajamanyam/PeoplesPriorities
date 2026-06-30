package com.peoplespriorities.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Application-level exception that carries an HTTP status code.
 * Caught by {@link GlobalExceptionHandler} and converted to a structured error response.
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;

    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public AppException(String message) {
        super(message);
        this.status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
