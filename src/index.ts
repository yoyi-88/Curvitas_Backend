import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const PORT = process.env.PORT || 3000

const app = express();
app.use(cors({
  origin: '*'
}));
app.use(express.json());

// 1. COMPROBACIÓN DE SEGURIDAD PARA LA API KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("🚨 ERROR CRÍTICO: No se ha encontrado la variable GEMINI_API_KEY en el archivo .env");
  // Si esto sale en la consola, el problema está en tu archivo .env
} else {
  console.log("✅ API Key cargada correctamente (Empieza por:", apiKey.substring(0, 5) + "...)");
}

// 2. CONFIGURACIÓN DEL MODELO (Usamos el nombre oficial estándar)
const genAI = new GoogleGenerativeAI(apiKey || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


app.post('/api/plan-route', async (req, res) => {
  const { origen, destino, intensidad, duracion } = req.body;

  let waypointInstruction = "";

  const prompt = `
    Actúa como un experto planificador de rutas en moto por España.
    Objetivo: Trazar una ruta desde [${origen}] hasta [${destino}].
    
    Preferencias:
    - Estilo: [${intensidad}] (curvy = muchas curvas, scenic = paisajes, adventure = secundarias).
    - Duración: [${duracion}] (corta = directa por secundarias, media = con desvíos, larga = gran ruta).

    REGLAS:
    1. PROHIBIDO AUTOVÍAS: Evita carreteras tipo A- o AP-.
    2. SOLO NOMBRES: Usa nombres de pueblos o puertos de montaña reales (Ej: "Grazalema, España"). NO uses coordenadas.
    3. FLUJO CONTINUO: Los puntos deben ir en orden lógico de origen a destino para evitar que la ruta vuelva atrás.

    FORMATO DE SALIDA (JSON ESTRICTO):
    {
      "explanation": "Breve descripción de la ruta.",
      "waypoints": ["Pueblo 1, España", "Pueblo 2, España"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    const routeData = JSON.parse(cleanJson);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: "Error generando ruta" });
  }
});

app.listen(PORT, () => console.log("🚀 Servidor con IA listo en el puerto 3000"));