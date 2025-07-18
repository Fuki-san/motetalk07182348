import React from 'react';
import { Check, Crown, Zap, Heart, MessageCircle, Coffee, Star } from 'lucide-react';
import { purchaseSubscription, purchaseTemplate, subscriptionPlans, templatePacks } from '../services/stripeService';

const Pricing = () => {
  const displayPlans = [
    {
      id: 'free',
      name: "無料プラン",
      price: "0",
      period: "永久",
      description: "お試しに最適",
      features: [
        "1日3回までAI返信生成",
        "基本テンプレート5種類",
        "会話履歴（7日間）",
        "モバイルアプリ対応"
      ],
      buttonText: "無料で始める",
      buttonStyle: "bg-gray-600 hover:bg-gray-700",
      icon: Heart,
      popular: false
    },
    ...subscriptionPlans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price.toString(),
      period: plan.interval === 'month' ? '月' : '年',
      description: "本気で出会いたい方に",
      features: plan.features,
      buttonText: `${plan.name}を始める`,
      buttonStyle: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700",
      icon: Crown,
      popular: true
    }))
  ];

  const displayTemplatePacks = templatePacks.map(pack => ({
    id: pack.id,
    title: pack.name,
    description: pack.description,
    price: pack.price,
    icon: getIconForTemplate(pack.id),
    features: pack.features
  }));

  function getIconForTemplate(templateId: string) {
    switch (templateId) {
      case 'first_message_pack': return MessageCircle;
      case 'line_transition_pack': return Coffee;
      case 'date_invitation_pack': return Heart;
      case 'conversation_topics_pack': return Star;
      default: return MessageCircle;
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      // 無料プランの場合は何もしない（または登録処理）
      console.log('Free plan selected');
      return;
    }

    try {
      await purchaseSubscription(planId);
    } catch (error) {
      console.error('Subscription error:', error);
      alert('サブスクリプションの処理中にエラーが発生しました。');
    }
  };

  const handlePurchaseTemplate = async (templateId: string) => {
    try {
      await purchaseTemplate(templateId);
    } catch (error) {
      console.error('Template purchase error:', error);
      alert('テンプレート購入の処理中にエラーが発生しました。');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            料金プラン
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            あなたに最適なプランを選択してください
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">サブスクリプションプラン</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {displayPlans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                    plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        おすすめ
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-800">¥{plan.price}</span>
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    className={`w-full text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${plan.buttonStyle}`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Packs */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">買い切りテンプレート</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayTemplatePacks.map((pack, index) => {
              const Icon = pack.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{pack.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{pack.description}</p>
                    <div className="text-2xl font-bold text-purple-600">¥{pack.price.toLocaleString()}</div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {pack.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePurchaseTemplate(pack.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  >
                    購入する
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            よくある質問
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AIはどのように動作しますか？
              </h3>
              <p className="text-gray-600">
                最新のGPT-4を使用して、相手のメッセージの文脈を理解し、自然で魅力的な返信を生成します。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                いつでもキャンセルできますか？
              </h3>
              <p className="text-gray-600">
                はい。サブスクリプションはいつでもキャンセル可能です。課金期間終了まで利用できます。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                データは安全ですか？
              </h3>
              <p className="text-gray-600">
                エンドツーエンド暗号化を使用し、個人の会話データは必要以上に保存しません。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                返金はできますか？
              </h3>
              <p className="text-gray-600">
                30日間の返金保証があります。満足いただけない場合は全額返金いたします。
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">SSL暗号化</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">プライバシー保護</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">24時間サポート</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;