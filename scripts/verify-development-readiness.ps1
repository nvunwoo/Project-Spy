[CmdletBinding()]
param(
    [switch] $RequireLocalSupabase,
    [switch] $RequireVercelCli
)

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

$containerRuntime = $null
$containerServerVersion = $null
foreach ($candidate in @('docker', 'podman')) {
    if (-not (Get-Command $candidate -ErrorAction SilentlyContinue)) {
        continue
    }

    try {
        $serverVersion = & $candidate version --format '{{.Server.Version}}' 2>$null | Select-Object -First 1
        if (($LASTEXITCODE -eq 0) -and $serverVersion) {
            $containerRuntime = $candidate
            $containerServerVersion = $serverVersion.ToString().Trim()
            break
        }
    } catch {
        $containerRuntime = $null
        $containerServerVersion = $null
    }
}

$projectSupabasePath = Join-Path -Path (Get-Location).Path -ChildPath 'node_modules\.bin\supabase.cmd'
$projectVercelPath = Join-Path -Path (Get-Location).Path -ChildPath 'node_modules\.bin\vercel.cmd'
$projectSupabaseVersion = $null
$projectVercelVersion = $null
$projectSupabaseDeclared = $false
$projectVercelDeclared = $false
$pnpmLockPresent = Test-Path -LiteralPath (Join-Path -Path (Get-Location).Path -ChildPath 'pnpm-lock.yaml')
$packageJsonPath = Join-Path -Path (Get-Location).Path -ChildPath 'package.json'
if (Test-Path -LiteralPath $packageJsonPath) {
    try {
        $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw -Encoding utf8 | ConvertFrom-Json
        $projectSupabaseDeclared = $null -ne $packageJson.devDependencies.supabase
        $projectVercelDeclared = $null -ne $packageJson.devDependencies.vercel
    } catch {
        $projectSupabaseDeclared = $false
        $projectVercelDeclared = $false
    }
}
if (Test-Path -LiteralPath $projectSupabasePath) {
    $projectSupabaseVersion = & $projectSupabasePath --version 2>$null | Select-Object -First 1
    if ($projectSupabaseVersion) {
        $projectSupabaseVersion = $projectSupabaseVersion.ToString().Trim()
    }
}
if (Test-Path -LiteralPath $projectVercelPath) {
    $projectVercelVersion = & $projectVercelPath --version 2>$null | Select-Object -First 1
    if ($projectVercelVersion) {
        $projectVercelVersion = $projectVercelVersion.ToString().Trim()
    }
}

$containerDetail = if ($containerRuntime) {
    ('{0} server {1}' -f $containerRuntime, $containerServerVersion)
} else {
    'Docker API-compatible daemon not available'
}
$supabaseDetail = if ($projectSupabaseDeclared -and $projectSupabaseVersion) {
    ('project devDependency {0}' -f $projectSupabaseVersion)
} elseif (-not $projectSupabaseDeclared) {
    'package.json does not declare devDependency supabase'
} else {
    'project Supabase CLI executable is not installed'
}
$vercelDetail = if ($projectVercelDeclared -and $projectVercelVersion -and $pnpmLockPresent) {
    ('project devDependency {0} with pnpm lockfile' -f $projectVercelVersion)
} elseif (-not $projectVercelDeclared) {
    'package.json does not declare devDependency vercel'
} elseif (-not $pnpmLockPresent) {
    'pnpm-lock.yaml is missing'
} else {
    'project Vercel CLI executable is not installed'
}

if ($RequireLocalSupabase) {
    Write-Check -Name 'Local container runtime' -Passed ($null -ne $containerRuntime) -Detail $containerDetail
    Write-Check -Name 'Project Supabase CLI' -Passed ($projectSupabaseDeclared -and ($null -ne $projectSupabaseVersion)) -Detail $supabaseDetail
} else {
    Write-Host ('[INFO] Local container runtime: {0}' -f $containerDetail)
    Write-Host ('[INFO] Project Supabase CLI: {0}' -f $supabaseDetail)
    Write-Host '[INFO] Local backend gate is not required in this run. Use -RequireLocalSupabase before starting the Local Supabase phase.'
}

if ($RequireVercelCli) {
    Write-Check -Name 'Project Vercel CLI' -Passed ($projectVercelDeclared -and ($null -ne $projectVercelVersion) -and $pnpmLockPresent) -Detail $vercelDetail
} else {
    Write-Host ('[INFO] Project Vercel CLI: {0}' -f $vercelDetail)
    Write-Host '[INFO] Vercel integration gate is not required in this run. Use -RequireVercelCli before Vercel project create/link or Production work.'
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host ('Readiness failed with {0} required item(s).' -f $failures.Count)
    exit 1
}

Write-Host ''
if ($RequireLocalSupabase -or $RequireVercelCli) {
    Write-Host 'Core app and requested project integration prerequisites are ready. This does not verify accounts, remote projects, deployments, or runtime game behavior.'
} else {
    Write-Host 'Core app prerequisites are ready. Local Supabase and Vercel project prerequisites were informational only; this does not verify accounts, database projects, deployments, or runtime game behavior.'
}
