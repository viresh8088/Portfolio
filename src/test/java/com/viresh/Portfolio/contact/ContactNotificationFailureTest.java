package com.viresh.Portfolio.contact;

import com.viresh.Portfolio.contact.entity.ContactStatus;
import com.viresh.Portfolio.contact.exception.ContactNotificationException;
import com.viresh.Portfolio.contact.repository.ContactSubmissionRepository;
import com.viresh.Portfolio.contact.service.ContactNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.contact.email-enabled=true")
class ContactNotificationFailureTest {
	@MockitoBean
	private ContactNotificationService notificationService;

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ContactSubmissionRepository repository;

	@BeforeEach
	void clearSubmissions() {
		repository.deleteAll();
	}

	@Test
	void returnsFailureAndRecordsTheFailedNotificationState() throws Exception {
		doThrow(new ContactNotificationException(
				"SMTP unavailable",
				new IllegalStateException("Connection refused")
		)).when(notificationService).send(any());

		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "name": "Viresh Saradar",
								  "email": "visitor@example.com",
								  "subject": "Portfolio collaboration",
								  "message": "I would like to discuss a full-stack project."
								}
								"""))
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.message")
						.value("Your message could not be delivered. Please try again later."));

		assertThat(repository.count()).isEqualTo(1);
		assertThat(repository.findAll().getFirst().getStatus())
				.isEqualTo(ContactStatus.EMAIL_FAILED);
	}
}
