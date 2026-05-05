pipeline {
  agent any

  environment {
    SONAR_HOST_URL = "http://sonarqube:9000"
  }

  stages {
    stage("Install") {
      steps {
        dir(env.WORKSPACE) {
          sh "npm ci"
        }
      }
    }

    stage("Prisma Generate") {
      steps {
        dir(env.WORKSPACE) {
          sh "npm run prisma:generate"
        }
      }
    }

    stage("Test") {
      steps {
        dir(env.WORKSPACE) {
          sh "npm run test"
        }
      }
    }

    stage("Build") {
      steps {
        dir(env.WORKSPACE) {
          sh "npm run build"
        }
      }
    }

    stage("SonarQube") {
      steps {
        withCredentials([string(credentialsId: "sonarqube-token", variable: "SONAR_TOKEN")]) {
          dir(env.WORKSPACE) {
            sh "npx sonar-scanner -Dsonar.login=$SONAR_TOKEN -Dsonar.host.url=$SONAR_HOST_URL"
          }
        }
      }
    }
  }
}
