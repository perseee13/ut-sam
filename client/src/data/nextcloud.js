/* Nextcloud topic: self-hosted cloud — detailed step-by-step guide */
export const NEXTCLOUD = {
  slug: "nextcloud",
  crumb: "Nextcloud",
  kicker: "Self-hosted Cloud topic",
  icon: "☁",
  title: "Nextcloud Private Cloud",
  sum: "Deploy your own self-hosted cloud platform with Nextcloud. Store files, sync devices, share documents, and run calendar and contacts — completely under your control, with no subscription fees.",
  meta: ["📚 4 sections", "⏱ 45 min step-by-step", "🔌 ports 80 / 443 HTTPS"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo -u www-data php /var/www/nextcloud/occ status" },
    { prompt: "admin", cmd: "sudo -u www-data php /var/www/nextcloud/occ user:list" },
    { ok: "✓ Nextcloud online — file sync active on all devices" }
  ],
  progressPrefix: "nextcloud",
  lessons: [
    {
      id: "nextcloud-basics",
      title: "Architecture: Nextcloud Stack and Components",
      min: 8,
      sum: "Understand the LAMP stack, how Nextcloud stores files and metadata, and what you need for a production-ready installation.",
      blocks: [
        { t: "p", x: "**Nextcloud** is a self-hosted alternative to Google Drive, Microsoft 365, and Dropbox. It provides file storage, sharing, desktop/mobile sync, calendar, contacts, and real-time document collaboration — all on your own Linux server, with zero monthly fees and complete data ownership." },
        {
          t: "img",
          src: "/diagrams/nextcloud.svg",
          caption: "Nextcloud Architecture: The web browser or desktop sync client connects over HTTPS to Apache/Nginx (port 443). PHP-FPM executes Nextcloud application logic, reading and writing file metadata to MariaDB and actual file data to the local filesystem (/var/www/nextcloud/data). Redis provides file locking and session caching for performance."
        },
        { t: "h", x: "Nextcloud Software Stack Requirements" },
        {
          t: "ul",
          x: [
            "**Web Server**: Apache2 (easier, recommended for beginners) or Nginx (higher performance). Must support `.htaccess` rewriting (Apache `mod_rewrite`).",
            "**PHP**: Nextcloud requires PHP 8.1 or newer with extensions: `gd`, `curl`, `xml`, `zip`, `intl`, `mbstring`, `bcmath`, `imagick`, `opcache`, `mysql`.",
            "**Database**: MariaDB (recommended for best compatibility) or PostgreSQL. SQLite is supported for development only — never for production.",
            "**Optional but Recommended**: Redis (for file locking and session cache — critical for performance with multiple users) and Certbot (Let's Encrypt TLS certificate)."
          ]
        },
        { t: "h", x: "Self-Hosted vs Cloud Storage Comparison" },
        {
          t: "ul",
          x: [
            "**Google Drive (15 GB free / $3/mo)**: Convenient but Google can read your files, suspend your account, and is subject to US law. No air-gap possible.",
            "**Nextcloud (self-hosted)**: Unlimited storage (limited only by your disks), zero monthly fees after setup, data never leaves your premises, works offline, and survives internet outages.",
            "**Best for**: Small businesses, schools, families, home labs, and anyone handling sensitive documents (medical records, legal files, confidential business data)."
          ]
        },
        { t: "tip", x: "Nextcloud has a **Snap package** (`sudo snap install nextcloud`) for a one-command install. However, the manual LAMP installation covered in this guide gives you full control over configuration, performance tuning, and troubleshooting." }
      ]
    },
    {
      id: "nextcloud-install",
      title: "Step 1: Install LAMP Stack and Download Nextcloud",
      min: 12,
      sum: "Install Apache, MariaDB, and PHP with all required extensions. Download the Nextcloud archive and set correct file ownership.",
      blocks: [
        { t: "p", x: "The LAMP stack installation is the most critical phase. Missing a PHP extension or setting wrong file ownership causes hard-to-diagnose errors during the Nextcloud web installer." },
        { t: "h", x: "Install All Required Packages" },
        {
          t: "code",
          lang: "bash",
          title: "Install Apache, PHP 8.2, and MariaDB",
          x: "# Update repositories\nsudo apt update && sudo apt upgrade -y\n\n# Install Apache web server\nsudo apt install -y apache2\n\n# Install MariaDB database server\nsudo apt install -y mariadb-server\n\n# Install PHP 8.2 and ALL required Nextcloud extensions\nsudo apt install -y php8.2 libapache2-mod-php8.2 php8.2-mysql \\\n  php8.2-gd php8.2-curl php8.2-xml php8.2-zip php8.2-intl \\\n  php8.2-mbstring php8.2-bcmath php8.2-imagick php8.2-opcache \\\n  php8.2-apcu php8.2-redis php8.2-bz2 php8.2-ldap\n\n# Enable Apache modules required by Nextcloud\nsudo a2enmod rewrite headers env dir mime setenvif\n\n# Start and enable services\nsudo systemctl enable --now apache2 mariadb\n\n# Verify PHP version and modules\nphp --version\nphp -m | grep -E '(gd|curl|zip|intl|mbstring|opcache)'"
        },
        { t: "h", x: "Download and Extract Nextcloud" },
        {
          t: "code",
          lang: "bash",
          title: "Download the latest Nextcloud release",
          x: "# Navigate to a temporary directory\ncd /tmp\n\n# Download the latest Nextcloud release (check nextcloud.com/install for latest version)\ncurl -O https://download.nextcloud.com/server/releases/latest.tar.bz2\ncurl -O https://download.nextcloud.com/server/releases/latest.tar.bz2.sha256\n\n# Verify the checksum to ensure download integrity\nsha256sum -c latest.tar.bz2.sha256\n# Expected: latest.tar.bz2: OK\n\n# Extract to web root\nsudo tar -xjf latest.tar.bz2 -C /var/www/\n\n# Set ownership to Apache's user (www-data)\nsudo chown -R www-data:www-data /var/www/nextcloud\nsudo chmod -R 755 /var/www/nextcloud\n\n# Create data directory OUTSIDE web root (best practice)\nsudo mkdir -p /var/nextcloud-data\nsudo chown -R www-data:www-data /var/nextcloud-data"
        },
        { t: "h", x: "Create the MariaDB Database" },
        {
          t: "code",
          lang: "bash",
          title: "Set up MariaDB and create Nextcloud database",
          x: "# Secure MariaDB installation first\nsudo mysql_secure_installation\n# Press Enter for root password, Y for all prompts\n\n# Log into MariaDB\nsudo mysql -u root\n\n# Create database, user, and grant permissions\nCREATE DATABASE nextcloud CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;\nCREATE USER 'nextcloud'@'localhost' IDENTIFIED BY 'StrongDBPassword123!';\nGRANT ALL PRIVILEGES ON nextcloud.* TO 'nextcloud'@'localhost';\nFLUSH PRIVILEGES;\nEXIT;"
        },
        { t: "tip", x: "Store the database password in `/root/.nextcloud-db-password` with `chmod 600` permissions. You will need it during the web setup wizard and for future `occ` command maintenance." }
      ]
    },
    {
      id: "nextcloud-apache-config",
      title: "Step 2: Configure Apache Virtual Host and Complete Web Setup",
      min: 10,
      sum: "Create an Apache virtual host for Nextcloud, complete the web-based setup wizard, and verify all components are working.",
      blocks: [
        { t: "p", x: "Apache needs a dedicated **Virtual Host** configuration file pointing to the Nextcloud directory and enabling all the rewrite rules Nextcloud requires for pretty URLs and security headers." },
        { t: "h", x: "Create Apache Virtual Host Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/apache2/sites-available/nextcloud.conf",
          x: "sudo tee /etc/apache2/sites-available/nextcloud.conf << 'EOF'\n<VirtualHost *:80>\n    ServerName cloud.yourdomain.com\n    DocumentRoot /var/www/nextcloud/\n\n    <Directory /var/www/nextcloud/>\n        Require all granted\n        AllowOverride All\n        Options FollowSymLinks MultiViews\n\n        <IfModule mod_dav.c>\n            Dav off\n        </IfModule>\n    </Directory>\n\n    ErrorLog ${APACHE_LOG_DIR}/nextcloud_error.log\n    CustomLog ${APACHE_LOG_DIR}/nextcloud_access.log combined\n</VirtualHost>\nEOF\n\n# Enable the Nextcloud site\nsudo a2ensite nextcloud.conf\n\n# Disable the default Apache page\nsudo a2dissite 000-default.conf\n\n# Test configuration and restart\nsudo apache2ctl configtest\nsudo systemctl restart apache2"
        },
        { t: "h", x: "Complete the Nextcloud Web Setup Wizard" },
        {
          t: "code",
          lang: "bash",
          title: "Open browser and complete setup",
          x: "# Open your browser and navigate to:\n# http://cloud.yourdomain.com   (or http://192.168.1.10 for local access)\n\n# In the Setup Wizard, fill in:\n# Admin account:\n#   Username: admin\n#   Password: YourStrongAdminPassword!\n\n# Data folder:\n#   /var/nextcloud-data   (the directory outside web root we created)\n\n# Database:\n#   MySQL/MariaDB\n#   Database user: nextcloud\n#   Database password: StrongDBPassword123!\n#   Database name: nextcloud\n#   Database host: localhost\n\n# Click 'Install'\n# After installation, verify via CLI:\nsudo -u www-data php /var/www/nextcloud/occ status"
        },
        { t: "h", x: "Add Additional Users via CLI" },
        {
          t: "code",
          lang: "bash",
          title: "Create user accounts with occ command",
          x: "# Create a new Nextcloud user\nsudo -u www-data php /var/www/nextcloud/occ user:add alice\n# Enter and confirm password when prompted\n\n# List all users\nsudo -u www-data php /var/www/nextcloud/occ user:list\n\n# Reset a forgotten password\nsudo -u www-data php /var/www/nextcloud/occ user:resetpassword alice"
        },
        { t: "warn", x: "If the web setup wizard shows a blank page or 500 error, check Apache error logs: `sudo tail -50 /var/log/apache2/nextcloud_error.log`. Most common cause is a missing PHP extension or incorrect directory permissions on `/var/nextcloud-data`." }
      ]
    },
    {
      id: "nextcloud-hardening",
      title: "Step 3: Enable HTTPS, Redis Caching, and Security Hardening",
      min: 15,
      sum: "Install a TLS certificate with Let's Encrypt, configure Redis for performance, enable background jobs, and apply security headers.",
      blocks: [
        { t: "p", x: "A plain HTTP Nextcloud is insecure — passwords and files transmit unencrypted. Add TLS, Redis caching, and proper PHP performance settings to bring the installation up to production standards." },
        { t: "h", x: "Enable HTTPS with Let's Encrypt Certbot" },
        {
          t: "code",
          lang: "bash",
          title: "Install Certbot and obtain TLS certificate",
          x: "# Install Certbot with Apache plugin\nsudo apt install -y certbot python3-certbot-apache\n\n# Obtain and auto-configure HTTPS certificate\n# Certbot automatically modifies your Apache config\nsudo certbot --apache -d cloud.yourdomain.com\n\n# Certbot will ask if you want to redirect HTTP to HTTPS — choose Yes\n# Your Nextcloud is now at: https://cloud.yourdomain.com\n\n# Test automatic renewal (certbot renews every 90 days via systemd timer)\nsudo certbot renew --dry-run"
        },
        { t: "h", x: "Install and Configure Redis for Performance" },
        {
          t: "code",
          lang: "bash",
          title: "Install Redis and connect it to Nextcloud",
          x: "# Install Redis server and PHP Redis extension\nsudo apt install -y redis-server php8.2-redis\n\n# Enable Redis\nsudo systemctl enable --now redis-server\n\n# Add Redis configuration to Nextcloud's config.php\nsudo tee -a /var/www/nextcloud/config/config.php << 'EOF'\n  'memcache.local' => '\\OC\\Memcache\\APCu',\n  'memcache.locking' => '\\OC\\Memcache\\Redis',\n  'redis' => array(\n    'host' => 'localhost',\n    'port' => 6379,\n  ),\n  'filelocking.enabled' => true,\nEOF\n\n# Restart Apache to load PHP Redis extension\nsudo systemctl restart apache2"
        },
        { t: "h", x: "Tune PHP OpCache for Nextcloud" },
        {
          t: "code",
          lang: "bash",
          title: "Recommended PHP OpCache settings",
          x: "# Edit /etc/php/8.2/apache2/conf.d/10-opcache.ini\nsudo tee -a /etc/php/8.2/apache2/conf.d/10-opcache.ini << 'EOF'\nopcache.enable=1\nopcache.interned_strings_buffer=16\nopcache.max_accelerated_files=10000\nopcache.memory_consumption=128\nopcache.save_comments=1\nopcache.revalidate_freq=1\nEOF\n\nsudo systemctl restart apache2"
        },
        { t: "h", x: "Set Up Nextcloud Background Jobs (Cron)" },
        {
          t: "code",
          lang: "bash",
          title: "Configure cron for background tasks",
          x: "# Add Nextcloud cron job for www-data user\nsudo crontab -u www-data -e\n\n# Add this line to run background tasks every 5 minutes:\n# */5 * * * * php -f /var/www/nextcloud/cron.php\n\n# Switch Nextcloud to use system cron (faster and more reliable than AJAX)\nsudo -u www-data php /var/www/nextcloud/occ background:cron\n\n# Verify the Nextcloud admin panel shows no warnings:\n# Settings → Administration → Overview"
        },
        { t: "tip", x: "After setup, install the **Nextcloud desktop client** from nextcloud.com/install on your Windows or Mac — it creates a sync folder just like Dropbox. Changes on any device sync to all others through your server within seconds." },
        { t: "warn", x: "Set up automated backups: `sudo rsync -a /var/nextcloud-data /backup/nextcloud-data/` and `sudo mysqldump -u nextcloud -p nextcloud > /backup/nextcloud-db.sql`. Without backups, a hard drive failure means permanent data loss." }
      ]
    }
  ]
};
