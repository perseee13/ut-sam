$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$content = Get-Content $path -Raw
$content = $content -replace '\r\n', '\n'
$lines = $content -split '\n'
for ($i = 84; $i -le 88; $i++) {
  Write-Host ('L' + $i.ToString('000') + ' len=' + $lines[$i - 1].Length.ToString('000') + ' : ' + $lines[$i - 1])
}
