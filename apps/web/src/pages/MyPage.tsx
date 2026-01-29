import type { SubmissionDetail } from '@shared/types/submission';
import type { BattleHistoryItem, SubmissionHistoryItem } from '@shared/types/user';
import { useEffect, useState } from 'react';

import { getMyBattles } from '@/apis/battle';
import { getMySubmissions, getSubmissionDetail } from '@/apis/submission';
import { getUserProfile, type UserProfile } from '@/apis/user';
import BaseCodeEditor from '@/components/Common/BaseCodeEditor';
import Header from '@/components/Header/Header';
import { MyPageActivityMap } from '@/components/MyPage/MyPageActivityMap';
import { MyPageBattleHistory } from '@/components/MyPage/MyPageBattleHistory';
import { MyPageModal, MyPageModalPane } from '@/components/MyPage/MyPageModal';
import { MyPageProfileCard } from '@/components/MyPage/MyPageProfileCard';
import { MyPageSolutionArchive } from '@/components/MyPage/MyPageSolutionArchive';

type TabType = 'history' | 'archive';

export default function MyPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [battles, setBattles] = useState<BattleHistoryItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('history');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'replay' | 'solution'>('replay');
  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, battleData, submissionData] = await Promise.all([
          getUserProfile(),
          getMyBattles(),
          getMySubmissions(),
        ]);
        setUser(userData);
        setBattles(battleData);
        setSubmissions(submissionData);
      } catch (error) {
        console.error('Failed to fetch my page data:', error);
      }
    };
    fetchData();
  }, []);

  const handleBattleClick = () => {
    // 배틀 리플레이 기능은 현재 비활성화 상태입니다.
    /*
    setSelectedBattleId(battleId);
    setModalType('replay');
    setIsModalOpen(true);
    */
  };

  const handleSubmissionClick = async (submissionId: string) => {
    setModalType('solution');
    setIsModalOpen(true);
    setIsLoadingDetail(true);
    try {
      const detail = await getSubmissionDetail(submissionId);
      setSubmissionDetail(detail);
    } catch (error) {
      console.error('Failed to fetch submission detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmissionDetail(null);
    setSelectedBattleId(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-layer-1 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const selectedBattle = battles.find((b) => b.id === selectedBattleId);

  return (
    <div className="min-h-screen bg-bg-layer-1 flex flex-col transition-colors duration-300">
      <Header />

      <div className="container mx-auto max-w-6xl px-8 py-12">
        <div className="page-layout grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
          <aside className="sidebar flex flex-col gap-6">
            <MyPageProfileCard user={user} />
            <MyPageActivityMap activities={user.activities} />
          </aside>

          <main className="main-content flex flex-col gap-8">
            <div className="tabs flex gap-8 border-b-2 border-border-soft">
              <button
                className={`cursor-pointer tab pb-4 font-bold transition-all relative ${
                  activeTab === 'history'
                    ? 'text-ink'
                    : 'text-base-tertiary hover:text-base-secondary'
                }`}
                onClick={() => setActiveTab('history')}
              >
                배틀 기록
                {activeTab === 'history' && (
                  <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-brand animate-fade-slide-in" />
                )}
              </button>
              <button
                className={`cursor-pointer tab pb-4 font-bold transition-all relative ${
                  activeTab === 'archive'
                    ? 'text-ink'
                    : 'text-base-tertiary hover:text-base-secondary'
                }`}
                onClick={() => setActiveTab('archive')}
              >
                제출 이력
                {activeTab === 'archive' && (
                  <div className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-brand animate-fade-slide-in" />
                )}
              </button>
            </div>

            {activeTab === 'history' ? (
              <MyPageBattleHistory battles={battles} onBattleClick={handleBattleClick} />
            ) : (
              <MyPageSolutionArchive
                submissions={submissions}
                onSubmissionClick={handleSubmissionClick}
              />
            )}
          </main>
        </div>
      </div>

      <MyPageModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalType === 'replay' ? '배틀 리플레이 상세' : '내 문제 풀이 상세'}
      >
        {modalType === 'replay' ? (
          <>
            <MyPageModalPane header="나의 코드">
              <pre className="text-xs">
                def solve(s):&#10; # 최장 팰린드롬 탐색&#10; res = ""&#10; ...
              </pre>
            </MyPageModalPane>
            <MyPageModalPane header={`상대방 (@${selectedBattle?.opponentName || '...'}) 코드`}>
              <pre className="text-xs">def solution(s):&#10; n = len(s)&#10; ...</pre>
            </MyPageModalPane>
          </>
        ) : (
          <>
            {isLoadingDetail ? (
              <div className="col-span-2 flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : submissionDetail ? (
              <>
                <MyPageModalPane header="문제 설명">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-xl font-extrabold mb-1">
                        {submissionDetail.problem.title}
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {submissionDetail.problem.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-base-muted text-[10px] font-bold rounded-md"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-[11px] text-base-tertiary">
                        <span>
                          출처: <b>{submissionDetail.problem.source}</b>
                        </span>
                        <span>
                          시간 제한: <b>{submissionDetail.problem.timeLimit}s</b>
                        </span>
                        <span>
                          메모리 제한: <b>{submissionDetail.problem.memoryLimit}MB</b>
                        </span>
                      </div>
                    </div>

                    <div className="h-[1px] bg-border-soft w-full" />

                    <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">
                      {submissionDetail.problem.statement}
                    </p>

                    <div>
                      <div className="text-[11px] font-bold text-base-tertiary uppercase mb-1">
                        [입력]
                      </div>
                      <p className="text-xs mb-4 text-base-secondary leading-relaxed">
                        {submissionDetail.problem.input}
                      </p>
                      <div className="text-[11px] font-bold text-base-tertiary uppercase mb-1">
                        [출력]
                      </div>
                      <p className="text-xs text-base-secondary leading-relaxed">
                        {submissionDetail.problem.output}
                      </p>
                    </div>

                    {submissionDetail.problem.examples.length > 0 && (
                      <div className="mt-2">
                        <div className="text-[11px] font-bold text-base-tertiary uppercase mb-2">
                          예제
                        </div>
                        <div className="flex flex-col gap-3">
                          {submissionDetail.problem.examples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="bg-bg-layer-1 rounded-lg p-3 text-[10px] font-mono grid grid-cols-2 gap-4"
                            >
                              <div>
                                <div className="text-base-tertiary mb-1">입력</div>
                                <div className="text-ink">{ex.input}</div>
                              </div>
                              <div>
                                <div className="text-base-tertiary mb-1">출력</div>
                                <div className="text-ink">{ex.output}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </MyPageModalPane>
                <MyPageModalPane header={`나의 정답 풀이 (${submissionDetail.language})`}>
                  <div className="h-[400px] w-full rounded-xl overflow-hidden border border-border-soft">
                    <BaseCodeEditor
                      value={submissionDetail.code}
                      language={submissionDetail.language.toLowerCase()}
                      options={{ readOnly: true, lineNumbers: 'on', scrollBeyondLastLine: false }}
                    />
                  </div>
                </MyPageModalPane>
              </>
            ) : (
              <div className="col-span-2 py-20 text-center text-base-tertiary">
                데이터를 불러오지 못했습니다.
              </div>
            )}
          </>
        )}
      </MyPageModal>
    </div>
  );
}
