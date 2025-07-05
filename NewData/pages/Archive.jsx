import React, { useState, useEffect, useCallback } from "react";
import { Task } from "@/entities/Task";
import { ShoppingListItem } from "@/entities/ShoppingListItem";
import { User } from "@/entities/User";
import { format, differenceInDays } from "date-fns";
import { Archive as ArchiveIcon, Trash2, RotateCcw, ShoppingCart, CheckCircle, Eye, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function ArchivePage() {
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [archivedShoppingLists, setArchivedShoppingLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadArchivedData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            const userEmails = [user.email];
            if (user.partner_email) userEmails.push(user.partner_email);

            // Load archived tasks
            const allArchivedTasks = await Task.filter({ is_archived: true }, '-archived_date');
            const relevantTasks = allArchivedTasks.filter(t => userEmails.includes(t.created_by));
            setArchivedTasks(relevantTasks);

            // Load archived shopping lists (group by date)
            const allArchivedItems = await ShoppingListItem.filter({ is_archived: true }, '-updated_date');
            const relevantItems = allArchivedItems.filter(item => 
                userEmails.includes(item.created_by) || userEmails.includes(item.added_by)
            );
            
            // Group shopping items by date
            const groupedLists = {};
            relevantItems.forEach(item => {
                const date = format(new Date(item.updated_date), 'yyyy-MM-dd');
                if (!groupedLists[date]) {
                    groupedLists[date] = [];
                }
                groupedLists[date].push(item);
            });
            
            setArchivedShoppingLists(Object.entries(groupedLists).map(([date, items]) => ({
                date,
                items,
                totalItems: items.length,
                purchasedItems: items.filter(item => item.is_purchased).length
            })));

            // Auto-delete old items
            const now = new Date();
            const itemsToDelete = relevantTasks.filter(task => 
                differenceInDays(now, new Date(task.archived_date)) > 60
            );

            if (itemsToDelete.length > 0) {
                await Promise.all(itemsToDelete.map(task => Task.delete(task.id)));
                loadArchivedData();
            }
        } catch (error) {
            console.error("Error loading archived data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadArchivedData();
    }, [loadArchivedData]);

    const handleRestoreTask = async (taskId) => {
        try {
            await Task.update(taskId, { 
                is_archived: false, 
                archived_date: null,
                status: 'pending' 
            });
            loadArchivedData();
        } catch (error) {
            console.error("Error restoring task:", error);
        }
    };

    const handleRestoreShoppingList = async (listItems) => {
        try {
            await Promise.all(listItems.map(item => 
                ShoppingListItem.update(item.id, { 
                    is_archived: false, 
                    is_purchased: false 
                })
            ));
            loadArchivedData();
        } catch (error) {
            console.error("Error restoring shopping list:", error);
        }
    };

    const handleDeletePermanently = async (taskId) => {
        try {
            await Task.delete(taskId);
            loadArchivedData();
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading archived items...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Archive</h1>
                    <p className="text-gray-600 mt-1">Completed items are stored here for 60 days.</p>
                </div>

                <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 material-container border-0 h-12">
                        <TabsTrigger value="tasks" className="material-button">
                            Completed Tasks ({archivedTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="shopping" className="material-button">
                            Shopping Lists ({archivedShoppingLists.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="space-y-4 mt-6">
                        {archivedTasks.length === 0 ? (
                            <div className="text-center py-12 material-container border-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed tasks</h3>
                                <p className="text-gray-600">Completed tasks will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {archivedTasks.map(task => (
                                        <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <Card className="material-container border-0">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-800 line-through">{task.title}</h3>
                                                            {task.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {task.category}
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">
                                                                    Completed on {format(new Date(task.completion_date), 'MMM d, yyyy')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRestoreTask(task.id)}
                                                                className="text-green-600 hover:bg-green-50 h-10 w-10"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeletePermanently(task.id)}
                                                                className="text-red-500 hover:bg-red-50 h-10 w-10"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="shopping" className="space-y-4 mt-6">
                        {archivedShoppingLists.length === 0 ? (
                            <div className="text-center py-12 material-container border-0">
                                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <ShoppingCart className="w-10 h-10 text-gray-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No shopping lists</h3>
                                <p className="text-gray-600">Completed shopping lists will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {archivedShoppingLists.map((list, index) => (
                                        <motion.div
                                            key={list.date}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <Card className="material-container border-0">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-gray-800">
                                                                Shopping List - {format(new Date(list.date), 'MMM d, yyyy')}
                                                            </h3>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {list.purchasedItems} of {list.totalItems} purchased
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">
                                                                    {list.totalItems} items
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-blue-600 hover:bg-blue-50 h-10 w-10"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="material-container border-0 max-w-md">
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Shopping List - {format(new Date(list.date), 'MMM d, yyyy')}
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                                        {list.items.map((item, idx) => (
                                                                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                                                {item.icon_url && (
                                                                                    <img 
                                                                                        src={item.icon_url} 
                                                                                        alt={item.name}
                                                                                        className="w-8 h-8 rounded-lg"
                                                                                    />
                                                                                )}
                                                                                <div className="flex-1">
                                                                                    <p className={`font-medium ${item.is_purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                                                        {item.name}
                                                                                    </p>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        {item.quantity} {item.unit}
                                                                                    </p>
                                                                                </div>
                                                                                {item.is_purchased && (
                                                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRestoreShoppingList(list.items)}
                                                                className="text-green-600 hover:bg-green-50 h-10 w-10"
                                                            >
                                                                <RotateCcw className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}