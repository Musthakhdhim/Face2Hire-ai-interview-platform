package com.aiinterview.face2hire_backend.logging;

import org.springframework.stereotype.Component;

@Component
public class AppLoggerFactory {
    public AppLogger getLogger(Class<?> clazz) {
        return new Slf4jLogger(clazz);
    }
}
