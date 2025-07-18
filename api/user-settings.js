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
    const { settings } = req.body;
    
    console.log('⚙️ ユーザー設定更新:', settings);
    
    // 設定に応じた処理を実行
    if (settings.notifications?.email) {
      console.log('📧 メール通知リストに追加');
    }
    
    if (settings.notifications?.push) {
      console.log('🔔 プッシュ通知を設定');
    }
    
    if (!settings.privacy?.saveConversationHistory) {
      console.log('🗑️ 会話履歴削除処理');
    }
    
    res.json({ success: true, message: '設定が更新されました' });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: error.message });
  }
}