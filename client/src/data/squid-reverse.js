/* Squid sub-topic: Reverse Proxy - Detailed Production Lab Guide */
export const REVERSE_PROXY = {
  slug: "reverse-proxy",
  crumb: "Squid Proxy / Reverse Proxy",
  kicker: "Web Accelerator Lab",
  icon: "🔁",
  title: "Reverse Proxy & Web Accelerator",
  sum: "Set up Squid as a reverse proxy in front of an Nginx backend: install Nginx on port 8080, point Squid to it on port 80, validate the config, and test with curl/browser.",
  meta: ["📚 10 steps", "⏱ 20 min step-by-step", "🔌 ports 80 / 8080 TCP"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo ss -tulpn | grep -E ':(80|8080)'" },
    { prompt: "client", cmd: "curl -I http://10.0.2.15/" },
    { ok: "✓ 200 OK — Server: nginx (served via Squid reverse proxy)" }
  ],
  progressPrefix: "squid-reverse",
  lessons: [
    {
      id: "reverse-proxy-setup",
      title: "Reverse Proxy Setup (Nginx Backend + Squid)",
      min: 20,
      sum: "Step-by-step: install Nginx, move it to port 8080, configure Squid as a reverse proxy on port 80, then test the full request path.",
      blocks: [
        { t: "p", x: "In this lab, **Nginx** acts as the backend web server on port **8080**, and **Squid** listens on port **80** as a reverse proxy/accelerator. Client requests hit Squid on port 80; Squid forwards them to Nginx on `127.0.0.1:8080`." },

        { t: "h", x: "Step 1: Install Nginx (Backend Web Server)" },
        {
          t: "code",
          lang: "bash",
          title: "Install Nginx",
          x: "sudo apt install nginx -y"
        },
        {
          t: "img",
          src: "/images/reversenginx.jpg",
          caption: "Install Nginx as the backend web server.",
          alt: "Terminal showing Nginx installation for reverse proxy setup"
        },

        { t: "h", x: "Step 2: Change Nginx port from 80 to 8080 (to avoid conflict with Squid)" },
        {
          t: "code",
          lang: "bash",
          title: "Update Nginx listen ports",
          x: "sudo sed -i 's/listen 80 default_server;/listen 8080 default_server;/g' /etc/nginx/sites-available/default\nsudo sed -i 's/listen \\[::\\]:80 default_server;/listen [::]:8080 default_server;/g' /etc/nginx/sites-available/default"
        },

        { t: "h", x: "Step 3: Restart Nginx to apply the new port" },
        {
          t: "code",
          lang: "bash",
          title: "Restart Nginx",
          x: "sudo systemctl restart nginx"
        },

        { t: "h", x: "Step 4: Test if Nginx is working on port 8080" },
        {
          t: "code",
          lang: "bash",
          title: "Test backend directly",
          x: "curl -I http://127.0.0.1:8080/"
        },
        {
          t: "img",
          src: "/images/reverse127.0.0.0.jpg",
          caption: "Test the Nginx backend on 127.0.0.1:8080.",
          alt: "Terminal showing curl test to 127.0.0.1:8080"
        },
        { t: "tip", x: "You should see `HTTP/1.1 200 OK` and `Server: nginx`." },

        { t: "h", x: "Step 5: Backup the current Squid config (so you have something to revert to)" },
        {
          t: "code",
          lang: "bash",
          title: "Backup Squid config",
          x: "sudo cp /etc/squid/squid.conf /etc/squid/squid.conf.forward.bak"
        },

        { t: "h", x: "Step 6: Overwrite the Squid config with the Reverse Proxy setup" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (Reverse Proxy)",
          x: "sudo tee /etc/squid/squid.conf > /dev/null << 'EOF'\n# --- REVERSE PROXY SETUP ---\nhttp_port 80 accel defaultsite=10.0.2.15 no-vhost\ncache_peer 127.0.0.1 parent 8080 0 no-query originserver name=myBackend\nacl our_sites dstdomain 10.0.2.15\nhttp_access allow our_sites\ncache_peer_access myBackend allow our_sites\ncache_peer_access myBackend deny all\nhttp_access deny all\nEOF"
        },
        { t: "warn", x: "Replace `10.0.2.15` with your actual server IP/domain if different. This config is a focused lab example; keep backups so you can restore your forward-proxy setup when needed." },

        { t: "h", x: "Step 7: Check for syntax errors in the new config" },
        {
          t: "code",
          lang: "bash",
          title: "Validate Squid config",
          x: "sudo squid -k parse"
        },
        {
          t: "img",
          src: "/images/reverseparse.jpg",
          caption: "Validate the reverse proxy Squid configuration (squid -k parse).",
          alt: "Terminal showing squid -k parse for reverse proxy config"
        },
        { t: "p", x: "If no errors appear, continue." },

        { t: "h", x: "Step 8: Restart Squid to apply the Reverse Proxy setup" },
        {
          t: "code",
          lang: "bash",
          title: "Restart Squid",
          x: "sudo systemctl restart squid"
        },
        { t: "warn", x: "If you get an `Address already in use` error on port 80, another service is still bound to port 80 (often Nginx/Apache). Stop/disable that service or confirm Nginx is on 8080, then restart Squid." },

        { t: "h", x: "Step 9: Test the Reverse Proxy using curl on port 80" },
        {
          t: "code",
          lang: "bash",
          title: "Test via Squid (port 80)",
          x: "curl -I http://10.0.2.15/"
        },
        {
          t: "img",
          src: "/images/reverse10.0.2.15.jpg",
          caption: "Test the reverse proxy through Squid on port 80 (10.0.2.15).",
          alt: "Terminal showing curl test to reverse proxy at 10.0.2.15"
        },
        { t: "tip", x: "You should see `HTTP/1.1 200 OK` and `Server: nginx` — confirming the request went to Squid on port 80 and was forwarded to the Nginx backend." },

        { t: "h", x: "Step 10: Verify in the browser (optional)" },
        { t: "p", x: "Open your browser and go to `http://10.0.2.15/` — you should see the Nginx default page." }
      ]
    }
  ]
};
