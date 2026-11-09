/* Module 1: Squid Proxy — your first topic */
window.COURSE_MODULES.push({
  id: "squid",
  title: "Squid Proxy",
  icon: "🦑",
  sum: "Run your first caching forward proxy: install Squid, open it to your LAN, filter sites with ACLs and speed up repeat visits with caching.",
  lessons: [
    {
      id: "what-is-squid",
      title: "What is Squid Proxy (and why it is first)",
      min: 10,
      sum: "Forward vs reverse proxies, what caching buys you, and where Squid sits between your LAN and the internet.",
      blocks: [
        { t: "p", x: "Your first topic is **Squid Proxy** because it touches everything else you will learn: networking, services, files and security — in one small, visible project. A client asks Squid, Squid asks the internet, then Squid answers the client — and remembers the answer for next time." },
        { t: "h", x: "Forward proxy vs reverse proxy" },
        { t: "ul", x: [
          "**Forward proxy (Squid default)** — sits near the clients. Your laptop and classmates point their browsers at Squid, and Squid fetches the web for them. Good for caching, filtering and saving bandwidth.",
          "**Reverse proxy (nginx)** — sits in front of a server. The internet talks to nginx, nginx talks to your app. Good for TLS and serving sites.",
          "This module is about the **forward** side: one Squid box serving a whole classroom or office LAN."
        ] },
        { t: "h", x: "What caching buys you" },
        { t: "code", lang: "bash", title: "The idea in one picture", x: "# without proxy: every client fetches from the internet\n# laptop -> internet   (100 MB downloaded 30x = 3000 MB)\n#\n# with Squid: first client fills the cache, the rest reuse it\n# laptop  -> squid (3128) -> internet\n# laptop2 -> squid (HIT from cache, no download)\n#\n# point a client at Squid for a quick test:\nexport http_proxy=http://192.168.1.10:3128\nexport https_proxy=http://192.168.1.10:3128\ncurl -I http://example.com" },
        { t: "h", x: "What Squid does: 4 practical jobs" },
        { t: "fig", img: "assets/images/squid/caching.svg", caption: "1. Caching: First visit downloads from internet; repeat visits are served from Squid cache." },
        { t: "fig", img: "assets/images/squid/access-control.svg", caption: "2. Access Control: Checks every request against ACL rules to permit or block sites." },
        { t: "fig", img: "assets/images/squid/monitoring.svg", caption: "3. Monitoring: Logs every request to access.log for traffic auditing." },
        { t: "fig", img: "assets/images/squid/bandwidth-management.svg", caption: "4. Bandwidth Management: Slashes external network consumption by 50-70%." },
        { t: "tip", x: "Think of Squid as a shared notebook: the first student looks up the answer online and writes it down; the next 29 students just read the notebook. Same web, far less waiting." },
        { t: "warn", x: "A forward proxy sees the domains you visit. Only point your devices at a Squid you or your school runs — never a random proxy IP from the internet." }
      ],
      quiz: [
        { q: "Where does a forward proxy like Squid sit?", opts: ["In front of a web server, facing the internet", "Near the clients — clients ask Squid, Squid asks the internet", "Inside the Linux kernel", "Only inside a web browser"], a: 1, why: "A forward proxy serves clients on your LAN; a reverse proxy sits in front of servers. Squid defaults to the forward side." },
        { q: "What is the main win of Squid caching on a classroom LAN?", opts: ["It makes the internet faster for everyone else", "Repeat downloads are served from Squid instead of re-downloading", "It removes the need for IP addresses", "It replaces SSH"], a: 1, why: "The first fetch fills the cache; later identical requests are HITs served locally — less bandwidth, faster loads." }
      ]
    },
    {
      id: "install-configure",
      title: "Install and configure Squid on Debian 13 (Trixie)",
      min: 15,
      sum: "Step-by-step tutorial: set up Debian 13 (Trixie), install Squid via terminal commands, configure squid.conf, open port 3128, and verify proxy caching.",
      blocks: [
        { t: "p", x: "Debian 13 (Trixie) provides a rock-solid, secure, and modern foundation for Squid Proxy with Linux kernel 6.x and Squid 6.x in the official repositories. Here is the complete step-by-step installation and configuration guide." },
        { t: "h", x: "Step 1: Install and Prepare Debian 13 (Trixie)" },
        { t: "p", x: "Boot the Debian 13 Netinst installer. In the **Software Selection (tasksel)** dialog, uncheck desktop environments (no GUI needed for a server) and check **SSH server** and **standard system utilities**. Leaving the root password blank automatically installs `sudo` and gives your user full administrative privileges." },
        { t: "code", lang: "bash", title: "Verify Debian 13 and Update Packages", x: "# Check Debian release\ncat /etc/os-release\n\n# Identify IP address and network interface\nip -c a\n\n# Update package lists and upgrade system\nsudo apt update && sudo apt upgrade -y\n\n# Install network and administration tools\nsudo apt install -y curl wget nano ufw dnsutils net-tools" },
        { t: "h", x: "Step 1: Update and Installation" },
        { t: "code", lang: "bash", title: "Update and Install Squid", x: "sudo apt update\nsudo apt install squid -y" },
        { t: "h", x: "Step 2: Verify Installation and Service" },
        { t: "code", lang: "bash", title: "Check Version & Manage Service", x: "# checking the version of squid\nsquid -v\n\nsudo systemctl start squid\nsudo systemctl enable squid\nsudo systemctl status squid" },
        { t: "h", x: "Step 3: Check the Default Configuration" },
        { t: "code", lang: "bash", title: "Open Default squid.conf", x: "sudo nano /etc/squid/squid.conf" },
        { t: "code", lang: "bash", title: "/etc/squid/squid.conf (Debian 13 Production Config)", x: "# Proxy listening port\nhttp_port 3128\nvisible_hostname debian-squid.local\n\n# Define LAN access control lists (adjust to match your subnet)\nacl localnet src 192.168.1.0/24\nacl localnet src 10.0.0.0/8\nacl localhost src 127.0.0.1/32 ::1\n\n# Allowed safe ports\nacl Safe_ports port 80          # http\nacl Safe_ports port 443         # https\nacl Safe_ports port 21          # ftp\nacl Safe_ports port 1025-65535  # registered ports\nacl SSL_ports port 443\nacl CONNECT method CONNECT\n\n# Access rules: Top-to-bottom, first match wins\nhttp_access deny !Safe_ports\nhttp_access deny CONNECT !SSL_ports\nhttp_access allow localhost manager\nhttp_access deny manager\nhttp_access allow localnet\nhttp_access allow localhost\nhttp_access deny all\n\n# Cache storage: 4 GB disk cache, 256 MB RAM cache\ncache_mem 256 MB\nmaximum_object_size 64 MB\ncache_dir ufs /var/spool/squid 4096 16 256" },
        { t: "h", x: "Step 4: Validate Syntax, Reload & Configure UFW Firewall" },
        { t: "code", lang: "bash", title: "Validate, Reload & Firewall", x: "# Always check syntax before reloading\nsudo squid -k parse\n\n# Initialize cache directories & reload daemon\nsudo squid -z\nsudo systemctl reload squid\n\n# Open port 3128 for LAN clients in UFW firewall\nsudo ufw allow OpenSSH\nsudo ufw allow from 192.168.1.0/24 to any port 3128 proto tcp\nsudo ufw enable" },
        { t: "h", x: "Step 5: Testing Whether Squid Works Correctly" },
        { t: "code", lang: "bash", title: "Testing with curl and live log monitoring", x: "# Test from Debian server loopback:\ncurl -x http://127.0.0.1:3128 -I http://example.com\n\n# Test from LAN client (e.g. 192.168.1.50):\nexport http_proxy=http://192.168.1.10:3128\nexport https_proxy=http://192.168.1.10:3128\ncurl -I http://example.com\n\n# Monitor live access log for TCP_MISS and TCP_HIT:\nsudo tail -f /var/log/squid/access.log" },
        { t: "tip", x: "Always run `sudo squid -k parse` before reloading. It checks your configuration for syntax errors and typos without interrupting active proxy connections." },
        { t: "warn", x: "Default Squid only permits connections from localhost. You must define your LAN subnet in `acl localnet` and allow it with `http_access allow localnet` before `http_access deny all`." }
      ],
      quiz: [
        { q: "Which command validates the syntax of squid.conf on Debian 13 without restarting the service?", opts: ["sudo systemctl restart squid", "sudo squid -k parse", "sudo apt check squid", "sudo squid --reboot"], a: 1, why: "'squid -k parse' inspects your configuration for errors and reports syntax issues without stopping the daemon." },
        { q: "Which port does Squid listen on by default for HTTP proxy traffic?", opts: ["80", "443", "3128", "8080"], a: 2, why: "Port 3128 is the standard default port for Squid proxy connections." },
        { q: "In /var/log/squid/access.log, what does TCP_HIT indicate?", opts: ["The connection timed out", "Squid served the file from its local cache without fetching it from the internet", "The client was blocked by firewall", "The server ran out of disk space"], a: 1, why: "TCP_HIT means the requested URL was already in cache and was served immediately from local storage." }
      ]
    },
    {
      id: "acls-caching",
      title: "ACLs, filtering and caching",
      min: 11,
      sum: "Allow your LAN, block time-wasting sites, set cache size and read the logs.",
      blocks: [
        { t: "p", x: "Once Squid runs, the real work is **who may use it and what they may fetch**. That is all done with ACLs plus a few cache knobs." },
        { t: "h", x: "Allow the classroom, block the distractions" },
        { t: "code", lang: "bash", title: "/etc/squid/squid.conf — access rules", x: "acl lan src 192.168.1.0/24\nacl blocked dstdomain .games.example .video.example\nhttp_access deny blocked\nhttp_access allow lan\nhttp_access deny all" },
        { t: "ul", x: [
          "Order matters: a `deny blocked` line must sit **above** the broad `allow lan`, or it never triggers.",
          "Start with one LAN range — opening to `all` turns your box into an open relay for strangers."
        ] },
        { t: "h", x: "Cache size and logs" },
        { t: "code", lang: "bash", x: "cache_dir ufs /var/spool/squid 2000 16 256\nmaximum_object_size 128 MB\n# watch the log: first visit TCP_MISS, refresh TCP_HIT:\n# sudo tail -f /var/log/squid/access.log" },
        { t: "tip", x: "Refresh the same page twice while tailing access.log — MISS then HIT is the moment Squid clicks." },
        { t: "warn", x: "HTTPS bodies are encrypted, so Squid caches the connection setup but not the page content unless you do full TLS interception." }
      ],
      quiz: [
        { q: "Why must `deny blocked` come before `allow lan`?", opts: ["Order does not matter", "Squid uses the first matching rule, so the specific deny has to win first", "Because deny rules are ignored", "Because Squid reads bottom-up"], a: 1, why: "Squid stops at the first match. A broad allow placed first would swallow the deny." },
        { q: "In access.log, what does TCP_HIT mean?", opts: ["The request failed", "Squid served it from cache without re-downloading", "The client is blocked", "Squid restarted"], a: 1, why: "TCP_MISS is fetched from the internet; TCP_HIT is served from the local cache." }
      ]
    }
  ]
});
