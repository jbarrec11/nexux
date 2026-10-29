export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // Pedimos a Chaturbate un límite alto para tener suficientes modelos
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

    // 1. Filtro por País Específico (si se selecciona uno)
    if (country) {
      resultados = resultados.filter(model => model.country === country);
    }

    // 2. Filtro por "Región" (Lógica mejorada para Asia)
    if (region) {
      if (region === 'asia') {
        // Definimos palabras clave que suelen indicar modelos asiáticas
        const palabrasClaveAsia = ['asian', 'pinay', 'thai', 'japanese', 'korean', 'vietnamese', 'indonesian', 'filipina', 'china', 'taiwan'];
        
        resultados = resultados.filter(model => {
          // Buscamos en el subject y en los tags
          const texto = (model.room_subject || '').toLowerCase() + ' ' + (model.tags || []).join(' ').toLowerCase();
          return palabrasClaveAsia.some(palabra => texto.includes(palabra));
        });
      } else {
        // Lógica para otras regiones (usando países, como teníamos antes)
        const paisesPorRegion = {
          'europa': ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE', 'UA'],
          'sudamerica': ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'],
          'norteamerica': ['US', 'CA', 'MX']
        };
        const paisesValidos = paisesPorRegion[region] || [];
        resultados = resultados.filter(model => paisesValidos.includes(model.country));
      }
    }

    // 3. Aplicar paginación
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
