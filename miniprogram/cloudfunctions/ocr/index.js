const cloud = require('wx-server-sdk');
const https = require('https');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const API_HOST = 'ai-gateway.wepieoa.com';
const API_KEY = 'sk-0cdB3oKt-biuPjFqH9wvkA';
const MODEL = 'gemini-2.5-flash';

function callLLM(base64Image) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Return ONLY the extracted text, nothing else. If there are multiple lines, preserve the line breaks. Do not add any explanation or commentary.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 4096
    });

    const options = {
      hostname: API_HOST,
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.choices && json.choices[0] && json.choices[0].message) {
            resolve(json.choices[0].message.content);
          } else {
            reject(new Error(json.error?.message || 'Invalid response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

exports.main = async (event, context) => {
  const { fileID } = event;
  
  if (!fileID) {
    return { success: false, error: 'Missing fileID' };
  }

  try {
    const fileRes = await cloud.downloadFile({ fileID });
    const base64Image = fileRes.fileContent.toString('base64');
    
    const text = await callLLM(base64Image);
    
    return {
      success: true,
      text: text.trim()
    };
  } catch (e) {
    console.error('OCR error', e);
    return { success: false, error: e.message };
  }
};
