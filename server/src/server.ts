import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client requests
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving (Local storage driver)
const uploadsPath = path.resolve(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API master routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Tuition Management System API',
  });
});

// Central error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[TUITION SYSTEM SERVER] Running on port ${PORT}`);
  console.log(`[STORAGE] Driver: ${process.env.STORAGE_DRIVER || 'local'}`);
  console.log(`[DATABASE] URL: ${process.env.DATABASE_URL || 'file:./dev.db'}`);
});

export default app;
