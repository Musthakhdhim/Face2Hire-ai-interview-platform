package com.aiinterview.face2hire_backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
@Disabled("Skipping context load test - uses RDS which is not available in CI")

class Face2hireBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
