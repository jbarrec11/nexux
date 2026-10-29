export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country } = request.query;
  
  // Construimos la URL base (sin filtro de país, porque la API no lo soporta directamente)
  let apiUrl = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=500&client_ip=request_ip`;
  
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
    
    let data = await res.json();
    
    // FILTRO POR PAÍS EN EL SERVIDOR
    // Si se solicita un país, filtramos el array de resultados antes de enviarlo
    if (country && data.results) {
      data.results = data.results.filter(model => model.country === country);
      data.count = data.results.length;
    }
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
