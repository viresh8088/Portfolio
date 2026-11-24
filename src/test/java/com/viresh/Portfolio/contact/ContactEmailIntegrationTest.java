package com.viresh.Portfolio.contact;

import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.viresh.Portfolio.contact.repository.ContactSubmissionRepository;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.contact.email-enabled=true")
class ContactEmailIntegrationTest {
	@RegisterExtension
	static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP);

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ContactSubmissionRepository repository;

	@BeforeEach
	void resetState() throws Exception {
		repository.deleteAll();
		greenMail.purgeEmailFromAllMailboxes();
	}

	@Test
	void sendsAnEmailOnlyAfterTheSubmissionIsPersisted() throws Exception {
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
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("NOTIFIED"));

		assertThat(greenMail.getReceivedMessages()).hasSize(1);

		MimeMessage message = greenMail.getReceivedMessages()[0];
		assertThat(message.getSubject()).isEqualTo("[Portfolio] Portfolio collaboration");
		assertThat(message.getFrom()[0].toString()).isEqualTo("no-reply@example.com");
		assertThat(message.getReplyTo()[0].toString()).isEqualTo("visitor@example.com");
		assertThat(GreenMailUtil.getBody(message))
				.contains("Viresh Saradar")
				.contains("I would like to discuss a full-stack project.");
	}
}
