import { motion, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/hooks/useTheme';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <div className="bg-surface text-ink transition-colors duration-300 min-h-screen font-['Noto_Sans_KR',sans-serif]">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-bg-layer-2/80 backdrop-blur-md border-b border-border-soft transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  alt="TADAK Logo"
                  className="w-10 h-10 rounded-lg"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7qT89LZp-WP15fi0cWMAJ6bb5I8_INXPPLksvpqSZFDh-0ZDOB-zI9zVpj9tzWs0KX1feIOlEhHaewIc1G70amdUOLKXOJhffBEjiaiHGaOCt8zmRtKLN_vbDeGZem3u062fmxhjcPpMAQxEp_nzH1ywPNYDjogNvPq43GFjqz-003fPMjwiy6yJjWVq7hADSyQad5toqc88X3AzgiWayngKy_2KsW8Jaljh7yHt-MvOuFh43H1WDCuBweuald3J5hvLABcWqyEg"
                />
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  TADAK
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-base-muted transition-colors"
                id="theme-toggle"
              >
                <span className="material-icons-round text-base-secondary">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hidden md:block px-5 py-2 rounded-full font-bold text-sm bg-base-primary text-base-faint hover:opacity-90 transition-opacity"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand rounded-full blur-[80px] opacity-20 dark:opacity-30 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-80 h-80 bg-blue-400 rounded-full blur-[80px] opacity-20 dark:opacity-30 pointer-events-none"></div>

        <motion.div
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          <motion.span
            variants={itemVariants}
            className="inline-block py-1 px-3 rounded-full bg-brand/10 text-brand font-bold text-sm mb-6 border border-brand/20"
          >
            v2.0 업데이트 완료
          </motion.span>
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight"
          >
            고독한 코딩은 이제 그만.
            <br />
            <span className="bg-gradient-to-r from-brand to-sky-400 bg-clip-text text-transparent">
              실시간 알고리즘 배틀
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-base-secondary mb-10 max-w-2xl mx-auto"
          >
            비슷한 실력의 개발자와 실시간으로 경쟁하며 성장하세요.
            <br />
            긴장감 넘치는 1:1 코딩 대결, TADAK에서 시작됩니다.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() => navigate('/matching')}
              className="px-8 py-4 bg-brand text-blue-950 text-lg font-bold rounded-full shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
            >
              <span className="material-icons-round">sports_esports</span>
              배틀 입장하기
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-bg-layer-2 text-base-secondary border border-border-soft text-lg font-bold rounded-full hover:bg-base-muted transition-colors"
            >
              더 알아보기
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Why TADAK */}
      <section id="how-it-works" className="py-20 bg-bg-layer-2 border-y border-border-soft">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-6"
          >
            왜 TADAK인가요?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-base-secondary leading-relaxed mb-12"
          >
            혼자 푸는 알고리즘 문제는 지루하고 동기부여가 어렵습니다.
            <br />
            TADAK은 경쟁 요소를 도입하여 코딩 테스트 준비를{' '}
            <strong className="text-brand">게임처럼 즐겁게</strong> 만듭니다.
            <br />내 실력을 객관적으로 증명하고, 다른 사람의 코드를 보며 배우세요.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'bolt',
                title: '실시간 매칭',
                desc: '대기 시간 없이 비슷한 실력의 상대와 즉시 매칭됩니다.',
                color: 'purple',
              },
              {
                icon: 'code',
                title: '라이브 코딩',
                desc: '상대의 진행 상황을 보며 긴장감 넘치는 코딩을 경험하세요.',
                color: 'green',
              },
              {
                icon: 'visibility',
                title: '관전 & 복기',
                desc: '고수들의 풀이를 관전하고 내 코드를 리뷰하며 성장하세요.',
                color: 'blue',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-6 rounded-2xl bg-surface"
              >
                <div
                  className={`w-12 h-12 bg-${item.color}-100/20 dark:bg-${item.color}-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto text-${item.color}-600 dark:text-${item.color}-400`}
                >
                  <span className="material-icons-round text-3xl">{item.icon}</span>
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-base-tertiary text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Step 1: Matching */}
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
                      <div className="text-brand font-bold text-2xl">1</div>
                      <div className="text-xs text-base-tertiary mt-1">대기 중인 플레이어</div>
                    </div>
                    <div className="bg-bg-layer-2 p-4 rounded-xl text-center">
                      <div className="text-brand font-bold text-2xl">0</div>
                      <div className="text-xs text-base-tertiary mt-1">진행 중인 배틀</div>
                    </div>
                    <div className="bg-bg-layer-2 p-4 rounded-xl text-center">
                      <div className="text-brand font-bold text-2xl">0s</div>
                      <div className="text-xs text-base-tertiary mt-1">평균 매칭 시간</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 lg:-right-12 bg-bg-layer-2 p-4 rounded-xl shadow-xl max-w-xs border border-border-soft animate-bounce">
                <p className="text-sm font-semibold">⚡️ 초고속 매칭</p>
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
                복잡한 설정은 필요 없습니다. &apos;배틀 입장&apos; 버튼을 누르는 순간, TADAK의
                스마트 매칭 시스템이 당신의 티어와 승률을 분석하여 가장 적절한 상대를 찾아냅니다.
                <br />
                <br />
                티어 기반 실시간 자동 매칭 시스템으로 비슷한 실력의 상대와 즉시 연결됩니다.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 2: Battle Interface */}
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
                상대의 숨소리까지 느껴지는
                <br />
                리얼타임 배틀
              </h2>
              <p className="text-lg text-base-secondary mb-8 leading-relaxed">
                화면 상단의 진행률 바를 통해 상대방이 얼마나 문제를 해결했는지 실시간으로 확인할 수
                있습니다.
                <br />
                <br />
                코드 에디터에서 최적의 알고리즘을 작성하고, 테스트 케이스를 통과하여 승리를
                쟁취하세요. 상대의 타건음을 느끼며(상상하며) 실시간으로 문제를 해결하세요.
              </p>
              <ul className="space-y-4">
                {[
                  '실시간 진행률 게이지',
                  '다양한 언어 지원 (JS, Python, C++ 등)',
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
                      <h4 className="font-bold text-lg mb-2">크림빵</h4>
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

      {/* Step 3: Spectating */}
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
                내가 배틀 중이 아닐 때도 TADAK은 즐겁습니다. 현재 진행 중인 고수들의 배틀을
                실시간으로 관전하세요.
                <br />
                <br />
                채팅으로 다른 관전자들과 의견을 나누고, 고수의 문제 풀이 방식을 어깨너머로 배울 수
                있습니다. 고수들의 코딩 과정을 실시간 채팅과 함께 관전하며 배워보세요.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-bg-layer-1 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span className="material-icons-round text-red-500 text-sm animate-pulse">
                    circle
                  </span>{' '}
                  LIVE 배틀 목록
                </div>
                <div className="px-4 py-2 bg-bg-layer-1 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span className="material-icons-round text-blue-500 text-sm">chat</span> 실시간
                  채팅
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
                  <div className="flex items-center gap-1 text-base-tertiary text-sm">
                    <span className="material-icons-round text-base">visibility</span>
                    142명 관전 중
                  </div>
                </div>
                <div className="flex h-80">
                  <div className="flex-1 p-6 bg-slate-900 text-slate-300 font-mono text-xs overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-900/50 pointer-events-none"></div>
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
                    <div className="p-3 bg-bg-layer-1 text-xs font-bold text-base-tertiary">
                      실시간 채팅
                    </div>
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

      {/* Step 4: Results */}
      <section className="py-24 bg-bg-layer-1/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand font-bold tracking-wider uppercase mb-2 block">
              Step 04
            </span>
            <h2 className="text-4xl font-bold mb-4">승리의 짜릿함, 패배의 교훈</h2>
            <p className="text-lg text-base-secondary max-w-2xl mx-auto">
              배틀 종료 후 승점 획득과 코드 복기로 실력을 향상시키세요.
              <br />
              결과 화면에서 서로의 코드를 비교하고, 더 나은 해결책을 찾을 수 있습니다.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="bg-bg-layer-2 rounded-3xl shadow-xl overflow-hidden border border-border-soft p-8 md:p-12">
              <div className="flex flex-col items-center justify-center mb-12">
                <div className="w-16 h-16 bg-base-muted rounded-full flex items-center justify-center mb-4">
                  <span className="material-icons-round text-3xl text-base-tertiary">
                    emoji_events
                  </span>
                </div>
                <h3 className="text-3xl font-black mb-2">결과</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative border-2 border-brand bg-brand/5 rounded-2xl p-6 flex flex-col items-center">
                  <div className="absolute top-0 right-0 bg-brand text-blue-950 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                    승리
                  </div>
                  <div className="w-20 h-20 rounded-full bg-yellow-100 border-4 border-surface mb-4 shadow-md overflow-hidden">
                    <img
                      alt="avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJtNobsvIjn7f-Th_s3o43CX8vTUPZ8rH0UnFl2g8Gf7F9SEXj2WVBxgPuKTbmMqjfDY84gSAHS_H7kQrOuwPcI86Ypc5nwXrWHZWCVLwk9PXAMImOlIIt1-r4Wt2fXITNutzobgOpbMiOPGsK3Y_mg1tqwwwJcfzKZXlb7QNXm1bd5OUAht0doTtpLs3RAnma2WXam6jlWO6kcfRNGiXLr1UDd_JLPirjVNIpJxxEUDe8Rw7IKdOeQTd_mPqwq9wRCLK02v4l7VQ"
                    />
                  </div>
                  <h4 className="text-xl font-bold">CodeMaster</h4>
                  <p className="text-yellow-500 text-sm font-bold mb-6">🏆 Gold</p>
                  <div className="w-full bg-bg-layer-1 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-brand">
                      <span className="material-icons-round">arrow_upward</span>
                      <span className="text-2xl font-black">+25</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-base-tertiary">SCORE</p>
                      <p className="font-bold">10/10</p>
                    </div>
                  </div>
                </div>
                <div className="relative border border-border-soft bg-surface rounded-2xl p-6 flex flex-col items-center opacity-80">
                  <div className="w-20 h-20 rounded-full bg-base-muted border-4 border-surface mb-4 shadow-md overflow-hidden">
                    <img
                      alt="avatar"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAul0c1aIk8Sm3xFB3bXvACrQq_HBhcNROPjijDhcL34xu5hu2TVmSzf6gVGmCUQRyW-QtZnumdagFMvyHV2v7hHxxdV73wTe6RcyvZvSimTfbfrbHCBnNYLTT0mdLv4OmgMdO_dO9jm1E2J-IDf_zfhgMtUCd5Pbar6tP8IRC6nLyY3-GQ_3qQFKTu1zLfXqCM5nwxyPPrm9fwkblGJ7XxVf0tyW6VdwbzZIT24VlUIzshjoao8IX3aNukaY6CB7O2qoJXT4zGio"
                    />
                  </div>
                  <h4 className="text-xl font-bold">AlgoKing</h4>
                  <p className="text-yellow-500 text-sm font-bold mb-6">🏆 Gold</p>
                  <div className="w-full bg-bg-layer-1 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-500">
                      <span className="material-icons-round">arrow_downward</span>
                      <span className="text-2xl font-black">-25</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-base-tertiary">SCORE</p>
                      <p className="font-bold">5/10</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-20 border-b border-border-soft">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">당신의 실력을 증명하세요</h2>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { name: '브론즈', color: 'var(--color-tier-bronze)' },
              { name: '실버', color: 'var(--color-tier-silver)' },
              { name: '골드', color: 'var(--color-tier-gold)' },
              { name: '플래티넘', color: 'var(--color-tier-platinum)' },
              { name: '다이아몬드', color: 'var(--color-tier-diamond)' },
              { name: '루비', color: 'var(--color-tier-ruby)' },
              { name: '마스터', color: 'var(--color-tier-master)', isMaster: true },
            ].map((tier, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.1 }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-full shadow-lg relative overflow-hidden ${
                    tier.isMaster ? 'border-2 border-brand shadow-glow' : ''
                  }`}
                  style={{ background: tier.color }}
                >
                  {tier.isMaster && (
                    <div className="absolute inset-0 bg-brand/20 animate-pulse"></div>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${tier.isMaster ? 'text-brand' : 'text-base-tertiary'}`}
                >
                  {tier.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-surface relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand rounded-full filter blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full filter blur-[80px]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-8"
          >
            준비되셨나요?
            <br />
            지금 바로 첫 배틀을 시작하세요.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base-tertiary mb-12 text-lg"
          >
            수천 명의 개발자들이 당신의 도전을 기다리고 있습니다.
          </motion.p>
          <motion.button
            onClick={() => navigate('/matching')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-brand hover:opacity-90 text-blue-950 text-xl font-bold rounded-full shadow-glow flex items-center gap-3 mx-auto"
          >
            <span className="material-icons-round">play_arrow</span>
            무료로 시작하기
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-layer-2 text-base-tertiary py-12 border-t border-border-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-brand tracking-tight">TADAK</span>
            <span className="text-xs px-2 py-1 rounded bg-bg-layer-1 text-base-tertiary">BETA</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a className="hover:text-ink transition-colors" href="#">
              서비스 소개
            </a>
            <a className="hover:text-ink transition-colors" href="#">
              이용약관
            </a>
            <a className="hover:text-ink transition-colors" href="#">
              개인정보처리방침
            </a>
            <a className="hover:text-ink transition-colors" href="#">
              문의하기
            </a>
          </div>
          <div className="text-sm">© 2023 TADAK. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
