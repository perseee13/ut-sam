/* Docker Containers — standalone topic content — detailed step-by-step guide */
export const DOCKER_CONTAINERS = {
  slug: "docker-containers",
  crumb: "Docker / Containers",
  kicker: "Docker topic",
  icon: "📦",
  title: "Docker Containers",
  sum: "Package any application into a self-contained, portable container using Docker. Learn images, containers, volumes, networks, and docker-compose for multi-service deployments.",
  meta: ["📚 4 sections", "⏱ 35 min step-by-step", "🔌 docker.sock / TCP"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status docker --no-pager" },
    { prompt: "admin", cmd: "docker run --rm hello-world" },
    { ok: "✓ Docker Engine running — ready to build and deploy containers" }
  ],
  progressPrefix: "docker-containers",
  lessons: [
    {
      id: "what-are-containers",
      title: "Architecture: Containers vs Virtual Machines",
      min: 8,
      sum: "Understand why containers are lighter and faster than VMs, and how the Docker daemon manages isolated application environments.",
      blocks: [
        { t: "p", x: "A **Docker container** packages an application together with its entire runtime environment — libraries, binaries, configuration — into a single, portable unit. Unlike a virtual machine (VM), containers share the host OS kernel, which means they start in milliseconds and consume megabytes rather than gigabytes." },
        {
          t: "img",
          src: "/diagrams/docker-containers.svg",
          caption: "Container Architecture: Each container is an isolated process that shares the Linux kernel. The Docker daemon manages image layers (UnionFS), networking (bridge/overlay), and storage volumes — without the overhead of a full guest OS per application."
        },
        { t: "h", x: "VM vs Container: Side-by-Side Comparison" },
        {
          t: "ul",
          x: [
            "**Virtual Machine**: Each VM runs a complete guest OS (kernel + userland). A VM image is typically 4–20 GB. Boot time is 30–120 seconds. Excellent isolation boundary (hardware emulation).",
            "**Docker Container**: Containers share the host kernel. An image may be as small as 5 MB (Alpine Linux). Start time is 50–300 milliseconds. Isolation through Linux namespaces and cgroups.",
            "**When to use VMs**: Multiple OS types on one machine, strict security isolation (banking, PCI-DSS), or running Windows alongside Linux.",
            "**When to use Docker**: Microservices, CI/CD pipelines, fast horizontal scaling, consistent developer environments, or self-hosted applications."
          ]
        },
        { t: "tip", x: "Docker uses **copy-on-write UnionFS layers**. When you pull `nginx:alpine`, multiple images that share the same base layer store only one copy on disk, saving gigabytes of space." },
        { t: "warn", x: "Containers share the host kernel. A kernel exploit can escape the container boundary. Never run untrusted third-party code in a container on a sensitive production host without extra isolation (AppArmor, Seccomp, or rootless Docker)." }
      ]
    },
    {
      id: "install-docker",
      title: "Step 1: Install Docker Engine on Ubuntu/Debian",
      min: 8,
      sum: "Add the official Docker APT repository, install Docker Engine, configure user group permissions, and verify the installation.",
      blocks: [
        { t: "p", x: "Docker ships as two editions. **Docker Engine** (also called Docker CE — Community Edition) is the free, open-source daemon that runs on your Linux server. The Docker Desktop GUI application is optional and only for workstations." },
        { t: "h", x: "Method 1: Install from Official Docker Repository (Recommended)" },
        {
          t: "code",
          lang: "bash",
          title: "Add Docker GPG key and repository",
          x: "# Remove any old conflicting packages\nsudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true\n\n# Install prerequisites\nsudo apt update && sudo apt install -y ca-certificates curl gnupg lsb-release\n\n# Add Docker's official GPG key\nsudo mkdir -p /etc/apt/keyrings\ncurl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg\n\n# Add the stable repository\necho \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null\n\n# Install Docker Engine, CLI, and containerd\nsudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
        },
        { t: "h", x: "Enable Docker Service and Add User Permissions" },
        {
          t: "code",
          lang: "bash",
          title: "Start Docker and configure user access",
          x: "# Enable Docker to start automatically at boot\nsudo systemctl enable docker\nsudo systemctl start docker\n\n# Add your current user to the 'docker' group\n# This removes the need to prefix every docker command with 'sudo'\nsudo usermod -aG docker $USER\n\n# Apply the group change to the current session (or log out and back in)\nnewgrp docker"
        },
        { t: "h", x: "Verify the Installation" },
        {
          t: "code",
          lang: "bash",
          title: "Confirm Docker is running correctly",
          x: "# Check daemon version and status\ndocker version\nsudo systemctl status docker --no-pager\n\n# Run the hello-world container as a final check\ndocker run --rm hello-world"
        },
        { t: "tip", x: "After adding yourself to the `docker` group, you must fully log out and log back in (or run `newgrp docker`) for the permission change to take effect. Without this, Docker commands will still require `sudo`." },
        { t: "warn", x: "Members of the `docker` group can mount any host directory and gain effective root access. Only add trusted users — treat docker group membership as equivalent to sudo." }
      ]
    },
    {
      id: "docker-images-and-containers",
      title: "Step 2: Images, Containers, and the Dockerfile",
      min: 10,
      sum: "Pull images from Docker Hub, run named containers with port bindings and volume mounts, and build your own image from a Dockerfile.",
      blocks: [
        { t: "p", x: "Every container starts from an **image** — a read-only snapshot of a filesystem. You can pull pre-built images from **Docker Hub** (the public registry), or build your own using a **Dockerfile**." },
        { t: "h", x: "Essential Docker Commands" },
        {
          t: "code",
          lang: "bash",
          title: "Pulling, running, and managing containers",
          x: "# Pull an image from Docker Hub (without running it)\ndocker pull nginx:alpine\n\n# Run a detached container (-d), name it 'my-web',\n# map host port 8080 to container port 80 (-p 8080:80)\ndocker run -d --name my-web -p 8080:80 nginx:alpine\n\n# List running containers\ndocker ps\n\n# View all containers (including stopped ones)\ndocker ps -a\n\n# Show real-time resource usage\ndocker stats my-web\n\n# Execute a shell inside the running container\ndocker exec -it my-web sh\n\n# Stop and remove the container\ndocker stop my-web && docker rm my-web"
        },
        { t: "h", x: "Building a Custom Image with a Dockerfile" },
        {
          t: "code",
          lang: "bash",
          title: "Create a simple Node.js app Dockerfile",
          x: "# Create project directory and Dockerfile\nmkdir -p /opt/my-app && cd /opt/my-app\n\ncat > Dockerfile << 'EOF'\n# Base image\nFROM node:20-alpine\n\n# Set working directory inside container\nWORKDIR /app\n\n# Copy package files and install dependencies\nCOPY package*.json ./\nRUN npm ci --omit=dev\n\n# Copy the rest of the source code\nCOPY . .\n\n# Expose the port the app listens on\nEXPOSE 3000\n\n# Start the application\nCMD [\"node\", \"server.js\"]\nEOF\n\n# Build the image and tag it\ndocker build -t my-app:v1 .\n\n# Run the built image\ndocker run -d --name my-app -p 3000:3000 my-app:v1"
        },
        { t: "tip", x: "Use `.dockerignore` (similar to `.gitignore`) to exclude `node_modules`, `.git`, and logs from your build context. This dramatically speeds up `docker build` by not sending unnecessary files to the Docker daemon." },
        { t: "warn", x: "Never hardcode passwords, API keys, or secrets in a Dockerfile — they become part of the image layers and visible to anyone who pulls the image. Use Docker secrets or environment variables from an `.env` file instead." }
      ]
    },
    {
      id: "docker-compose-networking",
      title: "Step 3: Multi-Service Apps with docker-compose",
      min: 9,
      sum: "Define multi-container applications with persistent volumes, environment variables, and inter-container networking using docker-compose.yml.",
      blocks: [
        { t: "p", x: "**Docker Compose** lets you define and manage an entire multi-service application stack (web server + database + cache) in a single `docker-compose.yml` file. It handles container startup order, networking, and volume persistence automatically." },
        { t: "h", x: "Example: Nextcloud + MariaDB Stack" },
        {
          t: "code",
          lang: "bash",
          title: "docker-compose.yml for a web app + database",
          x: "# docker-compose.yml\nversion: '3.8'\n\nservices:\n  # MariaDB Database\n  db:\n    image: mariadb:11\n    container_name: mariadb\n    restart: always\n    environment:\n      MYSQL_ROOT_PASSWORD: rootsecret\n      MYSQL_DATABASE: appdb\n      MYSQL_USER: appuser\n      MYSQL_PASSWORD: apppassword\n    volumes:\n      # Persist database files on the host\n      - db_data:/var/lib/mysql\n\n  # Web Application\n  web:\n    image: nginx:alpine\n    container_name: my-web\n    restart: always\n    ports:\n      - \"80:80\"\n      - \"443:443\"\n    volumes:\n      # Mount local config into container\n      - ./nginx.conf:/etc/nginx/nginx.conf:ro\n      - web_static:/var/www/html\n    depends_on:\n      - db\n\n# Named persistent volumes\nvolumes:\n  db_data:\n  web_static:"
        },
        { t: "h", x: "Starting and Managing the Stack" },
        {
          t: "code",
          lang: "bash",
          title: "Compose lifecycle commands",
          x: "# Start all services in detached mode (-d)\ndocker compose up -d\n\n# Check status of all services\ndocker compose ps\n\n# View combined logs from all containers\ndocker compose logs -f\n\n# Stop all services but keep volumes\ndocker compose stop\n\n# Stop and REMOVE containers, networks (but keep volumes by default)\ndocker compose down\n\n# Stop, remove containers AND delete persistent volumes\ndocker compose down -v"
        },
        { t: "tip", x: "Use `docker compose up -d --build` to rebuild images before starting the stack, ensuring your latest code changes are included without having to manually run `docker build` first." },
        { t: "warn", x: "Running `docker compose down -v` deletes ALL named volumes including your database. Keep regular database backups with `docker exec mariadb mysqldump -u root appdb > backup.sql` before running destructive commands." }
      ]
    }
  ]
};