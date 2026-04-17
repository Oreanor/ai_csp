# One entry point for local dev (STT + Next). Same as: npm run start:local
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$here = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
Set-Location (Split-Path -Parent $here)
node (Join-Path $here "start-local.mjs") @args
