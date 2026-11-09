import { useState } from "react";
import { copyText } from "../lib/clipboard.js";

function CopyButton({ text, label = "Copy Command" }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        setCopied(false);
      });
  }

  return (
    <button
      type="button"
      className={`deb-copy-btn ${copied ? "is-copied" : ""}`}
      onClick={handleCopy}
      aria-label="Copy code to clipboard"
    >
      {copied ? "✓ Copied!" : label}
    </button>
  );
}

function TerminalMock({ title = "bash — terminal", cmd, output, explain }) {
  return (
    <div className="deb-term-card">
      <div className="deb-term-header">
        <div className="deb-term-dots">
          <span className="deb-dot red"></span>
          <span className="deb-dot yellow"></span>
          <span className="deb-dot green"></span>
        </div>
        <span className="deb-term-title">{title}</span>
        {cmd && <CopyButton text={cmd} label="Copy" />}
      </div>
      <div className="deb-term-body">
        {cmd && (
          <div className="deb-term-cmd-row">
            <span className="deb-term-prompt">student@debian-squid:~$</span>{" "}
            <span className="deb-term-cmd">{cmd}</span>
          </div>
        )}
        {output && <pre className="deb-term-output"><code>{output}</code></pre>}
      </div>
      {explain && (
        <div className="deb-term-explain">
          <span className="explain-badge">Command Breakdown</span>
          <p>{explain}</p>
        </div>
      )}
    </div>
  );
}

export function ScreenshotCard({ src, alt, caption, badge, details, highlightText }) {
  const [open, setOpen] = useState(false);

  return (
    <figure className="deb-screenshot-figure">
      <div
        className="deb-screenshot-wrap"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(true); }}
        title="Click to view full screenshot"
      >
        <img src={src} alt={alt || caption} className="deb-screenshot-img" loading="lazy" />
        <div className="deb-screenshot-overlay">
          <span>🔍 Click to expand full screenshot</span>
        </div>
      </div>
      <figcaption className="deb-screenshot-caption">
        <div className="deb-ss-caption-top">
          {badge && <span className="deb-ss-badge">{badge}</span>}
          <strong>{caption}</strong>
        </div>
        {details && <p className="deb-ss-details">{details}</p>}
        {highlightText && (
          <div className="deb-ss-highlight">
            <span className="deb-ss-check">✓</span>
            <span>{highlightText}</span>
          </div>
        )}
      </figcaption>

      {open && (
        <div className="deb-lightbox" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
          <div className="deb-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="deb-lightbox-bar">
              <span className="deb-lightbox-title">{caption}</span>
              <button
                type="button"
                className="deb-lightbox-close"
                onClick={() => setOpen(false)}
                aria-label="Close full view"
              >
                ✕ Close
              </button>
            </div>
            <div className="deb-lightbox-body">
              <img src={src} alt={alt || caption} className="deb-lightbox-img" />
            </div>
            {details && <p className="deb-lightbox-caption">{details}</p>}
          </div>
        </div>
      )}
    </figure>
  );
}

export function SquidLabGallery({ title = "Hands-On Lab Verification Gallery (Debian 13 Trixie & Squid 6.13)", showIntro = true }) {
  return (
    <div className="deb-gallery-section" id="lab-gallery">
      {showIntro && (
        <div className="deb-gallery-header">
          <span className="deb-gallery-badge">📸 Real-World Evidence</span>
          <h4>{title}</h4>
          <p>
            Real lab screenshots captured on testbed (<strong>Host:</strong> <code>Project</code>, <strong>User:</strong> <code>antoniano</code>, <strong>Proxy:</strong> <code>10.0.2.15:3128</code>).
            Click any screenshot to zoom into full resolution:
          </p>
        </div>
      )}

      <div className="deb-gallery-grid">
        <ScreenshotCard
          src="/screenshots/squid/debian13-curl-test.png"
          alt="Terminal curl test on Debian 13 showing squid 6.13 response"
          badge="1. DEBIAN 13 (TRIXIE) TERMINAL"
          caption="Terminal curl Test on Debian 13"
          details="antoniano@Project installing Debian 13 deb13u7 packages and running curl -x http://10.0.2.15:3128 -I http://www.ubuntu.com"
          highlightText="Via: 1.1 Project (squid/6.13) header returned"
        />

        <ScreenshotCard
          src="/screenshots/squid/browser-proxy-settings.png"
          alt="Browser Connection Settings with manual proxy configuration"
          badge="2. CLIENT BROWSER SETUP"
          caption="Browser Connection Settings"
          details="Configuring Manual proxy to 10.0.2.15 port 3128 with 'Also use this proxy for HTTPS' checked in Firefox"
          highlightText="Both HTTP and HTTPS routed through port 3128"
        />

        <ScreenshotCard
          src="/screenshots/squid/browser-google-test.png"
          alt="Google homepage loaded successfully via Squid Proxy"
          badge="3. LIVE WEB BROWSING"
          caption="Browsing Google via Squid"
          details="Client browser actively loading www.google.com with active session tabs (ServerPath, Facebook, Google) over the proxy"
          highlightText="Secure HTTPS connection established without errors"
        />

        <ScreenshotCard
          src="/screenshots/squid/squid-access-log.png"
          alt="Real-time access log showing TCP_TUNNEL 200 CONNECT requests"
          badge="4. AUDIT LOG (access.log)"
          caption="Live Access Log Traffic"
          details="tail -f /var/log/squid/access.log showing client 10.0.2.15 establishing TCP_TUNNEL/200 CONNECT tunnels to Google & DeepSeek"
          highlightText="Real-time CONNECT tunnels and traffic recorded"
        />
      </div>
    </div>
  );
}

