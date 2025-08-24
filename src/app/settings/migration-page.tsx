"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Database, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface MigrationStatus {
  hasLocalStorageData: boolean;
  localStorageInfo: {
    tickets: number;
    users: number;
    projects: number;
  };
  message: string;
}

interface MigrationResult {
  success: boolean;
  data?: {
    ticketsMigrated: number;
    usersMigrated: number;
    projectsMigrated: number;
    errors: string[];
  };
  message?: string;
  warnings?: string[];
  error?: string;
  details?: string;
}

export default function MigrationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const checkMigrationStatus = async () => {
    try {
      setIsChecking(true);
      const response = await fetch('/api/migrate');
      const result = await response.json();

      if (result.success) {
        setMigrationStatus(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to check migration status",
        });
      }
    } catch (error) {
      console.error('Error checking migration status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check migration status",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Check migration status on component mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const runMigration = async () => {
    try {
      setIsLoading(true);
      setMigrationResult(null);

      const response = await fetch('/api/migrate', {
        method: 'POST',
      });

      const result = await response.json();
      setMigrationResult(result);

      if (result.success) {
        toast({
          title: "Migration Completed!",
          description: result.message,
        });

        // Refresh migration status
        await checkMigrationStatus();
      } else {
        toast({
          variant: "destructive",
          title: "Migration Failed",
          description: result.error || "Migration completed with errors",
        });
      }
    } catch (error) {
      console.error('Error running migration:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run migration",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            Checking for data to migrate...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            Migrate your existing localStorage data to the database for better persistence and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {migrationStatus && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Migration Status</AlertTitle>
                <AlertDescription>
                  {migrationStatus.message}
                </AlertDescription>
              </Alert>

              {migrationStatus.hasLocalStorageData && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Data Found:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• {migrationStatus.localStorageInfo.tickets} tickets</li>
                    <li>• {migrationStatus.localStorageInfo.users} users</li>
                    <li>• {migrationStatus.localStorageInfo.projects} projects</li>
                  </ul>
                </div>
              )}

              <Button
                onClick={runMigration}
                disabled={isLoading || !migrationStatus?.hasLocalStorageData}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    {migrationStatus?.hasLocalStorageData
                      ? 'Start Migration'
                      : 'No Data to Migrate'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              Migration Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {migrationResult.message && (
              <Alert variant={migrationResult.success ? "default" : "destructive"}>
                <AlertDescription>{migrationResult.message}</AlertDescription>
              </Alert>
            )}

            {migrationResult.data && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Migration Summary:</h4>
                <ul className="text-sm space-y-1">
                  <li>• {migrationResult.data.ticketsMigrated} tickets migrated</li>
                  <li>• {migrationResult.data.usersMigrated} users migrated</li>
                  <li>• {migrationResult.data.projectsMigrated} projects migrated</li>
                </ul>
              </div>
            )}

            {migrationResult.warnings && migrationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600">Warnings:</h4>
                <ul className="text-sm space-y-1">
                  {migrationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-yellow-600">• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}