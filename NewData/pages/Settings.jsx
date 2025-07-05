import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Heart, Link, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);
      if (user.partner_email) {
        setPartnerEmail(user.partner_email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!partnerEmail || partnerEmail === currentUser.email) {
      setSaveStatus({ type: 'error', message: "Please enter a valid partner email." });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      await User.updateMyUserData({ partner_email: partnerEmail });
      setSaveStatus({ type: 'success', message: "Partner linked successfully!" });
      loadUserData(); // Refresh data
    } catch (error) {
      console.error("Error saving partner email:", error);
      setSaveStatus({ type: 'error', message: "Failed to save. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your profile and link with your partner.</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-6 h-6 text-pink-500" />
              Link Your Partner
            </CardTitle>
            <CardDescription>
              Enter your partner's email to sync tasks. They must be a registered user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="partnerEmail" className="font-medium">Partner's Email</Label>
              <Input
                id="partnerEmail"
                type="email"
                placeholder="partner@example.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="bg-white/80 border-pink-200 focus:border-pink-400"
              />
            </div>
            
            <Alert className="bg-rose-50 border-rose-200">
              <Heart className="h-4 w-4 text-rose-500" />
              <AlertTitle className="text-rose-800">For a complete sync</AlertTitle>
              <p className="text-rose-700 text-sm">
                Your partner must also add your email address in their settings.
              </p>
            </Alert>

            {saveStatus && (
              <Alert variant={saveStatus.type === 'success' ? 'default' : 'destructive'} className={saveStatus.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
                {saveStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <p>{saveStatus.message}</p>
              </Alert>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg"
            >
              {isSaving ? 'Saving...' : 'Save Partner Connection'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}