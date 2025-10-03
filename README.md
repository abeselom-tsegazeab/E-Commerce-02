# 🛍️ MERN E-Commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/abeselom-tsegazeab/E-Commerce-01?style=social)](https://github.com/abeselom-tsegazeab/E-Commerce-01/stargazers)

A full-featured e-commerce platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring user authentication, product management, shopping cart, and Stripe payment integration.

![E-Commerce Dashboard](/frontend/public/screenshot-for-readme.png)

## ✨ Features

### 🚀 Project Setup
- Quick and easy project initialization
- Well-structured codebase
- Environment configuration
- Development and production setups

### 🗄️ Database & Caching
- MongoDB for flexible data storage
- Redis for high-performance caching
- Data persistence and reliability
- Optimized query performance

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control
- Secure password hashing
- CSRF protection
- Rate limiting

### 🔑 Token Management
- Access tokens for short-term authentication
- Refresh tokens for seamless sessions
- Token blacklisting
- Secure token storage

### 📝 User Management
- User registration and signup
- Email verification
- Password reset functionality
- Profile management

### 🛒 E-Commerce Core
- Product catalog
- Category management
- Advanced search and filtering
- Product reviews and ratings

### 🛍️ Shopping Experience
- Shopping cart functionality
- Wishlist management
- Order tracking
- Real-time inventory updates

### 💳 Payment Processing
- Secure checkout with Stripe
- Multiple payment methods
- Order history and receipts
- Payment verification

### 🏷️ Coupon System
- Discount codes
- Promotional offers
- Limited-time deals
- Usage tracking

### 👑 Admin Dashboard
- User management
- Product inventory control
- Order processing
- Sales analytics

### 📊 Analytics & Reporting
- Sales reports
- User activity tracking
- Revenue analysis
- Product performance metrics

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Intuitive navigation
- Mobile-friendly interface
- Loading states and feedback

### 🔒 Security Features
- Data encryption
- Input validation
- XSS protection
- Secure headers
- Regular security audits

## 🚀 Tech Stack

### Frontend
- React.js
- Redux Toolkit
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Redis (for caching)
- Stripe API

## 🛠️ Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Redis
- Stripe account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/abeselom-tsegazeab/E-Commerce-01.git
   cd mern-ecommerce
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd backend
   npm install
   
   # Install client dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   - Create a `.env` file in the `backend` directory:
     ```
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     JWT_EXPIRE=30d
     COOKIE_EXPIRE=30
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
     REDIS_URL=your_redis_url
     ```

4. **Run the application**
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # Start frontend (in a new terminal)
   cd frontend
   npm start
   ```

## 🌐 API Documentation

API documentation is available at `/api-docs` when the server is running.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Stripe](https://stripe.com/)
- [MongoDB](https://www.mongodb.com/)

## 📧 Contact

Your Name - [@your_twitter](https://twitter.com/your_handle) - your.email@example.com

Project Link: [https://github.com/abeselom-tsegazeab/E-Commerce-01](https://github.com/abeselom-tsegazeab/E-Commerce-01)
```
