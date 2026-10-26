$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$raw = Get-Content $path -Raw
Write-Host 'HAS_CR=' + ($raw -match '`r')
Write-Host 'HAS_CRLF=' + ($raw -match "`r`n")
$content = $raw -replace "`r`n", "`n"
$lines = $content -split "`n"
Write-Host ('TOTAL_AFTER_NORM=' + $lines.Length)
for ($i = 84; $i -le 88; $i++) {
  $line = $lines[$i - 1]
  $lead = 0
  $cs = $line.Length
  while ($lead -lt $cs -and $line[$lead] -eq ' ') { $lead++ }
  $rest = if ($lead -lt $cs) { $line.Substring($lead, [math]::Min(12, $cs - $lead)) } else { '' }
  Write-Host ('L' + $i + ':lead=' + $lead + ':rest=' + $rest)
}
