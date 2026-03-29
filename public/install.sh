#!/usr/bin/env bash
set -euo pipefail

# ─── Colors ────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

IGTP_DIR="$HOME/.igtp"
API_URL="https://igtp.vercel.app"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     IGTP Daemon Installer            ║${NC}"
echo -e "${BOLD}║     Share GPU power with friends      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""

# ─── Check Node.js ─────────────────────────────────────────────────────────
check_node() {
  if command -v node &>/dev/null; then
    NODE_VERSION=$(node -v | sed 's/v//')
    MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$MAJOR" -ge 20 ]; then
      echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION found"
      return 0
    fi
  fi
  return 1
}

install_node() {
  echo -e "${YELLOW}Node.js 20+ is required but not found.${NC}"
  echo ""
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &>/dev/null; then
      echo -e "Install with Homebrew? (y/n)"
      read -r answer < /dev/tty
      if [[ "$answer" == "y" ]]; then
        brew install node
        return 0
      fi
    fi
  fi
  # Fallback: nvm
  echo "Installing via nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm install 22
  nvm use 22
}

if ! check_node; then
  install_node
  if ! check_node; then
    echo -e "${RED}✗ Could not install Node.js. Please install Node.js 20+ manually and try again.${NC}"
    exit 1
  fi
fi

# ─── Create install directory ──────────────────────────────────────────────
echo ""
echo -e "${BLUE}Setting up ~/.igtp/ ...${NC}"
mkdir -p "$IGTP_DIR/daemon"
mkdir -p "$IGTP_DIR/logs"

# ─── Download daemon files ─────────────────────────────────────────────────
echo -e "${BLUE}Downloading daemon...${NC}"
curl -fsSL "https://raw.githubusercontent.com/rrico321/IGTP/main/igtp-daemon/index.ts" -o "$IGTP_DIR/daemon/index.ts"
curl -fsSL "https://raw.githubusercontent.com/rrico321/IGTP/main/igtp-daemon/package.json" -o "$IGTP_DIR/daemon/package.json"

# ─── Install dependencies ─────────────────────────────────────────────────
echo -e "${BLUE}Installing dependencies...${NC}"
cd "$IGTP_DIR/daemon"
npm install --silent 2>/dev/null
npm install --save-dev tsx typescript 2>/dev/null
echo -e "${GREEN}✓${NC} Dependencies installed"

# ─── API Key ───────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 1: API Key${NC}"
echo ""
echo "You need an API key to connect this machine to IGTP."
echo ""
echo -e "  1. Go to ${BLUE}${API_URL}/settings/api-keys${NC}"
echo "  2. Click \"Generate API Key\""
echo "  3. Copy the key and paste it below"
echo ""
read -rp "Paste your API key: " API_KEY < /dev/tty

if [[ -z "$API_KEY" ]]; then
  echo -e "${RED}✗ API key is required.${NC}"
  exit 1
fi

# Validate the key works
echo -e "${BLUE}Checking key...${NC}"
VALIDATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $API_KEY" "$API_URL/api/api-keys")
if [[ "$VALIDATE_RESPONSE" == "401" ]]; then
  echo -e "${RED}✗ Invalid API key. Please check and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} API key is valid"

# ─── Hardware Detection ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 2: Detecting your hardware...${NC}"
echo ""

