# TaskFlow - Project Management System

A modern, responsive project management application built with React, featuring comprehensive team collaboration, task management, and time tracking capabilities.

## 🚀 Features Overview

### 🔐 Authentication & User Management
- **User Registration & Login**: Secure authentication system with form validation
- **Role-Based Access Control**: Three user roles (Admin, Manager, Developer)
- **User Profile Management**: Edit profile details, upload profile pictures
- **Account Settings**: Password changes, email updates, role management (Admin only)

### 📊 Dashboard
- **Project Overview**: Real-time project statistics and progress tracking
- **Recent Activity**: Latest project updates and team activities
- **Quick Actions**: Fast access to common tasks and project creation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### 📁 Project Management
- **Project Creation**: Modal-based project creation with comprehensive details
- **Project Listing**: Grid view with search, filtering, and pagination
- **Project Details**: Detailed project information with team, tasks, and logs
- **Project Editing**: Inline project editing for admins and managers
- **Project Status Tracking**: Active, Completed, On Hold, Cancelled statuses
- **Project Reports**: Graphical analytics and project performance metrics

### 👥 Team Management
- **Team Member Management**: Add/remove team members from projects
- **Role Assignment**: Assign different roles to team members
- **Team Overview**: View all team members with their roles and status
- **User Search**: Search and filter team members by name or email
- **Team Statistics**: Count of admins, managers, and developers

### 📋 Task Management
- **Task Creation**: Create tasks with detailed descriptions and assignments
- **Task Assignment**: Assign tasks to specific team members
- **Task Status Tracking**: Todo, In Progress, Completed statuses
- **Task Editing**: Edit task details, status, priority, and assignments
- **Task Filtering**: Filter tasks by project, status, and assignee
- **Task Priority Levels**: High, Medium, Low priority settings

### ⏱️ Time Tracking & Logs
- **Time Logging**: Log time spent on tasks with descriptions
- **Log Management**: View, edit, and delete time logs
- **Log Filtering**: Filter logs by project, task, date range
- **Time Analytics**: Track total logged hours per project and task
- **Log Pagination**: Efficient browsing through large log datasets

### 📈 Analytics & Reporting
- **Project Reports**: Comprehensive project performance analytics
- **Time Tracking Reports**: Detailed time analysis and billing insights
- **Team Performance**: Track individual and team productivity
- **Progress Visualization**: Visual progress indicators and charts

### 🎨 User Interface Features
- **Dark Mode Support**: Complete dark/light theme switching
- **Responsive Design**: Mobile-first responsive layout
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: Keyboard navigation and screen reader support
- **Loading States**: Smooth loading indicators and transitions

### 🔧 Technical Features
- **State Management**: Zustand for efficient state management
- **Form Validation**: Comprehensive form validation with error handling
- **API Integration**: RESTful API integration with error handling
- **Real-time Updates**: Live data updates without page refresh
- **Modal System**: Consistent modal dialogs for forms and actions

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Resend API
- **WebSocket**: ws library

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (production)
- **Development Server**: Vite (frontend) & Nodemon (backend)
- **Database UI**: phpMyAdmin (development)
- **Cache UI**: Redis Commander (development)

## 📱 Pages & Components

### Core Pages
1. **Login/Signup**: Authentication pages with form validation
2. **Dashboard**: Main overview with project statistics
3. **Projects**: Project listing with search and filtering
4. **Project Details**: Comprehensive project information
5. **Tasks**: Task management and assignment
6. **Logs**: Time tracking and log management
7. **Team**: Team member management
8. **Settings**: User profile and account settings
9. **Analytics**: Project reports and analytics
10. **404 Page**: Custom error page with navigation

### Key Components
- **Navigation**: Responsive sidebar with role-based menu items
- **Modal Forms**: Reusable modal components for all forms
- **Data Tables**: Paginated tables with search and filtering
- **Status Badges**: Color-coded status indicators
- **Progress Indicators**: Visual progress tracking
- **Search Components**: Advanced search with filters
- **Notification System**: Toast notifications for user feedback

## 🔐 Role-Based Permissions

### Admin
- Full system access
- User management (create, edit, delete users)
- Project management (create, edit, delete projects)
- Team management across all projects
- System settings and configuration

### Manager
- Project management for assigned projects
- Team management for their projects
- Task creation and assignment
- Time log management
- Project reporting and analytics

### Developer
- View assigned projects and tasks
- Update task status and progress
- Log time on assigned tasks
- View project reports
- Update personal profile

## 🎯 Key Functionalities

