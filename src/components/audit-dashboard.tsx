"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AuditAction,
  AuditEntityType,
  AuditLogEntry,
  getActionDescription,
  getEntityTypeDisplayName,
  auditLogger
} from "@/lib/audit";
import {
  History,
  Search,
  Filter,
  User,
  Ticket,
  Folder,
  Settings,
  Clock,
  Eye
} from "lucide-react";

interface AuditDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

export function AuditDashboard({ userId, isAdmin = false }: AuditDashboardProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    entityType: '',
    action: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const { toast } = useToast();

  // Load audit logs
  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);

      // In a real implementation, this would call an API
      // For now, we'll use the audit logger directly
      const query = {
        userId: isAdmin ? undefined : userId,
        entityType: filter.entityType === 'all' ? undefined : (filter.entityType as AuditEntityType | undefined),
        action: filter.action as AuditAction | undefined,
        dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
        dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
        limit: 100,
      };

      const auditLogs = await auditLogger.query(query);

      // Apply search filter
      let filteredLogs = auditLogs;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = auditLogs.filter(log =>
          log.userName?.toLowerCase().includes(searchLower) ||
          log.entityId?.toLowerCase().includes(searchLower) ||
          getActionDescription(log.action).toLowerCase().includes(searchLower)
        );
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load audit logs",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityIcon = (entityType: AuditEntityType) => {
    switch (entityType) {
      case AuditEntityType.TICKET:
        return <Ticket className="h-4 w-4" />;
      case AuditEntityType.PROJECT:
        return <Folder className="h-4 w-4" />;
      case AuditEntityType.USER:
        return <User className="h-4 w-4" />;
      case AuditEntityType.SYSTEM:
        return <Settings className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatChanges = (oldValues?: any, newValues?: any) => {
    if (!oldValues && !newValues) return null;

    const changes: string[] = [];

    if (newValues) {
      Object.keys(newValues).forEach(key => {
        if (oldValues && oldValues[key] !== newValues[key]) {
          changes.push(`${key}: ${oldValues[key]} → ${newValues[key]}`);
        } else if (!oldValues) {
          changes.push(`${key}: ${newValues[key]}`);
        }
      });
    }

    return changes.length > 0 ? changes.join(', ') : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Track all system activities and changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filter.entityType}
            onValueChange={(value) => setFilter(prev => ({ ...prev, entityType: value }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={AuditEntityType.TICKET}>Tickets</SelectItem>
              <SelectItem value={AuditEntityType.PROJECT}>Projects</SelectItem>
              <SelectItem value={AuditEntityType.USER}>Users</SelectItem>
              <SelectItem value={AuditEntityType.SYSTEM}>System</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
              placeholder="From date"
            />
            <Input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
              placeholder="To date"
            />
          </div>

          <Button onClick={loadLogs} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>

        {/* Audit Logs */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getEntityIcon(log.entityType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getActionColor(log.action)}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.timestamp!)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">
                        {log.userName || 'Unknown User'}
                      </span>
                      {' '}
                      {getActionDescription(log.action)}
                      {log.entityId && (
                        <span className="text-muted-foreground">
                          {' '}({getEntityTypeDisplayName(log.entityType)}: {log.entityId})
                        </span>
                      )}
                    </p>

                    {formatChanges(log.oldValues, log.newValues) && (
                      <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        Changes: {formatChanges(log.oldValues, log.newValues)}
                      </p>
                    )}

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Additional info: {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {logs.length > 0 && (
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} audit log{logs.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}