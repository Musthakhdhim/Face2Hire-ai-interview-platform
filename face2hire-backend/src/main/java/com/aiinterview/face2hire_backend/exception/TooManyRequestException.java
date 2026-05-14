package com.aiinterview.face2hire_backend.exception;

public class TooManyRequestException extends RuntimeException{
    public TooManyRequestException(String message){
        super(message);
    }
}

