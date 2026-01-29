import { motion } from 'framer-motion';
import { Circle, Eye, MessageCircle } from 'lucide-react';

export const SpectatingStep = () => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand font-bold tracking-wider uppercase mb-2 block">
              Step 03
            </span>
            <h2 className="text-4xl font-bold mb-6">
              혼자가 아닙니다.
              <br />
              함께 배우는 관전 모드
            </h2>
            <p className="text-lg text-base-secondary mb-8 leading-relaxed">
              내가 배틀 중이 아닐 때도 TADAK은 즐겁습니다.
              <br />
              현재 진행 중인 고수들의 배틀을 실시간으로 관전하세요.
              <br />
              <br />
              채팅으로 다른 관전자들과 의견을 나누고, 고수의 문제 풀이 방식을 어깨너머로 배울 수
              있습니다. 고수들의 코딩 과정을 실시간 채팅과 함께 관전하며 배워보세요.
            </p>
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-bg-layer-1 rounded-lg text-sm font-medium flex items-center gap-2">
                <Circle size={12} className="text-red-500 fill-red-500 animate-pulse" /> LIVE 배틀
                목록
              </div>
              <div className="px-4 py-2 bg-bg-layer-1 rounded-lg text-sm font-medium flex items-center gap-2">
                <MessageCircle size={16} className="text-blue-500" /> 실시간 채팅
              </div>
            </div>
          </motion.div>
          <motion.div
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-bg-layer-2 rounded-2xl shadow-xl overflow-hidden border border-border-soft">
              <div className="p-4 border-b border-border-soft flex justify-between items-center bg-bg-layer-1">
                <div className="flex items-center gap-2">
                  <span className="animate-pulse w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="font-bold text-red-500">LIVE</span>
                  <span className="text-base-tertiary text-sm">CodeMaster vs AlgoKing</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Eye size={16} />
                  142명 관전 중
                </div>
              </div>
              <div className="flex h-80">
                <div className="flex-1 p-6 bg-bg-layer-2 text-base-secondary font-mono text-xs overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-bg-layer-2/50 pointer-events-none"></div>
                  <div className="opacity-50">
                    // Player 1&apos;s Screen
                    <br />
                    const dp = new Array(n).fill(0);
                    <br />
                    dp[0] = arr[0];
                    <br />
                    for(let i=1; i&lt;n; i++) &#123;
                    <br />
                    &nbsp;&nbsp;dp[i] = Math.max(dp[i-1] + arr[i], arr[i]);
                    <br />
                    &#125;
                    <br />
                    return Math.max(...dp);
                  </div>
                </div>
                <div className="w-1/3 border-l border-border-soft bg-bg-layer-2 flex flex-col">
                  <div className="p-3 bg-bg-layer-1 text-xs font-bold">실시간 채팅</div>
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-200 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-base-secondary">dev_lee</p>
                        <p className="text-base-tertiary">와 저기서 DP를 쓰네</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-200 flex-shrink-0"></div>
                      <div>
                        <p className="font-bold text-base-secondary">coding_cat</p>
                        <div className="bg-brand text-slate-900 p-2 rounded-lg rounded-tl-none mt-1">
                          안녕하세요!
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border-soft">
                    <div className="w-full text-xs p-2 rounded bg-bg-layer-1 text-base-tertiary">
                      메시지 입력...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
