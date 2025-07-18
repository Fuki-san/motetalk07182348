const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testPayments() {
  console.log('🧪 Stripe決済テストを開始します...\n');

  try {
    // 1. 商品の作成テスト
    console.log('1. 商品作成テスト...');
    const product = await stripe.products.create({
      name: 'MoteTalk プレミアムプラン（テスト）',
      description: 'AI返信生成無制限、全テンプレート使い放題'
    });
    console.log('✅ 商品作成成功:', product.id);

    // 2. 価格の作成テスト
    console.log('\n2. 価格作成テスト...');
    const price = await stripe.prices.create({
      unit_amount: 198000, // ¥1,980
      currency: 'jpy',
      recurring: { interval: 'month' },
      product: product.id,
    });
    console.log('✅ 価格作成成功:', price.id);

    // 3. Checkout セッション作成テスト
    console.log('\n3. Checkoutセッション作成テスト...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/pricing',
    });
    console.log('✅ Checkoutセッション作成成功:', session.id);
    console.log('🔗 テスト決済URL:', session.url);

    // 4. テンプレート購入セッション作成テスト
    console.log('\n4. テンプレート購入セッション作成テスト...');
    const templateSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          unit_amount: 98000, // ¥980
          product_data: {
            name: '初回メッセ神パターン集（テスト）',
            description: 'MoteTalk テンプレートパック'
          }
        },
        quantity: 1,
      }],
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/templates',
    });
    console.log('✅ テンプレート購入セッション作成成功:', templateSession.id);
    console.log('🔗 テンプレート購入URL:', templateSession.url);

    console.log('\n🎉 全てのStripeテストが成功しました！');
    console.log('\n📝 次のステップ:');
    console.log('1. `npm run test:stripe` でWebhookリスニングを開始');
    console.log('2. 上記のURLで実際の決済テストを実行');
    console.log('3. Webhookイベントの受信を確認');

  } catch (error) {
    console.error('❌ テストエラー:', error.message);
  }
}

testPayments();