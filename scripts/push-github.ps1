# ============================================
# 🚀 PUSH LOCAL AI AGENT TO GITHUB
# ============================================

Write-Host ""
Write-Host "🚀 Starting GitHub push process..."
Write-Host ""

# ============================================
# CHECK GIT
# ============================================

$gitInstalled =
Get-Command git -ErrorAction SilentlyContinue

if (-not $gitInstalled) {

    Write-Host ""
    Write-Host "❌ Git not installed."
    Write-Host ""

    exit
}

# ============================================
# CHECK PACKAGE
# ============================================

if (-not (Test-Path "package.json")) {

    Write-Host ""
    Write-Host "❌ package.json not found."
    Write-Host ""

    exit
}

# ============================================
# CHECK REMOTE
# ============================================

$remote =
git remote -v

if (-not $remote) {

    Write-Host ""
    Write-Host "❌ Git remote not configured."
    Write-Host ""

    Write-Host "Example:"
    Write-Host "git remote add origin https://github.com/USER/REPO.git"
    Write-Host ""

    exit
}

# ============================================
# CHECK STATUS
# ============================================

Write-Host ""
Write-Host "📄 Git status:"
Write-Host ""

git status

# ============================================
# ADD FILES
# ============================================

Write-Host ""
Write-Host "📦 Adding files..."
Write-Host ""

git add .

# ============================================
# COMMIT
# ============================================

$commitMessage =
Read-Host "📝 Commit message"

if (-not $commitMessage) {

    $commitMessage =
    "update local ai agent"
}

Write-Host ""
Write-Host "💾 Creating commit..."
Write-Host ""

git commit -m "$commitMessage"

# ============================================
# PUSH
# ============================================

Write-Host ""
Write-Host "🚀 Pushing to GitHub..."
Write-Host ""

git push origin main

# ============================================
# CHECK PUSH RESULT
# ============================================

if ($LASTEXITCODE -eq 0) {

    Write-Host ""
    Write-Host "✅ PUSH SUCCESSFUL!"
    Write-Host ""

} else {

    Write-Host ""
    Write-Host "❌ PUSH FAILED."
    Write-Host ""

    exit
}

# ============================================
# TEST API
# ============================================

Write-Host ""
Write-Host "🧪 Testing API..."
Write-Host ""

try {

    $response =
    Invoke-RestMethod `
      -Uri "http://localhost:3000" `
      -Method GET

    Write-Host ""
    Write-Host "✅ API ONLINE"
    Write-Host ""

    $response

} catch {

    Write-Host ""
    Write-Host "⚠️ API test failed."
    Write-Host ""

}

# ============================================
# FINAL STATUS
# ============================================

Write-Host ""
Write-Host "🎉 PROCESS COMPLETED"
Write-Host ""

git status

Write-Host ""
Write-Host "🚀 Local AI Agent synced with GitHub."
Write-Host ""