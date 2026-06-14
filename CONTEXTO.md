# Contexto del proyecto — quienvaaganar

## Stack
- React + Vite · archivo único `/src/App.jsx` (~1450 líneas)
- Supabase (PostgreSQL + RLS + Realtime)
- Vercel serverless `/api/fotmob.js` → proxy ESPN API
- Deploy: `https://quienvaaganar.vercel.app`
- Repo: `github.com/roccogarcini/quienvaaganar`

## Supabase — tablas principales
| Tabla | Campos clave |
|-------|-------------|
| `salas` | id, nombre, modo (dinero/retos/hibrido), cuota, castigos[], flash[], stage |
| `participantes` | id, sala_id, nombre, whatsapp, equipo, flag, modo_jugador, apuesta, points, penalties, eliminado, pron_camp, pron_sub |

## localStorage keys
| Key | Uso |
|-----|-----|
| `quiniela_nombre` | Nombre del usuario |
| `quiniela_wa` | WhatsApp del usuario |
| `quiniela_lastSala` | Última sala visitada |
| `miId_[salaId]` | ID de participante en la sala |

## Flujo de pantallas
1. `/` → `CrearSala` — paso 0 "Entra al juego" (nombre + WA)
   - Si WA ya existe en Supabase → redirige a su sala
   - Si no → paso 1 Modo de juego → configuración → crear
2. `/sala/[id]` → si no tiene `miId` → `Unirse`; si tiene → `Sala`

## Componentes principales (todos en App.jsx)
- `PreviewModal` — previews en la landing
- `CrearSala` — landing + registro + crear sala
- `Unirse` — formulario de ingreso + tarjeta pronóstico (canvas)
- `Sala` — dashboard con tabs
- `Calendario` — tab ⚽ Mundial (inner tabs: Resumen / Tabla / Partidos)
- `Footer` — MarketerIA CTA + disclaimer legal

## Tabs de la Sala
`Tabla | Apuestas | Castigos | Pronósticos | Cuentas | ⚽ Mundial | Tips - Noticias 🧠`

## Tabs de Calendario (dentro de ⚽ Mundial)
`Resumen | Tabla | Partidos`

## API `/api/fotmob.js`
- `?endpoint=scoreboard&dates=YYYYMMDD` — partidos del día
- `?endpoint=standings` — tabla de grupos
- `?endpoint=schedule&dates=YYYYMMDD-YYYYMMDD` — rango de fechas

## Estilos — constantes globales
```js
const C = { bg:"#0a0e1a", card:"#111827", border:"#1f2937", text:"#f9fafb",
            muted:"#6b7280", green:"#10b981", red:"#ef4444", gold:"#fbbf24", blue:"#3b82f6" };
const inp = { width:"100%", background:C.card, border:`1px solid ${C.border}`,
              borderRadius:8, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:"inherit" };
const Btn = (extra={}) => ({ cursor:"pointer", fontFamily:"inherit", fontSize:13,
              borderRadius:8, border:`0.5px solid ${C.border}`, background:C.card,
              color:C.text, padding:"8px 14px", ...extra });
```

## WA normalization (patrón clave)
```js
const normaliza = v => (v||"").replace(/\D/g,"").slice(-10);
```
Usado para comparar WA sin importar formato (+52, espacios, guiones).

## Auto-login
En `App` useEffect: carga participantes → busca coincidencia por WA normalizado → setMiId automático.

## Estado actual — bugs conocidos / resueltos
- ✅ Compartir Mundial crasheaba (`Input()` undefined → reemplazado con `inp`)
- ✅ Cuentas en modo híbrido mostraba "sin dinero" → condición corregida
- ✅ Outlook calendario removido (solo Apple + Google)
- ✅ Disclaimer legal en footer
- ✅ Tab "Tips - Noticias 🧠"

## Footer (líneas ~1420)
- MarketerIA · Desarrollado por Rocco Garcini
- Disclaimer legal
- CTA WhatsApp: `wa.me/524431406867`

## Próximas ideas pendientes (no implementadas)
- Noticias en vivo en el tab Tips - Noticias
- Notificaciones push cuando hay gol en vivo
- Página de perfil por usuario
