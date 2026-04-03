#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$IGTP_DIR = "$env:USERPROFILE\.igtp"
$API_URL = "https://igtp.vercel.app"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "     IGTP Daemon Installer" -ForegroundColor Cyan
Write-Host "     Share GPU power with friends" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ─── Check Node.js ────────────────────────────────────────────────────────
$nodeOk = $false
try {
    $nodeVersion = (node -v) -replace 'v', ''
    $major = [int]($nodeVersion.Split('.')[0])
    if ($major -ge 20) {
        Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
        $nodeOk = $true
    }
} catch {}

if (-not $nodeOk) {
    Write-Host "Node.js 20+ is required." -ForegroundColor Yellow
    Write-Host "Install now via winget? (y/n)" -ForegroundColor Yellow
    $answer = Read-Host
    if ($answer -eq "y") {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    } else {
        Write-Host "Please install Node.js 20+ from https://nodejs.org and try again." -ForegroundColor Red
        exit 1
    }
}

# ─── Create directories ──────────────────────────────────────────────────
Write-Host ""
Write-Host "Setting up $IGTP_DIR ..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path "$IGTP_DIR\daemon" | Out-Null
New-Item -ItemType Directory -Force -Path "$IGTP_DIR\logs" | Out-Null

# ─── Download daemon ─────────────────────────────────────────────────────
Write-Host "Downloading daemon..." -ForegroundColor Blue
$GH_RAW = "https://raw.githubusercontent.com/rrico321/IGTP/main/igtp-daemon"
Invoke-WebRequest -Uri "$GH_RAW/index.ts" -OutFile "$IGTP_DIR\daemon\index.ts"
Invoke-WebRequest -Uri "$GH_RAW/tunnel.ts" -OutFile "$IGTP_DIR\daemon\tunnel.ts"
Invoke-WebRequest -Uri "$GH_RAW/package.json" -OutFile "$IGTP_DIR\daemon\package.json"
Invoke-WebRequest -Uri "$GH_RAW/tray.ps1" -OutFile "$IGTP_DIR\tray.ps1"

# ─── Install dependencies ────────────────────────────────────────────────
Write-Host "Installing dependencies..." -ForegroundColor Blue
Push-Location "$IGTP_DIR\daemon"
npm install --silent 2>$null
npm install --save-dev tsx typescript 2>$null
Pop-Location
Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# ─── API Key ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Step 1: API Key" -ForegroundColor White
Write-Host ""
Write-Host "You need an API key to connect this machine to IGTP."
Write-Host ""
Write-Host "  1. Go to $API_URL/settings/api-keys" -ForegroundColor Blue
Write-Host "  2. Click 'Generate API Key'"
Write-Host "  3. Copy the key and paste it below"
Write-Host ""
$API_KEY = Read-Host "Paste your API key"

if ([string]::IsNullOrWhiteSpace($API_KEY)) {
    Write-Host "API key is required." -ForegroundColor Red
    exit 1
}

# ─── Hardware Detection ──────────────────────────────────────────────────
Write-Host ""
Write-Host "Step 2: Detecting your hardware..." -ForegroundColor White
Write-Host ""

$GPU_MODEL = "Unknown"
$VRAM_GB = 0
$CPU_MODEL = "Unknown"
$RAM_GB = 0

# GPU detection
try {
    $gpuInfo = Get-CimInstance Win32_VideoController | Select-Object -First 1
    if ($gpuInfo) {
        $GPU_MODEL = $gpuInfo.Name
        $VRAM_GB = [math]::Round($gpuInfo.AdapterRAM / 1GB)
    }
} catch {}

# Try nvidia-smi for better GPU info
try {
    $nv = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>$null
    if ($nv) {
        $parts = $nv.Split(',')
        $GPU_MODEL = $parts[0].Trim()
        $VRAM_GB = [math]::Round([int]$parts[1].Trim() / 1024)
    }
} catch {}

# CPU
try {
    $CPU_MODEL = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
} catch {}

# RAM
try {
    $RAM_GB = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
} catch {}

Write-Host "  GPU:  $GPU_MODEL ($VRAM_GB GB)"
Write-Host "  CPU:  $CPU_MODEL"
Write-Host "  RAM:  $RAM_GB GB"
Write-Host ""
$confirm = Read-Host "Does this look right? (y/n)"

