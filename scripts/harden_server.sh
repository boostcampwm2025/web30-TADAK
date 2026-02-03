#!/bin/bash

# =================================================================
# 네이버 클라우드 서버 보안 강화 스크립트 (SSH Bruteforce 대응)
# =================================================================

# 주의: 이 스크립트는 sudo 권한으로 실행해야 합니다.
# 사용법: sudo bash harden_server.sh

NEW_SSH_PORT=2022

echo "[1/5] 패키지 업데이트 및 필수 도구 설치..."
sudo apt-get update
sudo apt-get install -y fail2ban ufw

echo "[2/5] SSH 구성 변경 (기본 포트 22 -> $NEW_SSH_PORT)..."
# SSH 포트 변경
sudo sed -i "s/^#Port 22/Port $NEW_SSH_PORT/" /etc/ssh/sshd_config
sudo sed -i "s/^Port 22/Port $NEW_SSH_PORT/" /etc/ssh/sshd_config

# Root 로그인 비활성화
sudo sed -i "s/^#PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config
sudo sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" /etc/ssh/sshd_config

# 비밀번호 인증 비활성화 (SSH 키 필수)
# 주의: 실행 전 반드시 SSH 키 접속이 되는지 확인해야 합니다.
sudo sed -i "s/^#PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config
sudo sed -i "s/^PasswordAuthentication.*/PasswordAuthentication no/" /etc/ssh/sshd_config

echo "[3/5] UFW 방화벽 설정..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow $NEW_SSH_PORT/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
echo "y" | sudo ufw enable

echo "[4/5] Fail2ban 설정 (SSH 보호)..."
cat <<EOF | sudo tee /etc/fail2ban/jail.local
[sshd]
enabled = true
port = $NEW_SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h
findtime = 10m
EOF

sudo systemctl restart fail2ban

echo "[5/5] SSH 서비스 재시작..."
sudo sshd -t # 설정 파일 문법 검사
if [ $? -eq 0 ]; then
    sudo systemctl restart ssh
    echo "==============================================================="
    echo "보안 강화가 완료되었습니다!"
    echo "새로운 SSH 포트: $NEW_SSH_PORT"
    echo "비밀번호 인증: 비활성화 (SSH 키 필요)"
    echo "Fail2ban: 활성화 (5회 실패 시 1시간 차단)"
    echo "==============================================================="
    echo "중요: 현재 터미널을 종료하지 마세요!"
    echo "새 터미널 창에서 [ssh -p $NEW_SSH_PORT user@ip] 명령어로 접속되는지"
    echo "반드시 먼저 확인한 후에 현재 창을 종료하시기 바랍니다."
else
    echo "SSH 설정 파일에 오류가 있습니다. 변경 사항을 확인해 주세요."
fi
