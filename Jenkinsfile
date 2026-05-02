pipeline {
  agent any

  parameters {
    string(name: "DOCKER_REGISTRY", defaultValue: "", description: "Registry host/namespace (e.g. ghcr.io/org)")
    string(name: "IMAGE_NAME", defaultValue: "edupulse", description: "Container image name")
    string(name: "KUBE_NAMESPACE", defaultValue: "edupulse", description: "Kubernetes namespace")
    string(name: "KUBE_CONTEXT", defaultValue: "", description: "Optional kubeconfig context name")
    string(name: "MANIFEST_DIR", defaultValue: "k8s", description: "Kubernetes manifests directory")
    string(name: "DOCKER_CREDENTIALS_ID", defaultValue: "docker-registry", description: "Jenkins credentials ID for registry")
    string(name: "KUBECONFIG_CREDENTIALS_ID", defaultValue: "kubeconfig", description: "Jenkins kubeconfig file credentials ID")
  }

  environment {
    NODE_ENV = "production"
  }

  stages {
    stage("Install") {
      steps {
        sh "npm ci"
      }
    }

    stage("Lint") {
      steps {
        sh "npm run lint"
      }
    }

    stage("Test") {
      steps {
        sh "npm test"
      }
    }

    stage("Prisma Generate") {
      steps {
        sh "npm run prisma:generate"
      }
    }

    stage("Build") {
      steps {
        sh "npm run build"
      }
    }

    stage("Docker Build & Push") {
      steps {
        script {
          if (!params.DOCKER_REGISTRY?.trim()) {
            error "DOCKER_REGISTRY is required. Set the pipeline parameter."
          }

          def gitSha = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${gitSha}"
          env.IMAGE = "${params.DOCKER_REGISTRY}/${params.IMAGE_NAME}:${env.IMAGE_TAG}"
        }
        withCredentials([
          usernamePassword(
            credentialsId: params.DOCKER_CREDENTIALS_ID,
            usernameVariable: "DOCKER_USER",
            passwordVariable: "DOCKER_PASS"
          )
        ]) {
          sh "echo $DOCKER_PASS | docker login ${params.DOCKER_REGISTRY} -u $DOCKER_USER --password-stdin"
          sh "docker build -t $IMAGE ."
          sh "docker push $IMAGE"
        }
      }
    }

    stage("Deploy") {
      steps {
        withCredentials([
          file(credentialsId: params.KUBECONFIG_CREDENTIALS_ID, variable: "KUBECONFIG")
        ]) {
          sh '''
            kubectl version --client

            if [ -n "$KUBE_CONTEXT" ]; then
              kubectl config use-context "$KUBE_CONTEXT"
            fi

            kubectl apply -f "$MANIFEST_DIR/namespace.yaml"
            kubectl apply -f "$MANIFEST_DIR/configmap.yaml"
            kubectl apply -f "$MANIFEST_DIR/secret.yaml"
            kubectl apply -f "$MANIFEST_DIR/postgres-pvc.yaml"
            kubectl apply -f "$MANIFEST_DIR/postgres-deployment.yaml"
            kubectl apply -f "$MANIFEST_DIR/postgres-service.yaml"
            kubectl apply -f "$MANIFEST_DIR/deployment.yaml"
            kubectl apply -f "$MANIFEST_DIR/service.yaml"

            kubectl -n "$KUBE_NAMESPACE" delete job edupulse-migrate --ignore-not-found
            cat <<EOF | kubectl apply -f -
            apiVersion: batch/v1
            kind: Job
            metadata:
              name: edupulse-migrate
              namespace: ${KUBE_NAMESPACE}
            spec:
              backoffLimit: 1
              template:
                spec:
                  restartPolicy: Never
                  containers:
                    - name: migrate
                      image: ${IMAGE}
                      command: ["npx", "prisma", "migrate", "deploy"]
                      envFrom:
                        - configMapRef:
                            name: edupulse-config
                        - secretRef:
                            name: edupulse-secrets
            EOF
            kubectl -n "$KUBE_NAMESPACE" wait --for=condition=complete job/edupulse-migrate --timeout=300s
            kubectl -n "$KUBE_NAMESPACE" logs job/edupulse-migrate

            kubectl -n "$KUBE_NAMESPACE" set image deployment/edupulse edupulse="$IMAGE"
            kubectl -n "$KUBE_NAMESPACE" rollout status deployment/edupulse
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: ".next/**", allowEmptyArchive: true
    }
  }
}
