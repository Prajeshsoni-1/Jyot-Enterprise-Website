Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Join-Path (Get-Location) "jyotenterprise-live-build.zip"))
Write-Output "TOTAL ENTRIES: $($zip.Entries.Count)"
$rootFiles = $zip.Entries | Where-Object { $_.FullName -notmatch '[\\/]' } | Select-Object -ExpandProperty FullName
Write-Output "ROOT FILES:"
$rootFiles | ForEach-Object { Write-Output " - $_" }
$dirs = $zip.Entries | Where-Object { $_.FullName -match '[\\/]' } | ForEach-Object { ($_.FullName -split '[\\/]')[0] } | Select-Object -Unique
Write-Output "DIRECTORIES:"
$dirs | ForEach-Object { Write-Output " - $_" }
$zip.Dispose()
