import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FolderPlus, Plus, BookOpen, Book, Search } from "lucide-react";
import { PassageCard } from "./passage-card";
import { VocabularyCard } from "./vocabulary-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFolderSchema, insertPassageSchema, insertVocabularySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type FolderViewProps = {
  type: "passage" | "vocabulary";
  title: string;
};

export function FolderView({ type, title }: FolderViewProps) {
  const { user, isAdmin } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Add search state

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ["/api/folders", type],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${type}`);
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: [`/api/${type}s`, selectedFolder],
    queryFn: async () => {
      if (!selectedFolder) return [];
      const res = await fetch(`/api/${type === 'vocabulary' ? 'vocabulary' : type + 's'}/${selectedFolder}`);
      if (!res.ok) throw new Error(`Failed to fetch ${type}s`);
      return res.json();
    },
    enabled: !!selectedFolder,
  });

  const sortedItems = items ? [...items].sort((a, b) => {
    const totalReactionsA = Object.values(a.reactions || {}).reduce((sum: number, count: number) => sum + count, 0);
    const totalReactionsB = Object.values(b.reactions || {}).reduce((sum: number, count: number) => sum + count, 0);
    return totalReactionsB - totalReactionsA;
  }) : [];

  const folderForm = useForm({
    resolver: zodResolver(insertFolderSchema),
    defaultValues: {
      name: "",
      type: type,
      isPublic: true, // Always set to true for admin users
    },
  });

  const itemForm = useForm({
    resolver: zodResolver(type === "passage" ? insertPassageSchema : insertVocabularySchema),
    defaultValues: type === "passage"
      ? { title: "", content: "", folderId: selectedFolder }
      : { word: "", definition: "", example: "", folderId: selectedFolder },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/folders", {
        ...data,
        isPublic: isAdmin, // Automatically set isPublic based on admin status
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", type] });
      setIsAddingFolder(false);
      folderForm.reset();
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = type === 'vocabulary' ? 'vocabulary' : `${type}s`;
      const res = await apiRequest("POST", `/api/${endpoint}`, {
        ...data,
        folderId: selectedFolder,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`, selectedFolder] });
      setIsAddingItem(false);
      itemForm.reset();
    },
  });

  // Filter items based on search query
  const filteredItems = sortedItems?.filter(item => {
    const query = searchQuery.toLowerCase();
    if (type === "passage") {
      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      );
    }
    return (
      item.word?.toLowerCase().includes(query) ||
      item.definition?.toLowerCase().includes(query)
    );
  });

  if (foldersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="backdrop-blur-sm bg-card/95 border-primary/10 shadow-xl">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b pb-6 bg-gradient-to-br from-background via-background/95 to-background/90">
        <div className="w-full md:flex-1 md:mr-4 mb-4 md:mb-0">
          {type === "passage" ? (
            <div
              className="relative h-24 md:h-32 rounded-lg overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 backdrop-blur-sm" />
              <div className="relative z-10 p-4">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-blue-500 mb-2" />
                <CardTitle className="text-xl md:text-2xl font-bold text-white mb-1">{title}</CardTitle>
                <CardDescription className="text-white/90 text-sm md:text-base">
                  Organize your reading materials
                </CardDescription>
              </div>
            </div>
          ) : (
            <div
              className="relative h-24 md:h-32 rounded-lg overflow-hidden bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://images.unsplash.com/photo-1457369804613-52c61a468e7d")',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 group-hover:from-emerald-500/30 group-hover:to-green-500/30 backdrop-blur-sm" />
              <div className="relative z-10 p-4">
                <Book className="h-6 w-6 md:h-8 md:w-8 text-emerald-500 mb-2" />
                <CardTitle className="text-xl md:text-2xl font-bold text-white mb-1">{title}</CardTitle>
                <CardDescription className="text-white/90 text-sm md:text-base">
                  Organize your vocabulary lists
                </CardDescription>
              </div>
            </div>
          )}
        </div>
        <Dialog open={isAddingFolder} onOpenChange={setIsAddingFolder}>
          <DialogTrigger asChild>
            <Button
              className={cn(
                "w-full md:w-auto bg-gradient-to-r transition-all duration-500 hover:scale-105 shadow-lg group relative overflow-hidden",
                type === "passage"
                  ? "from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  : "from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              )}
            >
              <FolderPlus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative">
                New Folder
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
            </DialogHeader>
            <Form {...folderForm}>
              <form
                onSubmit={folderForm.handleSubmit((data) =>
                  createFolderMutation.mutate(data)
                )}
                className="space-y-4"
              >
                <FormField
                  control={folderForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Folder Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={createFolderMutation.isPending}
                  className="w-full"
                >
                  Create Folder
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
          {folders?.map((folder: any) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder(folder.id)}
              className={cn(
                "transition-all duration-300 hover:scale-105 font-medium text-sm md:text-base group relative overflow-hidden",
                selectedFolder === folder.id
                  ? type === "passage"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                  : "bg-gradient-to-r from-card to-muted/50 hover:from-muted hover:to-muted/80"
              )}
            >
              <span className="relative">
                {folder.name}
                {selectedFolder === folder.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 animate-pulse" />
                )}
              </span>
            </Button>
          ))}
        </div>

        {selectedFolder && (
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <div className="mb-8 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${type === "passage" ? "passages" : "vocabulary"}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
                <DialogTrigger asChild>
                  <Button
                    className={cn(
                      "bg-gradient-to-r transition-all duration-500 hover:scale-105 shadow-lg group relative overflow-hidden",
                      type === "passage"
                        ? "from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        : "from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                    <span className="relative">
                      Add {type === "passage" ? "Passage" : "Word"}
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white/30 transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Add New {type === "passage" ? "Passage" : "Vocabulary"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...itemForm}>
                    <form
                      onSubmit={itemForm.handleSubmit((data) =>
                        createItemMutation.mutate(data)
                      )}
                      className="space-y-4"
                    >
                      {type === "passage" ? (
                        <>
                          <FormField
                            control={itemForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      ) : (
                        <>
                          <FormField
                            control={itemForm.control}
                            name="word"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Word</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="definition"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Definition</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="example"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Example (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      <Button
                        type="submit"
                        disabled={createItemMutation.isPending}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        Add {type === "passage" ? "Passage" : "Word"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {itemsLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredItems.map((item: any) =>
                  type === "passage" ? (
                    <PassageCard key={item.id} passage={item} />
                  ) : (
                    <VocabularyCard key={item.id} vocabulary={item} />
                  )
                )}
                {filteredItems.length === 0 && searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    No matches found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}