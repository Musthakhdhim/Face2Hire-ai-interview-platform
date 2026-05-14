package com.aiinterview.face2hire_backend.config;

import com.aiinterview.face2hire_backend.entity.AuthProvider;
import com.aiinterview.face2hire_backend.entity.Role;
import com.aiinterview.face2hire_backend.service.DashboardPathResolver;
import com.aiinterview.face2hire_backend.service.OAuth2UserAttributeMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
public class StrategyMapConfig {

    @Bean
    public Map<AuthProvider, OAuth2UserAttributeMapper> attributeMappers(
            List<OAuth2UserAttributeMapper> mappers) {
        return mappers.stream()
                .collect(Collectors.toMap(
                        OAuth2UserAttributeMapper::getProvider,
                        Function.identity()
                ));
    }

    @Bean
    public Map<Role, DashboardPathResolver> dashboardResolvers(
            List<DashboardPathResolver> resolvers) {
        return resolvers.stream()
                .collect(Collectors.toMap(
                        DashboardPathResolver::getSupportedRole,
                        Function.identity()
                ));
    }
}
