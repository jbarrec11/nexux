export default async function handler(request, response) {
  const { wm = 'q7k3D', gender } = request.query;
  
  // Construimos la URL base
  let apiUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=100&client_ip=request_ip`;
  
  // Si el frontend envía un género válido, lo añadimos
  if (gender && ['f', 'm', 'c', 't'].includes(gender)) {
    apiUrl += `&gender=${gender}`;
  }

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`Chaturbate status: ${res.status}`);
    
    const data = await res.json();
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
