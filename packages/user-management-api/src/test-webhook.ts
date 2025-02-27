import dotenv from 'dotenv';
import axios from 'axios';
import { Webhook } from 'svix';
import crypto from 'crypto';

// Define interface for webhook headers
interface WebhookHeaders {
  'svix-id': string;
  'svix-timestamp': string;
  'svix-signature': string;
  [key: string]: string;
}

// Load environment variables
dotenv.config();

async function main() {
  // Get the base URL from command line or use default
  const baseUrl = process.argv[2] || 'https://499c57ccc7cf.ngrok.app';
  console.log(`Using base URL: ${baseUrl}`);
  
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    process.exit(1);
  }

  console.log('Using webhook secret:', webhookSecret.substring(0, 5) + '...');

  // Create a webhook instance
  const wh = new Webhook(webhookSecret);

  // Example user.created payload
  const payload = {
    type: 'user.created',
    data: {
      id: 'test_user_id_123',
      email_addresses: [
        {
          email_address: 'test@example.com'
        }
      ],
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      image_url: 'https://example.com/avatar.jpg'
    }
  };

  // Generate the signature
  const payloadString = JSON.stringify(payload);
  console.log('Payload:', payloadString);
  
  // Create manual headers for Svix
  const msgId = crypto.randomUUID();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Create HMAC signature using the webhook secret
  const toSign = `${msgId}.${timestamp}.${payloadString}`;
  const signature = crypto.createHmac('sha256', webhookSecret)
    .update(toSign)
    .digest('hex');
  
  // Create headers object
  const headers: WebhookHeaders = {
    'svix-id': msgId,
    'svix-timestamp': timestamp,
    'svix-signature': `v1,${signature}`
  };

  console.log('Request headers:', {
    'svix-id': headers['svix-id'],
    'svix-timestamp': headers['svix-timestamp'],
    'svix-signature': headers['svix-signature']
  });

  try {
    // First, let's test if the server is reachable
    try {
      const healthCheck = await axios.get(`${baseUrl}/health`);
      console.log('Health check response:', healthCheck.status, healthCheck.data);
    } catch (error: any) {
      console.error('Health check failed:', error.message);
    }

    // Send the webhook to your local server
    const response = await axios.post(`${baseUrl}/api/webhooks/clerk`, 
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'svix-id': headers['svix-id'],
          'svix-timestamp': headers['svix-timestamp'],
          'svix-signature': headers['svix-signature']
        }
      }
    );

    console.log('Webhook test response:', response.data);
  } catch (error: any) {
    console.error('Error sending test webhook:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

main().catch(console.error); 