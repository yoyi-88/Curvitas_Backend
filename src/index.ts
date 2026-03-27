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
    Eres un experto planificador de rutas en moto por España.
    Diseña la mejor ruta desde [${origen}] hasta [${destino}].
    
    PREFERENCIAS DEL USUARIO:
    - Estilo: [${intensidad}] (scenic = paisajes, curvy = muchas curvas, adventure = secundarias remotas).
    - Duración/Desvío: [${duracion}] 
      * Si es "corta": Haz la ruta lo más directa posible hacia el destino por secundarias (2-3 waypoints).
      * Si es "media": Haz desvíos lógicos para buscar curvas, avanzando siempre hacia el destino (4-5 waypoints).
      * Si es "larga": Ruta épica con grandes rodeos circulares (6-8 waypoints).

    REGLAS ESTRICTAS Y CRÍTICAS:
    1. EVITAR AUTOVÍAS: Aléjate de las autopistas (A- y AP-).
    2. NOMBRES DE PUNTOS: Usa nombres de poblaciones o puertos de montaña reales (ej: "Grazalema, Cádiz, España" o "Puerto de las Palomas, España"). NO envíes coordenadas, solo el nombre del lugar.
    3. ORDEN SECUENCIAL: Los waypoints DEBEN estar en perfecto orden geográfico.
    4. FLUJO CONTINUO (ANTI-YOYÓ): Elige solo lugares de paso. Prohibido elegir carreteras sin salida que obliguen a dar la vuelta.

    FORMATO DE SALIDA (JSON ESTRICTO):
    Devuelve ÚNICAMENTE un objeto JSON válido, con esta estructura exacta:
    {
      "explanation": "Breve descripción de 3 líneas sobre la ruta.",
      "waypoints": ["Nombre del sitio 1, Provincia", "Nombre del sitio 2, Provincia"]
    }
  `;

  try {
    console.log("⏳ Enviando prompt a la IA...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json|```/g, "").trim();
    const routeData = JSON.parse(cleanJson);

    console.log(`✅ IA ha generado la ruta con éxito:`, routeData);
    res.json(routeData);

  } catch (error) {
    console.error("❌ Error con la IA:", error);
    res.status(500).json({ error: "No pudimos generar la ruta" });
  }
});

app.listen(PORT, () => console.log("🚀 Servidor con IA listo en el puerto 3000"));