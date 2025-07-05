
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Package, AlertTriangle, Plus, Minus, Edit } from "lucide-react";

const categoryColors = {
  dairy: "bg-blue-100 text-blue-700 border-blue-200",
  meat: "bg-red-100 text-red-700 border-red-200",
  vegetables: "bg-green-100 text-green-700 border-green-200",
  fruits: "bg-orange-100 text-orange-700 border-orange-200",
  grains: "bg-yellow-100 text-yellow-700 border-yellow-200",
  snacks: "bg-purple-100 text-purple-700 border-purple-200",
  beverages: "bg-cyan-100 text-cyan-700 border-cyan-200",
  household: "bg-gray-100 text-gray-700 border-gray-200",
  personal_care: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-slate-100 text-slate-700 border-slate-200"
};

export default function InventoryItemCard({ item, onUpdate, onDelete, onEdit, isLowStock }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(item.current_amount);

  const handleAmountChange = (newAmount) => {
    if (newAmount < 0) return;
    onUpdate(item.id, { current_amount: newAmount });
  };

  const handleQuickAdjust = (adjustment) => {
    const newAmount = Math.max(0, item.current_amount + adjustment);
    handleAmountChange(newAmount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className={`material-container border-0 transition-all duration-300 group ${
        isLowStock ? 'ring-2 ring-red-200' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              {item.icon_url ? (
                <img 
                  src={item.icon_url} 
                  alt={item.name}
                  className="w-12 h-12 rounded-2xl object-cover bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-green-400 rounded-2xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        className={`${categoryColors[item.category]} text-xs`}
                        variant="secondary"
                      >
                        {item.category}
                      </Badge>
                      {isLowStock && (
                        <Badge className="bg-red-100 text-red-700 text-xs" variant="secondary">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuickAdjust(-1)}
                      className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-center min-w-[80px]">
                      <p className="text-lg font-bold text-gray-900">
                        {item.current_amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        of {item.minimum_amount} {item.unit}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleQuickAdjust(1)}
                      className="h-8 w-8 rounded-full hover:bg-green-50 hover:text-green-600"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl h-10 w-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
