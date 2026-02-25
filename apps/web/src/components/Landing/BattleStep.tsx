import { motion } from 'framer-motion';

export const BattleStep = () => {
  return (
    <section className="py-24 bg-bg-layer-1/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            className="lg:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-brand font-bold tracking-wider uppercase mb-2 block">
              Step 02
            </span>
            <h2 className="text-4xl font-bold mb-6">
              상대와 함께하는
              <br />
              리얼타임 배틀
            </h2>
            <p className="text-lg text-base-secondary mb-8 leading-relaxed">
              화면 상단의 진행률 바를 통해 상대방이 얼마나 문제를 해결했는지 실시간으로 확인할 수
              있습니다.
              <br />
              <br />
              코드 에디터에서 최적의 알고리즘을 작성하고, 테스트 케이스를 통과하여 승리를
              쟁취하세요. 상대의 타건음을 느끼며 실시간으로 문제를 해결하세요.
            </p>
            <ul className="space-y-4">
              {[
                '실시간 진행률 게이지',
                '자바스크립트 언어 지원',
                '직관적인 문제 설명 및 입출력 예시',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-base-secondary">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-xl overflow-hidden shadow-2xl border border-border-soft">
              <div className="bg-bg-layer-1 p-4 rounded-xl min-h-[400px] flex flex-col gap-4">
                <div className="h-12 bg-bg-layer-2 rounded-lg flex items-center justify-between px-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-brand"></div>
                    </div>
                    <span className="text-xs font-mono text-base-tertiary">50%</span>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                    00:26
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-base-tertiary">0%</span>
                    <div className="h-2 w-32 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                      <div className="h-full w-0 bg-red-500"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 h-full flex-grow">
                  <div className="w-1/3 bg-bg-layer-2 rounded-lg p-4 shadow-sm hidden sm:block">
                    <br />
                    <div className="font-bold text-lg mb-2">크림빵</div>
                    <div className="h-2 w-20 bg-base-muted rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-base-faint rounded"></div>
                      <div className="h-2 w-full bg-base-faint rounded"></div>
                      <div className="h-2 w-2/3 bg-base-faint rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-bg-layer-2 rounded-lg p-4 shadow-sm relative font-mono text-sm overflow-hidden">
                    <div className="text-blue-500">
                      function <span className="text-yellow-500">solution</span>() &#123;
                    </div>
                    <div className="pl-4 text-green-500">// TODO: Write your code here</div>
                    <div className="pl-4 text-ink flex items-center">
                      const result =
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-[2px] h-4 bg-ink ml-1"
                      />
                    </div>
                    <div className="text-blue-500">&#125;</div>
                    <button className="absolute bottom-4 right-4 bg-ink text-surface px-4 py-2 rounded-lg text-xs font-bold hover:opacity-80">
                      제출하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -left-4 top-20 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand text-blue-950 font-bold flex items-center justify-center shadow-lg border-2 border-surface">
                P
              </div>
              <div className="bg-ink text-surface text-xs py-1 px-3 rounded-md shadow-lg">
                진행 상황
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
