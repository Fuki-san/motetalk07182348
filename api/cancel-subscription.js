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
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    // Stripeでサブスクリプションを期間終了時に解約
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    console.log('🔄 サブスクリプション解約リクエスト受信');
    
    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAt: subscription.cancel_at
    });

  } catch (error) {
    console.error('❌ Subscription cancellation error:', error);
    res.status(500).json({ error: error.message });
  }
}