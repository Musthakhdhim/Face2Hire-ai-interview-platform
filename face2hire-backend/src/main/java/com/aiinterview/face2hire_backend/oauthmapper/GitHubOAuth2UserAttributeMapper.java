package com.aiinterview.face2hire_backend.oauthmapper;


import com.aiinterview.face2hire_backend.entity.AuthProvider;
import com.aiinterview.face2hire_backend.service.OAuth2UserAttributeMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class GitHubOAuth2UserAttributeMapper implements OAuth2UserAttributeMapper {

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GITHUB;
    }

    @Override
    public String extractEmail(OAuth2User user) {
        String email = user.getAttribute("email");
        if (email == null) {
            String login = user.getAttribute("login");
            Object id = user.getAttribute("id");
            if (login != null && id != null) {
                email = id + "+" + login + "@users.noreply.github.com";
                log.warn("GitHub email was null; using noreply address: {}", email);
            }
        }
        return email;
    }

    @Override
    public String extractFullName(OAuth2User user) {
        String name = user.getAttribute("name");
        if (name == null || name.isBlank()) {
            name = user.getAttribute("login");
        }
        return name;
    }

    @Override
    public String extractAvatarUrl(OAuth2User user) {
        return user.getAttribute("avatar_url");
    }

    @Override
    public String extractProviderId(OAuth2User user) {
        Object id = user.getAttribute("id");
        return id != null ? String.valueOf(id) : null;
    }
}