import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import 'dotenv/config';

// メール配信サービス設定
const EMAIL_SERVICE_CONFIG = {
  // 実際の実装では SendGrid, AWS SES, Nodemailer などを使用
  enabled: process.env.NODE_ENV === 'production',
  fromEmail: 'noreply@motetalk.com',
  supportEmail: 'support@motetalk.com'
};

// 環境変数のデバッグ情報を出力
console.log('🔍 環境変数チェック:', {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '✅ 設定済み' : '❌ 未設定',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✅ 設定済み' : '❌ 未設定',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✅ 設定済み' : '❌ 未設定',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✅ 設定済み' : '❌ 未設定',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY が設定されていません！');
  console.error('📝 .envファイルを確認してください');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Firebase Admin初期化
let db;
try {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Firebase環境変数が不完全です');
    console.error('必要な変数: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    
    db = admin.firestore();
    console.log('✅ Firebase Admin SDK初期化完了');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK初期化エラー:', error.message);
  console.error('📝 Firebase Console で Service Account キーを確認してください');
}


const app = express();
const PORT = process.env.PORT || 3001;

// JWT認証ミドルウェア
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!admin.apps.length) {
      console.error('❌ Firebase Admin未初期化 - 認証をスキップ');
      // 開発環境用のモックユーザー
      req.user = {
        uid: 'demo-user-id',
        email: 'demo@example.com',
        name: 'デモユーザー'
      };
      return next();
    }
    
    // Firebase ID Tokenを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // ユーザー情報をリクエストに追加
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email
    };
    
    console.log('✅ ユーザー認証成功:', req.user.email);
    next();
    
  } catch (error) {
    console.error('❌ JWT認証エラー:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 認証が必要なエンドポイント用のミドルウェア
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// 開発環境でのログ強化
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Middleware
app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Stripe Checkout Session作成
app.post('/api/create-checkout-session', async (req, res) => {
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
});

// 購入状況確認
app.get('/api/check-purchase-status', async (req, res) => {
  try {
    const { session_id } = req.query;
    
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    res.json({
      status: session.payment_status,
      customer_email: session.customer_details?.email,
      type: session.mode === 'subscription' ? 'subscription' : 'one_time',
      amount_total: session.amount_total
    });

  } catch (error) {
    console.error('Purchase status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// サブスクリプション解約
app.post('/api/cancel-subscription', authenticateUser, requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // ユーザーのサブスクリプションIDを取得
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const subscriptionId = userData.subscriptionId;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Stripeでサブスクリプションを期間終了時に解約
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    // Firestoreのユーザー情報を更新
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'cancel_at_period_end',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
});

// ユーザー情報取得（デモ用）
app.get('/api/user-profile', authenticateUser, requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    if (!db) {
      // Firebase未初期化時のフォールバック
      const userProfile = {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        plan: 'free',
        subscriptionStatus: null,
        purchasedTemplates: []
      };
      return res.json(userProfile);
    }
    
    // Firestoreからユーザー情報を取得
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      // ユーザーが存在しない場合は新規作成
      const newUserProfile = {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        plan: 'free',
        subscriptionStatus: null,
        purchasedTemplates: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(userId).set(newUserProfile);
      console.log('✅ 新規ユーザー作成:', req.user.email);
      
      return res.json({
        ...newUserProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const userProfile = {
      uid: userId,
      ...userDoc.data()
    };
    
    res.json(userProfile);

  } catch (error) {
    console.error('User profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ユーザー設定更新
app.post('/api/user-settings', authenticateUser, requireAuth, async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.uid;
    
    console.log('⚙️ ユーザー設定更新:', settings);
    
    // 設定に応じた処理を実行
    if (settings.notifications?.email) {
      console.log('📧 メール通知リストに追加');
      // メール配信サービスに登録
    }
    
    if (settings.notifications?.push) {
      console.log('🔔 プッシュ通知を設定');
      // プッシュ通知サービスに登録
    }
    
    if (!settings.privacy?.saveConversationHistory) {
      console.log('🗑️ 会話履歴削除処理');
      // 実際の会話履歴削除処理
      if (db) {
        const conversationsQuery = await db.collection('conversations').where('userId', '==', userId).get();
        const deletePromises = conversationsQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        console.log('✅ 会話履歴削除完了:', conversationsQuery.docs.length, '件');
      }
    }
    
    // Firestoreに設定を保存
    if (db) {
      await db.collection('users').doc(userId).update({
        settings: settings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ ユーザー設定をFirestoreに保存:', userId);
    }
    
    res.json({ success: true, message: '設定が更新されました' });

  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// アカウント削除
app.delete('/api/delete-account', authenticateUser, requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const email = req.user.email;
    
    console.log('🗑️ アカウント削除リクエスト:', { userId, email });
    
    // 1. ユーザーのサブスクリプションを解約
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().subscriptionId) {
        try {
          await stripe.subscriptions.cancel(userDoc.data().subscriptionId);
          console.log('✅ サブスクリプション解約完了');
        } catch (error) {
          console.error('⚠️ サブスクリプション解約エラー:', error.message);
        }
      }
    }
    
    // 2. Firestoreからユーザーデータを削除
    await deleteUserData(userId);
    
    // 3. Firebase Authenticationからユーザーを削除
    if (admin.apps.length) {
      try {
        await admin.auth().deleteUser(userId);
        console.log('✅ Firebase認証削除完了:', userId);
      } catch (error) {
        console.error('⚠️ Firebase認証削除エラー:', error.message);
      }
    }
    
    // 4. Stripe顧客削除（必要に応じて）
    if (db) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data().stripeCustomerId) {
        try {
          await stripe.customers.del(userDoc.data().stripeCustomerId);
          console.log('✅ Stripe顧客削除完了');
        } catch (error) {
          console.error('⚠️ Stripe顧客削除エラー:', error.message);
        }
      }
    }
    
    // 削除完了ログ
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
});

// ユーザーデータ削除のヘルパー関数（実装例）
async function deleteUserData(userId) {
  try {
    if (!db) {
      console.error('❌ Firestore未初期化 - ユーザーデータ削除をスキップ');
      return;
    }

    // 会話履歴削除
    const conversationsQuery = await db.collection('conversations').where('userId', '==', userId).get();
    const deleteConversationPromises = conversationsQuery.docs.map(doc => doc.ref.delete());
    await Promise.all(deleteConversationPromises);
    console.log('✅ 会話履歴削除完了:', conversationsQuery.docs.length, '件');
    
    // 購入履歴削除
    const purchasesQuery = await db.collection('purchases').where('userId', '==', userId).get();
    const deletePurchasePromises = purchasesQuery.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePurchasePromises);
    console.log('✅ 購入履歴削除完了:', purchasesQuery.docs.length, '件');
    
    // ユーザープロフィール削除
    await db.collection('users').doc(userId).delete();
    console.log('✅ ユーザープロフィール削除完了:', userId);
    
  } catch (error) {
    console.error('❌ Firestore削除エラー:', error);
    throw error;
  }
}

// Stripe Webhook処理
app.post('/webhook', async (req, res) => {
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
      
      // データベースに購入情報を保存
      await savePurchaseToDatabase(session);
      break;

    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('✅ サブスクリプション開始:', subscription.id);
      
      await handleSubscriptionStart(subscription);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('⚠️  サブスクリプション終了:', deletedSubscription.id);
      
      await handleSubscriptionEnd(deletedSubscription);
      break;

    default:
      console.log(`📋 未処理イベント: ${event.type}`);
  }

  res.json({ received: true });
});

// データベース操作関数
async function savePurchaseToDatabase(session) {
  try {
    if (!db) {
      console.error('❌ Firestore未初期化 - 購入データを保存できません');
      return;
    }

    const purchaseData = {
      stripeSessionId: session.id,
      customerEmail: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      status: 'completed',
      type: session.mode === 'subscription' ? 'subscription' : 'template',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('purchases').add(purchaseData);
    console.log('✅ 購入データをFirestoreに保存:', session.id);
  } catch (error) {
    console.error('❌ 購入データ保存エラー:', error);
  }
}

async function handleSubscriptionStart(subscription) {
  try {
    if (!db) {
      console.error('❌ Firestore未初期化 - サブスクリプション開始処理をスキップ');
      return;
    }

    // カスタマー情報からユーザーを特定してプラン更新
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // customer.emailからユーザーを特定してプラン更新
    const usersQuery = await db.collection('users').where('email', '==', customer.email).get();
    
    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      await userDoc.ref.update({
        plan: 'premium',
        subscriptionId: subscription.id,
        subscriptionStatus: 'active',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ ユーザープランをプレミアムに更新:', customer.email);
    } else {
      console.error('❌ ユーザーが見つかりません:', customer.email);
    }
  } catch (error) {
    console.error('❌ サブスクリプション開始処理エラー:', error);
  }
}

async function handleSubscriptionEnd(subscription) {
  try {
    if (!db) {
      console.error('❌ Firestore未初期化 - サブスクリプション終了処理をスキップ');
      return;
    }

    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // customer.emailからユーザーを特定してプラン更新
    const usersQuery = await db.collection('users').where('email', '==', customer.email).get();
    
    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      const userData = userDoc.data();
      
      await userDoc.ref.update({
        plan: 'free',
        subscriptionId: admin.firestore.FieldValue.delete(),
        subscriptionStatus: 'canceled',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ ユーザープランを無料に戻しました:', customer.email);
      
      // サブスクリプション解約通知メール
      const emailTemplate = generateEmailTemplate('subscription_canceled', {
        name: userData.name || customer.email,
        periodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString('ja-JP')
      });
      
      if (emailTemplate) {
        await sendEmail(customer.email, emailTemplate.subject, emailTemplate.html, emailTemplate.text);
      }
    } else {
      console.error('❌ ユーザーが見つかりません:', customer.email);
    }
  } catch (error) {
    console.error('❌ サブスクリプション終了処理エラー:', error);
  }
}

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});