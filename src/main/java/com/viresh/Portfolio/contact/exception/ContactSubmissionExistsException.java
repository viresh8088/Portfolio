package com.viresh.Portfolio.contact.exception;

public class ContactSubmissionExistsException extends RuntimeException {
	public ContactSubmissionExistsException() {
		super("A similar message was already submitted recently.");
	}
}
