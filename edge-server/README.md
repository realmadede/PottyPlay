# PottyPlay In-Auditorium Local Edge Streaming Server

## 1. Problem Overview
Movie theater auditoriums and restroom facilities are frequently located in basements or encased in thick reinforced concrete. These structural characteristics act as Faraday cages, causing patrons to experience 1-bar cellular reception or complete signal attenuation.

Streaming 4K or 1080p companion cuts directly over public WAN cellular connections in these environments produces buffering stalls, sync jitter, and playback failures.

## 2. Solution: Cinema LAN Micro-Edge Caching
The PottyPlay Local Edge Server runs on any machine on the cinema's local area network (e.g. Theater Management System / TMS server, box office PC, or Intel NUC). 

When patrons connect to the cinema guest Wi-Fi (e.g. `pottyplay-cinema-guest`), companion streams are served directly from the local on-premise cache:
- Sub-5ms stream segment latency.
- Zero reliance on external cellular bandwidth.
- Full CORS and byte-range support for synchronized HTML5 video and WebGL/Canvas players.
- Automatic seamless failover to public cloud CDN if the local edge micro-server becomes unreachable.

---

## 3. Deployment Instructions

### Prerequisites
- Docker Engine & Docker Compose installed on an on-premise cinema machine.
- Static LAN IP address assigned to the host machine (e.g. `192.168.1.100`).
- Local cinema guest Wi-Fi access point configured to allow patrons to reach the edge server IP on port `8080`.

### Step 1: Start the Edge Micro-Cache
Navigate to the `edge-server` directory and launch the container:
```bash
docker compose -f docker-compose.edge.yml up -d
```

### Step 2: Verify Health
Confirm the micro-cache is responsive on the local network:
```bash
curl http://localhost:8080/health
```
Expected output:
```json
{"status":"ok","service":"pottyplay-edge-cache","timestamp":"..."}
```

### Step 3: Register in Operator Dashboard
1. Log into the PottyPlay Operator Portal (`/operator`).
2. Select your cinema and navigate to the **LAN Edge & Wi-Fi** tab.
3. Toggle **Enable Local Edge Stream Routing** to ON.
4. Set **On-Premises Edge Server Endpoint URL**:
   `http://<CINEMA_LAN_IP>:8080/live` (or local mDNS hostname `http://edge.pottyplay.local:8080/live`).
5. Set **Auditorium Guest Wi-Fi Network Name (SSID)**:
   e.g. `pottyplay-cinema-guest`.
6. Set **Cinema LAN IP Subnets**:
   e.g. `192.168.1.0/24, 10.0.0.0/16`.
7. Click **Save Edge Streaming Configuration**.

---

## 4. Playback Architecture & Failover Sequence
1. **Activation**: When a patron activates or synchronizes a companion session, PottyPlay detects whether their IP address belongs to the cinema's LAN subnet.
2. **Dual-Route Payload**: The API provides both `primaryVideoUrl` (WAN Cloud CDN) and `edgeVideoUrl` (Local Cinema Edge).
3. **Adaptive Probing**: The patron's browser checks the edge endpoint. If reachable, it streams from the local cinema LAN.
4. **Resilience**: If the edge micro-cache server encounters an error or loses power, the client automatically falls back to `primaryVideoUrl` without interrupting the patron.
