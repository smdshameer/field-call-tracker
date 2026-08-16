$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$ipAddresses = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress)

# Use TcpListener on IPAddress.Any - Works without Admin rights and NEVER returns HTTP 400 Invalid Hostname!
$listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Any, $port)
$listener.Start()

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Field Call Tracker - Mobile Local Web Server" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Laptop URL (Chrome/Edge):" -ForegroundColor Yellow
Write-Host "  http://localhost:$port/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "  MOBILE PHONE URL (Connect to same Wi-Fi):" -ForegroundColor Yellow
foreach ($ip in $ipAddresses) {
    Write-Host "  http://${ip}:${port}/index.html" -ForegroundColor Green
}
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".ttf"  = "font/ttf"
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        
        $buffer = New-Object byte[] 8192
        $bytesRead = $stream.Read($buffer, 0, $buffer.Length)
        if ($bytesRead -le 0) {
            $client.Close()
            continue
        }

        $requestText = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $bytesRead)
        $firstLine = $requestText.Split("`r`n")[0]
        $parts = $firstLine.Split(" ")
        
        if ($parts.Length -ge 2) {
            $method = $parts[0].ToUpper()
            $rawUrl = $parts[1]
            $localPath = $rawUrl.Split("?")[0]

            # === API: Send OTP Email via Resend ===
            if ($localPath -eq "/api/send-otp" -and $method -eq "POST") {
                try {
                    $bodyIndex = $requestText.IndexOf("`r`n`r`n")
                    $jsonBody = if ($bodyIndex -ge 0) { $requestText.Substring($bodyIndex + 4) } else { "{}" }
                    $payload = $jsonBody | ConvertFrom-Json
                    
                    $recipientEmail = if ($payload.email) { $payload.email } else { "smssiddiq2011@gmail.com" }
                    $recipientName = if ($payload.name) { $payload.name } else { "Field Engineer" }
                    $otpCode = if ($payload.otp) { $payload.otp } else { "849201" }

                    $apiKey = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("cmVfUnlrcUhBaTVfOFBrQ1o4NHJaRm5pcnhvOGRVb2txeG5X"))
                    $emailHtml = "<div style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #dadde1;border-radius:12px;padding:30px;box-shadow:0 4px 12px rgba(0,0,0,0.08);'><div style='font-size:22px;font-weight:800;color:#1877f2;margin-bottom:18px;'>KS Smart Solutions</div><h2 style='color:#0f172a;margin-top:0;font-size:19px;font-weight:800;'>Password Reset Verification Code</h2><p style='color:#475569;font-size:14px;line-height:1.5;'>Hello <strong>$recipientName</strong>,</p><p style='color:#475569;font-size:14px;line-height:1.5;'>We received a request to reset your password for the <strong>Tamil Nadu School Project Field Portal</strong>.</p><div style='background:#ecfdf5;border:2px solid #10b981;border-radius:10px;padding:20px;text-align:center;margin:24px 0;'><div style='font-size:12px;font-weight:700;color:#047857;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;'>Your 6-Digit Security Code</div><div style='font-size:36px;font-weight:900;letter-spacing:8px;color:#065f46;font-family:monospace;'>$otpCode</div><div style='font-size:11.5px;color:#059669;margin-top:6px;font-weight:600;'>Valid for 10 minutes</div></div><p style='color:#64748b;font-size:13px;line-height:1.5;'>Please enter this code on the verification screen to choose a new password.</p><div style='margin-top:25px;padding-top:15px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;'><strong>Tamil Nadu School Education Project</strong> &bull; KS Smart Solutions</div></div>"

                    $resendHeaders = @{ "Authorization" = "Bearer $apiKey"; "Content-Type" = "application/json" }
                    $resendBody = @{ from = "KS Smart Portal <onboarding@resend.dev>"; to = @($recipientEmail); subject = "KS Smart Solutions - Password Reset Code: $otpCode"; html = $emailHtml } | ConvertTo-Json

                    $resendResp = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $resendHeaders -Body $resendBody
                    $respJson = @{ success = $true; id = $resendResp.id; message = "OTP email delivered successfully" } | ConvertTo-Json
                    
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Headers: *`r`nAccess-Control-Allow-Methods: *`r`nContent-Length: $($respBytes.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($respBytes, 0, $respBytes.Length)
                } catch {
                    $errJson = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json
                    $respBytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                    $header = "HTTP/1.1 500 Internal Server Error`r`nContent-Type: application/json`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($respBytes.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($respBytes, 0, $respBytes.Length)
                }
            } elseif ($method -eq "OPTIONS") {
                $header = "HTTP/1.1 200 OK`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Headers: *`r`nAccess-Control-Allow-Methods: *`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
                $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                $stream.Write($headerBytes, 0, $headerBytes.Length)
            } else {
                if ($localPath -eq "/") { $localPath = "/index.html" }

                $filePath = Join-Path $root ($localPath -replace "/", "\")

                if (Test-Path $filePath -PathType Leaf) {
                    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                    $ct = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                    
                    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
                    $header = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($fileBytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($fileBytes, 0, $fileBytes.Length)
                } else {
                    $notFound = "404 Not Found: $localPath"
                    $nfBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
                    $header = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($nfBytes.Length)`r`nConnection: close`r`n`r`n"
                    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
                    
                    $stream.Write($headerBytes, 0, $headerBytes.Length)
                    $stream.Write($nfBytes, 0, $nfBytes.Length)
                }
            }
        }
        $stream.Close()
        $client.Close()
    }
} finally {
    $listener.Stop()
    Write-Host "Server stopped." -ForegroundColor Red
}
