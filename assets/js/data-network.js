/* Module 5: Networking & Remote Access */
window.COURSE_MODULES.push({
  id: "network",
  title: "Networking & Remote Access",
  icon: "🌐",
  sum: "Understand addresses, ports and DNS, log in with SSH keys, and move files around reliably.",
  lessons: [
    {
      id: "network-basics",
      title: "Addresses, ports and DNS",
      min: 10,
      sum: "Check the four basics in the right order — address, route, listener, name — and debug 'it does not load' without guessing.",
      blocks: [
        { t: "p", x: "Servers exist to talk to other machines. When something 'is not working', disciplined people check four things in order instead of guessing. This lesson is the checklist." },
        { t: "h", x: "1) Address and route" },
        { t: "code", lang: "bash", x: "ip a                    # interfaces and IP addresses\nip r                    # routing table; 'default via' is the gateway\nhostname -I             # just the IPs\nping -c 4 1.1.1.1       # is the network alive at all?\ntraceroute example.com  # hop by hop; find where it stalls" },
        { t: "h", x: "2) Listeners: is anything actually listening?" },
        { t: "code", lang: "bash", x: "ss -tulpn               # TCP+UDP listeners with process names\nss -tulpn | grep ':443' # who owns port 443?\ncurl -I http://localhost:3000   # does the app answer on loopback?" },
        { t: "ul", x: [
          "Ports worth memorising: **22** SSH · **80** HTTP · **443** HTTPS · **5432** PostgreSQL · **3306** MySQL · **6379** Redis · **3000/8000** dev apps.",
          "`127.0.0.1` is **loopback** — reachable only from this machine. `0.0.0.0` means every interface. An app bound to 127.0.0.1 is invisible to the outside no matter what the firewall says."
        ] },
        { t: "h", x: "3) DNS: is the name resolving?" },
        { t: "code", lang: "bash", x: "dig +short example.com   # what IP does the name point to?\ncat /etc/resolv.conf     # which resolvers are configured?\ncurl -sv https://example.com 2>&1 | head -25   # full request trace" },
        { t: "h", x: "The debugging order that saves hours" },
        { t: "ul", x: [
          "Is the process running? → `systemctl status myapp`",
          "Is it listening? → `ss -tulpn | grep myport`",
          "Does it answer locally? → `curl -I http://localhost:myport`",
          "Is the firewall open? → `sudo ufw status`",
          "Does the name resolve from outside? → `dig +short mydomain`"
        ] },
        { t: "tip", x: "Each step eliminates a layer: process, socket, loopback, network stack, name. Fix the first step that fails and re-run the list — never skip downwards." }
      ],
      quiz: [
        { q: "Which command shows listening ports along with the process that owns each one?", opts: ["`ip a`", "`ss -tulpn`", "`dig -x`", "`uptime`"], a: 1, why: "`ss -tulpn` lists TCP and UDP listeners (−t −u), listening only (−l), with process info (−p) and numeric ports (−n)." },
        { q: "An app is bound to 127.0.0.1:8080. Can a client on the internet reach it?", opts: ["Yes, if the firewall allows 8080", "Yes, always", "No — loopback is only reachable from the machine itself", "Only over HTTPS"], a: 2, why: "Binding to the loopback interface means the socket never appears on the public interface. Bind to 0.0.0.0 (or the specific public IP) to accept outside connections." }
      ]
    },
    {
      id: "ssh",
      title: "SSH keys: log in like a professional",
      min: 11,
      sum: "Create a key pair, install the public half on servers, shortcut it with ~/.ssh/config, then harden the daemon safely.",
      blocks: [
        { t: "p", x: "SSH is your hands on the server. Passwords get guessed and brute-forced constantly; **keys** cannot be guessed at all. Set up key login first, then lock the door behind you." },
        { t: "h", x: "Keys in sixty seconds" },
        { t: "code", lang: "bash", x: "# on YOUR laptop:\nssh-keygen -t ed25519 -C 'you@laptop'   # creates ~/.ssh/id_ed25519 (+ .pub)\nssh-copy-id deploy@203.0.113.10         # installs the public key on the server\nssh deploy@203.0.113.10                 # now logs in without a password" },
        { t: "ul", x: [
          "`id_ed25519` is the **private key**: never leaves your laptop, never copied to a server, never committed to git. Keep it at `chmod 600`.",
          "`id_ed25519.pub` is the **public key**: safe to share; it lands in `~/.ssh/authorized_keys` on each server you trust.",
          "ed25519 is shorter and stronger than RSA. If you must use RSA: `-t rsa -b 4096`."
        ] },
        { t: "h", x: "A config file that pays rent" },
        { t: "code", lang: "bash", title: "~/.ssh/config", x: "Host web\n  HostName 203.0.113.10\n  User deploy\n  IdentityFile ~/.ssh/id_ed25519\n\n# afterwards, just:   ssh web" },
        { t: "h", x: "Hardening the server: /etc/ssh/sshd_config" },
        { t: "code", lang: "bash", x: "PasswordAuthentication no\nPermitRootLogin no\nAllowUsers deploy\n\n# validate, then apply:\nsudo sshd -t && sudo systemctl reload sshd" },
        { t: "warn", x: "**Never close your working session until key login succeeds in a second terminal.** Open a new window, run `ssh web`, and only then disable password auth. Locking yourself out of a remote server is a rite of passage you can skip." },
        { t: "tip", x: "Keep a passphrase on your key and let the agent remember it for the session: `eval \"$(ssh-agent -s)\"` then `ssh-add ~/.ssh/id_ed25519`. Key-grade security, password-grade convenience." }
      ],
      quiz: [
        { q: "Which piece ends up on the server for key-based login?", opts: ["The private key, in `~/.ssh/id_ed25519`", "The public key, inside `~/.ssh/authorized_keys`", "Both keys", "`/etc/ssh/sshd_config`"], a: 1, why: "The server stores public keys; your laptop proves ownership of the matching private key during login. The private key never travels." },
        { q: "Safe order for disabling password logins?", opts: ["Set PasswordAuthentication no first, then test", "Test key login in a second session, then set PasswordAuthentication no and reload sshd", "Disable SSH and use the console", "Change the SSH port instead"], a: 1, why: "Prove the new path works while the old one is still open — then close the old one. One terminal too few is how people lock themselves out." }
      ]
    },
    {
      id: "file-transfer",
      title: "Moving files: scp, rsync, sftp",
      min: 9,
      sum: "Ship code, pull logs and sync trees between machines — with dry runs before anything destructive.",
      blocks: [
        { t: "p", x: "You will move files between machines constantly: deploy code, pull logs, ship a database dump. Each tool has a sweet spot — know which one to reach for." },
        { t: "h", x: "Pick the right tool" },
        { t: "ul", x: [
          "**scp** — one file or one small directory, right now. Dead simple, no resume.",
          "**rsync** — everything bigger: whole trees, only transfers changes, resumable, can mirror deletions.",
          "**sftp** — interactive browsing and transfers when you want to walk the tree first."
        ] },
        { t: "code", lang: "bash", x: "scp report.pdf deploy@web:/srv/reports/       # one file up\nscp deploy@web:/var/log/nginx/access.log ./   # one file down\nscp -r site/ deploy@web:/var/www/              # small directory\n\nrsync -avz --progress site/ deploy@web:/var/www/  # fast sync of a tree\nrsync -avn site/ deploy@web:/var/www/             # dry run: what WOULD change?\nrsync -avz --delete site/ deploy@web:/var/www/    # mirror, deleting extras\nrsync -avz deploy@web:/var/log/ ./logs/           # pull logs down" },
        { t: "p", x: "The **trailing slash matters**: `site/` copies the *contents* of site; `site` without the slash copies the directory itself into the destination." },
        { t: "h", x: "Sanity rules" },
        { t: "ul", x: [
          "Dry-run (`-n`) whenever `--delete` is on the table — see the plan before it executes.",
          "`-P` gives per-file progress and lets interrupted transfers resume.",
          "Exclude the noise on code deploys: `--exclude '.git' --exclude 'node_modules'`.",
          "On slow or flaky links, rsync beats scp every time: it continues where it stopped."
        ] },
        { t: "tip", x: "`rsync -a` preserves permissions, timestamps and symlinks. Add hardlinks, ACLs and attributes (`-aHAX`) when you are building serious backups." },
        { t: "warn", x: "`rsync --delete` makes the destination **exactly** match the source — deletions included. One typo in the source path can therefore wipe the destination. Dry-run it. Then dry-run it again." }
      ],
      quiz: [
        { q: "Which tool resumes interrupted transfers and only sends changed parts?", opts: ["`scp`", "`rsync`", "`sftp`", "`ftp`"], a: 1, why: "rsync compares both ends and transfers only the differences — ideal for large trees and unstable connections." },
        { q: "What is the difference between `rsync -a site/ dest/` and `rsync -a site dest/`?", opts: ["No difference", "The trailing slash copies the contents of site; without it, the whole site directory is placed inside dest", "The trailing slash makes it recursive", "Without the slash it only copies files, not subdirectories"], a: 1, why: "With `site/`, dest receives site's contents directly. Without it, you get dest/site/… — the classic rsync gotcha." }
      ]
    }
  ]
});
