$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$raw = Get-Content $path -Raw
$hasCr = $raw -match '\r\n'
Write-Host 'HAS_CRLF=' + $hasCr -ForegroundColor Yellow
$lines = $raw -split '\r?\n'
for ($i = 85; $i -le 88; $i++) {
  Write-Host ('L' + $i.ToString('000') + ' len=' + $lines[$i - 1].Length.ToString('000') + ' : ' + $lines[$i - 1])
}
