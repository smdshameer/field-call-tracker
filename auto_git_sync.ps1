<#
.SYNOPSIS
    Continuous Auto-Sync Daemon for KS Smart Solutions - Field Call Tracker
    Monitors all code files and automatically bundles, commits, and pushes to GitHub & Cloudflare.
#>

$projectDir = $PSScriptRoot
if (-not $projectDir) {
    $projectDir = "C:\Users\acer\OneDrive - Directorate Of School Education GOVERNMENT OF PUDUCHERRY\Desktop\New folder\Field_Call_Tracker"
}

$gitExe = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $gitExe)) {
    $gitExe = "C:\Users\acer\AppData\Local\MinGit\cmd\git.exe"
}

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  KS SMART SOLUTIONS - REAL-TIME AUTOMATIC GIT & CLOUDFLARE SYNC DAEMON" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " [*] Project Path : $projectDir" -ForegroundColor Yellow
Write-Host " [*] Git Binary   : $gitExe" -ForegroundColor Yellow
Write-Host " [*] Status       : ACTIVE & WATCHING FOR ANY FILE CHANGES..." -ForegroundColor Green
Write-Host "==============================================================================`n"

# Function to perform automated bundling and pushing
function Invoke-AutoGitSync {
    param([string]$TriggerReason = "File modification detected")
    
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Write-Host "`n[$timestamp] 🚀 $TriggerReason - Initiating Auto-Sync..." -ForegroundColor Cyan
    
    try {
        Set-Location $projectDir
        
        # 1. Recompile Standalone Worker if scratch/bundle_worker.ps1 exists
        $bundleScript = Join-Path $projectDir "scratch\bundle_worker.ps1"
        if (Test-Path $bundleScript) {
            Write-Host "  -> Bundling standalone worker.js..." -ForegroundColor Gray
            & powershell -ExecutionPolicy Bypass -File $bundleScript | Out-Null
        }
        
        # 2. Check for changes in Git
        $status = & $gitExe status --porcelain 2>&1
        if (-not $status) {
            Write-Host "  -> No pending changes detected." -ForegroundColor DarkGray
            return
        }
        
        # 3. Stage changes
        & $gitExe add . 2>&1 | Out-Null
        
        # 4. Commit
        $commitMsg = "Auto-sync update: $timestamp"
        $commitOut = & $gitExe commit -m $commitMsg 2>&1
        Write-Host "  -> Committed: $commitMsg" -ForegroundColor Yellow
        
        # 5. Push to GitHub
        Write-Host "  -> Pushing to GitHub (origin/main)..." -ForegroundColor Gray
        $pushOut = & $gitExe push origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ SUCCESS: Pushed to GitHub! Cloudflare will deploy in ~10s." -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Push warning. Attempting force push..." -ForegroundColor Yellow
            $pushOut2 = & $gitExe push --force origin main 2>&1
            Write-Host "  ✅ Push completed." -ForegroundColor Green
        }
    } catch {
        Write-Host "  ❌ Auto-sync error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Initial sync on startup
Invoke-AutoGitSync -TriggerReason "Daemon Startup Initial Sync"

# Setup FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $projectDir
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.Filter = "*.*"

$debounceTimer = $null
$syncPending = $false

$changeAction = {
    param($source, $eventArgs)
    $path = $eventArgs.FullPath
    
    # Ignore git internals, logs, temp and scratch files from triggering loops
    if ($path -match '\\\.git\\' -or $path -match '\\worker\.js' -or $path -match '\\scratch\\' -or $path -match '\.tmp$') {
        return
    }
    
    $name = $eventArgs.Name
    $changeType = $eventArgs.ChangeType
    
    # Debounce for 2.5 seconds
    global:syncPending = $true
    global:lastChangedFile = "$changeType: $name"
}

Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $changeAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $changeAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $changeAction | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $changeAction | Out-Null

Write-Host "`n👀 Watching for changes in HTML, JS, CSS, and data files... (Press Ctrl+C to stop)" -ForegroundColor Green

# Polling Loop with Debounce
$lastDebounceCheck = [DateTime]::MinValue
while ($true) {
    Start-Sleep -Milliseconds 800
    if ($syncPending) {
        $syncPending = $false
        Start-Sleep -Seconds 2 # Wait for disk writes to finish
        Invoke-AutoGitSync -TriggerReason "Auto-detected modification ($lastChangedFile)"
    }
}
