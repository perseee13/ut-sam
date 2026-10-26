$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$raw = Get-Content $path -Raw
Write-Host 'RAW_LEN=' + $raw.Length
$lines = Get-Content $path
Write-Host ('LINE_COUNT=' + $lines.Length)
for ($i = 84; $i -le 88; $i++) {
  $line = $lines[$i - 1]
  $lead = 0
  $cs = $line.Length
  while ($lead -lt $cs -and $line[$lead] -eq ' ') { $lead++ }
  $rest = if ($lead -lt $cs) { $line.Substring($lead, [math]::Min(12, $cs - $lead)) } else { '' }
  Write-Host ('L' + $i + ':lead=' + $lead + ':rest=' + $rest)
}
