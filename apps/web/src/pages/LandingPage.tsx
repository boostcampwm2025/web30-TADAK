import { motion, type Variants } from 'framer-motion';
import { Code2, Eye, Play, Swords, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import LogoImage from '@/assets/logo.png';
import { Footer } from '@/components/Footer/Footer';
import { BattleStep } from '@/components/Landing/BattleStep';
import { MatchingStep } from '@/components/Landing/MatchingStep';
import { ResultsStep } from '@/components/Landing/ResultsStep';
import { SpectatingStep } from '@/components/Landing/SpectatingStep';
import { TierStep } from '@/components/Landing/TierStep';

const LandingPage = () => {
  const navigate = useNavigate();

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
    <div className="bg-surface text-ink transition-colors duration-300 min-h-screen">
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
          <motion.img
            variants={itemVariants}
            src={LogoImage}
            alt="TADAK 로고"
            className="h-24 w-auto mx-auto mb-6"
          />
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
            비슷한 실력의 상대와 실시간으로 경쟁하며 성장하세요.
            <br />
            긴장감 넘치는 1:1 코딩 대결, TADAK에서 시작됩니다.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={() =>
                document.getElementById('battle-start')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="px-8 py-4 bg-brand text-blue-950 text-lg font-bold rounded-full shadow-glow hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Play fill="currentColor" size={24} />
              바로 시작하기
            </button>
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
            혼자 푸는 알고리즘 문제는 지루하고 동기부여가 어렵지 않으셨나요?
            <br />
            TADAK은 경쟁 요소를 도입하여 코딩 테스트 준비를{' '}
            <strong className="text-brand">게임처럼 즐겁게</strong> 만듭니다.
            <br />내 실력을 객관적으로 증명하고, 다른 사람의 코드를 보며 배워보세요.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: 'bolt',
                title: '실시간 매칭',
                desc: '대기 시간 없이 비슷한 실력의 상대와 즉시 매칭됩니다.',
                color: 'green',
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
                color: 'green',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="p-6 rounded-2xl bg-bg-layer-1"
              >
                <div
                  className={`w-12 h-12 bg-${item.color} dark:bg-${item.color}-900/30 rounded-xl flex items-center justify-center mb-4 mx-auto text-${item.color}-600 dark:text-${item.color}-400`}
                >
                  {item.icon === 'bolt' && <Zap size={24} fill="currentColor" />}
                  {item.icon === 'code' && <Code2 size={24} />}
                  {item.icon === 'visibility' && <Eye size={24} />}
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-base-secondary text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Step Components */}
      <MatchingStep />
      <BattleStep />
      <SpectatingStep />
      <ResultsStep />
      <TierStep />

      {/* Final CTA */}
      <section id="battle-start" className="py-32 bg-surface relative overflow-hidden text-center">
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
            수십명의 캠퍼들이 당신의 도전을 기다리고 있습니다.
          </motion.p>
          <motion.a
            href="#how-it-works"
            className="inline-block mb-8 px-8 py-4 bg-bg-layer-2 text-base-secondary border border-border-soft text-lg font-bold rounded-full hover:bg-base-muted transition-colors"
          >
            다시 알아보기
          </motion.a>
          <motion.button
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-5 bg-brand hover:opacity-90 text-blue-950 text-xl font-bold rounded-full shadow-glow flex items-center gap-3 mx-auto"
          >
            <Swords fill="currentColor" size={24} />
            시작하기
          </motion.button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
