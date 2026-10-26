/* Squid sub-topic: Transparent Proxy - Detailed Production Lab Guide */
export const TRANSPARENT_PROXY = {
  slug: "transparent-proxy",
  crumb: "Squid Proxy / Transparent Proxy",
  kicker: "Inline Gateway Lab",
  icon: "👻",
  title: "Transparent Proxy & NAT Interception",
  sum: "Implement seamless, zero-touch web caching and policy enforcement at the Linux gateway router. Redirect outbound port 80 traffic into Squid's intercept listener without configuring client browser settings.",
  meta: ["📚 4 sections", "⏱ 26 min step-by-step", "🔌 gateway NAT :3129"],
  heroTerm: [
    { prompt: "gateway", cmd: "sudo sysctl -w net.ipv4.ip_forward=1" },
    { prompt: "gateway", cmd: "sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3129" },
    { ok: "✓ Outbound HTTP automatically intercepted by Squid!" }
  ],
  progressPrefix: "squid-transparent",
  lessons: [
    {
      id: "transparent-architecture-and-flow",
      title: "Architecture & Interception Concepts",
      min: 7,
      sum: "Learn how Linux routing and kernel firewall NAT tables silently divert web packets into Squid.",
      blocks: [
        { t: "p", x: "In **Transparent (or Intercepting) Proxy Mode**, client devices do not configure proxy settings in their browsers or operating systems. Instead, the Linux server operates as the network's default gateway router. When outbound web traffic crosses the gateway, kernel firewall rules silently divert destination port 80 packets into Squid." },
        {
          t: "img",
          src: "/diagrams/transparent-proxy.svg",
          caption: "Transparent Proxy Flow: Client sends normal outbound HTTP to port 80. The Linux Gateway's iptables PREROUTING table redirects packets into Squid port 3129 intercept. Squid fetches and caches the resource invisibly."
        },
        { t: "h", x: "Why Transparent Mode is Preferred in Enterprise & Campus Networks" },
        {
          t: "ul",
          x: [
            "**Zero Client Device Configuration**: Ideal for BYOD (Bring Your Own Device) environments, guest Wi-Fi, university dormitories, and IoT hardware where manual proxy configuration is impossible.",
            "**Tamper-Proof Enforcement**: Users cannot bypass caching or domain filtering simply by unchecking proxy checkboxes in their browser settings.",
            "**Preserved Destination Addresses**: The Linux kernel and Squid's intercept engine preserve the original destination IP from the socket connection (`getsockname` / `ORIGINAL_DST`), allowing Squid to fetch the correct remote resource."
          ]
        },
        { t: "warn", x: "Because the client believes it is communicating directly with the remote server, Squid must listen with the special `intercept` flag, not standard `http_port`." }
      ]
    },
    {
      id: "kernel-packet-forwarding",
      title: "Step 1: Enable Linux Kernel IP Forwarding",
      min: 5,
      sum: "Configure the Linux host as a router by enabling IPv4 forwarding in sysctl.",
      blocks: [
        { t: "p", x: "For a Linux server to pass network traffic between multiple interfaces (e.g., `eth0` for WAN and `eth1` for LAN), IP forwarding must be permanently enabled in the Linux kernel:" },
        { t: "h", x: "Enabling IP Forwarding" },
        {
          t: "code",
          lang: "bash",
          title: "Enable IPv4 Packet Forwarding in sysctl",
          x: "# Enable forwarding immediately in runtime memory\nsudo sysctl -w net.ipv4.ip_forward=1\n\n# Make the setting persistent across reboots\necho 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-sysctl.conf\nsudo sysctl -p /etc/sysctl.d/99-sysctl.conf"
        },
        { t: "h", x: "Verifying Interface Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "Check network interface names and IPs",
          x: "ip -br a\n# Example output:\n# eth0  UP  198.51.100.2/24   (WAN facing external internet)\n# eth1  UP  192.168.1.1/24    (LAN default gateway for clients)"
        },
        { t: "tip", x: "Clients on the LAN should receive `192.168.1.1` as their default gateway via DHCP." }
      ]
    },
    {
      id: "squid-intercept-config",
      title: "Step 2: Configure Squid Intercept Listener",
      min: 7,
      sum: "Add the http_port 3129 intercept listener to squid.conf and configure subnet permissions.",
      blocks: [
        { t: "p", x: "In `/etc/squid/squid.conf`, define an **intercept port** (port 3129 is standard convention). Keep standard port 3128 for administrative access:" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/squid/squid.conf (Transparent Interception)",
          x: "# Standard explicit proxy listener for local testing\nhttp_port 3128\n\n# Dedicated transparent interception listener\nhttp_port 3129 intercept\n\n# Define LAN access control\nacl localnet src 192.168.1.0/24\n\n# Safe Ports ACL\nacl Safe_ports port 80\nacl Safe_ports port 443\nhttp_access deny !Safe_ports\n\n# Allow intercepted LAN traffic\nhttp_access allow localnet\nhttp_access allow localhost\nhttp_access deny all\n\n# Disk cache settings\ncache_dir ufs /var/spool/squid 2048 16 256"
        },
        { t: "h", x: "Parsing Syntax & Starting Listener" },
        {
          t: "code",
          lang: "bash",
          title: "Validate and Reload",
          x: "sudo squid -k parse\nsudo systemctl restart squid\nsudo ss -tulpn | grep -E ':(3128|3129)'"
        },
        { t: "warn", x: "Never attempt to connect a browser manually to port 3129. Directly opening `http://server:3129` will produce a Squid error: `The request or reply is too large` because it lacks NAT socket metadata." }
      ]
    },
    {
      id: "firewall-nat-redirect",
      title: "Step 3: Setup iptables NAT REDIRECT Rules",
      min: 7,
      sum: "Inject the kernel NAT rule that diverts outbound port 80 packets into port 3129.",
      blocks: [
        { t: "p", x: "Now add the iptables PREROUTING rule that intercepts all outbound port 80 TCP packets entering on the LAN interface (`eth1`) and redirects them to Squid's port 3129:" },
        { t: "h", x: "Applying iptables Interception Rule" },
        {
          t: "code",
          lang: "bash",
          title: "Configure Linux iptables PREROUTING NAT",
          x: "# Redirect port 80 traffic originating from LAN (eth1) to Squid intercept port 3129\nsudo iptables -t nat -A PREROUTING -i eth1 -p tcp --dport 80 -j REDIRECT --to-port 3129\n\n# Set up standard NAT masquerading for non-HTTP traffic\nsudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\n\n# Verify active NAT table rules\nsudo iptables -t nat -L -n -v"
        },
        { t: "h", x: "Testing from an Unsuspecting Client" },
        { t: "p", x: "On any client machine on the LAN (with zero proxy settings configured), open terminal and curl a standard HTTP site:" },
        {
          t: "code",
          lang: "bash",
          title: "Run on client workstation (no proxy env set)",
          x: "curl -I http://example.com"
        },
        { t: "h", x: "Inspect Gateway Live Logs" },
        {
          t: "code",
          lang: "bash",
          title: "Watch logs on the Linux Gateway",
          x: "sudo tail -f /var/log/squid/access.log\n# Output showing transparent interception:\n# 192.168.1.50 TCP_MISS/200 1256 GET http://example.com/ - ORIGINAL_DST/93.184.216.34 text/html"
        },
        { t: "tip", x: "Notice `ORIGINAL_DST` in the log: the Linux kernel preserved the destination IP, allowing Squid to fetch the site seamlessly!" }
      ]
    }
  ]
};
