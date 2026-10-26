import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SplitText from "../bits/SplitText/SplitText.jsx";
import BlurText from "../bits/BlurText/BlurText.jsx";
import DecryptedText from "../bits/DecryptedText/DecryptedText.jsx";
import SpotlightCard from "../bits/SpotlightCard.jsx";
import Magnet from "../bits/Magnet/Magnet.jsx";
import ClickSpark from "../bits/ClickSpark/ClickSpark.jsx";
import ShinyText from "../bits/ShinyText.jsx";
import { useProgress } from "../lib/progress.js";

/* All 11 hands-on server modules */
const ALL_MODULES = [
  {
    slug: "squid-forward",
    to: "/squid-proxy/forward-proxy",
    title: "Squid Forward Proxy",
    category: "Proxy & Gateway",
    badge: "Port 3128",
    icon: "➡️",
    desc: "Cache LAN web traffic, throttle download speeds, and enforce domain blacklists and access control lists.",
    cmd: "acl localnet src 192.168.1.0/24\nhttp_access allow localnet",
    time: "15 min",
    level: "Intermediate",
    progressPrefix: "squid-forward"
  },
  {
    slug: "squid-reverse",
    to: "/squid-proxy/reverse-proxy",
    title: "Squid Reverse Proxy",
    category: "Proxy & Gateway",
    badge: "Port 80 / 443",
    icon: "🔁",
    desc: "Deploy Squid as an accelerator and shield in front of backend web applications with SSL offloading.",
    cmd: "http_port 80 accel defaultsite=mysite.com\ncache_peer 127.0.0.1 parent 8080 0 no-query",
    time: "15 min",
    level: "Intermediate",
    progressPrefix: "squid-reverse"
  },
  {
    slug: "squid-transparent",
    to: "/squid-proxy/transparent-proxy",
    title: "Transparent Proxy",
    category: "Proxy & Gateway",
    badge: "Gateway NAT",
    icon: "👻",
    desc: "Silently intercept and cache outbound web traffic at the router or gateway without changing client browser settings.",
    cmd: "iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3129",
    time: "15 min",
    level: "Advanced",
    progressPrefix: "squid-transparent"
  },
  {
    slug: "squid-intercept",
    to: "/squid-proxy/intercept-ssl-bump",
    title: "SSL Bump & Interception",
    category: "Proxy & Gateway",
    badge: "HTTPS Security",
    icon: "🔒",
    desc: "Filter and inspect encrypted HTTPS connections using dynamic certificates signed by your private Certificate Authority.",
    cmd: "http_port 3128 ssl-bump cert=/etc/squid/ca.pem\nssl_bump bump all",
    time: "20 min",
    level: "Advanced",
    progressPrefix: "squid-intercept"
  },
  {
    slug: "docker-containers",
    to: "/docker-containers",
    title: "Docker Containers",
    category: "Virtualization",
    badge: "Microservices",
    icon: "📦",
    desc: "Package applications with their runtime dependencies into isolated containers using Dockerfile and docker-compose.",
    cmd: "docker run -d --name web -p 80:80 --restart=always nginx:alpine",
    time: "20 min",
    level: "Beginner",
    progressPrefix: "docker-containers"
  },
  {
    slug: "file-server",
    to: "/file-server",
    title: "Samba & NFS File Server",
    category: "Storage",
    badge: "SMB / NFS",
    icon: "📂",
    desc: "Configure multi-platform network shared drives for Windows and macOS with Samba, and high-performance UNIX NFS exports.",
    cmd: "[shared]\n  path = /srv/data\n  read only = no\n  valid users = @staff",
    time: "20 min",
    level: "Intermediate",
    progressPrefix: "file-server"
  },
  {
    slug: "mail-server",
    to: "/mail-server",
    title: "Mail Server (Postfix/Dovecot)",
    category: "Communication",
    badge: "SMTP / IMAP",
    icon: "📧",
    desc: "Deploy a production-ready mail server with Postfix SMTP delivery, Dovecot secure IMAP, SPF, and Let's Encrypt TLS.",
    cmd: "systemctl enable --now postfix dovecot\npostconf -e 'smtpd_tls_security_level = may'",
    time: "25 min",
    level: "Advanced",
    progressPrefix: "mail-server"
  },
  {
    slug: "keepalived",
    to: "/keepalived",
    title: "Keepalived & VRRP HA",
    category: "High Availability",
    badge: "Failover VIP",
    icon: "🔄",
    desc: "Eliminate single points of failure with VRRP virtual floating IPs, automatic failover, and health check scripts.",
    cmd: "vrrp_instance VI_1 {\n  state MASTER\n  virtual_ipaddress { 192.168.1.100/24 }\n}",
    time: "15 min",
    level: "Advanced",
    progressPrefix: "keepalived"
  },
  {
    slug: "mqtt",
    to: "/mqtt",
    title: "MQTT Message Broker",
    category: "Messaging",
    badge: "Mosquitto",
    icon: "📡",
    desc: "Set up the lightweight Mosquitto publish/subscribe broker for IoT devices, home automation, and event pipelines.",
    cmd: "mosquitto_sub -t 'sensors/temperature' -h localhost\nmosquitto_pub -t 'sensors/temperature' -m '24.5'",
    time: "15 min",
    level: "Intermediate",
    progressPrefix: "mqtt"
  },
  {
    slug: "lxd",
    to: "/lxd",
    title: "LXD System Containers",
    category: "Virtualization",
    badge: "Full Linux OS",
    icon: "🐧",
    desc: "Run full-fledged Ubuntu and Debian system containers with bare-metal speed, nested virtualization, and instant snapshots.",
    cmd: "lxc launch ubuntu:24.04 server01\nlxc exec server01 -- bash",
    time: "15 min",
    level: "Intermediate",
    progressPrefix: "lxd"
  },
  {
    slug: "nextcloud",
    to: "/nextcloud",
    title: "Nextcloud Private Cloud",
    category: "Storage",
    badge: "Self-Hosted",
    icon: "☁️",
    desc: "Own your data with a self-hosted cloud providing desktop syncing, mobile apps, office document editing, and encryption.",
    cmd: "docker run -d -p 8080:80 -v nextcloud_data:/var/www/html nextcloud",
    time: "20 min",
    level: "Intermediate",
    progressPrefix: "nextcloud"
  }
];

