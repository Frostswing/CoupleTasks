
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingListItem } from '@/entities/ShoppingListItem';
import { InventoryItem } from '@/entities/InventoryItem';
import { InvokeLLM } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, XCircle, ShoppingBag, Flag } from 'lucide-react';
import { createPageUrl } from '@/utils'; // FIX: Added missing import
import ShoppingItemCard from '../components/shopping/ShoppingItemCard';
import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ShoppingModePage() {
    const [items, setItems] = useState([]);
    const [categoryOrder, setCategoryOrder] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchItems = async () => {
            const params = new URLSearchParams(location.search);
            const itemIds = params.get('items')?.split(',');
            if (!itemIds || itemIds.length === 0) {
                setError("No items to shop for.");
                setIsLoading(false);
                return;
            }

            try {
                const fetchedItems = await Promise.all(
                    itemIds.map(id => ShoppingListItem.get(id))
                );
                setItems(fetchedItems.filter(Boolean)); // Filter out any nulls if an item wasn't found
            } catch (err) {
                setError("Failed to load shopping items.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchItems();
    }, [location.search]);

    useEffect(() => {
        if (items.length > 0) {
            const getOptimalRoute = async () => {
                const categories = [...new Set(items.map(item => item.category))];
                try {
                    const result = await InvokeLLM({
                        prompt: `Optimize a shopping route for these supermarket categories: ${categories.join(', ')}. Common layouts start with produce (fruits, vegetables), then go to deli/bakery, meat, dairy, then center aisles (grains, snacks, beverages), and finally household/personal care. Provide the optimized order as a JSON array of strings.`,
                        response_json_schema: {
                            type: "object",
                            properties: {
                                "ordered_categories": {
                                    type: "array",
                                    items: { "type": "string" }
                                }
                            }
                        }
                    });
                    setCategoryOrder(result.ordered_categories || categories);
                } catch (err) {
                    console.error("Failed to get optimal route, using default order.", err);
                    setCategoryOrder(categories);
                }
            };
            getOptimalRoute();
        }
    }, [items]);
    
    const handleTogglePurchased = (itemToToggle) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === itemToToggle.id ? { ...item, is_purchased: !item.is_purchased } : item
            )
        );
    };

    const handleFinishShopping = async () => {
        const purchasedItems = items.filter(item => item.is_purchased);
        try {
            for (const item of purchasedItems) {
                // Update inventory
                const existingInventory = await InventoryItem.filter({ name: item.name });
                if (existingInventory.length > 0) {
                    await InventoryItem.update(existingInventory[0].id, {
                        current_amount: (existingInventory[0].current_amount || 0) + item.quantity,
                        last_purchased: new Date().toISOString()
                    });
                }
                // Archive shopping list item
                await ShoppingListItem.update(item.id, { is_archived: true, is_purchased: true });
            }
            navigate(createPageUrl('ShoppingList'));
        } catch (err) {
            console.error("Failed to finish shopping:", err);
            setError("There was an error finishing your shopping trip. Please try again.");
        }
    };
    
    const { toBuy, bought } = useMemo(() => {
        const toBuy = {};
        const bought = [];
        items.forEach(item => {
            if (item.is_purchased) {
                bought.push(item);
            } else {
                if (!toBuy[item.category]) {
                    toBuy[item.category] = [];
                }
                toBuy[item.category].push(item);
            }
        });
        return { toBuy, bought };
    }, [items]);
    
    const orderedCategories = categoryOrder.filter(cat => toBuy[cat]?.length > 0);
    const hasBoughtItems = bought.length > 0;

    if (isLoading) return <div className="p-6 text-center">Loading Shopping Mode...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-6 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <ShoppingBag className="w-8 h-8 text-purple-500"/>
                        Shopping Mode
                    </h1>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="material-button">
                          <XCircle className="w-5 h-5 mr-2" />
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="material-container border-0">
                        <DialogHeader><DialogTitle>Cancel Shopping Trip?</DialogTitle></DialogHeader>
                        <DialogDescription>Any items you've marked as purchased will not be saved.</DialogDescription>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => navigate(createPageUrl('ShoppingList'))}>Yes, Cancel</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-6">
                    {orderedCategories.length > 0 ? (
                        orderedCategories.map(category => (
                            <div key={category}>
                                <h2 className="text-xl font-semibold capitalize mb-3 text-gray-800">{category}</h2>
                                <div className="space-y-3">
                                    {toBuy[category].map(item => (
                                        <ShoppingItemCard key={item.id} item={item} onTogglePurchased={handleTogglePurchased} onDelete={() => {}} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 material-container border-0">
                            <h3 className="text-xl font-semibold">All items purchased!</h3>
                        </div>
                    )}
                </div>

                {hasBoughtItems && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold text-gray-500 mb-3">In Your Cart</h2>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {bought.map(item => (
                                    <ShoppingItemCard key={item.id} item={item} onTogglePurchased={handleTogglePurchased} onDelete={() => {}} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
                
                {hasBoughtItems && (
                    <div className="mt-8 text-center">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button size="lg" className="material-fab bg-gradient-to-r from-green-500 to-cyan-500 text-white h-16 px-8 text-lg">
                                    <Flag className="w-6 h-6 mr-3" />
                                    Finish Shopping
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="material-container border-0">
                                <DialogHeader><DialogTitle>Finish Shopping Trip?</DialogTitle></DialogHeader>
                                <DialogDescription>This will update your inventory with all purchased items and clear your list.</DialogDescription>
                                <DialogFooter>
                                    <Button variant="outline">Cancel</Button>
                                    <Button onClick={handleFinishShopping}>Yes, Finish</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
}
