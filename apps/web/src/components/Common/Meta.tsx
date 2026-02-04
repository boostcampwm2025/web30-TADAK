interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

const Meta = ({
  title = 'TADAK - 실시간 알고리즘 코딩 배틀',
  description = '고독한 코딩은 이제 그만! 비슷한 실력의 상대와 실시간 알고리즘 대결을 펼치며 성장하는 웹 게임 TADAK입니다.',
  keywords = '알고리즘, 배틀 게임, 코딩 배틀, 프로그래밍, 백준, 리트코드, 개발자, 타닥, 코딩 테스트, 코딩 대결, 코테',
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl = window.location.href,
  canonical,
}: MetaProps) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const finalOgImage = ogImage || `${origin}/logo.webp`;
  const pageTitle = title === 'TADAK - 실시간 알고리즘 코딩 배틀' ? title : `${title} | TADAK`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:site_name" content="TADAK" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:title" content={ogTitle || pageTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={ogUrl} />
      <meta name="twitter:title" content={ogTitle || pageTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Theme Color (Slack sidebar, Mobile browser) */}
      <meta name="theme-color" content="#00e074" />

      {/* Canonical Link */}
      {canonical && <link rel="canonical" href={canonical} />}
    </>
  );
};

export default Meta;