/* Interactive terminal preset commands */
const TERMINAL_PRESETS = [
  {
    label: "systemctl status squid",
    cmd: "systemctl status squid",
    out: `● squid.service - Squid Web Proxy Server
     Loaded: loaded (/usr/lib/systemd/system/squid.service; enabled; preset: enabled)
     Active: active (running) since Sat 2026-10-24 14:20:11 UTC; 6h 44m ago
       Docs: man:squid(8)
   Main PID: 1402 (squid)
      Tasks: 4 (limit: 4915)
     Memory: 46.8M (peak: 62.1M)
        CPU: 1.412s
     CGroup: /system.slice/squid.service
             ├─1402 /usr/sbin/squid --foreground -sYC
             ├─1405 (squid-1) --kid 1 --foreground -sYC
             └─1408 (logfile-daemon) /var/log/squid/access.log

Oct 24 14:20:12 server systemd[1]: Started squid.service - Squid Web Proxy Server.
Oct 24 14:20:12 server squid[1405]: Accepting HTTP Socket connections at local=[::]:3128 remote=[::] FD 12 flags=9
Oct 24 14:20:12 server squid[1405]: Ready to serve requests.`
  },
  {
    label: "docker ps",
    cmd: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
    out: `NAMES               STATUS              PORTS
squid-reverse-proxy Up 8 hours          0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
mosquitto-broker    Up 8 hours          0.0.0.0:1883->1883/tcp
nextcloud-app       Up 12 hours         0.0.0.0:8080->80/tcp
postgres-db         Up 12 hours (healthy) 5432/tcp
redis-cache         Up 12 hours         6379/tcp`
  },
  {
    label: "ip addr show",
    cmd: "ip -brief addr show",
    out: `lo               UNKNOWN        127.0.0.1/8 ::1/128 
eth0             UP             192.168.1.50/24 192.168.1.100/24 (VIP) fe80::5054:ff:fe12:3456/64 
eth1             UP             10.0.0.1/24 
docker0          UP             172.17.0.1/16 `
  },
  {
    label: "smbstatus",
    cmd: "smbstatus --shares",
    out: `Service      pid     Machine       Connected at                     Encryption                   Signing
---------------------------------------------------------------------------------------------------------
shared-docs  1892    192.168.1.75  Sat Oct 24 18:32:04 2026 UTC     AES-128-GCM                  AES-128-CMAC
media-vault  2104    192.168.1.92  Sat Oct 24 19:15:10 2026 UTC     AES-256-GCM                  AES-128-GMAC`
  },
  {
    label: "free -h",
    cmd: "free -h",
    out: `               total        used        free      shared  buff/cache   available
Mem:            15Gi       3.2Gi       9.1Gi       140Mi       2.7Gi        11Gi
Swap:          4.0Gi          0B       4.0Gi`
  }
];

