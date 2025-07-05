
import React, { useState, useEffect } from "react";
import { InventoryItem } from "@/entities/InventoryItem";
import { User } from "@/entities/User";
import { GenerateImage } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, AlertTriangle } from "lucide-react";

import AddInventoryItemDialog from "../components/inventory/AddInventoryItemDialog";
import InventoryItemCard from "../components/inventory/InventoryItemCard";
import EditInventoryItemDialog from "../components/inventory/EditInventoryItemDialog";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const generateMissingIcons = async (inventoryItems) => {
    const itemsWithoutIcons = inventoryItems.filter(item => !item.icon_url);
    if (itemsWithoutIcons.length === 0) return false;

    for (const item of itemsWithoutIcons) {
        try {
            const imageResult = await GenerateImage({
                prompt: `A clean, simple icon of ${item.name}, minimalist style, flat design, centered on white background, high quality`
            });
            await InventoryItem.update(item.id, { icon_url: imageResult.url });
        } catch (error) {
            console.error(`Failed to generate icon for ${item.name}:`, error);
        }
    }
    return true;
  };

  const loadData = async () => {
    try {
      const [user, inventoryItems] = await Promise.all([
        User.me(),
        InventoryItem.list('-updated_date')
      ]);
      
      setCurrentUser(user);
      
      // Filter items for current user and partner
      const userEmails = [user.email];
      if (user.partner_email) userEmails.push(user.partner_email);
      const filteredItems = inventoryItems.filter(item => 
        userEmails.includes(item.created_by)
      );
      
      setItems(filteredItems);

      const iconsGenerated = await generateMissingIcons(filteredItems);
      if(iconsGenerated) {
          // Re-load data if icons were generated to show them immediately
          const reloadedItems = await InventoryItem.list('-updated_date');
          const reloadedFiltered = reloadedItems.filter(item => userEmails.includes(item.created_by));
          setItems(reloadedFiltered);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (itemData) => {
    try {
      await InventoryItem.create(itemData);
      loadData();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await InventoryItem.update(itemId, updates);
      if (editingItem) setEditingItem(null);
      loadData();
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await InventoryItem.delete(itemId);
      loadData();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockItems = filteredItems.filter(item => item.current_amount < item.minimum_amount);
  const normalStockItems = filteredItems.filter(item => item.current_amount >= item.minimum_amount);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Home Inventory</h1>
              <p className="text-gray-600 mt-1">Track what you have at home</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="material-fab bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white h-14 px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Item
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search inventory..."
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
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-bold text-gray-900">{filteredItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="material-container border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-xl font-bold text-gray-900">{lowStockItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Items */}
        <div className="space-y-6">
          {/* Low Stock Items */}
          {lowStockItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-red-600">Low Stock</h2>
                <Badge className="bg-red-100 text-red-700">
                  {lowStockItems.length} items
                </Badge>
              </div>
              <div className="grid gap-3">
                <AnimatePresence>
                  {lowStockItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onEdit={setEditingItem}
                      isLowStock={true}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Normal Stock Items */}
          {normalStockItems.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">In Stock</h2>
              <div className="grid gap-3">
                <AnimatePresence>
                  {normalStockItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onEdit={setEditingItem}
                      isLowStock={false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items in inventory</h3>
              <p className="text-gray-600 mb-6">Add items to track what you have at home</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="material-fab bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <AddInventoryItemDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddItem={handleAddItem}
        />
        <EditInventoryItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}
          onUpdateItem={handleUpdateItem}
        />
      </div>
    </div>
  );
}
