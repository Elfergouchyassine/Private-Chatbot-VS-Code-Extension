const axios = require('axios');
require('dotenv').config();

async function testLlamaAPI() {
  console.log('🧪 Testing Llama API Connection');
  console.log('================================\n');
  
  const apiUrl = process.env.LLM_API_URL;
  const apiToken = process.env.LLM_API_TOKEN;
  
  console.log(`API URL: ${apiUrl}`);
  console.log(`Token: ${apiToken ? apiToken.substring(0, 10) + '...' : 'Not set'}\n`);
  
  const payload = {
    model: "meta-llama/Meta-Llama-3-8B",
    prompt: "Hello, this is a test. Please respond with 'API connection successful'.",
    max_tokens: 20
  };
  
  try {
    console.log('📤 Sending request...');
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testLlamaAPI();