export default function HomePage() {
  const progress = useProgress();
  const [activeCategory, setActiveCategory] = useState("All");
  const [terminalCmd, setTerminalCmd] = useState("systemctl status squid");
  const [terminalOutput, setTerminalOutput] = useState(TERMINAL_PRESETS[0].out);
  const [customInput, setCustomInput] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);
  const [uptimeSeconds, setUptimeSeconds] = useState(14820);

  useEffect(function () {
    document.title = "ServerPath — Linux Server Administration & Architecture Lab";
  }, []);

  /* Simulated server live counter */
  useEffect(function () {
    const timer = setInterval(function () {
      setUptimeSeconds(function (prev) { return prev + 1; });
    }, 1000);
    return function () { clearInterval(timer); };
  }, []);

  function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${d > 0 ? d + "d " : ""}${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }

  function handlePresetClick(item) {
    setTerminalCmd(item.cmd);
    setTerminalOutput(item.out);
  }

  function handleCustomCommand(e) {
    e.preventDefault();
    const clean = customInput.trim();
    if (!clean) return;

    setTerminalCmd(clean);
    const lower = clean.toLowerCase();

    if (lower === "help") {
      setTerminalOutput(`ServerPath Interactive Lab Shell
Available test commands:
  - systemctl status squid
  - docker ps
  - ip addr show
  - smbstatus
  - free -h
  - uname -a
  - whoami
  - clear`);
    } else if (lower === "uname -a") {
      setTerminalOutput("Linux lab-server 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux");
    } else if (lower === "whoami") {
      setTerminalOutput("sysadmin@serverpath-lab (uid=1000 gid=1000 sudoers)");
    } else if (lower === "clear") {
      setTerminalOutput("");
    } else {
      const match = TERMINAL_PRESETS.find(p => p.cmd.toLowerCase() === lower);
      if (match) {
        setTerminalOutput(match.out);
      } else {
        setTerminalOutput(`sysadmin@serverpath-lab:~$ ${clean}\nExecuting simulated command: ${clean}\n[OK] Process completed with exit code 0.`);
      }
    }
    setCustomInput("");
  }

  function copyCode(key, text) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(function () { setCopiedKey(null); }, 2000);
  }

  const categories = ["All", "Proxy & Gateway", "Virtualization", "Storage", "High Availability", "Communication"];

  const filteredModules = ALL_MODULES.filter(function (m) {
    if (activeCategory === "All") return true;
    return m.category === activeCategory;
  });

  return (
    <>
      <AppHeader />
      <div className="home-spark-wrap">
        <ClickSpark sparkColor="rgba(94, 234, 212, 0.9)" sparkCount={10} sparkSize={8} sparkRadius={20} duration={400}>
          <main>
            {/* ==================== HERO SECTION ==================== */}
            <section className="hero">
              <div className="hero-bg" aria-hidden="true">
                <span className="hero-orb hero-orb-a"></span>
                <span className="hero-orb hero-orb-b"></span>
                <span className="hero-grid"></span>
              </div>

              <div className="container hero-inner-split">
                {/* Hero Left: Copy & Actions */}
                <div className="hero-copy">
                  <div className="hero-badge-row">
                    <span className="hero-badge">
                      <span className="hero-badge-dot"></span>
                      <DecryptedText
                        text="PRODUCTION LINUX LABS · 2026 EDITION"
                        animateOn="view"
                        speed={35}
                        maxIterations={15}
                      />
                    </span>
                    <span className="hero-version-pill">v2.4 Ready</span>
                  </div>

                  <h1 className="hero-heading">
                    <SplitText
                      tag="span"
                      text="Master Linux Servers"
                      className="hero-line"
                      splitType="words"
                      delay={40}
                      duration={0.7}
                      textAlign="left"
                    />
                    <br />
                    <span className="hero-line">
                      for a <span className="accent-gradient">Stronger, Resilient Web</span>
                    </span>
                  </h1>

                  <BlurText
                    className="hero-lede"
                    text="The comprehensive, hands-on guide for operating modern Linux servers. Master Squid Proxy architectures, Docker microservices, high-availability clustering with Keepalived, Samba storage, and hardened network security."
                    delay={20}
                    animateBy="words"
                    direction="top"
                  />

                  <div className="hero-actions">
                    <Magnet wrapperClassName="hero-magnet" padding={60} magnetStrength={2.5}>
                      <a className="btn btn-primary hero-btn-main" href="#modules">
                        <span>🚀 Explore All 11 Modules</span>
                      </a>
                    </Magnet>
                    <Magnet wrapperClassName="hero-magnet" padding={50} magnetStrength={2}>
                      <Link className="btn btn-ghost hero-btn-sub" to="/squid-proxy">
                        <span>🦑 Squid Proxy Suite</span>
                      </Link>
                    </Magnet>
                    <a className="btn btn-subtle hero-btn-term" href="#playground">
                      <span>💻 Try Shell</span>
                    </a>
                  </div>

                  <div className="hero-features-chips">
                    <span className="h-chip">✓ Zero Signup Required</span>
                    <span className="h-chip">✓ Saved on Device</span>
                    <span className="h-chip">✓ Real Production Configs</span>
                  </div>
                </div>

                {/* Hero Right: Live Server Telemetry Dashboard */}
                <div className="hero-telemetry-col" aria-label="Simulated Live Linux Server">
                  <div className="telemetry-card">
                    <div className="telemetry-bar">
                      <div className="term-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="telemetry-host">
                        <span className="host-pulse"></span>
                        <span>node-01.serverpath.internal</span>
                      </div>
                      <span className="telemetry-tag">UBUNTU 24.04</span>
                    </div>

                    <div className="telemetry-body">
                      {/* Live stats grid */}
                      <div className="telemetry-metrics">
                        <div className="metric-box">
                          <span className="metric-label">UPTIME</span>
                          <span className="metric-val">{formatUptime(uptimeSeconds)}</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">CPU LOAD</span>
                          <span className="metric-val text-mint">18.4% (4 cores)</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">MEMORY</span>
                          <span className="metric-val text-violet">3.2 / 16 GB</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">STATUS</span>
                          <span className="metric-val text-green">● HEALTHY</span>
                        </div>
                      </div>

                      {/* Active systemd services list */}
                      <div className="telemetry-services">
                        <p className="services-title">ACTIVE SYSTEM SERVICES</p>
                        <div className="service-row">
                          <span className="svc-status active">ACTIVE</span>
                          <span className="svc-name">squid.service</span>
                          <span className="svc-desc">Proxy (:3128, :80, :443)</span>
                          <span className="svc-mem">46.8M</span>
                        </div>
                        <div className="service-row">
                          <span className="svc-status active">ACTIVE</span>
                          <span className="svc-name">docker.service</span>
                          <span className="svc-desc">5 containers running</span>
                          <span className="svc-mem">382M</span>
                        </div>
                        <div className="service-row">
                          <span className="svc-status active">ACTIVE</span>
                          <span className="svc-name">keepalived.service</span>
                          <span className="svc-desc">VRRP Master (VIP 192.168.1.100)</span>
                          <span className="svc-mem">14.2M</span>
                        </div>
                        <div className="service-row">
                          <span className="svc-status active">ACTIVE</span>
                          <span className="svc-name">smbd.service</span>
                          <span className="svc-desc">LAN Windows/Mac Shares</span>
                          <span className="svc-mem">28.4M</span>
                        </div>
                      </div>

                      {/* Quick command preview */}
                      <div className="telemetry-cmd-preview">
                        <span className="t-prompt">sysadmin@node-01:~$</span>
                        <ShinyText text="systemctl is-active --quiet squid && echo 'Online'" color="#5eead4" speed={3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== STATS BANNER ==================== */}
            <section className="stats-strip">
              <div className="container stats-inner">
                <div className="stat-item">
                  <span className="stat-number">11</span>
                  <span className="stat-desc">Core Server Stacks</span>
                </div>
                <div className="stat-sep" aria-hidden="true"></div>
                <div className="stat-item">
                  <span className="stat-number">24+</span>
                  <span className="stat-desc">Interactive Lessons</span>
                </div>
                <div className="stat-sep" aria-hidden="true"></div>
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-desc">Free & Self-Paced</span>
                </div>
                <div className="stat-sep" aria-hidden="true"></div>
                <div className="stat-item">
                  <span className="stat-number">Local</span>
                  <span className="stat-desc">Saved on Device</span>
                </div>
              </div>
            </section>

            {/* ==================== MODULES SHOWCASE ==================== */}
            <section className="section modules-section" id="modules">
              <div className="container">
                <div className="section-head text-center">
                  <p className="kicker">Curriculum & Architectures</p>
                  <h2>Explore Server Configurations</h2>
                  <p className="section-sub">
                    Step-by-step guides with real configuration syntax, troubleshooting techniques, and self-test checkpoints.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="category-filters" role="tablist" aria-label="Filter modules">
                  {categories.map(function (cat) {
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={activeCategory === cat}
                        className={`cat-pill ${activeCategory === cat ? "is-active" : ""}`}
                        onClick={function () { setActiveCategory(cat); }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Modules Grid */}
                <div className="modules-grid">
                  {filteredModules.map(function (mod) {
                    const isDone = progress.has(`${mod.progressPrefix}/intro`) || progress.has(`${mod.progressPrefix}/setup`);

                    return (
                      <SpotlightCard
                        key={mod.slug}
                        className="module-card-item"
                        theme="light"
                        spotlightColor="rgba(94, 234, 212, 0.15)"
                      >
                        <div className="mod-card-top">
                          <span className="mod-icon" aria-hidden="true">{mod.icon}</span>
                          <span className="mod-category-badge">{mod.category}</span>
                          <span className="mod-port-badge">{mod.badge}</span>
                        </div>

                        <h3 className="mod-title">
                          <Link to={mod.to}>{mod.title}</Link>
                        </h3>

                        <p className="mod-desc">{mod.desc}</p>

                        <div className="mod-code-preview">
                          <code>{mod.cmd}</code>
                        </div>

                        <div className="mod-card-footer">
                          <div className="mod-meta">
                            <span>⏱ {mod.time}</span>
                            <span>• {mod.level}</span>
                          </div>
                          <Link to={mod.to} className="mod-link-btn">
                            <span>Start Lab</span>
                            <span className="mod-arrow" aria-hidden="true">→</span>
                          </Link>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ==================== INTERACTIVE TERMINAL PLAYGROUND ==================== */}
            <section className="section playground-section" id="playground">
              <div className="container">
                <div className="playground-inner">
                  <div className="playground-head">
                    <p className="kicker">Hands-on SysAdmin Simulation</p>
                    <h2>Interactive Linux Terminal</h2>
                    <p className="section-sub">
                      Test essential Linux commands before applying them on your real machine. Click any preset or enter commands.
                    </p>

                    <div className="preset-buttons">
                      {TERMINAL_PRESETS.map(function (p) {
                        return (
                          <button
                            key={p.cmd}
                            type="button"
                            className={`preset-btn ${terminalCmd === p.cmd ? "is-active" : ""}`}
                            onClick={function () { handlePresetClick(p); }}
                          >
                            <code>$ {p.label}</code>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terminal Window */}
                  <div className="terminal-window">
                    <div className="term-bar">
                      <div className="term-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <span className="term-title">sysadmin@serverpath-lab: ~ (bash 5.2)</span>
                      <button
                        type="button"
                        className="term-copy-btn"
                        onClick={function () { copyCode("term", terminalOutput); }}
                        title="Copy terminal output"
                      >
                        {copiedKey === "term" ? "✓ Copied" : "Copy"}
                      </button>
                    </div>

                    <div className="term-body term-playground-body">
                      <div className="term-cmd-executed">
                        <span className="tprompt">sysadmin@serverpath-lab</span>:~$ <span className="tcmd">{terminalCmd}</span>
                      </div>
                      <pre className="term-output">{terminalOutput}</pre>

                      {/* Interactive Command Input Form */}
                      <form onSubmit={handleCustomCommand} className="term-prompt-line">
                        <span className="tprompt">sysadmin@serverpath-lab</span>:~$
                        <input
                          type="text"
                          className="term-input"
                          value={customInput}
                          placeholder="Type 'help', 'docker ps', 'free -h', etc. & Enter..."
                          onChange={function (e) { setCustomInput(e.target.value); }}
                        />
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== ARCHITECTURE PILLARS ==================== */}
            <section className="section" id="pillars">
              <div className="container">
                <div className="section-head text-center">
                  <p className="kicker">Core Principles</p>
                  <h2>Why Build on Linux Servers?</h2>
                  <p className="section-sub">
                    Proven engineering qualities that make Linux the backbone of modern cloud computing and enterprise hosting.
                  </p>
                </div>

                <div className="pillars-grid">
                  <SpotlightCard className="pillar-card" theme="light" spotlightColor="rgba(74, 222, 128, 0.15)">
                    <div className="pillar-icon green">🛡️</div>
                    <h3>Secure by Design</h3>
                    <p>Granular POSIX permissions, mandatory access controls with SELinux/AppArmor, and transparent packet filtering via nftables.</p>
                    <Link to="/secure-by-design" className="pillar-link">Read Architecture →</Link>
                  </SpotlightCard>

                  <SpotlightCard className="pillar-card" theme="light" spotlightColor="rgba(167, 139, 250, 0.15)">
                    <div className="pillar-icon violet">⚡</div>
                    <h3>High Performance</h3>
                    <p>Minimal kernel overhead, asynchronous epoll networking, aggressive page cache buffering, and custom TCP stack tuning.</p>
                    <Link to="/high-performance" className="pillar-link">Read Architecture →</Link>
                  </SpotlightCard>

                  <SpotlightCard className="pillar-card" theme="light" spotlightColor="rgba(56, 189, 248, 0.15)">
                    <div className="pillar-icon blue">⚙️</div>
                    <h3>Full Declarative Control</h3>
                    <p>Plaintext configuration files, automated systemd service life cycles, scriptable bash tooling, and containerization.</p>
                    <Link to="/full-control" className="pillar-link">Read Architecture →</Link>
                  </SpotlightCard>

                  <SpotlightCard className="pillar-card" theme="light" spotlightColor="rgba(251, 191, 36, 0.15)">
                    <div className="pillar-icon orange">☁️</div>
                    <h3>Open Source Freedom</h3>
                    <p>No vendor lock-in, zero per-seat licensing fees, total code auditability, and support from a global engineering community.</p>
                    <Link to="/open-source" className="pillar-link">Read Architecture →</Link>
                  </SpotlightCard>
                </div>
              </div>
            </section>

            {/* ==================== QUICK SYSADMIN CHEATSHEET ==================== */}
            <section className="section cheatsheet-section">
              <div className="container">
                <div className="cheatsheet-card">
                  <div className="cheatsheet-header">
                    <div>
                      <p className="kicker">Fast Reference</p>
                      <h3>Essential SysAdmin Commands</h3>
                    </div>
                    <span className="cheat-badge">Cheat Sheet</span>
                  </div>

                  <div className="cheatsheet-grid">
                    <div className="cheat-col">
                      <h4>⚙️ systemd Services</h4>
                      <div className="cheat-snippet" onClick={function () { copyCode("s1", "systemctl status <service>"); }}>
                        <code>systemctl status &lt;svc&gt;</code>
                        <span className="copy-tag">{copiedKey === "s1" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("s2", "systemctl restart <service>"); }}>
                        <code>systemctl restart &lt;svc&gt;</code>
                        <span className="copy-tag">{copiedKey === "s2" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("s3", "journalctl -u <service> -f"); }}>
                        <code>journalctl -u &lt;svc&gt; -f</code>
                        <span className="copy-tag">{copiedKey === "s3" ? "✓" : "copy"}</span>
                      </div>
                    </div>

                    <div className="cheat-col">
                      <h4>🌐 Networking & Ports</h4>
                      <div className="cheat-snippet" onClick={function () { copyCode("n1", "ss -tulpn"); }}>
                        <code>ss -tulpn</code>
                        <span className="copy-tag">{copiedKey === "n1" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("n2", "ip -c a"); }}>
                        <code>ip -c a</code>
                        <span className="copy-tag">{copiedKey === "n2" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("n3", "ufw status verbose"); }}>
                        <code>ufw status verbose</code>
                        <span className="copy-tag">{copiedKey === "n3" ? "✓" : "copy"}</span>
                      </div>
                    </div>

                    <div className="cheat-col">
                      <h4>📂 Disks & Memory</h4>
                      <div className="cheat-snippet" onClick={function () { copyCode("d1", "df -hT"); }}>
                        <code>df -hT</code>
                        <span className="copy-tag">{copiedKey === "d1" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("d2", "free -h"); }}>
                        <code>free -h</code>
                        <span className="copy-tag">{copiedKey === "d2" ? "✓" : "copy"}</span>
                      </div>
                      <div className="cheat-snippet" onClick={function () { copyCode("d3", "rsync -avz /src /dest"); }}>
                        <code>rsync -avz /src /dest</code>
                        <span className="copy-tag">{copiedKey === "d3" ? "✓" : "copy"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================== CTA BANNER ==================== */}
            <section className="section cta-section">
              <div className="container">
                <div className="cta-banner">
                  <div className="cta-glow" aria-hidden="true"></div>
                  <div className="cta-content">
                    <h2>Ready to Build Your Server Infrastructure?</h2>
                    <p>Start with Squid Proxy or Docker containers — and take control of your network stack.</p>
                    <div className="cta-buttons">
                      <Link className="btn btn-primary cta-btn-glow" to="/squid-proxy/forward-proxy">
                        🦑 Start with Forward Proxy
                      </Link>
                      <Link className="btn btn-ghost" to="/docker-containers">
                        📦 Start with Docker
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </ClickSpark>
      </div>
      <SiteFooter />
    </>
  );
}
