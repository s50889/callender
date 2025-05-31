import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Save, User } from 'lucide-react';
import { useCalendarStore } from '../store/calendarStore';
import { User as UserType } from '../types';

const predefinedColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#e11d48', '#8b5cf6', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#ec4899', '#14b8a6'
];

const departments = [
  '開発部', 'デザイン部', '営業部', 'マーケティング部',
  '人事部', '総務部', '経理部', '企画部'
];

const positions = [
  'エンジニア', 'シニアエンジニア', 'リードエンジニア',
  'デザイナー', 'シニアデザイナー', 'リードデザイナー',
  'マネージャー', 'シニアマネージャー', 'ディレクター',
  'アシスタント', 'スペシャリスト', '主任', '課長', '部長'
];

export const UserModal: React.FC = () => {
  const { users, closeUserModal, addUser, updateUser, deleteUser } = useCalendarStore();
  
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    color: predefinedColors[0]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      position: '',
      color: predefinedColors[0]
    });
    setEditingUser(null);
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      department: user.department,
      position: user.position,
      color: user.color
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData);
    }
    
    resetForm();
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('このユーザーを削除してもよろしいですか？関連するイベントも削除されます。')) {
      deleteUser(userId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            チームメンバー管理
          </h2>
          <button
            onClick={closeUserModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ユーザー一覧 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  現在のメンバー ({users.length}人)
                </h3>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.department} · {user.position}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>まだメンバーが登録されていません</p>
                  </div>
                )}
              </div>
            </div>

            {/* ユーザー追加・編集フォーム */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingUser ? 'メンバーを編集' : '新しいメンバーを追加'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 名前 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="田中 太郎"
                  />
                </div>

                {/* メールアドレス */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tanaka@company.com"
                  />
                </div>

                {/* 部署 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    部署 *
                  </label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">部署を選択</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* 役職 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    役職 *
                  </label>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">役職を選択</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* カラー選択 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カラー
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color 
                            ? 'border-gray-400 scale-110' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* プレビュー */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プレビュー
                  </label>
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: formData.color }}
                    >
                      {formData.name.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formData.name || '名前未入力'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formData.department || '部署未選択'} · {formData.position || '役職未選択'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formData.email || 'メール未入力'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center space-x-3 pt-4">
                  {editingUser && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2 flex-1"
                  >
                    {editingUser ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{editingUser ? '更新' : '追加'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 