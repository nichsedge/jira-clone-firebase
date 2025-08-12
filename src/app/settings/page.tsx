
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Home,
  Ticket as TicketIcon,
  Users,
  Settings,
  Mail,
  ChevronLeft,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { syncEmailsAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

export default function SettingsPage() {
  const [isSyncing, startSyncTransition] = useTransition();
  const { toast } = useToast();

  const handleSyncEmails = async () => {
    startSyncTransition(async () => {
      const result = await syncEmailsAction();
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: result.error,
        });
      } else {
        toast({
          title: "Sync Complete!",
          description: `${result.count} new ticket(s) created from emails.`,
        });
        // In a real app, we might want to redirect or update a global state
        // For now, the user can navigate back to the dashboard to see them.
      }
    });
  };

  return (
    <SidebarProvider>
       <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo />
            <span className="font-semibold text-lg">ProFlow</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Home />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="#">
                  <TicketIcon />
                  All Tickets
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="#">
                  <Users />
                  Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive>
                <Link href="/settings">
                  <Settings />
                  Settings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="w-full flex-1">
             <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <span className="font-semibold text-lg">Settings</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
              <CardHeader>
                <CardTitle>Email Integration</CardTitle>
                <CardDescription>
                  Connect your support inbox to automatically create tickets from emails.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">sim.adams71@ethereal.email</p>
                    <p className="text-sm text-muted-foreground">Connected via IMAP</p>
                  </div>
                  <Button onClick={handleSyncEmails} disabled={isSyncing}>
                    <Mail className="mr-2 h-4 w-4" />
                    {isSyncing ? "Syncing..." : "Sync Emails"}
                  </Button>
                </div>
              </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
