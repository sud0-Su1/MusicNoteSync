import { Link } from "wouter";
import { useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import SpotifyModal from "./spotify-modal";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const { toggleTheme } = useTheme();
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  
  // Fetch Spotify connection status
  const { data: spotifyStatus, isLoading: spotifyStatusLoading } = useQuery({
    queryKey: ["/api/spotify/status"],
    retry: false,
  });
  
  // Fetch tags with counts
  const { data: tags } = useQuery({
    queryKey: ["/api/tags"],
  });
  
  return (
    <>
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex-shrink-0 p-4 transition-all duration-200 ease-in-out h-auto md:h-screen overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary dark:bg-primary rounded-lg flex items-center justify-center">
              <i className="ri-music-fill text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold">Notes & Vibes</h1>
          </div>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="ri-moon-line dark:hidden text-slate-500"></i>
            <i className="ri-sun-line hidden dark:block text-yellow-200"></i>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-1 mb-8">
          <Link href="/">
            <a className={cn(
              "flex items-center px-3 py-2.5 rounded-lg font-medium",
              currentPath === "/" ? 
                "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" : 
                "text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
            )}>
              <i className="ri-file-list-line mr-3 text-lg"></i>
              <span>All Notes</span>
            </a>
          </Link>
          <Link href="/todos">
            <a className={cn(
              "flex items-center px-3 py-2.5 rounded-lg font-medium",
              currentPath === "/todos" ? 
                "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" : 
                "text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
            )}>
              <i className="ri-check-double-line mr-3 text-lg"></i>
              <span>To-Do List</span>
            </a>
          </Link>
          <Link href="/quick-notes">
            <a className={cn(
              "flex items-center px-3 py-2.5 rounded-lg font-medium",
              currentPath === "/quick-notes" ? 
                "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" : 
                "text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
            )}>
              <i className="ri-sticky-note-line mr-3 text-lg"></i>
              <span>Quick Notes</span>
            </a>
          </Link>
          <Link href="/archive">
            <a className={cn(
              "flex items-center px-3 py-2.5 rounded-lg font-medium",
              currentPath === "/archive" ? 
                "bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300" : 
                "text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50"
            )}>
              <i className="ri-archive-line mr-3 text-lg"></i>
              <span>Archive</span>
            </a>
          </Link>
        </nav>
        
        {/* Tags Section */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2 px-3">TAGS</h2>
          <div className="space-y-1">
            {tags?.map((tag: any) => (
              <Link key={tag.id} href={`/?tag=${tag.id}`}>
                <a className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 font-medium">
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: tag.color }}></span>
                    <span>{tag.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{tag.noteCount}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Spotify Connection */}
        <div className="px-3 py-3 bg-gradient-to-r from-[#191414] to-gray-800 rounded-lg text-white mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <i className="ri-spotify-fill text-[#1DB954] text-xl"></i>
              <h3 className="font-medium">Spotify</h3>
            </div>
            <span className="px-2 py-0.5 text-xs bg-gray-700 rounded-full">
              {spotifyStatusLoading 
                ? "Checking..." 
                : spotifyStatus?.connected 
                  ? "Connected" 
                  : "Not Connected"}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            Connect your Spotify account to play music while taking notes.
          </p>
          {spotifyStatus?.connected ? (
            <button 
              onClick={() => {
                // Trigger disconnect
                fetch("/api/spotify/disconnect", {
                  method: "POST",
                  credentials: "include",
                }).then(() => {
                  // Invalidate spotify status
                  window.location.reload();
                });
              }}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 transition rounded-md text-sm font-medium flex items-center justify-center"
            >
              <i className="ri-logout-box-line mr-1.5"></i> Disconnect Account
            </button>
          ) : (
            <button 
              onClick={() => setIsSpotifyModalOpen(true)}
              className="w-full py-2 bg-[#1DB954] hover:bg-opacity-90 transition rounded-md text-sm font-medium flex items-center justify-center"
            >
              <i className="ri-link mr-1.5"></i> Connect Account
            </button>
          )}
        </div>
        
        {/* User Profile */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center px-3 py-2">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" 
              alt="User Avatar" 
              className="h-8 w-8 rounded-full mr-3"
            />
            <div>
              <p className="font-medium text-sm">Alex Morgan</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Free Plan</p>
            </div>
            <div className="ml-auto">
              <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                <i className="ri-settings-4-line text-slate-500"></i>
              </button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Spotify Modal */}
      <SpotifyModal 
        isOpen={isSpotifyModalOpen} 
        onClose={() => setIsSpotifyModalOpen(false)} 
      />
    </>
  );
}
