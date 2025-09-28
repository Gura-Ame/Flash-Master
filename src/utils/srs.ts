import type { FamiliarityLevel, SRSAlgorithm } from '../types';
import { addDays, addMinutes } from 'date-fns';

// 基於Anki SM-2算法的改進版本
export class SM2Algorithm implements SRSAlgorithm {
  calculateNextReview(
    currentFamiliarity: FamiliarityLevel,
    correctCount: number,
    incorrectCount: number,
    streak: number,
    _lastReviewed: Date
  ): Date {
    const now = new Date();
    
    // 根據熟悉度確定基礎間隔
    let baseInterval: number;
    let easeFactor = 2.5; // 初始難度係數
    
    switch (currentFamiliarity) {
      case 'unfamiliar':
        return addMinutes(now, 1); // 1分鐘後重複
      case 'unanswered':
        return addMinutes(now, 5); // 5分鐘後重複
      case 'somewhat-familiar':
        baseInterval = 1; // 1天
        break;
      case 'familiar':
        baseInterval = 3; // 3天
        break;
      case 'mastered':
        baseInterval = 7; // 7天
        break;
      default:
        baseInterval = 1;
    }
    
    // 根據正確率調整難度係數
    const totalAttempts = correctCount + incorrectCount;
    if (totalAttempts > 0) {
      const accuracy = correctCount / totalAttempts;
      if (accuracy >= 0.9) {
        easeFactor = Math.min(easeFactor + 0.1, 3.0);
      } else if (accuracy >= 0.7) {
        easeFactor = Math.max(easeFactor - 0.1, 1.3);
      } else {
        easeFactor = Math.max(easeFactor - 0.2, 1.3);
      }
    }
    
    // 根據連勝次數調整間隔
    const streakMultiplier = Math.min(1 + (streak * 0.1), 2.0);
    
    // 計算最終間隔
    const finalInterval = Math.round(baseInterval * easeFactor * streakMultiplier);
    
    return addDays(now, finalInterval);
  }
}

// 基於FSRS (Free Spaced Repetition Scheduler) 的算法
export class FSRSAlgorithm implements SRSAlgorithm {
  calculateNextReview(
    currentFamiliarity: FamiliarityLevel,
    correctCount: number,
    incorrectCount: number,
    streak: number,
    _lastReviewed: Date
  ): Date {
    const now = new Date();
    
    // FSRS參數
    const parameters = {
      requestRetention: 0.9, // 目標保持率
      maximumInterval: 36500, // 最大間隔（天）
      w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    };
    
    // 計算難度
    let difficulty = 5.0; // 初始難度
    const totalAttempts = correctCount + incorrectCount;
    
    if (totalAttempts > 0) {
      const accuracy = correctCount / totalAttempts;
      if (accuracy >= 0.9) {
        difficulty = Math.max(difficulty - 0.2, 1.0);
      } else if (accuracy >= 0.7) {
        difficulty = Math.min(difficulty + 0.1, 10.0);
      } else {
        difficulty = Math.min(difficulty + 0.3, 10.0);
      }
    }
    
    // 計算穩定性
    let stability = 2.5; // 初始穩定性
    
    switch (currentFamiliarity) {
      case 'unfamiliar':
        stability = 0.1;
        break;
      case 'unanswered':
        stability = 0.5;
        break;
      case 'somewhat-familiar':
        stability = 2.0;
        break;
      case 'familiar':
        stability = 5.0;
        break;
      case 'mastered':
        stability = 10.0;
        break;
    }
    
    // 根據連勝次數調整穩定性
    stability *= Math.pow(1.3, Math.min(streak, 10));
    
    // 計算間隔
    const interval = Math.min(
      Math.round(stability * Math.pow(difficulty, -0.8)),
      parameters.maximumInterval
    );
    
    return addDays(now, interval);
  }
}

// 簡化的間隔重複算法（推薦用於學習）
export class SimpleSRSAlgorithm implements SRSAlgorithm {
  calculateNextReview(
    currentFamiliarity: FamiliarityLevel,
    correctCount: number,
    incorrectCount: number,
    streak: number,
    _lastReviewed: Date
  ): Date {
    const now = new Date();
    
    // 根據熟悉度和表現調整間隔
    let intervalDays: number;
    
    switch (currentFamiliarity) {
      case 'unfamiliar':
        intervalDays = 0.1; // 2.4小時
        break;
      case 'unanswered':
        intervalDays = 0.5; // 12小時
        break;
      case 'somewhat-familiar':
        intervalDays = 1; // 1天
        break;
      case 'familiar':
        intervalDays = 3; // 3天
        break;
      case 'mastered':
        intervalDays = 7; // 1週
        break;
      default:
        intervalDays = 1;
    }
    
    // 根據正確率調整
    const totalAttempts = correctCount + incorrectCount;
    if (totalAttempts > 0) {
      const accuracy = correctCount / totalAttempts;
      if (accuracy >= 0.9) {
        intervalDays *= 1.5; // 增加間隔
      } else if (accuracy < 0.6) {
        intervalDays *= 0.5; // 減少間隔
      }
    }
    
    // 根據連勝次數調整
    if (streak > 0) {
      intervalDays *= Math.min(1 + (streak * 0.2), 3); // 最多3倍
    }
    
    return addDays(now, intervalDays);
  }
}

// 默認使用簡化算法
export const defaultSRSAlgorithm = new SimpleSRSAlgorithm();

// 熟悉度狀態轉換
export function updateFamiliarity(
  currentFamiliarity: FamiliarityLevel,
  isCorrect: boolean,
  timeSpent: number
): FamiliarityLevel {
  // 根據答題正確性和花費時間調整熟悉度
  if (isCorrect) {
    switch (currentFamiliarity) {
      case 'unfamiliar':
        return 'somewhat-familiar';
      case 'unanswered':
        return 'somewhat-familiar';
      case 'somewhat-familiar':
        return timeSpent < 10 ? 'familiar' : 'somewhat-familiar';
      case 'familiar':
        return timeSpent < 5 ? 'mastered' : 'familiar';
      case 'mastered':
        return 'mastered';
    }
  } else {
    switch (currentFamiliarity) {
      case 'unfamiliar':
        return 'unfamiliar';
      case 'unanswered':
        return 'unfamiliar';
      case 'somewhat-familiar':
        return 'unfamiliar';
      case 'familiar':
        return 'somewhat-familiar';
      case 'mastered':
        return 'familiar';
    }
  }
  
  return currentFamiliarity;
}

// 獲取熟悉度顯示文本
export function getFamiliarityText(familiarity: FamiliarityLevel): string {
  switch (familiarity) {
    case 'unfamiliar':
      return '生疏';
    case 'unanswered':
      return '未答';
    case 'somewhat-familiar':
      return '稍微不熟';
    case 'familiar':
      return '熟練';
    case 'mastered':
      return '精通';
    default:
      return '未知';
  }
}

// 獲取熟悉度顏色
export function getFamiliarityColor(familiarity: FamiliarityLevel): string {
  switch (familiarity) {
    case 'unfamiliar':
      return 'text-red-500';
    case 'unanswered':
      return 'text-gray-500';
    case 'somewhat-familiar':
      return 'text-yellow-500';
    case 'familiar':
      return 'text-blue-500';
    case 'mastered':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
