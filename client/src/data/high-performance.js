/* High Performance topic: Linux performance tuning — detailed step-by-step guide */
export const HIGH_PERFORMANCE = {
  slug: "high-performance",
  crumb: "High Performance",
  kicker: "Performance topic",
  icon: "⚡",
  title: "High Performance Linux",
  sum: "Diagnose and eliminate Linux server bottlenecks: master performance measurement tools, tune kernel networking parameters, configure multi-layer caching, and validate improvements under real load.",
  meta: ["📚 4 sections", "⏱ 35 min step-by-step", "🔌 sysctl / kernel / cache"],
  heroTerm: [
    { prompt: "admin", cmd: "htop --sort-key PERCENT_CPU" },
    { prompt: "admin", cmd: "iostat -x 1 5" },
    { ok: "✓ System analyzed — bottleneck identified and tuning applied" }
  ],
  progressPrefix: "high-performance",
  lessons: [
    {
      id: "performance-basics",
      title: "Architecture: The Four Performance Pillars",
      min: 8,
      sum: "Understand how CPU, memory, disk I/O, and network interact as the four primary bottleneck categories on a Linux server.",
      blocks: [
        { t: "p", x: "Server performance degradation always traces back to one of four physical resources: **CPU** (processing power), **Memory** (RAM and swap), **Disk I/O** (read/write throughput and latency), or **Network** (bandwidth, latency, packet loss). Identify the actual bottleneck before applying any tuning — guessing wastes time and can make performance worse." },
        {
          t: "img",
          src: "/diagrams/keepalived.svg",
          caption: "Performance Bottleneck Analysis: CPU-bound servers show high %usr/%sys in top. Memory-bound servers show heavy swap activity. I/O-bound servers show high %iowait in iostat and queue depth > 1. Network-bound servers show interface saturation or packet drops in netstat/ss statistics."
        },
        { t: "h", x: "Performance Measurement Principles" },
        {
          t: "ul",
          x: [
            "**Measure First, Tune Second**: Never apply kernel tuning without establishing a baseline. Without before/after measurements, you cannot know if a change helped or hurt.",
            "**Load Average vs CPU Usage**: Load average (shown in `uptime` and `top`) counts tasks waiting for CPU AND disk I/O. A load of 2.0 on a 4-core system means only 50% CPU — it might be disk-bound, not CPU-bound.",
            "**The USE Method**: For every resource, check Utilization (how busy), Saturation (how much work is queued), and Errors (are failures occurring). This systematic approach locates bottlenecks in minutes.",
            "**Benchmarking vs Production**: Always test under realistic load, not just idle. A server that responds in 5ms under no load but 2,000ms under 100 concurrent users has a concurrency problem, not a raw speed problem."
          ]
        },
        { t: "tip", x: "Install the `sysstat` package (`sudo apt install sysstat`) — it provides `iostat`, `mpstat`, `sar`, and `pidstat`, which are the industry-standard tools for detailed performance telemetry on Linux production servers." }
      ]
    },
    {
      id: "monitoring-tools",
      title: "Step 1: Install and Use Performance Monitoring Tools",
      min: 10,
      sum: "Use htop, iostat, vmstat, ss, and sar to identify CPU, memory, disk, and network bottlenecks in real time.",
      blocks: [
        { t: "p", x: "Linux ships with a rich set of performance monitoring tools. Understanding how to read their output in combination is the skill that separates an effective Linux administrator from someone who just reboots and hopes for the best." },
        { t: "h", x: "Install Monitoring Tools" },
        {
          t: "code",
          lang: "bash",
          title: "Install all performance tools",
          x: "sudo apt update && sudo apt install -y \\\n  htop         \\ # Interactive process viewer and system monitor\n  sysstat      \\ # iostat, mpstat, sar, pidstat\n  dstat        \\ # Combined real-time stats (CPU+disk+net+mem)\n  iotop        \\ # Per-process disk I/O usage\n  nethogs      \\ # Per-process network bandwidth usage\n  nload        \\ # Network interface bandwidth meter\n  perf-tools-unstable  # Linux perf subsystem tools"
        },
        { t: "h", x: "CPU and Memory Analysis" },
        {
          t: "code",
          lang: "bash",
          title: "Read CPU and memory metrics",
          x: "# Show top CPU-consuming processes in batch mode (non-interactive)\ntop -b -n 1 | head -20\n\n# Interactive process viewer with colors and per-core CPU bars\nhtop\n\n# Memory usage with free/used/cache breakdown\nfree -h\n# Output example:\n# Mem: total=15Gi  used=3.2Gi  free=9.1Gi  shared=140Mi  buff/cache=2.7Gi  available=11Gi\n# 'available' is what processes can actually use (includes reclaimable cache)\n\n# Virtual memory statistics — 1-second intervals, 5 samples\nvmstat 1 5\n# Key columns: r=run queue, b=blocked, si/so=swap in/out, wa=I/O wait"
        },
        { t: "h", x: "Disk I/O Analysis" },
        {
          t: "code",
          lang: "bash",
          title: "Identify disk I/O bottlenecks",
          x: "# Extended disk I/O statistics — 1-second refresh\niostat -x 1 5\n# Key columns:\n# %util: % of time the device is busy (>80% = saturation)\n# await: average milliseconds per request (>20ms = problematic)\n# r/s w/s: reads/writes per second\n\n# Watch which processes are reading/writing most\nsudo iotop -o\n# -o: only show processes that are actively doing I/O\n\n# Check disk space usage with inode count\ndf -hT\ndf -i  # inodes (running out of inodes is another form of disk bottleneck)"
        },
        { t: "h", x: "Network Performance Analysis" },
        {
          t: "code",
          lang: "bash",
          title: "Inspect network connections and bandwidth",
          x: "# Show all listening services with PID and port\nss -tlnp\n\n# Count connections per state (TIME_WAIT accumulation = TCP tuning needed)\nss -s\n# Output: Total: 312, TCP: 286 (estab 241, closed 34, orphaned 11, timewait 45)\n\n# Watch per-interface bandwidth in real time\nnload eth0\n\n# Check for packet errors and drops on network interfaces\nip -s link show eth0\n# Look for RX errors/dropped/overrun > 0"
        },
        { t: "tip", x: "The `dstat` command is the most useful single tool for quick performance checks: `dstat -cdngy 1` shows CPU, disk, network, paging, and system stats in one compact line per second." }
      ]
    },
    {
      id: "kernel-tuning",
      title: "Step 2: Kernel and Network Performance Tuning",
      min: 9,
      sum: "Apply sysctl kernel parameters to increase TCP connection capacity, reduce TIME_WAIT buildup, and optimize buffer sizes for high-traffic workloads.",
      blocks: [
        { t: "p", x: "The Linux kernel has hundreds of tunable parameters accessible via `sysctl`. The networking parameters are particularly impactful for servers handling thousands of simultaneous connections." },
        { t: "h", x: "Critical Network Sysctl Parameters" },
        {
          t: "code",
          lang: "bash",
          title: "Apply high-performance network tuning",
          x: "# Apply settings temporarily for testing:\nsudo sysctl -w net.core.somaxconn=65535\nsudo sysctl -w net.core.netdev_max_backlog=65535\nsudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535\nsudo sysctl -w net.ipv4.tcp_tw_reuse=1\nsudo sysctl -w net.ipv4.ip_local_port_range='1024 65535'\nsudo sysctl -w net.core.rmem_max=16777216\nsudo sysctl -w net.core.wmem_max=16777216\n\n# Verify a setting took effect\nsysctl net.core.somaxconn"
        },
        {
          t: "code",
          lang: "bash",
          title: "/etc/sysctl.d/99-performance.conf — Persistent settings",
          x: "# Create a sysctl config file that persists across reboots\nsudo tee /etc/sysctl.d/99-performance.conf << 'EOF'\n# Increase listen backlog for high-connection-rate servers\nnet.core.somaxconn = 65535\nnet.core.netdev_max_backlog = 65535\nnet.ipv4.tcp_max_syn_backlog = 65535\n\n# Reuse TIME_WAIT sockets for new connections (safe for servers)\nnet.ipv4.tcp_tw_reuse = 1\n\n# Increase outbound port range for servers that make many outgoing connections\nnet.ipv4.ip_local_port_range = 1024 65535\n\n# Larger TCP socket receive/send buffers (improves throughput on fast LAN)\nnet.core.rmem_max = 16777216\nnet.core.wmem_max = 16777216\nnet.ipv4.tcp_rmem = 4096 87380 16777216\nnet.ipv4.tcp_wmem = 4096 65536 16777216\n\n# Reduce swappiness — keep data in RAM longer (0=never swap, 10=low swap)\nvm.swappiness = 10\n\n# Extend disk write buffer — reduces write latency spikes\nvm.dirty_ratio = 15\nvm.dirty_background_ratio = 5\nEOF\n\n# Apply all settings immediately\nsudo sysctl -p /etc/sysctl.d/99-performance.conf"
        },
        { t: "h", x: "File Descriptor Limit Tuning" },
        {
          t: "code",
          lang: "bash",
          title: "Increase system-wide open file descriptor limits",
          x: "# Check current system-wide limit\ncat /proc/sys/fs/file-max\n\n# Increase to support 1 million open files\necho 'fs.file-max = 1000000' | sudo tee -a /etc/sysctl.d/99-performance.conf\nsudo sysctl -p /etc/sysctl.d/99-performance.conf\n\n# Also increase per-process limit in /etc/security/limits.conf\nsudo tee -a /etc/security/limits.conf << 'EOF'\n* soft nofile 65535\n* hard nofile 65535\nroot soft nofile 65535\nroot hard nofile 65535\nEOF\n\n# Verify the limit applies to your session after re-login\nulimit -n"
        },
        { t: "warn", x: "Not all sysctl parameters that increase performance on one system type are beneficial for others. `net.ipv4.tcp_tw_reuse = 1` improves performance for servers making many outgoing connections (like load balancers), but can cause issues for servers that primarily receive connections. Always test changes under your actual workload." }
      ]
    },
    {
      id: "caching-optimization",
      title: "Step 3: Application Caching and Load Testing",
      min: 8,
      sum: "Configure Redis for application-level caching, enable NGINX gzip compression, and use Apache Bench to validate performance improvements.",
      blocks: [
        { t: "p", x: "Kernel tuning optimizes the OS layer. Application-level caching eliminates redundant computation and database queries, which is often 10–100× more impactful than kernel parameters alone." },
        { t: "h", x: "Install Redis for Application Caching" },
        {
          t: "code",
          lang: "bash",
          title: "Set up Redis in-memory cache",
          x: "# Install Redis server\nsudo apt install -y redis-server\n\n# Configure Redis for performance (edit /etc/redis/redis.conf)\nsudo sed -i 's/# maxmemory .*/maxmemory 512mb/' /etc/redis/redis.conf\nsudo sed -i 's/# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf\n\n# Enable and start Redis\nsudo systemctl enable --now redis-server\n\n# Test Redis is working\nredis-cli ping\n# Expected output: PONG\n\n# Monitor Redis hit rate (cache effectiveness)\nwatch -n 1 redis-cli info stats | grep -E '(keyspace_hits|keyspace_misses)'"
        },
        { t: "h", x: "Enable Nginx Gzip Compression" },
        {
          t: "code",
          lang: "bash",
          title: "Add gzip compression to /etc/nginx/nginx.conf",
          x: "# Add inside the http {} block in /etc/nginx/nginx.conf:\ngzip on;\ngzip_min_length 1024;\ngzip_comp_level 6;\ngzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;\ngzip_vary on;\ngzip_disable \"msie6\";\n\n# Test and reload Nginx\nsudo nginx -t && sudo systemctl reload nginx\n\n# Verify gzip is working:\ncurl -I -H 'Accept-Encoding: gzip' https://yourdomain.com/ | grep Content-Encoding\n# Expected: Content-Encoding: gzip"
        },
        { t: "h", x: "Load Testing with Apache Bench" },
        {
          t: "code",
          lang: "bash",
          title: "Benchmark your server before and after tuning",
          x: "# Install Apache Bench\nsudo apt install -y apache2-utils\n\n# Benchmark: 10,000 requests, 100 concurrent users\n# Always run BEFORE tuning to establish a baseline!\nab -n 10000 -c 100 -g before.tsv http://localhost/\n\n# Apply your kernel and caching changes, then re-run:\nab -n 10000 -c 100 -g after.tsv http://localhost/\n\n# Key metrics to compare:\n# Requests per second: higher is better\n# Time per request (ms): lower is better\n# Failed requests: must be 0"
        },
        { t: "tip", x: "A typical well-tuned Nginx + Redis setup can serve 50,000–100,000 requests per second for cached responses on a 4-core server. For database-backed pages, aim for >1,000 req/sec, which requires connection pooling (PgBouncer for PostgreSQL) and query optimization in addition to caching." }
      ]
    }
  ]
};
