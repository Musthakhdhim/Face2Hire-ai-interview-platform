package com.aiinterview.face2hire_backend.service;

import com.aiinterview.face2hire_backend.entity.AuthProvider;
import org.springframework.security.oauth2.core.user.OAuth2User;

public interface OAuth2UserAttributeMapper {
    AuthProvider getProvider();
    String extractEmail(OAuth2User user);
    String extractFullName(OAuth2User user);
    String extractAvatarUrl(OAuth2User user);
    String extractProviderId(OAuth2User user);
}
