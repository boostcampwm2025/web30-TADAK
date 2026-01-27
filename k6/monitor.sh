#!/bin/bash
# Server Resource Monitoring Script (Bash V2 - Standardized Format)
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

TIMESTAMP_FILE=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="$LOG_DIR/resource-monitor-$TIMESTAMP_FILE.log"

echo "===================================================================================="
echo "  Monitoring Started"
echo " Output File: $OUTPUT_FILE"
echo " Press Ctrl+C to stop"
echo "===================================================================================="

# Header for CSV file
echo "TIMESTAMP,CONTAINER,CPU%,MEM_USAGE,MEM_LIMIT,MEM%" > "$OUTPUT_FILE"

# Display Header for Terminal (Beautifully Aligned)
printf "%-20s | %-20s | %-10s | %-20s | %-10s\n" "TIMESTAMP" "CONTAINER" "CPU%" "MEM_USAGE" "MEM%"
echo "------------------------------------------------------------------------------------"

while true; do
  NOW=$(date '+%Y-%m-%d %H:%M:%S')

  # Capture docker stats (Name, CPU, MemUsage / Limit, MemPerc)
  # We use --format to get clean data for both log and display
  docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}}" | while IFS=',' read -r NAME CPU MEM_RAW MEM_PERC; do
    
    # 1. Save to File (CSV Format)
    # Reconstructing the MEM_USAGE and LIMIT for the CSV if needed, 
    # but here we keep it simple as per docker's raw output
    echo "$NOW,$NAME,$CPU,$MEM_RAW,$MEM_PERC" >> "$OUTPUT_FILE"

    # 2. Print to Terminal (Formatted Table)
    printf "%-20s | %-20s | %10s | %-20s | %10s\n" "$NOW" "$NAME" "$CPU" "$MEM_RAW" "$MEM_PERC"
  done

  sleep 1
done