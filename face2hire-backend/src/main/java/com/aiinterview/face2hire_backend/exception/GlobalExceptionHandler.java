package com.aiinterview.face2hire_backend.exception;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleUserNotFound(UserNotFoundException ex) {
        ApiResponse response =
                ApiResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(null)
                        .statusCode(HttpStatus.NOT_FOUND.value())
                        .build();

        return new ResponseEntity<>(response,HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidCredentials(InvalidCredentialsException ex) {
        ApiResponse response = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .build();

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .statusCode(HttpStatus.BAD_REQUEST.value())
                        .time(LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidCredentials(ResourceNotFoundException ex) {
        ApiResponse response = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.NOT_FOUND.value())
                .build();

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneric(Exception ex) {
        ApiResponse response = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyExistsException(AlreadyExistsException ex) {
        ApiResponse response
                = ApiResponse.builder()
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .success(false)
                .message(ex.getLocalizedMessage())
                .build();

        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex) {

        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getDefaultMessage())
                .toList();

        ApiResponse response =
                ApiResponse.builder()
                        .data(errors)
                        .success(false)
                        .statusCode(HttpStatus.BAD_REQUEST.value())
                        .message("validation failed")
                        .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TooManyRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleTooManyRequestException(TooManyRequestException ex) {
        ApiResponse response = ApiResponse.builder()
                .success(false)
                .message("too many request, wait for sometime")
                .data(ex.getMessage())
                .statusCode(HttpStatus.TOO_MANY_REQUESTS.value())
                .build();

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccountLockedException(AccountLockedException ex) {
        ApiResponse apiResponse = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.LOCKED.value())
                .build();

        return ResponseEntity.status(HttpStatus.LOCKED).body(apiResponse);
    }

    @ExceptionHandler(PasswordNotMatchException.class)
    public ResponseEntity<ApiResponse<?>> handlePasswordNotMatchException(PasswordNotMatchException ex) {
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiResponse);
    }

    @ExceptionHandler(SamePasswordException.class)
    public ResponseEntity<ApiResponse<?>> handleSamePasswordException(SamePasswordException ex) {
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiResponse);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ApiResponse<?>> handleJwtException(JwtException ex) {
        ApiResponse apiResponse = ApiResponse.builder()
                .success(false)
                .message("jwt exception: " + ex.getMessage())
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(AuthenticationException ex) {
        ApiResponse apiResponse = ApiResponse.builder()
                .success(false)
                .message("Authentication failed: " + ex.getMessage())
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex) {
        ApiResponse apiResponse = ApiResponse.builder()
                .success(false)
                .message("you are not allowed to access this: " + ex.getMessage())
                .statusCode(HttpStatus.FORBIDDEN.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(AccountNotVerifiedException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleAccountNotVerified(AccountNotVerifiedException ex) {
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message(ex.getMessage())
                .data(Map.of("email", ex.getEmail()))
                .statusCode(HttpStatus.FORBIDDEN.value())
                .time(LocalDateTime.now())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(InterviewSessionNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(InterviewSessionNotFoundException ex) {

        ApiResponse apiResponse = ApiResponse.builder()
                .success(false)
                .message("interview session is not found: " + ex.getMessage())
                .statusCode(HttpStatus.NOT_FOUND.value())
                .data(null)
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(apiResponse);
    }
}
