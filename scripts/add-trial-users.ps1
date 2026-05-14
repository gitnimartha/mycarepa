# Batch Add Trial Users Script
# Reads CSV and creates trial users via API

$csvPath = "C:\Users\Buffer Laptop\Downloads\Email List - Cases From the Last 15 days to 4-8-2026 - Business(sheet1).csv"
$apiUrl = "https://api.mycarepersonalassistant.com/api/admin/create-trial-user"
$password = "mycarepa2024"
$hours = 3

# Output log files
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$successLog = "E:\martha\sandbox\pricing-app\scripts\trial-users-success-$timestamp.csv"
$errorLog = "E:\martha\sandbox\pricing-app\scripts\trial-users-errors-$timestamp.csv"

# Initialize logs
"Email,Name,CustomerId,SubscriptionId" | Out-File $successLog -Encoding UTF8
"Email,Name,Error" | Out-File $errorLog -Encoding UTF8

# Read CSV
$users = Import-Csv $csvPath

$total = $users.Count
$success = 0
$failed = 0
$skipped = 0

Write-Host "Starting batch import of $total users..." -ForegroundColor Cyan
Write-Host ""

foreach ($i in 0..($users.Count - 1)) {
    $user = $users[$i]
    $email = $user.'Contact - Email Address'.Trim()
    $firstName = $user.'First Name'.Trim()
    $lastName = $user.'Last Name'.Trim()
    $name = "$firstName $lastName"

    # Skip if no email
    if (-not $email) {
        Write-Host "[$($i+1)/$total] SKIP - No email" -ForegroundColor Yellow
        $skipped++
        continue
    }

    Write-Host "[$($i+1)/$total] Adding: $email ($name)... " -NoNewline

    try {
        $body = @{
            email = $email
            name = $name
            hours = $hours
            password = $password
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop

        if ($response.success) {
            Write-Host "OK" -ForegroundColor Green
            "$email,$name,$($response.customerId),$($response.subscriptionId)" | Out-File $successLog -Append -Encoding UTF8
            $success++
        } else {
            Write-Host "FAILED: $($response.error)" -ForegroundColor Red
            "$email,$name,$($response.error)" | Out-File $errorLog -Append -Encoding UTF8
            $failed++
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        # Try to extract error from response body
        if ($_.ErrorDetails.Message) {
            try {
                $errBody = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorMsg = $errBody.error
            } catch {}
        }

        # Check if it's "already has subscription" - that's expected for some
        if ($errorMsg -like "*already has*") {
            Write-Host "SKIPPED (existing)" -ForegroundColor Yellow
            $skipped++
        } else {
            Write-Host "ERROR: $errorMsg" -ForegroundColor Red
            "$email,$name,$errorMsg" | Out-File $errorLog -Append -Encoding UTF8
            $failed++
        }
    }

    # Small delay to avoid overwhelming the API
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "========== COMPLETE ==========" -ForegroundColor Cyan
Write-Host "Total:   $total"
Write-Host "Success: $success" -ForegroundColor Green
Write-Host "Skipped: $skipped" -ForegroundColor Yellow
Write-Host "Failed:  $failed" -ForegroundColor Red
Write-Host ""
Write-Host "Logs saved to:"
Write-Host "  Success: $successLog"
Write-Host "  Errors:  $errorLog"
