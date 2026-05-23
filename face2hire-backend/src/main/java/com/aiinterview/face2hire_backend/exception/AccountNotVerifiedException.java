package com.aiinterview.face2hire_backend.exception;

public class AccountNotVerifiedException extends RuntimeException {
    private final String email;
    public AccountNotVerifiedException(String message, String email) {
        super(message);
        this.email = email;
    }
    public String getEmail() { return email; }
}
