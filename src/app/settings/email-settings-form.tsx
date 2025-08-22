
"use client";

import { useEffect } from "react";
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
    defaultSettings?: EmailSettings;
}

export function EmailSettingsForm({ onSync, isSyncing, defaultSettings }: EmailSettingsFormProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultSettings || {
      smtp: { host: "", port: 587, user: "", pass: "", tls: true },
      imap: { host: "", port: 993, user: "", pass: "", tls: true },
    },
  });
  
  useEffect(() => {
    const savedSettings = getEmailSettings();
    if (savedSettings) {
      form.reset(savedSettings);
    } else if (defaultSettings) {
      form.reset(defaultSettings);
    }
  }, [form, defaultSettings]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    saveEmailSettings(values);
    toast({
      title: "Settings Saved",
      description: "Your email credentials have been saved securely.",
    });
  }
  
  function handleClear() {
    clearEmailSettings();
    form.reset({
      smtp: { host: "", port: 587, user: "", pass: "", tls: true },
      imap: { host: "", port: 993, user: "", pass: "", tls: true },
    });
    toast({
        title: "Settings Cleared",
        description: "Your email credentials have been removed.",
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Email Integration</CardTitle>
            <CardDescription>
              Securely store your email credentials to enable ticket creation from your inbox and email notifications. Your password is encrypted before being saved. You can set default values in your .env file.
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
                      <Input placeholder="smtp.example.com" {...field} />
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
                      <Input type="number" placeholder="587" {...field} />
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
                      <Input placeholder="your.email@example.com" {...field} />
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
                      <Input type="password" {...field} />
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
                      <Input placeholder="imap.example.com" {...field} />
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
                      <Input type="number" placeholder="993" {...field} />
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
                      <Input placeholder="your.email@example.com" {...field} />
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
                      <Input type="password" {...field} />
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
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
             <Button type="button" variant="outline" onClick={onSync} disabled={isSyncing}>
                {isSyncing ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing...
                    </>
                ) : (
                    <>
                    <Mail className="mr-2 h-4 w-4" />
                    Sync Emails
                    </>
                )}
              </Button>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleClear}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Settings
                </Button>
                <Button type="submit">Save Settings</Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
