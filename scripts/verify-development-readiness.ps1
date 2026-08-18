[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Write-Check {
    param(
        [Parameter(Mandatory)] [string] $Name,
        [Parameter(Mandatory)] [bool] $Passed,
        [Parameter(Mandatory)] [string] $Detail
    )

    $label = if ($Passed) { 'PASS' } else { 'FAIL' }
    Write-Host ('[{0}] {1}: {2}' -f $label, $Name, $Detail)
    if (-not $Passed) {
        $script:failures.Add(('{0}: {1}' -f $Name, $Detail))
    }
}

function Get-ToolVersion {
    param(
        [Parameter(Mandatory)] [string] $Command,
        [string[]] $Arguments = @('--version')
    )

    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        return $null
    }

    $value = & $Command @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return ($value | Select-Object -First 1).ToString().Trim()
}

$gitVersion = Get-ToolVersion -Command 'git'
Write-Check -Name 'Git' -Passed ($null -ne $gitVersion) -Detail $(if ($gitVersion) { $gitVersion } else { 'not found on PATH' })

$nodeVersion = Get-ToolVersion -Command 'node'
$nodeMajor = if ($nodeVersion -match '^v?(\d+)\.') { [int] $Matches[1] } else { $null }
Write-Check -Name 'Node.js 24 LTS' -Passed ($nodeMajor -eq 24) -Detail $(if ($nodeVersion) { $nodeVersion } else { 'not found on PATH' })

$npmVersion = Get-ToolVersion -Command 'npm'
Write-Check -Name 'npm' -Passed ($null -ne $npmVersion) -Detail $(if ($npmVersion) { $npmVersion } else { 'not found on PATH' })

$pnpmVersion = Get-ToolVersion -Command 'pnpm'
$pnpmMajor = if ($pnpmVersion -match '^(\d+)\.') { [int] $Matches[1] } else { $null }
$pnpmCommand = Get-Command 'pnpm' -ErrorAction SilentlyContinue
$pnpmSource = if ($pnpmCommand) { $pnpmCommand.Source } else { $null }
$pnpmIsCodexBundled = $pnpmSource -match '[\\/]\.cache[\\/]codex-runtimes[\\/]'
$pnpmDetail = if (-not $pnpmVersion) {
    'not found on PATH'
} elseif ($pnpmIsCodexBundled) {
    ('{0} at {1} (Codex-bundled only; install a durable system pnpm 11)' -f $pnpmVersion, $pnpmSource)
} else {
    ('{0} at {1}' -f $pnpmVersion, $pnpmSource)
}
Write-Check -Name 'pnpm 11' -Passed (($pnpmMajor -eq 11) -and (-not $pnpmIsCodexBundled)) -Detail $pnpmDetail

if ($gitVersion) {
    $repoRoot = (git rev-parse --show-toplevel 2>$null).Trim()
    $trimSeparators = [char[]] @([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
    $actualRoot = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd($trimSeparators)
    $expectedRoot = (Resolve-Path -LiteralPath (Get-Location).Path).Path.TrimEnd($trimSeparators)
    Write-Check -Name 'Repository root' -Passed ($actualRoot -eq $expectedRoot) -Detail $repoRoot

    $origin = (git remote get-url origin 2>$null).Trim()
    Write-Check -Name 'GitHub origin' -Passed ($origin -eq 'https://github.com/nvunwoo/Project-Spy.git') -Detail $(if ($origin) { $origin } else { 'origin is not configured' })
}

$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
)
$edgePaths = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
Write-Check -Name 'Google Chrome' -Passed ([bool] ($chromePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)) -Detail 'desktop browser required for local WebGL2 checks'
Write-Check -Name 'Microsoft Edge' -Passed ([bool] ($edgePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)) -Detail 'desktop browser required for local WebGL2 checks'

$optional = @('gh', 'vercel')
foreach ($command in $optional) {
    $version = Get-ToolVersion -Command $command
    $detail = if ($version) { $version } else { 'optional; install or use as a project dependency after implementation starts' }
    Write-Host ('[INFO] {0}: {1}' -f $command, $detail)
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host ('Readiness failed with {0} required item(s).' -f $failures.Count)
    exit 1
}

Write-Host ''
Write-Host 'Local development prerequisites are ready. This does not verify accounts, database projects, deployments, or runtime game behavior.'
