import React from 'react';
import { 
  Users, 
  Filter,
  Search,
  X
} from 'lucide-react';
import { useCalendarStore } from '../store/calendarStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    filters,
    toggleUserFilter,
    clearFilters,
    openUserModal
  } = useCalendarStore();

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside className={`
        fixed lg:relative lg:block
        w-80 h-full bg-white border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-64 xl:w-80
      `}>
        <div className="flex flex-col h-full">
          {/* サイドバーヘッダー */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">フィルター</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* スクロール可能なコンテンツ */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            {/* 検索フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Search className="w-4 h-4 inline mr-2" />
                イベント検索
              </label>
              <input
                type="text"
                placeholder="タイトルで検索..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* ユーザーフィルター */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 inline mr-2" />
                  チームメンバー
                </label>
                <button
                  onClick={openUserModal}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  管理
                </button>
              </div>

              <div className="space-y-2">
                {users.map(user => {
                  const isFiltered = filters.users.includes(user.id);
                  const visibleEvents = isFiltered ? 0 : Math.floor(Math.random() * 10) + 1; // 仮の数値

                  return (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                        isFiltered 
                          ? 'border-gray-200 bg-gray-50 opacity-60' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!isFiltered}
                        onChange={() => toggleUserFilter(user.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="ml-3 flex items-center flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm truncate">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user.department} • {user.position}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          {visibleEvents}件
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    チームメンバーがいません
                  </p>
                  <button
                    onClick={openUserModal}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    メンバーを追加
                  </button>
                </div>
              )}
            </div>

            {/* フィルタークリア */}
            {(filters.users.length > 0 || filters.categories.length > 0) && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>フィルターをクリア</span>
                </button>
              </div>
            )}
          </div>

          {/* サイドバーフッター */}
          <div className="p-4 lg:p-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">
                表示中のイベント
              </div>
              <div className="text-lg font-bold text-primary-600">
                {users.length > 0 ? Math.floor(Math.random() * 50) + 10 : 0}件
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}; 