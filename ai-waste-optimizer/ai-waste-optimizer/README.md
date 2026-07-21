# AI Waste Optimizer

A comprehensive waste management optimization system that uses AI to optimize collection routes, monitor bin fill levels in real-time, and enable citizen feedback.

## 🚀 Technology Stack

### Frontend
- **React 19** - UI Framework
- **Leaflet** - Interactive maps
- **React Router** - Navigation

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database

### Deployment
- **Docker** - Containerization
- **Docker Compose** - Orchestration

## 📋 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, User)
- Secure password hashing

### Data Management
- Bin management (CRUD operations)
- Route optimization and scheduling
- Collection history tracking

### Dashboard & Visualization
- Real-time statistics
- Interactive map with bin locations
- Fill level monitoring
- Efficiency KPIs

### Feedback System
- Citizen feedback submission
- Image upload support
- Location tagging
- Status tracking

### Notifications
- Real-time notifications
- Bin full alerts
- Route status updates

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-waste-optimizer
```

2. Start the application:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Manual Installation

#### Backend
```bash
cd D:\COMP1682\ai-waste-optimizer
.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python backend\init_db.py
python -m uvicorn backend.main:app --reload --port 8000
```
If you are in the `backend` folder instead, run:
```bash
python -m uvicorn main:app --reload --port 8000
```
If port `8000` is already in use, start the backend on another port:
```bash
python -m uvicorn backend.main:app --reload --port 8001
```

#### Frontend
```bash
cd D:\COMP1682\ai-waste-optimizer\frontend
npm install
npm run dev
```
If the backend is running on a non-default port, set the frontend environment variable before starting Vite:
```bash
$env:VITE_API_URL = "http://localhost:8001"
npm run dev
```

## 📁 Project Structure

```
ai-waste-optimizer/
├── backend/
│   ├── auth/           # Authentication utilities
│   ├── models/         # Database models
│   ├── routers/        # API routes
│   ├── schemas/        # Pydantic schemas
│   ├── data/           # Sample data
│   ├── main.py         # Application entry
│   └── database.py     # Database config
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/     # Page components
│   │   ├── services/  # API services
│   │   └── layouts/   # Layout components
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Bins
- `GET /api/bins` - List all bins
- `POST /api/bins` - Create bin
- `PUT /api/bins/{id}` - Update bin
- `DELETE /api/bins/{id}` - Delete bin
- `GET /api/bins/stats/dashboard` - Dashboard stats
- `GET /api/bins/map/all` - Bins for map display

### Routes
- `GET /api/routes` - List all routes
- `POST /api/routes` - Create route
- `PUT /api/routes/{id}` - Update route
- `POST /api/routes/{id}/start` - Start route
- `POST /api/routes/{id}/complete` - Complete route

### Feedback
- `GET /api/feedback` - List feedbacks
- `POST /api/feedback` - Create feedback
- `PUT /api/feedback/{id}` - Update feedback

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## 🔐 Environment Variables

### Backend
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/waste_optimizer
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend
```
VITE_API_URL=http://localhost:8000
```
If your backend is running on a different port, change this value to match the backend host and port.

## 📝 User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access to all features |
| Manager | Manage bins, routes, feedback |
| User | Submit feedback, view status |

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache
```

## 📄 License

MIT License

## 👥 Authors

- AI Waste Optimizer Team
