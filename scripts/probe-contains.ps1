$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$text = [System.IO.File]::ReadAllText($path)
Write-Host ('LEN=' + $text.Length)
Write-Host ('HAS_IMPORT=' + ($text -like '*import { useEffect*'))
Write-Host ('HAS_NAV=' + ($text -like '*to="/file-server"*'))
$linesLf = $text -split "`n"
Write-Host ('LF_LINES=' + $linesLf.Length)
$linesCr = $text -split "`r`n"
Write-Host ('CRLF_LINES=' + $linesCr.Length)
for ($i = 84; $i -le 88; $i++) {
  if ($i -le $linesLf.Length) {
    $line = $linesLf[$i - 1]
    $lead = 0
    $cs = $line.Length
    while ($lead -lt $cs -and $line[$lead] -eq ' ') { $lead++ }
    $rest = if ($lead -lt $cs) { $line.Substring($lead, [math]::Min(12, $cs - $lead)) } else { '' }
    Write-Host ('L' + $i + ':lead=' + $lead + ':rest=' + $rest)
  } else {
    Write-Host ('L' + $i + ':OUT_OF_RANGE')
  }
}
