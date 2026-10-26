/* Squid sub-topic: Reverse Proxy - Detailed Production Lab Guide */
export const REVERSE_PROXY = {
  slug: "reverse-proxy",
  crumb: "Squid Proxy / Reverse Proxy",
  kicker: "Web Accelerator Lab",
  icon: "🔁",
  title: "Reverse Proxy & Web Accelerator",
  sum: "Deploy Squid in front of web applications on ports 80 and 443. Terminate TLS, absorb high-traffic spikes through aggressive memory caching, and protect internal application backends from direct internet exposure.",
  meta: ["📚 4 sections", "⏱ 25 min step-by-step", "🔌 ports 80 / 443 TCP"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo ss -tulpn | grep -E ':(80|443)'" },
    { prompt: "client", cmd: "curl -I https://app.example.com" },
    { ok: "✓ 200 OK — X-Cache: HIT from squid-accelerator" }
  ],
  progressPrefix: "squid-reverse",
  lessons: [
    {
      id: "architecture-and-concepts",
      title: "Architecture & Accelerator Concepts",
      min: 7,
      sum: "Learn how Squid sits in front of origin web applications to offload TLS, serve cached static assets, and shield backends.",
      blocks: [
        { t: "p", x: "Unlike a forward proxy that serves internal LAN clients reaching outward, a **Reverse Proxy (Web Accelerator)** sits directly in front of backend web application servers (like Node.js, Python FastAPI, or Apache) and faces the public internet." },
        {
          t: "img",
          src: "/diagrams/reverse-proxy.svg",
          caption: "Reverse Proxy Architecture: Internet visitors connect to Squid on ports 80/443. Squid terminates incoming TLS, serves cached static assets directly, and proxies dynamic requests to origin backends on port 8080."
        },
        { t: "h", x: "Key Operational Benefits" },
        {
          t: "ul",
          x: [
            "**Backend Shielding**: Dynamic origin servers listen on local loopback (`127.0.0.1:8080`) or private network interfaces, completely isolated from direct public internet port scanning.",
            "**Static Asset Offloading**: Images, CSS, JavaScript bundles, and cached API responses are delivered straight from Squid RAM/SSD without touching your database or application workers.",
            "**TLS Offloading & SSL Acceleration**: Squid handles CPU-intensive cryptographic handshakes at the edge, forwarding plain HTTP to backend application containers.",
            "**Smart Routing (URL Path Dispatch)**: Route incoming requests based on path (e.g., `/api` to Node.js backend, `/static` to storage, `/blog` to CMS)."
          ]
        },
        { t: "tip", x: "Squid calls this feature **accelerator mode** or **httpd-accelerator**, activated by adding the `accel` flag to the `http_port` directive." }
      ]
    },
    {
      id: "backend-and-prerequisites",
      title: "Step 1: Set Up Backend App on Port 8080",
      min: 5,
      sum: "Prepare an internal web application running on local port 8080 that will be accelerated by Squid.",
      blocks: [
        { t: "p", x: "Before configuring Squid as a reverse proxy, you need a backend application listening on an internal port (for example, `8080`). You can quickly spin up an Nginx, Python, or Node.js test server." },
        { t: "h", x: "Quick Test Origin Server with Python" },
        {
          t: "code",
          lang: "bash",
          title: "Run lightweight test server on 127.0.0.1:8080",
          x: "# Create a simple web directory with a test file\nmkdir -p /tmp/backend-site\necho '<h1>Origin Web Application Active</h1><p>Served via Squid Reverse Proxy</p>' > /tmp/backend-site/index.html\n\n# Start a background server on port 8080 bound only to localhost\npython3 -m http.server 8080 --bind 127.0.0.1 --directory /tmp/backend-site &\n\n# Test the backend directly\ncurl -I http://127.0.0.1:8080"
        },
        { t: "tip", x: "Notice the `--bind 127.0.0.1` flag: binding to localhost ensures the app cannot be reached directly from the network, only through Squid." }
      ]
    },
    {
      id: "squid-accelerator-config",
      title: "Step 2: Configure squid.conf as an Accelerator",
      min: 8,
      sum: "Configure http_port accel, define cache_peer parents, and specify origin server rules.",
      blocks: [
        { t: "p", x: "In `/etc/squid/squid.conf`, declare Squid as an HTTP accelerator on port 80 (or 443) and define the backend server as a **parent cache_peer**:" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (Accelerator Configuration)",
          x: "# Listen on standard HTTP port 80 in accelerator mode\n# defaultsite specifies the hostname clients expect\nhttp_port 80 accel defaultsite=mysite.local vhost\n\n# Define backend origin server:\n# Host: 127.0.0.1 | Type: parent | HTTP Port: 8080 | ICP Port: 0 (disabled)\n# no-query: do not send ICP pings\n# originserver: treat this peer as an authoritative origin\ncache_peer 127.0.0.1 parent 8080 0 no-query originserver name=my_backend\n\n# Access control: Map public requests to the backend peer\nacl our_sites dstdomain mysite.local 127.0.0.1 localhost\nhttp_access allow our_sites\ncache_peer_access my_backend allow our_sites\ncache_peer_access my_backend deny all\n\n# Allow public access to accelerated domains\nhttp_access allow all\n\n# Cache rules for static assets (cache images and css for 1 day)\nrefresh_pattern -i \\.(jpg|jpeg|png|gif|css|js|woff2)$ 1440 90% 10080"
        },
        { t: "h", x: "Testing Syntax and Applying the Config" },
        {
          t: "code",
          lang: "bash",
          title: "Parse & Reload Squid",
          x: "# Validate configuration file\nsudo squid -k parse\n\n# Reload service gracefully\nsudo systemctl reload squid\n\n# Confirm Squid is now bound to port 80\nsudo ss -tulpn | grep :80"
        },
        { t: "warn", x: "Ensure no other web server (such as default Apache or Nginx) is already bound to port 80 on the host, otherwise Squid will fail with `Address already in use`." }
      ]
    },
    {
      id: "verification-and-benchmarking",
      title: "Step 3: Test Reverse Proxy & Cache Behavior",
      min: 5,
      sum: "Send test requests through port 80, inspect HTTP response headers, and verify cache hits.",
      blocks: [
        { t: "p", x: "Send an HTTP request to Squid on port 80. Squid should query the origin server on port 8080 and deliver the response back to your client:" },
        {
          t: "code",
          lang: "bash",
          title: "Send Client HTTP Request to Squid Accelerator",
          x: "# First request (Origin fetch - TCP_MISS)\ncurl -i http://localhost/\n\n# Second request (Served from Squid memory/disk cache - TCP_HIT)\ncurl -i http://localhost/"
        },
        { t: "h", x: "Inspecting Accelerator Access Logs" },
        { t: "p", x: "Review `/var/log/squid/access.log` to confirm the reverse proxy dispatch:" },
        {
          t: "code",
          lang: "bash",
          title: "Monitor Reverse Proxy Traffic",
          x: "sudo tail -n 10 /var/log/squid/access.log\n\n# Output showing first request forwarded to peer, second served from cache:\n# 127.0.0.1 TCP_MISS/200 812 GET http://mysite.local/ - FIRSTUP_PARENT/127.0.0.1 text/html\n# 127.0.0.1 TCP_HIT/200 820 GET http://mysite.local/ - HIER_NONE/- text/html"
        },
        { t: "h", x: "Opening Port 80 in Firewall" },
        {
          t: "code",
          lang: "bash",
          title: "UFW Firewall Rules for Public Reverse Proxy",
          x: "sudo ufw allow 80/tcp comment 'Squid Reverse Proxy HTTP'\nsudo ufw allow 443/tcp comment 'Squid Reverse Proxy HTTPS'\nsudo ufw status numbered"
        },
        { t: "tip", x: "Notice the `FIRSTUP_PARENT/127.0.0.1` in the log: this explicitly proves Squid contacted the private backend and shielded it from the client!" }
      ]
    }
  ]
};
