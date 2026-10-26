$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$lines = Get-Content $path
for ($i = 84; $i -le 125; $i++) {
  Write-Host ('L' + $i.ToString('000') + ':[' + $lines[$i - 1] + ']')
}
