import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NoteCard from "@/components/note-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  
  // Parse URL params
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  // Build query string based on active tab and search params
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    // Add tab filter
    if (activeTab === "favorites") {
      params.append("favorites", "true");
    } else if (activeTab === "recent") {
      params.append("recent", "true");
    }
    
    // Add search term if exists
    const searchTerm = searchParams?.get("search");
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    
    // Add tag filter if exists
    const tagId = searchParams?.get("tag");
    if (tagId) {
      params.append("tag", tagId);
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };
  
  // Fetch notes based on query string
  const { data: notes, isLoading, error } = useQuery({
    queryKey: [`/api/notes${getQueryString()}`],
  });
  
  // Check if we're filtering by tag
  const isTagFiltered = searchParams?.has("tag");
  
  return (
    <>
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex space-x-4">
          <button 
            className={cn(
              "px-3 py-2 font-medium",
              activeTab === "all" 
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400" 
                : "text-slate-600 dark:text-slate-400"
            )}
            onClick={() => setActiveTab("all")}
          >
            All Notes
          </button>
          <button 
            className={cn(
              "px-3 py-2 font-medium",
              activeTab === "recent" 
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400" 
                : "text-slate-600 dark:text-slate-400"
            )}
            onClick={() => setActiveTab("recent")}
          >
            Recent
          </button>
          <button 
            className={cn(
              "px-3 py-2 font-medium",
              activeTab === "favorites" 
                ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400" 
                : "text-slate-600 dark:text-slate-400"
            )}
            onClick={() => setActiveTab("favorites")}
          >
            Favorites
          </button>
        </div>
      </div>
      
      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-20">
          <p className="text-red-600 dark:text-red-400">
            Error loading notes. Please try again.
          </p>
        </div>
      ) : notes?.length === 0 ? (
        <div className="text-center py-10 mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
            <i className="ri-file-list-3-line text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No notes found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {isTagFiltered 
              ? "No notes found with the selected tag. Try selecting a different tag or create a new note."
              : activeTab === "favorites" 
                ? "You don't have any favorite notes yet. Star notes to add them to your favorites."
                : "Get started by creating your first note."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {notes.map((note: any) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              queryKey={`/api/notes${getQueryString()}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
