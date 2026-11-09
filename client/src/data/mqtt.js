/* MQTT topic: Mosquitto broker — detailed step-by-step guide */
export const MQTT = {
  slug: "mqtt",
  crumb: "MQTT Messaging",
  kicker: "IoT topic",
  icon: "📡",
  title: "MQTT Messaging with Mosquitto",
  sum: "Build a lightweight IoT messaging infrastructure with Eclipse Mosquitto. Configure topics, QoS levels, persistent sessions, authentication, and TLS encryption for production-grade publish/subscribe communication.",
  meta: ["📚 6 sections", "⏱ 45 min step-by-step", "🔌 port 1883 / 8883 TLS"],
  heroTerm: [
    { prompt: "admin", cmd: "sudo systemctl status mosquitto --no-pager" },
    { prompt: "device", cmd: "mosquitto_pub -h 192.168.1.10 -u pi -P password -t 'sensors/temp' -m '24.5'" },
    { ok: "✓ Mosquitto broker running — message delivered to all subscribers" }
  ],
  progressPrefix: "mqtt",
  lessons: [
    {
      id: "mqtt-basics",
      title: "Architecture: How MQTT Publish/Subscribe Works",
      min: 8,
      sum: "Understand the MQTT broker pattern, topic hierarchy, QoS levels, retained messages, and why MQTT outperforms HTTP for IoT devices.",
      blocks: [
        { t: "p", x: "**MQTT** (Message Queuing Telemetry Transport) is a binary publish/subscribe protocol designed for constrained IoT devices communicating over unreliable networks. A central **broker** receives messages from **publishers** and instantly distributes them to all **subscribers** registered on matching topic strings." },
        {
          t: "img",
          src: "/diagrams/mqtt.svg",
          caption: "MQTT Broker Architecture: Publishers (sensors, devices) send messages to topic paths on the Mosquitto broker. Multiple subscribers (dashboards, automation engines, logging services) receive only the messages matching their topic filter subscriptions. QoS level controls delivery guarantees."
        },
        { t: "h", x: "MQTT vs HTTP: Why MQTT Wins for IoT" },
        {
          t: "ul",
          x: [
            "**Header Overhead**: An MQTT packet header is as small as 2 bytes. A minimal HTTP request is 40–200 bytes. On a sensor sending 100 readings/minute, MQTT uses 95% less bandwidth.",
            "**Connection Model**: HTTP requires a new TCP connection per request. MQTT uses a single persistent TCP connection, reducing handshake overhead and battery drain on mobile devices.",
            "**Server Push**: HTTP polling requires clients to repeatedly ask 'any new data?'. MQTT brokers push messages instantly as they arrive — subscribers receive data in real time.",
            "**QoS Levels**: MQTT offers three delivery guarantees: QoS 0 (fire-and-forget), QoS 1 (at least once), and QoS 2 (exactly once). HTTP has none natively."
          ]
        },
        { t: "h", x: "MQTT Topic Hierarchy and Wildcards" },
        {
          t: "code",
          lang: "bash",
          title: "Topic naming conventions and wildcards",
          x: "# Topics are hierarchical, slash-separated strings (like file paths)\n# Example topic structure for a smart home:\nhome/livingroom/temperature\nhome/kitchen/light/status\nhome/garage/door\nfactory/line1/machine3/vibration\n\n# Wildcard '+' matches exactly ONE level:\n# Subscribing to 'home/+/temperature' receives:\n# home/livingroom/temperature  ✓\n# home/bedroom/temperature     ✓\n# home/livingroom/humidity     ✗ (not temperature)\n\n# Wildcard '#' matches ANY number of remaining levels:\n# Subscribing to 'home/#' receives ALL home topics:\n# home/livingroom/temperature  ✓\n# home/kitchen/light/status    ✓\n# home/garage/door             ✓"
        },
        { t: "tip", x: "Use **Retained Messages** (`-r` flag) for status topics. When a new subscriber connects, the broker immediately sends the last retained message — perfect for knowing the current state of a light switch or sensor without waiting for the next update." },
        { t: "warn", x: "The default Mosquitto configuration allows **anonymous connections** with no authentication. Never expose port 1883 to the internet without setting up password authentication first." }
      ]
    },
    {
      id: "mosquitto-setup",
      title: "Step 1: Install and Start Mosquitto Broker",
      min: 7,
      sum: "Install the official Mosquitto MQTT broker, start the service, open the firewall, and verify it accepts connections with the built-in client tools.",
      blocks: [
        { t: "p", x: "**Eclipse Mosquitto** is the most widely deployed open-source MQTT broker. It is lightweight (< 1 MB RAM for small deployments), battle-tested, and supports the complete MQTT 3.1.1 and 5.0 specifications." },
        { t: "h", x: "Install Mosquitto and Client Tools" },
        {
          t: "code",
          lang: "bash",
          title: "Install from the official Ubuntu repository",
          x: "# Update package lists and install broker + client CLI tools\nsudo apt update && sudo apt install -y mosquitto mosquitto-clients\n\n# Enable Mosquitto to start at boot\nsudo systemctl enable mosquitto\nsudo systemctl start mosquitto\n\n# Verify the broker is running and listening\nsudo systemctl status mosquitto --no-pager\nss -tlnp | grep 1883"
        },
        { t: "h", x: "Test Pub/Sub in Two Terminal Windows" },
        {
          t: "code",
          lang: "bash",
          title: "Terminal 1 — Start subscriber (runs indefinitely)",
          x: "# Subscribe to all messages in the 'test' subtree\n# -h: broker hostname\n# -t: topic filter (# wildcard matches all sub-topics)\n# -v: verbose — print topic + message together\nmosquitto_sub -h localhost -t 'test/#' -v"
        },
        {
          t: "code",
          lang: "bash",
          title: "Terminal 2 — Publish messages",
          x: "# Publish a simple string message\nmosquitto_pub -h localhost -t 'test/hello' -m 'Hello MQTT!'\n\n# Publish with QoS 1 (at-least-once delivery)\nmosquitto_pub -h localhost -t 'test/sensor' -m '25.4' -q 1\n\n# Publish a RETAINED message (broker stores last value)\nmosquitto_pub -h localhost -t 'test/status' -m 'ONLINE' -r\n\n# After publishing, connect a new subscriber and\n# it will immediately receive the retained 'ONLINE' message!"
        },
        { t: "h", x: "Open Firewall for Network Access" },
        {
          t: "code",
          lang: "bash",
          title: "Allow MQTT from your LAN subnet only",
          x: "# Allow MQTT (1883) from internal LAN only\nsudo ufw allow from 192.168.1.0/24 to any port 1883 proto tcp comment 'MQTT broker'\n\n# If you will later add TLS (port 8883)\nsudo ufw allow from 192.168.1.0/24 to any port 8883 proto tcp comment 'MQTT TLS'\n\nsudo ufw status numbered"
        },
        { t: "tip", x: "You can test MQTT from a remote client using: `mosquitto_sub -h 192.168.1.10 -t '#' -v` where `192.168.1.10` is your broker's IP. The `#` wildcard subscribes to all topics on the broker — useful for monitoring all traffic during development." }
      ]
    },
    {
      id: "mqtt-authentication",
      title: "Step 2: Add Password Authentication and ACL",
      min: 10,
      sum: "Create password files, configure Mosquitto to require authentication, and implement topic-level ACL rules so devices can only access their assigned topics.",
      blocks: [
        { t: "p", x: "In any production deployment, you must restrict which clients can connect and what topics they can publish or subscribe to. Mosquitto uses a flat password file (hashed with bcrypt via `mosquitto_passwd`) and a plain-text ACL file." },
        { t: "h", x: "Create User Accounts with mosquitto_passwd" },
        {
          t: "code",
          lang: "bash",
          title: "Create a password file and add users",
          x: "# Create /etc/mosquitto/passwd with the first user (-c creates the file)\nsudo mosquitto_passwd -c /etc/mosquitto/passwd sensor_node1\n# Enter and confirm password when prompted\n\n# Add more users without -c (would overwrite the file!)\nsudo mosquitto_passwd /etc/mosquitto/passwd dashboard_user\nsudo mosquitto_passwd /etc/mosquitto/passwd admin_monitor\n\n# View the hashed password file (never expose this file)\ncat /etc/mosquitto/passwd"
        },
        { t: "h", x: "Create an ACL File for Topic Permissions" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/mosquitto/acl.conf — Access Control Rules",
          x: "# /etc/mosquitto/acl.conf\n# Sensor node: can ONLY publish to its own sensor topics\nuser sensor_node1\ntopic write sensors/node1/#\n\n# Dashboard: read-only access to all sensor data\nuser dashboard_user\ntopic read sensors/#\ntopic read factory/#\n\n# Admin: full read/write access to everything\nuser admin_monitor\ntopic readwrite #"
        },
        { t: "h", x: "Update /etc/mosquitto/mosquitto.conf" },
        {
          t: "code",
          lang: "bash",
          title: "/etc/mosquitto/mosquitto.conf — Production Configuration",
          x: "# Disable anonymous logins\nallow_anonymous false\n\n# Path to the password file\npassword_file /etc/mosquitto/passwd\n\n# Path to the access control list file\nacl_file /etc/mosquitto/acl.conf\n\n# MQTT listener on standard port\nlistener 1883\nprotocol mqtt\n\n# Optional: Enable persistent message store\npersistence true\npersistence_location /var/lib/mosquitto/"
        },
        {
          t: "code",
          lang: "bash",
          title: "Apply and test authentication",
          x: "# Restart broker to load new config\nsudo systemctl restart mosquitto\n\n# Test with correct credentials — should work\nmosquitto_pub -h localhost -u sensor_node1 -P YourPassword -t 'sensors/node1/temp' -m '23.4'\n\n# Test without credentials — should be REJECTED\nmosquitto_pub -h localhost -t 'sensors/node1/temp' -m 'test'\n# Error: Connection error: Connection Refused: not authorised."
        },
        { t: "warn", x: "ACL rules are checked in order from top to bottom. The rules above grant access with `topic write/read` — any topic not explicitly listed is **denied by default** once the ACL file is loaded. Always test your ACL rules thoroughly before deploying to production devices." }
      ]
    },
    {
      id: "mqtt-tls",
      title: "Step 3: Enable TLS Encryption on Port 8883",
      min: 10,
      sum: "Generate a self-signed CA certificate, create server key and certificate, configure Mosquitto to use TLS on port 8883, and connect clients securely.",
      blocks: [
        { t: "p", x: "Plain MQTT on port 1883 transmits all data — including usernames and passwords — in **unencrypted plain text**. Anyone on the network path can read your sensor data and credentials. **MQTT over TLS** (port 8883, also called MQTTS) encrypts the entire connection." },
        { t: "h", x: "Generate a Self-Signed Certificate Authority" },
        {
          t: "code",
          lang: "bash",
          title: "Create CA, server key, and certificate",
          x: "# Create certificate directory\nsudo mkdir -p /etc/mosquitto/certs && cd /etc/mosquitto/certs\n\n# Step 1: Generate CA private key\nsudo openssl genrsa -out ca.key 4096\n\n# Step 2: Create self-signed CA certificate (valid 10 years)\nsudo openssl req -new -x509 -days 3650 -key ca.key -out ca.crt \\\n  -subj '/CN=Mosquitto CA/O=Home Lab/C=PH'\n\n# Step 3: Generate server private key\nsudo openssl genrsa -out server.key 2048\n\n# Step 4: Create server certificate signing request\nsudo openssl req -new -key server.key -out server.csr \\\n  -subj '/CN=192.168.1.10/O=MQTT Broker/C=PH'\n\n# Step 5: Sign server CSR with our CA\nsudo openssl x509 -req -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt\n\n# Set correct permissions\nsudo chown -R mosquitto:mosquitto /etc/mosquitto/certs\nsudo chmod 600 /etc/mosquitto/certs/*.key"
        },
        { t: "h", x: "Add TLS Listener to mosquitto.conf" },
        {
          t: "code",
          lang: "bash",
          title: "Append TLS listener block to mosquitto.conf",
          x: "# Add to /etc/mosquitto/mosquitto.conf:\n# (Keep existing port 1883 listener if you want both)\n\n# TLS/SSL Listener on standard MQTTS port\nlistener 8883\nprotocol mqtt\ncafile /etc/mosquitto/certs/ca.crt\ncertfile /etc/mosquitto/certs/server.crt\nkeyfile /etc/mosquitto/certs/server.key\n\n# Require clients to verify server certificate\ntls_version tlsv1.2"
        },
        {
          t: "code",
          lang: "bash",
          title: "Restart and test TLS connection",
          x: "sudo systemctl restart mosquitto\nss -tlnp | grep 8883\n\n# Test TLS connection from client\n# --cafile: path to CA cert to verify the server\nmosquitto_pub \\\n  -h 192.168.1.10 \\\n  -p 8883 \\\n  --cafile /etc/mosquitto/certs/ca.crt \\\n  -u sensor_node1 -P YourPassword \\\n  -t 'sensors/node1/temp' -m '24.1' -q 1\n\nmosquitto_sub \\\n  -h 192.168.1.10 \\\n  -p 8883 \\\n  --cafile /etc/mosquitto/certs/ca.crt \\\n  -u dashboard_user -P YourPassword \\\n  -t 'sensors/#' -v"
        },
        { t: "tip", x: "Copy the `ca.crt` file to all client devices. On IoT microcontrollers (ESP32, Arduino with WiFi), upload this CA certificate to the device's flash memory and use an MQTT TLS client library (e.g., `PubSubClient` for Arduino) configured to verify the server certificate." }
      ]
    },
    {
      id: "mqtt-sensors",
      title: "Step 4: Sensor Data",
      min: 6,
      sum: "Publish turbidity (NTU), TDS, and light (Lux) sensor readings to Mosquitto using structured JSON payloads and topic hierarchies.",
      blocks: [
        { t: "p", x: "Structure your IoT sensor data as JSON payloads on a clear topic hierarchy. Give each sensor its own topic level so dashboards can subscribe to specific measurements (e.g., `sensors/node1/turbidity`) or use wildcards to grab everything (`sensors/#`)." },
        { t: "h", x: "Recommended Topic Hierarchy" },
        { t: "code", lang: "bash", title: "Sensor topic structure", x: "# One topic per sensor reading\\nsensors/node1/turbidity\\nsensors/node1/tds\\nsensors/node1/light\\n\\n# Wildcard subscriptions\\n# All readings from node1\\nsensors/node1/\\#\\n\\n# All turbidity readings across all nodes\\nsensors/\\+/turbidity" },
        { t: "h", x: "Publish Sensor Readings" },
        { t: "code", lang: "bash", title: "Publish turbidity (NTU), TDS, and Lux readings", x: "# Turbidity — NTU (Nephelometric Turbidity Units)\\nmosquitto_pub -h 192.168.1.10 -u sensor_node1 -P YourPassword -t 'sensors/node1/turbidity' -m '{\\\"sensor\\\":\\\"turbidity\\\",\\\"value\\\":12.4,\\\"unit\\\":\\\"NTU\\\",\\\"ts\\\":\\\"2026-10-25T14:30:00Z\\\"}' -q 1\\n\\n# TDS — Total Dissolved Solids (ppm / mg/L)\\nmosquitto_pub -h 192.168.1.10 -u sensor_node1 -P YourPassword -t 'sensors/node1/tds' -m '{\\\"sensor\\\":\\\"tds\\\",\\\"value\\\":320,\\\"unit\\\":\\\"ppm\\\",\\\"ts\\\":\\\"2026-10-25T14:30:00Z\\\"}' -q 1\\n\\n# Light — Lux\\nmosquitto_pub -h 192.168.1.10 -u sensor_node1 -P YourPassword -t 'sensors/node1/light' -m '{\\\"sensor\\\":\\\"light\\\",\\\"value\\\":450,\\\"unit\\\":\\\"lux\\\",\\\"ts\\\":\\\"2026-10-25T14:30:00Z\\\"}' -q 1" },
        { t: "h", x: "Subscribe to All Sensor Data" },
        { t: "code", lang: "bash", title: "Subscribe with wildcard", x: "mosquitto_sub -h 192.168.1.10 -u dashboard_user -P YourPassword -t 'sensors/#' -v" },
        { t: "tip", x: "Use QoS 1 for sensor readings so no sample is lost if the connection briefly drops. Keep the JSON schema consistent (sensor, value, unit, ts) across NTU, TDS, and Lux so your dashboard can parse every message the same way." }
      ]
    },
    {
      id: "esp32-sensor-node",
      title: "Step 5: ESP32 Sensor Node (Arduino IDE)",
      min: 8,
      sum: "Full ESP32 firmware: connects to Wi-Fi, reads turbidity/BH1750 light/VL53L0X ToF sensors, and publishes JSON telemetry to the Mosquitto broker over MQTT.",
      blocks: [
        { t: "p", x: "Upload this sketch to an ESP32 using the Arduino IDE. It connects to Wi-Fi, reads a turbidity sensor, a **BH1750** light sensor, and a **VL53L0X** ToF distance sensor, then publishes a JSON payload to the MQTT broker. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `MQTT_BROKER` for your network." },
        { t: "warn", x: "This sketch stores Wi-Fi and MQTT settings in code for lab/testing. For production, avoid hardcoding credentials, use secure provisioning, and enable MQTT authentication/TLS (see Steps 2–3) when possible." },
        {
          t: "code",
          lang: "cpp",
          title: "ESP32 MQTT sensor node (Arduino IDE)",
          x: `#include <Wire.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <BH1750.h>
#include <Adafruit_VL53L0X.h>

// =====================================
// WIFI CONFIGURATION
// =====================================
const char* WIFI_SSID = "sap3ns";
const char* WIFI_PASSWORD = "1234567890";

// =====================================
// MQTT CONFIGURATION
// =====================================
const char* MQTT_BROKER = "10.230.41.43";
const int MQTT_PORT = 1883;

const char* MQTT_TOPIC =
    "esp32/turbidity_tds_light_data";

const char* MQTT_STATUS_TOPIC =
    "esp32/turbidity_tds_light_status";

const char* MQTT_CLIENT_ID =
    "esp32-turbidity-tof-light";

const char* MQTT_USER = "";
const char* MQTT_PASS = "";

const unsigned long PUBLISH_INTERVAL_MS = 5000;
const unsigned long WIFI_RETRY_MS = 10000;
const unsigned long MQTT_RETRY_MS = 5000;

// =====================================
// ESP32 PIN CONFIGURATION
// =====================================

// Turbidity sensor V1.1
#define TURBIDITY_PIN 32

// BH1750 I2C bus
#define LIGHT_SDA 18
#define LIGHT_SCL 19

// ToF I2C bus
#define TOF_SDA 21
#define TOF_SCL 22

// =====================================
// SENSOR GLOBALS
// =====================================
TwoWire lightWire = TwoWire(1);
BH1750 lightMeter;
Adafruit_VL53L0X tof;

bool lightReady = false;
bool tofReady = false;

// =====================================
// NETWORK GLOBALS
// =====================================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublish = 0;
unsigned long lastWifiTry = 0;
unsigned long lastMqttTry = 0;

// =====================================
// WIFI CONNECTION
// =====================================
void connectWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi not connected yet.");
  }
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  unsigned long now = millis();

  if (now - lastWifiTry >= WIFI_RETRY_MS) {
    lastWifiTry = now;

    Serial.println("Wi-Fi lost. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}

// =====================================
// MQTT CONNECTION
// =====================================
bool connectMQTT() {
  Serial.print("Connecting to MQTT broker ");
  Serial.print(MQTT_BROKER);
  Serial.print("... ");

  bool ok;

  if (strlen(MQTT_USER) > 0) {
    ok = mqttClient.connect(
      MQTT_CLIENT_ID,
      MQTT_USER,
      MQTT_PASS,
      MQTT_STATUS_TOPIC,
      1,
      true,
      "offline"
    );
  } else {
    ok = mqttClient.connect(
      MQTT_CLIENT_ID,
      nullptr,
      nullptr,
      MQTT_STATUS_TOPIC,
      1,
      true,
      "offline"
    );
  }

  if (ok) {
    Serial.println("connected.");
    mqttClient.publish(
      MQTT_STATUS_TOPIC, "online", true
    );
  } else {
    Serial.print("Connection failed, rc=");
    Serial.println(mqttClient.state());
  }

  return ok;
}

void maintainMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  if (mqttClient.connected()) {
    return;
  }

  unsigned long now = millis();

  if (now - lastMqttTry >= MQTT_RETRY_MS) {
    lastMqttTry = now;
    connectMQTT();
  }
}

// =====================================
// READ SENSORS AND PUBLISH MQTT
// =====================================
void publishSensorData() {

  // -------------------------------------
  // 1. TURBIDITY SENSOR
  // -------------------------------------
  int turbidityRaw = analogRead(TURBIDITY_PIN);

  float turbidityVoltage =
      turbidityRaw * 3.3 / 4095.0;

  // -------------------------------------
  // 2. BH1750 LIGHT SENSOR
  // -------------------------------------
  char luxStr[16] = "null";

  if (lightReady) {
    float lux = lightMeter.readLightLevel();

    if (lux >= 0) {
      snprintf(luxStr, sizeof(luxStr), "%.2f", lux);
    }
  }

  // -------------------------------------
  // 3. TOF DISTANCE SENSOR
  // -------------------------------------
  int tofDistanceMM = -1;
  float tofDistanceCM = -1.0;

  if (tofReady) {
    VL53L0X_RangingMeasurementData_t measurement;

    tof.rangingTest(&measurement, false);

    if (measurement.RangeStatus != 4) {
      tofDistanceMM = measurement.RangeMilliMeter;
      tofDistanceCM = tofDistanceMM / 10.0;

      Serial.print("ToF Distance: ");
      Serial.print(tofDistanceMM);
      Serial.print(" mm | ");
      Serial.print(tofDistanceCM, 1);
      Serial.println(" cm");
    } else {
      Serial.println("ToF: Out of range");
    }
  } else {
    Serial.println("ToF: Sensor unavailable");
  }

  // -------------------------------------
  // 4. BUILD JSON PAYLOAD
  // -------------------------------------
  char payload[400];

  snprintf(
    payload,
    sizeof(payload),
    "{\\"turbidity_raw\\":%d,"
    "\\"turbidity_voltage\\":%.3f,"
    "\\"lux\\":%s,"
    "\\"tof_distance_mm\\":%d,"
    "\\"tof_distance_cm\\":%.1f,"
    "\\"rssi\\":%d}",
    turbidityRaw,
    turbidityVoltage,
    luxStr,
    tofDistanceMM,
    tofDistanceCM,
    WiFi.RSSI()
  );

  // -------------------------------------
  // 5. PUBLISH TO MQTT
  // -------------------------------------
  Serial.print("Publishing to ");
  Serial.println(MQTT_TOPIC);

  Serial.println(payload);

  if (mqttClient.publish(MQTT_TOPIC, payload)) {
    Serial.println("MQTT publish successful.");
  } else {
    Serial.println("MQTT publish failed.");
  }
}

// =====================================
// SETUP
// =====================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);

  Serial.println();
  Serial.println("==================================");
  Serial.println(" ESP32 SENSOR NODE - MQTT");
  Serial.println(" Turbidity | ToF | BH1750");
  Serial.println("==================================");

  // -------------------------------------
  // INITIALIZE BH1750
  // -------------------------------------
  lightWire.begin(LIGHT_SDA, LIGHT_SCL, 100000);

  if (lightMeter.begin(
        BH1750::CONTINUOUS_HIGH_RES_MODE,
        0x23,
        &lightWire)) {
    lightReady = true;
    Serial.println("BH1750: Connected");
  } else {
    Serial.println("BH1750: Not detected");
  }

  // -------------------------------------
  // INITIALIZE TOF
  // -------------------------------------
  Wire.begin(TOF_SDA, TOF_SCL, 100000);

  if (tof.begin(0x29, false, &Wire)) {
    tofReady = true;
    Serial.println("ToF VL53L0X: Connected");
  } else {
    Serial.println("ToF: Not detected");
    Serial.println("Check SDA, SCL, VCC, and GND.");
  }

  Serial.println("Turbidity sensor: Ready");

  // -------------------------------------
  // WIFI AND MQTT
  // -------------------------------------
  connectWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(512);
  mqttClient.setKeepAlive(30);

  Serial.println("Starting sensor monitoring...");
}

// =====================================
// MAIN LOOP
// =====================================
void loop() {
  maintainWiFi();
  maintainMQTT();

  mqttClient.loop();

  unsigned long now = millis();

  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;

    if (mqttClient.connected()) {
      publishSensorData();
    } else {
      Serial.println("MQTT offline, skipping publish.");
    }
  }
}`
        }
      ]
    }
  ]
};
