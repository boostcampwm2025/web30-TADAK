import type { TierType } from '@shared/types/user';
import { motion } from 'framer-motion';

import { tierConfig } from '@/constants/tier';

const tiers: { name: TierType; label: string; isHighlighted?: boolean }[] = [
  { name: 'Bronze', label: '브론즈' },
  { name: 'Silver', label: '실버' },
  { name: 'Gold', label: '골드' },
  { name: 'Platinum', label: '플래티넘' },
  { name: 'Diamond', label: '다이아몬드' },
  { name: 'Master', label: '마스터', isHighlighted: true },
];

export const TierStep = () => {
  return (
    <section className="py-24 bg-bg-layer-1/30">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black mb-6">자신의 한계를 증명하세요</h2>
          <p className="text-base-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            실시간 매칭을 통해 승리하고 포인트를 획득하세요.
            <br />
            비슷한 실력의 라이벌들과 경쟁하며 마스터 티어에 도전해보세요.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {tiers.map((tier, idx) => {
            const config = tierConfig[tier.name];
            const Icon = config.icon;

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={`
                  relative w-40 md:w-52 p-8 rounded-[32px] bg-surface border transition-all duration-300
                  flex flex-col items-center gap-6 shadow-sm
                  ${
                    tier.isHighlighted
                      ? 'border-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.1)] scale-110 z-10'
                      : 'border-border-soft hover:shadow-md'
                  }
                `}
              >
                <div
                  className={`
                  w-20 h-20 rounded-full flex items-center justify-center relative
                  ${tier.isHighlighted ? 'bg-emerald-500' : 'bg-slate-50'}
                `}
                >
                  <Icon
                    size={40}
                    className={`
                      ${tier.isHighlighted ? 'text-white' : config.colorClass}
                      ${tier.isHighlighted ? 'drop-shadow-sm text-white fill-white' : config.fillClass}
                    `}
                  />
                  {tier.isHighlighted && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-400/20"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
                <span
                  className={`
                  text-sm md:text-base font-black tracking-widest uppercase
                  ${tier.isHighlighted ? 'text-emerald-500' : 'text-base-tertiary'}
                `}
                >
                  {tier.name}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
