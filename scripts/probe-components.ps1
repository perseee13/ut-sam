$root = 'c:/Users/Admin/Downloads/Antoniano-ut-Project'
$dir = $root + '\client\src\components'
if (Test-Path $dir) {
  Get-ChildItem -Path $dir | Sort-Object Name | ForEach-Object {
    Write-Host $_.Name ' (' + $_.Length + ' bytes)'
  }
} else {
  Write-Host 'components dir does NOT exist'
}
