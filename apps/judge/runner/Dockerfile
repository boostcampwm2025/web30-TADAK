# Base Image
FROM node:20-alpine

# 2. 일반 사용자 'coder' 계정 생성
RUN addgroup -S coder && adduser -S coder -G coder

# 3. 불필요한 도구 삭제 (보안 강화)
RUN rm -rf /usr/local/bin/npm /usr/local/bin/npx /usr/local/lib/node_modules \
    && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

# 4. 네트워크 도구 삭제
RUN rm -f /usr/bin/curl /usr/bin/wget

# 5. 작업 디렉토리 설정 및 파일 복사
WORKDIR /runner

COPY run.js .

# 6. 소유권 변경 및 사용자 전환
RUN chown -R coder:coder /runner

USER coder

# 7. 기본 실행 명령어
CMD ["node", "run.js"]
