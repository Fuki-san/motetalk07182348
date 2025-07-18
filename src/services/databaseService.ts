import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ユーザー情報の型定義
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  plan: 'free' | 'premium';
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  purchasedTemplates: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 会話履歴の型定義
export interface ConversationHistory {
  id: string;
  userId: string;
  messages: {
    userMessage: string;
    aiReplies: string[];
    selectedReply?: string;
    timestamp: Timestamp;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 購入履歴の型定義
export interface PurchaseHistory {
  id: string;
  userId: string;
  type: 'subscription' | 'template';
  itemId: string;
  itemName: string;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Timestamp;
}

// ユーザープロフィール管理
export const userService = {
  // ユーザー作成・更新
  async createOrUpdateUser(userData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userData.uid!);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // 新規ユーザー作成
      await setDoc(userRef, {
        ...userData,
        plan: 'free',
        purchasedTemplates: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // 既存ユーザー更新
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    }
  },

  // ユーザー情報取得
  async getUser(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  },

  // プラン更新
  async updateUserPlan(uid: string, plan: 'free' | 'premium', subscriptionData?: any): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      plan,
      ...subscriptionData,
      updatedAt: serverTimestamp()
    });
  },

  // テンプレート購入追加
  async addPurchasedTemplate(uid: string, templateId: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentTemplates = userDoc.data().purchasedTemplates || [];
      if (!currentTemplates.includes(templateId)) {
        await updateDoc(userRef, {
          purchasedTemplates: [...currentTemplates, templateId],
          updatedAt: serverTimestamp()
        });
      }
    }
  }
};

// 会話履歴管理
export const conversationService = {
  // 会話履歴保存
  async saveConversation(userId: string, messages: any[]): Promise<string> {
    const conversationRef = await addDoc(collection(db, 'conversations'), {
      userId,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: serverTimestamp()
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return conversationRef.id;
  },

  // ユーザーの会話履歴取得
  async getUserConversations(userId: string, limitCount: number = 10): Promise<ConversationHistory[]> {
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ConversationHistory[];
  },

  // 会話履歴更新
  async updateConversation(conversationId: string, messages: any[]): Promise<void> {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || serverTimestamp()
      })),
      updatedAt: serverTimestamp()
    });
  }
};

// 購入履歴管理
export const purchaseService = {
  // 購入履歴保存
  async savePurchase(purchaseData: Omit<PurchaseHistory, 'id' | 'createdAt'>): Promise<string> {
    const purchaseRef = await addDoc(collection(db, 'purchases'), {
      ...purchaseData,
      createdAt: serverTimestamp()
    });
    return purchaseRef.id;
  },

  // ユーザーの購入履歴取得
  async getUserPurchases(userId: string): Promise<PurchaseHistory[]> {
    const q = query(
      collection(db, 'purchases'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PurchaseHistory[];
  },

  // 購入状況更新
  async updatePurchaseStatus(purchaseId: string, status: 'completed' | 'pending' | 'failed'): Promise<void> {
    const purchaseRef = doc(db, 'purchases', purchaseId);
    await updateDoc(purchaseRef, { status });
  }
};

// 統計情報取得
export const analyticsService = {
  // ユーザーの利用統計取得
  async getUserStats(userId: string): Promise<{
    totalReplies: number;
    thisMonthReplies: number;
    totalConversations: number;
  }> {
    // 実装例（実際の統計計算）
    const conversations = await conversationService.getUserConversations(userId, 100);
    
    const totalReplies = conversations.reduce((total, conv) => 
      total + conv.messages.filter(msg => msg.selectedReply).length, 0
    );
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthReplies = conversations
      .filter(conv => conv.createdAt.toDate() >= thisMonth)
      .reduce((total, conv) => 
        total + conv.messages.filter(msg => msg.selectedReply).length, 0
      );
    
    return {
      totalReplies,
      thisMonthReplies,
      totalConversations: conversations.length
    };
  }
};