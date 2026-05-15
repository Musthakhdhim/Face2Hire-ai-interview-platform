package com.aiinterview.face2hire_backend.logging;

public interface AppLogger {
    void debug(String message);
    void debug(String format, Object... arguments);
    void info(String message);
    void info(String format, Object... arguments);
    void warn(String message);
    void warn(String format, Object... arguments);
    void error(String message);
    void error(String format, Object... arguments);
    void error(String message, Throwable throwable);
}