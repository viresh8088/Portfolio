package com.viresh.Portfolio.contact.service;

import com.viresh.Portfolio.config.ContactProperties;
import com.viresh.Portfolio.contact.dto.ContactRequest;
import com.viresh.Portfolio.contact.dto.ContactResponse;
import com.viresh.Portfolio.contact.entity.ContactStatus;
import com.viresh.Portfolio.contact.entity.ContactSubmission;
import com.viresh.Portfolio.contact.exception.ContactNotificationException;
import com.viresh.Portfolio.contact.exception.ContactSubmissionExistsException;
import com.viresh.Portfolio.contact.repository.ContactSubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
public class ContactService {
	private static final Logger LOGGER = LoggerFactory.getLogger(ContactService.class);

	private final ContactSubmissionRepository repository;
	private final ContactNotificationService notificationService;
	private final ContactProperties properties;

	public ContactService(
			ContactSubmissionRepository repository,
			ContactNotificationService notificationService,
			ContactProperties properties
	) {
		this.repository = repository;
		this.notificationService = notificationService;
		this.properties = properties;
	}

	@Transactional(noRollbackFor = ContactNotificationException.class)
	public ContactResponse submit(ContactRequest request) {
		String normalizedEmail = normalizeForHash(request.email());
		String requestHash = createRequestHash(normalizedEmail, request.message());
		Instant cutoff = Instant.now().minus(
				Math.max(1, properties.duplicateWindowMinutes()),
				ChronoUnit.MINUTES
		);

		boolean duplicate = repository.existsByEmailIgnoreCaseAndRequestHashAndStatusInAndCreatedAtAfter(
				normalizedEmail,
				requestHash,
				List.of(ContactStatus.RECEIVED, ContactStatus.NOTIFIED),
				cutoff
		);

		if (duplicate) {
			throw new ContactSubmissionExistsException();
		}

		ContactSubmission submission = ContactSubmission.create(
				request.name(),
				normalizedEmail,
				request.subject(),
				request.message(),
				requestHash
		);
		submission = repository.saveAndFlush(submission);

		if (properties.emailEnabled()) {
			try {
				notificationService.send(submission);
				submission.markNotified();
			} catch (ContactNotificationException ex) {
				submission.markEmailFailed();
				LOGGER.error(
						"Contact notification failed for reference {}",
						submission.getReference(),
						ex
				);
				throw ex;
			}
		}

		repository.save(submission);

		return new ContactResponse(
				submission.getReference(),
				submission.getStatus().name(),
				"Your message has been received.",
				submission.getCreatedAt()
		);
	}

	private String createRequestHash(String normalizedEmail, String message) {
		String payload = normalizedEmail + "\u0000" + normalizeForHash(message);
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256")
					.digest(payload.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		} catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is not available", ex);
		}
	}

	private String normalizeForHash(String value) {
		if (value == null) {
			return "";
		}
		return value.replaceAll("\\s+", " ").strip().toLowerCase(Locale.ROOT);
	}
}
