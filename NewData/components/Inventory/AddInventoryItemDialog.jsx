import React, { useState } from "react";
import { GenerateImage, InvokeLLM } from "@/integrations/Core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";

export default function AddInventoryItemDialog({ open, onOpenChange, onAddItem }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "other",
    current_amount: 0,
    minimum_amount: 1,
    unit: "pieces"
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      let iconUrl = "";
      
      // Generate icon
      try {
        const imageResult = await GenerateImage({
          prompt: `A clean, simple icon of ${formData.name}, minimalist style, flat design, centered on white background, high quality`
        });
        iconUrl = imageResult.url;
      } catch (error) {
        console.error("Error generating icon:", error);
      }
      
      // Try to get smart category suggestion if category is "other"
      if (formData.category === "other") {
        try {
          const categoryResult = await InvokeLLM({
            prompt: `Categorize this grocery/household item: "${formData.name}". Choose one category: dairy, meat, vegetables, fruits, grains, snacks, beverages, household, personal_care, other. Respond with just the category name.`,
            response_json_schema: {
              type: "object",
              properties: {
                category: { type: "string" }
              }
            }
          });
          
          if (categoryResult.category) {
            formData.category = categoryResult.category;
          }
        } catch (error) {
          console.error("Error getting category suggestion:", error);
        }
      }
      
      await onAddItem({
        ...formData,
        icon_url: iconUrl
      });
      
      // Reset form
      setFormData({
        name: "",
        category: "other",
        current_amount: 0,
        minimum_amount: 1,
        unit: "pieces"
      });
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="material-container border-0 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="w-6 h-6 text-teal-500" />
            Add to Inventory
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Item Name</Label>
            <Input
              id="name"
              placeholder="What item do you have?"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="material-container border-0 h-12"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.current_amount}
                onChange={(e) => handleInputChange('current_amount', parseFloat(e.target.value))}
                className="material-container border-0 h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum Amount</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={formData.minimum_amount}
                onChange={(e) => handleInputChange('minimum_amount', parseFloat(e.target.value))}
                className="material-container border-0 h-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleInputChange('unit', value)}
              >
                <SelectTrigger className="material-container border-0 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="material-container border-0">
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="g">Grams</SelectItem>
                  <SelectItem value="l">Liters</SelectItem>
                  <SelectItem value="ml">ML</SelectItem>
                  <SelectItem value="bottles">Bottles</SelectItem>
                  <SelectItem value="cans">Cans</SelectItem>
                  <SelectItem value="packs">Packs</SelectItem>
                  <SelectItem value="boxes">Boxes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="material-container border-0 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="material-container border-0">
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="personal_care">Personal Care</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 material-button border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 material-button bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white"
            >
              {isLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}