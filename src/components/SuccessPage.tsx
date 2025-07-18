import React, { useEffect, useState } from 'react';
import { Check, Crown, MessageCircle, ArrowRight } from 'lucide-react';
import { checkPurchaseStatus } from '../services/stripeService';

const SuccessPage = () => {
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (sessionId) {
      checkPurchaseStatus(sessionId)
        .then(info => {
          setPurchaseInfo(info);
        })
        .catch(error => {
          console.error('Failed to check purchase status:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">購入情報を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          購入が完了しました！
        </h1>
        
        <p className="text-gray-600 mb-6">
          MoteTalkをご利用いただき、ありがとうございます。
          {purchaseInfo?.type === 'subscription' 
            ? 'プレミアムプランが有効になりました。'
            : 'テンプレートパックをご利用いただけます。'
          }
        </p>

        <div className="space-y-3 mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            AI返信生成を始める
          </button>
          
          {purchaseInfo?.type === 'template' && (
            <button
              onClick={() => window.location.href = '/templates'}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
            >
              <Crown className="w-4 h-4 inline mr-2" />
              テンプレートを見る
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500">
          <p>ご不明な点がございましたら、</p>
          <p>サポートまでお気軽にお問い合わせください。</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;