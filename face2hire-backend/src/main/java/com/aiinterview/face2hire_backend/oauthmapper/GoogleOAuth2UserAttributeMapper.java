package com.aiinterview.face2hire_backend.oauthmapper;


import com.aiinterview.face2hire_backend.entity.AuthProvider;
import com.aiinterview.face2hire_backend.service.OAuth2UserAttributeMapper;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;


@Component
public class GoogleOAuth2UserAttributeMapper implements OAuth2UserAttributeMapper {
    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GOOGLE;
    }

    @Override
    public String extractEmail(OAuth2User user) {
        return user.getAttribute("email");
    }

    @Override
    public String extractFullName(OAuth2User user) {
        return user.getAttribute("name");
    }

    @Override
    public String extractAvatarUrl(OAuth2User user) {
        return user.getAttribute("picture");
    }

    @Override
    public String extractProviderId(OAuth2User user) {
        return user.getAttribute("sub");
    }
}
