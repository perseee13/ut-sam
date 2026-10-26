/* Secure by Design topic: Linux security hardening — detailed step-by-step guide */
export const SECURE_BY_DESIGN = {
  slug: "secure-by-design",
  crumb: "Secure by Design",
  kicker: "Security topic",
  icon: "🛡",
  title: "Secure by Design",
  sum: "Harden your Linux server from the ground up: implement the principle of least privilege, lock down SSH with key-based authentication, configure UFW firewall rules, enable automatic security updates, and detect intrusions with fail2ban.",
  meta: ["📚 4 sections", "⏱ 38 min step-by-step", "🔌 ports 22 / 80 / 443"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo ufw status verbose" },
    { prompt: "admin", cmd: "sudo fail2ban-client status sshd" },
    { ok: "✓ Firewall active, fail2ban blocking brute-force — server hardened" }
  ],
  progressPrefix: "secure-by-design",
  lessons: [
    {
      id: "security-principles",
      title: "Architecture: Linux Security Model and Hardening Principles",
      min: 8,
      sum: "Understand the Linux security model — DAC, users, kernel capabilities, and the five key hardening principles that protect a server from the most common attack categories.",
      blocks: [
        { t: "p", x: "Linux is **secure by design** — every process, file, socket, and device has an owner and a set of permissions enforced by the kernel. The kernel's Discretionary Access Control (DAC) model means that even if an attacker compromises a service, they can only access what that service's user account is authorized to access. A compromised `www-data` process cannot read your SSH keys in `/root/.ssh/`." },
        {
          t: "img",
          src: "/diagrams/forward-proxy.svg",
          caption: "Linux Defense in Depth: The outermost layer is the network firewall (UFW/iptables) blocking unneeded ports. fail2ban watches for brute-force attempts and bans offending IPs. SSH is restricted to key-only authentication. Each service runs as a dedicated unprivileged user. AppArmor profiles limit system calls. Log monitoring (auditd/journald) captures anomalies. Multiple independent layers mean no single breach compromises the whole server."
        },
        { t: "h", x: "The Five Core Security Hardening Principles" },
        {
          t: "ul",
          x: [
            "**Least Privilege**: Every user account, service daemon, and process should have the minimum permissions needed — nothing more. `www-data` can read `/var/www/html` but cannot write to `/etc/ssh/`. A compromised web process cannot escalate to root.",
            "**Defense in Depth**: Layer multiple independent security controls. If the firewall is misconfigured, fail2ban stops brute-force. If fail2ban misses something, SSH key-only auth prevents password guessing. If an account is compromised, AppArmor limits kernel syscalls. No single point of failure.",
            "**Minimal Attack Surface**: Disable and remove every service, port, and package you don't actively use. Each running service is a potential vulnerability. A server running only Nginx and SSH has a far smaller attack surface than one with Apache, MySQL, FTP, Telnet, and RPC portmapper all running.",
            "**Fail Securely**: Configure services to deny by default and explicitly allow what is needed. UFW's default is `deny incoming` — new ports must be explicitly opened. Samba's ACL denies non-members by default.",
            "**Audit and Monitor**: If you're not logging it, you won't know when you're breached. journald, auditd, and fail2ban logs are your early-warning system."
          ]
        },
        { t: "tip", x: "Run `sudo lynis audit system` (install with `sudo apt install lynis`) for an automated Linux security audit. Lynis scores your system from 0–100 and provides a prioritized hardening checklist specific to your server's configuration." }
      ]
    },
    {
      id: "users-and-permissions",
      title: "Step 1: Users, Groups, and File Permission Hardening",
      min: 8,
      sum: "Implement least privilege with proper user accounts, group membership, file ownership, and permission bits to prevent privilege escalation.",
      blocks: [
        { t: "p", x: "Every file on Linux has three permission sets: **owner** (u), **group** (g), and **others** (o). Each set has read (r=4), write (w=2), and execute (x=1) bits. Understanding and correctly setting these is the most fundamental security skill on Linux." },
        { t: "h", x: "Create Service Users with Minimal Access" },
        {
          t: "code",
          lang: "bash",
          title: "Create dedicated service accounts",
          x: "# Create a system account for a custom app (no home, no login shell)\n# -r: system account (UID < 1000)\n# -s /usr/sbin/nologin: cannot log in interactively\n# -d /opt/myapp: home directory (even if no login)\nsudo useradd -r -s /usr/sbin/nologin -d /opt/myapp -m myapp\n\n# Create a group for multiple app users\nsudo groupadd webteam\n\n# Add an existing user to the group\nsudo usermod -aG webteam alice\n\n# List all groups a user belongs to\ngroups alice\n\n# Check effective user ID and groups in current session\nid"
        },
        { t: "h", x: "Understanding and Setting File Permissions" },
        {
          t: "code",
          lang: "bash",
          title: "Read permission output and apply safe permissions",
          x: "# Read permission output: -rw-r--r-- 1 root root 1234 Oct 24 12:00 /etc/passwd\n# Format: [type][u-perm][g-perm][o-perm] [links] [owner] [group] [size] [date] [name]\n# type: - (file), d (directory), l (symlink)\n# Each perm: r (read=4), w (write=2), x (execute=1), - (none=0)\n\n# Examples:\n# 0644 = rw-r--r-- : Owner read/write, group read, others read (config files)\n# 0600 = rw------- : Owner read/write only (private keys, password files)\n# 0755 = rwxr-xr-x : Owner full, group/others read+execute (binaries, public dirs)\n# 0700 = rwx------ : Owner only (private directories: ~/.ssh, app data)\n# 0770 = rwxrwx--- : Owner and group full (shared project directories)\n\n# Set permissions\nsudo chmod 0600 /root/.ssh/authorized_keys\nsudo chmod 0700 /root/.ssh\nsudo chmod 0644 /etc/nginx/nginx.conf\n\n# Set ownership: chown owner:group path\nsudo chown -R www-data:www-data /var/www/html\nsudo chown root:root /etc/ssh/sshd_config\n\n# Find world-writable files (a common security issue)\nsudo find / -perm -o+w -not -path '/proc/*' -not -path '/sys/*' 2>/dev/null"
        },
        { t: "h", x: "Configure sudo Access Safely" },
        {
          t: "code",
          lang: "bash",
          title: "Grant limited sudo access without full root",
          x: "# NEVER edit /etc/sudoers directly — use visudo which validates syntax\nsudo visudo\n\n# Give user 'alice' full sudo access:\nalice ALL=(ALL:ALL) ALL\n\n# Give 'alice' sudo for ONLY nginx commands (safer approach):\nalice ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl status nginx\n\n# Add to sudoers.d instead (cleaner):\necho 'alice ALL=(root) NOPASSWD: /usr/bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/alice-nginx\nsudo chmod 440 /etc/sudoers.d/alice-nginx"
        },
        { t: "warn", x: "**NEVER use `chmod 777`** on any file or directory. World-writable means any process running on the server — even a compromised web application — can modify that file. This single mistake has led to countless server compromises where attackers replaced legitimate scripts with malware." }
      ]
    },
    {
      id: "ssh-hardening",
      title: "Step 2: SSH Key Authentication and Connection Hardening",
      min: 10,
      sum: "Generate an SSH key pair, deploy the public key to the server, disable password authentication, and configure connection rate limiting.",
      blocks: [
        { t: "p", x: "**SSH (port 22) is the most attacked service on the internet.** Within minutes of a new server going online, automated bots begin attempting thousands of username/password combinations per minute. The solution is simple and permanent: switch to key-based authentication and disable password login entirely." },
        { t: "h", x: "Generate SSH Key Pair on Your Local Machine" },
        {
          t: "code",
          lang: "bash",
          title: "Generate Ed25519 key pair (most secure algorithm)",
          x: "# Run this on YOUR LOCAL MACHINE (laptop/desktop) — NOT the server!\n\n# Generate a modern Ed25519 key pair\n# Ed25519 is faster and more secure than RSA-2048\nssh-keygen -t ed25519 -C 'admin@myserver-$(date +%Y%m%d)' -f ~/.ssh/myserver_key\n\n# Enter a strong passphrase when prompted (protects the private key file)\n# Passphrase can be stored in your OS keychain for convenience\n\n# This creates two files:\n# ~/.ssh/myserver_key       <- PRIVATE KEY: never share, never upload, never email!\n# ~/.ssh/myserver_key.pub   <- PUBLIC KEY: safe to share — this goes on the server"
        },
        { t: "h", x: "Deploy Public Key to the Server" },
        {
          t: "code",
          lang: "bash",
          title: "Copy public key to server authorized_keys",
          x: "# Method 1: ssh-copy-id (simplest, from local machine)\nssh-copy-id -i ~/.ssh/myserver_key.pub admin@192.168.1.10\n\n# Method 2: Manual setup on the server\n# On SERVER — as the target user:\nmkdir -p ~/.ssh\nchmod 700 ~/.ssh\n\n# On LOCAL machine — show your public key:\ncat ~/.ssh/myserver_key.pub\n# Copy the output\n\n# On SERVER — paste into authorized_keys:\nnano ~/.ssh/authorized_keys\n# Paste the public key on its own line, save\nchmod 600 ~/.ssh/authorized_keys\n\n# Test key authentication BEFORE disabling passwords!\n# (Open a NEW terminal and test while keeping the current session open)\nssh -i ~/.ssh/myserver_key admin@192.168.1.10"
        },
        { t: "h", x: "Harden sshd_config" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/ssh/sshd_config — Security hardening settings",
          x: "# Edit the SSH daemon configuration\nsudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak\nsudo nano /etc/ssh/sshd_config\n\n# Key settings to change/verify:\n\n# === Authentication ===\nPermitRootLogin no              # Root cannot login via SSH at all\nPasswordAuthentication no       # Disable password login (key-only from now on!)\nPubkeyAuthentication yes        # Enable key authentication\nAuthenticationMethods publickey # Only allow key authentication\n\n# === Connection Security ===\nMaxAuthTries 3          # Disconnect after 3 failed attempts\nLoginGraceTime 30       # Disconnect if login not completed in 30 seconds\nClientAliveInterval 300 # Send keepalive every 5 minutes\nClientAliveCountMax 2   # Disconnect after 2 missed keepalives (10 min idle)\n\n# === Exposure Reduction ===\nAllowUsers admin alice  # ONLY these users can SSH in (everyone else is rejected)\nPort 22                 # Change to a non-standard port to reduce scan noise (optional)\n\n# === Validate and apply ===\nsudo sshd -t  # Validate config syntax (no output = success)\nsudo systemctl reload sshd"
        },
        { t: "warn", x: "**Critical**: Set `PasswordAuthentication no` ONLY after confirming key authentication works in a separate terminal session. If you lock yourself out without key access, you will need physical console access (or hosting panel emergency console) to recover." }
      ]
    },
    {
      id: "firewall-fail2ban",
      title: "Step 3: UFW Firewall and fail2ban Intrusion Prevention",
      min: 12,
      sum: "Configure UFW to enforce a default-deny firewall policy, create per-application rules, and deploy fail2ban to automatically ban IP addresses attempting brute-force attacks.",
      blocks: [
        { t: "p", x: "**UFW (Uncomplicated Firewall)** provides a simple interface to iptables, Linux's kernel-level packet filtering system. **fail2ban** monitors log files for repeated authentication failures and automatically bans offending IP addresses at the firewall level." },
        { t: "h", x: "Configure UFW with Default-Deny Policy" },
        {
          t: "code",
          lang: "bash",
          title: "Set up UFW with production security rules",
          x: "# Install UFW if not present\nsudo apt install -y ufw\n\n# === Step 1: Set defaults BEFORE enabling (prevents lock-out) ===\nsudo ufw default deny incoming    # Deny ALL inbound connections by default\nsudo ufw default allow outgoing   # Allow all outbound connections\n\n# === Step 2: Add rules for services you actually run ===\n# Allow SSH (ALWAYS add this first — before enabling!)\nsudo ufw allow 22/tcp comment 'SSH access'\n\n# If you changed SSH port (e.g., to 2222):\n# sudo ufw allow 2222/tcp comment 'SSH on custom port'\n\n# Web server (HTTP + HTTPS)\nsudo ufw allow 80/tcp comment 'HTTP'\nsudo ufw allow 443/tcp comment 'HTTPS'\n\n# Restrict Samba to LAN only (never expose to internet)\nsudo ufw allow from 192.168.1.0/24 to any port 445 proto tcp comment 'Samba LAN'\n\n# === Step 3: Enable UFW ===\nsudo ufw enable\n# Answer 'y' when prompted\n\n# === Step 4: Verify active rules ===\nsudo ufw status verbose"
        },
        { t: "h", x: "Advanced UFW Rules: Rate Limiting and Logging" },
        {
          t: "code",
          lang: "bash",
          title: "Enable UFW's built-in SSH rate limiting",
          x: "# UFW's built-in rate limiting for SSH:\n# Denies connections if an IP makes 6+ connection attempts in 30 seconds\nsudo ufw limit 22/tcp\n\n# Enable UFW logging (medium level captures blocked packets)\nsudo ufw logging medium\n\n# View recent UFW log entries\nsudo tail -f /var/log/ufw.log\n\n# Show numbered rules (needed for deleting specific rules)\nsudo ufw status numbered\n\n# Delete a rule by number\nsudo ufw delete 5\n\n# Delete a rule by specification\nsudo ufw delete allow 80/tcp"
        },
        { t: "h", x: "Install and Configure fail2ban" },
        {
          t: "code",
          lang: "bash",
          title: "Deploy fail2ban to block brute-force attacks",
          x: "# Install fail2ban\nsudo apt install -y fail2ban\n\n# Create local configuration (never edit jail.conf directly — it gets overwritten on update)\nsudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local\n\n# Configure SSH jail in jail.local\nsudo tee /etc/fail2ban/jail.d/sshd.conf << 'EOF'\n[sshd]\nenabled = true\nport = ssh\nfilter = sshd\nlogpath = /var/log/auth.log\n# Number of failures before banning\nmaxretry = 5\n# How long to look back for failures (10 minutes)\nfindtime = 600\n# How long to ban (1 hour = 3600 seconds)\nbantime = 3600\n# IPs to NEVER ban (your own management IP!)\nignoreip = 127.0.0.1/8 192.168.1.0/24\nEOF\n\n# Enable and start fail2ban\nsudo systemctl enable --now fail2ban\n\n# Check ban status for sshd jail\nsudo fail2ban-client status sshd\n\n# Manually unban an IP (if you accidentally lock yourself out)\nsudo fail2ban-client set sshd unbanip 203.0.113.50"
        },
        { t: "h", x: "Enable Automatic Security Updates" },
        {
          t: "code",
          lang: "bash",
          title: "Configure unattended-upgrades for security patches",
          x: "# Install the automatic upgrade package\nsudo apt install -y unattended-upgrades apt-listchanges\n\n# Enable automatic security updates\nsudo dpkg-reconfigure --priority=low unattended-upgrades\n# Select 'Yes' when asked to enable automatic updates\n\n# Verify the configuration\ncat /etc/apt/apt.conf.d/20auto-upgrades\n# Should show:\n# APT::Periodic::Update-Package-Lists \"1\";\n# APT::Periodic::Unattended-Upgrade \"1\";\n\n# Dry-run to see what would be upgraded\nsudo unattended-upgrade --dry-run --debug 2>&1 | head -30"
        },
        { t: "tip", x: "After hardening, run `sudo lynis audit system` and `sudo nmap -sV -p- localhost` to verify your security posture. Lynis gives you a detailed score and checklist. Nmap confirms which ports are actually open from the outside — the list should be short and intentional." }
      ]
    }
  ]
};
