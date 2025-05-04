import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import VinylRecord from "./vinyl-record";
import { apiRequest } from "@/lib/queryClient";
import { useSpotify } from "@/hooks/use-spotify";

export default function MusicPlayer() {
  const [volume, setVolume] = useState(70);
  const { isConnected } = useSpotify();
  
  // Query current playback state from Spotify
  const { 
    data: playerData, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ["/api/spotify/player"],
    enabled: isConnected,
    refetchInterval: 5000, // Poll every 5 seconds
  });
  
  const isPlaying = playerData?.is_playing || false;
  const currentItem = playerData?.item;
  const progressMs = playerData?.progress_ms || 0;
  const durationMs = currentItem?.duration_ms || 1;
  const progressPercent = (progressMs / durationMs) * 100;
  
  // Handle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      if (isPlaying) {
        await apiRequest("POST", "/api/spotify/pause", {});
      } else {
        await apiRequest("POST", "/api/spotify/play", {});
      }
      // Refetch to update UI
      refetch();
    } catch (error) {
      console.error("Failed to toggle play/pause:", error);
    }
  }, [isPlaying, isConnected, refetch]);
  
  // Handle next/previous
  const playNext = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      await apiRequest("POST", "/api/spotify/next", {});
      // Refetch after a short delay
      setTimeout(() => refetch(), 300);
    } catch (error) {
      console.error("Failed to skip to next track:", error);
    }
  }, [isConnected, refetch]);
  
  const playPrevious = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      await apiRequest("POST", "/api/spotify/previous", {});
      // Refetch after a short delay
      setTimeout(() => refetch(), 300);
    } catch (error) {
      console.error("Failed to go to previous track:", error);
    }
  }, [isConnected, refetch]);
  
  // Initialize keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if not in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === " " && e.ctrlKey) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "ArrowRight" && e.ctrlKey) {
        e.preventDefault();
        playNext();
      } else if (e.key === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault();
        playPrevious();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, playNext, playPrevious]);
  
  const albumArt = currentItem?.album?.images?.[0]?.url || "https://images.unsplash.com/photo-1602848597941-0d3c7c51e010?w=400";
  const trackTitle = currentItem?.name || "No song playing";
  const artistName = currentItem?.artists?.map((a: any) => a.name).join(", ") || "Connect to Spotify";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-3 px-4 transition-transform duration-300 ease-in-out">
      <div className="flex items-center">
        {/* Vinyl Record Player */}
        <div className="relative h-16 w-16 mr-4">
          <VinylRecord 
            isPlaying={isPlaying} 
            albumArt={albumArt}
          />
        </div>
        
        {/* Song Info */}
        <div className="flex-1 mr-4">
          <h4 className="font-medium text-slate-900 dark:text-white">{trackTitle}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{artistName}</p>
          <div className="mt-1 relative h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary dark:bg-primary-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={playPrevious}
            disabled={!isConnected}
            className={cn(
              "p-2",
              isConnected 
                ? "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            <i className="ri-skip-back-fill text-lg"></i>
          </button>
          <button 
            onClick={togglePlayPause}
            disabled={!isConnected}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center",
              isConnected 
                ? "bg-primary hover:bg-primary/90 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            )}
          >
            {isPlaying ? (
              <i className="ri-pause-fill text-lg"></i>
            ) : (
              <i className="ri-play-fill text-lg"></i>
            )}
          </button>
          <button 
            onClick={playNext}
            disabled={!isConnected}
            className={cn(
              "p-2",
              isConnected 
                ? "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            <i className="ri-skip-forward-fill text-lg"></i>
          </button>
          <button 
            className={cn(
              "p-2",
              isConnected 
                ? "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            <i className="ri-repeat-2-line text-lg"></i>
          </button>
          <div className="flex items-center ml-2">
            <button 
              className={cn(
                "p-2",
                isConnected 
                  ? "text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400"
                  : "text-slate-400 dark:text-slate-600 cursor-not-allowed"
              )}
            >
              <i className="ri-volume-up-line text-lg"></i>
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={(e) => setVolume(parseInt(e.target.value))}
              disabled={!isConnected}
              className="w-20 h-1 bg-gray-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