if ($confirm -ne "y") {
    $GPU_MODEL = Read-Host "GPU model (e.g. RTX 4090)"
    $VRAM_GB = Read-Host "GPU VRAM in GB (e.g. 24)"
    $CPU_MODEL = Read-Host "CPU model (e.g. Intel i9-13900K)"
    $RAM_GB = Read-Host "RAM in GB (e.g. 64)"
}

# ─── Machine Name ────────────────────────────────────────────────────────
Write-Host ""
$defaultName = $env:COMPUTERNAME
$MACHINE_NAME = Read-Host "Name for this machine [$defaultName]"
if ([string]::IsNullOrWhiteSpace($MACHINE_NAME)) { $MACHINE_NAME = $defaultName }

# ─── Register Machine ───────────────────────────────────────────────────
Write-Host ""
Write-Host "Registering machine with IGTP..." -ForegroundColor Blue

$body = @{
    name = $MACHINE_NAME
    description = "Registered via IGTP installer"
    gpuModel = $GPU_MODEL
    vramGb = [int]$VRAM_GB
    cpuModel = $CPU_MODEL
    ramGb = [int]$RAM_GB
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $API_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$API_URL/api/machines" -Method POST -Headers $headers -Body $body
    $MACHINE_ID = $response.id
} catch {
    Write-Host "Failed to register machine: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Machine registered: $MACHINE_ID" -ForegroundColor Green

# ─── A1111 (Stable Diffusion) ────────────────────────────────────────────
Write-Host ""
Write-Host "Step 3: Stable Diffusion (AUTOMATIC1111)" -ForegroundColor White
Write-Host ""
Write-Host "  AUTOMATIC1111 (A1111) is a popular web interface for AI image"
Write-Host "  generation using Stable Diffusion. If you have it installed,"
Write-Host "  trusted friends can request a remote session to use your GPU"
Write-Host "  for generating images - the daemon handles secure tunneling."
Write-Host ""
Write-Host "  Requirements:" -ForegroundColor Gray
Write-Host "    - AUTOMATIC1111 installed on this PC"
Write-Host "    - Dedicated GPU with 6+ GB VRAM (yours: $VRAM_GB GB)"
Write-Host "    - ~10 GB disk space for models"
Write-Host ""

$A1111_ENABLED = "false"
$A1111_URL = "http://localhost:7860"
$A1111_LAUNCH_CMD = ""
$A1111_MAX_SESSIONS = "1"
$A1111_SESSION_MAX_MINS = "120"

$a1111Answer = Read-Host "Do you have A1111 installed and want to share it? (y/n)"
if ($a1111Answer -eq "y") {
    $A1111_ENABLED = "true"
    Write-Host ""

    $customUrl = Read-Host "  A1111 URL [$A1111_URL]"
    if (-not [string]::IsNullOrWhiteSpace($customUrl)) { $A1111_URL = $customUrl }

    Write-Host ""
    Write-Host "  If A1111 isn't always running, the daemon can start it for you."
    Write-Host "  Leave blank if A1111 is always running." -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Examples:" -ForegroundColor Gray
    Write-Host "    webui-user.bat --api --listen"
    Write-Host "    conda run -n sd python launch.py --api --listen"
    Write-Host ""
    $A1111_LAUNCH_CMD = Read-Host "  A1111 launch command (or blank)"

    $customMax = Read-Host "  Max session duration in minutes [$A1111_SESSION_MAX_MINS]"
    if (-not [string]::IsNullOrWhiteSpace($customMax)) { $A1111_SESSION_MAX_MINS = $customMax }

    # Check/install cloudflared
    Write-Host ""
    Write-Host "  Checking for cloudflared (secure tunnel tool)..." -ForegroundColor Blue
    $cfOk = $false
    try {
        $cfVer = cloudflared --version 2>$null
        if ($cfVer) {
            Write-Host "  [OK] cloudflared found" -ForegroundColor Green
            $cfOk = $true
        }
    } catch {}

    if (-not $cfOk) {
        Write-Host "  cloudflared not found. Install it now? (y/n)" -ForegroundColor Yellow
        $cfInstall = Read-Host
        if ($cfInstall -eq "y") {
            try {
                winget install Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
                $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
                Write-Host "  [OK] cloudflared installed" -ForegroundColor Green
            } catch {
                Write-Host "  Could not install via winget. The daemon will auto-download it on first use." -ForegroundColor Yellow
            }
        } else {
            Write-Host "  No problem - the daemon will auto-download cloudflared when needed." -ForegroundColor Gray
        }
    }

    Write-Host ""
    Write-Host "[OK] A1111 hosting enabled" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  No problem! You can enable it later by editing $IGTP_DIR\.env" -ForegroundColor Gray
}

# ─── Save config ─────────────────────────────────────────────────────────
$envContent = @"
IGTP_API_URL=$API_URL
IGTP_MACHINE_ID=$MACHINE_ID
IGTP_API_KEY=$API_KEY
A1111_ENABLED=$A1111_ENABLED
A1111_URL=$A1111_URL
A1111_MAX_SESSIONS=$A1111_MAX_SESSIONS
A1111_SESSION_MAX_MINS=$A1111_SESSION_MAX_MINS
"@
if (-not [string]::IsNullOrWhiteSpace($A1111_LAUNCH_CMD)) {
    $envContent += "`nA1111_LAUNCH_CMD=$A1111_LAUNCH_CMD"
}
$envContent | Out-File -FilePath "$IGTP_DIR\.env" -Encoding ascii

Write-Host "[OK] Config saved to $IGTP_DIR\.env" -ForegroundColor Green

# ─── Create CLI wrapper ──────────────────────────────────────────────────
@'
@echo off
setlocal

set IGTP_DIR=%USERPROFILE%\.igtp
set PID_FILE=%IGTP_DIR%\daemon.pid
set LOG_FILE=%IGTP_DIR%\logs\daemon.log

if "%1"=="" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="status" goto status
if "%1"=="logs" goto logs
if "%1"=="update" goto update
if "%1"=="kick" goto kick
if "%1"=="autostart" goto autostart
if "%1"=="uninstall" goto uninstall
if "%1"=="version" goto version
if "%1"=="-v" goto version
goto help

:start
echo Starting IGTP daemon...
for /f "usebackq tokens=*" %%a in ("%IGTP_DIR%\.env") do set %%a
cd /d "%IGTP_DIR%\daemon"
start /b "" cmd /c "npx tsx index.ts >> "%LOG_FILE%" 2>&1"
echo Daemon started. Logs: %LOG_FILE%
goto end

:stop
if exist "%PID_FILE%" (
    set /p DAEMON_PID=<"%PID_FILE%"
    taskkill /f /t /pid %DAEMON_PID% >nul 2>&1
    del "%PID_FILE%" >nul 2>&1
)
taskkill /f /fi "WINDOWTITLE eq IGTP*" >nul 2>&1
echo Daemon stopped.
goto end

:status
if exist "%IGTP_DIR%\.env" (
    for /f "usebackq tokens=*" %%a in ("%IGTP_DIR%\.env") do set %%a
    echo Machine ID: %IGTP_MACHINE_ID%
    echo API URL: %IGTP_API_URL%
)
echo Config: %IGTP_DIR%\.env
echo Logs: %LOG_FILE%
goto end

:logs
type "%LOG_FILE%"
goto end

:update
echo Updating IGTP daemon...
set GH_RAW=https://raw.githubusercontent.com/rrico321/IGTP/main/igtp-daemon
curl -fsSL "%GH_RAW%/index.ts" -o "%IGTP_DIR%\daemon\index.ts"
curl -fsSL "%GH_RAW%/tunnel.ts" -o "%IGTP_DIR%\daemon\tunnel.ts" 2>nul
curl -fsSL "%GH_RAW%/package.json" -o "%IGTP_DIR%\daemon\package.json"
curl -fsSL "%GH_RAW%/tray.ps1" -o "%IGTP_DIR%\tray.ps1" 2>nul
curl -fsSL "%GH_RAW%/igtp.bat" -o "%IGTP_DIR%\igtp.bat" 2>nul
cd /d "%IGTP_DIR%\daemon"
npm install --silent 2>nul
echo Daemon updated. Restart with: igtp stop ^&^& igtp start
goto end

:kick
echo Killing all tunnel connections...
taskkill /f /im cloudflared.exe >nul 2>&1
echo All tunnels killed.
for /f "usebackq tokens=*" %%a in ("%IGTP_DIR%\.env") do set %%a
if defined IGTP_API_KEY (
    echo Notifying server...
    curl -s -X POST -H "Authorization: Bearer %IGTP_API_KEY%" -H "Content-Type: application/json" -d "{\"machineId\":\"%IGTP_MACHINE_ID%\"}" "%IGTP_API_URL%/api/machines/%IGTP_MACHINE_ID%/kick" >nul 2>&1
)
echo Done. All remote sessions disconnected.
goto end

:autostart
if "%2"=="on" (
    schtasks /create /tn "IGTP Daemon" /tr "\"%IGTP_DIR%\igtp.bat\" start" /sc onlogon /rl limited /f >nul 2>&1
    echo Auto-start enabled.
) else if "%2"=="off" (
    schtasks /delete /tn "IGTP Daemon" /f >nul 2>&1
    echo Auto-start disabled.
) else (
    echo Usage: igtp autostart on^|off
)
goto end

:uninstall
echo This will remove IGTP daemon from this machine.
set /p confirm="Are you sure? (y/n): "
if "%confirm%"=="y" (
    call :stop
    schtasks /delete /tn "IGTP Daemon" /f >nul 2>&1
    rd /s /q "%IGTP_DIR%"
    echo IGTP daemon uninstalled.
)
goto end

:version
cd /d "%IGTP_DIR%\daemon"
node -e "console.log(require('./package.json').version)"
goto end

:help
echo IGTP Daemon - Share GPU power with your trust network
echo.
echo Commands:
echo   igtp start           Start the daemon
echo   igtp stop            Stop the daemon
echo   igtp status          Show daemon status and config
echo   igtp logs            Show daemon log output
echo   igtp update          Update daemon to latest version
echo   igtp kick            Kill all tunnels and disconnect remote users
echo   igtp autostart on    Start daemon automatically on login
echo   igtp autostart off   Disable auto-start
echo   igtp version         Show daemon version
echo   igtp uninstall       Remove IGTP daemon from this machine
goto end

:end
endlocal
'@ | Out-File -FilePath "$IGTP_DIR\igtp.bat" -Encoding ascii

# ─── Add to PATH ─────────────────────────────────────────────────────────
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$IGTP_DIR*") {
    [Environment]::SetEnvironmentVariable("PATH", "$IGTP_DIR;$currentPath", "User")
    $env:PATH = "$IGTP_DIR;$env:PATH"
    Write-Host "[OK] Added to PATH" -ForegroundColor Green
}