# Detect GPU — wrapped in subshell so failures don't exit the script
GPU_MODEL="Unknown"
VRAM_GB=0
if command -v nvidia-smi &>/dev/null; then
  GPU_MODEL=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits 2>/dev/null | head -1 | xargs) || true
  VRAM_MB=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null | head -1 | xargs) || true
  if [[ -n "${VRAM_MB:-}" && "$VRAM_MB" =~ ^[0-9]+$ ]]; then
    VRAM_GB=$(( VRAM_MB / 1024 ))
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS: check for Apple Silicon or discrete GPU
  GPU_INFO=$(system_profiler SPDisplaysDataType 2>/dev/null | grep "Chipset Model" | head -1 | sed 's/.*: //') || true
  if [[ -n "${GPU_INFO:-}" ]]; then
    GPU_MODEL="$GPU_INFO"
  else
    # Apple Silicon reports chip name instead
    CHIP=$(sysctl -n machdep.cpu.brand_string 2>/dev/null) || true
    if [[ -n "${CHIP:-}" ]]; then
      GPU_MODEL="$CHIP (integrated)"
    fi
  fi
  VRAM_INFO=$(system_profiler SPDisplaysDataType 2>/dev/null | grep -i "VRAM\|Memory\|memory" | head -1 | sed 's/.*: //') || true
  if [[ "${VRAM_INFO:-}" =~ ([0-9]+) ]]; then
    VRAM_GB="${BASH_REMATCH[1]}"
  fi
fi

# Detect CPU
CPU_MODEL="Unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
  CPU_MODEL=$(sysctl -n machdep.cpu.brand_string 2>/dev/null) || true
  if [[ -z "${CPU_MODEL:-}" || "$CPU_MODEL" == "Unknown" ]]; then
    # Apple Silicon doesn't have machdep.cpu.brand_string
    CPU_MODEL=$(uname -m 2>/dev/null) || true
    if [[ "$CPU_MODEL" == "arm64" ]]; then
      CPU_MODEL="Apple Silicon"
    fi
  fi
elif [[ -f /proc/cpuinfo ]]; then
  CPU_MODEL=$(grep "model name" /proc/cpuinfo | head -1 | sed 's/.*: //') || true
fi

# Detect RAM
RAM_GB=0
if [[ "$OSTYPE" == "darwin"* ]]; then
  RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null) || true
  if [[ -n "${RAM_BYTES:-}" && "$RAM_BYTES" =~ ^[0-9]+$ ]]; then
    RAM_GB=$(( RAM_BYTES / 1073741824 ))
  fi
elif [[ -f /proc/meminfo ]]; then
  RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}') || true
  if [[ -n "${RAM_KB:-}" && "$RAM_KB" =~ ^[0-9]+$ ]]; then
    RAM_GB=$(( RAM_KB / 1048576 ))
  fi
fi

# Apple Silicon uses unified memory — VRAM = RAM
if [[ "$VRAM_GB" -eq 0 && "$RAM_GB" -gt 0 && "$GPU_MODEL" == *"Apple"* ]]; then
  VRAM_GB=$RAM_GB
fi

echo -e "  GPU:  ${BOLD}$GPU_MODEL${NC} ($VRAM_GB GB)"
echo -e "  CPU:  ${BOLD}$CPU_MODEL${NC}"
echo -e "  RAM:  ${BOLD}${RAM_GB} GB${NC}"
echo ""
echo -e "Does this look right? (y/n)"
read -r confirm < /dev/tty

if [[ "$confirm" != "y" ]]; then
  echo ""
  read -rp "GPU model (e.g. RTX 4090): " GPU_MODEL < /dev/tty
  read -rp "GPU VRAM in GB (e.g. 24): " VRAM_GB < /dev/tty
  read -rp "CPU model (e.g. Intel i9-13900K): " CPU_MODEL < /dev/tty
  read -rp "RAM in GB (e.g. 64): " RAM_GB < /dev/tty
fi

# ─── Machine Name ──────────────────────────────────────────────────────────
echo ""
HOSTNAME_DEFAULT=$(hostname -s 2>/dev/null || hostname)
read -rp "Name for this machine [$HOSTNAME_DEFAULT]: " MACHINE_NAME < /dev/tty
MACHINE_NAME=${MACHINE_NAME:-$HOSTNAME_DEFAULT}

