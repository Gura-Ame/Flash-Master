import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate' | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden' | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe' | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business' | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<string>('light');

  useEffect(() => {
    // 從localStorage讀取主題設置
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setActualTheme(systemTheme);
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  useEffect(() => {
    // 更新HTML class和localStorage
    const root = document.documentElement;
    
    // 清除所有 DaisyUI 主題類
    const daisyThemes = [
      'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 
      'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 
      'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 
      'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 
      'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'
    ];
    
    daisyThemes.forEach(t => root.classList.remove(t));
    root.classList.add(actualTheme);
    
    // 設置 data-theme 屬性
    root.setAttribute('data-theme', actualTheme);
    localStorage.setItem('theme', theme);
  }, [theme, actualTheme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
