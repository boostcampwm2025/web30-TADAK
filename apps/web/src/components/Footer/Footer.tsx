export const Footer = () => {
  return (
    <footer className="bg-bg-layer-2 text-base-tertiary py-12 border-t border-border-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-brand tracking-tight">TADAK</span>
          <span className="text-xs px-2 py-1 rounded bg-bg-layer-1 text-base-tertiary">BETA</span>
        </div>
        <div className="flex gap-8 text-sm">
          <a
            className="hover:text-ink transition-colors"
            href="https://github.com/boostcampwm2025/web30-TADAK"
          >
            GitHub
          </a>
          <a
            className="hover:text-ink transition-colors"
            href="https://www.notion.so/web30-2c319e920f6080b2908dfb28ba83275a?source=copy_link"
          >
            Notion
          </a>
          <a className="hover:text-ink transition-colors" href="#">
            이용약관
          </a>
          <a className="hover:text-ink transition-colors" href="#">
            개인정보처리방침
          </a>
        </div>
        <div className="text-sm">© 2026 TADAK. All rights reserved.</div>
      </div>
    </footer>
  );
};
