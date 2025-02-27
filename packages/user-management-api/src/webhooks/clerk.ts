import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { createSupabaseAdmin } from '../utils/supabase.js';

// Define interface for Clerk webhook payload
interface ClerkWebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    username?: string;
    image_url?: string;
  };
}

// Webhook handler to sync Clerk users with Supabase
export function createClerkWebhookHandler() {
  return async (req: Request, res: Response) => {
    // Get the webhook signature from the header
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;
    
    // If there's no signature, return 400
    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({
        error: 'Missing svix headers',
      });
    }

    // Get the webhook secret from env variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing CLERK_WEBHOOK_SECRET');
      return res.status(500).json({
        error: 'Missing webhook secret',
      });
    }

    // Create a new Svix instance with the webhook secret
    const wh = new Webhook(webhookSecret);
    
    let payload;
    try {
      // Verify the webhook payload
      payload = wh.verify(
        JSON.stringify(req.body),
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }
      );
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({
        error: 'Invalid webhook signature',
      });
    }

    // Get the event type and data
    const { type, data } = payload as ClerkWebhookPayload;
    
    // Initialize Supabase Admin client
    const supabase = createSupabaseAdmin();
    
    try {
      // Handle different event types
      if (type === 'user.created') {
        // Create user in Supabase
        const { error } = await supabase
          .from('accounts')
          .insert({
            id: data.id,
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            username: data.username || data.email_addresses[0].email_address.split('@')[0],
            avatarUrl: data.image_url,
            user_id: data.id // Use Clerk user ID for RLS
          });
        
        if (error) {
          console.error('Error creating user in Supabase:', error);
        }
      } else if (type === 'user.updated') {
        // Update user in Supabase
        const { error } = await supabase
          .from('accounts')
          .update({
            email: data.email_addresses[0].email_address,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            username: data.username || data.email_addresses[0].email_address.split('@')[0],
            avatarUrl: data.image_url,
          })
          .eq('user_id', data.id);
        
        if (error) {
          console.error('Error updating user in Supabase:', error);
        }
      } else if (type === 'user.deleted') {
        // Delete user in Supabase
        const { error } = await supabase
          .from('accounts')
          .delete()
          .eq('user_id', data.id);
        
        if (error) {
          console.error('Error deleting user in Supabase:', error);
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({
        error: 'Error processing webhook',
      });
    }

    // Return 200 OK
    return res.status(200).json({
      success: true,
    });
  };
}