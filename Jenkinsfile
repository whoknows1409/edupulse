pipeline {
  agent any

  environment {
    NODE_ENV = "production"
    SONAR_HOST_URL = "http://sonarqube:9000"
  }

  stages {
    stage("Install") {
      steps {
        sh "npm ci"
      }
    }

    stage("Prisma Generate") {
      steps {
        sh "npm run prisma:generate"
      }
    }

    stage("Lint") {
      steps {
        sh "npm run lint"
      }
    }

    stage("Test") {
      steps {
        sh "npm run test"
      }
    }

    stage("Build") {
      steps {
        sh "npm run build"
      }
    }

    stage("SonarQube") {
      steps {
        withCredentials([string(credentialsId: "sonarqube-token", variable: "SONAR_TOKEN")]) {
          sh "npx sonar-scanner -Dsonar.login=$SONAR_TOKEN -Dsonar.host.url=$SONAR_HOST_URL"
        }
      }
    }
  }
}
