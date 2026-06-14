# QuiénVaAGanar — Contexto para Testing

## App en producción
**URL:** https://quienvaaganar.vercel.app  
**Sala de prueba:** https://quienvaaganar.vercel.app/sala/[pide el id a Rocco]  
**Stack:** React + Vite (single file `/src/App.jsx`) · Supabase PostgreSQL · Vercel serverless functions

---

## Versión actual: v2

### Flujo principal
1. Usuario entra a la URL → ve landing con botón **"Entrar al Mundial 🏆"**
2. Escribe nombre + WhatsApp → se crea o une a una sala
3. Elige su equipo + pronóstico de campeón y subcampeón
4. Entra a la sala con 5 tabs: **Mundial · Noticias · Tips · Tabla · Pronósticos**

### Tabs de la sala
| Tab | Contenido |
|-----|-----------|
| ⚽ Mundial | Marcadores del día (hoy/ayer/mañana navegable), tabla de grupos |
| Noticias 📰 | Feed RSS en vivo: Marca Fútbol, ESPN, JuanFútbol. Con imágenes. Filtrable por fuente |
| Tips 🧠 | Cards estáticas: reglas básicas (offside, tarjetas, VAR, penal), formato Mundial 2026, tips de quiniela. Con imágenes ilustrativas |
| Tabla | Ranking de participantes por puntos. Card roja "Último lugar" con botón 😈 Mandar castigo (solo admin) |
| Pronósticos | Lista de pronósticos de cada participante |

---

## Arquitectura

### Frontend `/src/App.jsx` (~1700 líneas, todo en un archivo)
- **Componentes principales:** `Landing`, `CrearSala`, `Unirse`, `Sala`, `Calendario`, `Noticias`, `TipsInfo`, `TipCard`
- **Estado de sesión:** `localStorage` guarda `miId_[salaId]`, `quiniela_nombre`, `quiniela_wa`
- **Realtime:** Supabase subscription en tabla `participantes` para updates en vivo
- **Admin:** El primer participante en registrarse es admin (`participantes[0].id === miId`)

### APIs serverless `/api/`
| Archivo | Función |
|---------|---------|
| `noticias.js` | Proxy RSS: Marca, ESPN, JuanFútbol. Cache 5min. Extrae imágenes de `content:encoded` |
| `fotmob.js` | Proxy de FotMob API para marcadores y tabla de grupos |
| `wa-send.js` | Envía mensaje WA individual via Meta Cloud API |
| `wa-broadcast.js` | Cron diario (8am/8pm MX): resumen de partidos + noticias a todos los participantes |
| `wa-prematch.js` | Cron: mensajes pre-partido 60-90min antes de cada partido |
| `wa-castigo.js` | Manda castigo divertido al último lugar. Valida en Supabase que participante_id sea realmente el último |

