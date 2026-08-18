package com.cs.SmartHireAi.exceptions;

public class UserDoesNotExistException extends RuntimeException {
    public UserDoesNotExistException() { super("User does not exist"); }
}
