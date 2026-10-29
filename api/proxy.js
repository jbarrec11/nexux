export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // Función auxiliar para hacer la petición a Chaturbate
  const fetchChaturbate = async (extraParams = '') => {
    let url = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=500&client_ip=request_ip`;
    if (gender && ['f', 'm', 'c', 't'].includes(gender)) url += `&gender=${gender}`;
    url += extraParams;
    
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch (e) {
      return [];
    }
  };

  try {
    let resultados = [];

    // Si se pide una región, hacemos varias peticiones a los países principales de esa región
    if (region) {
      const paisesPorRegion = {
        'europa': ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE', 'UA'],
        'sudamerica': ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'],
        'norteamerica': ['US', 'CA', 'MX'],
        'asia': ['PH', 'TH', 'VN', 'ID', 'MY', 'JP', 'KR', 'IN', 'CN', 'TW', 'HK']
      };

      const paises = paisesPorRegion[region] || [];
      
      // Hacemos una petición por cada país (o los más importantes) y juntamos los resultados
      // Para no saturar, pedimos los primeros 5 países de la lista
      const promesas = paises.slice(0, 5).map(pais => fetchChaturbate(`&country=${pais}`));
      const resultadosPorPais = await Promise.all(promesas);
      
      // Aplanamos el array de arrays en un solo array
      resultados = resultadosPorPais.flat();
      
      // Eliminamos duplicados (por si una modelo aparece en varias listas)
      const unicos = new Map();
      resultados.forEach(m => unicos.set(m.username, m));
      resultados = Array.from(unicos.values());

    } else {
      // Si no se pide región, hacemos la petición normal
      let extraParams = '';
      if (country) extraParams += `&country=${country}`;
      resultados = await fetchChaturbate(extraParams);
    }

    // Aplicar paginación
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
