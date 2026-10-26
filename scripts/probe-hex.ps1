Add-Type -AssemblyName System.IO
$path = 'c:\Users\Admin\Downloads\Antoniano-ut-Project\client\src\components\AppHeader.jsx'
$bytes = [System.IO.File]::ReadAllBytes($path)
Write-Host 'LEN=' + $bytes.Length
Write-Host '--- HEX first 64 bytes ---'
$hex = [BitConverter]::ToString($bytes, 0, [Math]::Min(64, $bytes.Length)).Replace('-', ' ')
Write-Host $hex
# Check for runs of >=5 consecutive printable bytes
$five = $false; $cur = 0
for ($i = 0; $i -lt $bytes.Length; $i++) {
  if ($bytes[$i] -ge 0x20 -and $bytes[$i] -le 0x7E) { $cur++; if ($cur -ge 5) { $five = $true; break } }
  else { $cur = 0 }
}
Write-Host 'has5ConsecPrintable=' + $five
# Count double-spaces in a row (>=2 printable bytes)
$ds = 0; $cur=0
for ($i = 0; $i -lt $bytes.Length; $i++) {
  if ($bytes[$i] -ge 0x20 -and $bytes[$i] -le 0x7E) { $cur++; if ($cur -ge 2) { $ds++ } }
  else { $cur = 0 }
}
Write-Host 'doubleSpaceRuns(>=2)>=1=' + ($ds -gt 0)
