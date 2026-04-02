# IGTP Daemon - System Tray App
# Runs the daemon in the background and shows a tray icon with status/controls.
# Launch with: powershell -WindowStyle Hidden -File tray.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$IGTP_DIR = "$env:USERPROFILE\.igtp"
$LOG_FILE = "$IGTP_DIR\logs\daemon.log"
$ENV_FILE = "$IGTP_DIR\.env"

# ─── Load config ──────────────────────────────────────────────────────────
$config = @{}
if (Test-Path $ENV_FILE) {
    Get-Content $ENV_FILE | ForEach-Object {
        if ($_ -match '^([A-Z0-9_]+)=(.*)$') {
            $config[$matches[1]] = $matches[2]
        }
    }
}

$API_URL = if ($config.IGTP_API_URL) { $config.IGTP_API_URL } else { "https://igtp.vercel.app" }
$MACHINE_ID = $config.IGTP_MACHINE_ID
$API_KEY = $config.IGTP_API_KEY
$A1111_ENABLED = $config.A1111_ENABLED -eq "true"

# ─── Create icon from text (no external icon file needed) ─────────────────
function New-TrayIcon([string]$text, [System.Drawing.Color]$color) {
    $bmp = New-Object System.Drawing.Bitmap(16, 16)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($color)), 2, 2, 12, 12)
    $g.Dispose()
    return [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
}

$iconOnline = New-TrayIcon "G" ([System.Drawing.Color]::FromArgb(80, 200, 120))
$iconOffline = New-TrayIcon "G" ([System.Drawing.Color]::FromArgb(200, 80, 80))
$iconBusy = New-TrayIcon "G" ([System.Drawing.Color]::FromArgb(255, 180, 50))

# ─── Tray setup ───────────────────────────────────────────────────────────
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $iconOffline
$tray.Text = "IGTP Daemon - Starting..."
$tray.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$statusItem = $menu.Items.Add("Status: Starting...")
$statusItem.Enabled = $false
$statusItem.Font = New-Object System.Drawing.Font($statusItem.Font, [System.Drawing.FontStyle]::Bold)

$menu.Items.Add("-")  # Separator

$startItem = $menu.Items.Add("Start Daemon")
$stopItem = $menu.Items.Add("Stop Daemon")

$menu.Items.Add("-")

$kickItem = $menu.Items.Add("Kick All Sessions")
$kickItem.Enabled = $A1111_ENABLED

$menu.Items.Add("-")

$dashboardItem = $menu.Items.Add("Open Dashboard")
$logsItem = $menu.Items.Add("View Logs")

$menu.Items.Add("-")

$quitItem = $menu.Items.Add("Quit")

$tray.ContextMenuStrip = $menu

# ─── Daemon process management ────────────────────────────────────────────
$script:daemonProc = $null

function Start-Daemon {
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        return
    }

    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "cmd.exe"
    $startInfo.Arguments = "/c cd /d `"$IGTP_DIR\daemon`" && npx tsx index.ts >> `"$LOG_FILE`" 2>&1"
    $startInfo.WindowStyle = "Hidden"
    $startInfo.CreateNoWindow = $true
    $startInfo.UseShellExecute = $false

    # Set env vars
    foreach ($key in $config.Keys) {
        $startInfo.EnvironmentVariables[$key] = $config[$key]
    }

    $script:daemonProc = [System.Diagnostics.Process]::Start($startInfo)
    Update-Status
}

function Stop-Daemon {
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        try {
            $pid = $script:daemonProc.Id
            Start-Process "taskkill" -ArgumentList "/F /T /PID $pid" -WindowStyle Hidden -Wait
        } catch {}
    }
    # Also kill any orphaned node processes running the daemon
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.MainWindowTitle -eq "" -and $_.Path -like "*\.igtp*"
    } | Stop-Process -Force -ErrorAction SilentlyContinue
    $script:daemonProc = $null
    Update-Status
}

function Test-DaemonRunning {
    if ($script:daemonProc -and -not $script:daemonProc.HasExited) {
        return $true
    }
    return $false
}

function Invoke-Kick {
    # Kill cloudflared locally
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

    # Notify API
    if ($API_KEY -and $MACHINE_ID) {
        try {
            $headers = @{
                "Authorization" = "Bearer $API_KEY"
                "Content-Type" = "application/json"
            }
            Invoke-RestMethod -Uri "$API_URL/api/machines/$MACHINE_ID/kick" -Method POST -Headers $headers -ErrorAction SilentlyContinue | Out-Null
        } catch {}
    }

    $tray.ShowBalloonTip(2000, "IGTP", "All remote sessions disconnected.", [System.Windows.Forms.ToolTipIcon]::Info)
}

function Update-Status {
    $running = Test-DaemonRunning
    if ($running) {
        $statusItem.Text = "Status: Online"
        $tray.Icon = $iconOnline
        $tray.Text = "IGTP Daemon - Online"
        $startItem.Enabled = $false
        $stopItem.Enabled = $true
    } else {
        $statusItem.Text = "Status: Stopped"
        $tray.Icon = $iconOffline
        $tray.Text = "IGTP Daemon - Stopped"
        $startItem.Enabled = $true
        $stopItem.Enabled = $false
    }
}

# ─── Event handlers ───────────────────────────────────────────────────────
$startItem.Add_Click({ Start-Daemon })
$stopItem.Add_Click({ Stop-Daemon })
$kickItem.Add_Click({ Invoke-Kick })

$dashboardItem.Add_Click({
    Start-Process "$API_URL"
})

$logsItem.Add_Click({
    if (Test-Path $LOG_FILE) {
        Start-Process "notepad.exe" -ArgumentList $LOG_FILE
    } else {
        $tray.ShowBalloonTip(2000, "IGTP", "No log file found.", [System.Windows.Forms.ToolTipIcon]::Warning)
    }
})

$tray.Add_DoubleClick({
    Start-Process "$API_URL"
})

$quitItem.Add_Click({
    Stop-Daemon
    $tray.Visible = $false
    $tray.Dispose()
    [System.Windows.Forms.Application]::Exit()
})

# ─── Status polling timer ─────────────────────────────────────────────────
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 15000  # 15 seconds
$timer.Add_Tick({ Update-Status })
$timer.Start()

# ─── Auto-start daemon on launch ─────────────────────────────────────────
Start-Daemon

# ─── Run message loop ─────────────────────────────────────────────────────
[System.Windows.Forms.Application]::Run()
