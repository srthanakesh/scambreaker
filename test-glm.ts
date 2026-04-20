import * as dotenv from 'dotenv';
dotenv.config();

async function testGLM() {
  const apiKey = process.env.GLM_API_KEY;
  console.log("Using API Key:", apiKey?.substring(0, 5) + "...");
  
  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "glm-4-flash", // Using flash for cheaper/faster test
        messages: [
          { role: "user", content: "Hello, this is a test. Respond with 'API Working'." }
        ],
      }),
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (data.choices && data.choices[0].message.content) {
      console.log("GLM Result:", data.choices[0].message.content);
    } else {
      console.log("Unexpected response structure.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testGLM();
