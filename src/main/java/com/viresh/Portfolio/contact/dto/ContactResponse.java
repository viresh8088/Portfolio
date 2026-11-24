package com.viresh.Portfolio.contact.dto;

import java.time.Instant;

public record ContactResponse(
		String reference,
		String status,
		String message,
		Instant submittedAt
) {
}
