$root = 'c:/Users/Admin/Downloads/Antoniano-ut-Project'
Get-ChildItem -Path $root -Directory | Sort-Object Name | ForEach-Object {
  Write-Host 'DIR  ' + $_.Name
}
Get-ChildItem -Path $root -File | Sort-Object Name | Select-Object -First 20 | ForEach-Object {
  Write-Host 'FILE ' + $_.Name + ' (' + $_.Length + ' bytes)'
}