### Project Management
- ✅ Create new projects with detailed information
- ✅ Edit project details and status
- ✅ Assign team members to projects
- ✅ Track project progress and completion
- ✅ View project analytics and reports

### Task Management
- ✅ Create tasks with descriptions and assignments
- ✅ Edit task details and status
- ✅ Assign tasks to team members
- ✅ Track task progress and completion
- ✅ Filter and search tasks

### Time Tracking
- ✅ Log time spent on tasks
- ✅ Add detailed descriptions to time logs
- ✅ Edit and delete time logs
- ✅ View time analytics and reports
- ✅ Track total logged hours

### Team Management
- ✅ Add/remove team members from projects
- ✅ Assign roles to team members
- ✅ View team member details and roles
- ✅ Search and filter team members
- ✅ Manage team permissions

### User Management
- ✅ User registration and authentication
- ✅ Profile management and updates
- ✅ Role-based access control
- ✅ Account settings and preferences
- ✅ Password and email updates

### Analytics & Reporting
- ✅ Project performance analytics
- ✅ Time tracking reports
- ✅ Team productivity metrics
- ✅ Progress visualization
- ✅ Export and share reports

## 🚀 Getting Started

### 🐳 Quick Start with Docker (Recommended)

The easiest way to run TaskFlow is using Docker:

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your configuration

# 3. Run quick start script
./quick-start.sh       # Mac/Linux
quick-start.bat        # Windows

# OR manually:
docker-compose up -d
docker-compose exec api npm run migrate

# Access at: http://localhost:3000
```

**📚 Docker Documentation:**
- **[DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)** - 5-minute setup guide (START HERE!)
- **[DOCKER_BEGINNER_TUTORIAL.md](DOCKER_BEGINNER_TUTORIAL.md)** - Never used Docker? Start here!
- **[DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)** - Complete reference
- **[DOCKER_CHEAT_SHEET.md](DOCKER_CHEAT_SHEET.md)** - Quick command reference
- **[DOCKER_COMPLETE_SUMMARY.md](DOCKER_COMPLETE_SUMMARY.md)** - Complete overview

### 💻 Manual Installation (Without Docker)

#### Prerequisites
- Node.js (v18 or higher)
- MySQL 8.0
- Redis 7
- npm or yarn package manager
- Modern web browser

#### Frontend Setup
```bash
cd Client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

#### Backend Setup
```bash
cd Server
npm install
npm run migrate
npm run seed  # Optional: sample data
npm run dev
# Backend runs on http://localhost:7007
```

### Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:7007
```

**Backend (Server/.env):**
```env
NODE_ENV=development
PORT=7007
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=project_management
JWT_SECRET=your-32-character-secret
JWT_REFRESH_SECRET=your-32-character-refresh-secret
RESEND_API_KEY=your_resend_api_key
```

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Adaptive layout with touch-friendly controls
- **Mobile**: Mobile-optimized interface with bottom navigation

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Mode**: Complete dark/light theme support
- **Smooth Animations**: Framer Motion animations
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time form validation
- **Accessibility**: WCAG compliant design

## 🔧 Development Features

- **Component Reusability**: Modular component architecture
- **State Management**: Efficient Zustand state management
- **API Integration**: RESTful API with error handling
- **Form Handling**: React Hook Form with validation
- **Routing**: React Router with protected routes
- **Styling**: Utility-first CSS with Tailwind

## 📊 Data Management

- **Real-time Updates**: Live data synchronization
- **Caching**: Efficient data caching strategies
- **Error Recovery**: Graceful error handling
- **Data Validation**: Comprehensive input validation
- **Optimistic Updates**: Immediate UI feedback

## 🔒 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive form validation
- **XSS Protection**: Secure data rendering
- **CSRF Protection**: Cross-site request forgery protection

## 📈 Performance Features

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Optimized image loading
- **Caching**: Efficient data and asset caching
- **Minification**: Optimized bundle sizes
- **Lazy Loading**: On-demand component loading

## 🧪 Testing & Quality

- **Component Testing**: Unit tests for components
- **Integration Testing**: API integration tests
- **Error Handling**: Comprehensive error scenarios
- **Performance Testing**: Load and stress testing
- **Accessibility Testing**: WCAG compliance testing

## 📝 Future Enhancements

- **Real-time Collaboration**: Live collaboration features
- **File Management**: Document and file sharing
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: Native mobile applications
- **API Documentation**: Comprehensive API docs
- **Internationalization**: Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**TaskFlow** - Streamlining project management with modern tools and beautiful design.






