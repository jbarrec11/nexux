export default async function handler(request, response) {
  const { wm = 'q7k3D', gender, country, region, limit = 30, offset = 0 } = request.query;
  
  // Función interna para pedir datos a Chaturbate
  const fetchChaturbate = async (params = '') => {
    let url = `https://chaturbate.com/api/public/affiliates/onlinerooms/?format=json&wm=${wm}&limit=500&client_ip=request_ip`;
    if (gender && ['f', 'm', 'c', 't'].includes(gender)) url += `&gender=${gender}`;
    url += params;
    
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

    if (region === 'asia') {
      // ESTRATEGIA PARA ASIA: Buscar por palabras clave Y por países clave
      const palabrasClaveAsia = ['asian', 'pinay', 'thai', 'japanese', 'korean', 'vietnamese', 'indonesian', 'filipina', 'china', 'taiwan'];
      const paisesAsia = ['PH', 'TH', 'VN', 'ID', 'MY', 'JP', 'KR', 'IN', 'CN', 'TW'];

      // 1. Buscamos primero por palabras clave en todos los resultados
      const todosLosResultados = await fetchChaturbate();
      let filtradosPorTag = todosLosResultados.filter(model => {
        const texto = (model.room_subject || '').toLowerCase() + ' ' + (model.tags || []).join(' ').toLowerCase();
        return palabrasClaveAsia.some(palabra => texto.includes(palabra));
      });

      // 2. Si hay pocos resultados (menos de 30), complementamos buscando por países asiáticos
      if (filtradosPorTag.length < 30) {
        const promesasPaises = paisesAsia.slice(0, 5).map(pais => fetchChaturbate(`&country=${pais}`));
        const resultadosPaises = await Promise.all(promesasPaises);
        const aplanados = resultadosPaises.flat();
        
        // Unimos y eliminamos duplicados
        const mapaUnicos = new Map();
        [...filtradosPorTag, ...aplanados].forEach(m => mapaUnicos.set(m.username, m));
        resultados = Array.from(mapaUnicos.values());
      } else {
        resultados = filtradosPorTag;
      }

    } else if (region) {
      // ESTRATEGIA PARA OTRAS REGIONES (Europa, Sudamérica, etc.)
      const paisesPorRegion = {
        'europa': ['ES', 'FR', 'DE', 'IT', 'GB', 'RU', 'NL', 'PT', 'SE', 'NO', 'DK', 'FI', 'PL', 'RO', 'GR', 'CZ', 'HU', 'IE', 'AT', 'CH', 'BE', 'UA'],
        'sudamerica': ['CO', 'AR', 'CL', 'BR', 'VE', 'PE', 'EC', 'BO', 'PY', 'UY'],
        'norteamerica': ['US', 'CA', 'MX']
      };
      const paisesValidos = paisesPorRegion[region] || [];
      
      // Hacemos varias peticiones para juntar más modelos de esa región
      const promesas = paisesValidos.slice(0, 5).map(pais => fetchChaturbate(`&country=${pais}`));
      const resultadosPorPais = await Promise.all(promesas);
      const aplanados = resultadosPorPais.flat();
      
      const mapaUnicos = new Map();
      aplanados.forEach(m => mapaUnicos.set(m.username, m));
      resultados = Array.from(mapaUnicos.values());

    } else if (country) {
      // ESTRATEGIA PARA UN PAÍS ESPECÍFICO
      resultados = await fetchChaturbate(`&country=${country}`);
    } else {
      // SIN FILTROS (Todos)
      resultados = await fetchChaturbate();
    }

    // Ordenar por número de usuarios (opcional, pero recomendado)
    resultados.sort((a, b) => parseInt(b.num_users) - parseInt(a.num_users));

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
