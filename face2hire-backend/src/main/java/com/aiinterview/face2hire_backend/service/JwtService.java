package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.entity.User;
import io.jsonwebtoken.Claims;
import org.springframework.security.core.userdetails.UserDetails;

import javax.crypto.SecretKey;
import java.util.function.Function;

public interface JwtService {
    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    String buildToken(User user, long expiration);

    SecretKey getSigningKey();

    String extractUsername(String token);

    String extractRole(String token);

    Long extractUserId(String token);

    <T> T extractClaim(String token,
                       Function<Claims, T> resolver);

    Claims extractAllClaims(String token);

    boolean isTokenExpired(String token);

    boolean isTokenValid(String token,
                         UserDetails userDetails);

    User getCurrentLoginUser();
}
