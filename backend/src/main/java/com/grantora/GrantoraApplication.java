package com.grantora;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GrantoraApplication {

    public static void main(String[] args) {
        SpringApplication.run(GrantoraApplication.class, args);
    }
}
