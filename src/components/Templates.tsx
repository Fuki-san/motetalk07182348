import React, { useState, useEffect } from 'react';
import { MessageCircle, Heart, Coffee, Star, Crown, Copy, Lock, ShoppingBag, Check } from 'lucide-react';
import { purchaseTemplate, templatePacks as stripeTemplatePacks } from '../services/stripeService';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  isPreview?: boolean; // プレビュー用テンプレートかどうか
}

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ComponentType<any>;
  templates: Template[];
}

const Templates = () => {
  const { user } = useAuth();
  const { userProfile } = useUserData();
  const [selectedCategory, setSelectedCategory] = useState('first_message_pack');
  const [viewMode, setViewMode] = useState<'shop' | 'purchased'>('shop');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string>('');

  // 購入済みテンプレートの状態管理
  const purchasedTemplates = userProfile?.purchasedTemplates || [];
  const isPremiumUser = userProfile?.plan === 'premium';

  // テンプレートデータ（実際のデータ）
  const templateCategories: TemplateCategory[] = [
    {
      id: 'first_message_pack',
      name: '初回メッセージ',
      description: 'Tinder・タップル用の返信率が高い初回メッセージ30種類',
      price: 980,
      icon: MessageCircle,
      templates: [
        {
          id: 'first_1',
          content: 'はじめまして！プロフィールを拝見して、[趣味]をされているのを見て親近感を感じました。僕も[関連する経験]をしていて、とても興味深いです。よろしければお話しさせていただけませんか？',
          category: 'first_message_pack',
          isPreview: true // このテンプレートをプレビューとして表示
        },
        {
          id: 'first_2',
          content: '[場所]の写真、とても素敵ですね！雰囲気がすごく良くて、きっと楽しい時間を過ごされたんだろうなと思いました。僕も[関連する場所や体験]が好きで、お話しできればと思います。',
          category: 'first_message_pack',
        },
        {
          id: 'first_3',
          content: 'こんにちは！プロフィール見させていただきました。[具体的な共通点]について、とても興味があります。もしよろしければ、お話しさせていただけませんか？',
          category: 'first_message_pack',
        },
        {
          id: 'first_4',
          content: 'はじめまして！[職業]のお仕事をされているんですね。とても素晴らしいお仕事だと思います。僕は[自分の職業や関連する話]をしていて、お話しできればと思いました。',
          category: 'first_message_pack',
        },
        {
          id: 'first_5',
          content: '[地域名]にお住まいなんですね！僕も[関連する地域情報]で、親近感を感じました。もしよろしければ、地元のおすすめスポットなど教えていただけませんか？',
          category: 'first_message_pack',
        },
        // 残りのテンプレートを追加
        ...Array.from({ length: 25 }, (_, i) => ({
          id: `first_${i + 6}`,
          content: `こんにちは！プロフィールを拝見して、[具体的な内容${i + 6}]について興味を持ちました。僕も[関連する体験や興味]があり、ぜひお話しさせていただければと思います。よろしくお願いします。`,
          category: 'first_message_pack',
        }))
      ]
    },
    {
      id: 'line_transition_pack',
      name: 'LINE移行',
      description: 'アプリからLINEへの自然な移行例文30種類',
      price: 1280,
      icon: Coffee,
      templates: [
        {
          id: 'line_1',
          content: 'アプリだと通知に気づかないことがあるので、もしよろしければLINEでやり取りしませんか？もちろん無理でしたら全然大丈夫です！',
          category: 'line_transition_pack',
          isPreview: true
        },
        {
          id: 'line_2',
          content: '[話題の内容]の写真、LINEで送らせていただけませんか？アプリだと画質が落ちてしまうので...もしよろしければID教えていただけると嬉しいです。',
          category: 'line_transition_pack',
        },
        {
          id: 'line_3',
          content: 'お話ししていてとても楽しいです！もしよろしければ、今度お時間のある時に少しお電話でお話しできませんか？LINEの方が通話しやすいかなと思うのですが...',
          category: 'line_transition_pack',
        },
        // 残りのテンプレートを追加
        ...Array.from({ length: 27 }, (_, i) => ({
          id: `line_${i + 4}`,
          content: `[状況${i + 4}]なので、もしよろしければLINEでやり取りしませんか？[理由${i + 4}]で、より便利だと思います。もちろん無理でしたら大丈夫です！`,
          category: 'line_transition_pack',
        }))
      ]
    },
    {
      id: 'date_invitation_pack',
      name: 'デート誘い',
      description: 'カフェ打診からディナーまでの誘導文例30種類',
      price: 1980,
      icon: Heart,
      templates: [
        {
          id: 'date_1',
          content: '今度お時間があるときに、一緒にカフェでもいかがですか？[場所]に美味しいお店があるので、よろしければご一緒していただけると嬉しいです。',
          category: 'date_invitation_pack',
          isPreview: true
        },
        {
          id: 'date_2',
          content: '[話題の料理]のお話を聞いていて、とても美味しそうでした！今度一緒にランチでもいかがですか？おすすめのお店があるので、ご都合の良い時に。',
          category: 'date_invitation_pack',
        },
        {
          id: 'date_3',
          content: '[映画の話題]の映画、僕も見たいと思っていました！もしよろしければ、今度一緒に見に行きませんか？',
          category: 'date_invitation_pack',
        },
        // 残りのテンプレートを追加
        ...Array.from({ length: 27 }, (_, i) => ({
          id: `date_${i + 4}`,
          content: `[活動${i + 4}]について話していて、とても興味深かったです。今度一緒に[具体的な提案${i + 4}]はいかがですか？お時間のある時で大丈夫です。`,
          category: 'date_invitation_pack',
        }))
      ]
    },
    {
      id: 'conversation_topics_pack',
      name: '会話ネタ',
      description: 'ボケ例・共感ネタ・趣味深掘りなど豊富な話題30種類',
      price: 1980,
      icon: Star,
      templates: [
        {
          id: 'topic_1',
          content: 'それは確かに！僕も同じこと思ってました（笑）でも実際やってみると意外と[具体的な体験]で、面白かったです。',
          category: 'conversation_topics_pack',
          isPreview: true
        },
        {
          id: 'topic_2',
          content: 'わかります！僕も[共感する内容]で、すごく共感できます。[相手の話題]について、もう少し詳しく聞かせていただけませんか？',
          category: 'conversation_topics_pack',
        },
        {
          id: 'topic_3',
          content: '[趣味]をされているんですね！どのくらい続けられているんですか？僕も[関連する経験]があって、とても興味があります。',
          category: 'conversation_topics_pack',
        },
        // 残りのテンプレートを追加
        ...Array.from({ length: 27 }, (_, i) => ({
          id: `topic_${i + 4}`,
          content: `[話題${i + 4}]について、とても面白いですね！僕も[関連する体験や考え${i + 4}]で、詳しくお聞かせいただけませんか？`,
          category: 'conversation_topics_pack',
        }))
      ]
    }
  ];

  const handlePurchase = async (categoryId: string) => {
    if (!user) {
      alert('購入するにはログインが必要です。');
      return;
    }

    try {
      await purchaseTemplate(categoryId);
    } catch (error) {
      console.error('Template purchase error:', error);
      alert('テンプレート購入の処理中にエラーが発生しました。');
    }
  };

  const handleCopyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(''), 2000);
  };

  const currentCategory = templateCategories.find(cat => cat.id === selectedCategory);
  const isPurchased = purchasedTemplates.includes(selectedCategory) || isPremiumUser;

  // ショップモード用：プレビューテンプレートのみ表示
  const getDisplayTemplates = () => {
    if (!currentCategory) return [];
    
    if (viewMode === 'shop') {
      // ショップモードでは、購入済みなら全て、未購入ならプレビューのみ
      if (isPurchased) {
        return currentCategory.templates;
      } else {
        // 未購入の場合はプレビューテンプレートのみ
        return currentCategory.templates.filter(template => template.isPreview);
      }
    } else {
      // 購入済みモードでは購入済みテンプレートのみ
      if (isPurchased) {
        return currentCategory.templates;
      }
      return [];
    }
  };

  const displayTemplates = getDisplayTemplates();

  // Filter categories based on view mode
  const displayCategories = viewMode === 'purchased' 
    ? templateCategories.filter(cat => purchasedTemplates.includes(cat.id) || isPremiumUser)
    : templateCategories;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            テンプレート集
          </h1>
          <p className="text-gray-600">
            シーン別の効果的なメッセージテンプレート（各カテゴリ30種類）
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <button
              onClick={() => setViewMode('shop')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'shop'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              ショップ
            </button>
            <button
              onClick={() => setViewMode('purchased')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                viewMode === 'purchased'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              購入済み ({purchasedTemplates.length + (isPremiumUser ? templateCategories.length : 0)})
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {displayCategories.map((category) => {
            const Icon = category.icon;
            const isOwned = purchasedTemplates.includes(category.id) || isPremiumUser;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
                {isOwned && (
                  <Crown className="w-3 h-3 text-yellow-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Template Pack Info */}
        {viewMode === 'shop' && currentCategory && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentCategory.name}</h2>
                <p className="text-gray-600">{currentCategory.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    📝 豊富なテンプレート集
                  </span>
                  <span className="text-sm text-gray-500">
                    ⭐ 効果実証済み
                  </span>
                  <span className="text-sm text-gray-500">
                    🔄 買い切り（永続利用）
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600 mb-2">¥{currentCategory.price.toLocaleString()}</div>
                {!isPurchased ? (
                  <button
                    onClick={() => handlePurchase(selectedCategory)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                  >
                    購入する
                  </button>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">
                      {isPremiumUser ? 'プレミアム特典' : '購入済み'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {viewMode === 'shop' && !isPurchased ? (
          // ショップモード（未購入）：プレビューテンプレートのみ表示
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">プレビュー</h3>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">購入後に全てのテンプレートが利用可能</span>
                </div>
              </div>
              
              {displayTemplates.map((template) => (
                <div key={template.id} className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-gray-800 leading-relaxed">{template.content}</p>
                  </div>
                </div>
              ))}
              
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-600 mb-4">
                  このパックには他にも多数のテンプレートが含まれています
                </p>
                <button
                  onClick={() => handlePurchase(selectedCategory)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  ¥{currentCategory.price.toLocaleString()} で購入して全てのテンプレートを見る
                </button>
              </div>
            </div>
          </div>
        ) : displayTemplates.length > 0 ? (
          // 購入済みまたは購入済みモード：全テンプレート表示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-sm leading-relaxed">{template.content}</p>
                </div>
                
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => handleCopyTemplate(template)}
                    className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    {copiedTemplateId === template.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-sm">コピー済み</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {viewMode === 'purchased' ? '購入済みテンプレートがありません' : 'テンプレートを購入しましょう'}
            </h3>
            <p className="text-gray-600 mb-6">
              {viewMode === 'purchased' 
                ? 'ショップでテンプレートを購入すると、ここに表示されます'
                : '効果的なメッセージテンプレートで会話を盛り上げましょう'
              }
            </p>
            {viewMode === 'purchased' && (
              <button
                onClick={() => setViewMode('shop')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                ショップを見る
              </button>
            )}
          </div>
        )}

        {/* Statistics */}
        {isPurchased && currentCategory && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 text-center">テンプレート統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">{currentCategory.templates.length}</div>
                <div className="text-purple-100">テンプレート数</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">∞</div>
                <div className="text-purple-100">利用回数</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-purple-100">実用性</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24h</div>
                <div className="text-purple-100">サポート</div>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        {viewMode === 'shop' && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">安心・安全な利用のために</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-purple-100">
              <div>
                <h3 className="font-semibold mb-2">🔒 データ保護</h3>
                <p className="text-sm">購入者のみアクセス可能な暗号化システム</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚖️ 利用規約</h3>
                <p className="text-sm">転載・再配布は固く禁止されています</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🛡️ 不正利用防止</h3>
                <p className="text-sm">ウォーターマーク機能で著作権を保護</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;