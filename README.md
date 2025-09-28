# Flash Master - 智能學習平台

一個功能豐富的學習平台，專為國字注音學習和各種題型練習而設計，支持間隔重複學習系統（SRS）和萌典API集成。

## ✨ 主要功能

### 📚 科目管理
- 創建和管理多個學習科目
- 自定義科目顏色和描述
- 科目進度追蹤

### 🎯 多種題型支持
- **選擇題**：單選或多選
- **是非題**：正確/錯誤判斷
- **填空題**：文字填空，支持多個正確答案
- **排序題**：按正確順序排列項目
- **注音轉國字**：根據注音輸入對應國字
- **國字轉注音**：根據國字輸入對應注音

### 🧠 智能學習系統
- **SRS間隔重複學習**：基於遺忘曲線的智能複習
- **熟悉度管理**：生疏 → 未答 → 稍微不熟 → 熟練 → 精通
- **萌典API集成**：自動驗證注音正確性
- **學習記錄追蹤**：詳細記錄每次答題情況

### 📊 進度分析
- **學習進度曲線圖**：每日學習情況可視化
- **熟悉度分布圖**：各熟悉度等級的題目分布
- **科目準確率對比**：不同科目的學習效果比較
- **詳細統計報表**：學習時間、正確率等數據

### 🎨 用戶體驗
- **響應式設計**：支持桌面和移動設備
- **深色模式**：自動/手動主題切換
- **側邊欄導航**：可收合的側邊欄設計
- **快捷鍵支持**：提高操作效率
- **實感按鈕**：現代化的UI設計

### 💾 數據管理
- **本地存儲**：使用IndexedDB存儲所有數據
- **數據匯出**：支持JSON格式匯出
- **數據匯入**：支持批量匯入題目和設置
- **數據備份**：完整的學習數據備份

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 構建生產版本
```bash
npm run build
```

### 預覽生產版本
```bash
npm run preview
```

## 📖 使用指南

### 1. 創建科目
1. 點擊「新增科目」按鈕
2. 輸入科目名稱和描述
3. 選擇科目顏色
4. 點擊「創建」完成

### 2. 添加題目
1. 在科目卡片上點擊設置按鈕
2. 選擇題型（選擇題、是非題、填空題等）
3. 填寫題目內容和正確答案
4. 設置難度等級
5. 保存題目

### 3. 開始學習
1. 點擊科目卡片的「開始學習」按鈕
2. 選擇答案或輸入答案
3. 提交答案查看結果
4. 選擇對該題的熟悉度
5. 系統會根據SRS算法安排複習時間

### 4. 查看進度
1. 點擊側邊欄的「學習進度」
2. 查看各種統計圖表和數據
3. 選擇不同時間範圍和科目進行分析

### 5. 管理設置
1. 點擊側邊欄的「設定」
2. 調整學習參數和界面設置
3. 匯入/匯出學習數據

## ⌨️ 快捷鍵

### 答題快捷鍵
- `1-4`：選擇答案選項
- `Enter`：提交答案
- `Enter + Enter`：顯示答案並進入下一題
- `Space`：重試當前題目

### 導航快捷鍵
- `Esc`：返回上一頁
- `Ctrl + S`：保存設定
- `Ctrl + E`：匯出數據
- `Ctrl + I`：匯入數據

## 🛠️ 技術架構

### 前端技術
- **React 19**：現代化UI框架
- **TypeScript**：類型安全的JavaScript
- **Tailwind CSS**：實用優先的CSS框架
- **Vite**：快速的構建工具
- **SWC**：快速的TypeScript/JavaScript編譯器

### 數據存儲
- **IndexedDB**：瀏覽器本地數據庫
- **IDB**：IndexedDB的Promise包裝器

### 圖表可視化
- **Recharts**：React圖表庫

### 工具庫
- **Lucide React**：現代化圖標庫
- **Framer Motion**：動畫庫
- **Date-fns**：日期處理庫
- **React Hotkeys Hook**：快捷鍵處理

### API集成
- **萌典API**：注音校驗和查詢

## 📁 項目結構

```
src/
├── components/          # React組件
│   ├── HomeView.tsx    # 主畫面
│   ├── StudyView.tsx   # 答題介面
│   ├── ProgressView.tsx # 進度分析
│   ├── SettingsView.tsx # 設置頁面
│   ├── Sidebar.tsx     # 側邊欄
│   └── QuestionManager.tsx # 題目管理
├── contexts/           # React上下文
│   ├── ThemeContext.tsx # 主題管理
│   └── DatabaseContext.tsx # 數據庫管理
├── types/              # TypeScript類型定義
│   └── index.ts
├── utils/              # 工具函數
│   ├── database.ts     # 數據庫操作
│   ├── moedict.ts      # 萌典API集成
│   └── srs.ts          # SRS算法實現
└── App.tsx             # 主應用組件
```

## 🔧 配置選項

### 學習參數
- **複習間隔**：控制SRS算法的基礎複習間隔（1-30天）
- **新題目數量**：每次學習會話的新題目數量（5-100題）

### 界面設置
- **主題模式**：淺色/深色/系統設定
- **顯示提示**：是否顯示答題提示
- **自動進入下一題**：答題後自動進入下一題
- **音效**：答題音效反饋
- **快捷鍵**：啟用/禁用快捷鍵

## 📊 數據格式

### 題目數據結構
```typescript
interface Question {
  id: string;
  subjectId: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'sort' | 'bopomofo-to-char' | 'char-to-bopomofo';
  question: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // 根據題型的不同屬性...
}
```

### 學習記錄結構
```typescript
interface LearningRecord {
  id: string;
  questionId: string;
  subjectId: string;
  familiarity: 'unfamiliar' | 'unanswered' | 'somewhat-familiar' | 'familiar' | 'mastered';
  correctCount: number;
  incorrectCount: number;
  lastReviewed: Date;
  nextReview: Date;
  streak: number;
  totalTimeSpent: number;
}
```

## 🤝 貢獻指南

1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🙏 致謝

- [萌典](https://www.moedict.tw/) - 提供注音查詢API
- [Recharts](https://recharts.org/) - 圖表可視化
- [Lucide](https://lucide.dev/) - 圖標庫
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架

## 📞 支持

如果您遇到任何問題或有建議，請：

1. 查看 [Issues](https://github.com/your-username/flash-master/issues)
2. 創建新的 Issue
3. 聯繫開發團隊

---

**Flash Master** - 讓學習更智能，讓記憶更持久！ 🚀