/* Module 6: Server Setup & Security */
window.COURSE_MODULES.push({
  id: "security",
  title: "Server Setup & Security",
  icon: "🛡️",
  sum: "Install and update software the right way, serve a real website with nginx and TLS, then lock the machine down and back it up.",
  lessons: [
    {
      id: "packages",
      title: "Packages: install, update, inspect",
      min: 9,
      sum: "Use the package manager for everything, read the Debian vs Red Hat differences, and let security updates install themselves.",
      blocks: [
        { t: "p", x: "Every piece of software on the server — nginx, PostgreSQL, even your shell — came from a **package manager** pulling signed packages from repositories. It is how you install, update and remove software without chasing downloads." },
        { t: "h", x: "The everyday commands (Debian/Ubuntu: apt)" },
        { t: "code", lang: "bash", x: "sudo apt update              # refresh the package lists (no upgrades yet)\nsudo apt upgrade -y          # install available upgrades\nsudo apt install nginx       # install; dependencies come along automatically\nsudo apt remove nginx        # uninstall (purge also removes its configs)\napt list --upgradable        # what is waiting to be updated?" },
        { t: "p", x: "`update` refreshes the catalog; `upgrade` installs from it. They are two different jobs — forgetting `update` first is why people 'cannot find' a package that clearly exists." },
        { t: "h", x: "Red Hat family: dnf" },
        { t: "code", lang: "bash", x: "sudo dnf upgrade --refresh   # update everything\nsudo dnf install nginx\nsudo dnf remove nginx\ndnf info nginx               # description + version" },
        { t: "h", x: "Search and inspect" },
        { t: "code", lang: "bash", x: "apt search 'web server'    # search names and descriptions\napt show nginx             # version, size, dependencies, homepage\ndpkg -l | grep nginx       # what version is actually installed?\nnginx -v                   # ask the software itself" },
        { t: "h", x: "Let security updates install themselves" },
        { t: "code", lang: "bash", x: "sudo apt install unattended-upgrades\nsudo dpkg-reconfigure --priority=low unattended-upgrades\n\n# later, check what it did:\ncat /var/log/unattended-upgrades/unattended-upgrades.log" },
        { t: "warn", x: "Only add third-party repositories (PPAs, custom apt sources) that you genuinely trust. A repository is software installation with root rights — treat adding one like handing someone your SSH key." }
      ],
      quiz: [
        { q: "What does `sudo apt update` actually do?", opts: ["Installs available upgrades", "Refreshes the list of available packages and versions", "Updates the kernel", "Upgrades the distribution to the next release"], a: 1, why: "`update` syncs the catalog from repositories. `upgrade` (or `full-upgrade`) installs newer versions — usually the next thing you run." },
        { q: "Which command shows the version of nginx that is installed right now?", opts: ["`apt show nginx`", "`apt search nginx`", "`dpkg -l | grep nginx`", "`apt list --upgradable`"], a: 2, why: "`dpkg -l` lists installed packages and their versions. `apt show` describes what the repository offers, not what is on disk." }
      ]
    },
    {
      id: "web-server",
      title: "Serving a real site with nginx",
      min: 12,
      sum: "Install nginx, serve a static site, reverse-proxy an app on port 3000, and add free TLS with certbot.",
      blocks: [
        { t: "p", x: "Time to serve something real. nginx is the workhorse of the modern web: static file server, reverse proxy and TLS terminator in one small binary." },
        { t: "h", x: "Install and check" },
        { t: "code", lang: "bash", x: "sudo apt update && sudo apt install -y nginx\nsudo systemctl enable --now nginx\ncurl -I http://localhost\n# → HTTP/1.1 200 OK   ·   Server: nginx" },
        { t: "h", x: "Serve a static site" },
        { t: "p", x: "On Debian/Ubuntu, sites live in `/etc/nginx/sites-available/` and are switched on by symlinking into `sites-enabled/` — exactly the symlink pattern you already know." },
        { t: "code", lang: "nginx", title: "/etc/nginx/sites-available/mysite", x: "server {\n    listen 80;\n    server_name example.com www.example.com;\n\n    root /var/www/mysite;\n    index index.html;\n\n    location / {\n        try_files $uri $uri/ =404;\n    }\n}" },
        { t: "code", lang: "bash", x: "sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/\nsudo mkdir -p /var/www/mysite\necho 'hello from nginx' | sudo tee /var/www/mysite/index.html\nsudo nginx -t && sudo systemctl reload nginx   # test FIRST, then reload" },
        { t: "h", x: "Reverse proxy: put nginx in front of your app" },
        { t: "p", x: "Apps usually listen on a high port on loopback (say 3000). nginx accepts public traffic on 80/443 and forwards it — adding TLS, compression and caching, and giving you one place to manage domains." },
        { t: "code", lang: "nginx", x: "location / {\n    proxy_pass http://127.0.0.1:3000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n}" },
        { t: "h", x: "TLS in three commands" },
        { t: "code", lang: "bash", x: "sudo apt install certbot python3-certbot-nginx\nsudo certbot --nginx -d example.com -d www.example.com\n# certbot edits the vhost, fetches the certificate, sets up auto-renewal\nsystemctl list-timers | grep certbot   # the renewal timer" },
        { t: "tip", x: "`nginx -t` before every reload, and `journalctl -u nginx -n 50` when it misbehaves. A wrong `proxy_pass` port is the most common culprit by far." },
        { t: "warn", x: "Keep the site root owned by your deploy user but **readable** by the nginx user (`www-data`). The web server must be able to read files — never to write them." }
      ],
      quiz: [
        { q: "Which command validates nginx configuration before you reload?", opts: ["`nginx -v`", "`nginx -t`", "`systemctl check nginx`", "`journalctl -u nginx`"], a: 1, why: "`nginx -t` parses the config and reports syntax errors — a reload with a broken config takes the site down." },
        { q: "What does a reverse proxy do?", opts: ["Serves only static files", "Accepts client traffic and forwards it to your app, adding TLS and control", "Replaces the need for a firewall", "Caches DNS lookups"], a: 1, why: "nginx terminates the public connection and proxies to the app on loopback — the app stays hidden, and TLS/compression/routing live in one place." },
        { q: "On Ubuntu, where do site configurations live before being enabled?", opts: ["`/etc/nginx/sites-available/`", "`/var/www/nginx/`", "`/etc/nginx/conf.d` only", "`/usr/share/nginx`"], a: 0, why: "Sites live in `sites-available/` and are activated with a symlink into `sites-enabled/` — easy to disable without deleting." }
      ]
    },
    {
      id: "firewall",
      title: "Firewalls: close everything, open what you need",
      min: 10,
      sum: "Default-deny with ufw or firewalld, keep SSH open, and remember the second firewall waiting in the cloud dashboard.",
      blocks: [
        { t: "p", x: "A firewall is the list of doors that exist on your server. The professional default: **close everything**, then open exactly what is needed — starting with SSH, or you will lock yourself out of your own machine." },
        { t: "h", x: "ufw: the friendly firewall (Ubuntu/Debian)" },
        { t: "code", lang: "bash", x: "sudo ufw allow OpenSSH     # FIRST: keep your own door open\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp\nsudo ufw enable\nsudo ufw status verbose     # what is open, and the default policy\nsudo ufw delete allow 80/tcp                        # remove a rule\nsudo ufw allow from 203.0.113.7 to any port 5432    # DB for one host only" },
        { t: "h", x: "firewalld: the Red Hat family equivalent" },
        { t: "code", lang: "bash", x: "sudo firewall-cmd --permanent --add-service=http\nsudo firewall-cmd --permanent --add-service=https\nsudo firewall-cmd --reload\nsudo firewall-cmd --list-all" },
        { t: "h", x: "How to think about a firewall" },
        { t: "ul", x: [
          "Open by **service** (`OpenSSH`, `http`) or by **port** (`443/tcp`). Both styles are fine.",
          "Anything not explicitly allowed is dropped. That is the whole point.",
          "Databases should almost never answer from the entire internet. Allow the one host that needs access, not `0.0.0.0/0`.",
          "Compare two lists regularly: what is listening (`ss -tulpn`) versus what is open (`ufw status`). They should match closely."
        ] },
        { t: "warn", x: "Enabling a firewall over SSH with the wrong rules is how people lose access to servers. Allow SSH **first**, then enable — and keep your provider's console open in another tab the first time." },
        { t: "tip", x: "Cloud servers usually have a **second firewall**: the security group in the provider's dashboard. A port open in `ufw` but closed in the security group is still unreachable. Check both layers." }
      ],
      quiz: [
        { q: "Which rule must exist before you run `sudo ufw enable` on a remote server?", opts: ["`sudo ufw allow 80/tcp`", "`sudo ufw allow OpenSSH`", "`sudo ufw disable`", "`sudo ufw delete allow 22`"], a: 1, why: "Without an SSH rule, enabling the default-deny firewall cuts the connection you are using to enable it." },
        { q: "A port is open in ufw but unreachable from the internet. Most likely reason?", opts: ["ufw is broken", "The cloud provider's security group (the second firewall) does not allow it", "DNS is misconfigured", "The service is on port 80"], a: 1, why: "Cloud VMs typically filter traffic twice: once in the provider network layer and once on the host. Both must allow the port." }
      ]
    },
    {
      id: "hardening-backups",
      title: "Hardening habits and backups worth the name",
      min: 12,
      sum: "Five habits that keep a server safe over years, fail2ban against brute-forcers, and backups with the 3-2-1 rule.",
      blocks: [
        { t: "p", x: "A fresh server is a stranger; a managed server is a home. Five habits turn one into the other — and the last one matters because the first four can still fail." },
        { t: "h", x: "The five habits" },
        { t: "ul", x: [
          "**Patch automatically.** Unattended upgrades plus reboots when the kernel changes. Most breaches are known bugs fixed months earlier.",
          "**Minimise exposure.** Nothing listens that does not have to (`ss -tulpn`), the firewall is default-deny, SSH is key-only.",
          "**Least privilege.** Services run as their own users, humans escalate with sudo, nothing runs as root that does not need to.",
          "**Watch.** Check failed logins (`/var/log/auth.log`), let fail2ban punish repeat offenders, and keep one outside uptime check.",
          "**Back up.** Assume disk failure, fat fingers and ransomware. And assume your restore will be tested — an untested backup is a rumour."
        ] },
        { t: "h", x: "fail2ban: automatic banning" },
        { t: "code", lang: "bash", x: "sudo apt install fail2ban\nsudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local   # local overrides\n\n# in jail.local:\n[sshd]\nenabled = true\nmaxretry = 5\nbantime = 1h\n\nsudo systemctl enable --now fail2ban\nsudo fail2ban-client status sshd    # see bans and current blocks" },
        { t: "h", x: "Backups worth the name: 3-2-1" },
        { t: "ul", x: [
          "**3** copies of the data, **2** different media, **1** off-site. A backup on the same disk is just a copy of the accident.",
          "Automated via cron or a systemd timer — discipline is not a backup strategy.",
          "Versioned: never overwrite yesterday. A corrupted file syncs its corruption to every destination instantly.",
          "Restores are tested. Untested backups are decoration."
        ] },
        { t: "code", lang: "bash", title: "Space-efficient snapshots", x: "rsync -a --delete --link-dest=/backups/latest /srv/app/ /backups/2026-10-04/\n# unchanged files become hardlinks → a full-looking snapshot at near-zero cost\nls -l /backups/    # each dated folder looks complete; the disk only stores changes" },
        { t: "tip", x: "For the off-site copy, prefer a **pull**: the backup host connects out and fetches. The production server then holds no credentials to your backup infrastructure — the most valuable target stays out of reach." },
        { t: "warn", x: "Never call something a backup system until you have restored from it at least once — one file, then one directory, onto a scratch machine. Do it before the day you really need it, not during." }
      ],
      quiz: [
        { q: "What does the 3-2-1 rule mean?", opts: ["3 servers, 2 admins, 1 password manager", "3 copies of data, on 2 kinds of media, with 1 off-site", "3 backups per day, 2 per week, 1 per month", "3 disks in RAID, 2 replicas, 1 spare"], a: 1, why: "Three copies guard against corruption, two media types against a bad disk batch, and one off-site copy against fire, theft and ransomware." },
        { q: "You have automated backups but never restored anything. Which statement is true?", opts: ["Backups are complete", "The backups are unverified — restore one before trusting them", "Restores are unnecessary if the job exits 0", "You should back up twice as often"], a: 1, why: "An exit code of 0 only proves the script ran. Only a restore proves the data is there and readable." }
      ]
    }
  ]
});
