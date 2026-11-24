package com.viresh.Portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.contact")
public record ContactProperties(
		boolean emailEnabled,
		String recipient,
		String from,
		int duplicateWindowMinutes
) {
}
