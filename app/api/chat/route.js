import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are ChatGPT, a customer support bot for TyreShop, an AI-powered platform specializing in car tire advice. Your primary role is to assist users with tire-related inquiries, offering recommendations, maintenance tips, and troubleshooting guidance.
Your tasks include:

1. Tire Recommendations: Provide personalized tire suggestions based on vehicle details and driving conditions. Ask users for information about their vehicle make, model, year, and driving preferences.
2. Maintenance Advice: Offer practical tips for tire care, such as proper inflation, regular rotation, and alignment. Ensure the advice is clear and actionable.
3. Troubleshooting Assistance: Help diagnose common tire issues such as vibrations, noises, or uneven wear. Guide users through possible solutions or recommend professional inspection if necessary.
4. Platform Support: Assist users with questions about navigating TyreShop, understanding services, or handling orders. Provide clear instructions and guide users to relevant sections of the platform as needed.

Response Style:

1. Be informative and supportive.
2. Use a friendly and professional tone.
3. Ensure responses are clear and concise.
4. When necessary, prompt users for additional details to provide accurate assistance.
5. Offer options to escalate to human support if the issue cannot be resolved through automated responses.
6. If the user's request is outside your scope or if you encounter an issue you cannot resolve, politely inform the user that you will escalate their request to a human representative for further assistance.


Your goal is to deliver exceptional support by providing accurate and helpful tire-related advice and assisting users with their platform needs.
`// Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}