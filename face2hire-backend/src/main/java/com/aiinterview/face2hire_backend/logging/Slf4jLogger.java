package com.aiinterview.face2hire_backend.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Slf4jLogger implements AppLogger {
    private final Logger logger;

    public Slf4jLogger(Class<?> clazz) {
        this.logger = LoggerFactory.getLogger(clazz);
    }

    @Override
    public void debug(String message) {
        logger.debug(message);
    }

    @Override
    public void debug(String format, Object... arguments) {
        if (logger.isDebugEnabled()) {
            logger.debug(format, arguments);
        }
    }

    @Override
    public void info(String message) {
        logger.info(message);
    }

    @Override
    public void info(String format, Object... arguments) {
        if (logger.isInfoEnabled()) {
            logger.info(format, arguments);
        }
    }

    @Override
    public void warn(String message) {
        logger.warn(message);
    }

    @Override
    public void warn(String format, Object... arguments) {
        if (logger.isWarnEnabled()) {
            logger.warn(format, arguments);
        }
    }

    @Override
    public void error(String message) {
        logger.error(message);
    }

    @Override
    public void error(String format, Object... arguments) {
        if (logger.isErrorEnabled()) {
            logger.error(format, arguments);
        }
    }

    @Override
    public void error(String message, Throwable throwable) {
        logger.error(message, throwable);
    }
}