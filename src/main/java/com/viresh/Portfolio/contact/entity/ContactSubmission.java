package com.viresh.Portfolio.contact.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
		name = "contact_submissions",
		indexes = @Index(
				name = "idx_contact_duplicate",
				columnList = "email,request_hash,created_at,status"
		)
)
public class ContactSubmission {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 80)
	private String name;

	@Column(nullable = false, length = 254)
	private String email;

	@Column(nullable = false, length = 120)
	private String subject;

	@Column(nullable = false, length = 5000)
	private String message;

	@Column(name = "request_hash", nullable = false, length = 64)
	private String requestHash;

	@Column(nullable = false, unique = true, length = 36)
	private String reference;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ContactStatus status;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ContactSubmission() {
	}

	private ContactSubmission(
			String name,
			String email,
			String subject,
			String message,
			String requestHash
	) {
		this.name = name;
		this.email = email;
		this.subject = subject;
		this.message = message;
		this.requestHash = requestHash;
		this.reference = UUID.randomUUID().toString();
		this.status = ContactStatus.RECEIVED;
	}

	public static ContactSubmission create(
			String name,
			String email,
			String subject,
			String message,
			String requestHash
	) {
		return new ContactSubmission(name, email, subject, message, requestHash);
	}

	public void markNotified() {
		this.status = ContactStatus.NOTIFIED;
	}

	public void markEmailFailed() {
		this.status = ContactStatus.EMAIL_FAILED;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		this.updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getSubject() {
		return subject;
	}

	public String getMessage() {
		return message;
	}

	public String getRequestHash() {
		return requestHash;
	}

	public String getReference() {
		return reference;
	}

	public ContactStatus getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
