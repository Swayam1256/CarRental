import express from 'express';
import "dotenv/config";
import cors from 'cors';
import connectDB from './config/db.js';
import userRouter from './routes/userRoutes.js';
import ownerRouter from './routes/ownerRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';

// Initialize Express App
const app = express();

// Connect to Database
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Add this route to detect when the server restarts
const serverStartedAt = new Date().toISOString();
app.get("/api/ping", (req, res) => {
  res.json({ serverStartedAt });
});

// Default routes
app.get('/', (req, res) => res.send("Server is running"));
app.use('/api/users', userRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/bookings', bookingRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚗 Server is running on port ${PORT}`));
