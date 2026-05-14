package com.aiinterview.face2hire_backend.serviceimpl;

import com.aiinterview.face2hire_backend.entity.AuthProvider;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.DashboardPathResolver;
import com.aiinterview.face2hire_backend.service.JwtService;
import com.aiinterview.face2hire_backend.service.OAuth2UserAttributeMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final Map<AuthProvider, OAuth2UserAttributeMapper> attributeMappers;
    private final Map<Role, DashboardPathResolver> dashboardResolvers;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User principal = token.getPrincipal();

        String registrationId = token.getAuthorizedClientRegistrationId().toUpperCase();
        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(registrationId);
        } catch (IllegalArgumentException e) {
            log.error("Unsupported provider: {}", registrationId);
            response.sendRedirect(frontendUrl + "/login?error=unsupported_provider");
            return;
        }

        OAuth2UserAttributeMapper mapper = attributeMappers.get(provider);
        if (mapper == null) {
            log.error("No mapper for provider: {}", provider);
            response.sendRedirect(frontendUrl + "/login?error=no_mapper");
            return;
        }

        String email = mapper.extractEmail(principal);
        if (email == null) {
            log.error("Cannot determine email from {} OAuth2 token", registrationId);
            response.sendRedirect(frontendUrl + "/login?error=email_missing");
            return;
        }

        User user = userRepository.findByEmail(email);
        if (user == null) {
            log.error("OAuth2 success but user not found in DB for email: {}", email);
            response.sendRedirect(frontendUrl + "/login?error=user_not_found");
            return;
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        DashboardPathResolver resolver = dashboardResolvers.get(user.getRole());
        if (resolver == null) {
            log.error("No dashboard path resolver for role: {}", user.getRole());
            response.sendRedirect(frontendUrl + "/login?error=no_dashboard_path");
            return;
        }
        String dashboardPath = resolver.resolvePath(user.getRole().name());

        String redirectUrl = frontendUrl + "/oauth2/redirect"
                + "?token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
                + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
                + "&role=" + URLEncoder.encode(user.getRole().name(), StandardCharsets.UTF_8)
                + "&email=" + URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8)
                + "&name=" + URLEncoder.encode(user.getUserName(), StandardCharsets.UTF_8)
                + "&redirect=" + URLEncoder.encode(dashboardPath, StandardCharsets.UTF_8);

        log.info("OAuth2 success for {} (role: {}), redirecting to {}",
                email, user.getRole(), dashboardPath);

        response.sendRedirect(redirectUrl);
    }
}