import type { MoedictResponse } from '../types';

const MOEDICT_BASE_URL = 'https://www.moedict.tw';

// 萌典API服務類
export class MoedictAPI {
  private static instance: MoedictAPI;
  private cache = new Map<string, MoedictResponse>();

  static getInstance(): MoedictAPI {
    if (!MoedictAPI.instance) {
      MoedictAPI.instance = new MoedictAPI();
    }
    return MoedictAPI.instance;
  }

  // 獲取字的注音信息
  async getCharacterInfo(character: string): Promise<MoedictResponse | null> {
    // 檢查緩存
    if (this.cache.has(character)) {
      return this.cache.get(character)!;
    }

    try {
      const response = await fetch(`${MOEDICT_BASE_URL}/a/${encodeURIComponent(character)}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MoedictResponse = await response.json();
      
      // 緩存結果
      this.cache.set(character, data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch character info from Moedict API:', error);
      return null;
    }
  }

  // 驗證注音是否正確
  async validateBopomofo(character: string, inputBopomofo: string): Promise<{
    isCorrect: boolean;
    correctBopomofo?: string;
    confidence: number;
  }> {
    const characterInfo = await this.getCharacterInfo(character);
    
    if (!characterInfo || !characterInfo.h || characterInfo.h.length === 0) {
      return {
        isCorrect: false,
        confidence: 0,
      };
    }

    // 獲取所有可能的注音
    const possibleBopomofo = characterInfo.h.map(heteronym => heteronym.b).filter(Boolean);
    
    if (possibleBopomofo.length === 0) {
      return {
        isCorrect: false,
        confidence: 0,
      };
    }

    // 檢查是否完全匹配
    const exactMatch = possibleBopomofo.includes(inputBopomofo);
    if (exactMatch) {
      return {
        isCorrect: true,
        correctBopomofo: inputBopomofo,
        confidence: 1.0,
      };
    }

    // 檢查部分匹配（去除聲調）
    const normalizedInput = this.normalizeBopomofo(inputBopomofo);
    const normalizedPossible = possibleBopomofo.map(b => this.normalizeBopomofo(b));
    
    const partialMatch = normalizedPossible.includes(normalizedInput);
    if (partialMatch) {
      const correctIndex = normalizedPossible.indexOf(normalizedInput);
      return {
        isCorrect: true,
        correctBopomofo: possibleBopomofo[correctIndex],
        confidence: 0.8,
      };
    }

    // 檢查相似度
    const similarities = possibleBopomofo.map(b => this.calculateSimilarity(inputBopomofo, b));
    const maxSimilarity = Math.max(...similarities);
    const bestMatchIndex = similarities.indexOf(maxSimilarity);

    return {
      isCorrect: maxSimilarity > 0.7,
      correctBopomofo: possibleBopomofo[bestMatchIndex],
      confidence: maxSimilarity,
    };
  }

  // 獲取字的標準注音
  async getStandardBopomofo(character: string): Promise<string | null> {
    const characterInfo = await this.getCharacterInfo(character);
    
    if (!characterInfo || !characterInfo.h || characterInfo.h.length === 0) {
      return null;
    }

    // 返回第一個注音作為標準注音
    return characterInfo.h[0].b || null;
  }

  // 標準化注音（去除聲調）
  private normalizeBopomofo(bopomofo: string): string {
    return bopomofo.replace(/[ˊˇˋ˙]/g, '');
  }

  // 計算兩個注音的相似度
  private calculateSimilarity(bopomofo1: string, bopomofo2: string): number {
    const normalized1 = this.normalizeBopomofo(bopomofo1);
    const normalized2 = this.normalizeBopomofo(bopomofo2);
    
    if (normalized1 === normalized2) {
      return 1.0;
    }

    // 簡單的編輯距離算法
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    
    return maxLength === 0 ? 0 : 1 - (distance / maxLength);
  }

  // 計算編輯距離
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 清除緩存
  clearCache(): void {
    this.cache.clear();
  }

  // 獲取緩存大小
  getCacheSize(): number {
    return this.cache.size;
  }
}

// 導出單例實例
export const moedictAPI = MoedictAPI.getInstance();

// 工具函數：檢查注音格式是否正確
export function isValidBopomofo(bopomofo: string): boolean {
  // 基本的注音符號正則表達式
  const bopomofoRegex = /^[ㄅ-ㄩˊˇˋ˙]+$/;
  return bopomofoRegex.test(bopomofo);
}

// 工具函數：格式化注音顯示
export function formatBopomofo(bopomofo: string): string {
  // 在聲調符號前添加空格以便閱讀
  return bopomofo.replace(/([ˊˇˋ˙])/g, ' $1').trim();
}

// 工具函數：獲取注音聲調
export function getBopomofoTone(bopomofo: string): number {
  if (bopomofo.includes('ˊ')) return 2;
  if (bopomofo.includes('ˇ')) return 3;
  if (bopomofo.includes('ˋ')) return 4;
  if (bopomofo.includes('˙')) return 5;
  return 1; // 一聲
}

// 工具函數：移除注音聲調
export function removeBopomofoTone(bopomofo: string): string {
  return bopomofo.replace(/[ˊˇˋ˙]/g, '');
}
