# Stage 1: Build the Spring Boot application
FROM eclipse-temurin:26-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./

RUN chmod +x mvnw
COPY src ./src

RUN ./mvnw -B -ntp clean package

# Stage 2: Run the application
FROM eclipse-temurin:26-jre

LABEL authors="SAFAYET"

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
