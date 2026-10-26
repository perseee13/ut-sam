$path = 'c:/Users/Admin/Downloads/Antoniano-ut-Project/client/src/components/AppHeader.jsx'
$content = Get-Content $path -Raw
$content = $content -replace "`r`n", "`n"
$old = @'
           <NavLink to="/file-server" onClick={closeMenu}>File Server</NavLink>
           <NavLink to="/mail-server" onClick={closeMenu}>Mail Server</NavLink>
'@
$new = @'
           {isLoggedIn ? (
             <>
               <NavLink to="/file-server" onClick={closeMenu}>File Server</NavLink>
               <NavLink to="/mail-server" onClick={closeMenu}>Mail Server</NavLink>
             </>
           ) : null}
'@
if ($content -match [regex]::Escape($old)) {
  $content = $content -replace [regex]::Escape($old), $new
  $content | Set-Content $path -Encoding utf8
  Write-Host 'DONE' -ForegroundColor Green
} else {
  Write-Host 'NOT FOUND' -ForegroundColor Red
}
