/* Squid sub-topic: Intercept & SSL Bump - Detailed Production Lab Guide */
export const INTERCEPT_SSL_BUMP = {
  slug: "intercept-ssl-bump",
  crumb: "Squid Proxy / Intercept & SSL Bump",
  kicker: "HTTPS Security Lab",
  icon: "🔒",
  title: "SSL Bump & HTTPS Interception",
  sum: "Inspect encrypted HTTPS web traffic for malware, DLP (Data Loss Prevention), and domain category filtering. Generate a private Root CA, configure dynamic on-the-fly certificate forgery, and splice privacy-sensitive banking domains.",
  meta: ["📚 4 sections", "⏱ 28 min step-by-step", "🔒 private Root CA :3130"],
  heroTerm: [
    { prompt: "admin", cmd: "openssl req -new -newkey rsa:4096 -days 1095 -nodes -x509 -keyout /etc/squid/bump.key -out /etc/squid/bump.crt" },
    { prompt: "admin", cmd: "/usr/lib/squid/security_file_certgen -c -s /var/lib/squid/ssl_db -M 16MB" },
    { ok: "✓ SSL-Bump engine initialized with dynamic CA!" }
  ],
  progressPrefix: "squid-intercept",
  lessons: [
    {
      id: "ssl-bump-concepts-and-security",
      title: "Architecture & TLS Inspection Concepts",
      min: 7,
      sum: "Understand how Squid breaks down HTTPS into two distinct TLS sessions and why an installed Root CA is required.",
      blocks: [
        { t: "p", x: "Over 95% of modern internet traffic is encrypted using HTTPS (TLS 1.2 and 1.3). Standard transparent proxies can only see the raw IP and port 443, leaving URLs, full paths, payloads, and malware completely invisible. **SSL Bump** enables full Layer-7 inspection by terminating and re-encrypting the TLS stream." },
        {
          t: "img",
          src: "/diagrams/intercept-ssl-bump.svg",
          caption: "SSL Bump Architecture: The client trusts the corporate Root CA. Squid intercepts port 443, dynamically generates a forged certificate matching the target domain, inspects the plaintext HTTP payload, and connects securely upstream."
        },
        { t: "h", x: "The Two-Legged TLS Handshake Breakdown" },
        {
          t: "ul",
          x: [
            "**Leg 1 (Client to Squid)**: The client initiates an HTTPS connection. Squid intercepts the packet and returns a forged X.509 certificate on the fly containing the destination hostname (e.g., `github.com`), signed by your organization's private Root CA.",
            "**Client Trust Verification**: Because the client's operating system has your Root CA installed in its trusted certificate store, the browser validates the green lock with zero security warnings.",
            "**Leg 2 (Squid to Real Destination)**: Squid independently negotiates a standard outbound TLS session with the real destination server across the internet, verifying the real remote certificate against public CAs.",
            "**Payload Inspection**: Squid decrypts the packet, applies access control lists, scans for malware signatures or forbidden URLs, and re-encrypts the response to the client."
          ]
        },
        { t: "warn", x: "Never deploy SSL Bump on personal guest networks without explicit user disclosure and authorization. In many jurisdictions, intercepting unmanaged personal traffic is illegal." }
      ]
    },
    {
      id: "generate-private-root-ca",
      title: "Step 1: Generate Private Root Certificate Authority",
      min: 6,
      sum: "Use OpenSSL to generate a 4096-bit self-signed Root CA and initialize Squid's certificate cache database.",
      blocks: [
        { t: "p", x: "Squid requires its own Root CA private key to sign certificates dynamically for every unique domain your users visit." },
        { t: "h", x: "Generate the CA Certificate and Key" },
        {
          t: "code",
          lang: "bash",
          title: "Generate 4096-bit Root CA",
          x: "sudo mkdir -p /etc/squid/ssl_cert\ncd /etc/squid/ssl_cert\n\n# Generate private key and self-signed certificate valid for 3 years\nsudo openssl req -new -newkey rsa:4096 -days 1095 -nodes -x509 \\\n  -subj '/C=US/ST=Lab/L=Tech/O=Enterprise Security/CN=Enterprise Lab SSL Proxy CA' \\\n  -keyout /etc/squid/ssl_cert/squid_ca.key \\\n  -out /etc/squid/ssl_cert/squid_ca.crt\n\n# Combine into single PEM file and restrict permissions to squid user\nsudo cat /etc/squid/ssl_cert/squid_ca.crt /etc/squid/ssl_cert/squid_ca.key > /etc/squid/ssl_cert/squid_ca.pem\nsudo chown -R proxy:proxy /etc/squid/ssl_cert\nsudo chmod 600 /etc/squid/ssl_cert/squid_ca.key\nsudo chmod 600 /etc/squid/ssl_cert/squid_ca.pem"
        },
        { t: "h", x: "Initialize Certificate Cache Database" },
        { t: "p", x: "Squid caches generated certificates on disk so it does not need to compute heavy RSA keys on every request. Initialize the database using `security_file_certgen`:" },
        {
          t: "code",
          lang: "bash",
          title: "Initialize ssl_db Directory",
          x: "sudo rm -rf /var/lib/squid/ssl_db\nsudo /usr/lib/squid/security_file_certgen -c -s /var/lib/squid/ssl_db -M 16MB\nsudo chown -R proxy:proxy /var/lib/squid/ssl_db"
        },
        { t: "tip", x: "The `squid_ca.crt` public file is what you distribute to client devices. The `squid_ca.key` private file must NEVER leave the proxy server." }
      ]
    },
    {
      id: "configure-ssl-bump-rules",
      title: "Step 2: Configure squid.conf with Peek & Splice",
      min: 8,
      sum: "Define selective bumping policies: splice sensitive banking/medical domains and bump general web traffic.",
      blocks: [
        { t: "p", x: "Modern production proxies do not blindly bump everything. You should **splice** (pass through without decrypting) sensitive categories like healthcare and banking, and **bump** general websites:" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (SSL-Bump Directives)",
          x: "# Standard explicit proxy listener\nhttp_port 3128\n\n# Transparent SSL Bump listener on port 3130\nhttp_port 3130 intercept ssl-bump generate-host-certificates=on dynamic_cert_mem_cache_size=16MB cert=/etc/squid/ssl_cert/squid_ca.pem\n\n# Dynamic certificate generation helper\nsslcrtd_program /usr/lib/squid/security_file_certgen -s /var/lib/squid/ssl_db -M 16MB\n\n# Define LAN access\nacl localnet src 192.168.1.0/24\n\n# Domain whitelist: Domains to NEVER decrypt (Splice mode - pure passthrough)\nacl sensitive_sites ssl::server_name .chase.com .bankofamerica.com .paypal.com .wellsfargo.com\n\n# SSL-Bump Steps:\n# Step 1: Peek at the SNI (Server Name Indication) in ClientHello\nssl_bump peek all\n\n# Step 2: Splice sensitive banking sites without decrypting\nssl_bump splice sensitive_sites\n\n# Step 3: Bump and decrypt all remaining sites\nssl_bump bump all\n\nhttp_access allow localnet\nhttp_access allow localhost\nhttp_access deny all"
        },
        { t: "h", x: "Verify Configuration & Reload" },
        {
          t: "code",
          lang: "bash",
          title: "Parse & Restart Squid",
          x: "sudo squid -k parse\nsudo systemctl restart squid\nsudo ss -tulpn | grep 3130"
        },
        { t: "tip", x: "`ssl_bump peek all` inspects the SNI domain name from the initial unencrypted TLS handshake, letting Squid make intelligent routing decisions before deciding to decrypt." }
      ]
    },
    {
      id: "deploy-ca-and-test",
      title: "Step 3: Deploy Root CA to Clients & Test",
      min: 7,
      sum: "Install your Root CA on client browsers and workstations, redirect port 443 with iptables, and verify decryption.",
      blocks: [
        { t: "p", x: "Copy `/etc/squid/ssl_cert/squid_ca.crt` to your client computer. Install it into the operating system or browser trusted root certificate store:" },
        { t: "h", x: "Installing CA on Ubuntu / Debian Clients" },
        {
          t: "code",
          lang: "bash",
          title: "Install CA on Linux Client Workstation",
          x: "sudo cp squid_ca.crt /usr/local/share/ca-certificates/squid_ca.crt\nsudo update-ca-certificates"
        },
        { t: "h", x: "Redirecting Outbound HTTPS via iptables on Gateway" },
        {
          t: "code",
          lang: "bash",
          title: "Redirect Outbound Port 443 to Squid 3130",
          x: "sudo iptables -t nat -A PREROUTING -i eth1 -p tcp --dport 443 -j REDIRECT --to-port 3130\nsudo iptables -t nat -L -n -v"
        },
        { t: "h", x: "Verifying Decryption & Splice in Action" },
        {
          t: "code",
          lang: "bash",
          title: "Run from client machine",
          x: "# 1. Inspect a bumped site: Notice issuer is your private CA!\ncurl -v https://example.com 2>&1 | grep -i 'issuer'\n# Output: issuer: C=US; ST=Lab; L=Tech; O=Enterprise Security; CN=Enterprise Lab SSL Proxy CA\n\n# 2. Inspect a spliced banking site: Remains signed by DigiCert/Let's Encrypt!\ncurl -v https://paypal.com 2>&1 | grep -i 'issuer'"
        },
        { t: "tip", x: "By checking the certificate issuer via `curl -v`, you can instantly verify that normal web traffic is safely inspected while banking sites maintain 100% untouched end-to-end encryption!" }
      ]
    }
  ]
};
