'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registration</CardTitle>
          <CardDescription>
            User registration is currently limited to administrative setup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            For demo purposes, available users are:
          </p>
          <ul className="text-sm space-y-1">
            <li>alice.johnson.demo@example.com</li>
            <li>bob.williams.demo@example.com</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Password: Any string will work for demo authentication.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}