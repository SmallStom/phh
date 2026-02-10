import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, UserPlus, Heart, ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationSettingsApi } from '../api/notificationSettings';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  like: boolean;
  comment: boolean;
  follow: boolean;
  mention: boolean;
}

export const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    like: true,
    comment: true,
    follow: true,
    mention: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationSettingsApi.getSettings();
      const data = response.data;
      setSettings({
        email: data.email_enabled,
        push: data.push_enabled,
        like: data.like_enabled,
        comment: data.comment_enabled,
        follow: data.follow_enabled,
        mention: data.mention_enabled,
      });
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      await notificationSettingsApi.updateSettings({
        email_enabled: settings.email,
        push_enabled: settings.push,
        like_enabled: settings.like,
        comment_enabled: settings.comment,
        follow_enabled: settings.follow,
        mention_enabled: settings.mention,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const settingGroups = [
    {
      title: '通知方式',
      icon: Bell,
      settings: [
        { key: 'email' as keyof NotificationSettings, label: '邮件通知', icon: Mail },
        { key: 'push' as keyof NotificationSettings, label: '推送通知', icon: Bell },
      ]
    },
    {
      title: '通知类型',
      icon: Bell,
      settings: [
        { key: 'like' as keyof NotificationSettings, label: '点赞通知', icon: Heart },
        { key: 'comment' as keyof NotificationSettings, label: '评论通知', icon: MessageSquare },
        { key: 'follow' as keyof NotificationSettings, label: '关注通知', icon: UserPlus },
        { key: 'mention' as keyof NotificationSettings, label: '提及通知', icon: MessageSquare },
      ]
    }
  ];

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div 
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{
              borderColor: 'var(--border-color)',
              borderTopColor: 'var(--accent-color)'
            }}
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  通知设置
                </h1>
                <p 
                  className="text-sm mt-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  管理您的通知偏好
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'white'
              }}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中...
                </>
              ) : saved ? (
                <>
                  <Save className="w-4 h-4" />
                  已保存
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            {settingGroups.map((group) => (
              <div
                key={group.title}
                className="rounded-xl p-6"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon 
                    className="w-5 h-5" 
                    style={{ color: 'var(--accent-color)' }} 
                  />
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {group.title}
                  </h2>
                </div>

                <div className="space-y-3">
                  {group.settings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                    >
                      <div className="flex items-center gap-3">
                        <setting.icon 
                          className="w-4 h-4" 
                          style={{ color: 'var(--text-secondary)' }} 
                        />
                        <span 
                          className="font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {setting.label}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggle(setting.key)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[setting.key] 
                            ? 'bg-[var(--accent-color)]' 
                            : 'bg-[var(--border-color)]'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                            settings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)'
              }}
            >
              <h3 
                className="text-sm font-medium mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                提示
              </h3>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                您可以随时在这里调整通知设置。关闭某些通知类型后，您将不会收到相应类型的通知。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};