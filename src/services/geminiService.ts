import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface ConversationTurn {
  userMessage: string;
  selectedReply?: string;
}

export interface GenerateRepliesRequest {
  currentMessage: string;
  conversationHistory: ConversationTurn[];
  userProfile?: {
    partnerName?: string;
    age?: number;
    interests?: string[];
    personality?: string;
    relationshipGoal?: 'casual' | 'serious' | 'friendship';
    communicationStyle?: 'polite' | 'casual' | 'funny';
  };
}

export interface GenerateRepliesResponse {
  replies: string[];
  success: boolean;
  error?: string;
}

export const generateReplies = async (
  request: GenerateRepliesRequest
): Promise<GenerateRepliesResponse> => {
  console.log('🔮 Gemini API呼び出し:', {
    messageLength: request.currentMessage.length,
    historyCount: request.conversationHistory.length,
    hasApiKey: !!API_KEY
  });
  
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

    // 会話履歴を構築
    const conversationContext = request.conversationHistory
      .map((turn, index) => {
        return `${index + 1}回目のやり取り:
相手からのメッセージ: "${turn.userMessage}"
あなたの返信: "${turn.selectedReply || '未返信'}"`;
      })
      .join('\n\n');

    // ユーザープロフィール情報を構築
    const profileContext = request.userProfile ? `
【あなたの設定】
${request.userProfile.partnerName ? `相手の名前: ${request.userProfile.partnerName}` : ''}
${request.userProfile.age ? `あなたの年齢: ${request.userProfile.age}歳` : ''}
${request.userProfile.interests ? `あなたの趣味・興味: ${request.userProfile.interests.join('、')}` : ''}
${request.userProfile.relationshipGoal ? `関係性の目標: ${request.userProfile.relationshipGoal === 'casual' ? 'カジュアルな関係' : request.userProfile.relationshipGoal === 'serious' ? '真剣な交際' : '友達関係'}` : ''}
${request.userProfile.communicationStyle ? `コミュニケーションスタイル: ${request.userProfile.communicationStyle === 'polite' ? '丁寧' : request.userProfile.communicationStyle === 'casual' ? 'カジュアル' : 'ユーモア重視'}` : ''}
` : '';
    // プロンプトを構築
    const prompt = `あなたは日本のマッチングアプリで男性ユーザーをサポートするAIアシスタントです。
女性からのメッセージに対して、自然で魅力的な返信を3つ提案してください。

【重要な指針】
- 自然で親しみやすい日本語を使用
- 相手に興味を示し、会話を続けたくなるような内容
- 押し付けがましくなく、適度な距離感を保つ
- ユーモアを交えつつも、相手を尊重する姿勢
- 会話の流れを考慮した文脈に合った返信
- 返信案の説明や分類は含めず、返信内容のみを提供

${profileContext}

${conversationContext ? `【これまでの会話履歴】\n${conversationContext}\n` : ''}

【今回の相手からのメッセージ】
"${request.currentMessage}"

【返信案を3つ提案してください】
返信内容のみを以下の形式で回答してください：

返信案1: （返信内容）

返信案2: （返信内容）

返信案3: （返信内容）`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // レスポンスをパース
    const replies = parseGeminiResponse(text);

    if (replies.length === 0) {
      throw new Error('返信案の生成に失敗しました');
    }

    return {
      replies,
      success: true
    };

  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // フォールバック返信（開発・テスト用）
    const fallbackReplies = generateFallbackReplies(request.currentMessage);
    
    return {
      replies: fallbackReplies,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

const parseGeminiResponse = (text: string): string[] => {
  const replies: string[] = [];
  
  // 返信案1、返信案2、返信案3のパターンを抽出
  const patterns = [
    /返信案1:\s*(.+?)(?=返信案2:|$)/s,
    /返信案2:\s*(.+?)(?=返信案3:|$)/s,
    /返信案3:\s*(.+?)$/s
  ];

  patterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match[1]) {
      const reply = match[1].trim()
        .replace(/^\[|\]$/g, '')
        .replace(/^（|）$/g, '')
        .replace(/^\"|\"$/g, '');
      if (reply) {
        replies.push(reply);
      }
    }
  });

  // パースに失敗した場合は、行ごとに分割して抽出を試行
  if (replies.length === 0) {
    const lines = text.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      if (line.includes('返信案') && line.includes(':')) {
        const reply = line.split(':')[1]?.trim()
          .replace(/^\[|\]$/g, '')
          .replace(/^（|）$/g, '')
          .replace(/^\"|\"$/g, '');
        if (reply && replies.length < 3) {
          replies.push(reply);
        }
      }
    });
  }

  return replies.slice(0, 3); // 最大3つまで
};

const generateFallbackReplies = (message: string): string[] => {
  // API失敗時のフォールバック返信
  return [
    `${message.slice(0, 20)}について詳しく聞かせてください！とても興味深いです。`,
    `そうなんですね！僕も似たような経験があって、共感できます。`,
    `面白いお話ですね。今度詳しくお聞かせいただけると嬉しいです。`
  ];
};