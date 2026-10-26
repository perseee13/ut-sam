/* Linux Mail Server topic: Postfix + Dovecot — detailed step-by-step guide */
export const MAIL_SERVER = {
  slug: "mail-server",
  crumb: "Linux Mail Server",
  kicker: "Mail Server topic",
  icon: "📧",
  title: "Linux Mail Server",
  sum: "Deploy a complete self-hosted mail server with Postfix (SMTP delivery) and Dovecot (IMAP). Configure mailboxes, Spam filtering with SpamAssassin, TLS encryption, and DNS records for reliable email delivery.",
  meta: ["📚 4 sections", "⏱ 40 min step-by-step", "🔌 ports 25 / 587 / 993"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status postfix dovecot --no-pager" },
    { prompt: "admin", cmd: "echo 'Test mail' | mail -s 'Hello' office@yourdomain.com" },
    { ok: "✓ status=sent — Postfix delivered, Dovecot ready for IMAP clients" }
  ],
  progressPrefix: "mailserver",
  lessons: [
    {
      id: "what-is-mailserver",
      title: "Architecture: How Email Travels from Sender to Inbox",
      min: 8,
      sum: "Understand the complete email delivery chain: MTA, MDA, MUA, SMTP, and IMAP — and how Postfix and Dovecot implement each role.",
      blocks: [
        { t: "p", x: "A self-hosted mail server is two cooperating programs: **Postfix** handles transport — it receives incoming SMTP connections and delivers outgoing mail — while **Dovecot** serves stored messages to email clients (Outlook, Thunderbird, phones) over IMAP or POP3." },
        {
          t: "img",
          src: "/diagrams/mail-server.svg",
          caption: "Email Delivery Chain: Outgoing mail from your domain goes through Postfix (SMTP submission port 587) → to remote MX servers on port 25. Incoming mail from external servers arrives on port 25 → Postfix stores it in /var/mail → Dovecot serves it to email clients on IMAPS port 993. SPF, DKIM, and DMARC DNS records authenticate your outgoing mail to prevent spam classification."
        },
        { t: "h", x: "Email Protocol Roles" },
        {
          t: "ul",
          x: [
            "**MTA (Mail Transfer Agent)**: Postfix. Moves email between servers using SMTP. Port 25 for server-to-server, port 587 for user submission (with login).",
            "**MDA (Mail Delivery Agent)**: Postfix's local delivery transport or Dovecot's LMTP. Places incoming messages into the user's mailbox directory (Maildir format).",
            "**MUA (Mail User Agent)**: Thunderbird, Outlook, Apple Mail, your phone's mail app. Connects to Dovecot to fetch messages via IMAP (port 993 with TLS) or POP3.",
            "**DNS records required**: MX record (points to your mail server), SPF TXT record (authorizes your IP to send mail for your domain), and optionally DKIM (cryptographic signature) and DMARC (policy)."
          ]
        },
        { t: "h", x: "Why Self-Hosted Email is Complex" },
        {
          t: "ul",
          x: [
            "**IP Reputation**: Your server's public IP must not be on any blacklists (check: mxtoolbox.com/blacklists). Residential IPs are almost always blocked from sending mail.",
            "**Reverse DNS (PTR)**: Your hosting provider must set a PTR record for your IP resolving to your mail server's hostname (e.g., `mail.yourdomain.com`).",
            "**TLS Required**: Modern mail servers reject unencrypted SMTP. Let's Encrypt or a purchased certificate is required.",
            "**Best for LAN/Local**: A local mail server without public DNS is perfect for internal notifications, lab alerts, and application mail that stays within your network."
          ]
        },
        { t: "tip", x: "For a local/intranet mail setup (no internet delivery), you can skip DNS records, TLS, and IP reputation entirely. This guide covers both: internal-only in Steps 1–2, and internet-ready configuration in Steps 3–4." }
      ]
    },
    {
      id: "postfix-install",
      title: "Step 1: Install and Configure Postfix SMTP",
      min: 10,
      sum: "Install Postfix, configure your hostname and domain, set up local mailbox delivery, and send your first test email.",
      blocks: [
        { t: "p", x: "Postfix reads its configuration from two files: `/etc/postfix/main.cf` (main settings) and `/etc/postfix/master.cf` (service process table). The `postconf` command provides a safe way to modify `main.cf` without manually editing the file." },
        { t: "h", x: "Install Postfix and mailutils" },
        {
          t: "code",
          lang: "bash",
          title: "Install packages (select 'Internet Site' when prompted)",
          x: "# Install Postfix. When the ncurses dialog appears:\n# General mail configuration type: Internet Site\n# System mail name: yourdomain.com\nsudo apt update && sudo apt install -y postfix mailutils\n\n# Verify service started correctly\nsudo systemctl status postfix --no-pager\nsudo ss -tlnp | grep ':25'"
        },
        { t: "h", x: "Configure Core Postfix Settings" },
        {
          t: "code",
          lang: "bash",
          title: "Set hostname, domain, and local delivery",
          x: "# Set the mail server hostname (must match your PTR record for internet delivery)\nsudo postconf -e \"myhostname = mail.yourdomain.com\"\n\n# Set the local domain for @yourdomain.com addresses\nsudo postconf -e \"mydomain = yourdomain.com\"\n\n# Domains for which Postfix accepts mail (delivers locally)\nsudo postconf -e \"mydestination = \\$myhostname, localhost.\\$mydomain, localhost, \\$mydomain\"\n\n# Networks allowed to relay mail through this server\n# (127.0.0.1 = localhost only; add your LAN if needed)\nsudo postconf -e \"mynetworks = 127.0.0.0/8 [::1]/128 192.168.1.0/24\"\n\n# Mailbox format: Maildir (one file per message, modern and reliable)\nsudo postconf -e \"home_mailbox = Maildir/\"\n\n# Restart to apply all settings\nsudo systemctl restart postfix"
        },
        { t: "h", x: "Create Mailbox Users and Send Test Mail" },
        {
          t: "code",
          lang: "bash",
          title: "Add users and test local delivery",
          x: "# Create a Linux user with a home directory (Maildir will live in ~/Maildir/)\nsudo adduser --gecos 'Office User' office\n\n# Send a test email to the 'office' local mailbox\necho 'This is a test message from Postfix.' | mail -s 'Postfix Test' office\n\n# Watch the mail log for delivery confirmation\nsudo tail -f /var/log/mail.log\n# Look for: status=sent (delivered to maildir)\n\n# Read the delivered mail (as user 'office')\nsudo -u office mail"
        },
        { t: "tip", x: "If `status=deferred` appears in the mail log, Postfix could not deliver the message immediately. Run `postqueue -p` to see the queue and `postqueue -f` to flush (retry) all deferred messages." },
        { t: "warn", x: "Never set `mynetworks` to `0.0.0.0/0` or comment it out — this creates an **open relay** that spammers worldwide will immediately discover and abuse to send billions of spam emails through your server." }
      ]
    },
    {
      id: "dovecot-imap",
      title: "Step 2: Install Dovecot IMAP and Connect Mail Clients",
      min: 10,
      sum: "Configure Dovecot to serve IMAP with TLS, connect Thunderbird and your phone, and verify that sent mail appears in the inbox.",
      blocks: [
        { t: "p", x: "**Dovecot** reads the same Maildir directories that Postfix writes into and serves the messages to email clients over IMAP (port 143) or IMAPS (port 993 with TLS). Email clients download and sync messages from Dovecot." },
        { t: "h", x: "Install Dovecot IMAP" },
        {
          t: "code",
          lang: "bash",
          title: "Install and start Dovecot",
          x: "# Install Dovecot IMAP daemon\nsudo apt install -y dovecot-imapd\n\n# Enable and start the service\nsudo systemctl enable dovecot\nsudo systemctl start dovecot\n\n# Verify it is listening on IMAP ports\nsudo ss -tlnp | grep -E ':(143|993)'\nsudo systemctl status dovecot --no-pager"
        },
        { t: "h", x: "Configure Dovecot to Read Maildir" },
        {
          t: "code",
          lang: "bash",
          title: "Set Maildir mailbox location in Dovecot config",
          x: "# Tell Dovecot where Postfix delivers mail (Maildir format)\nsudo tee /etc/dovecot/conf.d/10-mail.conf.patch << 'EOF'\n# Maildir location (in user's home directory)\nmail_location = maildir:~/Maildir\nEOF\n\n# Update the existing file\nsudo sed -i 's|#mail_location =.*|mail_location = maildir:~/Maildir|' \\\n  /etc/dovecot/conf.d/10-mail.conf\n\n# Restart Dovecot to apply\nsudo systemctl restart dovecot"
        },
        { t: "h", x: "Open Firewall for IMAP Access from LAN" },
        {
          t: "code",
          lang: "bash",
          title: "Allow IMAP from your LAN subnet",
          x: "# IMAP (plain, use only on trusted LAN)\nsudo ufw allow from 192.168.1.0/24 to any port 143 proto tcp comment 'IMAP'\n\n# IMAPS (TLS — preferred)\nsudo ufw allow from 192.168.1.0/24 to any port 993 proto tcp comment 'IMAPS'\n\n# SMTP submission (users sending mail)\nsudo ufw allow from 192.168.1.0/24 to any port 587 proto tcp comment 'SMTP submission'\n\nsudo ufw status numbered"
        },
        { t: "h", x: "Configure Your Email Client (Thunderbird Example)" },
        {
          t: "code",
          lang: "bash",
          title: "Thunderbird / Outlook / Phone settings",
          x: "# IMAP (incoming mail) settings:\n# Server:   192.168.1.10   (your mail server IP)\n# Port:     993 (IMAPS with SSL/TLS)\n# Username: office   (Linux account name)\n# Password: (Linux user password)\n\n# SMTP (outgoing mail) settings:\n# Server:   192.168.1.10\n# Port:     587 (STARTTLS)\n# Username: office\n# Password: (Linux user password)"
        },
        { t: "tip", x: "If your mail client reports SSL certificate errors when connecting to the local server, choose 'Accept this certificate' (for a LAN-only setup) or install a proper TLS certificate using Let's Encrypt Certbot for internet-facing deployments." }
      ]
    },
    {
      id: "spam-tls-dns",
      title: "Step 3: TLS Encryption, SpamAssassin, and DNS Records",
      min: 12,
      sum: "Secure all mail connections with TLS, install SpamAssassin to filter incoming spam, and configure SPF/MX DNS records for legitimate internet mail delivery.",
      blocks: [
        { t: "p", x: "For a mail server that delivers email to the public internet (Gmail, Outlook, Yahoo), you need: TLS certificates, SPF DNS record, and a clean IP reputation. Without these, your mail will be rejected or silently discarded into spam folders." },
        { t: "h", x: "Get a TLS Certificate with Certbot (Let's Encrypt)" },
        {
          t: "code",
          lang: "bash",
          title: "Install Certbot and obtain a certificate for your domain",
          x: "# Install Certbot (assumes you have Apache or Nginx for webroot validation)\nsudo apt install -y certbot\n\n# Obtain certificate (standalone mode — stops any web server briefly)\nsudo certbot certonly --standalone -d mail.yourdomain.com\n\n# Certificates are saved to:\n# /etc/letsencrypt/live/mail.yourdomain.com/fullchain.pem\n# /etc/letsencrypt/live/mail.yourdomain.com/privkey.pem"
        },
        { t: "h", x: "Configure Postfix and Dovecot to Use TLS" },
        {
          t: "code",
          lang: "bash",
          title: "Enable TLS in Postfix main.cf",
          x: "# Postfix TLS for incoming SMTP (smtpd)\nsudo postconf -e \"smtpd_tls_cert_file = /etc/letsencrypt/live/mail.yourdomain.com/fullchain.pem\"\nsudo postconf -e \"smtpd_tls_key_file = /etc/letsencrypt/live/mail.yourdomain.com/privkey.pem\"\nsudo postconf -e \"smtpd_tls_security_level = may\"\nsudo postconf -e \"smtpd_tls_loglevel = 1\"\n\n# Postfix TLS for outgoing SMTP (smtp)\nsudo postconf -e \"smtp_tls_security_level = may\"\nsudo postconf -e \"smtp_tls_loglevel = 1\"\n\n# Enable port 587 SMTP submission with SASL authentication\n# Edit /etc/postfix/master.cf to uncomment the submission line:\nsudo sed -i '/^#submission/s/^#//' /etc/postfix/master.cf\n\nsudo systemctl restart postfix"
        },
        { t: "h", x: "Install SpamAssassin for Spam Filtering" },
        {
          t: "code",
          lang: "bash",
          title: "Install and enable SpamAssassin",
          x: "# Install SpamAssassin\nsudo apt install -y spamassassin spamc\n\n# Create the spamd user\nsudo useradd -r -s /usr/sbin/nologin spamd\n\n# Enable SpamAssassin daemon\nsudo systemctl enable spamassassin\nsudo systemctl start spamassassin\n\n# Test that SpamAssassin can classify mail\necho 'Subject: Test' | spamc -R\n# Output: Spam detection results: score=..."
        },
        { t: "h", x: "Required DNS Records for Internet Email Delivery" },
        {
          t: "code",
          lang: "bash",
          title: "DNS records to add in your domain registrar",
          x: "# 1. MX Record: tells other mail servers where to send mail for @yourdomain.com\n# Type: MX\n# Name: @ (or yourdomain.com)\n# Value: mail.yourdomain.com\n# Priority: 10\n\n# 2. A Record: resolve mail.yourdomain.com to your server's IP\n# Type: A\n# Name: mail\n# Value: 203.0.113.25   (your server's public IP)\n\n# 3. SPF Record: authorize your server to send mail for the domain\n# Type: TXT\n# Name: @ (or yourdomain.com)\n# Value: \"v=spf1 ip4:203.0.113.25 mx ~all\"\n\n# 4. PTR Record (Reverse DNS): ask your hosting provider to set:\n# 203.0.113.25 → mail.yourdomain.com\n\n# Verify DNS propagation:\ndig MX yourdomain.com\ndig TXT yourdomain.com\ndig -x 203.0.113.25"
        },
        { t: "warn", x: "If you send internet mail from a **residential broadband IP** (home router), your ISP almost certainly blocks outbound port 25 and your IP is on spam blacklists. For reliable internet delivery, you need a dedicated server or VPS from a provider like DigitalOcean, Hetzner, or Vultr with a clean IP and open port 25." }
      ]
    }
  ]
};
