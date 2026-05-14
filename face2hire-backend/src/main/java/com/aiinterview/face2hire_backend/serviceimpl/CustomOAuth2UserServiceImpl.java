package com.aiinterview.face2hire_backend.serviceimpl;


import com.aiinterview.face2hire_backend.entity.AuthProvider;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.entity.User;
import com.aiinterview.face2hire_backend.repository.UserRepository;
import com.aiinterview.face2hire_backend.service.OAuth2UserAttributeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final Map<AuthProvider, OAuth2UserAttributeMapper> attributeMappers;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String registrationId = request.getClientRegistration()
                .getRegistrationId()
                .toUpperCase();

        AuthProvider provider;
        try {
            provider = AuthProvider.valueOf(registrationId);
        } catch (IllegalArgumentException e) {
            throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
        }

        OAuth2UserAttributeMapper mapper = attributeMappers.get(provider);
        if (mapper == null) {
            throw new OAuth2AuthenticationException("No attribute mapper for provider: " + provider);
        }

        String email = mapper.extractEmail(oAuth2User);
        if (email == null || email.isBlank()) {
            log.error("Email not returned by {} OAuth2 provider", registrationId);
            throw new OAuth2AuthenticationException(
                    "Email not found from " + registrationId + " provider. " +
                            "Please ensure your email is public in your account settings."
            );
        }

        log.info("OAuth2 login attempt — provider: {}, email: {}", registrationId, email);

        User user = userRepository.findByEmail(email);

        if (user == null) {
            String username = email.split("@")[0];
            String fullName = mapper.extractFullName(oAuth2User);
            String avatarUrl = mapper.extractAvatarUrl(oAuth2User);
            String providerId = mapper.extractProviderId(oAuth2User);

            user = User.builder()
                    .email(email)
                    .userName(username)
                    .fullName(fullName)
                    .profileImageUrl(avatarUrl)
                    .providerId(providerId)
                    .authProvider(provider)
                    .role(Role.INTERVIEWEE)
                    .isVerified(true)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(user);
            log.info("New OAuth2 user registered: {} via {}", email, registrationId);
        } else {
            user.setFullName(mapper.extractFullName(oAuth2User));
            user.setProfileImageUrl(mapper.extractAvatarUrl(oAuth2User));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            log.info("Returning OAuth2 user: {} via {}", email, registrationId);
        }

        return oAuth2User;
    }
}