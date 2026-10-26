/* Open Source topic: philosophy, licensing, and contributing — detailed step-by-step guide */
export const OPEN_SOURCE = {
  slug: "open-source",
  crumb: "Open Source",
  kicker: "Open Source topic",
  icon: "🌐",
  title: "Open Source Linux Ecosystem",
  sum: "Explore the open source philosophy that powers the entire internet: understand free software licenses, navigate the Linux package ecosystem, contribute patches to projects you use, and build with open tools.",
  meta: ["📚 4 sections", "⏱ 30 min step-by-step", "🔌 APT / GitHub / GPL"],
  heroTerm: [
    { prompt: "laptop", cmd: "git clone https://github.com/torvalds/linux.git --depth=1" },
    { prompt: "laptop", cmd: "wc -l linux/init/main.c" },
    { ok: "✓ Linux kernel source downloaded — you hold millions of lines of freedom" }
  ],
  progressPrefix: "open-source",
  lessons: [
    {
      id: "open-source-philosophy",
      title: "Philosophy: The Four Freedoms of Free Software",
      min: 8,
      sum: "Understand what 'free' means in free software (freedom, not price), the history of the GNU/Linux movement, and why open source powers 96% of internet servers.",
      blocks: [
        { t: "p", x: "**Open source software** is code whose source is publicly available under a license that grants specific rights to users. Richard Stallman's **GNU Project** (1983) and Linus Torvalds' **Linux kernel** (1991) merged to create the most successful collaborative engineering project in human history. Today, Linux runs on 96% of the world's top web servers, all major cloud providers, every Android phone, and the International Space Station." },
        {
          t: "img",
          src: "/diagrams/mqtt.svg",
          caption: "The Open Source Ecosystem: Individual developers, universities, and corporations worldwide contribute to a shared commons. The Linux kernel has over 27 million lines of code contributed by 21,000+ developers from companies including Intel, Google, Red Hat, Samsung, and IBM. Anyone who improves the code benefits everyone — creating compounding value impossible with proprietary development."
        },
        { t: "h", x: "The Four Essential Software Freedoms (GNU Definition)" },
        {
          t: "ul",
          x: [
            "**Freedom 0 — Run**: The freedom to run the program for any purpose. A Linux server hosting a website, powering a rocket, or running in a toaster — no permission required, no license check.",
            "**Freedom 1 — Study**: The freedom to study how the program works and change it to do your computing as you wish. Access to source code is a prerequisite. You can read `cat /proc/version` and trace exactly how your kernel decides to schedule your processes.",
            "**Freedom 2 — Redistribute**: The freedom to share copies to help others. You can take Ubuntu, copy it onto 1,000 USB drives, and give it away at a school without paying Canonical a single peso.",
            "**Freedom 3 — Improve**: The freedom to distribute modified versions. This is how thousands of Linux distributions exist — Debian, Ubuntu, Arch, Alpine, Kali — each tailored for different purposes, all built on the same shared kernel."
          ]
        },
        { t: "h", x: "Open Source vs Proprietary: Real-World Impact" },
        {
          t: "ul",
          x: [
            "**Security Auditability**: Any security researcher can inspect OpenSSL, OpenSSH, or the Linux kernel for vulnerabilities. The Heartbleed bug in OpenSSL was found and patched within 24 hours of public disclosure because anyone could read the code.",
            "**No Vendor Lock-In**: A company using MySQL (open source) can migrate to PostgreSQL or MariaDB without renegotiating license terms. A company using Oracle Database may pay $50,000/CPU/year and cannot migrate without Oracle's permission.",
            "**Innovation Compounding**: Kubernetes (Google), TensorFlow (Google), PyTorch (Meta), React (Meta), and VS Code (Microsoft) are all open source. These companies open-source their internal tools knowing the community will improve them faster than their internal teams alone could."
          ]
        },
        { t: "tip", x: "\"Free software\" means freedom, not free of charge. RedHat Enterprise Linux is open source and costs $1,400/year. The freedom is that you can take the source code, remove the RedHat branding, and create Rocky Linux or AlmaLinux — which is exactly what happened!" }
      ]
    },
    {
      id: "linux-package-ecosystem",
      title: "Step 1: Navigate the Linux Package Ecosystem",
      min: 8,
      sum: "Master APT package management, understand repositories, PPAs, and snap packages, and learn how to find and evaluate open source software safely.",
      blocks: [
        { t: "p", x: "Linux distributions include thousands of pre-compiled, security-reviewed, dependency-managed open source packages. APT (Advanced Package Tool) on Debian/Ubuntu is the standard way to install, update, and remove software." },
        { t: "h", x: "APT Package Management Fundamentals" },
        {
          t: "code",
          lang: "bash",
          title: "Essential APT commands",
          x: "# Update the local package index from all repositories\nsudo apt update\n\n# Upgrade all installed packages to latest versions\nsudo apt upgrade -y\n\n# Install a package (e.g., htop)\nsudo apt install -y htop\n\n# Search for packages matching a keyword\napt search 'web server'\n\n# Show detailed information about a package before installing\napt show nginx\n\n# List all installed packages\ndpkg -l | head -30\n\n# Remove a package but keep config files\nsudo apt remove nginx\n\n# Remove package AND all its config files (purge)\nsudo apt purge nginx\n\n# Remove packages no longer needed by any other package\nsudo apt autoremove"
        },
        { t: "h", x: "Understanding Repository Sources" },
        {
          t: "code",
          lang: "bash",
          title: "View and add package repositories",
          x: "# Show all active repository sources\ncat /etc/apt/sources.list\n\n# Ubuntu repository components:\n# main     - officially supported open source software\n# universe - community-maintained open source (not security-patched by Canonical)\n# restricted - proprietary drivers (NVIDIA, etc.)\n# multiverse - software with licensing restrictions\n\n# Enable 'universe' repository\nsudo add-apt-repository universe\n\n# Add a Personal Package Archive (PPA) — third-party repo for latest versions\n# Example: Nginx mainline (latest, not Ubuntu LTS version)\nsudo add-apt-repository ppa:nginx/development\nsudo apt update && sudo apt install nginx"
        },
        { t: "h", x: "Install Software via Snap and Flatpak" },
        {
          t: "code",
          lang: "bash",
          title: "Snap: containerized applications from Canonical",
          x: "# Snap packages are self-contained (include all dependencies)\n# Great for: LXD, Nextcloud, certbot, code editors\n\n# Install a snap\nsudo snap install lxd\n\n# List installed snaps\nsnap list\n\n# Update all snaps\nsudo snap refresh\n\n# View info about a snap package\nsnap info lxd"
        },
        { t: "tip", x: "Prefer **APT packages** from the official Ubuntu repositories for server daemons — they receive security patches through `apt upgrade` and integrate cleanly with systemd. Use **snap** for desktop apps and developer tools that update frequently (VS Code, LXD, kubectl). Avoid mixing installation methods for the same software (e.g., don't install both APT nginx AND snap nginx)." }
      ]
    },
    {
      id: "open-source-licenses",
      title: "Step 2: Understand Open Source Licenses",
      min: 6,
      sum: "Learn the practical differences between GPL, MIT, Apache 2.0, and AGPL licenses, and how to choose the right license for your own projects.",
      blocks: [
        { t: "p", x: "Every open source project has a license that defines what you can legally do with the code. Using software without understanding its license — especially in a commercial product — can create serious legal and financial risk." },
        { t: "h", x: "The Three License Categories" },
        {
          t: "ul",
          x: [
            "**Permissive Licenses (MIT, BSD, Apache 2.0)**: Allow almost anything — use in commercial products, modify without sharing your changes, redistribute under different terms. REQUIREMENT: keep the original copyright notice. These licenses power most JavaScript, Python, and Go open source.",
            "**Weak Copyleft (LGPL, MPL)**: Allow linking the library into proprietary software, but modifications TO the library itself must be shared. Used by GNU C Library (glibc) — your proprietary app can use it without being GPL-infected.",
            "**Strong Copyleft (GPLv2, GPLv3, AGPL)**: If you distribute software that uses GPL code, your entire application must also be GPL. The Linux kernel is GPLv2. AGPL extends this to network services: running AGPL software as a web service requires you to release source."
          ]
        },
        { t: "h", x: "License Comparison Table" },
        {
          t: "code",
          lang: "bash",
          title: "Practical license guidance",
          x: "# License      Use in proprietary product?   Must share modifications?   Patent grant?\n# ----------------------------------------------------------------------------------\n# MIT           YES                           NO                         NO\n# Apache 2.0    YES                           NO                         YES  <- preferred\n# BSD-2-Clause  YES                           NO                         NO\n# LGPLv3        YES (dynamic linking)         YES (LGPL parts)           YES\n# GPLv2         NO (must GPL your code too)   YES                        NO\n# GPLv3         NO (must GPL your code too)   YES                        YES\n# AGPLv3        NO (even as network service)  YES                        YES\n\n# Notable examples:\n# Linux kernel  = GPLv2\n# Git           = GPLv2\n# nginx         = BSD-2-Clause  (can use in commercial products)\n# PostgreSQL    = PostgreSQL License (permissive)\n# MariaDB       = GPLv2 (but MariaDB Corp offers proprietary license)\n# Elasticsearch = SSPL (source-available, not OSI-certified open source)"
        },
        { t: "warn", x: "The **SSPL (Server Side Public License)** used by MongoDB and Elasticsearch is NOT an approved open source license by the OSI. It prohibits offering the software as a hosted service. This is why AWS forked Elasticsearch into **OpenSearch** under Apache 2.0. Always check whether a license is OSI-approved before calling software 'open source'." }
      ]
    },
    {
      id: "contributing-to-open-source",
      title: "Step 3: Contribute to Open Source Projects",
      min: 8,
      sum: "Learn the complete open source contribution workflow: fork a repository, create a feature branch, write a patch, submit a pull request, and respond to review feedback.",
      blocks: [
        { t: "p", x: "Open source survives and thrives through contributions. You do not need to be a kernel developer — documentation fixes, bug reports with reproducible steps, test cases, and translation improvements are all valuable contributions that maintainers genuinely appreciate." },
        { t: "h", x: "Set Up Git for Contributing" },
        {
          t: "code",
          lang: "bash",
          title: "Configure git identity and SSH key",
          x: "# Set your global git identity\ngit config --global user.name 'Your Full Name'\ngit config --global user.email 'you@example.com'\ngit config --global core.editor 'nano'\n\n# Generate an SSH key for GitHub authentication\nssh-keygen -t ed25519 -C 'you@example.com'\n# Press Enter 3 times to accept defaults\n\n# Copy public key to clipboard\ncat ~/.ssh/id_ed25519.pub\n# Paste this into GitHub: Settings → SSH and GPG Keys → New SSH key\n\n# Test the connection\nssh -T git@github.com\n# Expected: Hi username! You've successfully authenticated."
        },
        { t: "h", x: "The Complete Contribution Workflow" },
        {
          t: "code",
          lang: "bash",
          title: "Fork → Branch → Patch → Pull Request",
          x: "# === Step 1: Fork the repository on GitHub (click the Fork button) ===\n\n# === Step 2: Clone YOUR fork (not the original) ===\ngit clone git@github.com:YOUR_USERNAME/project.git\ncd project\n\n# === Step 3: Add the upstream remote so you can sync changes ===\ngit remote add upstream git@github.com:ORIGINAL_OWNER/project.git\ngit remote -v\n# origin    git@github.com:YOUR_USERNAME/project.git (your fork)\n# upstream  git@github.com:ORIGINAL_OWNER/project.git (original)\n\n# === Step 4: Create a feature branch (NEVER work directly on main/master) ===\ngit checkout -b fix/correct-typo-in-readme\n\n# === Step 5: Make your changes ===\nnano README.md\n\n# === Step 6: Stage and commit with a descriptive message ===\ngit add README.md\ngit commit -m 'docs: fix typo in installation section'\n# Commit message format: type(scope): description\n# Types: feat, fix, docs, style, refactor, test, chore\n\n# === Step 7: Push your branch to your fork ===\ngit push origin fix/correct-typo-in-readme\n\n# === Step 8: Open a Pull Request on GitHub ===\n# GitHub shows a banner: 'Compare & pull request' — click it\n# Write a clear description:\n# - What problem does this fix?\n# - What did you change and why?\n# - How did you test it?"
        },
        { t: "h", x: "Keep Your Fork Synced with Upstream" },
        {
          t: "code",
          lang: "bash",
          title: "Stay current with the original project",
          x: "# Fetch latest changes from the original project\ngit fetch upstream\n\n# Merge upstream main into your local main branch\ngit checkout main\ngit merge upstream/main\n\n# Push updated main to your fork\ngit push origin main\n\n# If your feature branch is behind, rebase it onto current main\ngit checkout fix/your-feature\ngit rebase main"
        },
        { t: "tip", x: "Before submitting your first pull request, always read the project's `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and recent closed pull requests. Understanding the maintainer's preferences (commit style, test requirements, review process) dramatically increases the chance your contribution is merged on the first attempt." }
      ]
    }
  ]
};
