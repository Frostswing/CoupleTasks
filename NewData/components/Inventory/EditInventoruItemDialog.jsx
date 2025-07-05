
import React, { useState, useEffect } from "react";
import { GenerateImage } from "@/integrations/Core";
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
import { Package, Image } from "lucide-react";

export default function EditInventoryItemDialog({ item, open, onOpenChange, onUpdateItem }) {
  const [formData, setFormData] = useState(item);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  if (!item || !formData) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateIcon = async () => {
      setIsSaving(true);
      try {
        const imageResult = await GenerateImage({
          prompt: `A clean, simple icon of ${formData.name}, minimalist style, flat design, centered on white background, high quality`
        });
        handleInputChange('icon_url', imageResult.url);
      } catch (error) {
        console.error("Error generating icon:", error);
      } finally {
        setIsSaving(false);
      }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateItem(item.id, formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="material-container border-0 max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Package className="w-6 h-6 text-teal-500" />
            Edit Inventory Item
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            {formData.icon_url && <img src={formData.icon_url} alt={formData.name} className="w-16 h-16 rounded-2xl object-cover bg-gray-100"/>}
            <Button type="button" variant="outline" onClick={handleGenerateIcon} className="material-button">
              <Image className="w-4 h-4 mr-2" />
              {isSaving ? "Generating..." : "Generate New Icon"}
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Item Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="material-container border-0 h-12" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Amount</Label>
              <Input type="number" min="0" step="0.1" value={formData.current_amount} onChange={(e) => handleInputChange('current_amount', parseFloat(e.target.value))} className="material-container border-0 h-12" />
            </div>
            <div className="space-y-2">
              <Label>Minimum Amount</Label>
              <Input type="number" min="0" step="0.1" value={formData.minimum_amount} onChange={(e) => handleInputChange('minimum_amount', parseFloat(e.target.value))} className="material-container border-0 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
              <SelectTrigger className="material-container border-0 h-12">
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent className="material-container border-0">
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="grams">grams</SelectItem>
                <SelectItem value="liters">liters</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="units">units</SelectItem>
                <SelectItem value="packs">packs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger className="material-container border-0 h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="material-container border-0">
                <SelectItem value="produce">Produce</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="meat">Meat</SelectItem>
                <SelectItem value="pantry">Pantry</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
                <SelectItem value="household">Household</SelectItem>
                <SelectItem value="personal care">Personal Care</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 material-button">Cancel</Button>
            <Button type="submit" disabled={isSaving} className="flex-1 material-button bg-gradient-to-r from-teal-500 to-green-500 text-white">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
