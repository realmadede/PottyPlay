# PottyPlay Theatre Management System (TMS) Automation Bridge

## 1. Overview
The **PottyPlay TMS Bridge** is a lightweight daemon that connects directly to cinema Theatre Management Systems (Dolby IMS3000, Christie, Barco Alchemy, or Vista POS/TMS feeds). 

Instead of requiring cinema operators or projectionists to manually click pause/resume buttons on the PottyPlay console, the TMS daemon detects physical projection events and dispatches cryptographically signed HMAC-SHA256 webhook notifications to PottyPlay in real time.

---

## 2. Supported Hardware & Protocols

| Vendor | System | Protocol |
|---|---|---|
| **Dolby** | IMS3000 / ShowVault | REST API (`/dcp/playback/status`) & Automation Cues |
| **Christie** | IMB / Cine-IPM | REST API & TCP Socket Cues |
| **Barco** | Alchemy ICMP | Automation Webhooks |
| **Vista** | Screen Automation System | POS Webhook Feed |

---

## 3. Configuration & Environment Variables

Configure the following environment variables on the projection booth host machine:

```bash
# Target PottyPlay Webhook Endpoint
POTTYPLAY_WEBHOOK_URL="https://your-domain.com/api/webhooks/pos"

# Cryptographic Shared HMAC Secret (configured in PottyPlay .env)
POS_WEBHOOK_SECRET="your_secure_pos_webhook_secret_here"

# Cinema Identifier assigned to this theater
CINEMA_ID="cinema_cuid_here"

# Local TMS IP & Poll Frequency
TMS_SERVER_URL="http://192.168.1.50:8080/dcp/playback"
TMS_POLL_INTERVAL_MS="1500"
```

---

## 4. Running the Daemon

### Development & Simulation Mode
Test the webhook delivery pipeline locally against a live PottyPlay server:
```bash
npx tsx tms-bridge/tms-daemon.ts --simulate
```

### Production Background Service (systemd)
Create a systemd unit file at `/etc/systemd/system/pottyplay-tms.service`:

```ini
[Unit]
Description=PottyPlay TMS Projector Automation Daemon
After=network.target

[Service]
Type=simple
User=cinema-tech
WorkingDirectory=/opt/pottyplay-tms
Environment=POTTYPLAY_WEBHOOK_URL=https://api.pottyplay.com/api/webhooks/pos
Environment=POS_WEBHOOK_SECRET=your_secret_here
Environment=CINEMA_ID=cinema_id_here
ExecStart=/usr/bin/node /opt/pottyplay-tms/tms-daemon.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pottyplay-tms
```