# ─── Auto-start ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Step 4: Auto-start" -ForegroundColor White
Write-Host ""
$autostart = Read-Host "Start daemon automatically when you log in? (y/n)"
if ($autostart -eq "y") {
    $trayCmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$IGTP_DIR\tray.ps1`""
    schtasks /create /tn "IGTP Daemon" /tr "$trayCmd" /sc onlogon /rl limited /f | Out-Null
    Write-Host "[OK] Auto-start enabled (tray app)" -ForegroundColor Green
}

# ─── Start now ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Starting daemon (tray app)..." -ForegroundColor Blue
Start-Process powershell.exe -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$IGTP_DIR\tray.ps1`"" -WindowStyle Hidden

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  IGTP daemon installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Your machine is now sharing compute on IGTP."
Write-Host ""
Write-Host "  Useful commands:"
Write-Host "    igtp status       - Check if daemon is running"
Write-Host "    igtp logs         - See what's happening"
Write-Host "    igtp update       - Update to latest version"
Write-Host "    igtp stop         - Pause sharing"
Write-Host "    igtp start        - Resume sharing"
Write-Host "    igtp kick         - Disconnect all remote users"
Write-Host "    igtp uninstall    - Remove everything"
Write-Host ""
if ($A1111_ENABLED -eq "true") {
    Write-Host "  A1111 hosting is ON. Trusted friends can request"
    Write-Host "  image generation sessions through the IGTP website."
    Write-Host ""
}
Write-Host "  Dashboard: $API_URL" -ForegroundColor Blue
Write-Host ""
