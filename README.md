# MetricsMind - SaaS Analytics Dashboard

A comprehensive SaaS metrics dashboard built with MERN stack, Docker, and AI-powered insights using LangChain.js.

## 🚀 Features

- **Real-time Metrics**: Track MRR, ARR, Churn Rate, LTV, CAC
- **AI-Powered Insights**: Get business recommendations using OpenAI GPT-4
- **Interactive Charts**: Beautiful data visualizations with Recharts
- **Modern UI**: Built with React, TailwindCSS, and ShadCN UI
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes
- **PDF Reports**: Generate and download comprehensive reports
- **Docker Support**: Fully containerized with Docker Compose
- **Authentication**: Secure JWT-based authentication
- **CRUD Operations**: Manage customers, plans, and payments

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express Server │    │  AI Insights    │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌─────────────────┐
         │              │    MongoDB      │
         │              │   (Port 27017)  │
         │              └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Nginx Proxy   │
│    (Port 80)    │
└─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **ShadCN UI** for components
- **Framer Motion** for animations
- **Recharts** for data visualization
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Puppeteer** for PDF generation
- **Express Validator** for validation
- **Helmet** for security
- **CORS** for cross-origin requests

### AI Service
- **LangChain.js** for AI integration
- **OpenAI GPT-4** for insights generation
- **Express** microservice architecture

### DevOps
- **Docker** and **Docker Compose**
- **Nginx** reverse proxy
- **Multi-container** orchestration

## 🚀 Quick Start

> 📚 **Deployment Guides:**
> - [Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md) - Fast commands and checklists
> - [Step-by-Step Local](./STEP_BY_STEP_DEPLOYMENT.md) - Local Docker deployment
> - [Cloud Deployment](./CLOUD_DEPLOYMENT_GUIDE.md) - Vercel, Railway, AWS, etc.
> - [Complete Guide](./DEPLOYMENT_GUIDE.md) - Full documentation

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- OpenAI API key

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MetricsMind
```

### 2. Environment Setup

```bash
# Copy environment variables
cp env.example .env

# Edit .env file with your configuration
nano .env
```

Required environment variables:
```env
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=supersecretjwtkey123
MONGO_URI=mongodb://mongo:27017/saasmetrics
INSIGHTS_URL=http://insights:8000
API_URL=http://localhost:5000
NODE_ENV=development
```

### 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **AI Insights**: http://localhost:8000
- **MongoDB**: localhost:27017

## 🏃‍♂️ Local Development

### Backend Development

```bash
cd server
npm install
npm run dev
```

### Frontend Development

```bash
cd client
npm install
npm run dev
```

### AI Insights Service

```bash
cd insights
npm install
npm run dev
```

## 📊 Dashboard Features

### KPI Cards
- **MRR**: Monthly Recurring Revenue with growth percentage
- **ARR**: Annual Recurring Revenue calculation
- **Churn Rate**: Customer churn percentage
- **LTV**: Customer Lifetime Value
- **CAC**: Customer Acquisition Cost

### Charts & Visualizations
- **MRR Trend**: Line chart showing revenue growth over time
- **Churn Rate**: Bar chart displaying churn patterns
- **Customer Growth**: Area chart with total, active, and churned customers
- **AI Insights**: Real-time business recommendations

### Data Management
- **Customers**: Add, edit, delete customer records
- **Plans**: Manage pricing plans and features
- **Payments**: Track payment history and status
- **Reports**: Generate PDF reports with metrics

## 🤖 AI Insights

The AI insights service uses LangChain.js and OpenAI GPT-4 to provide:

- **Revenue Analysis**: Growth patterns and recommendations
- **Churn Insights**: Customer retention strategies
- **Unit Economics**: LTV/CAC ratio analysis
- **Strategic Recommendations**: Actionable business advice

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Plans
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan
- `PUT /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Metrics
- `GET /api/metrics` - Get all metrics
- `GET /api/metrics/mrr` - Get MRR data
- `GET /api/metrics/churn` - Get churn data
- `GET /api/metrics/ltv` - Get LTV data
- `GET /api/metrics/cac` - Get CAC data

### Reports
- `GET /api/reports/pdf` - Generate PDF report
- `GET /api/reports/summary` - Get report summary

### AI Insights
- `POST /api/insights/ai` - Generate AI insights
- `GET /api/insights/health` - Check service health

## 🐳 Docker Services

### Client Service
- **Image**: Custom React build
- **Port**: 3000
- **Dependencies**: Backend service

### Backend Service
- **Image**: Custom Node.js build
- **Port**: 5000
- **Dependencies**: MongoDB, AI Insights

### AI Insights Service
- **Image**: Custom Node.js build
- **Port**: 8000
- **Dependencies**: OpenAI API

### MongoDB Service
- **Image**: mongo:7.0
- **Port**: 27017
- **Volumes**: Persistent data storage

### Nginx Service
- **Image**: nginx:alpine
- **Port**: 80
- **Role**: Reverse proxy

## 📈 Metrics Calculation

### Monthly Recurring Revenue (MRR)
```
MRR = Sum of all active subscription revenues
```

### Annual Recurring Revenue (ARR)
```
ARR = MRR × 12
```

### Churn Rate
```
Churn Rate = (Churned Customers / Total Customers) × 100
```

### Customer Lifetime Value (LTV)
```
LTV = Average Revenue Per User / Monthly Churn Rate
```

### Customer Acquisition Cost (CAC)
```
CAC = Total Acquisition Costs / Number of New Customers
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting
- Helmet security headers
- Environment variable protection

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Roadmap

- [ ] Real-time notifications
- [ ] Slack integration
- [ ] Email reports
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Data export features
- [ ] Custom dashboards
- [ ] Team collaboration

---

Built with ❤️ using React, Node.js, MongoDB, and AI
