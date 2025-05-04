import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export default function QuickNotes() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>();
  const [isCreating, setIsCreating] = useState(false);
  const [quickNoteTitle, setQuickNoteTitle] = useState("");
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const { toast } = useToast();
  
  // Parse URL params
  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);
  
  // Build query string based on search params
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    // Always filter by quick_note type
    params.append("type", "quick_note");
    
    // Add search term if exists
    const searchTerm = searchParams?.get("search");
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    
    return `?${params.toString()}`;
  };
  
  // Fetch quick notes
  const { data: quickNotes, isLoading, error } = useQuery({
    queryKey: [`/api/notes${getQueryString()}`],
  });

  // Create quick note mutation
  const { mutate: createQuickNote, isPending } = useMutation({
    mutationFn: async (formData: any) => {
      return await apiRequest("POST", "/api/notes", formData);
    },
    onSuccess: () => {
      // Clear form and close dialog
      setQuickNoteTitle("");
      setQuickNoteContent("");
      setIsCreating(false);
      
      // Invalidate query to refresh notes
      queryClient.invalidateQueries({ queryKey: [`/api/notes${getQueryString()}`] });
      
      toast({
        title: "Quick note created",
        description: "Your quick note has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating quick note",
        description: error instanceof Error ? error.message : "An error occurred while creating the quick note.",
        variant: "destructive",
      });
    }
  });

  // Delete quick note mutation
  const { mutate: deleteQuickNote } = useMutation({
    mutationFn: async (noteId: number) => {
      return await apiRequest("DELETE", `/api/notes/${noteId}`, undefined);
    },
    onSuccess: () => {
      // Invalidate query to refresh notes
      queryClient.invalidateQueries({ queryKey: [`/api/notes${getQueryString()}`] });
      
      toast({
        title: "Quick note deleted",
        description: "Your quick note has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting quick note",
        description: error instanceof Error ? error.message : "An error occurred while deleting the quick note.",
        variant: "destructive",
      });
    }
  });
  
  const handleCreateQuickNote = () => {
    // Validate form
    if (!quickNoteTitle.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data
    const formData = {
      title: quickNoteTitle,
      content: quickNoteContent,
      type: "quick_note",
    };
    
    createQuickNote(formData);
  };

  const handleDeleteQuickNote = (noteId: number) => {
    if (window.confirm("Are you sure you want to delete this quick note?")) {
      deleteQuickNote(noteId);
    }
  };
  
  return (
    <>
      {/* Quick Notes Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quick Notes</h1>
        <Button onClick={() => setIsCreating(true)}>
          <i className="ri-add-line mr-1.5"></i> New Quick Note
        </Button>
      </div>
      
      {/* Quick Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-20">
          <p className="text-red-600 dark:text-red-400">
            Error loading quick notes. Please try again.
          </p>
        </div>
      ) : quickNotes?.length === 0 ? (
        <div className="text-center py-10 mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
            <i className="ri-sticky-note-line text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium mb-2">No quick notes found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create your first quick note by clicking the "New Quick Note" button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {quickNotes.map((note: any) => (
            <Card key={note.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-lg">{note.title}</h3>
                  <div className="flex space-x-1">
                    <button 
                      className="p-1 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
                      onClick={() => {
                        setQuickNoteTitle(note.title);
                        setQuickNoteContent(note.content);
                        setIsCreating(true);
                      }}
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button 
                      className="p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                      onClick={() => handleDeleteQuickNote(note.id)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {note.content}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {note.tags?.map((tag: any) => (
                      <span 
                        key={tag.id}
                        className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Quick Note Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Quick Note</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quick-title">Title</Label>
              <Input
                id="quick-title"
                value={quickNoteTitle}
                onChange={(e) => setQuickNoteTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="quick-content">Content</Label>
              <Textarea
                id="quick-content"
                value={quickNoteContent}
                onChange={(e) => setQuickNoteContent(e.target.value)}
                placeholder="Enter quick note content"
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setQuickNoteTitle("");
              setQuickNoteContent("");
              setIsCreating(false);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateQuickNote} 
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Quick Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
