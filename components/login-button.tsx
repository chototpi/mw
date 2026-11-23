"use client";

import { useState } from "react";
import { User, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePiAuth } from "@/contexts/pi-auth-context";
import Link from "next/link";

export function LoginButton() {
  const { isAuthenticated, username, authMessage, hasError, reinitialize, logout } = usePiAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try { await reinitialize(); }
    catch (error) { console.error("[LoginButton] Login error:", error); }
    finally { setIsLoading(false); }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (isAuthenticated && username) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 bg-blue-50 border-blue-200 hover:bg-blue-100">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600 truncate max-w-32">
              {username.length > 13 ? `${username.slice(0, 4)}...${username.slice(-4)}` : username}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold text-gray-700">{username}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/account" className="cursor-pointer"><User className="w-4 h-4 mr-2" />Account</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/orders" className="cursor-pointer"><span className="w-4 h-4 mr-2">📝</span><span>Orders</span></Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/partner" className="cursor-pointer"><span className="w-4 h-4 mr-2">👥</span><span>Partner</span></Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleLogin} disabled={isLoading} variant={hasError ? "destructive" : "default"} size="sm"
      className={hasError ? "flex items-center gap-2" : "flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"}>
      {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs sm:text-sm">{authMessage}</span></> :
        <><User className="w-4 h-4" /><span className="hidden sm:inline">{hasError ? "Retry Login" : "Login with Pi"}</span><span className="sm:hidden">{hasError ? "Retry" : "Login"}</span></>}
    </Button>
  );
}
