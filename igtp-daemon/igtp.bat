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
cd /d "%IGTP_DIR%\daemon"
echo Version:
node -e "console.log(require('./package.json').version)"
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
echo   igtp version         Show daemon version
echo   igtp kick            Kill all tunnels and disconnect remote users
echo   igtp autostart on    Start daemon automatically on login
echo   igtp autostart off   Disable auto-start
echo   igtp uninstall       Remove IGTP daemon from this machine
goto end

:end
endlocal
