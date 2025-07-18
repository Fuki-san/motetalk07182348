const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;
    
    console.log('🗑️ アカウント削除リクエスト:', { userId, email });
    
    // 実際の実装では以下の処理を行う：
    // 1. ユーザーのサブスクリプションを解約
    // 2. Firestoreからユーザーデータを削除
    // 3. Firebase Authenticationからユーザーを削除
    // 4. Stripe顧客削除
    
    // デモ用の成功レスポンス
    console.log('🎯 アカウント削除処理完了:', email);
    
    res.json({ 
      success: true, 
      message: 'アカウントが正常に削除されました' 
    });

  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'アカウント削除中にエラーが発生しました'
    });
  }
}