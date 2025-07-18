import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
// import { userService, UserProfile } from '../services/databaseService';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  plan: 'free' | 'premium';
  subscriptionId?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  purchasedTemplates: string[];
}

export const useUserData = () => {
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (authUser) {
        try {
          // デモ用のユーザー情報（APIエラーを避けるため直接設定）
          const profile = {
            uid: authUser.uid,
            email: authUser.email,
            name: authUser.name,
            photoURL: authUser.photoURL,
            plan: 'free' as const,
            subscriptionStatus: null,
            purchasedTemplates: []
          };
          
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to load user data:', error);
          // エラー時のフォールバック
          setUserProfile({
            uid: authUser.uid,
            email: authUser.email,
            name: authUser.name,
            photoURL: authUser.photoURL,
            plan: 'free' as const,
            subscriptionStatus: null,
            purchasedTemplates: []
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    };

    loadUserData();
  }, [authUser]);

  const updateUserPlan = async (plan: 'free' | 'premium', subscriptionData?: any) => {
    if (authUser) {
      // 実際の実装ではAPIを呼び出してデータベースを更新
      setUserProfile(prev => prev ? {
        ...prev,
        plan,
        ...subscriptionData
      } : null);
    }
  };

  const addPurchasedTemplate = async (templateId: string) => {
    if (authUser) {
      // 実際の実装ではAPIを呼び出してデータベースを更新
      setUserProfile(prev => prev ? {
        ...prev,
        purchasedTemplates: [...prev.purchasedTemplates, templateId]
      } : null);
    }
  };

  return {
    userProfile,
    loading,
    updateUserPlan,
    addPurchasedTemplate
  };
};