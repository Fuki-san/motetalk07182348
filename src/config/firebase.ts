import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 環境変数のデバッグ情報を出力
console.log('🔍 Firebase環境変数チェック:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ 設定済み' : '❌ 未設定',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ 設定済み' : '❌ 未設定',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ 設定済み' : '❌ 未設定',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ 設定済み' : '❌ 未設定',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ 設定済み' : '❌ 未設定',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? '✅ 設定済み' : '❌ 未設定'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Firebase設定の詳細検証
console.log('🔧 Firebase設定値:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 10)}...` : '❌ 空',
  authDomain: firebaseConfig.authDomain || '❌ 空',
  projectId: firebaseConfig.projectId || '❌ 空'
});

// 必須項目のチェック
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);

if (missingFields.length > 0) {
  console.error('❌ Firebase設定エラー - 以下の項目が未設定:', missingFields);
  console.error('📝 .envファイルを確認してください');
} else {
  console.log('✅ Firebase設定完了');
}

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

export default app;