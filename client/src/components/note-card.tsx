import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatDate, getTagColorClasses } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type NoteCardProps = {
  note: any;
  onEdit?: (note: any) => void;
  onDelete?: (noteId: number) => void;
  queryKey: string;
};

export default function NoteCard({ 
  note, 
  onEdit, 
  onDelete,
  queryKey 
}: NoteCardProps) {
  const [isFavorite, setIsFavorite] = useState(note.isFavorite);
  
  // Mutation for toggling favorite status
  const { mutate: toggleFavorite } = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", `/api/notes/${note.id}`, {
        isFavorite: !isFavorite,
      });
      return !isFavorite;
    },
    onSuccess: (newFavoriteState) => {
      setIsFavorite(newFavoriteState);
    },
  });
  
  // Mutation for updating todo item completion status
  const { mutate: updateTodoItem } = useMutation({
    mutationFn: async (data: { todoId: number, isCompleted: boolean }) => {
      await apiRequest("PUT", `/api/notes/${note.id}`, {
        todoItems: (note.todoItems || []).map((item: any) => 
          item.id === data.todoId 
            ? { ...item, isCompleted: data.isCompleted }
            : item
        ),
      });
    },
  });

  const handleTodoItemChange = (todoId: number, isCompleted: boolean) => {
    updateTodoItem({ todoId, isCompleted });
  };
  
  const renderNoteContent = () => {
    if (note.type === "todo" && note.todoItems?.length > 0) {
      return (
        <div className="space-y-2 mb-4">
          {note.todoItems.map((item: any) => (
            <div key={item.id} className="flex items-center">
              <Checkbox 
                id={`todo-${item.id}`}
                checked={item.isCompleted}
                onCheckedChange={(checked) => 
                  handleTodoItemChange(item.id, checked as boolean)
                }
                className="mr-3"
              />
              <label 
                htmlFor={`todo-${item.id}`}
                className={cn(
                  "text-slate-800 dark:text-slate-200",
                  item.isCompleted && "line-through text-slate-600 dark:text-slate-300"
                )}
              >
                {item.content}
              </label>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-4">
        {note.content}
      </p>
    );
  };
  
  return (
    <Card className="overflow-hidden note-card-hover">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium text-lg">{note.title}</h3>
          <div className="note-actions opacity-0 transition-opacity">
            <button 
              className={cn(
                "p-1",
                isFavorite 
                  ? "text-primary-600 dark:text-primary-400" 
                  : "text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
              )}
              onClick={() => toggleFavorite()}
            >
              {isFavorite ? (
                <i className="ri-star-fill"></i>
              ) : (
                <i className="ri-star-line"></i>
              )}
            </button>
          </div>
        </div>
        
        {renderNoteContent()}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {note.tags?.map((tag: any) => (
              <span 
                key={tag.id}
                className={cn(
                  "px-2 py-1 rounded text-xs",
                  getTagColorClasses(tag.color)
                )}
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
  );
}
