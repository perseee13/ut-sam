$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$content = Get-Content $path -Raw
$hasTab = $content -match '\t'
Write-Host 'HAS_TAB=' + $hasTab -ForegroundColor Yellow
if ($hasTab) {
  $lines = $content -split '\r?\n'
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '\t') { Write-Host ('TAB at line ' + ($i + 1)) -ForegroundColor Yellow }
  }
}
