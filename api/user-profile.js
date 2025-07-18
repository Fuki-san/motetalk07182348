export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 認証ヘッダーから情報を取得（簡易版）
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }
    
    // デモ用のユーザープロフィール（実際の実装ではFirebaseから取得）
    const userProfile = {
      uid: 'demo-user-id',
      email: 'demo@example.com',
      name: 'デモユーザー',
      plan: 'free',
      subscriptionStatus: null,
      purchasedTemplates: []
    };
    
    res.json(userProfile);

  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
}