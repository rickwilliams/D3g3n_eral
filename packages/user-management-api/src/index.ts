import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClerkWebhookHandler } from './webhooks/clerk.js';
import characterRoutes from './routes/characters.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.USER_API_PORT || '4000', 10);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-management-api' });
});

// Register routes
app.use('/api/characters', characterRoutes);

// Clerk webhook handler
app.post('/api/webhooks/clerk', createClerkWebhookHandler());

// Test webhook endpoint (development only)
// This endpoint bypasses the signature verification for testing
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/test/webhooks/clerk', (req, res) => {
    console.log('Received test webhook payload:', req.body);
    // Process the webhook payload without signature verification
    const { type, data } = req.body;
    
    // Log the event type and data
    console.log(`Processing test ${type} event for user ${data?.id}`);
    
    // Return success response
    res.status(200).json({ success: true, message: 'Test webhook received' });
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`User Management API running on port ${PORT}`);
});