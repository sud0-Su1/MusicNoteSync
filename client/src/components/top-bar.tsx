import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function TopBar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const { toast } = useToast();
  
  // Determine note type based on current path
  const getNoteTypeForPath = () => {
    if (location === "/todos") return "todo";
    if (location === "/quick-notes") return "quick_note";
    return "note";
  };
  
  // Fetch tags for dropdown
  const { data: tags } = useQuery({
    queryKey: ["/api/tags"],
  });
  
  // Get query key based on current path
  const getQueryKeyForCurrentView = () => {
    if (location === "/todos") return "/api/notes?type=todo";
    if (location === "/quick-notes") return "/api/notes?type=quick_note";
    return "/api/notes";
  };
  
  // Create note mutation
  const { mutate: createNote, isPending } = useMutation({
    mutationFn: async (formData: any) => {
      return await apiRequest("POST", "/api/notes", formData);
    },
    onSuccess: () => {
      // Clear form and close dialog
      setNoteTitle("");
      setNoteContent("");
      setIsCreatingNote(false);
      
      // Invalidate query to refresh notes
      queryClient.invalidateQueries({ queryKey: [getQueryKeyForCurrentView()] });
      
      toast({
        title: "Note created",
        description: "Your note has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating note",
        description: error instanceof Error ? error.message : "An error occurred while creating the note.",
        variant: "destructive",
      });
    }
  });
  
  const handleCreateNote = () => {
    // Validate form
    if (!noteTitle.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data
    const formData = {
      title: noteTitle,
      content: noteContent,
      type: getNoteTypeForPath(),
      // For todo notes, split content by lines into todo items
      ...(getNoteTypeForPath() === "todo" && noteContent ? {
        todoItems: noteContent.split('\n')
          .filter(line => line.trim())
          .map(line => ({
            content: line.trim(),
            isCompleted: false
          }))
      } : {})
    };
    
    createNote(formData);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update query string with search
    const currentPath = location || "/";
    const searchParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
    window.history.pushState(null, "", `${currentPath}${searchParam}`);
    
    // Invalidate query to trigger refetch with search
    queryClient.invalidateQueries({ queryKey: [getQueryKeyForCurrentView()] });
  };
  
  return (
    <>
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 py-3 px-4 md:px-6 flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <i className="ri-search-line absolute left-3 top-2.5 text-slate-400"></i>
          <Input 
            type="text" 
            placeholder="Search notes..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-700 border-0 focus:ring-2 focus:ring-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" title="View">
            <i className="ri-layout-grid-line text-lg"></i>
          </Button>
          <Button variant="ghost" size="icon" title="Sort">
            <i className="ri-sort-desc text-lg"></i>
          </Button>
          <Button className="ml-2" onClick={() => setIsCreatingNote(true)}>
            <i className="ri-add-line mr-1.5"></i> New Note
          </Button>
        </div>
      </header>
      
      {/* Create Note Dialog */}
      <Dialog open={isCreatingNote} onOpenChange={setIsCreatingNote}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create {
              getNoteTypeForPath() === "todo" ? "Todo List" : 
              getNoteTypeForPath() === "quick_note" ? "Quick Note" : 
              "Note"
            }</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter title"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">
                {getNoteTypeForPath() === "todo" ? "Todo Items (one per line)" : "Content"}
              </Label>
              <Textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={
                  getNoteTypeForPath() === "todo" 
                    ? "Enter todo items (one per line)" 
                    : "Enter note content"
                }
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingNote(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateNote} 
              disabled={isPending}
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