# ─── Register Machine ─────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Registering machine with IGTP...${NC}"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/machines" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$MACHINE_NAME\",
    \"description\": \"Registered via IGTP installer\",
    \"gpuModel\": \"$GPU_MODEL\",
    \"vramGb\": $VRAM_GB,
    \"cpuModel\": \"$CPU_MODEL\",
    \"ramGb\": $RAM_GB
  }")

MACHINE_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -z "$MACHINE_ID" ]]; then
  echo -e "${RED}✗ Failed to register machine. Response:${NC}"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓${NC} Machine registered: $MACHINE_ID"

# ─── Save config ───────────────────────────────────────────────────────────
cat > "$IGTP_DIR/.env" <<EOF
IGTP_API_URL=$API_URL
IGTP_MACHINE_ID=$MACHINE_ID
IGTP_API_KEY=$API_KEY
EOF

echo -e "${GREEN}✓${NC} Config saved to ~/.igtp/.env"

# ─── Create CLI wrapper ───────────────────────────────────────────────────
cat > "$IGTP_DIR/igtp" <<'WRAPPER'
#!/usr/bin/env bash
set -euo pipefail

IGTP_DIR="$HOME/.igtp"
PID_FILE="$IGTP_DIR/daemon.pid"
LOG_FILE="$IGTP_DIR/logs/daemon.log"

load_env() {
  if [[ -f "$IGTP_DIR/.env" ]]; then
    set -a
    source "$IGTP_DIR/.env"
    set +a
  fi
}

case "${1:-help}" in
  start)
    load_env
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "Daemon is already running (PID $(cat "$PID_FILE"))"
      exit 0
    fi
    echo "Starting IGTP daemon..."
    cd "$IGTP_DIR/daemon"
    nohup npx tsx index.ts >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "Daemon started (PID $!)"
    echo "Logs: $LOG_FILE"
    ;;
  stop)
    if [[ -f "$PID_FILE" ]]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        rm -f "$PID_FILE"
        echo "Daemon stopped"
      else
        rm -f "$PID_FILE"
        echo "Daemon was not running"
      fi
    else
      echo "Daemon is not running"
    fi
    ;;
  status)
    load_env
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "Daemon: RUNNING (PID $(cat "$PID_FILE"))"
    else
      echo "Daemon: STOPPED"
    fi
    echo "Machine ID: ${IGTP_MACHINE_ID:-not set}"
    echo "API URL: ${IGTP_API_URL:-not set}"
    echo "Config: $IGTP_DIR/.env"
    echo "Logs: $LOG_FILE"
    ;;
  logs)
    tail -f "$LOG_FILE"
    ;;
  autostart)
    case "${2:-}" in
      on)
        if [[ "$OSTYPE" == "darwin"* ]]; then
          PLIST_DIR="$HOME/Library/LaunchAgents"
          PLIST="$PLIST_DIR/com.igtp.daemon.plist"
          mkdir -p "$PLIST_DIR"
          cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.igtp.daemon</string>
  <key>ProgramArguments</key>
  <array>
    <string>$IGTP_DIR/igtp</string>
    <string>start</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$IGTP_DIR/logs/daemon.log</string>
  <key>StandardErrorPath</key><string>$IGTP_DIR/logs/daemon.log</string>
</dict>
</plist>
PLIST_EOF
          launchctl load "$PLIST" 2>/dev/null || true
          echo "Auto-start enabled (launchd)"
        elif command -v systemctl &>/dev/null; then
          UNIT_DIR="$HOME/.config/systemd/user"
          mkdir -p "$UNIT_DIR"
          cat > "$UNIT_DIR/igtp-daemon.service" <<UNIT_EOF
[Unit]
Description=IGTP GPU Sharing Daemon
After=network-online.target

