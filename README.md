# Gallery App

A full-stack image gallery web application built with Node.js (backend) and vanilla HTML/CSS/JS (frontend). This app allows user registration, login, image upload, and admin management with role-based access.

## 📁 Project Structure

```
manoja/
├── backend/
│   ├── app.js
│   ├── db/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── .env.example
├── frontend/
│   └── index.html
├── package.json
└── README.md
```

## 🚀 Features

- 🔐 JWT-based user authentication
- 🧑‍💻 Admin/user role-based access control
- 📷 Image upload & display
- 🗃 SQLite database
- 📦 Node.js + Express backend API

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ManojNR07/gallery-app.git
cd gallery-app
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Variables

Create a `.env` file inside `backend/` and add the following:

```env
PORT=3000
JWT_SECRET=your_jwt_secret
```

### 4. Initialize Database

```bash
node db/init.js
```

### 5. Run the Backend Server

```bash
node app.js
```

### 6. Serve the Frontend

Open a new terminal:

```bash
cd frontend
npx serve
```

Or open `index.html` manually in your browser.

## 🧪 Testing

- Open your browser at `http://localhost:5000` (or whatever `serve` outputs)
- Interact with the login, register, and gallery features

## 🌐 Deployment

- **Frontend**: Deploy to Netlify, Vercel, or GitHub Pages
- **Backend**: Deploy on Render, Railway, or Heroku

Ensure your frontend points to the live backend API.


## 👤 Author

- Manoj NR
