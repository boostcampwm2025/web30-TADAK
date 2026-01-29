# # 서버 리소스 모니터링 스크립트 (Windows PowerShell)
# # k6 테스트와 함께 실행하여 CPU/Memory 사용량 기록
# 서버 리소스 모니터링 스크립트 (V2 - 가독성 강화 버전)
$logDir = "logs"
if (-not (Test-Path -Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outputFile = Join-Path $logDir "resource-monitor-$timestamp.log"

# 터미널 출력용 헤더
$displayHeader = "{0,-20} | {1,-20} | {2,-10} | {3,-20} | {4,-10}" -f "TIMESTAMP", "CONTAINER", "CPU%", "MEM_USAGE", "MEM%"
$separator = "-" * 88

Write-Host "`n" + ("=" * 88) -ForegroundColor Cyan
Write-Host " Monitoring Started" -ForegroundColor Cyan
Write-Host " Output FIle: $outputFile" -ForegroundColor Gray
Write-Host " Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ("=" * 88) + "`n" -ForegroundColor Cyan

# 로그 파일 헤더 저장 (CSV 형태)
"TIMESTAMP,CONTAINER,CPU%,MEM_USAGE,MEM%" | Out-File -FilePath $outputFile -Encoding utf8

Write-Host $displayHeader -ForegroundColor Green
Write-Host $separator

try {
    while ($true) {
        $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        # Docker stats 수집 (한 번에 모든 컨테이너 정보 캡처)
        $stats = docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}"

        foreach ($line in $stats) {
            # 데이터 파싱
            $parts = $line.Split(',')
            if ($parts.Count -eq 4) {
                $name = $parts[0]
                $cpu  = $parts[1]
                $mem  = $parts[2]
                $memP = $parts[3]

                # 1. 파일 저장 (순수 데이터 CSV)
                "$now,$line" | Out-File -FilePath $outputFile -Append -Encoding utf8

                # 2. 터미널 출력 (정렬된 포맷)
                $displayText = "{0,-20} | {1,-20} | {2,10} | {3,20} | {4,10}" -f $now, $name, $cpu, $mem, $memP
                
                # 특정 수치가 높을 경우 색상 강조 (CPU 80% 이상 등 - 필요시 추가 가능)
                Write-Host $displayText
            }
        }
        
        # 0이 뜨는 타이밍 이슈를 줄이기 위해 1초 대기
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "`n`n" + ("=" * 88)
    Write-Host " Stopped Monitoring." -ForegroundColor Green
    Write-Host ("=" * 88)
}