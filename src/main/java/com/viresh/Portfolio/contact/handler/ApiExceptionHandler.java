package com.viresh.Portfolio.contact.handler;

import com.viresh.Portfolio.contact.dto.ApiError;
import com.viresh.Portfolio.contact.exception.ContactNotificationException;
import com.viresh.Portfolio.contact.exception.ContactSubmissionExistsException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {
	private static final Logger LOGGER = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(
			MethodArgumentNotValidException ex,
			HttpServletRequest request
	) {
		List<ApiError.FieldIssue> fieldErrors = ex.getBindingResult()
				.getFieldErrors()
				.stream()
				.map(this::toFieldIssue)
				.toList();

		return build(
				HttpStatus.BAD_REQUEST,
				"Validation failed.",
				request,
				fieldErrors
		);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableMessage(
			HttpMessageNotReadableException ex,
			HttpServletRequest request
	) {
		return build(
				HttpStatus.BAD_REQUEST,
				"Request body must be valid JSON.",
				request,
				List.of()
		);
	}

	@ExceptionHandler(ContactSubmissionExistsException.class)
	public ResponseEntity<ApiError> handleDuplicate(
			ContactSubmissionExistsException ex,
			HttpServletRequest request
	) {
		return build(HttpStatus.CONFLICT, ex.getMessage(), request, List.of());
	}

	@ExceptionHandler(ContactNotificationException.class)
	public ResponseEntity<ApiError> handleNotificationFailure(
			ContactNotificationException ex,
			HttpServletRequest request
	) {
		return build(
				HttpStatus.BAD_GATEWAY,
				"Your message could not be delivered. Please try again later.",
				request,
				List.of()
		);
	}

	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<ApiError> handleDatabaseFailure(
			DataAccessException ex,
			HttpServletRequest request
	) {
		LOGGER.error("Database operation failed for {}", request.getRequestURI(), ex);
		return build(
				HttpStatus.SERVICE_UNAVAILABLE,
				"The contact service is temporarily unavailable.",
				request,
				List.of()
		);
	}

	@ExceptionHandler(ErrorResponseException.class)
	public ResponseEntity<ApiError> handleFrameworkError(
			ErrorResponseException ex,
			HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}
		return build(status, "Request could not be processed.", request, List.of());
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnexpected(
			Exception ex,
			HttpServletRequest request
	) {
		LOGGER.error("Unexpected error for {}", request.getRequestURI(), ex);
		return build(
				HttpStatus.INTERNAL_SERVER_ERROR,
				"An unexpected error occurred.",
				request,
				List.of()
		);
	}

	private ApiError.FieldIssue toFieldIssue(FieldError fieldError) {
		String message = fieldError.getDefaultMessage() == null
				? "Invalid value"
				: fieldError.getDefaultMessage();
		return new ApiError.FieldIssue(fieldError.getField(), message);
	}

	private ResponseEntity<ApiError> build(
			HttpStatus status,
			String message,
			HttpServletRequest request,
			List<ApiError.FieldIssue> fieldErrors
	) {
		ApiError body = new ApiError(
				Instant.now(),
				status.value(),
				status.getReasonPhrase(),
				message,
				request.getRequestURI(),
				fieldErrors
		);
		return ResponseEntity.status(status).body(body);
	}
}
