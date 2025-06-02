import React, { useState, useRef, useEffect } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';

export const CalendarView: React.FC = () => {
  const { viewMode, nextPeriod, prevPeriod } = useCalendarStore();
  
  // スワイプ機能用のstate
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // レスポンシブ判定
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // コンポーネントマウント時のデバッグ
  useEffect(() => {
    console.log('CalendarView mounted, viewMode:', viewMode);
    console.log('Container ref:', containerRef.current);
  }, [viewMode]);

  const renderView = () => {
    switch (viewMode) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  // 現在のビューモードに応じた期間名を取得
  const getPeriodName = () => {
    switch (viewMode) {
      case 'month':
        return '月';
      case 'week':
        return '週';
      case 'day':
        return '日';
      default:
        return '月';
    }
  };

  // スワイプ処理関数
  const handleTouchStart = (e: React.TouchEvent) => {
    console.log('=== TOUCH START EVENT FIRED ===');
    console.log('isAnimating:', isAnimating);
    console.log('touches length:', e.touches.length);
    
    if (isAnimating) return;
    
    const touch = e.touches[0];
    console.log('Touch start:', touch.clientX, 'clientY:', touch.clientY);
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    console.log('isDragging set to true');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    console.log('=== TOUCH MOVE EVENT FIRED ===');
    console.log('isDragging:', isDragging, 'startX:', startX, 'isAnimating:', isAnimating);
    
    if (!isDragging || !startX || isAnimating) return;
    
    e.preventDefault(); // ブラウザのスクロールを防ぐ
    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    
    const deltaX = touch.clientX - startX;
    const dampedDelta = deltaX * 0.5; // スワイプの抵抗感を調整（0.3から0.5に変更）
    console.log('Touch move - deltaX:', deltaX, 'damped:', dampedDelta);
    setTranslateX(dampedDelta);
  };

  const handleTouchEnd = () => {
    console.log('=== TOUCH END EVENT FIRED ===');
    console.log('isDragging:', isDragging, 'startX:', startX, 'currentX:', currentX, 'isAnimating:', isAnimating);
    
    if (!isDragging || !startX || !currentX || isAnimating) {
      console.log('Touch end cancelled - conditions not met');
      resetSwipe();
      return;
    }
    
    const deltaX = currentX - startX;
    const threshold = 50; // スワイプ判定の閾値を下げて反応を良くする（80から50に変更）
    
    console.log('Touch end - deltaX:', deltaX, 'threshold:', threshold, 'viewMode:', viewMode);
    console.log('Math.abs(deltaX):', Math.abs(deltaX), 'threshold comparison:', Math.abs(deltaX) > threshold);
    
    setIsAnimating(true);
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // 右スワイプ: 前の期間へ移動
        console.log('Swiping to previous period');
        prevPeriod();
      } else {
        // 左スワイプ: 次の期間へ移動
        console.log('Swiping to next period');
        nextPeriod();
      }
    } else {
      console.log('Swipe distance too small - no action taken');
    }
    
    // アニメーション完了後にリセット
    setTimeout(() => {
      resetSwipe();
      setIsAnimating(false);
    }, 300);
  };

  const resetSwipe = () => {
    setStartX(null);
    setCurrentX(null);
    setIsDragging(false);
    setTranslateX(0);
  };

  // マウスイベント（デスクトップ用）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    e.preventDefault();
    
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !startX || isAnimating) return;
    
    setCurrentX(e.clientX);
    const deltaX = e.clientX - startX;
    const dampedDelta = deltaX * 0.5;
    setTranslateX(dampedDelta);
  };

  const handleMouseUp = () => {
    if (!isDragging || !startX || !currentX || isAnimating) {
      resetSwipe();
      return;
    }
    
    const deltaX = currentX - startX;
    const threshold = 80;
    
    setIsAnimating(true);
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // 右ドラッグ: 前の期間へ移動
        prevPeriod();
      } else {
        // 左ドラッグ: 次の期間へ移動
        nextPeriod();
      }
    }
    
    setTimeout(() => {
      resetSwipe();
      setIsAnimating(false);
    }, 300);
  };

  // グローバルmouseupイベントリスナー
  useEffect(() => {
    if (!isDragging) return;
    
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMobile && isDragging && startX && !isAnimating) {
        setCurrentX(e.clientX);
        const deltaX = e.clientX - startX;
        const dampedDelta = deltaX * 0.5;
        setTranslateX(dampedDelta);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, startX, isMobile, isAnimating]);

  // シンプルなタッチイベント検出テスト
  useEffect(() => {
    const testTouchHandler = (e: TouchEvent) => {
      console.log('*** GLOBAL TOUCH EVENT DETECTED ***', e.type);
    };
    
    document.addEventListener('touchstart', testTouchHandler, { passive: false });
    document.addEventListener('touchmove', testTouchHandler, { passive: false });
    document.addEventListener('touchend', testTouchHandler, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', testTouchHandler);
      document.removeEventListener('touchmove', testTouchHandler);
      document.removeEventListener('touchend', testTouchHandler);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
      {/* スワイプガイド（モバイルのみ） */}
      {isMobile && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-95 border-b border-gray-200">
          <div className="flex justify-center items-center py-3">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">
                スワイプで{getPeriodName()}を移動
              </div>
              <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
                <span>← 前の{getPeriodName()}</span>
                <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                <span>次の{getPeriodName()} →</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* メインコンテンツエリア */}
      <div
        ref={containerRef}
        className={`flex-1 flex flex-col overflow-hidden min-h-0 ${isMobile ? 'pt-14' : ''}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none',
          touchAction: 'pan-y',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onTouchStart={(e) => {
          console.log('*** CONTAINER TOUCH START ***', e.touches.length);
          handleTouchStart(e);
        }}
        onTouchMove={(e) => {
          console.log('*** CONTAINER TOUCH MOVE ***');
          handleTouchMove(e);
        }}
        onTouchEnd={(_e) => {
          console.log('*** CONTAINER TOUCH END ***');
          handleTouchEnd();
        }}
        onTouchCancel={(_e) => {
          console.log('*** CONTAINER TOUCH CANCEL ***');
          resetSwipe();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={resetSwipe}
      >
        {renderView()}
      </div>
      
      {/* スワイプフィードバック（スワイプ中のみ表示） */}
      {isDragging && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black bg-opacity-75 text-white text-xs px-4 py-2 rounded-full flex items-center space-x-2">
            {currentX && startX && currentX - startX > 0 ? (
              <>
                <span>←</span>
                <span>前の{getPeriodName()}</span>
              </>
            ) : (
              <>
                <span>次の{getPeriodName()}</span>
                <span>→</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 