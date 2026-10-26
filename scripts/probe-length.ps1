$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$content = Get-Content $path -Raw
Write-Host 'LENGTH=' + $content.Length
Write-Host 'FIRST50=' + $content.Substring(0, [math]::Min(50, $content.Length))
