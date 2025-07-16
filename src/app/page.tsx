"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export default function Home() {
  const { setLanguage, t } = useLanguage();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const handleCreateClick = () => {
    const destination = prompt
      ? `/create?prompt=${encodeURIComponent(prompt)}`
      : "/create";
    router.push(destination);
  };

  useEffect(() => {
    async function fetchVideos() {
      try {
        const response = await fetch("/api/videos");
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setVideoUrls(data);
          // 随机选择一个初始视频
          setCurrentVideoIndex(Math.floor(Math.random() * data.length));
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      }
    }
    fetchVideos();
  }, []);
  
  useEffect(() => {
    if (!videoElement) return;
    
    const handleVideoEnded = () => {
      setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoUrls.length);
    };
    
    videoElement.addEventListener('ended', handleVideoEnded);
    
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnded);
    };
  }, [videoElement, videoUrls.length]);

  useEffect(() => {
    if (videoElement) {
      videoElement.play().catch(error => {
        console.error("Video play failed:", error);
      });
    }
  }, [videoElement, currentVideoIndex]);

  const getThumbnailStyles = (index: number) => {
    const distance = Math.abs(index - currentVideoIndex);
    
    if (distance === 0) {
      return "h-10 w-10 opacity-100 transition-all duration-300 ease-in-out";
    } else if (distance === 1) {
      return "h-7 w-7 opacity-60 transition-all duration-300 ease-in-out";
    } else {
      return "h-5 w-5 opacity-30 transition-all duration-300 ease-in-out";
    }
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {videoUrls.length > 0 && (
        <video
          ref={setVideoElement}
          src={videoUrls[currentVideoIndex]}
          autoPlay
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        />
      )}

      {videoUrls.length > 0 && (
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 flex-col gap-3 hidden md:flex">
          {videoUrls.map((videoUrl, index) => (
            <div 
              key={index}
              className={`rounded-lg overflow-hidden cursor-pointer ${getThumbnailStyles(index)}`}
              onMouseEnter={() => setCurrentVideoIndex(index)}
            >
              <video 
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                playsInline
                disablePictureInPicture
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full text-white">
        <header className="py-4 px-4 sm:px-6 md:px-10">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image src="/logo.jpeg" alt="TTCreator Logo" width={28} height={28} className="rounded-lg sm:w-8 sm:h-8 md:w-10 md:h-10" />
              <h1 className="text-md sm:text-lg md:text-xl font-bold">TTCreator</h1>
            </div>
            <nav className="flex items-center gap-2 md:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-xs md:text-sm px-2 md:px-4">
                    <Globe className="h-4 w-4 md:h-[1.2rem] md:w-[1.2rem] mr-1 md:mr-2" />
                    {t('language')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage("en")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("zh")}>
                    中文
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage("ms")}>
                    Bahasa Melayu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => router.push('/create')} className="text-xs md:text-sm px-2 md:px-4">{t('workbench')}</Button>
            </nav>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-end pb-16 md:pb-32">
          <div className="container mx-auto text-center px-4 w-full">
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-6 md:mb-8 text-white" 
              style={{textShadow: '0px 2px 4px rgba(0,0,0,0.25)'}}
            >
                {t('slogan')}
              </h1>
              
            {/* Desktop version */}
            <div className="max-w-4xl mx-auto hidden md:block">
              <div className="relative h-[60px] w-full rounded-full bg-white/20 border border-white/30 backdrop-blur-sm shadow-lg">
                <Input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  className="h-full w-full rounded-full bg-transparent border-none text-white placeholder:text-gray-300 text-lg pl-8 pr-40 focus:ring-0 focus:outline-none"
                />
                <Button 
                  size="lg" 
                  onClick={handleCreateClick}
                  disabled={!prompt.trim()}
                  className="absolute right-[6px] top-1/2 transform -translate-y-1/2 h-[48px] px-10 bg-black text-white text-lg rounded-full disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                  {t('create')}
                </Button>
              </div>
            </div>
            
            {/* Mobile version */}
            <div className="md:hidden w-full max-w-sm mx-auto flex flex-col gap-4">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('inputPlaceholder')}
                className="h-14 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm px-6 text-white placeholder:text-gray-300 text-base focus:ring-0 focus:outline-none"
              />
              <Button onClick={handleCreateClick} disabled={!prompt.trim()} size="lg" className="h-14 text-lg rounded-full bg-black text-white disabled:bg-gray-800 disabled:cursor-not-allowed">
                {t('create')}
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-4 px-4 sm:px-6 md:px-10 text-center text-xs sm:text-sm text-gray-400">
          © {new Date().getFullYear()} TTCreator. All rights reserved.
      </footer>
      </div>
    </div>
  );
}
