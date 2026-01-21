import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.API_KEY directly and instantiate within functions as per guidelines
export const generateCampaignStrategy = async (cause: string, goal: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest a creative fundraising strategy for a school cause: "${cause}" with a goal of BHD ${goal}. Include 3 specific event ideas, a catchy slogan, and 3 social media caption ideas.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          slogan: { type: Type.STRING },
          events: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          socialCaptions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["slogan", "events", "socialCaptions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateThankYouMessage = async (donorName: string, amount: number, causeName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a warm, appreciative thank you message to a student/parent donor named ${donorName} who just donated BHD ${amount} to the school's "${causeName}" fundraiser. Make it encouraging and community-focused. Keep it under 100 words.`,
  });

  return response.text;
};