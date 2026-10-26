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
      title: "Install and run Squid",
      min: 12,
      sum: "Install Squid on Ubuntu, open port 3128, point a client at it and prove caching works.",
      blocks: [
        { t: "p", x: "Squid is one package, one config file and one port: **3128**. Install it, start it, then tell one client to use it before you open it to the whole LAN." },
        { t: "h", x: "Install and check" },
        { t: "code", lang: "bash", x: "sudo apt update && sudo apt install -y squid\nsudo systemctl enable --now squid\nsudo systemctl status squid --no-pager\nss -tlnp | grep 3128" },
        { t: "h", x: "The two lines that matter in squid.conf" },
        { t: "code", lang: "bash", title: "/etc/squid/squid.conf (essentials)", x: "http_port 3128\nacl localnet src 192.168.0.0/16\nhttp_access allow localnet" },
        { t: "h", x: "Prove it from a client" },
        { t: "code", lang: "bash", x: "export http_proxy=http://192.168.1.10:3128 https_proxy=http://192.168.1.10:3128\ncurl -I http://example.com" },
        { t: "tip", x: "`squid -k parse` before every reload, and `journalctl -u squid -n 50` when it misbehaves." },
        { t: "warn", x: "Default Squid only allows localhost. Until you add your LAN to `localnet`, other devices get access-denied — that is the safe default, not a bug." }
      ],
      quiz: [
        { q: "Which port does Squid listen on by default?", opts: ["80", "443", "3128", "22"], a: 2, why: "3128 is the classic Squid forward-proxy port." },
        { q: "Safe order after editing squid.conf?", opts: ["Reload squid, then check syntax", "Run `squid -k parse` to validate, then reload", "Reboot the server", "Delete the config and reinstall"], a: 1, why: "Validate first with `squid -k parse`, then reload." }
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
