package com.viresh.Portfolio.contact.service;

import com.viresh.Portfolio.config.ContactProperties;
import com.viresh.Portfolio.contact.entity.ContactSubmission;
import com.viresh.Portfolio.contact.exception.ContactNotificationException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

@Service
public class ContactNotificationService {
	private static final DateTimeFormatter TIME_FORMAT =
			DateTimeFormatter.ISO_INSTANT;

	private final JavaMailSender mailSender;
	private final ContactProperties properties;

	public ContactNotificationService(JavaMailSender mailSender, ContactProperties properties) {
		this.mailSender = mailSender;
		this.properties = properties;
	}

	public void send(ContactSubmission submission) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(
					message,
					false,
					StandardCharsets.UTF_8.name()
			);

			helper.setFrom(properties.from());
			helper.setTo(properties.recipient());
			helper.setReplyTo(submission.getEmail());
			helper.setSubject("[Portfolio] " + submission.getSubject());
			helper.setText(buildMessage(submission), false);

			mailSender.send(message);
		} catch (MessagingException | MailException ex) {
			throw new ContactNotificationException(
					"The contact notification could not be delivered.",
					ex
			);
		}
	}

	private String buildMessage(ContactSubmission submission) {
		return """
				New portfolio contact submission

				Reference: %s
				Received: %s
				Name: %s
				Email: %s
				Subject: %s

				Message:
				%s
				""".formatted(
				submission.getReference(),
				TIME_FORMAT.format(submission.getCreatedAt()),
				submission.getName(),
				submission.getEmail(),
				submission.getSubject(),
				submission.getMessage()
		);
	}
}
