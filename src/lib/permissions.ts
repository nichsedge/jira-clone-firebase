// Role-based access control system
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

export enum Permission {
  // Ticket permissions
  CREATE_TICKET = 'create_ticket',
  READ_TICKET = 'read_ticket',
  UPDATE_TICKET = 'update_ticket',
  DELETE_TICKET = 'delete_ticket',
  ASSIGN_TICKET = 'assign_ticket',

  // Project permissions
  CREATE_PROJECT = 'create_project',
  READ_PROJECT = 'read_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',

  // User permissions
  MANAGE_USERS = 'manage_users',
  VIEW_USERS = 'view_users',

  // System permissions
  MANAGE_SYSTEM = 'manage_system',
  VIEW_ANALYTICS = 'view_analytics',
  MIGRATE_DATA = 'migrate_data',
}

// Role-based permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // All ticket permissions
    Permission.CREATE_TICKET,
    Permission.READ_TICKET,
    Permission.UPDATE_TICKET,
    Permission.DELETE_TICKET,
    Permission.ASSIGN_TICKET,

    // All project permissions
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,

    // All user permissions
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,

    // All system permissions
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_ANALYTICS,
    Permission.MIGRATE_DATA,
  ],

  [UserRole.USER]: [
    // Standard ticket permissions
    Permission.CREATE_TICKET,
    Permission.READ_TICKET,
    Permission.UPDATE_TICKET,
    Permission.ASSIGN_TICKET,

    // Limited project permissions
    Permission.READ_PROJECT,

    // Limited user permissions
    Permission.VIEW_USERS,
  ],

  [UserRole.GUEST]: [
    // Read-only permissions
    Permission.READ_TICKET,
    Permission.READ_PROJECT,
  ],
};

// Permission checking functions
export class PermissionChecker {
  private userRole: UserRole;
  private userId?: string;

  constructor(userRole: UserRole, userId?: string) {
    this.userRole = userRole;
    this.userId = userId;
  }

  // Check if user has a specific permission
  hasPermission(permission: Permission): boolean {
    const userPermissions = rolePermissions[this.userRole] || [];
    return userPermissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // Check if user can perform action on a resource
  canPerformAction(
    action: Permission,
    resourceOwnerId?: string,
    resourceType?: 'ticket' | 'project' | 'user'
  ): boolean {
    // Check basic permission
    if (!this.hasPermission(action)) {
      return false;
    }

    // For resource-specific checks, allow if user owns the resource
    // or if they're an admin
    if (resourceOwnerId && this.userId) {
      if (resourceOwnerId === this.userId || this.userRole === UserRole.ADMIN) {
        return true;
      }

      // For non-admin users, they can only modify their own resources
      // except for assignments and general updates
      if (action === Permission.UPDATE_TICKET || action === Permission.DELETE_TICKET) {
        return resourceOwnerId === this.userId;
      }
    }

    return true;
  }

  // Get all permissions for the current role
  getPermissions(): Permission[] {
    return rolePermissions[this.userRole] || [];
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.userRole === UserRole.ADMIN;
  }

  // Check if user is at least a certain role
  isAtLeast(role: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.GUEST]: 0,
      [UserRole.USER]: 1,
      [UserRole.ADMIN]: 2,
    };

    return roleHierarchy[this.userRole] >= roleHierarchy[role];
  }
}

// Helper functions
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

export function getAllPermissions(): Permission[] {
  return Object.values(Permission);
}

export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    [Permission.CREATE_TICKET]: 'Create new tickets',
    [Permission.READ_TICKET]: 'View tickets',
    [Permission.UPDATE_TICKET]: 'Edit tickets',
    [Permission.DELETE_TICKET]: 'Delete tickets',
    [Permission.ASSIGN_TICKET]: 'Assign tickets to users',

    [Permission.CREATE_PROJECT]: 'Create new projects',
    [Permission.READ_PROJECT]: 'View projects',
    [Permission.UPDATE_PROJECT]: 'Edit projects',
    [Permission.DELETE_PROJECT]: 'Delete projects',

    [Permission.MANAGE_USERS]: 'Manage user accounts',
    [Permission.VIEW_USERS]: 'View user list',

    [Permission.MANAGE_SYSTEM]: 'System administration',
    [Permission.VIEW_ANALYTICS]: 'View analytics',
    [Permission.MIGRATE_DATA]: 'Migrate system data',
  };

  return descriptions[permission] || permission;
}

// Default role for new users
export const DEFAULT_USER_ROLE = UserRole.USER;

// Middleware for API routes
export function withPermissionCheck(
  handler: Function,
  requiredPermission: Permission | Permission[],
  options: {
    allowOwner?: boolean;
    resourceOwnerId?: string;
  } = {}
) {
  return async (request: Request, context: any) => {
    // Get user from session (this would be implemented based on your auth system)
    const user = await getCurrentUser(request);

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
        },
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const checker = new PermissionChecker(user.role, user.id);

    // Check permissions
    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    const hasPermission = options.allowOwner && options.resourceOwnerId
      ? checker.canPerformAction(permissions[0], options.resourceOwnerId)
      : checker.hasAnyPermission(permissions);

    if (!hasPermission) {
      return new Response(JSON.stringify({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissions,
        },
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user and permissions to context
    const enhancedContext = {
      ...context,
      user,
      permissions: checker,
    };

    return handler(request, enhancedContext);
  };
}

// Mock function - replace with your actual user fetching logic
async function getCurrentUser(request: Request) {
  // This would be replaced with your actual authentication logic
  // For now, return a mock user
  return {
    id: 'user-123',
    role: UserRole.USER,
  };
}