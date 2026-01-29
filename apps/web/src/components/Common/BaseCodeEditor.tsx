import Editor, { type EditorProps, type Monaco } from '@monaco-editor/react';
import { BATTLE_CONFIG } from '@shared/constants/battle';

import { useTheme } from '@/hooks/useTheme';

// 추가적인 커스텀 props가 필요하다면 여기에 정의
type BaseCodeEditorProps = EditorProps;

const BaseCodeEditor = ({
  theme: _ignoredTheme,
  beforeMount,
  options,
  ...props
}: BaseCodeEditorProps) => {
  const { theme } = useTheme();

  const handleBeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('tadak-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#161a32',
      },
    });
    monaco.editor.defineTheme('tadak-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
      },
    });

    // 부모에서 전달된 beforeMount가 있다면 실행
    if (beforeMount) {
      beforeMount(monaco);
    }
  };

  const defaultOptions: EditorProps['options'] = {
    minimap: { enabled: false }, // 미니맵 활성화 여부
    fontSize: 14, // 폰트 크기
    scrollBeyondLastLine: false, // 마지막 줄 이후로 스크롤 가능
    automaticLayout: true, // 에디터 컨테이너 크기 변경 시 자동 조정
    padding: { top: 16, bottom: 16 }, // 상하 여백
    fontFamily: 'Fira Code', // 폰트 종류
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={BATTLE_CONFIG.DEFAULT_LANGUAGE}
      theme={theme === 'dark' ? 'tadak-dark' : 'tadak-light'}
      beforeMount={handleBeforeMount}
      options={{ ...defaultOptions, ...options }}
      {...props}
    />
  );
};

export default BaseCodeEditor;
