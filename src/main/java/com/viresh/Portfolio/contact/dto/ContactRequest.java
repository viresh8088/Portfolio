package com.viresh.Portfolio.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContactRequest(
		@NotBlank(message = "Name is required")
		@Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters")
		@Pattern(regexp = "^[^\\r\\n]+$", message = "Name must be a single line")
		String name,

		@NotBlank(message = "Email is required")
		@Email(message = "Enter a valid email address")
		@Size(max = 254, message = "Email must not exceed 254 characters")
		String email,

		@NotBlank(message = "Subject is required")
		@Size(min = 3, max = 120, message = "Subject must be between 3 and 120 characters")
		@Pattern(regexp = "^[^\\r\\n]+$", message = "Subject must be a single line")
		String subject,

		@NotBlank(message = "Message is required")
		@Size(min = 10, max = 5000, message = "Message must be between 10 and 5000 characters")
		String message
) {
	public ContactRequest {
		name = normalize(name);
		email = normalize(email);
		subject = normalize(subject);
		message = normalize(message);
	}

	private static String normalize(String value) {
		return value == null ? null : value.strip();
	}
}
