# Copy VITE_FIREBASE_* from HiClarify .env to HiSense .env.local (NEXT_PUBLIC_FIREBASE_*).
# Usage: .\copy-firebase-env.ps1 [path-to-hiclarify-.env]
$ErrorActionPreference = "Stop"
$hiclarifyEnv = if ($args[0]) { $args[0] } else { "C:\Users\New User\Desktop\hiclarify\.env" }
$hiseenseEnv = "C:\Users\New User\Documents\HiSense\.env.local"

if (-not (Test-Path $hiclarifyEnv)) {
  Write-Host "Source not found: $hiclarifyEnv"
  Write-Host "Create it or run: .\copy-firebase-env.ps1 C:\path\to\hiclarify\.env"
  exit 1
}

$content = Get-Content -Raw $hiclarifyEnv
$vars = @{}
foreach ($line in ($content -split "`n")) {
  if ($line -match '^\s*VITE_FIREBASE_(.+?)\s*=\s*(.*)$') {
    $vars["NEXT_PUBLIC_FIREBASE_$($matches[1])"] = $matches[2].Trim()
  }
}

$keys = @(
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID"
)

$out = @"
# Copy from HiClarify .env (VITE_FIREBASE_* → paste here). Do not commit.
# HiClarify: src/firebaseConfig.js, src/lib/firebaseClient.js use VITE_FIREBASE_*

"@
foreach ($k in $keys) {
  $out += "$k=$($vars[$k])`n"
}
$out = $out.TrimEnd()

Set-Content -Path $hiseenseEnv -Value $out

Write-Host "Updated $hiseenseEnv with Firebase config from $hiclarifyEnv"
foreach ($k in $keys) {
  $v = $vars[$k]
  $preview = if ($v.Length -gt 8) { $v.Substring(0,8) + "..." } else { $v }
  Write-Host "  $k = $preview"
}
