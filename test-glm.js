const fs = require('fs');
const path = require('path');

function getApiKey() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GLM_API_KEY=["']?([^"'\s]+)["']?/);
  return match ? match[1] : null;
}

async function testGLM() {
  const apiKey = getApiKey();
  console.log("Using API Key:", apiKey ? apiKey.substring(0, 5) + "..." : "NOT FOUND");
  
  if (!apiKey) return;

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "glm-5-turbo",
        messages: [
          { role: "user", content: "Hello, this is a test. Respond with 'API Working' and nothing else." }
        ],
      }),
    });

    const data = await response.json();
    console.log("Response Status:", response.status);

    if (data.choices && data.choices[0].message.content) {
      console.log("GLM Result:", data.choices[0].message.content);
    } else {
      console.log("Response Body:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testGLM();
