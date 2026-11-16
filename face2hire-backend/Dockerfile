# ==========================================
# Stage 1: Build Spring Boot Application
# ==========================================
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml checkstyle.xml ./
COPY src ./src

RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Lightweight Production Runtime
# ==========================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Create non-root user and writable directories for local uploads & logs
RUN groupadd -r spring && useradd -r -g spring spring \
    && mkdir -p /app/uploads /app/logs \
    && chown -R spring:spring /app

COPY --from=build --chown=spring:spring /build/target/face2hire-backend-*.jar /app/app.jar

USER spring:spring

ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
