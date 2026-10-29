export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region } = request.query;
  
  // Pedimos un límite alto para tener suficientes modelos de donde filtrar
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
    let resultados = data.results || [];

    // --- FILTRO POR PAÍS ESPECÍFICO (si se selecciona uno) ---
    if (country) {
      resultados = resultados.filter(model => model.country === country);
    }

    // --- FILTRO POR REGIÓN (agrupación manual de países) ---
    if (region) {
      // Definimos los países que pertenecen a cada región (puedes ampliar esta lista)
      const paisesPorRegion = {
        'europa': ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE'],
        'sudamerica': ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'],
        'norteamerica': ['US', 'CA', 'MX'],
        'asia': ['PH', 'TH', 'VN', 'ID', 'MY', 'JP', 'KR', 'IN', 'CN', 'TW', 'HK']
      };

      const paisesValidos = paisesPorRegion[region] || [];
      resultados = resultados.filter(model => paisesValidos.includes(model.country));
    }

    data.results = resultados;
    data.count = resultados.length;
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
