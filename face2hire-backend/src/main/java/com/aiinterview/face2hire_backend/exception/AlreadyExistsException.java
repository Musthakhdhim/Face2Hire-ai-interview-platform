package com.aiinterview.face2hire_backend.exception;

public class AlreadyExistsException extends RuntimeException{
    public AlreadyExistsException(String message){
        super((message));
    }
}