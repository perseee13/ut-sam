/* LXD topic: Linux system containers — detailed step-by-step guide */
export const LXD = {
  slug: "lxd",
  crumb: "LXD Containers",
  kicker: "Containers topic",
  icon: "🐧",
  title: "LXD System Containers",
  sum: "Run full Linux system containers with LXD: persistent OS instances with their own init, networking, and users. Learn initialization, profiles, snapshots, live migration, and cluster management.",
  meta: ["📚 4 sections", "⏱ 32 min step-by-step", "🔌 LXD socket / unix"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo lxd init --auto" },
    { prompt: "admin", cmd: "lxc launch ubuntu:24.04 web-server" },
    { ok: "✓ LXD container online — full Ubuntu 24.04 running in 3 seconds" }
  ],
  progressPrefix: "lxd",
  lessons: [
    {
      id: "lxd-basics",
      title: "Architecture: LXD vs Docker — System vs App Containers",
      min: 8,
      sum: "Understand why LXD system containers provide a full Linux OS experience versus Docker's single-process application model.",
      blocks: [
        { t: "p", x: "**LXD** (pronounced 'LexD') is a next-generation system container manager built on LXC (Linux Containers). While Docker runs a single application process per container, LXD runs a **complete Linux operating system** — with its own systemd init, SSH daemon, multiple services, package manager, and persistent state." },
        {
          t: "img",
          src: "/diagrams/lxd.svg",
          caption: "LXD System Container Architecture: LXD containers share the host Linux kernel via namespaces and cgroups but contain a full OS userland (systemd, apt, network stack). Each container appears and behaves exactly like a separate physical server — without the overhead of hardware virtualization. Multiple containers run simultaneously on one physical host."
        },
        { t: "h", x: "LXD vs Docker: Choosing the Right Tool" },
        {
          t: "ul",
          x: [
            "**LXD Use Cases**: Running a complete Ubuntu server for a tenant, hosting multiple independent services (Nginx + MySQL + Postfix) inside one container, creating development environments that mirror production servers exactly, and cheap rapid VM replacement.",
            "**Docker Use Cases**: Packaging and shipping individual microservices, CI/CD pipeline build environments, running a single stateless application process, and container orchestration with Kubernetes.",
            "**Key Difference — PID 1**: In Docker, your application binary is PID 1. In LXD, systemd is PID 1, and your services run as systemd units — exactly as on a bare-metal server.",
            "**Key Difference — Persistence**: Docker containers are ephemeral by design. LXD containers are fully persistent with their own filesystem, users, and systemd journals — more like a long-lived virtual machine."
          ]
        },
        { t: "tip", x: "LXD is ideal for **homelabs and education environments**: you can run 10 independent Ubuntu servers on one physical machine, each with its own IP, users, and services, consuming only a few hundred MB of RAM per container." },
        { t: "warn", x: "Like Docker, LXD containers share the host kernel. A kernel-level exploit can break container isolation. For multi-tenant environments with untrusted users, use full VMs (KVM/QEMU) instead." }
      ]
    },
    {
      id: "lxd-install",
      title: "Step 1: Install LXD via Snap and Initialize",
      min: 8,
      sum: "Install the LXD snap package, run the interactive initialization wizard to configure storage pools and networking, then launch your first container.",
      blocks: [
        { t: "p", x: "LXD is best installed via **snap** on Ubuntu, which provides the latest stable version with automatic updates. The `lxd init` wizard guides you through the initial setup." },
        { t: "h", x: "Install LXD via Snap" },
        {
          t: "code",
          lang: "bash",
          title: "Install and configure user access",
          x: "# Install the latest stable LXD snap\nsudo snap install lxd\n\n# Add your user to the 'lxd' group for passwordless access\n# (Log out and back in, or run 'newgrp lxd' to apply immediately)\nsudo usermod -aG lxd $USER\nnewgrp lxd\n\n# Verify the installation\nlxd --version\nlxc --version"
        },
        { t: "h", x: "Initialize LXD with Auto-Configuration" },
        {
          t: "code",
          lang: "bash",
          title: "Quick automatic initialization (good for single-node lab)",
          x: "# Auto-init: creates a 'default' ZFS or directory storage pool\n# and a bridge network (lxdbr0) with NAT and DHCP\nsudo lxd init --auto\n\n# OR run the interactive wizard for custom settings:\nsudo lxd init\n# Interactive prompts:\n# Would you like to use LXD clustering? (yes/no) [default=no]: no\n# Do you want to configure a new storage pool? yes\n# Name of the new storage pool [default=default]: default\n# Name of the storage backend: dir (or zfs/btrfs for better snapshots)\n# Would you like to connect to a MAAS server? no\n# Would you like to configure LXD to use an existing bridge? no\n# What IPv4 address should LXD listen on? [default=auto]: auto\n# Would you like LXD to be available over the network? no"
        },
        { t: "h", x: "Launch Your First Container" },
        {
          t: "code",
          lang: "bash",
          title: "Pull Ubuntu 24.04 and launch a container",
          x: "# Launch an Ubuntu 24.04 LTS container named 'web-server'\n# LXD automatically downloads the image from the Ubuntu image server\nlxc launch ubuntu:24.04 web-server\n\n# List running containers\nlxc list\n# Output:\n# +------------+---------+---------------------+-------+-----------+-----------+\n# | NAME       | STATE   | IPV4                | IPV6  | TYPE      | SNAPSHOTS |\n# +------------+---------+---------------------+-------+-----------+-----------+\n# | web-server | RUNNING | 10.50.0.100 (eth0)  |       | CONTAINER | 0         |\n\n# Open a shell inside the container (as root)\nlxc exec web-server -- bash\n\n# Inside the container — install Nginx\napt update && apt install -y nginx\nsystemctl enable --now nginx\nexit"
        },
        { t: "tip", x: "LXD containers get their own IP address from the `lxdbr0` bridge (typically in the `10.x.x.x` range). You can use `lxc exec <name> -- ip addr show eth0` to find the container's IP, then access it directly from the host: `curl http://10.50.0.100/`." }
      ]
    },
    {
      id: "lxd-profiles",
      title: "Step 2: Profiles, Resource Limits, and Port Forwarding",
      min: 8,
      sum: "Create reusable profiles to define CPU/memory limits, configure proxy devices to expose container ports on the host, and apply multiple profiles per container.",
      blocks: [
        { t: "p", x: "**LXD Profiles** are reusable configuration templates applied to containers at launch or runtime. A container can have multiple profiles — the settings are merged in order." },
        { t: "h", x: "Create a 'Web Server' Profile with Resource Limits" },
        {
          t: "code",
          lang: "bash",
          title: "Create and configure a profile",
          x: "# Create a new empty profile\nlxc profile create web-server\n\n# Set CPU and memory limits\nlxc profile set web-server limits.cpu 2\nlxc profile set web-server limits.memory 1GB\nlxc profile set web-server limits.memory.swap false\n\n# View the profile settings\nlxc profile show web-server\n\n# Launch a container using this profile\nlxc launch ubuntu:24.04 nginx01 --profile web-server"
        },
        { t: "h", x: "Expose Container Port to the Host (Proxy Device)" },
        {
          t: "code",
          lang: "bash",
          title: "Forward host port 8080 to container port 80",
          x: "# Add a proxy device: forward host 0.0.0.0:8080 → container 127.0.0.1:80\n# This makes the container's Nginx accessible at host:8080\nlxc config device add web-server http-proxy proxy \\\n  listen=tcp:0.0.0.0:8080 \\\n  connect=tcp:127.0.0.1:80\n\n# Add HTTPS proxy\nlxc config device add web-server https-proxy proxy \\\n  listen=tcp:0.0.0.0:8443 \\\n  connect=tcp:127.0.0.1:443\n\n# Test access from host or LAN\ncurl -I http://localhost:8080"
        },
        { t: "h", x: "Mount a Host Directory into a Container" },
        {
          t: "code",
          lang: "bash",
          title: "Share host /srv/webdata with container at /var/www/html",
          x: "# Create the host directory\nsudo mkdir -p /srv/webdata\necho '<h1>Hello from host!</h1>' | sudo tee /srv/webdata/index.html\n\n# Add a disk device to the container\nlxc config device add web-server webroot disk \\\n  source=/srv/webdata \\\n  path=/var/www/html\n\n# Changes to /srv/webdata on host are immediately visible inside the container"
        },
        { t: "tip", x: "Profiles are extremely powerful for fleet management. Create profiles for 'database-server' (more RAM, NVMe disk), 'build-agent' (more CPUs), and 'minimal' (100MB RAM limit). Launch containers with appropriate profiles and they inherit all settings automatically." }
      ]
    },
    {
      id: "lxd-snapshots",
      title: "Step 3: Snapshots, Migration, and Cleanup",
      min: 8,
      sum: "Take instant snapshots before risky changes, restore from snapshots, copy containers between hosts, and manage storage pools.",
      blocks: [
        { t: "p", x: "One of LXD's most powerful features is **instant snapshots**. On ZFS or BTRFS storage backends, a snapshot consumes zero additional disk space at creation and captures the entire container state in milliseconds." },
        { t: "h", x: "Create and Restore Container Snapshots" },
        {
          t: "code",
          lang: "bash",
          title: "Snapshot workflow",
          x: "# Take a snapshot named 'before-upgrade'\nlxc snapshot web-server before-upgrade\n\n# List all snapshots for a container\nlxc list web-server\n# Or more detail:\nlxc info web-server\n\n# Simulate a problem (e.g., delete nginx config)\nlxc exec web-server -- bash -c 'rm /etc/nginx/nginx.conf'\n\n# Restore the container to the pre-upgrade snapshot\nlxc restore web-server before-upgrade\n\n# Verify nginx.conf is restored\nlxc exec web-server -- ls /etc/nginx/nginx.conf\n\n# Delete a snapshot when no longer needed\nlxc delete web-server/before-upgrade"
        },
        { t: "h", x: "Copy and Move Containers" },
        {
          t: "code",
          lang: "bash",
          title: "Duplicate containers and export for backup",
          x: "# Duplicate a running container (creates a stopped clone)\nlxc copy web-server staging-server\n\n# Start the cloned container\nlxc start staging-server\n\n# Export a container as a tarball for off-host backup\nlxc export web-server /tmp/web-server-backup.tar.gz\n\n# Import it back (on any LXD host)\nlxc import /tmp/web-server-backup.tar.gz web-server-restored"
        },
        { t: "h", x: "Container Lifecycle and Cleanup" },
        {
          t: "code",
          lang: "bash",
          title: "Stop, delete, and prune containers",
          x: "# Stop a running container\nlxc stop web-server\n\n# Start it again\nlxc start web-server\n\n# Restart (stop + start)\nlxc restart web-server\n\n# Delete a STOPPED container permanently\nlxc delete staging-server\n\n# Force-delete a running container (use with caution)\nlxc delete web-server --force\n\n# Show storage pool disk usage\nlxc storage list\nlxc storage info default"
        },
        { t: "tip", x: "Use `lxc publish web-server --alias my-web-template` to convert a configured container into a reusable custom image. You can then `lxc launch my-web-template new-server` to instantly deploy pre-configured clones, similar to AWS AMIs or VM templates." },
        { t: "warn", x: "`lxc delete` is permanent and irreversible. Always take a snapshot before deleting a container that has data. Use `lxc export` to save a compressed backup tarball before any destructive operation." }
      ]
    }
  ]
};
