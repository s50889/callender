import React, { useState } from 'react';
import { Calendar, Mail, Lock, User, AlertCircle, Loader } from 'lucide-react';
import { useCalendarStore } from '../store/calendarStore';

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  });

  const { signIn, signUp, isLoading, error } = useCalendarStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      // サインアップ時のバリデーション
      if (formData.password !== formData.confirmPassword) {
        // エラーハンドリングは後で改善
        alert('パスワードが一致しません');
        return;
      }
      
      if (formData.password.length < 6) {
        alert('パスワードは6文字以上で入力してください');
        return;
      }
      
      await signUp(formData.email, formData.password, formData.displayName);
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Awesome Calendar
          </h1>
          <p className="text-primary-100 text-sm">
            {isSignUp ? 'アカウントを作成して始めましょう' : 'チームの予定を共有しよう'}
          </p>
        </div>

        {/* フォーム */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* 表示名（サインアップ時のみ） */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={handleInputChange('displayName')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="田中 太郎"
                  />
                </div>
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your@company.com"
                />
              </div>
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  6文字以上で入力してください
                </p>
              )}
            </div>

            {/* パスワード確認（サインアップ時のみ） */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード確認
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>処理中...</span>
                </>
              ) : (
                <span>{isSignUp ? 'アカウント作成' : 'ログイン'}</span>
              )}
            </button>
          </form>

          {/* モード切り替え */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              {isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントをお持ちでない方は'}
            </p>
            <button
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-1 transition-colors"
            >
              {isSignUp ? 'ログインはこちら' : 'アカウントを作成'}
            </button>
          </div>

          {/* デモアカウント */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                🚀 デモアカウント
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                すぐに試したい方は以下の情報でログインできます：
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Email:</strong> demo@company.com</div>
                <div><strong>Password:</strong> demo123</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    email: 'demo@company.com',
                    password: 'demo123',
                    displayName: '',
                    confirmPassword: ''
                  });
                  setIsSignUp(false);
                }}
                className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                デモアカウントを使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 