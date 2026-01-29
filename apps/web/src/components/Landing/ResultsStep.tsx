import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Trophy } from 'lucide-react';

import TierBadge from '@/components/Common/TierBadge';

export const ResultsStep = () => {
  return (
    <section className="py-24 bg-bg-layer-1/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-brand font-bold tracking-wider uppercase mb-2 block">Step 04</span>
          <h2 className="text-4xl font-bold mb-4">승리의 짜릿함, 패배의 교훈</h2>
          <p className="text-lg text-base-secondary max-w-2xl mx-auto">
            배틀 종료 후 승점 획득과 코드 복기로 실력을 향상시키세요.
            <br />
            결과 화면에서 서로의 코드를 비교하고, 더 나은 해결책을 찾을 수 있습니다.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Main White Container */}
          <div className="bg-bg-layer-2 rounded-[40px] shadow-2xl p-8 md:p-12 border border-border-soft">
            {/* Header: 결과 */}
            <div className="flex flex-col items-center justify-center mb-12">
              <div className="w-14 h-14 bg-bg-layer-2 rounded-full flex items-center justify-center mb-3">
                <Trophy size={28} className="text-base-tertiary" />
              </div>
              <h3 className="text-2xl font-bold">결과</h3>
            </div>

            <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
              {/* Left Column: Player Cards */}
              <div className="space-y-6">
                {/* Winner Card */}
                <div className="bg-bg-layer-1 rounded-3xl p-6 border-2 border-brand shadow-[0_0_20px_rgba(var(--brand-rgb),0.15)] relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand/20 bg-bg-layer-1">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJtNobsvIjn7f-Th_s3o43CX8vTUPZ8rH0UnFl2g8Gf7F9SEXj2WVBxgPuKTbmMqjfDY84gSAHS_H7kQrOuwPcI86Ypc5nwXrWHZWCVLwk9PXAMImOlIIt1-r4Wt2fXITNutzobgOpbMiOPGsK3Y_mg1tqwwwJcfzKZXlb7QNXm1bd5OUAht0doTtpLs3RAnma2WXam6jlWO6kcfRNGiXLr1UDd_JLPirjVNIpJxxEUDe8Rw7IKdOeQTd_mPqwq9wRCLK02v4l7VQ"
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">CodeMaster</h4>
                        <TierBadge tier="Gold" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black leading-none">1450</div>
                      <div className="text-[10px] text-base-tertiary font-bold tracking-tighter">
                        RATE
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-layer-1 rounded-2xl p-5 grid grid-cols-[1fr_auto] gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/20 text-brand flex items-center justify-center">
                        <ArrowUp size={20} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="text-brand font-black text-xl leading-none">+25</div>
                        <div className="text-[10px] text-base-tertiary">랭크 변동</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex justify-between gap-4 text-[10px] font-bold">
                        <span className="text-base-tertiary">SCORE</span>
                        <span>10/10</span>
                      </div>
                      <div className="flex justify-between gap-4 text-[10px] font-bold">
                        <span className="text-base-tertiary">TIME</span>
                        <span>8:30</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loser Card */}
                <div className="bg-surface rounded-3xl p-6 border border-border-soft shadow-sm opacity-80">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border-soft bg-bg-layer-1">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAul0c1aIk8Sm3xFB3bXvACrQq_HBhcNROPjijDhcL34xu5hu2TVmSzf6gVGmCUQRyW-QtZnumdagFMvyHV2v7hHxxdV73wTe6RcyvZvSimTfbfrbHCBnNYLTT0mdLv4OmgMdO_dO9jm1E2J-IDf_zfhgMtUCd5Pbar6tP8IRC6nLyY3-GQ_3qQFKTu1zLfXqCM5nwxyPPrm9fwkblGJ7XxVf0tyW6VdwbzZIT24VlUIzshjoao8IX3aNukaY6CB7O2qoJXT4zGio"
                          alt="avatar"
                          className="w-full h-full object-cover opacity-60"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">AlgoKing</h4>
                        <TierBadge tier="Gold" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black leading-none text-base-tertiary">
                        1420
                      </div>
                      <div className="text-[10px] text-base-tertiary font-bold tracking-tighter">
                        RATE
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-layer-1 rounded-2xl p-5 grid grid-cols-[1fr_auto] gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                        <ArrowDown size={20} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="text-red-500 font-black text-xl leading-none">-25</div>
                        <div className="text-[10px] text-base-tertiary">랭크 변동</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex justify-between gap-4 text-[10px] font-bold">
                        <span className="text-base-tertiary">SCORE</span>
                        <span>5/10</span>
                      </div>
                      <div className="flex justify-between gap-4 text-[10px] font-bold">
                        <span className="text-base-tertiary">TIME</span>
                        <span>8:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Code Preview */}
              <div className="bg-bg-layer-1 rounded-3xl overflow-hidden shadow-inner border border-border-soft h-full flex flex-col">
                {/* Code Window Header */}
                <div className="bg-brand/20 p-4 px-6 flex justify-between items-center border-b border-brand/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJtNobsvIjn7f-Th_s3o43CX8vTUPZ8rH0UnFl2g8Gf7F9SEXj2WVBxgPuKTbmMqjfDY84gSAHS_H7kQrOuwPcI86Ypc5nwXrWHZWCVLwk9PXAMImOlIIt1-r4Wt2fXITNutzobgOpbMiOPGsK3Y_mg1tqwwwJcfzKZXlb7QNXm1bd5OUAht0doTtpLs3RAnma2WXam6jlWO6kcfRNGiXLr1UDd_JLPirjVNIpJxxEUDe8Rw7IKdOeQTd_mPqwq9wRCLK02v4l7VQ"
                        alt="avatar"
                      />
                    </div>
                    <span className="font-bold text-sm">CodeMaster</span>
                  </div>
                  <span className="text-[10px] font-black uppercase text-brand transform tracking-widest bg-white/50 px-3 py-1 rounded-full">
                    승리
                  </span>
                </div>

                {/* Code Content */}
                <div className="p-6 font-mono text-sm leading-6 flex-1 bg-bg-layer-1 overflow-hidden relative">
                  <div className="absolute left-0 top-0 w-10 h-full border-r border-slate-100 flex flex-col items-center pt-6 text-[10px] text-slate-300 gap-[2px]">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <div className="pl-10 space-y-0 text-ink">
                    <p>
                      <span className="text-blue-600">function</span>{' '}
                      <span className="text-purple-600">solution</span>() &#123;
                    </p>
                    <p className="pl-6">
                      <span className="text-blue-600">return</span>{' '}
                      <span className="text-orange-600">test</span>;
                    </p>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <p key={i} className="pl-6 text-slate-400">
                        test1...
                      </p>
                    ))}
                    <p>&#125;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
