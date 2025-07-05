
import React, { useState, useEffect, useCallback } from "react";
import { ShoppingListItem } from "@/entities/ShoppingListItem";
import { InventoryItem } from "@/entities/InventoryItem";
import { User } from "@/entities/User";
import { GenerateImage, InvokeLLM } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingCart, Trash2, Check, Search, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AddShoppingItemDialog from "../components/shopping/AddShoppingItemDialog";
import ShoppingItemCard from "../components/shopping/ShoppingItemCard";

export default function ShoppingListPage() {
  const [items, setItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    checkAutoAddItems();
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [user, shoppingItems] = await Promise.all([
        User.me(),
        ShoppingListItem.list('-created_date')
      ]);
      
      setCurrentUser(user);
      
      // Filter items for current user and partner
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const filteredItems = shoppingItems.filter(item => 
        !item.is_archived &&
        (userEmails.includes(item.created_by) || userEmails.includes(item.added_by))
      );
      
      setItems(filteredItems);
    } catch (error) {
      console.error("Error loading shopping list:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkAutoAddItems = async () => {
    try {
      const inventoryItems = await InventoryItem.list();
      const lowStockItems = inventoryItems.filter(item => 
        item.current_amount < item.minimum_amount
      );

      for (const item of lowStockItems) {
        const existingItem = await ShoppingListItem.filter({ 
          name: item.name, 
          is_purchased: false 
        });
        
        if (existingItem.length === 0) {
          await ShoppingListItem.create({
            name: item.name,
            category: item.category,
            quantity: item.minimum_amount - item.current_amount,
            unit: item.unit,
            icon_url: item.icon_url,
            auto_added: true,
            added_by: (await User.me()).email
          });
        }
      }
      
      loadData();
    } catch (error) {
      console.error("Error checking auto-add items:", error);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      let iconUrl = itemData.icon_url;
      
      if (!iconUrl) {
        try {
          const imageResult = await GenerateImage({
            prompt: `A clean, simple icon of ${itemData.name}, minimalist style, flat design, centered on white background, high quality`
          });
          iconUrl = imageResult.url;
        } catch (error) {
          console.error("Error generating icon:", error);
        }
      }

      await ShoppingListItem.create({
        ...itemData,
        icon_url: iconUrl,
        added_by: currentUser.email
      });
      
      // Update purchase frequency for suggestions
      const existingInventory = await InventoryItem.filter({ name: itemData.name });
      if (existingInventory.length > 0) {
        await InventoryItem.update(existingInventory[0].id, {
          purchase_frequency: (existingInventory[0].purchase_frequency || 0) + 1
        });
      } else {
        await InventoryItem.create({
          name: itemData.name,
          category: itemData.category, // FIX: Was `item.category`, now `itemData.category`
          unit: itemData.unit,
          icon_url: iconUrl,
          purchase_frequency: 1
        });
      }
      
      loadData();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleTogglePurchased = async (item) => {
    try {
      await ShoppingListItem.update(item.id, {
        is_purchased: !item.is_purchased
      });
      
      if (!item.is_purchased) {
        // Item being marked as purchased - update inventory
        const existingInventory = await InventoryItem.filter({ name: item.name });
        if (existingInventory.length > 0) {
          await InventoryItem.update(existingInventory[0].id, {
            current_amount: existingInventory[0].current_amount + item.quantity,
            last_purchased: new Date().toISOString()
          });
        }
      }
      
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await ShoppingListItem.delete(itemId);
      loadData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingItems = filteredItems.filter(item => !item.is_purchased);
  const purchasedItems = filteredItems.filter(item => item.is_purchased);

  const handleStartShopping = () => {
    const itemIds = pendingItems.map(item => item.id);
    if (itemIds.length > 0) {
      navigate(createPageUrl(`ShoppingMode?items=${itemIds.join(',')}`));
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shopping List</h1>
              <p className="text-gray-600 mt-1">What do you need to buy?</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleStartShopping}
                disabled={pendingItems.length === 0}
                className="material-fab bg-gradient-to-r from-green-500 to-cyan-500 text-white h-14 px-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Shop
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="material-fab bg-gradient-to-r from-purple-500 to-blue-500 text-white h-14 w-14"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 material-container border-0 text-base"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Buy</p>
                  <p className="text-xl font-bold text-gray-900">{pendingItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchased</p>
                  <p className="text-xl font-bold text-gray-900">{purchasedItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shopping Items */}
        <div className="space-y-6">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">To Buy</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingItems.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onTogglePurchased={handleTogglePurchased}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Purchased</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {purchasedItems.map((item) => (
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onTogglePurchased={handleTogglePurchased}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Add items to your shopping list to get started</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="material-fab bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>

        {/* Add Item Dialog */}
        <AddShoppingItemDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddItem={handleAddItem}
        />
      </div>
    </div>
  );
}
