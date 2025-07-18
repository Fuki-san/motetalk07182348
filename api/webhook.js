const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  console.log('🔔 Webhook受信:', {
    signature: sig ? '✅ あり' : '❌ なし',
    secret: endpointSecret ? '✅ 設定済み' : '❌ 未設定',
    bodyLength: req.body.length
  });

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // 開発環境でWebhook Secretが未設定の場合
      console.log('⚠️  Webhook Secret未設定 - イベントを直接パース');
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📨 Webhookイベント:', event.type);

  // イベント処理
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ 決済完了:', session.id);
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('✅ サブスクリプション開始:', subscription.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('⚠️  サブスクリプション終了:', deletedSubscription.id);
      break;

    default:
      console.log(`📋 未処理イベント: ${event.type}`);
  }

  res.json({ received: true });
}