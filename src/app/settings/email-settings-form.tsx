
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveEmailSettings, getEmailSettings, clearEmailSettings } from "@/lib/email-settings";
import { EmailSettings } from "@/lib/types";
import { Mail, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  smtp: z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    user: z.string().min(1, "Username is required"),
    pass: z.string().min(1, "Password is required"),
    tls: z.boolean().default(true),
  }),
  imap: z.object({
    host: z.string().min(1, "Host is required"),
    port: z.coerce.number().min(1, "Port is required"),
    user: z.string().min(1, "Username is required"),
    pass: z.string().min(1, "Password is required"),
    tls: z.boolean().default(true),
  }),
});

interface EmailSettingsFormProps {
    onSync: () => void;
    isSyncing: boolean;
}

export function EmailSettingsForm({ onSync, isSyncing }: EmailSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtp: { host: "", port: 587, user: "", pass: "", tls: true },
      imap: { host: "", port: 993, user: "", pass: "", tls: true },
    },
  });
  
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const savedSettings = await getEmailSettings();
      if (savedSettings) {
        form.reset(savedSettings);
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      await saveEmailSettings(values);
      toast({
        title: "Settings Saved",
        description: "Your email credentials have been saved securely.",
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }
  
  async function handleClear() {
    try {
      setLoading(true);
      await clearEmailSettings();
      form.reset({
        smtp: { host: "", port: 587, user: "", pass: "", tls: true },
        imap: { host: "", port: 993, user: "", pass: "", tls: true },
      });
      toast({
          title: "Settings Cleared",
          description: "Your email credentials have been removed.",
      });
    } catch (error) {
      console.error('Error clearing email settings:', error);
      toast({
        title: "Error",
        description: "Failed to clear email settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
      console.log('Sync button clicked');
      try {
        setLoading(true);
        console.log('Making POST request to /api/email-sync');
        const response = await fetch('/api/email-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Full response result:', result);
  
        if (response.ok) {
          toast({
            title: "Sync Successful",
            description: `Processed ${result.processed || 0} emails, created ${result.created || 0} new tickets.`,
          });
          onSync?.();
        } else {
          const errorMessage = result.error || 'Failed to sync emails.';
          const details = result.details ? ` Details: ${result.details}` : '';
          console.error('Sync failed with error:', errorMessage, details);
          toast({
            title: "Sync Failed",
            description: `${errorMessage}${details}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Network error during sync:', error);
        toast({
          title: "Sync Error",
          description: "Failed to sync emails. Please check your connection and server logs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={loading ? "pointer-events-none opacity-50" : ""}>
          <CardHeader>
            <CardTitle>Email Integration</CardTitle>
            <CardDescription>
              Securely store your email credentials to enable ticket creation from your inbox and email notifications. Your password is encrypted before being saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">SMTP (Outgoing Mail)</h3>
              <FormField
                control={form.control}
                name="smtp.host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.gmail.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="smtp.port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="465" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="smtp.user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@gmail.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="smtp.pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="smtp.tls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Use TLS/STARTTLS</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
             <div className="space-y-4">
              <h3 className="font-semibold text-lg">IMAP (Incoming Mail)</h3>
               <FormField
                control={form.control}
                name="imap.host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Host</FormLabel>
                    <FormControl>
                      <Input placeholder="imap.gmail.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imap.port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMAP Port</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="993" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imap.user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@gmail.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="imap.pass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="imap.tls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Use TLS</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
          <div className="flex justify-between border-t pt-6">
             <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSync(); }} disabled={loading || isSyncing}>
                {(loading || isSyncing) ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isSyncing ? "Syncing..." : "Loading..."}
                    </>
                ) : (
                    <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sync Emails
                    </>
                )}
              </Button>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClear} disabled={loading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Settings
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Settings"}
                </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}
