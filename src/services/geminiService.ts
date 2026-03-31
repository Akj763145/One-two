import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface Recommendation {
  title: string;
  description: string;
  posterUrl: string;
}

export async function getRecommendations(history: string[], ratings: { title: string, rating: number }[], availableMovies: { title: string, posterUrl: string, description: string }[]): Promise<Recommendation[]> {
  const prompt = `Based on the following movie viewing history: ${history.join(', ')} and ratings: ${JSON.stringify(ratings)}, provide 5 personalized movie recommendations. 
  
  IMPORTANT: You MUST ONLY recommend movies from the following list of available movies: ${JSON.stringify(availableMovies.map(m => m.title))}.
  
  Return as a JSON array of objects with title, description, and posterUrl. The description and posterUrl MUST match the ones provided in the available movies list.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            posterUrl: { type: Type.STRING },
          },
          required: ["title", "description", "posterUrl"],
        },
      },
    },
  });
  
  const recommendations: Recommendation[] = JSON.parse(response.text || '[]');
  
  // Ensure the returned recommendations are actually from the available list
  return recommendations.filter(rec => availableMovies.some(m => m.title === rec.title));
}
