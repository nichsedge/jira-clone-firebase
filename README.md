# ProFlow - Production-Ready Jira Clone

A full-stack Jira clone built with Next.js, featuring a complete backend with database persistence, authentication, and production-ready deployment configurations.

## 🚀 Features

### Core Functionality
- **Ticket Management** - Create, update, delete, and organize tickets
- **Kanban Board** - Drag & drop interface for ticket status management
- **User Management** - User profiles and role-based access
- **Project Organization** - Group tickets by projects
- **Email Integration** - Sync tickets from email and send notifications

### Backend & Infrastructure
- **Database Layer** - Prisma ORM with PostgreSQL/SQLite support
- **REST API** - Full CRUD operations with validation
- **Authentication** - NextAuth.js with session management
- **Data Migration** - Seamless transition from localStorage
- **Rate Limiting** - API protection and security
- **Error Handling** - Comprehensive error management
- **Audit Logging** - Track all changes and activities

## 🛠️ Quick Start

### Local Development

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd jira-clone-firebase
   npm install
   ```

2. **Set up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Initialize Database**
   ```bash
   npm run db:push      # Create database tables
   npm run db:seed      # Populate with sample data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:9002](http://localhost:9002) to see your app!

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   docker-compose up -d
   ```

2. **Manual Docker Build**
   ```bash
   docker build -t proflow .
   docker run -p 3000:3000 proflow
   ```

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── settings/       # Settings pages
│   │   └── page.tsx        # Main dashboard
│   ├── components/         # React components
│   ├── lib/               # Utilities and configurations
│   │   ├── api-middleware.ts  # API middleware
│   │   ├── auth.ts           # Authentication
│   │   ├── prisma.ts         # Database client
│   │   └── production-config.ts # Production config
│   └── services/           # API client functions
├── prisma/               # Database schema and migrations
├── public/              # Static assets
└── docker-compose.yml   # Docker configuration
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Management

```bash
# View database
npm run db:studio

# Reset database
npm run db:push
npm run db:seed

# Generate migrations (for PostgreSQL)
npx prisma migrate dev
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel dashboard

2. **Database Setup**
   - Use a PostgreSQL database (Neon, Supabase, etc.)
   - Update `DATABASE_URL` in Vercel

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or manual Docker commands
docker build -t proflow .
docker run -p 3000:3000 proflow
```

### Netlify

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment Variables**
   - Add all variables from `.env.local`

## 🔒 Security Features

- **Rate Limiting** - API protection against abuse
- **Input Validation** - Zod schema validation
- **Security Headers** - CORS, CSP, security headers
- **Authentication** - Session-based auth with NextAuth.js
- **Database Security** - Prepared statements and connection pooling

## 📊 Data Migration

The app includes a built-in migration system:

1. **Automatic Detection** - Detects existing localStorage data
2. **One-Click Migration** - Migrate data via Settings → Data Migration
3. **Data Preservation** - All existing data is preserved
4. **Clean Up** - Automatically clears localStorage after migration

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📚 API Documentation

API endpoints are documented with OpenAPI/Swagger. Visit `/api/docs` when running in development.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter issues:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your environment details and error messages

---

**Built with ❤️ using Next.js, Prisma, and modern web technologies.**
