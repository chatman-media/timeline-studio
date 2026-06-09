# Windows npm install script with timeout and retry logic
param(
    [int]$TimeoutSeconds = 300,
    [int]$MaxRetries = 3
)

$ErrorActionPreference = "Stop"

# Configure npm for better Windows performance
Write-Host "Configuring npm for Windows..." -ForegroundColor Cyan
npm config set fetch-timeout 300000
npm config set fetch-retries 5
npm config set prefer-offline true
npm config set audit false
npm config set fund false
npm config set progress false
npm config set loglevel error

# Set environment variable for onnxruntime
$env:ONNXRUNTIME_DOWNLOAD_TIMEOUT = "600000"
$env:GYP_MSVS_VERSION = "2022"
$env:npm_config_msvs_version = "2022"
$env:VisualStudioVersion = "17.0"

# Function to run npm install with timeout
function Install-NpmDependencies {
    param([int]$Attempt)
    
    Write-Host "`nAttempt $Attempt of $MaxRetries to install dependencies..." -ForegroundColor Yellow
    
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $output = npm ci --prefer-offline --no-audit --no-fund --no-progress 2>&1
        [PSCustomObject]@{
            ExitCode = $LASTEXITCODE
            Output = $output
        }
    }
    
    $completed = Wait-Job $job -Timeout $TimeoutSeconds
    
    if ($completed) {
        $result = Receive-Job $job
        Remove-Job $job
        
        if ($result.ExitCode -eq 0) {
            Write-Host "Dependencies installed successfully!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "npm install failed with exit code: $($result.ExitCode)" -ForegroundColor Red
            Write-Host $result.Output
            return $false
        }
    } else {
        Write-Host "npm install timed out after $TimeoutSeconds seconds" -ForegroundColor Red
        Stop-Job $job
        Remove-Job $job -Force
        return $false
    }
}

# Clear npm cache if needed
if ($env:CLEAR_NPM_CACHE -eq "true") {
    Write-Host "Clearing npm cache..." -ForegroundColor Cyan
    npm cache clean --force
}

# Try to install dependencies with retries
$success = $false
for ($i = 1; $i -le $MaxRetries; $i++) {
    if (Install-NpmDependencies -Attempt $i) {
        $success = $true
        break
    }
    
    if ($i -lt $MaxRetries) {
        Write-Host "Waiting 10 seconds before retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $success) {
    Write-Host "`nAll attempts failed. Trying alternative approach with Bun..." -ForegroundColor Magenta
    
    # Try with Bun as fallback
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Host "Installing with Bun..." -ForegroundColor Cyan
        bun install --frozen-lockfile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully with Bun!" -ForegroundColor Green
            $success = $true
        }
    }
    
    if (-not $success) {
        Write-Host "`nFailed to install dependencies after all attempts" -ForegroundColor Red
        exit 1
    }
}

# Try to install onnxruntime-node separately if needed
Write-Host "`nChecking onnxruntime-node installation..." -ForegroundColor Cyan
node -e "require('onnxruntime-node')"
if ($LASTEXITCODE -eq 0) {
    Write-Host "onnxruntime-node is already installed" -ForegroundColor Green
} else {
    Write-Host "Installing onnxruntime-node separately..." -ForegroundColor Yellow
    node ./scripts/install-onnxruntime.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install onnxruntime-node" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

exit 0
