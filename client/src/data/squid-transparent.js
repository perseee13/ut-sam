/* Squid sub-topic: Transparent Proxy - Detailed Production Lab Guide */
export const TRANSPARENT_PROXY = {
  slug: "transparent-proxy",
  crumb: "Squid Proxy / Transparent Proxy",
  kicker: "Inline Gateway Lab",
  icon: "👻",
  title: "Transparent Proxy & NAT Interception",
  sum: "Configure Squid as a transparent (intercepting) proxy: back up config, set up http_port 3128 intercept, enable IP forwarding, add iptables redirect rules, and verify traffic in access.log.",
  meta: ["📚 9 steps", "⏱ 20 min step-by-step", "🔌 gateway NAT :3128"],
  heroTerm: [
    { prompt: "gateway", cmd: "sudo sysctl -w net.ipv4.ip_forward=1" },
    { prompt: "gateway", cmd: "sudo iptables -t nat -A PREROUTING -i enp0s3 -p tcp --dport 80 -j REDIRECT --to-port 3128" },
    { prompt: "client", cmd: "curl -I http://www.ubuntu.com" },
    { ok: "✓ Outbound HTTP intercepted by Squid (transparent proxy)!" }
  ],
  progressPrefix: "squid-transparent",
  lessons: [
    {
      id: "transparent-proxy-setup",
      title: "Transparent Proxy Setup (iptables + Squid Intercept)",
      min: 20,
      sum: "Step-by-step: switch Squid to intercept mode, enable routing, redirect port 80 traffic with iptables, and confirm interception in logs.",
      blocks: [
        { t: "p", x: "In **transparent proxy** mode, clients do not set proxy settings. The gateway/router redirects outbound HTTP (port 80) traffic to Squid using **iptables NAT** rules. Squid listens with the `intercept` flag so it can handle redirected connections." },

        { t: "h", x: "Step 1: Backup the current Reverse Proxy config" },
        {
          t: "code",
          lang: "bash",
          title: "Backup Squid config",
          x: "sudo cp /etc/squid/squid.conf /etc/squid/squid.conf.reverse.bak"
        },

        { t: "h", x: "Step 2: Create a clean Transparent Proxy configuration" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (Transparent Proxy)",
          x: "sudo tee /etc/squid/squid.conf > /dev/null << 'EOF'\n# --- TRANSPARENT PROXY SETUP ---\n# Listen on port 3128 and intercept traffic\nhttp_port 3128 intercept\n\n# Define the local network\nacl localnet src 10.0.2.0/24\n\n# Allow the local network\nhttp_access allow localnet\n\n# Deny all other access\nhttp_access deny all\nEOF"
        },
        { t: "warn", x: "Adjust `acl localnet src 10.0.2.0/24` to match your actual LAN subnet." },

        { t: "h", x: "Step 3: Check syntax and restart Squid" },
        {
          t: "code",
          lang: "bash",
          title: "Validate and restart Squid",
          x: "sudo squid -k parse\nsudo systemctl restart squid"
        },

        { t: "h", x: "Step 4: Enable IP Forwarding (Required for routing traffic)" },
        {
          t: "code",
          lang: "bash",
          title: "Enable IPv4 forwarding",
          x: "sudo sysctl -w net.ipv4.ip_forward=1"
        },

        { t: "h", x: "Step 5: Add the iptables rule to intercept HTTP traffic (Port 80)" },
        {
          t: "code",
          lang: "bash",
          title: "Redirect PREROUTING port 80 to Squid",
          x: "sudo iptables -t nat -A PREROUTING -i enp0s3 -p tcp --dport 80 -j REDIRECT --to-port 3128"
        },
        { t: "tip", x: "Note: `enp0s3` is the example network interface based on the lab setup. If your interface name is different (check with `ip a`), replace `enp0s3` accordingly." },

        { t: "h", x: "Step 6: Test the Transparent Proxy (Without specifying the proxy in curl)" },
        {
          t: "code",
          lang: "bash",
          title: "Test without -x proxy flag",
          x: "curl -I http://www.ubuntu.com"
        },
        { t: "p", x: "Because this test may run on the same machine, iptables might not catch locally generated traffic in the `PREROUTING` chain by default. For local testing, add the next rule." },

        { t: "h", x: "Step 7 (For local testing only): Redirect locally generated traffic to Squid" },
        {
          t: "code",
          lang: "bash",
          title: "Redirect OUTPUT port 80 to Squid",
          x: "sudo iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 3128"
        },

        { t: "h", x: "Step 8: Run the test again (It should now go through Squid without the -x flag)" },
        {
          t: "code",
          lang: "bash",
          title: "Test again",
          x: "curl -I http://www.ubuntu.com"
        },

        { t: "h", x: "Step 9: Verify in the Squid logs (To prove it's working transparently)" },
        {
          t: "code",
          lang: "bash",
          title: "Monitor access log",
          x: "sudo tail -f /var/log/squid/access.log"
        },
        { t: "tip", x: "In the access log, look for requests to `http://www.ubuntu.com` (and often `ORIGINAL_DST` details depending on your setup) to confirm transparent interception is working." }
      ]
    }
  ]
};
