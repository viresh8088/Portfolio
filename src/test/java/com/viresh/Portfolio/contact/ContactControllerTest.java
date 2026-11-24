package com.viresh.Portfolio.contact;

import com.viresh.Portfolio.contact.entity.ContactStatus;
import com.viresh.Portfolio.contact.repository.ContactSubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactControllerTest {
	private static final String VALID_REQUEST = """
			{
			  "name": "Viresh Saradar",
			  "email": "visitor@example.com",
			  "subject": "Portfolio collaboration",
			  "message": "I would like to discuss a full-stack project."
			}
			""";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ContactSubmissionRepository repository;

	@BeforeEach
	void clearSubmissions() {
		repository.deleteAll();
	}

	@Test
	void submitsAndPersistsAValidMessage() throws Exception {
		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content(VALID_REQUEST))
				.andExpect(status().isCreated())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.reference").isNotEmpty())
				.andExpect(jsonPath("$.status").value(ContactStatus.RECEIVED.name()))
				.andExpect(jsonPath("$.message").value("Your message has been received."))
				.andExpect(jsonPath("$.submittedAt").isNotEmpty());

		assertThat(repository.count()).isEqualTo(1);
		assertThat(repository.findAll().getFirst().getEmail())
				.isEqualTo("visitor@example.com");
	}

	@Test
	void rejectsMissingAndInvalidFields() throws Exception {
		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Validation failed."))
				.andExpect(jsonPath("$.fieldErrors.length()").value(4));

		assertThat(repository.count()).isZero();
	}

	@Test
	void rejectsMalformedJson() throws Exception {
		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{not-json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message").value("Request body must be valid JSON."));

		assertThat(repository.count()).isZero();
	}

	@Test
	void preventsDuplicateSubmissionsWithinTheConfiguredWindow() throws Exception {
		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content(VALID_REQUEST))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/contact")
						.contentType(MediaType.APPLICATION_JSON)
						.content(VALID_REQUEST))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message")
						.value("A similar message was already submitted recently."));

		assertThat(repository.count()).isEqualTo(1);
	}
}
