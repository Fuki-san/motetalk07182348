const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🛒 Checkout session作成リクエスト:', req.body);
    
    const { type, planId, templateId, successUrl, cancelUrl } = req.body;

    let sessionConfig = {
      payment_method_types: ['card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (type === 'subscription') {
      // サブスクリプション設定
      const priceData = {
        premium_monthly: {
          unit_amount: 198000, // ¥1,980
          currency: 'jpy',
          recurring: { interval: 'month' },
          product_data: {
            name: 'MoteTalk プレミアムプラン',
            description: 'AI返信生成無制限、全テンプレート使い放題'
          }
        }
      };

      sessionConfig.mode = 'subscription';
      sessionConfig.line_items = [{
        price_data: priceData[planId],
        quantity: 1,
      }];
    } else if (type === 'one_time') {
      // 買い切り購入設定
      const templatePrices = {
        first_message_pack: { amount: 98000, name: '初回メッセ神パターン集' },
        line_transition_pack: { amount: 128000, name: 'LINE移行テンプレ' },
        date_invitation_pack: { amount: 198000, name: '誘い文句大全' },
        conversation_topics_pack: { amount: 198000, name: '会話ネタ一覧' }
      };

      const template = templatePrices[templateId];
      
      sessionConfig.mode = 'payment';
      sessionConfig.line_items = [{
        price_data: {
          currency: 'jpy',
          unit_amount: template.amount,
          product_data: {
            name: template.name,
            description: 'MoteTalk テンプレートパック'
          }
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ Checkout session作成成功:', session.id);
    
    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Checkout session作成エラー:', error);
    res.status(500).json({ error: error.message });
  }
}