### Variables de entorno (en Vercel, nunca en código)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
WA_PHONE_NUMBER_ID=1119400971261955
WA_ACCESS_TOKEN=[token de Meta, expira — renovar en Meta Business Suite]
WA_BUSINESS_ACCOUNT_ID=2646931842371237
CRON_SECRET=qvag_cron_2026
```

### Base de datos Supabase
**Tablas:**
- `salas`: id, nombre, modo (siempre "retos"), cuota, castigos, flash, stage
- `participantes`: id, sala_id, nombre, whatsapp, equipo, flag, pron_camp, pron_sub, points, penalties, eliminado, modo_jugador, apuesta

---

## WhatsApp (Meta Cloud API)
- **Phone Number ID:** 1119400971261955
- **WABA ID:** 2646931842371237
- **Cuenta:** MarketerIA by Rocco Garcini
- **Templates aprobados:** `resumen_diario` (Active), `prepartido_hype` (In review)
- **⚠️ El token WA expira.** Renovar en: Meta Business Suite → Configuración → Usuarios del sistema → token permanente

### Crons en Vercel (Hobby plan = máx 1/día)
```json
{ "path": "/api/wa-broadcast?secret=qvag_cron_2026&turno=manana", "schedule": "0 14 * * *" }  // 8am MX
{ "path": "/api/wa-prematch?secret=qvag_cron_2026", "schedule": "0 20 * * *" }               // 2pm MX
```

---

## Decisiones de diseño importantes

### Sin sistema de apuestas
Versión 1 removió todo el flujo de dinero/retos/híbrido. Ahora:
- Sala se crea con `modo: "retos"` (para satisfacer constraint de Supabase) pero nunca se muestra al usuario
- No hay cuotas, no hay modos, no hay flujo de apuesta
- La app es: calendario + noticias + tabla de posiciones entre amigos

### Timezone
Los partidos nocturnos (ej. 10pm MX = 4am UTC siguiente) se manejan pidiendo **dos días de la API** (`dateOff` y `dateOff+1`) y filtrando por `America/Mexico_City`. Función clave: `fechaMX()` y `targetDateMX()`.

### Imágenes en noticias
- **JuanFútbol:** imagen en `<content:encoded>` → extrae `<img src>` y quita sufijo WordPress (`-150x150`)
- **Marca Fútbol:** imagen en `<media:content url=...>`
- **ESPN:** sin imagen en RSS → usa fallback del logo de FIFA

---

## Cosas pendientes / conocidas

| Item | Estado |
|------|--------|
| WA token permanente | ⚠️ Pendiente — token temporal expira. Crear System User token en Meta Business |
| Template `prepartido_hype` | ⏳ En revisión en Meta |
| RLS en Supabase | ⚠️ Validar que las políticas de Row Level Security estén activas. Actualmente admin se valida solo en cliente |
| Salas existentes con nombre "Quiniela Mundial 2026" | 🔧 Cambiar manualmente en Supabase si se quiere mostrar "Mundial 2026" |
| Mediotiempo RSS | ❌ URL `/feed` devuelve 404. Reemplazado por Marca Fútbol |

---

## Deploy
```bash
# Siempre via CLI (auto-deploy de Vercel estaba roto)
npx vercel --prod --yes
```

---

## Pruebas manuales sugeridas

### Flujo de registro
- [ ] Crear sala nueva desde landing → verificar que nombre por defecto sea "Mundial 2026"
- [ ] Unirse a sala existente → elegir equipo (México debe aparecer) → confirmar WA
- [ ] Verificar que en la sala abra por defecto en tab "⚽ Mundial"

### Tab Mundial
- [ ] Navegar a Ayer → ver que aparezcan partidos nocturnos (ej. 10pm MX del día anterior)
- [ ] Navegar a Hoy → verificar que NO aparezcan resultados de ayer mezclados
- [ ] Navegar a Mañana → ver partidos próximos con hora
- [ ] Botón `‹` debe funcionar (ir a días anteriores sin límite)

### Tab Noticias
- [ ] Verificar que JuanFútbol y Marca carguen con imágenes
- [ ] Filtros por fuente funcionan
- [ ] ESPN carga con logo de fallback

### Tab Tips
- [ ] Cards con imagen ilustrativa se cargan (offside, tarjetas, VAR, penal, MetLife)
- [ ] Si imagen falla, se oculta (onError handler)

### Tabla
- [ ] Con 2+ participantes aparece card "💀 Último lugar" al fondo
- [ ] Botón "😈 Mandar castigo" solo visible para admin
- [ ] Al presionar manda WA al último → verificar en WhatsApp

### Badges del header
- [ ] Badge azul: muestra "⚽ ~X partidos por jugar" (número decrece con el tiempo)
- [ ] Badge verde: "🏆 Final en X días" (cuenta regresiva al 19 Jul 2026)

### Compartir
- [ ] Botón "Invitar" en sala → texto NO debe mencionar "apuesta" ni "castigo"
- [ ] Mensaje dice: "te invita a seguir el Mundial 2026 juntos 🏆"

### WA Broadcast (prueba manual)
```bash
# Broadcast matutino
curl "https://quienvaaganar.vercel.app/api/wa-broadcast?secret=qvag_cron_2026&turno=manana"

# Castigo al último lugar (reemplazar IDs reales)
curl "https://quienvaaganar.vercel.app/api/wa-castigo?sala_id=XXX&participante_id=YYY"

# Noticias
curl "https://quienvaaganar.vercel.app/api/noticias" | jq '.items[0]'
```

---

## Repo
```
/Users/roccogarcini/Documents/Proyectos/quienvaaganar/
├── src/App.jsx          # Todo el frontend
├── api/
│   ├── noticias.js
│   ├── fotmob.js
│   ├── wa-send.js
│   ├── wa-broadcast.js
│   ├── wa-prematch.js
│   └── wa-castigo.js
├── vercel.json          # Rewrites + crons
└── .env                 # Local only, NO commitear
```
