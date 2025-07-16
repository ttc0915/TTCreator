"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "en" | "zh" | "ms";

type Translations = {
  [key: string]: {
    [lang in Language]: string;
  };
};

// 所有需要翻译的文本
const translations: Translations = {
  experience: {
    en: "Try Now",
    zh: "立刻体验",
    ms: "Cuba Sekarang",
  },
  language: {
    en: "Language",
    zh: "语言",
    ms: "Bahasa",
  },
  slogan: {
    en: "TTCreator, Creation Starts with Input",
    zh: "TTCreator，创作从输入开始",
    ms: "TTCreator, Penciptaan Bermula dengan Input",
  },
  inputPlaceholder: {
    en: "Please enter the image you want to generate",
    zh: "请输入 你需要生成的图片",
    ms: "Sila masukkan imej yang ingin dijana",
  },
  create: {
    en: "Create",
    zh: "创作",
    ms: "Cipta",
  },
  workbench: {
    en: "Workbench",
    zh: "工作台",
    ms: "Meja Kerja"
  },
  ai_workbench: {
    en: "AI Workbench",
    zh: "AI 工作台",
    ms: "Meja Kerja AI"
  },
  workbench_description: {
    en: "Future image generation parameters and control options will be displayed here.",
    zh: "未来的图像生成参数和控制选项将会显示在这里。",
    ms: "Pilihan parameter dan kawalan penjanaan imej akan dipaparkan di sini pada masa akan datang."
  },
  back_to_home: {
    en: "Back to Home",
    zh: "返回主页",
    ms: "Kembali ke Laman Utama"
  },
  create_journey_prompt: {
    en: "Enter your ideas to start the creative journey.",
    zh: "请输入您的想法，开始创作之旅。",
    ms: "Masukkan idea anda untuk memulakan perjalanan kreatif."
  },
  generating_placeholder: {
    en: "Generating images for you... (This is a placeholder as the backend is not yet implemented)",
    zh: "正在为您生成图片... (这是一个占位符，因为后端尚未实现)",
    ms: "Menjana imej untuk anda... (Ini adalah pemegang tempat kerana bahagian belakang belum dilaksanakan)"
  },
  image_generating: {
    en: "Image generating...",
    zh: "图片生成中...",
    ms: "Imej sedang dijana..."
  },
  create_input_placeholder: {
    en: "Type your prompt here... (Press Enter to create)",
    zh: "在此输入提示词... (按 Enter 创建)",
    ms: "Taip prom anda di sini... (Tekan Enter untuk cipta)"
  },
  create_multi_input_placeholder: {
    en: "Type one prompt per line. Press Ctrl+Enter to generate.",
    zh: "每行输入一个提示词。按 Ctrl+Enter 生成。",
    ms: "Taip satu prom setiap baris. Tekan Ctrl+Enter untuk menjana."
  },
  select_ratio: {
    en: "Select Ratio",
    zh: "选择比例",
    ms: "Pilih Nisbah"
  },
  clear_chat_history: {
    en: "Clear History",
    zh: "清空记录",
    ms: "Kosongkan Sejarah"
  },
  clear_chat_confirm: {
    en: "Are you sure you want to clear all chat history? This action cannot be undone.",
    zh: "您确定要清空所有聊天记录吗？此操作无法撤销。",
    ms: "Adakah anda pasti mahu mengosongkan semua sejarah sembang? Tindakan ini tidak boleh dibuat asal."
  }
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en'); // Always default to English on server

  useEffect(() => {
    const getInitialLanguage = (): Language => {
        const storedLang = localStorage.getItem('language') as Language;
        if (storedLang && ['en', 'zh', 'ms'].includes(storedLang)) {
            return storedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'zh') {
            return 'zh';
        }
        if (browserLang === 'ms') {
            return 'ms';
        }
        return 'en'; // Default to English
    };
    
    const initialLang = getInitialLanguage();
    if (initialLang !== language) {
        setLanguageState(initialLang);
    }
  }, [language]); // Empty dependency array ensures this runs only once on the client


  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  // 翻译函数
  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
} 