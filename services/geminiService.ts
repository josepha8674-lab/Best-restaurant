import { GoogleGenAI, Type } from "@google/genai";
import { MenuItem } from "../types";

// Helper to safely get API Key
const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Fallback for browsers if polyfill wasn't hit or env missing
  return (window as any).process?.env?.API_KEY || '';
};

const apiKey = getApiKey();

// Only initialize if we have a key, otherwise we handle it in the functions
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Interface for AI Recipe Response
export interface AiRecipeResult {
    description: string;
    ingredients: {
        name: string;
        quantityForDish: number;
        unit: string;
        marketPricePerUnit: number;
    }[];
}

export const generateRecipe = async (dishName: string): Promise<AiRecipeResult | null> => {
    if (!ai) {
        console.warn("API Key missing");
        alert("กรุณาตั้งค่า API Key เพื่อใช้งานฟีเจอร์ AI");
        return null;
    }

    try {
        const prompt = `
            Create a recipe for the Thai dish or general dish named: "${dishName}".
            
            1. Provide a short, appetizing description in Thai.
            2. List the main ingredients needed.
            3. For each ingredient, estimate the quantity needed for ONE serving of this dish.
            4. Estimate the market price per unit for that ingredient in Thai Baht (e.g. if using Pork, price for 1 kg).
            5. Use standard units like 'kg', 'g', 'ml', 'l', 'pcs'. Convert small amounts like tablespoons to grams or ml if possible.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: "Thai description of the dish" },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: "Name of ingredient in Thai" },
                                    quantityForDish: { type: Type.NUMBER, description: "Quantity used in this recipe" },
                                    unit: { type: Type.STRING, description: "Unit of measurement (kg, g, ml, pcs)" },
                                    marketPricePerUnit: { type: Type.NUMBER, description: "Estimated market price per 1 unit in THB" }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AiRecipeResult;
        }
        return null;

    } catch (error) {
        console.error("Gemini Recipe Error:", error);
        return null;
    }
}

export const generateMenuDescription = async (dishName: string, ingredients: string[]): Promise<string> => {
  if (!ai) return "กรุณาใส่ API Key เพื่อใช้งานฟีเจอร์ AI";

  try {
    const prompt = `
      คุณเป็นเชฟระดับมิชลินและนักการตลาดมืออาชีพ
      ช่วยเขียนคำบรรยายเมนูอาหารสั้นๆ (ไม่เกิน 2 บรรทัด) ให้น่าทาน ดึงดูดลูกค้า
      ชื่อเมนู: ${dishName}
      วัตถุดิบหลัก: ${ingredients.join(', ')}
      ภาษา: ไทย
      น้ำเสียง: พรีเมียมและเชิญชวน
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "ไม่สามารถสร้างคำบรรยายได้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
  }
};

export const analyzeProfitability = async (menuItem: MenuItem): Promise<string> => {
   if (!ai) return "กรุณาใส่ API Key เพื่อใช้งานฟีเจอร์ AI";

   const margin = ((menuItem.price - menuItem.totalCost) / menuItem.price) * 100;

   try {
    const prompt = `
      วิเคราะห์ความคุ้มค่าและตั้งราคาของเมนูอาหารนี้:
      ชื่อ: ${menuItem.name}
      ราคาขาย: ${menuItem.price} บาท
      ต้นทุนวัตถุดิบ: ${menuItem.totalCost.toFixed(2)} บาท
      กำไรขั้นต้น (Margin): ${margin.toFixed(2)}%

      ช่วยวิเคราะห์ว่า:
      1. ราคาเหมาะสมหรือไม่ (เทียบกับต้นทุนอาหารทั่วไปที่ควรอยู่ที่ 30-35%)
      2. ข้อแนะนำสั้นๆ 1 ข้อเพื่อเพิ่มกำไร
      ตอบสั้นๆ กระชับ เป็นภาษาไทย
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "ไม่สามารถวิเคราะห์ได้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อ AI";
  }
}