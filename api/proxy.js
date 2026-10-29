export default async function handler(request, response) {
  const { wm = 'q7k3D' } = request.query;
  const apiUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=100&client_ip=request_ip`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Chaturbate status: ${res.status}`);
    
    const data = await res.json();
    
    // Permitir que tu web lea los datos
    response.setHeader('Access-Control-Allow-Origin', '*');
    // Guardar en caché por 5 minutos para no saturar la API
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
