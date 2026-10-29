export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // Pedimos a Chaturbate solo lo que necesitamos (o un poco más para filtrar)
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

    // Filtros
    if (country) {
      resultados = resultados.filter(model => model.country === country);
    }

    if (region) {
      const paisesPorRegion = {
        'europa': ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE', 'UA'],
        'sudamerica': ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'],
        'norteamerica': ['US', 'CA', 'MX'],
        'asia': ['PH', 'TH', 'VN', 'ID', 'MY', 'JP', 'KR', 'IN', 'CN', 'TW', 'HK']
      };
      const paisesValidos = paisesPorRegion[region] || [];
      resultados = resultados.filter(model => paisesValidos.includes(model.country));
    }

    // Aplicar paginación (offset y limit) DESPUÉS de filtrar
    const totalResultados = resultados.length;
    const resultadosPaginados = resultados.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate'); 
    
    response.status(200).json({
      results: resultadosPaginados,
      count: totalResultados,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalResultados
    });
  } catch (error) {
    response.status(500).json({ error: 'Fallo el proxy', details: error.message });
  }
}
