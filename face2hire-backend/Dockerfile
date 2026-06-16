#FROM eclipse-temurin:21-jre
#
#WORKDIR /app
#
#COPY target/face2hire-backend-0.0.1-SNAPSHOT.jar app.jar
#
#EXPOSE 8080
#
#ENTRYPOINT ["java","-jar","app.jar"]


# Dockerfile
FROM openjdk:21-jdk-slim

WORKDIR /app

# Copy JAR
COPY target/face2hire-backend-*.jar app.jar

# Create non-root user
RUN groupadd -r spring && useradd -r -g spring spring
USER spring:spring

# Set production profile
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]