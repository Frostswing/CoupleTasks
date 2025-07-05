import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ShoppingCart, Package } from "lucide-react";

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

export default function ShoppingItemCard({ item, onTogglePurchased, onDelete }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className={`material-container border-0 transition-all duration-300 ${
        item.is_purchased ? 'opacity-60' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={item.is_purchased}
              onCheckedChange={() => onTogglePurchased(item)}
              className="w-5 h-5 rounded-full"
            />
            
            <div className="flex items-center gap-3 flex-1">
              {item.icon_url ? (
                <img 
                  src={item.icon_url} 
                  alt={item.name}
                  className="w-10 h-10 rounded-2xl object-cover bg-gray-100"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-gray-900 ${
                  item.is_purchased ? 'line-through text-gray-500' : ''
                }`}>
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {item.quantity} {item.unit}
                  </span>
                  <Badge 
                    className={`${categoryColors[item.category]} text-xs`}
                    variant="secondary"
                  >
                    {item.category}
                  </Badge>
                  {item.auto_added && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs" variant="secondary">
                      <Package className="w-3 h-3 mr-1" />
                      Auto-added
                    </Badge>
                  )}
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