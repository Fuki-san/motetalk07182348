import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error('Stripe publishable key is not configured');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface TemplatePack {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface CreateCheckoutSessionRequest {
  type: 'subscription' | 'one_time';
  planId?: string;
  templateId?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

// サブスクリプションプラン
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'premium_monthly',
    name: 'プレミアム',
    price: 1980,
    interval: 'month',
    features: [
      'AI返信生成無制限',
      '全テンプレート使い放題',
      '会話履歴無制限',
      '優先サポート',
      '高度な文脈理解',
      'カスタムテンプレート作成'
    ]
  }
];

// テンプレートパック
export const templatePacks: TemplatePack[] = [
  {
    id: 'first_message_pack',
    name: '初回メッセ神パターン集',
    description: 'Tinder・タップル用15種類',
    price: 980,
    features: ['返信率UP実績あり', 'アプリ別最適化', '即使える例文']
  },
  {
    id: 'line_transition_pack',
    name: 'LINE移行テンプレ',
    description: 'アプリ→LINE自然移行例',
    price: 1280,
    features: ['自然な流れ', '断られにくい文面', '成功率80%以上']
  },
  {
    id: 'date_invitation_pack',
    name: '誘い文句大全',
    description: 'カフェ打診〜ホテルまでの誘導文',
    price: 1980,
    features: ['段階別アプローチ', '相手に合わせた誘い方', '実践的な例文多数']
  },
  {
    id: 'conversation_topics_pack',
    name: '会話ネタ一覧',
    description: 'ボケ例／共感ネタ／趣味深掘りなど',
    price: 1980,
    features: ['会話が続く', '笑いを取れる', '深い関係に発展']
  }
];

// Stripe Checkout セッション作成
export const createCheckoutSession = async (
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> => {
  // デバッグ情報を追加
  const apiUrl = '/api/create-checkout-session';
  console.log('🔍 API呼び出し情報:', {
    url: apiUrl,
    method: 'POST',
    request: request,
    currentOrigin: window.location.origin,
    timestamp: new Date().toISOString()
  });

  try {
    // 実際の実装では、バックエンドAPIを呼び出す
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📡 レスポンス情報:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API エラー詳細:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText
      });
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
};

// サブスクリプション購入
export const purchaseSubscription = async (planId: string): Promise<void> => {
  console.log('🚀 サブスクリプション購入開始:', planId);
  
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe is not available');
    }

    console.log('💳 Checkout session作成中...');
    const session = await createCheckoutSession({
      type: 'subscription',
      planId,
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`
    });

    console.log('✅ Session作成完了、Stripeにリダイレクト中...', session.sessionId);
    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId
    });

    if (result.error) {
      console.error('❌ Stripe redirect error:', result.error);
      throw new Error(result.error.message);
    }

  } catch (error) {
    console.error('❌ Subscription purchase error:', error);
    throw error;
  }
};

// サブスクリプション解約
export const cancelSubscription = async (): Promise<void> => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    throw error;
  }
};

// テンプレートパック購入
export const purchaseTemplate = async (templateId: string): Promise<void> => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe is not available');
    }

    const session = await createCheckoutSession({
      type: 'one_time',
      templateId,
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/templates`
    });

    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

  } catch (error) {
    console.error('Template purchase error:', error);
    throw error;
  }
};

// 購入状況の確認
export const checkPurchaseStatus = async (sessionId: string) => {
  try {
    const response = await fetch(`/api/check-purchase-status?session_id=${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check purchase status');
    }

    return await response.json();

  } catch (error) {
    console.error('Purchase status check error:', error);
    throw error;
  }
};