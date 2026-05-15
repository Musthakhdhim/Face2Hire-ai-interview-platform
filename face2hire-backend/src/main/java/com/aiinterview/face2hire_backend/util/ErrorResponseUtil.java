package com.aiinterview.face2hire_backend.util;

import com.aiinterview.face2hire_backend.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;

import java.io.IOException;

public class ErrorResponseUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static void writeErrorResponse(
            HttpServletResponse response, HttpStatus status, String message)
            throws IOException {

        ApiResponse<?> apiResponse = ApiResponse.builder()
                .statusCode(status.value())
                .message(message)
                .success(false)
                .data(null)
                .build();

        response.setStatus(status.value());
        response.setContentType("application/json");

        objectMapper.writeValue(response.getWriter(), apiResponse);
    }
}