import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NoteCard from "@/components/note-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function TodoList() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  
  // Parse URL params
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  // Build query string based on search params
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    // Always filter by todo type
    params.append("type", "todo");
    
    // Add search term if exists
    const searchTerm = searchParams?.get("search");
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    
    return `?${params.toString()}`;
  };
  
  // Fetch todo notes
  const { data: todoNotes, isLoading, error } = useQuery({
    queryKey: [`/api/notes${getQueryString()}`],
  });
  
  // Calculate overall progress
  const calculateProgress = () => {
    if (!todoNotes || todoNotes.length === 0) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    todoNotes.forEach((note: any) => {
      totalTasks += note.todoCount || 0;
      completedTasks += note.completedCount || 0;
    });
    
    if (totalTasks === 0) return 0;
    return Math.round((completedTasks / totalTasks) * 100);
  };
  
  const progress = calculateProgress();
  
  return (
    <>
      {/* Todo List Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">To-Do Lists</h1>
        <div className="w-1/3 space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      
      {/* Todo Lists Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center mb-2">
                  <Skeleton className="h-4 w-4 mr-3 rounded" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
              <div className="flex justify-between items-center mt-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-20">
          <p className="text-red-600 dark:text-red-400">
            Error loading to-do lists. Please try again.
          </p>
        </div>
      ) : todoNotes?.length === 0 ? (
        <div className="text-center py-10 mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
            <i className="ri-checkbox-multiple-line text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No to-do lists found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create your first to-do list by clicking the "New Note" button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {todoNotes.map((note: any) => (
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
