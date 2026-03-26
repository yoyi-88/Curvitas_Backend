import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const PORT = process.env.PORT || 3000

const app = express();
app.use(cors());
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
  const { origen, destino, intensidad } = req.body;

  let waypointInstruction = "";

  const prompt = `
    Eres un experto planificador de rutas en moto por España.
    Tu misión es diseñar la mejor ruta posible desde [${origen}] hasta [${destino}].
    El usuario ha elegido una intensidad de ruta tipo: [${intensidad}] (scenic = primar paisajes, curvy = primar carreteras de muchas curvas, adventure = primar carreteras secundarias y remotas).

    REGLAS ESTRICTAS PARA LA RUTA:
    1. EVITAR AUTOVÍAS: Diseña el trayecto alejándote de las autopistas y autovías principales (A- y AP-).
    2. PUNTOS DE PASO (WAYPOINTS): Selecciona entre 4 y 8 waypoints intermedios que fuercen al GPS a ir por las carreteras más divertidas.
    3. ORDEN LÓGICO (CRÍTICO): Los waypoints DEBEN estar ordenados secuencialmente desde el origen hasta el destino. Si se visitan en orden, la ruta debe tener sentido y no ir de un lado a otro.
    4. NOMENCLATURA GOOGLE MAPS: Usa nombres que el buscador de Google Maps entienda a la primera (ejemplo: "Pueblo, Provincia, España" o "Puerto de la Cruz Verde, Madrid, España").

    FORMATO DE SALIDA (JSON ESTRICTO):
    Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques de código markdown, con esta estructura exacta:
    {
      "explanation": "Breve descripción emocionante de 3 líneas sobre qué hace especial a esta ruta y qué tipo de curvas o paisajes se van a encontrar.",
      "waypoints": ["Punto 1", "Punto 2", "Punto 3", "Punto 4"]
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