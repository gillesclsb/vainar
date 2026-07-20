$ports = @(3000, 5173)
$processIds = New-Object System.Collections.Generic.HashSet[int]

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

    foreach ($connection in $connections) {
        $id = [int]$connection.OwningProcess
        if ($id -gt 0) {
            [void]$processIds.Add($id)
        }
    }
}

if ($processIds.Count -eq 0) {
    Write-Host "Geen oude Vainaar-processen gevonden."
    exit 0
}

foreach ($id in $processIds) {
    $process = Get-Process -Id $id -ErrorAction SilentlyContinue

    if ($null -ne $process) {
        Write-Host "Proces $($process.ProcessName) met PID $id wordt afgesloten..."
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Milliseconds 600
Write-Host "Oude Vainaar-processen zijn afgesloten."
