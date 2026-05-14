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

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleUserNotFound(UserNotFoundException ex) {
        ApiResponse response=
                ApiResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(null)
                        .statusCode(HttpStatus.NOT_FOUND.value())
//                .time(LocalDateTime.now())
                        .build();

        return new ResponseEntity<>(response,HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidCredentials(InvalidCredentialsException ex) {
        ApiResponse response= ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.UNAUTHORIZED.value())
//                .time(LocalDateTime.now())
                .build();

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGeneric(Exception ex) {
        ApiResponse response= ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyExistsException(AlreadyExistsException ex){
        ApiResponse response
                =ApiResponse.builder()
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .success(false)
                .message(ex.getLocalizedMessage())
                .build();

        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex){

        List<String> errors=ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error->error.getDefaultMessage())
                .toList();

        ApiResponse response=
                ApiResponse.builder()
                        .data(errors)
                        .success(false)
                        .statusCode(HttpStatus.BAD_REQUEST.value())
                        .message("validation failed")
                        .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(TooManyRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleTooManyRequestException(TooManyRequestException ex){
        ApiResponse response= ApiResponse.builder()
                .success(false)
                .message("too many request, wait for sometuime")
                .data(ex.getMessage())
                .statusCode(HttpStatus.TOO_MANY_REQUESTS.value())
                .build();

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccountLockedException(AccountLockedException ex){
        ApiResponse apiResponse=ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.LOCKED.value())
                .build();

        return ResponseEntity.status(HttpStatus.LOCKED).body(apiResponse);
    }

    @ExceptionHandler(PasswordNotMatchException.class)
    public ResponseEntity<ApiResponse<?>> handlePasswordNotMatchException(PasswordNotMatchException ex){
        ApiResponse<?> apiResponse=ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiResponse);
    }

    @ExceptionHandler(SamePasswordException.class)
    public ResponseEntity<ApiResponse<?>> handleSamePasswordException(SamePasswordException ex){
        ApiResponse<?> apiResponse=ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .statusCode(HttpStatus.CONFLICT.value())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(apiResponse);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ApiResponse<?>> handleJwtException(JwtException ex){
        ApiResponse apiResponse=ApiResponse.builder()
                .success(false)
                .message("jwt exception: "+ex.getMessage())
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthenticationException(AuthenticationException ex){
        ApiResponse apiResponse=ApiResponse.builder()
                .success(false)
                .message("Authentication failed: "+ex.getMessage())
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(AccessDeniedException ex){
        ApiResponse apiResponse=ApiResponse.builder()
                .success(false)
                .message("you are not allowed to access this: "+ex.getMessage())
                .statusCode(HttpStatus.FORBIDDEN.value())
                .data(null)
                .build();

        return ResponseEntity.status(apiResponse.getStatusCode()).body(apiResponse);
    }
}
