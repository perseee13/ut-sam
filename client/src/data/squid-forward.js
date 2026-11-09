/* Squid sub-topic: Forward Proxy - Detailed Production Lab Guide */
export const FORWARD_PROXY = {
  slug: "forward-proxy",
  crumb: "Squid Proxy / Forward Proxy",
  kicker: "Core Gateway Lab",
  icon: "➡️",
  title: "Forward Proxy Architecture",
  sum: "Configure a high-performance caching forward proxy on port 3128. Enforce local subnet ACLs, cache frequent static web assets to disk, and drastically reduce external WAN bandwidth consumption.",
  meta: ["📚 4 sections", "⏱ 25 min step-by-step", "🔌 port 3128 TCP"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status squid --no-pager" },
    { prompt: "client", cmd: "export http_proxy=http://192.168.1.10:3128" },
    { prompt: "client", cmd: "curl -I http://example.com" },
    { ok: "✓ HTTP/1.1 200 OK — X-Cache: HIT from squid-node" }
  ],
  progressPrefix: "squid-forward",
  lessons: [
    {
      id: "architecture-and-traffic-flow",
      title: "Architecture & Network Traffic Flow",
      min: 8,
      sum: "Understand the packet flow between LAN clients, the Squid caching engine, and public origin web servers.",
      blocks: [
        { t: "p", x: "A **Forward Proxy** acts as an intermediary for client devices on an internal private network (such as an office, school lab, or home network) seeking resources from external web servers across the internet." },
        {
          t: "img",
          src: "/diagrams/forward-proxy.svg",
          caption: "Complete request lifecycle: Client requests are intercepted at port 3128, evaluated against Access Control Lists (ACLs), and served from UFS disk cache if available (HIT) or retrieved upstream (MISS)."
        },
        { t: "h", x: "The Complete Step-by-Step Request Lifecycle" },
        {
          t: "ul",
          x: [
            "**Step 1: Client Proxy Handshake**: Client browsers or command-line tools (`curl`, `apt`) configured with `http_proxy=http://<proxy-ip>:3128` send an HTTP request to Squid instead of directly contacting the destination.",
            "**Step 2: ACL & Security Evaluation**: Squid checks the client's source IP address against defined Access Control Lists (`acl localnet src ...`). Requests from unapproved subnets receive an immediate `403 Forbidden` response.",
            "**Step 3: Cache Key Lookup**: Squid computes an MD5 hash of the requested URL. If the asset exists in memory or the UFS disk spool (`/var/spool/squid`) and has not expired according to HTTP headers (`Cache-Control`, `Expires`), Squid delivers a **TCP_HIT** in microseconds.",
            "**Step 4: Upstream WAN Fetch (On Miss)**: If the item is missing or stale (**TCP_MISS**), Squid opens an outbound socket to the remote web server, fetches the object, stores a copy in local cache, and streams the payload back to the client."
          ]
        },
        { t: "tip", x: "Caching repetitive downloads (like OS software updates, common images, and package repositories) can reduce school or office external bandwidth usage by up to 60%." }
      ]
    },
    {
      id: "installation-and-service-setup",
      title: "Step 1: Install & Verify Squid Daemon",
      min: 5,
      sum: "Install the official Squid proxy package on Ubuntu/Debian and inspect default runtime ports.",
      blocks: [
        { t: "p", x: "Begin by updating the local package repositories and installing the **squid** service binary, then verify the daemon and inspect its default configuration." },
        { t: "h", x: "Step 1: Update and Installation" },
        {
          t: "code",
          lang: "bash",
          title: "Update and Install Squid",
          x: "sudo apt update\nsudo apt install squid -y"
        },
        {
          t: "img",
          src: "/images/update.jpg",
          caption: "Update package lists (sudo apt update).",
          alt: "Terminal showing apt update output"
        },
        {
          t: "img",
          src: "/images/install.jpg",
          caption: "Install Squid (sudo apt install squid -y).",
          alt: "Terminal showing Squid installation"
        },
        { t: "h", x: "Step 2: Verify Installation and Service" },
        {
          t: "code",
          lang: "bash",
          title: "Check Version & Manage Service",
          x: "# checking the version of squid\nsquid -v\n\nsudo systemctl start squid\nsudo systemctl enable squid\nsudo systemctl status squid"
        },
        {
          t: "img",
          src: "/images/enable.jpg",
          caption: "Start and enable the Squid service.",
          alt: "Terminal showing Squid service started/enabled"
        },
        {
          t: "img",
          src: "/images/status.jpg",
          caption: "Verify Squid service status (systemctl status squid).",
          alt: "Terminal showing Squid service status"
        },
        { t: "h", x: "Step 3: Check the Default Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "Open Default squid.conf",
          x: "sudo nano /etc/squid/squid.conf"
        },
        {
          t: "img",
          src: "/images/squidconf.jpg",
          caption: "Check the default Squid configuration (/etc/squid/squid.conf).",
          alt: "Terminal showing squid.conf in nano"
        },
        { t: "tip", x: "By default, Squid listens on `http_port 3128`, but its default security policy rejects any client that is not `localhost`. You’ll allow your LAN in the next step." }
      ]
    },
    {
      id: "configuration-and-acls",
      title: "Step 2: Production squid.conf & ACLs",
      min: 7,
      sum: "Define your private LAN subnet in access control lists and enable persistent disk caching.",
      blocks: [
        { t: "p", x: "The primary Squid configuration file is located at `/etc/squid/squid.conf`. Before editing, always create a pristine backup of the original vendor configuration file." },
        {
          t: "code",
          lang: "bash",
          title: "Create Configuration Backup",
          x: "sudo cp /etc/squid/squid.conf /etc/squid/squid.conf.original"
        },
        { t: "h", x: "Configuring Subnet Access and Storage Spool" },
        { t: "p", x: "Edit `/etc/squid/squid.conf` using `sudo nano` or your preferred editor. Add your local network CIDR block and configure a 4 GB disk cache spool:" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (Core Directives)",
          x: "# Proxy listening port\nhttp_port 3128\n\n# Define trusted local networks (Change to match your subnet)\nacl localnet src 192.168.1.0/24\nacl localnet src 10.0.0.0/8\n\n# Standard Safe and SSL Ports\nacl SSL_ports port 443\nacl Safe_ports port 80          # http\nacl Safe_ports port 21          # ftp\nacl Safe_ports port 443         # https\nacl Safe_ports port 1025-65535  # unregistered ports\n\n# Security Rules: Block dangerous non-standard ports\nhttp_access deny !Safe_ports\nhttp_access deny CONNECT !SSL_ports\n\n# Grant access to your defined LAN\nhttp_access allow localnet\nhttp_access allow localhost\n\n# Deny all remaining unsolicited connections\nhttp_access deny all\n\n# Persistent Disk Cache: 4096 MB disk space, 16 level-1 dirs, 256 level-2 dirs\ncache_dir ufs /var/spool/squid 4096 16 256\nmaximum_object_size 128 MB\ncache_mem 256 MB"
        },
        { t: "h", x: "Validating Configuration Syntax" },
        { t: "p", x: "Never reload a proxy blind. Always run the internal config parser to detect syntax mistakes before reloading the live service." },
        {
          t: "code",
          lang: "bash",
          title: "Parse & Reload Squid",
          x: "# Test for syntax errors\nsudo squid -k parse\n\n# If no fatal errors are reported, reload without dropping active connections\nsudo systemctl reload squid"
        },
        {
          t: "img",
          src: "/images/parse.jpg",
          caption: "Validate configuration syntax with squid -k parse, then reload Squid.",
          alt: "Terminal showing squid -k parse and reload"
        },
        { t: "warn", x: "Squid rules are evaluated sequentially from top to bottom. If you place `http_access deny all` above `http_access allow localnet`, all client requests will be rejected." }
      ]
    },
    {
      id: "testing-and-verification",
      title: "Step 3: Client Testing & Cache Verification",
      min: 5,
      sum: "Point client workstations or terminal sessions to Squid and verify live HIT/MISS access logs.",
      blocks: [
        { t: "p", x: "To verify your new forward proxy, configure a client computer on the same LAN subnet (e.g., `192.168.1.50`)." },
        { t: "h", x: "Method A: Command-Line Client Test with curl" },
        {
          t: "code",
          lang: "bash",
          title: "Run from client terminal",
          x: "# Export proxy environment variables pointing to Squid server (192.168.1.10)\nexport http_proxy=http://192.168.1.10:3128\nexport https_proxy=http://192.168.1.10:3128\n\n# Make an HTTP request and inspect headers\ncurl -I http://example.com"
        },
        {
          t: "img",
          src: "/images/curl.jpg",
          caption: "Client test using curl through the Squid forward proxy.",
          alt: "Terminal showing curl test through Squid proxy"
        },
        { t: "h", x: "Method B: Inspecting Real-Time Access Logs on the Server" },
        { t: "p", x: "On the Squid server, watch `/var/log/squid/access.log`. Every client request generates a log entry showing the response status code, source IP, and whether it was a **TCP_MISS** or **TCP_HIT**:" },
        {
          t: "code",
          lang: "bash",
          title: "Monitor Live Squid Traffic",
          x: "sudo tail -f /var/log/squid/access.log\n\n# Expected output:\n# 1718902800.123 192.168.1.50 TCP_MISS/200 1256 GET http://example.com/ - HIER_DIRECT/93.184.216.34 text/html\n# 1718902804.881 192.168.1.51 TCP_HIT/200 1264 GET http://example.com/ - HIER_NONE/- text/html"
        },
        {
          t: "img",
          src: "/images/tail.jpg",
          caption: "Live access log monitoring with tail — admins can track which sites users visit through the proxy (access.log).",
          alt: "Terminal showing tail -f /var/log/squid/access.log output"
        },
        { t: "h", x: "Admin Monitoring: Tracking User Site Visits" },
        { t: "p", x: "Squid records every proxied request in `/var/log/squid/access.log`, including the client IP, timestamp, HTTP method/status, and the destination site/URL. Administrators can use `tail -f` for real-time monitoring or review the log later for auditing and troubleshooting." },
        { t: "warn", x: "Access logs may contain sensitive browsing activity. Restrict log file permissions, follow your organization’s privacy policy, and inform users when monitoring is in place." },
        { t: "h", x: "Firewall Configuration (ufw)" },
        {
          t: "code",
          lang: "bash",
          title: "Allow Port 3128 in UFW Firewall",
          x: "# Restrict port 3128 only to your internal LAN subnet\nsudo ufw allow from 192.168.1.0/24 to any port 3128 proto tcp comment 'Squid Forward Proxy'\nsudo ufw status numbered"
        },
        { t: "tip", x: "Notice in the second log line above: `TCP_HIT/200` with `HIER_NONE`. This confirms Squid served the asset entirely from local disk in 0ms without sending a single byte out to the internet!" }
      ]
    }
  ]
};
