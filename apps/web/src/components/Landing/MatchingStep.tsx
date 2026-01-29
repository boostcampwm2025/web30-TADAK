import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export const MatchingStep = () => {
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            className="lg:w-1/2 relative order-2 lg:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-border-soft bg-surface transform transition-transform duration-500 hover:rotate-0 rotate-y-6">
              <div className="p-8 flex flex-col items-center justify-center min-h-[400px] bg-bg-layer-1">
                <div className="w-24 h-24 border-4 border-brand border-t-transparent rounded-full animate-spin mb-8"></div>
                <h3 className="text-2xl font-bold mb-2">상대를 찾는 중...</h3>
                <p className="text-base-tertiary mb-8">
                  티어에서 비슷한 실력의 상대를 매칭하고 있습니다
                </p>
                <div className="px-6 py-2 bg-base-muted rounded-full text-sm font-medium text-base-secondary mb-12">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span> 대기
                  시간: 8초
                </div>
                <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                  <div className="bg-bg-layer-2 p-4 rounded-xl text-center">
                    <div className="text-brand font-bold text-2xl">13</div>
                    <div className="text-xs text-base-tertiary mt-1">대기 중인 플레이어</div>
                  </div>
                  <div className="bg-bg-layer-2 p-4 rounded-xl text-center">
                    <div className="text-brand font-bold text-2xl">24</div>
                    <div className="text-xs text-base-tertiary mt-1">진행 중인 배틀</div>
                  </div>
                  <div className="bg-bg-layer-2 p-4 rounded-xl text-center">
                    <div className="text-brand font-bold text-2xl">10s</div>
                    <div className="text-xs text-base-tertiary mt-1">평균 매칭 시간</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 lg:-right-12 bg-bg-layer-2 p-4 rounded-xl shadow-xl max-w-xs border border-border-soft animate-bounce">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Zap size={18} className="text-yellow-500 fill-yellow-500" />
                초고속 매칭
              </p>
              <p className="text-xs text-base-tertiary">티어 기반 알고리즘</p>
            </div>
          </motion.div>
          <motion.div
            className="lg:w-1/2 order-1 lg:order-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand font-bold tracking-wider uppercase mb-2 block">
              Step 01
            </span>
            <h2 className="text-4xl font-bold mb-6">
              준비되셨나요? <br />
              버튼 하나로 시작하세요.
            </h2>
            <p className="text-lg text-base-secondary mb-8 leading-relaxed">
              복잡한 설정은 필요 없습니다. &apos;배틀 입장&apos; 버튼을 누르는 순간, TADAK의 스마트
              매칭 시스템이 당신의 티어와 승률을 분석하여 가장 적절한 상대를 찾아냅니다.
              <br />
              <br />
              티어 기반 실시간 자동 매칭 시스템으로 비슷한 실력의 상대와 즉시 연결됩니다.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
