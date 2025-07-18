import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  privacy: {
    saveConversationHistory: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    push: false,
  },
  privacy: {
    saveConversationHistory: true,
  },
};

export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ユーザー設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          // LocalStorageから設定を読み込み（実際の実装ではFirestoreから取得）
          const savedSettings = localStorage.getItem(`user_settings_${user.uid}`);
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
        } catch (error) {
          console.error('Failed to load user settings:', error);
        }
      }
      setLoading(false);
    };

    loadSettings();
  }, [user]);

  // 設定を保存
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
        notifications: {
          ...settings.notifications,
          ...newSettings.notifications,
        },
        privacy: {
          ...settings.privacy,
          ...newSettings.privacy,
        },
      };

      // LocalStorageに保存（実際の実装ではFirestoreに保存）
      localStorage.setItem(`user_settings_${user.uid}`, JSON.stringify(updatedSettings));
      
      // 実際の実装では以下のようにFirestoreに保存
      // await updateDoc(doc(db, 'users', user.uid), {
      //   settings: updatedSettings,
      //   updatedAt: serverTimestamp()
      // });

      setSettings(updatedSettings);

      // 設定変更に応じた処理を実行
      await applySettingsChanges(updatedSettings);

      console.log('✅ 設定が保存されました:', updatedSettings);
    } catch (error) {
      console.error('❌ 設定の保存に失敗しました:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // 設定変更を適用
  const applySettingsChanges = async (newSettings: UserSettings) => {
    // メール通知設定
    if (newSettings.notifications.email) {
      console.log('📧 メール通知を有効化');
      // 実際の実装では、バックエンドAPIを呼び出してメール配信リストに追加
    } else {
      console.log('📧 メール通知を無効化');
      // メール配信リストから削除
    }

    // プッシュ通知設定
    if (newSettings.notifications.push) {
      console.log('🔔 プッシュ通知を有効化');
      // Push API の許可を要求
      if ('Notification' in window && 'serviceWorker' in navigator) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('✅ プッシュ通知の許可を取得');
          // Service Workerを登録してプッシュ通知を設定
        }
      }
    } else {
      console.log('🔔 プッシュ通知を無効化');
    }

    // 会話履歴保存設定
    if (!newSettings.privacy.saveConversationHistory) {
      console.log('🗑️ 既存の会話履歴を削除');
      // 実際の実装では、ユーザーの会話履歴をデータベースから削除
      // await deleteCollection(collection(db, 'conversations'), 
      //   where('userId', '==', user.uid));
    }
  };

  // 個別設定更新用のヘルパー関数
  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: boolean) => {
    updateSettings({
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    });
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    updateNotificationSetting,
    updatePrivacySetting,
  };
};