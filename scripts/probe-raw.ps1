Add-Type -AssemblyName System.IO
$path = 'c:\Users\Admin\Downloads\Antoniano-ut-Project\client\src\components\AppHeader.jsx'
$text = [System.IO.File]::ReadAllText($path)
Write-Host 'TEXT_LEN=' + $text.Length
Write-Host 'HAS_FILE_SERVER=' + ($text -like '*file-server*')
Write-Host 'HAS_IMPORT=' + ($text -like '*import*')
Write-Host 'HAS_ISLOGGEDIN=' + ($text -like '*isLoggedIn*')
Write-Host 'HAS_TO_FILE_SERVER=' + ($text -like '*to="/file-server"*')
Write-Host 'HAS_TO_MAIL_SERVER=' + ($text -like '*to="/mail-server"*')
Write-Host '--- FIRST 300 CHARS ---'
Write-Host $text.Substring(0, [math]::Min(300, $text.Length))
$lines = $text.Split([char]10)
Write-Host 'Split LF lines=' + $lines.Length

