
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Home, Plus, ShoppingCart, Package, Settings, Archive } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  
  const navigationItems = [
    {
      title: "Tasks",
      url: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      title: "Add Task",
      url: createPageUrl("AddTask"),
      icon: Plus,
    },
    {
      title: "Shopping List",
      url: createPageUrl("ShoppingList"),
      icon: ShoppingCart,
    },
    {
      title: "Inventory",
      url: createPageUrl("Inventory"),
      icon: Package,
    },
    {
      title: "Archive",
      url: createPageUrl("Archive"),
      icon: Archive,
    },
    {
      title: "Settings",
      url: createPageUrl("Settings"),
      icon: Settings,
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50">
        <style>
          {`
            :root {
              --primary: 262 80% 50%;
              --primary-foreground: 0 0% 100%;
              --secondary: 220 14% 96%;
              --secondary-foreground: 220 9% 46%;
              --accent: 220 14% 96%;
              --accent-foreground: 220 9% 46%;
              --muted: 220 14% 96%;
              --muted-foreground: 220 9% 46%;
              --card: 0 0% 100%;
              --card-foreground: 222 84% 5%;
              --border: 220 13% 91%;
              --input: 220 13% 91%;
              --radius: 24px;
            }
            
            .material-container {
              border-radius: 24px;
              background: rgba(255, 255, 255, 0.9);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .material-button {
              border-radius: 20px;
              font-weight: 500;
              letter-spacing: 0.1px;
              transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            }
            
            .material-fab {
              border-radius: 16px;
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
              transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            }
            
            .material-fab:hover {
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
              transform: translateY(-2px);
            }
          `}
        </style>
        
        <Sidebar className="border-r-0 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="p-6 border-b border-gray-200/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-xl">CoupleTasks</h2>
                <p className="text-sm text-gray-600">Together we organize</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`material-button hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 rounded-2xl mb-2 h-14 px-4 ${
                          location.pathname === item.url ? 'bg-purple-100 text-purple-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-4">
                          <item.icon className="w-6 h-6" />
                          <span className="font-medium text-base">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="material-button hover:bg-purple-50 p-3 rounded-2xl transition-colors duration-200" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">CoupleTasks</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
