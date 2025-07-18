import React, { useState } from 'react';
import { Send, Copy, RefreshCw, Sparkles, MessageCircle, Crown, Star, ArrowRight, Trash2, RotateCcw, Settings } from 'lucide-react';
import { generateReplies, ConversationTurn as ApiConversationTurn } from '../services/geminiService';

interface DashboardProps {
  isAuthenticated: boolean;
}

interface ConversationTurn {
  id: string;
  userMessage: string;
  aiReplies: string[];
  selectedReply?: string;
  timestamp: Date;
}

const Dashboard: React.FC<DashboardProps> = ({ isAuthenticated }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentReplies, setCurrentReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReplyIndex, setSelectedReplyIndex] = useState<number | null>(null);
  const [editableReply, setEditableReply] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState({
    partnerName: '',
    age: '',
    interests: '',
    relationshipGoal: 'casual' as 'casual' | 'serious' | 'friendship',
    communicationStyle: 'casual' as 'polite' | 'casual' | 'funny'
  });

  // Mock user plan - in real app this would come from user context
  const userPlan = 'premium'; // 'free', 'premium'
  const maxConversationTurns = userPlan === 'free' ? 3 : 10;

  const handleGenerateReplies = async () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    setSelectedReplyIndex(null);
    
    console.log('🤖 AI返信生成開始:', {
      message: inputMessage.slice(0, 50) + '...',
      historyLength: conversation.length
    });
    
    try {
      // 会話履歴をAPI用の形式に変換
      const apiConversationHistory: ApiConversationTurn[] = conversation.map(turn => ({
        userMessage: turn.userMessage,
        selectedReply: turn.selectedReply
      }));

      // Gemini APIを呼び出し
      const response = await generateReplies({
        currentMessage: inputMessage,
        conversationHistory: apiConversationHistory,
        userProfile: {
          partnerName: userSettings.partnerName || undefined,
          age: userSettings.age ? parseInt(userSettings.age) : undefined,
          interests: userSettings.interests ? userSettings.interests.split('、').map(s => s.trim()) : undefined,
          relationshipGoal: userSettings.relationshipGoal,
          communicationStyle: userSettings.communicationStyle
        }
      });

      if (response.success) {
        setCurrentReplies(response.replies);
      } else {
        // エラー時はフォールバック返信を使用
        setCurrentReplies(response.replies);
        console.warn('API Error:', response.error);
      }

    } catch (error) {
      console.error('Failed to generate replies:', error);
      
      // エラー時のフォールバック返信
      const fallbackReplies = [
        "そのお話、とても興味深いです！詳しく聞かせてください。",
        "なるほど！僕も似たような経験があって、共感できます。",
        "面白いですね。今度詳しくお聞かせいただけると嬉しいです。"
      ];
      setCurrentReplies(fallbackReplies);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReply = (index: number) => {
    setSelectedReplyIndex(index);
    setEditableReply(currentReplies[index]);
  };

  const handleSendReply = () => {
    if (selectedReplyIndex === null || !editableReply.trim()) return;

    const newTurn: ConversationTurn = {
      id: Date.now().toString(),
      userMessage: inputMessage,
      aiReplies: currentReplies,
      selectedReply: editableReply,
      timestamp: new Date()
    };

    // Limit conversation history based on plan
    const updatedConversation = [...conversation, newTurn];
    if (updatedConversation.length > maxConversationTurns) {
      updatedConversation.shift(); // Remove oldest conversation
    }

    setConversation(updatedConversation);
    setInputMessage('');
    setCurrentReplies([]);
    setSelectedReplyIndex(null);
    setEditableReply('');
  };

  const handleCopyReply = (reply: string) => {
    navigator.clipboard.writeText(reply);
  };

  const handleClearConversation = () => {
    setConversation([]);
    setCurrentReplies([]);
    setInputMessage('');
    setSelectedReplyIndex(null);
    setEditableReply('');
  };

  const handleEditAndRegenerate = (turnId: string) => {
    const turn = conversation.find(t => t.id === turnId);
    if (turn) {
      setInputMessage(turn.userMessage);
      // Remove this turn and all subsequent turns
      const turnIndex = conversation.findIndex(t => t.id === turnId);
      setConversation(conversation.slice(0, turnIndex));
      setCurrentReplies([]);
      setSelectedReplyIndex(null);
      setEditableReply('');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI会話アシスタント
          </h1>
          <p className="text-gray-600">
            連続対話で自然な会話の流れをサポート
          </p>
        </div>

        {/* Plan Limitation Notice */}
        {conversation.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">
                  会話履歴: {conversation.length}/{maxConversationTurns}往復
                  {userPlan === 'free' && ' (無料プランは3往復まで)'}
                </span>
              </div>
              <button
                onClick={handleClearConversation}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>リセット</span>
              </button>
            </div>
          </div>
        )}

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-800">会話履歴</h2>
            </div>
            
            <div className="space-y-4">
              {conversation.map((turn, index) => (
                <div key={turn.id} className="border-l-4 border-purple-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {index + 1}回目のやり取り
                    </span>
                    <button
                      onClick={() => handleEditAndRegenerate(turn.id)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      編集・再生成
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <div className="text-xs text-gray-500 mb-1">相手からのメッセージ:</div>
                    <div className="text-gray-800">{turn.userMessage}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 mb-1">あなたの返信:</div>
                    <div className="text-gray-800">{turn.selectedReply}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              {conversation.length === 0 ? '相手からのメッセージ' : '相手からの次のメッセージ'}
            </h2>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="ml-auto flex items-center space-x-1 text-purple-600 hover:text-purple-700 text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>パーソナライズ設定</span>
            </button>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">パーソナライズ設定</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">相手の名前（任意）</label>
                  <input
                    type="text"
                    value={userSettings.partnerName}
                    onChange={(e) => setUserSettings({...userSettings, partnerName: e.target.value})}
                    placeholder="例: さくらさん"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">あなたの年齢（任意）</label>
                  <input
                    type="number"
                    value={userSettings.age}
                    onChange={(e) => setUserSettings({...userSettings, age: e.target.value})}
                    placeholder="例: 28"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">あなたの趣味・興味（任意）</label>
                  <input
                    type="text"
                    value={userSettings.interests}
                    onChange={(e) => setUserSettings({...userSettings, interests: e.target.value})}
                    placeholder="例: 映画鑑賞、カフェ巡り、読書"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">関係性の目標</label>
                  <select
                    value={userSettings.relationshipGoal}
                    onChange={(e) => setUserSettings({...userSettings, relationshipGoal: e.target.value as any})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="casual">カジュアルな関係</option>
                    <option value="serious">真剣な交際</option>
                    <option value="friendship">友達関係</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">コミュニケーションスタイル</label>
                  <div className="flex space-x-4">
                    {[
                      { value: 'polite', label: '丁寧' },
                      { value: 'casual', label: 'カジュアル' },
                      { value: 'funny', label: 'ユーモア重視' }
                    ].map((style) => (
                      <label key={style.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="communicationStyle"
                          value={style.value}
                          checked={userSettings.communicationStyle === style.value}
                          onChange={(e) => setUserSettings({...userSettings, communicationStyle: e.target.value as any})}
                          className="text-purple-600"
                        />
                        <span className="text-sm text-gray-700">{style.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                conversation.length === 0 
                  ? "相手から受け取ったメッセージをここに貼り付けてください..."
                  : "相手からの次のメッセージを入力してください..."
              }
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {inputMessage.length}/500文字
              </div>
              <button
                onClick={handleGenerateReplies}
                disabled={!inputMessage.trim() || isLoading}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isLoading ? '生成中...' : '返信を生成'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Replies Section */}
        {(currentReplies.length > 0 || isLoading) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-2 mb-6">
              <Send className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-800">提案された返信</h2>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Helper Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 返信案をタップして選択→編集→送信すると、相手の次のメッセージも入力できて連続対話が可能です
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {currentReplies.map((reply, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedReplyIndex === index
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handleSelectReply(index)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                              selectedReplyIndex === index
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              返信案 {index + 1}
                            </span>
                            {selectedReplyIndex === index && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                選択中
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 leading-relaxed">{reply}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyReply(reply);
                          }}
                          className="ml-4 p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Editable Reply Section */}
                {selectedReplyIndex !== null && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Send className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">選択した返信を編集できます</span>
                    </div>
                    <textarea
                      value={editableReply}
                      onChange={(e) => setEditableReply(e.target.value)}
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none mb-4"
                      placeholder="返信内容を編集してください..."
                    />
                    <div className="flex justify-center">
                      <button
                        onClick={handleSendReply}
                        disabled={!editableReply.trim()}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
                      >
                        <Send className="w-4 h-4" />
                        <span>この返信を送信</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CTA Section - Show when authenticated and has replies */}
        {isAuthenticated && currentReplies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Star className="w-6 h-6" />
                <h3 className="text-lg font-semibold">テンプレート集</h3>
              </div>
              <p className="text-purple-100 mb-4">
                シーン別の効果的なメッセージテンプレートで、さらに会話を盛り上げましょう
              </p>
              <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200">
                <span>テンプレートを見る</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="w-6 h-6" />
                <h3 className="text-lg font-semibold">プレミアムプラン</h3>
              </div>
              <p className="text-yellow-100 mb-4">
                無制限のAI返信生成と10往復の会話履歴で、出会いの成功率をアップ
              </p>
              <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200">
                <span>プランを見る</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && currentReplies.length === 0 && inputMessage.trim() === '' && conversation.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              自然な会話の流れを作りましょう
            </h3>
            <p className="text-gray-600 mb-6">
              相手からのメッセージを入力すると、AIが文脈を理解して自然な返信を3つ提案します。<br />
              返信を選択・編集・送信後、相手の次のメッセージも入力すれば連続的な会話サポートが可能です。
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>文脈理解</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>編集可能</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>連続対話</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;