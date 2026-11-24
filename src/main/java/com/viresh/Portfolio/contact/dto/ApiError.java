package com.viresh.Portfolio.contact.dto;

import java.time.Instant;
import java.util.List;

public record ApiError(
		Instant timestamp,
		int status,
		String error,
		String message,
		String path,
		List<FieldIssue> fieldErrors
) {
	public ApiError {
		fieldErrors = fieldErrors == null ? List.of() : List.copyOf(fieldErrors);
	}

	public record FieldIssue(String field, String message) {
	}
}
