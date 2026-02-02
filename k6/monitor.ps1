# 서버 리소스 모니터링 스크립트 (V3.1 - 수정 버전)
$logDir = "logs"
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $logDir "resource-monitor-$timestamp.log"

# 상태 관리 및 데이터 저장소 (강력한 타입 지정)
$script:state = "BEFORE"
$script:beforeData = @{}
$script:testingData = @{}

Write-Host "`n====================================================================================================" -ForegroundColor Cyan
Write-Host " Resource Monitoring (Test Mode)" -ForegroundColor Cyan
Write-Host " [S] Start Recording    [Q] Stop and Show Results" -ForegroundColor Yellow
Write-Host "====================================================================================================`n"

"TIMESTAMP,CONTAINER,CPU%,MEM_USAGE,MEM%,STATE" | Out-File -FilePath $outputFile -Encoding utf8

function Parse-Percentage($value) {
    if ($value -match "([0-9.]+)") {
        return [double]$matches[1]
    }
    return 0.0
}

function Show-Results {
    Write-Host "`n`n====================================================================================================" -ForegroundColor Cyan
    Write-Host " TEST RESULTS SUMMARY" -ForegroundColor Cyan
    Write-Host "====================================================================================================" -ForegroundColor Cyan

    Write-Host "`n[Before Test - Last Values]" -ForegroundColor Yellow
    foreach ($key in $script:beforeData.Keys) {
        $d = $script:beforeData[$key]
        Write-Host ("{0,-30} | CPU: {1,8}% | MEM: {2,8}%" -f $key, $d.CPU, $d.MEM)
    }

    Write-Host "`n[During Test - Statistics]" -ForegroundColor Yellow
    Write-Host ("{0,-25} | {1,8} | {2,8} | {3,8} | {4,8} | {5,8} | {6,8}" -f "CONTAINER", "CPU_MIN", "CPU_MAX", "CPU_AVG", "MEM_MIN", "MEM_MAX", "MEM_AVG")
    Write-Host ("-" * 105)

    if ($script:testingData.Count -eq 0) {
        Write-Host "No data collected during TESTING state. (Did you press 'S'?)" -ForegroundColor Red
    } else {
        foreach ($key in $script:testingData.Keys) {
            $cpus = $script:testingData[$key].CPU
            $mems = $script:testingData[$key].MEM
            
            if ($cpus.Count -gt 0) {
                $cpuStat = $cpus | Measure-Object -Average -Minimum -Maximum
                $memStat = $mems | Measure-Object -Average -Minimum -Maximum
                
                Write-Host ("{0,-25} | {1,7}% | {2,7}% | {3,7}% | {4,7}% | {5,7}% | {6,7}%" -f `
                    $key, 
                    [math]::Round($cpuStat.Minimum, 2), [math]::Round($cpuStat.Maximum, 2), [math]::Round($cpuStat.Average, 2),
                    [math]::Round($memStat.Minimum, 2), [math]::Round($memStat.Maximum, 2), [math]::Round($memStat.Average, 2))
            }
        }
    }
}

while ($true) {
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        if ($key.Key -eq "S" -and $script:state -eq "BEFORE") {
            $script:state = "TESTING"
            Write-Host "`n[!!!] RECORDING STARTED - DATA IS NOW BEING COLLECTED [!!!]`n" -ForegroundColor Green
        }
        elseif ($key.Key -eq "Q") {
            Write-Host "`n[!!!] STOPPING... PLEASE WAIT FOR SUMMARY [!!!]`n" -ForegroundColor Red
            break
        }
    }

    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $stats = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" 2>$null

    if ($null -ne $stats) {
        foreach ($line in $stats) {
            $parts = $line.Split(',')
            if ($parts.Count -lt 4) { continue }

            $name = $parts[0].Trim(); $cpu = $parts[1].Trim(); $mem = $parts[2].Trim(); $memP = $parts[3].Trim()
            $cpuVal = Parse-Percentage $cpu
            $memVal = Parse-Percentage $memP

            "$now,$name,$cpu,$mem,$memP,$($script:state)" | Out-File -FilePath $outputFile -Append -Encoding utf8

            if ($script:state -eq "BEFORE") {
                $script:beforeData[$name] = @{ CPU = $cpuVal; MEM = $memVal }
            }
            elseif ($script:state -eq "TESTING") {
                if (-not $script:testingData.ContainsKey($name)) {
                    $script:testingData[$name] = @{ CPU = New-Object System.Collections.Generic.List[double]; MEM = New-Object System.Collections.Generic.List[double] }
                }
                $script:testingData[$name].CPU.Add($cpuVal)
                $script:testingData[$name].MEM.Add($memVal)
            }

            $color = if ($script:state -eq "TESTING") { "Yellow" } else { "Gray" }
            Write-Host ("{0,-20} | {1,-25} | {2,10} | {3,10} | {4,10} | {5,-10}" -f $now, $name, $cpu, $memP, "", $script:state) -ForegroundColor $color
        }
    }
    Start-Sleep -Seconds 1
}

Show-Results