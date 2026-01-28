import { AnimatePresence, motion } from 'framer-motion';

interface BattleFinishOverlayProps {
  isVisible: boolean;
}

const BattleFinishOverlay = ({ isVisible }: BattleFinishOverlayProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
          <div className="relative overflow-hidden px-12 py-8">
            {/* 배경 빛 효과 (Framer Motion) */}
            <motion.div
              initial={{ x: '-150%', skewX: 12 }}
              animate={{ x: '150%', skewX: 12 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />

            {/* 메인 텍스트 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
              }}
              className="relative"
            >
              <h1 className="text-6xl font-black tracking-tighter text-white italic drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] md:text-8xl">
                BATTLE FINISHED
              </h1>

              {/* 장식용 선 */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: 'circOut' }}
                className="mt-2 h-1 bg-gradient-to-r from-transparent via-white to-transparent origin-center"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BattleFinishOverlay;
