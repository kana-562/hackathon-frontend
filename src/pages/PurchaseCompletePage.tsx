import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { MOCK_TRANSACTION } from '../api/mock';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';

interface StartPlanStep {
  dayNo: number;
  title: string;
  body: string;
}

interface StartPlan {
  id: number;
  title: string;
  steps: StartPlanStep[];
}

export default function PurchaseCompletePage() {
  useParams<{ setId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const txId = searchParams.get('txId');
  const [plan, setPlan] = useState<StartPlan | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!txId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch transaction to get set title
        const tx = await api.getTransaction(Number(txId));
        setSetTitle(tx.starterSet.title);

        // Fetch start plan
        const p = await api.getStartPlan(Number(txId));
        setPlan(p);
      } catch {
        setSetTitle(MOCK_TRANSACTION.starterSet.title);
        if (MOCK_TRANSACTION.startPlan) setPlan(MOCK_TRANSACTION.startPlan);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [txId]);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Success Header */}
      <div className="complete-header">
        <div className="complete-icon">✅</div>
        <h1 className="complete-title">購入が完了しました！</h1>
        {setTitle && (
          <p className="complete-subtitle" style={{ fontWeight: 600, color: 'var(--color-text)', marginTop: 8, fontSize: 16 }}>
            {setTitle}
          </p>
        )}
        <p className="complete-subtitle" style={{ marginTop: 6 }}>
          出品者から連絡をお待ちください
        </p>
      </div>

      <div className="divider" />

      {/* Start Plan */}
      {loading ? (
        <LoadingSpinner message="スタートプランを生成中..." />
      ) : plan && plan.steps.length > 0 ? (
        <div style={{ padding: '20px 0' }}>
          <p className="section-title">{plan.title || `このセットで始める${plan.steps.length}日間プラン`}</p>
          <div className="start-plan" style={{ marginTop: 8 }}>
            {plan.steps.map((step) => (
              <div key={step.dayNo} className="start-plan-step">
                <div className="start-plan-day">Day {step.dayNo}</div>
                <div className="start-plan-step-content">
                  <p className="start-plan-step-title">{step.title}</p>
                  <p className="start-plan-step-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px 16px' }}>
          <div style={{
            background: 'rgba(78,205,196,0.08)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🌱</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              新しい趣味の旅がはじまります！
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              セットが届いたら、ぜひ楽しんでください。<br />
              困ったことがあれば出品者に聞いてみましょう。
            </p>
          </div>
        </div>
      )}

      {/* Navigate to MyPage button */}
      <div style={{ padding: '16px 16px 24px' }}>
        <button
          className="btn-primary"
          onClick={() => navigate('/mypage?tab=purchases')}
          type="button"
        >
          購入済み商品を見る
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
