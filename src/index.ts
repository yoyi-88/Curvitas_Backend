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
      * Si es "corta": Haz la ruta lo más directa posible hacia el destino, pero usando carreteras secundarias en lugar de autovías. Usa pocos waypoints (2-3).
      * Si es "media": Haz desvíos lógicos para buscar buenas curvas, pero manteniendo una dirección general hacia el destino. (4-5 waypoints).
      * Si es "larga": Crea una ruta épica de día completo. Da grandes rodeos deliberados para pasar por las mejores zonas moteras de la región. (6-8 waypoints).

    REGLAS ESTRICTAS:
    1. EVITAR AUTOVÍAS: Aléjate de las autopistas (A- y AP-).
    2. CARRETERAS Y COORDENADAS (CRÍTICO): Para fijar bien la ruta en el GPS, usa nombres exactos de poblaciones, puertos de montaña o carreteras (ej: "Puerto de Velefique", "Carretera A-397"). ADEMÁS, es obligatorio proporcionar las coordenadas GPS (latitud,longitud) aproximadas de ese punto para que el navegador no se confunda al trazar la ruta.
    3. ORDEN LÓGICO: Los waypoints DEBEN estar en perfecto orden geográfico para evitar que Google Maps haga rutas en zig-zag.

    FORMATO DE SALIDA (JSON ESTRICTO):
    Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques markdown (\`\`\`json), con esta estructura exacta:
    {
      "explanation": "Breve descripción de 3 líneas sobre la ruta, mencionando si es directa o si tiene grandes desvíos según lo que pidió el usuario.",
      "waypoints": [
        { "name": "Puerto de la Ragua, Granada", "coords": "37.1166,-3.0289" },
        { "name": "Carretera AL-3102, Velefique", "coords": "37.1895,-2.3941" }
      ]
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