[Service]
Type=simple
ExecStart=$IGTP_DIR/igtp start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
UNIT_EOF
          systemctl --user daemon-reload
          systemctl --user enable igtp-daemon.service
          echo "Auto-start enabled (systemd)"
        else
          echo "Auto-start not supported on this system. Use cron or rc.local instead."
        fi
        ;;
      off)
        if [[ "$OSTYPE" == "darwin"* ]]; then
          PLIST="$HOME/Library/LaunchAgents/com.igtp.daemon.plist"
          if [[ -f "$PLIST" ]]; then
            launchctl unload "$PLIST" 2>/dev/null || true
            rm -f "$PLIST"
            echo "Auto-start disabled"
          else
            echo "Auto-start was not enabled"
          fi
        elif command -v systemctl &>/dev/null; then
          systemctl --user disable igtp-daemon.service 2>/dev/null || true
          echo "Auto-start disabled"
        fi
        ;;
      *)
        echo "Usage: igtp autostart on|off"
        ;;
    esac
    ;;
  uninstall)
    echo "This will remove IGTP daemon and all config from this machine."
    read -rp "Are you sure? (y/n): " confirm
    if [[ "$confirm" == "y" ]]; then
      "$0" stop 2>/dev/null || true
      "$0" autostart off 2>/dev/null || true
      rm -rf "$IGTP_DIR"
      # Remove from PATH
      sed -i.bak '/\.igtp/d' "$HOME/.bashrc" 2>/dev/null || true
      sed -i.bak '/\.igtp/d' "$HOME/.zshrc" 2>/dev/null || true
      echo "IGTP daemon uninstalled. Open a new terminal to complete."
    fi
    ;;
  help|*)
    echo "IGTP Daemon — Share GPU power with your trust network"
    echo ""
    echo "Commands:"
    echo "  igtp start           Start the daemon"
    echo "  igtp stop            Stop the daemon"
    echo "  igtp status          Show daemon status and config"
    echo "  igtp logs            Follow the daemon log output"
    echo "  igtp autostart on    Start daemon automatically on boot"
    echo "  igtp autostart off   Disable auto-start"
    echo "  igtp uninstall       Remove IGTP daemon from this machine"
    ;;
esac
WRAPPER

chmod +x "$IGTP_DIR/igtp"

# ─── Add to PATH ──────────────────────────────────────────────────────────
SHELL_RC=""
if [[ -f "$HOME/.zshrc" ]]; then
  SHELL_RC="$HOME/.zshrc"
elif [[ -f "$HOME/.bashrc" ]]; then
  SHELL_RC="$HOME/.bashrc"
elif [[ -f "$HOME/.bash_profile" ]]; then
  SHELL_RC="$HOME/.bash_profile"
fi

if [[ -n "$SHELL_RC" ]] && ! grep -q '.igtp' "$SHELL_RC" 2>/dev/null; then
  echo '' >> "$SHELL_RC"
  echo '# IGTP daemon' >> "$SHELL_RC"
  echo 'export PATH="$HOME/.igtp:$PATH"' >> "$SHELL_RC"
  echo -e "${GREEN}✓${NC} Added to PATH in $SHELL_RC"
fi

export PATH="$IGTP_DIR:$PATH"

# ─── Auto-start ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 3: Auto-start${NC}"
echo ""
echo "Would you like the daemon to start automatically when you log in? (y/n)"
read -r autostart < /dev/tty
if [[ "$autostart" == "y" ]]; then
  "$IGTP_DIR/igtp" autostart on
fi

# ─── Start now ────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}Starting daemon...${NC}"
"$IGTP_DIR/igtp" start

echo ""
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  IGTP daemon installed successfully!  ${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════${NC}"
echo ""
echo "  Your machine is now sharing compute on IGTP."
echo ""
echo "  Useful commands:"
echo "    igtp status       — Check if daemon is running"
echo "    igtp logs         — See what's happening"
echo "    igtp stop         — Pause sharing"
echo "    igtp start        — Resume sharing"
echo "    igtp uninstall    — Remove everything"
echo ""
echo -e "  Dashboard: ${BLUE}${API_URL}${NC}"
echo ""
