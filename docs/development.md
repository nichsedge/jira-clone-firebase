# Development Documentation

This document provides instructions for setting up, running, and contributing to the Jira Clone project built with Next.js, Prisma, and Firebase.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- Node.js (version 18 or higher)
- npm or yarn (npm is used by default)
- PostgreSQL (or another database compatible with Prisma)
- Docker (optional, for database setup)
- Git

### Additional Tools

- [Prisma CLI](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-postgresql): For database management.
- [Next.js](https://nextjs.org/docs): The framework used for the application.

## Project Structure

The project is structured as a Next.js application with the following key directories:

- `src/app/`: Next.js app router pages and API routes.
- `src/components/`: Reusable UI components using shadcn/ui.
- `src/lib/`: Utility functions, authentication, and types.
- `prisma/`: Prisma schema and migrations for database.
- `docs/`: Documentation files.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/jira-clone-firebase.git
   cd jira-clone-firebase
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory based on `.env.example` (if available) or add the following variables:

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/jiraclone?schema=public"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   EMAIL_SERVER_HOST="your-email-server"
   EMAIL_SERVER_USER="your-email-user"
   EMAIL_SERVER_PASSWORD="your-email-password"
   FIREBASE_PROJECT_ID="your-firebase-project-id"  # If using Firebase for auth/storage
   # Add other Firebase config vars as needed
   ```

   - Generate `NEXTAUTH_SECRET` using `openssl rand -base64 32`.
   - Update `DATABASE_URL` with your PostgreSQL connection string.

4. **Database Setup**
   - Install Prisma CLI if not already: `npm install prisma --save-dev`
   - Run migrations: `npx prisma migrate dev`
   - Seed the database (optional): `npx prisma db seed`

5. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

## Running the Application

1. **Development Server**
   Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm start`: Starts the production server.
- `npm run lint`: Runs ESLint to check code quality.
- `prisma studio`: Opens Prisma Studio to view/edit database.

## Authentication

The project uses NextAuth.js for authentication. Configure providers in `src/lib/auth.ts` or the API route.

- Register/Login: Available at `/register` and `/login`.
- Session Provider: Wrapped in `src/components/session-provider.tsx`.

## Features

- **Projects**: Create and manage projects (`/projects`).
- **Tickets**: Board view with columns for statuses (`/tickets`).
- **Users**: User management (`/users`).
- **Settings**: Email and general settings (`/settings`).

## Database

Uses Prisma ORM with PostgreSQL. Schema defined in `prisma/schema.prisma`.

- Run `npx prisma db push` for schema changes during development.
- Migrations are in `prisma/migrations/`.

## Styling

- Tailwind CSS: Configured in `tailwind.config.ts`.
- shadcn/ui components in `src/components/ui/`.

## Deployment

### Vercel (Recommended for Next.js)

1. Push to GitHub.
2. Connect repository in Vercel dashboard.
3. Add environment variables in Vercel.
4. Deploy automatically on push to main.

### Netlify

Configured via `netlify.toml`. Set environment variables in Netlify dashboard.

### Docker

Use `docker-compose.yml` for local setup with database:

```bash
docker-compose up -d
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-feature`.
3. Commit changes: `git commit -m 'Add new feature'`.
4. Push to branch: `git push origin feature/new-feature`.
5. Open a Pull Request.

### Code Style

- Use TypeScript.
- Follow ESLint rules.
- Write tests for new features.

## Troubleshooting

- **Database Connection Error**: Check `DATABASE_URL` and ensure PostgreSQL is running.
- **Auth Issues**: Verify `NEXTAUTH_SECRET` and provider configurations.
- **Build Errors**: Run `npm run build` locally to debug.
- **Prisma Errors**: Run `npx prisma validate` to check schema.

## Support

For questions, open an issue on GitHub or refer to `docs/blueprint.md` for architecture details.

Last updated: September 2025