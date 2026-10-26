/* Full Control topic: systemd, configuration management — detailed step-by-step guide */
export const FULL_CONTROL = {
  slug: "full-control",
  crumb: "Full Control",
  kicker: "Server Control topic",
  icon: "⚙",
  title: "Full Control: systemd & Config Management",
  sum: "Take complete ownership of your Linux server: master systemd service management, write custom unit files, automate configuration management, and implement a reliable change-tracking workflow.",
  meta: ["📚 4 sections", "⏱ 32 min step-by-step", "🔌 systemd / journald / cron"],
  heroTerm: [
    { prompt: "admin", cmd: "systemctl list-units --type=service --state=running" },
    { prompt: "admin", cmd: "journalctl -u nginx -n 50 --no-pager" },
    { ok: "✓ All services running, logs clean — server fully under control" }
  ],
  progressPrefix: "full-control",
  lessons: [
    {
      id: "systemd-architecture",
      title: "Architecture: How systemd Controls Your Linux Server",
      min: 8,
      sum: "Understand the systemd init system: units, targets, dependencies, and why every modern Linux server relies on it for service lifecycle management.",
      blocks: [
        { t: "p", x: "**systemd** is PID 1 — the first process the Linux kernel launches. It is responsible for starting, stopping, and managing every service, socket, timer, and device on your server. Understanding systemd is the difference between a helpless sysadmin who only reboots and an empowered engineer who can diagnose and fix any service issue in minutes." },
        {
          t: "img",
          src: "/diagrams/lxd.svg",
          caption: "systemd Dependency Graph: systemd manages units with dependencies (Requires, Wants, After). 'network-online.target' must be reached before services like nginx.service or squid.service start. If nginx.service fails with Restart=always, systemd automatically restarts it after 5 seconds. journald captures all stdout/stderr output into a structured log database."
        },
        { t: "h", x: "systemd Unit Types" },
        {
          t: "ul",
          x: [
            "**service**: A background daemon (nginx.service, docker.service, postgresql.service). The most common unit type — managing services is the primary daily task.",
            "**timer**: A cron replacement with better logging and dependency handling. `logrotate.timer` replaces the old `/etc/cron.daily/logrotate` script.",
            "**socket**: Activates a service only when a connection arrives on a specific socket or port — saves RAM for rarely used services.",
            "**target**: A milestone grouping multiple units (like `multi-user.target` which represents a fully booted server ready for network services).",
            "**mount / automount**: Manages filesystem mount points with dependency tracking and automatic mounting."
          ]
        },
        { t: "h", x: "The Boot Process: From Kernel to Running Server" },
        {
          t: "code",
          lang: "bash",
          title: "Visualize the systemd boot sequence",
          x: "# Show the complete systemd boot process in a tree diagram\nsystemd-analyze plot > /tmp/boot-plot.svg\n# Open /tmp/boot-plot.svg in a browser to see which services delayed boot\n\n# Show total boot time (firmware + kernel + user-space)\nsystemd-analyze\n# Example: Startup finished in 1.2s (firmware) + 2.4s (loader) + 8.1s (kernel) + 18.3s (userspace)\n\n# Show which specific services are slowing down boot\nsystemd-analyze blame | head -20"
        },
        { t: "tip", x: "Use `systemd-analyze critical-chain nginx.service` to trace the exact dependency chain that must complete before Nginx starts. This is invaluable for diagnosing slow-starting services or ordering problems." }
      ]
    },
    {
      id: "systemctl-commands",
      title: "Step 1: Master systemctl — The Day-to-Day Tool",
      min: 8,
      sum: "Learn every essential systemctl subcommand for starting, stopping, enabling, disabling, masking, and introspecting services.",
      blocks: [
        { t: "p", x: "`systemctl` is the command you use to interact with systemd. Every Linux administrator uses it dozens of times per day. These are the commands that matter most." },
        { t: "h", x: "Core Service Management Commands" },
        {
          t: "code",
          lang: "bash",
          title: "Start, stop, restart, and reload services",
          x: "# Start a stopped service immediately\nsudo systemctl start nginx\n\n# Stop a running service\nsudo systemctl stop nginx\n\n# Restart: stop + start (drops all connections)\nsudo systemctl restart nginx\n\n# Reload configuration WITHOUT dropping connections (if service supports it)\n# Nginx, Postfix, Squid all support reload — prefer this in production!\nsudo systemctl reload nginx\n\n# Reload systemd's unit files after you edit or create .service files\nsudo systemctl daemon-reload"
        },
        { t: "h", x: "Enable, Disable, and Mask Services at Boot" },
        {
          t: "code",
          lang: "bash",
          title: "Control boot-time behavior of services",
          x: "# Enable: create symlink so service starts automatically on next boot\nsudo systemctl enable nginx\n\n# Enable AND start immediately in one command\nsudo systemctl enable --now nginx\n\n# Disable: remove symlink so service no longer starts at boot\n# (does NOT stop the currently running service)\nsudo systemctl disable nginx\n\n# Mask: link the unit file to /dev/null — impossible to start accidentally\n# Use for dangerous or conflicting services (e.g., mask apache2 if using nginx)\nsudo systemctl mask apache2\n\n# Unmask a masked service\nsudo systemctl unmask apache2\n\n# Check if a service is set to start at boot\nsudo systemctl is-enabled nginx"
        },
        { t: "h", x: "Inspecting Service Status and Logs" },
        {
          t: "code",
          lang: "bash",
          title: "Diagnose service status and read logs",
          x: "# Rich status display: state, PID, memory, and last 10 log lines\nsudo systemctl status nginx\n\n# List all FAILED services (the first thing to check after a reboot problem)\nsystemctl list-units --state=failed\n\n# Show all running services (good overview of what's active)\nsystemctl list-units --type=service --state=running\n\n# View the last 50 log lines for a service\nsudo journalctl -u nginx -n 50 --no-pager\n\n# Follow logs in real time (like 'tail -f' for a specific service)\nsudo journalctl -u nginx -f\n\n# View logs from the current boot only\nsudo journalctl -u nginx -b\n\n# View logs from the previous boot (after a crash)\nsudo journalctl -u nginx -b -1"
        },
        { t: "tip", x: "`journalctl -xe` is the single most useful command when a service fails to start. It shows the last journal entries with explanations, and always contains the exact error message that prevents the service from starting." }
      ]
    },
    {
      id: "custom-unit-files",
      title: "Step 2: Write Custom systemd Service Units",
      min: 8,
      sum: "Create professional systemd .service unit files for your custom applications with automatic restart, security hardening, and environment variables.",
      blocks: [
        { t: "p", x: "When you deploy a custom application (a Python API, a Go binary, a Node.js server), you need to run it as a systemd service so it starts at boot, restarts on crash, and logs properly. Writing unit files is a fundamental sysadmin skill." },
        { t: "h", x: "Anatomy of a systemd Unit File" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/systemd/system/myapp.service — Production Template",
          x: "# Create the unit file\nsudo tee /etc/systemd/system/myapp.service << 'EOF'\n[Unit]\n# Human-readable description shown in 'systemctl status'\nDescription=My Production Web Application\n\n# Documentation URL (optional but professional)\nDocumentation=https://github.com/yourorg/myapp\n\n# Start AFTER networking and database are ready\nAfter=network-online.target postgresql.service\nWants=network-online.target\n\n# If the database is REQUIRED (fail if it's not running)\n# Requires=postgresql.service\n\n[Service]\n# Run as an unprivileged dedicated user (NEVER root!)\nUser=deployer\nGroup=deployer\n\n# Working directory for the application\nWorkingDirectory=/opt/myapp\n\n# Full path to the application binary\nExecStart=/opt/myapp/myapp --port 8080 --env production\n\n# Graceful shutdown command (optional — sends SIGTERM by default)\nExecStop=/bin/kill -s TERM $MAINPID\n\n# Load environment variables from a file\n# (keep secrets like API keys here, NOT in the unit file)\nEnvironmentFile=/etc/myapp/environment\n\n# Restart policy: always restart unless manually stopped\nRestart=always\n\n# Wait 5 seconds between restart attempts\nRestartSec=5s\n\n# Redirect stdout/stderr to journald (viewable with journalctl -u myapp)\nStandardOutput=journal\nStandardError=journal\n\n# Security hardening — restrict what the service can access\nNoNewPrivileges=yes\nProtectSystem=strict\nProtectHome=yes\nPrivateTmp=yes\n\n[Install]\n# This service becomes part of the 'multi-user.target' (normal running state)\nWantedBy=multi-user.target\nEOF\n\n# After creating or editing a unit file, ALWAYS reload the daemon\nsudo systemctl daemon-reload\n\n# Enable and start the service\nsudo systemctl enable --now myapp"
        },
        { t: "h", x: "Creating the Application User and Environment File" },
        {
          t: "code",
          lang: "bash",
          title: "Set up dedicated service user and secrets file",
          x: "# Create a dedicated non-login system user for the service\nsudo useradd -r -s /usr/sbin/nologin -d /opt/myapp deployer\n\n# Create the application directory and set ownership\nsudo mkdir -p /opt/myapp\nsudo chown deployer:deployer /opt/myapp\n\n# Create the environment file for secrets\nsudo mkdir -p /etc/myapp\nsudo tee /etc/myapp/environment << 'EOF'\nDB_PASSWORD=super-secret-db-password\nAPI_KEY=my-production-api-key\nJWT_SECRET=random-256-bit-secret\nNODE_ENV=production\nEOF\n\n# Only root and the deployer user should read this file\nsudo chown root:deployer /etc/myapp/environment\nsudo chmod 640 /etc/myapp/environment"
        },
        { t: "warn", x: "Never put passwords or API keys directly in the `.service` unit file — unit files are world-readable by default. Use `EnvironmentFile=` pointing to a file with `chmod 640` and `chown root:serviceuser` permissions." }
      ]
    },
    {
      id: "configuration-management",
      title: "Step 3: Configuration File Management and Change Tracking",
      min: 8,
      sum: "Implement a safe configuration editing workflow with validation steps, git-based change tracking, and automated backup before every edit.",
      blocks: [
        { t: "p", x: "Server configuration is infrastructure code. Treat it with the same discipline as application code: back up before editing, validate after changes, and track everything in version control." },
        { t: "h", x: "Safe Configuration Edit Workflow" },
        {
          t: "code",
          lang: "bash",
          title: "The correct way to edit any config file",
          x: "# === STEP 1: Create a timestamped backup BEFORE editing ===\nCONFIG_FILE='/etc/nginx/nginx.conf'\nsudo cp \"$CONFIG_FILE\" \"${CONFIG_FILE}.bak-$(date +%Y%m%d-%H%M%S)\"\n\n# === STEP 2: Edit the file ===\nsudo nano \"$CONFIG_FILE\"\n\n# === STEP 3: Validate the configuration syntax ===\n# Nginx:\nsudo nginx -t\n\n# Apache:\nsudo apachectl configtest\n\n# Postfix:\nsudo postfix check\n\n# Squid:\nsudo squid -k parse\n\n# Samba:\ntestparm --suppress-prompt\n\n# === STEP 4: Only reload if validation passed ===\nsudo systemctl reload nginx"
        },
        { t: "h", x: "Track /etc Changes with Git" },
        {
          t: "code",
          lang: "bash",
          title: "Initialize a git repository for /etc tracking",
          x: "# Install git\nsudo apt install -y git\n\n# Initialize git tracking in /etc\ncd /etc\nsudo git init\nsudo git config --global user.email 'admin@yourserver.com'\nsudo git config --global user.name 'Server Admin'\n\n# Create a .gitignore for sensitive and binary files\nsudo tee /etc/.gitignore << 'EOF'\npasswd-\ngroup-\nshadow\ngshadow\nmtab\nadjtime\nhostname\ndebian_version\nEOF\n\n# Initial commit of all current config\nsudo git add -A\nsudo git commit -m 'Initial /etc configuration snapshot'\n\n# After each config change, commit it:\nsudo git add /etc/nginx/nginx.conf\nsudo git commit -m 'nginx: increase worker_connections to 2048'"
        },
        { t: "h", x: "Configure Automated Cron Backup of /etc" },
        {
          t: "code",
          lang: "bash",
          title: "Schedule daily /etc backup to a safe location",
          x: "# Create backup script\nsudo tee /usr/local/bin/backup-etc.sh << 'EOF'\n#!/bin/bash\n# Daily /etc backup with 30-day rotation\nBACKUP_DIR=/var/backups/etc\nDATE=$(date +%Y-%m-%d)\nmkdir -p \"$BACKUP_DIR\"\ntar -czf \"$BACKUP_DIR/etc-$DATE.tar.gz\" /etc\n# Delete backups older than 30 days\nfind \"$BACKUP_DIR\" -name 'etc-*.tar.gz' -mtime +30 -delete\nEOF\nsudo chmod +x /usr/local/bin/backup-etc.sh\n\n# Schedule with systemd timer (modern cron replacement)\nsudo tee /etc/systemd/system/backup-etc.service << 'EOF'\n[Unit]\nDescription=Daily /etc backup\n[Service]\nType=oneshot\nExecStart=/usr/local/bin/backup-etc.sh\nEOF\n\nsudo tee /etc/systemd/system/backup-etc.timer << 'EOF'\n[Unit]\nDescription=Daily /etc backup timer\n[Timer]\nOnCalendar=*-*-* 02:30:00\nPersistent=true\n[Install]\nWantedBy=timers.target\nEOF\n\nsudo systemctl daemon-reload\nsudo systemctl enable --now backup-etc.timer"
        },
        { t: "tip", x: "Use `systemctl list-timers` to see all scheduled systemd timers and when they last ran. This replaces the old `crontab -l` for system-level periodic tasks and has the advantage of logging every run to journald." }
      ]
    }
  ]
};
