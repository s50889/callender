import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Trash2,
  Save,
  Palette
} from 'lucide-react';
import { useCalendarStore } from '../store/calendarStore';
import { CalendarEvent } from '../types';
import { format, addHours } from 'date-fns';

export const EventModal: React.FC = () => {
  const { 
    selectedEvent, 
    users, 
    currentDate,
    selectedStartTime,
    currentUser,
    closeEventModal, 
    addEvent, 
    updateEvent, 
    deleteEvent 
  } = useCalendarStore();

  const isEditing = !!selectedEvent;

  // 利用可能なカラーパレット
  const colorOptions = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#a855f7', // purple
    '#6b7280', // gray
    '#dc2626', // red-600
    '#059669', // emerald-600
    '#7c3aed'  // violet-600
  ];

  const [formData, setFormData] = useState({
    title: '',
    startDate: format(currentDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(currentDate, 'yyyy-MM-dd'),
    endTime: '10:00',
    allDay: false,
    attendees: [] as string[],
    color: colorOptions[0], // デフォルトカラーを青に
  });

  useEffect(() => {
    if (selectedEvent) {
      setFormData({
        title: selectedEvent.title,
        startDate: format(selectedEvent.startDate, 'yyyy-MM-dd'),
        startTime: format(selectedEvent.startDate, 'HH:mm'),
        endDate: format(selectedEvent.endDate, 'yyyy-MM-dd'),
        endTime: format(selectedEvent.endDate, 'HH:mm'),
        allDay: selectedEvent.allDay,
        attendees: selectedEvent.attendees,
        color: selectedEvent.color,
      });
    } else {
      // 新規作成時のデフォルト値設定
      const defaultStart = selectedStartTime || (() => {
        const now = new Date();
        const newDate = new Date(currentDate);
        newDate.setHours(now.getHours(), 0, 0, 0);
        return newDate;
      })();
      
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setHours(defaultStart.getHours() + 1);

      setFormData(prev => ({
        ...prev,
        startDate: format(defaultStart, 'yyyy-MM-dd'),
        startTime: format(defaultStart, 'HH:mm'),
        endDate: format(defaultEnd, 'yyyy-MM-dd'),
        endTime: format(defaultEnd, 'HH:mm'),
        color: colorOptions[0], // デフォルトカラーを青に
      }));
    }
  }, [selectedEvent, currentDate, selectedStartTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = formData.allDay 
      ? new Date(`${formData.startDate}T00:00:00`)
      : new Date(`${formData.startDate}T${formData.startTime}:00`);
    
    const endDateTime = formData.allDay
      ? new Date(`${formData.endDate}T23:59:59`)
      : new Date(`${formData.endDate}T${formData.endTime}:00`);

    // ログインユーザーのFirestoreユーザードキュメントを取得
    const loginUserDoc = users.find(u => u.email === currentUser?.email);

    let determinedUserId: string | undefined = loginUserDoc?.id;

    if (!determinedUserId && currentUser?.uid) {
      console.warn('[Debug] EventModal: loginUserDoc.id not found, falling back to currentUser.uid. Email:', currentUser.email);
      determinedUserId = currentUser.uid; // Fallback to auth UID
    }

    // ユーザーIDが取得できない場合はエラー
    if (!determinedUserId) {
      alert('ユーザー情報が見つかりません。画面を更新して再度お試しください。');
      console.error('[Debug] EventModal: Could not determine userId.', {currentUser, loginUserDoc, users});
      return;
    }

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: formData.title,
      description: '', // 空文字列に設定
      startDate: startDateTime,
      endDate: endDateTime,
      allDay: formData.allDay,
      userId: determinedUserId, // ログインユーザーのID
      attendees: formData.attendees,
      location: '', // 空文字列に設定
      color: formData.color || loginUserDoc?.color || '#6b7280', 
      category: 'meeting', // デフォルト値
      reminders: []
    };

    if (isEditing && selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent(eventData);
    }

    closeEventModal();
  };

  const handleDelete = () => {
    if (selectedEvent && window.confirm('このイベントを削除してもよろしいですか？')) {
      deleteEvent(selectedEvent.id);
      closeEventModal();
    }
  };

  const handleAttendeeToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter(id => id !== userId)
        : [...prev.attendees, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-lg lg:text-xl font-bold text-gray-900">
            {isEditing ? 'イベントを編集' : '新規イベント'}
          </h2>
          <button
            onClick={closeEventModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              イベントタイトル *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="イベントのタイトルを入力"
            />
          </div>

          {/* 日時設定 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                開始日
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                終了日
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* 終日チェックボックス */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">終日</span>
            </label>
          </div>

          {/* 時刻設定（終日でない場合） */}
          {!formData.allDay && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  開始時刻
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    const newStartTime = e.target.value;
                    // 現在の開始日+時刻から1時間後を計算
                    const startDateTime = new Date(`${formData.startDate}T${newStartTime}:00`);
                    const endDateTime = addHours(startDateTime, 1);
                    const newEndDate = format(endDateTime, 'yyyy-MM-dd');
                    const newEndTime = format(endDateTime, 'HH:mm');

                    setFormData(prev => ({
                      ...prev,
                      startTime: newStartTime,
                      endDate: newEndDate,
                      endTime: newEndTime
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  終了時刻
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          )}

          {/* 参加者選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              参加者
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map(user => (
                <label key={user.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.attendees.includes(user.id)}
                    onChange={() => handleAttendeeToggle(user.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="ml-2 lg:ml-3 flex items-center min-w-0 flex-1">
                    <div
                      className="w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-white text-xs mr-2 flex-shrink-0"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700 truncate">{user.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 色選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              イベントカラー
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-gray-50 rounded-lg">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    formData.color === color 
                      ? 'border-gray-800 ring-2 ring-offset-2 ring-gray-400' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`色を選択: ${color}`}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-xs lg:text-sm text-gray-600">選択中: {formData.color}</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 lg:pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>削除</span>
                </button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={closeEventModal}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? '更新' : '作成'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}; 