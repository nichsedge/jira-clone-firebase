"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Code, Database, Shield, Zap } from 'lucide-react';

// Dynamically import Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const apiFeatures = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "RESTful API",
      description: "Complete REST API with CRUD operations for tickets, users, and projects",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Authentication",
      description: "Secure authentication with NextAuth.js and session management",
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Real-time Updates",
      description: "Server-Sent Events for live collaboration and instant updates",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: "Database Integration",
      description: "Prisma ORM with PostgreSQL for robust data persistence",
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    },
  ];

  const quickLinks = [
    {
      title: "Tickets API",
      description: "Manage tickets, statuses, and assignments",
      path: "#/default/get_api_tickets",
    },
    {
      title: "Users API",
      description: "User management and authentication",
      path: "#/default/get_api_users",
    },
    {
      title: "Projects API",
      description: "Project creation and organization",
      path: "#/default/get_api_projects",
    },
    {
      title: "Real-time Events",
      description: "Live updates and collaboration",
      path: "#/default/get_api_realtime",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8" />
            <h1 className="text-3xl font-bold">ProFlow API Documentation</h1>
            <Badge variant="outline" className="ml-auto">
              v1.0.0
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground mb-6">
            Comprehensive API documentation for the ProFlow project management system.
            Built with OpenAPI 3.0 specification and Swagger UI.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {apiFeatures.map((feature, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Links */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>
                Jump to frequently used API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      const element = document.querySelector(link.path);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">{link.title}</div>
                      <div className="text-sm text-muted-foreground">{link.description}</div>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                How to use the ProFlow API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="bg-muted p-2 rounded text-sm">
                  https://your-domain.com
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Most endpoints require authentication via session cookies.
                </p>
                <code className="bg-muted p-2 rounded text-sm block">
                  Authorization: Bearer {'<session_token>'}
                </code>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  All responses follow a consistent format:
                </p>
                <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "count": 10
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive API Documentation</CardTitle>
            <CardDescription>
              Explore and test the API endpoints below. Click on any endpoint to see details and try it out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoaded && (
              <SwaggerUI
                url="/api/docs"
                docExpansion="list"
                defaultModelsExpandDepth={-1}
                defaultModelExpandDepth={1}
                persistAuthorization={true}
                tryItOutEnabled={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}