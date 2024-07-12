const OpenAI = require('openai');
const axios = require('axios');
const readline = require('readline');
const FormData = require('form-data');
const fs = require('fs'); 


const apiKey = ''; // add api key here

// chat variable
const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.upstage.ai/v1/solar'
});
let chatHistory = [];
const historySize = 10

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ocr variable
const filename = "./assets/maleB28pg.pdf";
const ocrUrl = "https://api.upstage.ai/v1/document-ai/ocr";

// chat example
async function performChat(pdfText) {
    while (true) {
        try {
            console.log();
            const userPrompt = await getUserInput("User: ");
            const userChat = { role: "user", content: userPrompt };

            const chatCompletion = await openai.chat.completions.create({
                model: 'solar-1-mini-chat',
                messages: [
                    ...chatHistory,
                    userChat,
                    { role: 'system', content: pdfText}
                ],
                stream: false
            });

            const solarResponse = chatCompletion.choices[0].message.content || '';
            
            console.log();
            console.log("SOLAR: " + solarResponse);

            chatHistory.push({
                role: "system",
                content: solarResponse
            });

            if (chatHistory.length > historySize) {
                chatHistory.shift();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

function getUserInput(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, answer => {
            resolve(answer);
        });
    });
}

// ocr example
async function performOCR() {
    try {
        const formData = new FormData();
        formData.append('document', fs.createReadStream(filename));

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
        };

        const response = await axios.post(ocrUrl, formData, { headers });
        // console.log(response.data);
        return response.data.text;
    } catch (error) {
        console.error('Error:', error.message);
    }
}

async function main() {
    const pdfText = await performOCR();
    performChat(pdfText);
}

main();
process.on('exit', () => {
    rl.close();
});