export default function Debian13SquidTutorial() {
  const [activeStep, setActiveStep] = useState(0);
  const [viewAll, setViewAll] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [quizState, setQuizState] = useState({});

  function toggleStepCompletion(stepIndex) {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  }

  const sampleSquidConfDebian = `# ==============================================================================
# Squid Proxy Server Configuration — Debian 13 (Trixie)
# Location: /etc/squid/squid.conf
# ==============================================================================

# 1. NETWORK LISTENING PORT & HOST IDENTIFICATION
# ------------------------------------------------------------------------------
# Default Squid port for forwarding HTTP/HTTPS proxy traffic
http_port 3128

# Hostname displayed in Squid diagnostic pages and HTTP Via headers
visible_hostname debian-squid.local

# Administrator email contact displayed on error pages
cache_mgr admin@debian-squid.local


# 2. ACCESS CONTROL LISTS (ACLs)
# ------------------------------------------------------------------------------
# Define trusted local networks (CIDR notation).
# IMPORTANT: Adjust 192.168.1.0/24 to match your home/lab router subnet!
acl localnet src 192.168.1.0/24      # Local LAN subnet (192.168.1.1 - 254)
acl localnet src 10.0.0.0/8          # Internal 10.x.x.x networks
acl localnet src 172.16.0.0/12       # Internal 172.16.x.x networks
acl localhost src 127.0.0.1/32 ::1   # The Debian proxy server itself

# Standard web service ports allowed through the proxy
acl Safe_ports port 80               # HTTP
acl Safe_ports port 443              # HTTPS
acl Safe_ports port 21               # FTP
acl Safe_ports port 1025-65535       # Unregistered / application ports

# Ports allowed for encrypted SSL/TLS CONNECT tunnels
acl SSL_ports port 443

# HTTP CONNECT method used for secure HTTPS tunneling
acl CONNECT method CONNECT


# 3. HTTP ACCESS RULES (Sequential: Top-to-Bottom, First Match Wins!)
# ------------------------------------------------------------------------------
# Rule 1: Deny requests to non-standard or dangerous ports
http_access deny !Safe_ports

# Rule 2: Deny CONNECT method to non-SSL ports (prevents open-relay abuse)
http_access deny CONNECT !SSL_ports

# Rule 3: Protect Squid Cache Manager interface
http_access allow localhost manager
http_access deny manager

# Rule 4: Allow your local LAN devices and localhost to browse through the proxy
http_access allow localnet
http_access allow localhost

# Rule 5: Final catch-all: Deny all other unapproved client connections
http_access deny all


# 4. DISK & MEMORY CACHING DIRECTIVES
# ------------------------------------------------------------------------------
# Dedicated RAM cache for super-fast in-memory hot object retrieval
cache_mem 256 MB

# Maximum size of any single file stored in the cache (e.g. prevent multi-GB ISOs)
maximum_object_size 64 MB

# Minimum object size to cache (0 KB = cache everything including tiny CSS/JS)
minimum_object_size 0 KB

# Disk storage configuration:
# Format: cache_dir <type> <directory> <MB_size> <L1_dirs> <L2_dirs>
# - ufs: Unix Fast System storage driver
# - /var/spool/squid: cache storage directory on disk
# - 4096: 4 GB disk space reserved for cache objects
# - 16: 16 top-level directories
# - 256: 256 second-level directories inside each top-level dir
cache_dir ufs /var/spool/squid 4096 16 256

# Keep 7 days of rotated access logs
logfile_rotate 7`;

  const blockedSitesExample = `# /etc/squid/blocked_domains.acl
# Leading dot matches the domain and all its subdomains
.tiktok.com
.facebook.com
.instagram.com
.badsite.example
.distraction-site.org`;

  const STEPS = [
    {
      id: "debian-install",
      num: "01",
      title: "Installing & Preparing Debian 13 (Trixie)",
      subtitle: "Set up a clean, minimal Debian 13 server environment",
      duration: "12 min",
      icon: "🐧",
      badge: "Operating System",
      render: () => (
        <div className="deb-step-content">
          <div className="deb-lead-card">
            <h3>Why Debian 13 (Trixie) for Squid Proxy?</h3>
            <p>
              <strong>Debian</strong> is revered worldwide as the "Universal Operating System" due to its rock-solid stability, robust security model, and packaging ecosystem. <strong>Debian 13 (codenamed "Trixie")</strong> incorporates the modern Linux 6.x kernel, updated systemd primitives, and package versions like Squid 6.x — making it an ideal, lightweight host for an enterprise-grade caching proxy.
            </p>
          </div>

          <div className="deb-subhead">
            <h4>Part 1: The Debian 13 Installation Walkthrough</h4>
            <p className="deb-subhead-desc">Follow these recommendations during the Debian installer (d-i) wizard:</p>
          </div>

          <div className="deb-install-grid">
            <div className="deb-install-card">
              <div className="deb-card-num">1</div>
              <div>
                <strong>Obtain the Debian 13 Netinst ISO</strong>
                <p>Download the official Debian Netinst image (approx. 500 MB). You can run this on bare metal via a bootable USB drive (flashed using BalenaEtcher or Rufus), or on a hypervisor like Proxmox VE, VirtualBox, or VMware.</p>
              </div>
            </div>

            <div className="deb-install-card">
              <div className="deb-card-num">2</div>
              <div>
                <strong>Boot & Select "Graphical Install"</strong>
                <p>Select your preferred Language (English), Country / Territory, and Keyboard keymap (American English or regional). Network configuration will attempt automatic DHCP.</p>
              </div>
            </div>

            <div className="deb-install-card">
              <div className="deb-card-num">3</div>
              <div>
                <strong>Hostname & Domain Name</strong>
                <p>Set the hostname to <code>debian-squid</code> and the domain to your local network (e.g. <code>local</code> or leave blank). This will identify your proxy machine on the LAN.</p>
              </div>
            </div>

            <div className="deb-install-card highlight-card">
              <div className="deb-card-num">!</div>
              <div>
                <strong>The Sudo & Root Password Rule (Beginner Tip!)</strong>
                <p>
                  <em>Debian convention:</em> If you <strong>leave the root password blank</strong> during installation, the installer will automatically install <code>sudo</code> and grant full administrative privileges to the regular user you create! If you enter a root password, sudo will not be enabled for standard users by default.
                </p>
              </div>
            </div>

            <div className="deb-install-card">
              <div className="deb-card-num">4</div>
              <div>
                <strong>Partitioning Disks</strong>
                <p>Choose <strong>Guided - use entire disk</strong>. Select your storage drive, choose <strong>All files in one partition</strong> (recommended for beginners), and confirm by writing changes to disk.</p>
              </div>
            </div>

            <div className="deb-install-card highlight-card">
              <div className="deb-card-num">5</div>
              <div>
                <strong>Software Selection (tasksel) — Keep it Lean!</strong>
                <p>
                  When prompted with the <em>Software selection</em> list:
                  <br />• <strong>Uncheck</strong> "Debian desktop environment" (GNOME/XFCE) — a server does not need a GUI, saving hundreds of megabytes of RAM.
                  <br />• <strong>Check</strong> "SSH server" — enables secure remote command-line login.
                  <br />• <strong>Check</strong> "standard system utilities".
                </p>
              </div>
            </div>
          </div>

          <div className="deb-callout tip">
            <span className="callout-icon">💡</span>
            <div>
              <strong>What if you set a root password and your user cannot run sudo?</strong>
              <p>
                If your user receives <code>"student is not in the sudoers file"</code>, switch to root with <code>su -</code>, install sudo with <code>apt install sudo</code>, add your user with <code>usermod -aG sudo &lt;username&gt;</code>, then type <code>exit</code> and log back in.
              </p>
            </div>
          </div>

          <div className="deb-subhead">
            <h4>Part 2: Initial System Verification & Terminal Commands</h4>
            <p className="deb-subhead-desc">Log into your new Debian 13 terminal and run these essential baseline commands:</p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">1. Verify Debian 13 (Trixie) Release Version:</p>
              <TerminalMock
                title="Verify OS Release"
                cmd="cat /etc/os-release"
                output={`PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
NAME="Debian GNU/Linux"
VERSION_ID="13"
VERSION="13 (trixie)"
VERSION_CODENAME=trixie
ID=debian`}
                explain="The 'cat' command prints the contents of /etc/os-release, confirming your system is running Debian 13 (Trixie)."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">2. Inspect Current IP Address and Network Interface:</p>
              <TerminalMock
                title="Check Network Interface & IP"
                cmd="ip -c a"
                output={`1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    inet 192.168.1.10/24 brd 192.168.1.255 scope global dynamic ens18`}
                explain="The 'ip -c a' command displays network interfaces with color. Here, interface 'ens18' has the IP address 192.168.1.10 on a /24 subnet (255.255.255.0). Write down your server's IP address — clients will use it as their proxy gateway!"
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">3. Update APT Repositories and Upgrade System Packages:</p>
              <TerminalMock
                title="System Package Update"
                cmd="sudo apt update && sudo apt upgrade -y"
                output={`Hit:1 http://deb.debian.org/debian trixie InRelease
Hit:2 http://deb.debian.org/debian-security trixie-security InRelease
Reading package lists... Done
Building dependency tree... Done
Calculating upgrade... Done
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`}
                explain="'sudo' grants admin privileges; 'apt update' downloads fresh package lists from Debian mirrors; '&&' chains commands conditionally; 'apt upgrade -y' applies any security or stability patches without asking for confirmation."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">4. Install Essential SysAdmin Utilities:</p>
              <TerminalMock
                title="Install Network & Admin Tools"
                cmd="sudo apt install -y curl wget nano ufw dnsutils net-tools"
                output={`Setting up curl (8.5.0-2) ...
Setting up ufw (0.36.2-1) ...
Setting up dnsutils (1:9.19.19-1) ...
Processing triggers for man-db ...`}
                explain="Installs: curl & wget (testing HTTP transfers), nano (terminal text editor), ufw (uncomplicated firewall), dnsutils (dig & nslookup commands), and net-tools (ifconfig & netstat)."
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "install-squid",
      num: "02",
      title: "Installing Squid Proxy on Debian 13",
      subtitle: "Deploy the Squid daemon, enable systemd unit, and inspect listening sockets",
      duration: "8 min",
      icon: "⚡",
      badge: "Package Deployment",
      render: () => (
        <div className="deb-step-content">
          <div className="deb-lead-card">
            <h3>Deploying the Official Squid Daemon</h3>
            <p>
              Debian 13 includes <strong>Squid version 6.x</strong> in its official main repositories. Installing it through <code>apt</code> automatically handles system user creation (<code>proxy:proxy</code>), log rotation scripts, and systemd service registration.
            </p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">Step 1: Update and Installation</p>
              <TerminalMock
                title="APT Update & Install Squid"
                cmd={"sudo apt update\nsudo apt install squid -y"}
                output={`Hit:1 http://deb.debian.org/debian trixie InRelease
Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  squid-common squid-langpack
Setting up squid-common (6.6-1) ...
Setting up squid (6.6-1) ...
Processing triggers for man-db ...`}
                explain="'sudo apt update' refreshes package lists. 'sudo apt install squid -y' installs the Squid proxy service and its dependencies."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">Step 2: Verify Installation and Service</p>
              <TerminalMock
                title="Check Version & Manage Service"
                cmd={"squid -v  # checking the version of squid\nsudo systemctl start squid\nsudo systemctl enable squid\nsudo systemctl status squid"}
                output={`Squid Cache: Version 6.6

● squid.service - Squid Web Proxy Server
     Loaded: loaded (/lib/systemd/system/squid.service; enabled; preset: enabled)
     Active: active (running) since Sun 2026-11-02 21:10:00 UTC; 45s ago
   Main PID: 2482 (squid)`}
                explain="'squid -v' checks the installed Squid version. Then start, enable at boot, and verify the service status."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">Step 3: Check the Default Configuration</p>
              <TerminalMock
                title="Open Squid Configuration"
                cmd="sudo nano /etc/squid/squid.conf"
                output={`(nano editor opens /etc/squid/squid.conf)
# WELCOME TO SQUID 6.6
# Default: http_port 3128
# ...`}
                explain="'sudo nano /etc/squid/squid.conf' opens the main Squid configuration file so you can review the default settings."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">Confirm Listening Port 3128 with Socket Statistics (ss):</p>
              <TerminalMock
                title="Inspect Port 3128"
                cmd="sudo ss -tulpn | grep 3128"
                output={`tcp   LISTEN 0      512          0.0.0.0:3128      0.0.0.0:*    users:(("squid",pid=2485,fd=11))
tcp   LISTEN 0      512             [::]:3128         [::]:*    users:(("squid",pid=2485,fd=12))`}
                explain="Command breakdown: '-t' (TCP sockets), '-u' (UDP sockets), '-l' (listening only), '-p' (show process name/PID), '-n' (numeric port numbers). The output proves Squid is listening on port 3128 on all IPv4 (0.0.0.0) and IPv6 ([::]) interfaces!"
              />
            </div>
          </div>

          <div className="deb-callout warn">
            <span className="callout-icon">⚠️</span>
            <div>
              <strong>Why clients are blocked by default</strong>
              <p>
                Even though port 3128 is listening, Squid's default factory configuration permits traffic <em>only from localhost (127.0.0.1)</em>. If you try pointing another laptop or phone at Squid right now, Squid will reject the connection with an HTTP 403 Access Denied error. We will fix this in Step 3!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "configure-squid",
      num: "03",
      title: "Configuring the Proxy Server (squid.conf)",
      subtitle: "Write a clean production configuration, define LAN ACLs, and configure disk caching",
      duration: "12 min",
      icon: "⚙️",
      badge: "Core Configuration",
      render: () => (
        <div className="deb-step-content">
          <div className="deb-lead-card">
            <h3>Mastering the Squid Configuration</h3>
            <p>
              Squid reads its instructions from <code>/etc/squid/squid.conf</code>. The default file installed by Debian is more than 8,000 lines long, filled with comments for every conceivable feature. To maintain sanity and prevent mistakes, sysadmins preserve the original file as a backup and craft a clean, readable configuration file.
            </p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">1. Backup the Original Factory Configuration:</p>
              <TerminalMock
                title="Backup squid.conf"
                cmd="sudo cp /etc/squid/squid.conf /etc/squid/squid.conf.original"
                output=""
                explain="'cp' creates an exact replica of the original 8,000-line configuration file at /etc/squid/squid.conf.original. You can always refer back to it if you need default directive explanations."
              />
            </div>
          </div>

          <div className="deb-subhead">
            <h4>2. Create the Clean Production Configuration</h4>
            <p className="deb-subhead-desc">
              Open <code>/etc/squid/squid.conf</code> in your text editor: <code>sudo nano /etc/squid/squid.conf</code>, delete existing content (or start fresh), and paste the well-documented configuration below:
            </p>
          </div>

          <div className="deb-conf-box">
            <div className="deb-conf-head">
              <div>
                <span className="deb-conf-title">/etc/squid/squid.conf</span>
                <span className="deb-conf-tag">Production Template — Debian 13</span>
              </div>
              <CopyButton text={sampleSquidConfDebian} label="Copy Complete Config" />
            </div>
            <pre className="deb-conf-body"><code>{sampleSquidConfDebian}</code></pre>
          </div>

          <div className="deb-anatomy-grid">
            <div className="deb-anatomy-card">
              <h5>1. The http_port Directive</h5>
              <p><code>http_port 3128</code> binds Squid to standard proxy port 3128. You can also specify an IP address (e.g. <code>http_port 192.168.1.10:3128</code>) to restrict listening to a single physical interface.</p>
            </div>
            <div className="deb-anatomy-card">
              <h5>2. ACLs (Access Control Lists)</h5>
              <p>ACLs define criteria without taking action yet. <code>acl localnet src 192.168.1.0/24</code> labels any incoming request from that IP range as a member of "localnet".</p>
            </div>
            <div className="deb-anatomy-card">
              <h5>3. Sequential Rule Evaluation</h5>
              <p><strong>First match wins!</strong> Squid evaluates <code>http_access</code> lines in exact order from top to bottom. Once a rule matches, evaluation stops immediately.</p>
            </div>
            <div className="deb-anatomy-card">
              <h5>4. Disk Cache Spool (UFS)</h5>
              <p><code>cache_dir ufs /var/spool/squid 4096 16 256</code> allocates 4,096 MB (4 GB) of disk space into 16 first-level folders and 256 second-level subdirectories to avoid filesystem slowdowns.</p>
            </div>
          </div>

          <div className="deb-subhead">
            <h4>3. Validate Configuration Syntax with <code>squid -k parse</code></h4>
            <p className="deb-subhead-desc">
              <strong>Rule of Gold in Linux Administration:</strong> Never restart or reload a proxy blind! Always run the built-in syntax parser first to detect any typos or missing commas.
            </p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <TerminalMock
                title="Syntax Validation Check"
                cmd="sudo squid -k parse"
                output={`2026/11/02 21:14:10| Startup: Initializing Authentication Schemes ...
2026/11/02 21:14:10| Processing Configuration File: /etc/squid/squid.conf (depth 0)
2026/11/02 21:14:10| Initializing https proxy context
2026/11/02 21:14:10| Initializing cache_dir '/var/spool/squid'
...
2026/11/02 21:14:10| squid.conf syntax OK.`}
                explain="If no 'FATAL:' errors appear, your configuration is 100% syntactically valid! If you made a typo, Squid will tell you the exact line number to fix."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">4. Initialize Cache Directories & Reload Service:</p>
              <TerminalMock
                title="Apply Configuration"
                cmd="sudo squid -z && sudo systemctl reload squid"
                output={`2026/11/02 21:14:15| Creating Swap Directories
2026/11/02 21:14:15| /var/spool/squid exists
2026/11/02 21:14:15| Making directories in /var/spool/squid/00 ... 0F`}
                explain="'squid -z' generates the 16x256 cache swap subdirectories in /var/spool/squid if they don't already exist. 'systemctl reload squid' instructs the active daemon to reread squid.conf gracefully without terminating existing client connections!"
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">5. Open Port 3128 in Debian's UFW Firewall:</p>
              <TerminalMock
                title="Firewall Port Permission"
                cmd="sudo ufw allow OpenSSH && sudo ufw allow from 192.168.1.0/24 to any port 3128 proto tcp comment 'Squid Proxy' && sudo ufw enable"
                output={`Rule added
Rule added (v6)
Firewall is active and enabled on system startup`}
                explain="Crucial: Always allow OpenSSH (port 22) first so you do not lock yourself out! The second rule allows devices on your 192.168.1.0/24 LAN to access port 3128 TCP. Finally, 'ufw enable' activates the packet filter."
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: "test-proxy",
      num: "04",
      title: "Testing & Verifying Squid Works Correctly",
      subtitle: "Execute client curl tests, configure browser proxies, and monitor live HIT/MISS logs",
      duration: "10 min",
      icon: "🧪",
      badge: "Testing & Verification",
      render: () => (
        <div className="deb-step-content">
          <div className="deb-lead-card">
            <h3>Proving the Proxy Functionality with Real Lab Evidence</h3>
            <p>
              A proxy server is only successful when client web traffic flows through it, access policies are enforced, and caching accelerates repeat downloads. Below is the complete testing guide alongside <strong>real hands-on lab verification screenshots</strong> captured directly on Debian 13 (Trixie).
            </p>
          </div>

          {/* Real-World Lab Screenshots Gallery */}
          <div className="deb-gallery-section">
            <div className="deb-gallery-header">
              <span className="deb-gallery-badge">📸 Real-World Evidence</span>
              <h4>Hands-On Lab Verification Gallery (Debian 13 Trixie & Squid 6.13)</h4>
              <p>Click any capture below to open the full-resolution screenshot:</p>
            </div>

            <div className="deb-gallery-grid">
              <ScreenshotCard
                src="/screenshots/squid/debian13-curl-test.png"
                alt="Terminal curl test on Debian 13 showing squid 6.13 response"
                badge="DEBIAN 13 (TRIXIE) TERMINAL"
                caption="1. Terminal curl Test on Debian 13"
                details="antoniano@Project installing Debian 13 deb13u7 packages and running curl -x http://10.0.2.15:3128 -I http://www.ubuntu.com"
                highlightText="Via: 1.1 Project (squid/6.13) header returned"
              />

              <ScreenshotCard
                src="/screenshots/squid/browser-proxy-settings.png"
                alt="Browser Connection Settings with manual proxy configuration"
                badge="CLIENT CONFIGURATION"
                caption="2. Browser Connection Settings"
                details="Configuring Manual proxy to 10.0.2.15 port 3128 with 'Also use this proxy for HTTPS' checked in Firefox"
                highlightText="Both HTTP and HTTPS routed through port 3128"
              />

              <ScreenshotCard
                src="/screenshots/squid/browser-google-test.png"
                alt="Google homepage loaded successfully via Squid Proxy"
                badge="LIVE WEB NAVIGATION"
                caption="3. Browsing Google via Squid"
                details="Client browser actively loading www.google.com with active session tabs (ServerPath, Facebook, Google) over the proxy"
                highlightText="Secure HTTPS connection established without errors"
              />

              <ScreenshotCard
                src="/screenshots/squid/squid-access-log.png"
                alt="Real-time access log showing TCP_TUNNEL 200 CONNECT requests"
                badge="AUDIT LOG (access.log)"
                caption="4. Live Access Log Traffic"
                details="tail -f /var/log/squid/access.log showing client 10.0.2.15 establishing TCP_TUNNEL/200 CONNECT tunnels to Google & DeepSeek"
                highlightText="Real-time CONNECT tunnels and traffic recorded"
              />
            </div>
          </div>

          <div className="deb-subhead">
            <h4>Test 1: Terminal Test via curl on the Debian Server</h4>
            <p className="deb-subhead-desc">
              Run this command in the Debian terminal to force curl to route its HTTP request through Squid on port 3128:
            </p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <TerminalMock
                title="antoniano@Project: ~ (Debian 13 Bash)"
                cmd="curl -x http://10.0.2.15:3128 -I http://www.ubuntu.com"
                output={`HTTP/1.1 301 Moved Permanently
Content-Length: 0
Location: https://www.ubuntu.com/
Date: Mon, 02 Nov 2026 13:34:04 GMT
Cache-Status: Project;detail=mismatch
Via: 1.1 Project (squid/6.13)
Connection: keep-alive`}
                explain="Look at the response headers: 'Via: 1.1 Project (squid/6.13)' proves Squid 6.13 on host 'Project' intercepted and forwarded the request. The 301 Moved Permanently response demonstrates Squid successfully communicated with the upstream origin web server."
              />
            </div>
          </div>

          <div className="deb-subhead">
            <h4>Test 2: Configuring and Browsing from a Client Computer</h4>
            <p className="deb-subhead-desc">
              Configure your client browser or terminal on the LAN to use the Debian Squid proxy (e.g. <code>10.0.2.15:3128</code>):
            </p>
          </div>

          <div className="deb-client-grid">
            <div className="deb-client-card">
              <div className="deb-client-badge">Method A: Linux / macOS Terminal</div>
              <p>Set proxy environment variables and run curl:</p>
              <pre className="deb-mini-code"><code>{`export http_proxy="http://10.0.2.15:3128"
export https_proxy="http://10.0.2.15:3128"
curl -I http://www.ubuntu.com`}</code></pre>
              <CopyButton text={`export http_proxy="http://10.0.2.15:3128"\nexport https_proxy="http://10.0.2.15:3128"\ncurl -I http://www.ubuntu.com`} label="Copy Shell Env" />
            </div>

            <div className="deb-client-card">
              <div className="deb-client-badge">Method B: Windows PowerShell</div>
              <p>Set PowerShell session proxy variables:</p>
              <pre className="deb-mini-code"><code>{`$env:http_proxy="http://10.0.2.15:3128"
$env:https_proxy="http://10.0.2.15:3128"
curl.exe -I http://www.ubuntu.com`}</code></pre>
              <CopyButton text={`$env:http_proxy="http://10.0.2.15:3128"\n$env:https_proxy="http://10.0.2.15:3128"\ncurl.exe -I http://www.ubuntu.com`} label="Copy PS Command" />
            </div>

            <div className="deb-client-card">
              <div className="deb-client-badge">Method C: Desktop Web Browser (Firefox / Chrome)</div>
              <p>Configure Firefox or System Connection Settings:</p>
              <ul className="deb-client-list">
                <li>1. Open <strong>Settings → Network / Connection Settings</strong>.</li>
                <li>2. Select <strong>Manual proxy configuration</strong>.</li>
                <li>3. Enter HTTP Proxy: <code>10.0.2.15</code>, Port: <code>3128</code>.</li>
                <li>4. Check <em>"Also use this proxy for HTTPS"</em>.</li>
                <li>5. Browse to <code>https://www.google.com</code>!</li>
              </ul>
            </div>
          </div>

          <div className="deb-subhead">
            <h4>Test 3: Monitoring Live Access Logs on the Debian Server</h4>
            <p className="deb-subhead-desc">
              On the Debian Squid proxy server, run <code>sudo tail -f /var/log/squid/access.log</code> to watch connections live as clients browse:
            </p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <TerminalMock
                title="Live Squid Access Log (/var/log/squid/access.log)"
                cmd="sudo tail -f /var/log/squid/access.log"
                output={`1793627019.145  15823 10.0.2.15 TCP_TUNNEL/200 7730 CONNECT www.gstatic.com:443 - HIER_DIRECT/172.217.26.227 -
1793627040.123  15634 10.0.2.15 TCP_TUNNEL/200 2408 CONNECT play.google.com:443 - HIER_DIRECT/142.251.152.7 -
1793627169.760 170491 10.0.2.15 TCP_TUNNEL/200 69515 CONNECT www.google.com:443 - HIER_DIRECT/142.251.156.119 -
1793627184.766 171408 10.0.2.15 TCP_TUNNEL/200 6306 CONNECT mail.google.com:443 - HIER_DIRECT/142.250.205.229 -
1793627198.874 184020 10.0.2.15 TCP_TUNNEL/200 39800 CONNECT fe-static.deepseek.com:443 - HIER_DIRECT/3.173.21.63 -`}
                explain="Analysis: '10.0.2.15' is the client IP. 'TCP_TUNNEL/200' indicates Squid established an encrypted SSL/TLS tunnel via the HTTP CONNECT method on port 443. 'HIER_DIRECT' confirms Squid routed the traffic directly to the destination origin servers."
              />
            </div>
          </div>

          <div className="deb-log-explanation">
            <h5>Understanding the Squid Access Log Columns:</h5>
            <div className="deb-log-columns">
              <div className="log-col"><code>1793627169.760</code> Unix timestamp with millisecond precision</div>
              <div className="log-col"><code>10.0.2.15</code> Client computer source IP address</div>
              <div className="log-col"><code>TCP_TUNNEL/200</code> HTTP CONNECT tunnel established for encrypted HTTPS</div>
              <div className="log-col"><code>TCP_HIT / TCP_MISS</code> Cache status (HIT = served from disk/RAM, MISS = downloaded)</div>
              <div className="log-col"><code>69515</code> Bytes transferred between client and destination</div>
              <div className="log-col"><code>CONNECT ...:443</code> Tunnel request to target domain and port</div>
              <div className="log-col"><code>HIER_DIRECT</code> Hierarchy path (DIRECT = reached origin server directly)</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "acls-maintenance",
      num: "05",
      title: "Content Filtering (ACLs) & Maintenance",
      subtitle: "Block unwanted domain names, check cache statistics, and perform daily administration",
      duration: "8 min",
      icon: "🛡️",
      badge: "Security & Operations",
      render: () => (
        <div className="deb-step-content">
          <div className="deb-lead-card">
            <h3>Filtering Domains & Operating Your Proxy</h3>
            <p>
              Beyond caching, Squid is a robust access controller. In schools, offices, and home labs, Squid is commonly used to block distracting social media platforms, malware domains, or inappropriate websites using Access Control Lists.
            </p>
          </div>

          <div className="deb-subhead">
            <h4>Part 1: Blocking Unwanted Websites with Domain ACLs</h4>
            <p className="deb-subhead-desc">Create a blacklist file containing unwanted domains:</p>
          </div>

          <div className="deb-cmd-list">
            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">1. Create a Blocked Domains File:</p>
              <TerminalMock
                title="Create Blacklist File"
                cmd="sudo nano /etc/squid/blocked_domains.acl"
                output={`# Add domains you want to block (one per line).
# A leading dot matches the domain AND all of its subdomains:
.tiktok.com
.facebook.com
.instagram.com
.badsite.example`}
                explain="Prefixing domains with a dot (e.g. .tiktok.com) ensures that www.tiktok.com, api.tiktok.com, and v.tiktok.com are all blocked automatically."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">2. Hook the Blacklist into /etc/squid/squid.conf:</p>
              <div className="deb-rule-demo">
                <p>Open <code>/etc/squid/squid.conf</code> and place this rule <strong>BEFORE</strong> the <code>http_access allow localnet</code> line:</p>
                <pre className="deb-mini-code"><code>{`# Blocked domains ACL loaded from external text file
acl blocked_sites dstdomain "/etc/squid/blocked_domains.acl"

# CRITICAL: Deny blocked sites FIRST before granting general LAN access
http_access deny blocked_sites

# Normal LAN access
http_access allow localnet
http_access allow localhost
http_access deny all`}</code></pre>
              </div>
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">3. Validate and Reload Squid:</p>
              <TerminalMock
                title="Validate & Reload"
                cmd="sudo squid -k parse && sudo systemctl reload squid"
                output="squid.conf syntax OK."
                explain="Squid re-reads the configuration and loads the blocked_domains.acl file into RAM within milliseconds."
              />
            </div>

            <div className="deb-cmd-item">
              <p className="deb-cmd-caption">4. Test Access from Client to Verify Blocking:</p>
              <TerminalMock
                title="Client Curl Test on Blocked Site"
                cmd="curl -x http://192.168.1.10:3128 -I http://badsite.example"
                output={`HTTP/1.1 403 Forbidden
Server: squid/6.6
Mime-Version: 1.0
Date: Sun, 02 Nov 2026 21:24:00 GMT
Content-Type: text/html;charset=utf-8
Content-Length: 3512
X-Squid-Error: ERR_ACCESS_DENIED 0
Via: 1.1 debian-squid.local (squid/6.6)
Connection: keep-alive`}
                explain="Success! Squid intercepts the connection, evaluates 'http_access deny blocked_sites', blocks the request, and returns HTTP 403 Forbidden along with Squid's access denied error page."
              />
            </div>
          </div>

          <div className="deb-subhead">
            <h4>Part 2: Essential Day-to-Day Maintenance Commands</h4>
            <p className="deb-subhead-desc">Keep these commands in your SysAdmin toolkit for routine administration:</p>
          </div>

          <div className="deb-cheatsheet-grid">
            <div className="deb-sheet-card">
              <span className="sheet-tag">Service Lifecycle</span>
              <strong>Restart / Stop / Reload</strong>
              <code>sudo systemctl reload squid</code>
              <p>Reloads config without disconnecting active sessions. Use <code>restart</code> only when changing listening ports or IP bindings.</p>
            </div>

            <div className="deb-sheet-card">
              <span className="sheet-tag">Debugging Logs</span>
              <strong>Systemd Journal Logs</strong>
              <code>sudo journalctl -u squid -n 50 --no-pager</code>
              <p>Displays the last 50 systemd logs for the Squid service to diagnose startup or crashing issues.</p>
            </div>

            <div className="deb-sheet-card">
              <span className="sheet-tag">Performance Stats</span>
              <strong>Cache Hit Ratio & Info</strong>
              <code>sudo apt install -y squidclient && squidclient -p 3128 mgr:info</code>
              <p>Reports live metrics: CPU utilization, memory allocation, cache hit ratio percentage, and total request counts.</p>
            </div>

            <div className="deb-sheet-card">
              <span className="sheet-tag">Storage Reset</span>
              <strong>Wipe & Rebuild Cache Spool</strong>
              <code>sudo systemctl stop squid && sudo rm -rf /var/spool/squid/* && sudo squid -z && sudo systemctl start squid</code>
              <p>Purges all cached data from disk and cleanly reinitializes the directory tree.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const QUIZ_QUESTIONS = [
    {
      q: "Why must you leave the root password blank when installing Debian 13 if you want easy sudo access?",
      opts: [
        "Debian disables root access permanently",
        "The installer automatically installs 'sudo' and adds your regular user to the sudoers group",
        "Debian cannot run Squid if a root password exists",
        "It prevents network ports from opening"
      ],
      a: 1,
      why: "In the Debian installer, omitting a root password triggers Debian to automatically install sudo and configure your standard user with full administrative privileges."
    },
    {
      q: "Which command MUST you run to validate squid.conf for syntax errors before reloading the daemon?",
      opts: [
        "sudo systemctl restart squid",
        "sudo squid -k parse",
        "sudo rm /etc/squid/squid.conf",
        "sudo iptables -F"
      ],
      a: 1,
      why: "'squid -k parse' runs Squid's internal configuration parser. It detects typos, invalid CIDR ranges, and syntax faults without disrupting active user traffic."
    },
    {
      q: "In /var/log/squid/access.log, what does 'TCP_HIT/200' indicate?",
      opts: [
        "The client connection was refused",
        "Squid crashed and restarted",
        "The requested file was served directly from Squid's local cache in 0-2ms without fetching from the internet",
        "Squid intercepted an encrypted password"
      ],
      a: 2,
      why: "TCP_HIT means the requested URL was already stored in Squid's memory or disk cache; it was delivered immediately to the client without downloading from the external web."
    },
    {
      q: "Why must 'http_access deny blocked_sites' be placed ABOVE 'http_access allow localnet' in squid.conf?",
      opts: [
        "Because Squid evaluates rules top-to-bottom and stops at the first match",
        "Because deny rules are always ignored by Squid",
        "Because Squid reads configuration files backwards from the bottom",
        "It doesn't matter where it is placed"
      ],
      a: 0,
      why: "Squid rules evaluate sequentially (top-to-bottom). If 'allow localnet' were placed first, all LAN traffic would be approved immediately and the blocked sites rule would never be reached!"
    }
  ];

  const currentStep = STEPS[activeStep];
  const progressPercent = Math.round((completedSteps.size / STEPS.length) * 100);

  return (
    <section className="deb-tutorial-section" id="debian-squid-tutorial">
      {/* Header Banner */}
      <div className="deb-hero-banner">
        <div className="deb-hero-badge">
          <span className="deb-badge-dot"></span>
          <span>Official Distribution Guide</span>
        </div>
        <h2 className="deb-hero-title">
          <span className="deb-os-icon">🐧</span> Installing & Configuring Squid Proxy on Debian 13 (Trixie)
        </h2>
        <p className="deb-hero-desc">
          A beginner-friendly, hands-on tutorial covering the complete workflow: from installing Debian 13 (Trixie) on your machine, deploying Squid via terminal commands, editing a clean <code>squid.conf</code> with LAN ACLs, to testing proxy requests with <code>curl</code> and monitoring live cache hits in real-time.
        </p>

        <div className="deb-meta-pills">
          <span className="deb-pill">📦 Debian 13 Trixie (Kernel 6.x)</span>
          <span className="deb-pill">🦑 Squid 6.x Proxy Suite</span>
          <span className="deb-pill">🔌 Default Port 3128 TCP</span>
          <span className="deb-pill">⏱ ~50 min hands-on</span>
          <span className="deb-pill">🟢 Beginner Friendly</span>
        </div>
      </div>

      {/* Progress & Controls Bar */}
      <div className="deb-controls-bar">
        <div className="deb-prog-group">
          <div className="deb-prog-label">
            <span>Overall Tutorial Progress</span>
            <strong>{completedSteps.size} of {STEPS.length} Steps Completed ({progressPercent}%)</strong>
          </div>
          <div className="deb-prog-track">
            <span className="deb-prog-fill" style={{ width: `${progressPercent}%` }}></span>
          </div>
        </div>

        <div className="deb-mode-toggle">
          <button
            type="button"
            className={`deb-toggle-btn ${!viewAll ? "is-active" : ""}`}
            onClick={() => setViewAll(false)}
          >
            Guided Wizard
          </button>
          <button
            type="button"
            className={`deb-toggle-btn ${viewAll ? "is-active" : ""}`}
            onClick={() => setViewAll(true)}
          >
            View All Steps
          </button>
        </div>
      </div>

      {/* Step Navigation Tabs (for wizard mode) */}
      {!viewAll && (
        <div className="deb-step-nav" role="tablist" aria-label="Debian Squid Tutorial Steps">
          {STEPS.map((step, idx) => {
            const isCurrent = activeStep === idx;
            const isDone = completedSteps.has(idx);
            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                className={`deb-step-tab ${isCurrent ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                onClick={() => setActiveStep(idx)}
              >
                <div className="deb-tab-top">
                  <span className="deb-tab-num">{step.num}</span>
                  {isDone ? <span className="deb-tab-check">✓</span> : <span className="deb-tab-time">{step.duration}</span>}
                </div>
                <strong className="deb-tab-title">{step.title}</strong>
              </button>
            );
          })}
        </div>
      )}

      {/* Steps Content Area */}
      {viewAll ? (
        <div className="deb-all-steps-container">
          {STEPS.map((step, idx) => {
            const isDone = completedSteps.has(idx);
            return (
              <article key={step.id} className={`deb-step-panel ${isDone ? "is-completed" : ""}`} id={`step-${step.id}`}>
                <div className="deb-step-header">
                  <div className="deb-step-num-badge">
                    <span>STEP {step.num}</span>
                    <span className="deb-step-icon">{step.icon}</span>
                  </div>
                  <div className="deb-step-headings">
                    <h3>{step.title}</h3>
                    <p className="deb-step-subtitle">{step.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    className={`deb-mark-done-btn ${isDone ? "is-done" : ""}`}
                    onClick={() => toggleStepCompletion(idx)}
                  >
                    {isDone ? "✓ Completed" : "Mark as Done"}
                  </button>
                </div>
                {step.render()}
              </article>
            );
          })}
        </div>
      ) : (
        <article className={`deb-step-panel ${completedSteps.has(activeStep) ? "is-completed" : ""}`}>
          <div className="deb-step-header">
            <div className="deb-step-num-badge">
              <span>STEP {currentStep.num}</span>
              <span className="deb-step-icon">{currentStep.icon}</span>
            </div>
            <div className="deb-step-headings">
              <h3>{currentStep.title}</h3>
              <p className="deb-step-subtitle">{currentStep.subtitle}</p>
            </div>
            <button
              type="button"
              className={`deb-mark-done-btn ${completedSteps.has(activeStep) ? "is-done" : ""}`}
              onClick={() => toggleStepCompletion(activeStep)}
            >
              {completedSteps.has(activeStep) ? "✓ Completed" : "Mark as Done"}
            </button>
          </div>

          {currentStep.render()}

          {/* Wizard Navigation Footer */}
          <div className="deb-step-footer">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={activeStep === 0}
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            >
              ← Previous Step
            </button>

            <span className="deb-step-indicator">
              Step {activeStep + 1} of {STEPS.length}
            </span>

            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  toggleStepCompletion(activeStep);
                  setActiveStep(prev => Math.min(STEPS.length - 1, prev + 1));
                }}
              >
                Next: {STEPS[activeStep + 1].title} →
              </button>
            ) : (
              <a
                href="#deb-quiz"
                className="btn btn-primary"
                onClick={() => toggleStepCompletion(activeStep)}
              >
                Take the Quiz ↓
              </a>
            )}
          </div>
        </article>
      )}

      {/* Interactive Knowledge Quiz Section */}
      <div className="deb-quiz-card" id="deb-quiz">
        <div className="deb-quiz-header">
          <span className="deb-quiz-badge">KNOWLEDGE CHECK</span>
          <h3>Debian 13 & Squid Proxy Certification Quiz</h3>
          <p>Test what you have learned about installing Debian 13, Squid commands, and access control rules:</p>
        </div>

        <div className="deb-quiz-list">
          {QUIZ_QUESTIONS.map((q, qIndex) => {
            const picked = quizState[qIndex];
            return (
              <div key={qIndex} className="deb-quiz-item">
                <p className="deb-q-text">
                  <strong>Question {qIndex + 1}:</strong> {q.q}
                </p>
                <div className="deb-q-options">
                  {q.opts.map((opt, oIndex) => {
                    let btnClass = "deb-opt-btn";
                    if (picked !== undefined) {
                      if (oIndex === q.a) btnClass += " is-correct";
                      else if (oIndex === picked) btnClass += " is-wrong";
                    }
                    return (
                      <button
                        key={oIndex}
                        type="button"
                        className={btnClass}
                        disabled={picked !== undefined}
                        onClick={() => {
                          setQuizState(prev => ({ ...prev, [qIndex]: oIndex }));
                        }}
                      >
                        <span className="opt-letter">{["A", "B", "C", "D"][oIndex]}</span>
                        <span className="opt-content">{opt}</span>
                      </button>
                    );
                  })}
                </div>
                {picked !== undefined && (
                  <div className={`deb-why-box ${picked === q.a ? "why-correct" : "why-wrong"}`}>
                    <strong>{picked === q.a ? "✓ Correct!" : "✗ Review:"}</strong> {q.why}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
