package com.viresh.Portfolio.contact.repository;

import com.viresh.Portfolio.contact.entity.ContactStatus;
import com.viresh.Portfolio.contact.entity.ContactSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;

public interface ContactSubmissionRepository extends JpaRepository<ContactSubmission, Long> {
	boolean existsByEmailIgnoreCaseAndRequestHashAndStatusInAndCreatedAtAfter(
			String email,
			String requestHash,
			Collection<ContactStatus> statuses,
			Instant createdAtAfter
	);
}
