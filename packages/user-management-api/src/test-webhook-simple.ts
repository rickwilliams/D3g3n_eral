import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Set up logging
const LOG_DIR = path.join(process.cwd(), '..', '..', 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
const TIMESTAMP = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
const LOG_FILE = path.join(LOG_DIR, `webhook_test_${TIMESTAMP}.log`);

// Logger function that writes to console and file
function log(message: string) {
  console.log(message);
  fs.appendFileSync(LOG_FILE, message + '\n');
}

async function main() {
  log(`Starting webhook test at ${new Date().toISOString()}`);
  log(`Saving logs to: ${LOG_FILE}`);

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

  log('Sending test webhook payload:');
  log(JSON.stringify(payload, null, 2));

  // Get ngrok URL from args or automatic detection
  let ngrokUrl = '';
  
  // Check if URL was provided as argument
  if (process.argv.length > 2) {
    ngrokUrl = process.argv[2];
    log(`Using provided ngrok URL: ${ngrokUrl}`);
  } else {
    // Try to automatically detect ngrok URL
    try {
      const tunnelsResponse = await axios.get('http://localhost:4040/api/tunnels');
      const tunnels = tunnelsResponse.data.tunnels || [];
      const httpsTunnel = tunnels.find((t: any) => t.proto === 'https');
      
      if (httpsTunnel) {
        ngrokUrl = httpsTunnel.public_url;
        log(`Automatically detected ngrok URL: ${ngrokUrl}`);
      } else {
        log('No HTTPS ngrok tunnel found. Available tunnels:');
        log(JSON.stringify(tunnels, null, 2));
      }
    } catch (error: any) {
      log(`Failed to detect ngrok URL: ${error.message}`);
      log('Is ngrok running? Check if the ngrok web interface is available at http://localhost:4040');
      
      // Log entire error for debugging
      fs.appendFileSync(LOG_FILE, `\nDetailed error:\n${JSON.stringify(error, null, 2)}\n`);
    }
  }

  if (!ngrokUrl) {
    log('No ngrok URL available. Please provide one as an argument:');
    log('pnpm test-webhook-simple https://your-ngrok-url.ngrok-free.app');
    return process.exit(1);
  }

  // Diagnostic checks before sending the webhook
  log('\n=== Running diagnostic checks ===');

  // Check if local server is running
  try {
    log('Checking local API server...');
    const localResponse = await axios.get('http://localhost:4000/health');
    log(`✓ Local server is running: ${localResponse.status} ${JSON.stringify(localResponse.data)}`);
  } catch (error: any) {
    log(`✗ Local server check failed: ${error.message}`);
    log('  → Is the User Management API running on port 4000?');
    
    // Log detailed error to file
    fs.appendFileSync(LOG_FILE, `\nDetailed local server error:\n${JSON.stringify(error, null, 2)}\n`);
  }

  // Check ngrok health endpoint
  try {
    log(`\nChecking ngrok tunnel at ${ngrokUrl}/health...`);
    const healthResponse = await axios.get(`${ngrokUrl}/health`);
    log(`✓ Ngrok tunnel is working: ${healthResponse.status} ${JSON.stringify(healthResponse.data)}`);
  } catch (error: any) {
    log(`✗ Ngrok tunnel check failed: ${error.message}`);
    if (error.response) {
      log(`  Response data: ${JSON.stringify(error.response.data)}`);
      log(`  Response status: ${error.response.status}`);
    }
    log('  → Check if the ngrok tunnel is active and properly connected');
    
    // Log detailed error to file
    fs.appendFileSync(LOG_FILE, `\nDetailed ngrok error:\n${JSON.stringify(error, null, 2)}\n`);
  }

  log('\n=== Sending webhook request ===');

  // Try to send the webhook through the test endpoint
  try {
    // Send the webhook to the test endpoint
    const testEndpoint = `${ngrokUrl}/api/test/webhooks/clerk`;
    log(`Sending webhook to: ${testEndpoint}`);
    
    const response = await axios.post(
      testEndpoint, 
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    log(`\n✓ Test webhook response: ${response.status} ${JSON.stringify(response.data)}`);
  } catch (error: any) {
    log(`\n✗ Error sending test webhook: ${error.message}`);
    if (error.response) {
      // For HTML responses, save to file but show a shorter version on console
      if (typeof error.response.data === 'string' && error.response.data.startsWith('<!DOCTYPE html>')) {
        log(`  Response status: ${error.response.status}`);
        log('  Response contains HTML content (saved to log file)');
        fs.appendFileSync(LOG_FILE, '\nHTML Response:\n' + error.response.data + '\n');
      } else {
        log(`  Response data: ${JSON.stringify(error.response.data)}`);
        log(`  Response status: ${error.response.status}`);
      }
    } else if (error.code === 'ECONNREFUSED') {
      log('  → Connection refused. Make sure the User Management API server is running.');
    } else if (error.code === 'ENOTFOUND') {
      log('  → Host not found. Check if the ngrok URL is correct.');
    }
    
    // Log detailed error to file
    fs.appendFileSync(LOG_FILE, `\nDetailed webhook error:\n${JSON.stringify(error, null, 2)}\n`);
  }

  log(`\nTest completed at ${new Date().toISOString()}`);
  log(`Full logs saved to: ${LOG_FILE}`);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  fs.appendFileSync(LOG_FILE, `\nUNHANDLED ERROR:\n${JSON.stringify(error, null, 2)}\n`);
}); 