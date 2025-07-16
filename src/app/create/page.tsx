"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Corrected import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { ArrowLeft, Bot, Check, MoreVertical, Trash2, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Message = {
  type: "user" | "ai";
  text?: string;
  textKey?: string;
  imageUrls?: string[];
  isLoading?: boolean;
  taskId?: string; // Add taskId to uniquely identify AI responses
  prompt?: string;
  aspectRatio?: string;
};

const aspectRatios = ["21:9", "16:9", "3:2", "4:3", "1:1", "3:4", "2:3", "9:16"];

function CreatePageComponent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const initialPrompt = searchParams.get("prompt") || "";

  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load messages from localStorage on initial client render
  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMessages = localStorage.getItem("chatHistory");
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    } catch (error) {
        console.error("Failed to parse messages from localStorage", error);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isMounted) {
      try {
          localStorage.setItem("chatHistory", JSON.stringify(messages));
      } catch (error) {
          console.error("Failed to save messages to localStorage", error);
      }
    }
  }, [messages, isMounted]);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const pollingIntervals = useRef<{ [taskId: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // 找到所有未完成的任务
    const loadingTasks = messages.filter((msg) => msg.isLoading && msg.taskId);

    loadingTasks.forEach((task) => {
      if (pollingIntervals.current[task.taskId!]) return; // 已有定时器则跳过
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`/api/status/${task.taskId}`);
          const data = await statusResponse.json();
          if (data.status === 'completed') {
            let imageUrls = [];
            if (data.extracted_links && Array.isArray(data.extracted_links)) {
              imageUrls = data.extracted_links;
            } else if (data.data && data.data.imageLinks && data.data.imageLinks.item_list) {
              imageUrls = (data.data.imageLinks.item_list as Array<{ common_attr?: { cover_url?: string } }>)
                .map((item) => item.common_attr && item.common_attr.cover_url)
                .filter(Boolean);
            } else if (data.image_urls && Array.isArray(data.image_urls)) {
              imageUrls = data.image_urls;
            }
            setMessages((prev) =>
              prev.map((msg) =>
                msg.taskId === task.taskId
                  ? { ...msg, isLoading: false, imageUrls }
                  : msg
              )
            );
            clearInterval(pollingIntervals.current[task.taskId!]);
            delete pollingIntervals.current[task.taskId!];
          } else if (data.status === 'failed') {
            const errorMessage = data.result?.error || 'Unknown error occurred.';
            setMessages((prev) =>
              prev.map((msg) =>
                msg.taskId === task.taskId
                  ? { ...msg, isLoading: false, text: `Error: ${errorMessage}` }
                  : msg
              )
            );
            clearInterval(pollingIntervals.current[task.taskId!]);
            delete pollingIntervals.current[task.taskId!];
          }
        } catch (error) {
          // 可选：处理错误
        }
      };
      // 立即执行一次，然后每60秒轮询
      pollStatus();
      pollingIntervals.current[task.taskId!] = setInterval(pollStatus, 60000);
    });

    // 清理已完成/失败任务的定时器
    Object.keys(pollingIntervals.current).forEach((taskId) => {
      if (!loadingTasks.find((msg) => msg.taskId === taskId)) {
        clearInterval(pollingIntervals.current[taskId]);
        delete pollingIntervals.current[taskId];
      }
    });

    // 组件卸载时清理所有定时器
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
      pollingIntervals.current = {};
    };
  }, [messages]);


  const handleCreate = async () => {
    const prompts = prompt.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (prompts.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setPrompt(""); // Clear the textarea

    const generateSinglePrompt = async (p: string) => {
      const userMessage: Message = { type: "user", text: p };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: p, aspect_ratio: aspectRatio }), // 注意参数名
        });

        if (!response.ok) {
          throw new Error(`Failed to start generation for prompt: ${p}`);
        }

        const { task_id } = await response.json();

        const aiMessage: Message = {
          type: "ai",
          isLoading: true,
          taskId: task_id,
          prompt: p,
          aspectRatio: aspectRatio,
        };
        setMessages((prev) => [...prev, aiMessage]);

      } catch (error) {
        console.error(error);
        const aiErrorMessage: Message = { type: "ai", text: (error as Error).message };
        setMessages((prev) => [...prev, aiErrorMessage]);
      }
    };

    // Process all prompts concurrently
    const allPromises = prompts.map(generateSinglePrompt);
    await Promise.all(allPromises);
    
    setIsGenerating(false);
  };
  
  const handleClearChat = () => {
    if (window.confirm(t('clear_chat_confirm'))) {
        setMessages([]);
        try {
            localStorage.removeItem("chatHistory");
        } catch (error) {
            console.error("Failed to clear chat history from localStorage", error);
        }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.ctrlKey) { // Use Ctrl+Enter to submit
      handleCreate();
    }
  };

  const showControls = isInputFocused || prompt.trim().length > 0;

  return (
    <div className="flex h-dvh w-full bg-[#020817] text-white">
      <aside className="w-[300px] bg-black/30 p-6 flex-col hidden md:flex border-r border-gray-800">
        <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.jpeg" alt="TTCreator Logo" width={32} height={32} className="rounded-lg" />
                <h1 className="text-xl font-bold">TTCreator</h1>
            </Link>
        </div>
        <div className="flex-grow">
            <h2 className="text-lg font-semibold mb-4">{t('ai_workbench')}</h2>
            <p className="text-sm text-gray-400">{t('workbench_description')}</p>
        </div>
        <div className="flex flex-col gap-2">
            <Button variant="ghost" onClick={handleClearChat} className="flex items-center justify-start gap-2 text-sm text-gray-400 hover:text-white px-2">
                <Trash2 size={16} />
                {t('clear_chat_history')}
            </Button>
            <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-2">
                <ArrowLeft size={16} />
                {t('back_to_home')}
            </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <h2 className="text-lg font-semibold">{t('ai_workbench')}</h2>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 text-white border-gray-700">
                <DropdownMenuItem onSelect={handleClearChat} className="text-red-500 hover:!text-red-500 hover:!bg-red-900/50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t('clear_chat_history')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <div className="flex-grow p-4 md:p-6 overflow-y-auto space-y-6">
          {isMounted && (
            <>
              {messages.length === 0 && (
                  <div className="text-center text-gray-400 pt-20">
                      <p>{t('create_journey_prompt')}</p>
                  </div>
              )}
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    msg.type === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.type === "ai" && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        <Bot size={20} />
                    </div>
                  )}
                  <div
                    className={
                      msg.type === "user"
                        ? "bg-blue-800 text-white rounded-xl p-3"
                        : "w-full max-w-md" 
                    }
                  >
                    {msg.type === 'user' ? (
                      <p>{msg.textKey ? t(msg.textKey) : msg.text}</p>
                    ) : (
                      <>
                        {(msg.text || msg.textKey) && 
                          <div className="bg-gray-800 text-white rounded-xl p-3 inline-block">
                            <p>{msg.textKey ? t(msg.textKey) : msg.text}</p>
                          </div>
                        }
                        {(msg.isLoading) && (
                          <div className="mt-2 w-full max-w-xs h-auto aspect-square bg-gray-800 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">
                            {t('image_generating')}
                          </div>
                        )}
                        {msg.imageUrls && (
                          <div className="mt-2">
                            <div className="mb-2">
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold text-gray-400">提示词：</span>
                                {msg.prompt}
                                <span className="font-semibold text-gray-400 ml-4">比例：</span>
                                {msg.aspectRatio}
                              </p>
                            </div>
                            <div className="flex flex-row flex-wrap gap-2">
                              {msg.imageUrls.map((url, i) => (
                                <div key={i} className="relative group w-full max-w-xs">
                                  <Image src={url} alt={`Generated image ${i + 1}`} width={256} height={256} className="rounded-lg w-full h-auto object-cover" />
                                  <a
                                    href={url}
                                    download={`generated-image-${i + 1}.png`}
                                    className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                                    </svg>
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                   {msg.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                        <User size={20} />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="px-4 md:px-6 py-3 bg-transparent border-t border-gray-800">
          <div className="flex flex-col gap-2">
            <Textarea
              value={prompt}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('create_multi_input_placeholder')}
              className="w-full bg-gray-900 border-gray-700 rounded-xl p-3 text-base resize-none focus:ring-blue-500 focus:border-blue-500 transition"
              rows={2}
            />
            <div
              className={`transition-all duration-300 ease-in-out ${
                showControls
                  ? "max-h-40 opacity-100"
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-800 hover:bg-gray-700 border-gray-700 w-full sm:w-auto"
                    >
                      {t('select_ratio')}: {aspectRatio}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 text-white border-gray-700 max-h-60 overflow-y-auto">
                    {aspectRatios.map((ar) => (
                      <DropdownMenuItem
                        key={ar}
                        onSelect={() => setAspectRatio(ar)}
                        className="hover:bg-gray-700"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            aspectRatio === ar ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {ar}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleCreate}
                  disabled={isGenerating || prompt.trim().length === 0}
                  className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isGenerating ? t('generating') : t('create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreatePageComponent />
        </Suspense>
    )
} 