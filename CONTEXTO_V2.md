# QuiénVaAGanar — Contexto v2.3

## App en producción
**URL:** https://quienvaaganar.vercel.app  
**Sala global única:** `mundial2026` (hardcodeada en `SALA_GLOBAL_ID`)  
**Stack:** React + Vite (single file `/src/App.jsx`) · Supabase PostgreSQL · Vercel serverless functions  
**Reset de sesión (testing):** `quienvaaganar.vercel.app?test` — limpia todo el localStorage

---

## Admin
- Admin determinado por número WhatsApp hardcodeado: **`4431406867`** (Rocco Garcini)
- `const esAdmin = yo?.whatsapp?.replace(/\D/g,"").endsWith("4431406867")`
- El admin ve la app **exactamente igual que cualquier jugador** — los controles de admin están colapsados en un botón discreto **⚙️ Admin ▼** en la pestaña Tabla

---

## Flujo completo de usuario nuevo

```
1. Onboarding (4 ecards deslizables) — vioIntro en localStorage
        ↓
2. Registro wizard — 3 pasos:
   Paso 1: Nombre + WhatsApp + Contraseña  ← PRIMERO
   Paso 2: Avatar (foto o emoji) — opcional
   Paso 3: Equipo + Pronóstico campeón → Entrar
        ↓
3. AvisoApuesta popup (una vez por miId)
   → "💰 Voy con todo — entro con $250"  → modo_jugador="dinero" (entra a la bolsa)
   → "🎲 Solo por diversión"             → modo_jugador="retos" (acceso completo, fuera de bolsa)
        ↓
4. Sala principal (5 tabs)
        ↓
   [A los 30s + primer cambio de tab]
5. Popup calendario (una sola vez)
```

### Usuario ya registrado
→ Onboarding se muestra (puede saltarlo)  
→ Auto-login por `miId_mundial2026` en localStorage  
→ Si no hay ID pero sí WA guardado → auto-login por WA  
→ Si escribe su WA en Paso 1 y ya existe → pide contraseña para entrar

### Botón "Salir" (header)
→ Limpia `miId_mundial2026`, `quiniela_wa`, `quiniela_nombre`, `vioIntro` → regresa al onboarding

---

## Tabs de la sala

| Tab | Contenido |
|-----|-----------|
| ⚽ Mundial | Marcadores del día (hoy/ayer/mañana con ‹ ›) + badge "Mi quiniela" en cada partido + tabla de grupos |
| Noticias 📰 | Feed RSS filtrado por keywords del Mundial. Con imágenes. Filtrable por fuente |
| Tips 🧠 | Cards con tips: offside, tarjetas, VAR, penal, formato Mundial 2026 |
| Tabla 🏆 | Ranking + Avatar + card "💀 Último lugar" + botón ⚙️ Admin (colapsable) |
| Quiniela 🎯 | Sistema completo de pronósticos de partidos |

### Header siempre visible
- Título: **Mundial 2026**
- Badge azul: `⚽ ~X partidos por jugar`
- Badge verde: `🏆 Final en X días`
- **Acumulado:** `$X,XXX MXN · X jugadores × $250` — barra morada siempre visible
- Botones: Invitar (WA) · Copiar link · Salir

---

## Sistema de Quiniela 🎯

### Puntos
| Resultado | Pts sin IA | Pts con IA |
|-----------|-----------|-----------|
| Gana (correcto) | 2pts | máximo 1pt |
| Empate (correcto) | 1pt | máximo 1pt |
| Falla | 0pts | 0pts |

### Bloqueo de partidos
- Se bloquean automáticamente cuando el partido comienza o ya terminó
- Si el usuario publicó su quiniela (`quiniela_publicada=true`) → todos los partidos bloqueados

### Filtro de partidos placeholder
- `isPlaceholder(name)` filtra equipos aún sin asignar: `RD32 W1`, `QF W1`, `SF L1`, etc.
- Regex: `/^(RD\d|QF|SF|W\d|\d[A-Z]|3RD|TBD)/i`

### Contenido de la pestaña Quiniela (orden)
1. Barra de progreso (X / total partidos pronosticados)
2. Info sobre tips de IA + **🤖 Pedir ayuda de IA (-1pt)** — siempre visible
3. **✨ Analizar mi quiniela con IA** — aparece con 5+ pronósticos, solo por diversión sin costo
4. Preguntas bonus activas
5. Preguntas bonus próximas
6. Lista de partidos por fase (con tip IA por partido)
7. **🔮 Proyección siguiente ronda** — clasifica grupos según predicciones del usuario
8. **🔒 Publicar mi quiniela** — bloquea edición permanentemente
9. Pronósticos de campeón de todos los jugadores

### Ayuda de IA (-1pt)
- **Por partido:** botón "💡 Pedir tip IA -1pt" en cada tarjeta de partido (solo si no se ha pedido antes)
- **Bulk (🤖 Pedir ayuda de IA):** llena todos los partidos sin pronóstico con IA. Si ya están todos llenos, pide revisión y muestra cuántos coinciden/difieren vs la IA
- Costo: -1pt de `pts_quiniela` inmediatamente al usar
- Si aciertas con tip IA → máximo 1pt (no 2pts)
- Partidos llenados con IA se marcan `usa_ia=true` en BD

### Análisis IA (sin costo)
- Botón "✨ Analizar mi quiniela con IA" — aparece al tener 5+ pronósticos
- Llama a `/api/analizar-quiniela` (claude-haiku, max 300 tokens)
- Análisis divertido en español mexicano con humor
- Etiqueta "Solo por diversión · no afecta tus puntos"

### Proyección siguiente ronda
- Componente `ProyeccionQuiniela` — calcula standings de grupos desde predicciones
- Aparece al fondo de la lista de partidos
- Muestra top 2 clasificados por grupo con puntos proyectados
- Extrae grupo de `ev.competitions[0].notes[0].headline` (ESPN API)

### Publicar quiniela
- Botón "🔒 Publicar mi quiniela" visible para TODOS (incluyendo admin)
- Guarda `quiniela_publicada=true` en `participantes`
- Una vez publicado: badge verde "🔒 Quiniela publicada", todos los partidos se bloquean

### Badge "Mi quiniela" en pestaña Mundial
- Aparece debajo de cada partido donde el usuario tiene pronóstico
- **Partido futuro:** fondo morado `Mi quiniela: 🏠 Netherlands`
- **Partido terminado y acertaste:** fondo verde
- **Partido terminado y fallaste:** fondo rojo

### AvisoApuesta (popup una vez)
- localStorage key: `avisoApuesta_{miId}`
- "💰 Voy con todo" → `modo_jugador="dinero"` → cuenta en la bolsa
- "🎲 Solo por diversión" → `modo_jugador="retos"` → fuera de bolsa, acceso total al juego
- Los de `modo_jugador="dinero"` aparecen en la bolsa acumulada

### localStorage de quiniela
```
prons_{salaId}_{miId}   → backup local de pronósticos (JSON)
tipsUsados_{miId}        → { matchId: true } — tips ya pedidos
avisoApuesta_{miId}      → "1" si ya respondió el popup
```

### Supabase (tablas de quiniela)
```sql
-- Pronósticos por partido
CREATE TABLE pronosticos_partidos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id uuid REFERENCES participantes(id) ON DELETE CASCADE,
  sala_id text NOT NULL,
  match_id text NOT NULL,
  prediccion text CHECK (prediccion IN ('local','empate','visitante')),
  resultado text, pts_obtenidos int,
  usa_ia boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(participante_id, match_id)
);

-- Preguntas bonus
CREATE TABLE preguntas_bonus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sala_id text NOT NULL,
  pregunta text NOT NULL,
  tipo text DEFAULT 'texto',  -- 'texto' | 'marcador'
  pts int DEFAULT 3,
  fecha_apertura timestamptz,
  fecha_cierre timestamptz,
  activa boolean DEFAULT true,
  respuesta_correcta text,
  created_at timestamptz DEFAULT now()
);

-- Respuestas bonus
CREATE TABLE respuestas_bonus (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  participante_id uuid REFERENCES participantes(id),
  pregunta_id uuid REFERENCES preguntas_bonus(id),
  respuesta jsonb,
  pts_obtenidos int,
  UNIQUE(participante_id, pregunta_id)
);
```

**Columnas extra en `participantes`:**
```
pts_quiniela       int DEFAULT 0   ← puntos del sistema de quiniela
quiniela_publicada bool DEFAULT false ← bloquea edición al publicar
```

### APIs de quiniela
| Archivo | Función |
|---------|---------|
| `analizar-quiniela.js` | POST — análisis divertido de tu quiniela con Claude Haiku |
| `recomendar-quiniela.js` | POST — recomendaciones IA para llenar partidos |
| `wa-quiniela.js` | GET `?secret=` — avisa por WA a quien no ha llenado quiniela |

### Panel Admin (colapsable ⚙️ Admin)
- Solo visible al expandir el botón admin en Tabla
- AdminBonusPanel: crear/activar preguntas bonus, asignar respuesta correcta, calcular puntos
- Botón WA: avisar a jugadores sin quiniela
- Botón WA: avisar a jugadores sin contraseña
- +1/-1 puntos manuales por jugador (solo cuando panel expandido)

---

## Onboarding (4 ecards antes del registro)

| Card | Título | Color |
|------|--------|-------|
| 1 | ¡El calendario más divertido del Mundial! | Morado → Azul |
| 2 | PASO 1 · Elige tu equipo | Rojo → Naranja |
| 3 | PASO 2 · Agrega el calendario | Azul → Verde |
| 4 | El acumulado crece con cada jugador | Morado → Rosa |

- Swipeable (touch izq/der) · Dots animados · "Saltar intro" desde card 1-3
- Se guarda en `localStorage("vioIntro")` — se muestra en reingreso (usuario puede saltarla)

---

## Registro (wizard 3 pasos)

### Paso 1 — Nombre + WhatsApp + Contraseña ← PRIMERO
- Campo **nombre** (requerido)
- Campo **WhatsApp** (opcional) — con auto-detección de cuenta existente
- Campo **🔒 Contraseña** (requerido) — con botón 👁️ mostrar/ocultar
- Si el WA ya existe → aparece card de login con el participante encontrado

#### Login con WA existente
```
Escribe WA → detecta cuenta existente → muestra:
  [Avatar] Nombre · Equipo
  "Este número ya está registrado. Escribe tu contraseña para entrar."
  [Campo contraseña] + [Entrar →] [No soy yo]
  Si contraseña incorrecta → ❌ "Contraseña incorrecta"
  Cuentas sin contraseña (antiguas) → entran directo
```

### Paso 2 — Avatar (opcional)
- Tab **📷 Foto** (default): botón grande → abre galería → preview circular 100px
- Tab **😀 Emoji**: grid de 30 emojis divertidos → preview inmediato
- "Saltar este paso →" si no quieren nada · botón ✕ para limpiar
- "← Atrás" regresa a Paso 1

### Paso 3 — Equipo + Pronóstico
- Resumen: avatar + nombre
- Selector de equipo (requerido)
- Campeón/Subcampeón (opcional) → tarjeta canvas para compartir
- "Entrar a la quiniela →" → va directo a la sala

### Dots de progreso
3 dots en la parte superior (●──, ●●─, ●●●)

### Al registrarse (insert en Supabase)
```js
{
  sala_id, nombre, whatsapp, equipo, flag,
  modo_jugador, apuesta, points: 0, penalties: 0, eliminado: false,
  pron_camp, pron_camp_flag, pron_sub, pron_sub_flag,
  avatar_url,    // URL pública Supabase Storage bucket "avatars"
  avatar_emoji,  // string emoji elegido
  password,      // contraseña en texto plano
}
```

---

## Sistema de contraseñas

### Al registrarse
- Campo obligatorio en Paso 1
- Se guarda en `participantes.password` (texto plano)

### Al volver a entrar
- Escribe WA → detecta cuenta → pide contraseña → valida contra `p.password`
- Cuentas antiguas sin contraseña → entran directo (sin bloquear)

### Prompt en-app para cuentas sin contraseña
- Aparece 2s después de entrar a la sala (solo si no tiene `password`)
- Sheet desde abajo: "🔒 Crea tu contraseña"
- Campo con 👁️ mostrar/ocultar → guarda en Supabase al tocar "Guardar →"
- "Ahora no" → guarda `skipPasswordPrompt_{miId}` en localStorage

### WA masivo a cuentas sin contraseña
- API: `GET /api/wa-password?secret=qvag_cron_2026`
- Botón admin en panel ⚙️ Admin (Tabla): `📲 Avisar a X por WhatsApp`

---

## Avatares

### Componente `Avatar({ p, size })`
Jerarquía de fallback:
1. `p.avatar_url` → foto subida (Supabase Storage)
2. `p.avatar_emoji` → círculo morado/azul con emoji
3. `p.flag` → bandera del equipo (default)

### Supabase Storage
- Bucket: `avatars` (público) · Path: `{timestamp}-{random}.{ext}`
- Políticas: insert abierto + select público

---

## Acumulado ($250 por jugador)
- Visible en **header** (barra morada siempre)
- Solo cuentan jugadores con `modo_jugador="dinero"` (eligieron "Voy con todo")
- `modo_jugador="retos"` → pueden jugar pero no están en la bolsa
- Fórmula: `jugsDinero.length × 250`

---

## Banner carrusel (InstallBanner)
- Aparece para **todos** (Android, iOS, cualquier navegador) salvo modo standalone
- 4 slides que rotan cada **15 segundos**
- localStorage: `vioInstallBanner`

---

## Arquitectura

### Frontend `/src/App.jsx` (~3600+ líneas)

**Flujo de componentes:**
```
Onboarding → Unirse (3 pasos) → AvisoApuesta → Sala
                                                  ↓ (30s + tab change)
                                              CalendarioPopup (1 vez)
                                                  ↓ (overlay fijo)
                                              InstallBanner (carrusel)
                                                  ↓ (2s, sin password)
                                              PasswordPrompt
                                                  ↓ (QuinielaPrompt 5s)
                                              QuinielaPrompt
```

**Componentes principales:**
- `Avatar` — foto/emoji/bandera con fallback jerárquico
- `Onboarding` — 4 ecards swipeables
- `Unirse` — wizard 3 pasos (nuevo orden: nombre→avatar→equipo)
- `AvisoApuesta` — popup "casa de apuestas vs quiniela entre amigos"
- `Sala` — pantalla principal con 5 tabs
- `QuinielaTab` — sistema completo de pronósticos
- `LlenarConIA` — botón bulk/revisión IA (-1pt)
- `AnalisisIA` — análisis divertido sin costo
- `ProyeccionQuiniela` — clasifica grupos según predicciones del usuario
- `BonusCard` — pregunta bonus individual
- `AdminBonusPanel` — CRUD de preguntas bonus + calcular puntos
- `Calendario` — marcadores con badge "Mi quiniela" por partido
- `CalendarioPopup` — modal de calendario (30s + tab change)
- `PasswordPrompt` — sheet para crear contraseña
- `QuinielaPrompt` — sheet para invitar a llenar quiniela (5s, 0 pronósticos)

**localStorage keys:**
```
miId_mundial2026             → ID del participante
quiniela_wa                  → WA guardado (auto-login)
quiniela_nombre              → Nombre guardado
vioIntro                     → "1" si ya vio onboarding
vioInstallBanner             → "1" si cerró banner o instaló
vioCalendarioPopup           → "1" si ya interactuó con popup calendario
skipPasswordPrompt_{miId}    → "1" si tocó "Ahora no" en PasswordPrompt
prons_{salaId}_{miId}        → backup local de pronósticos (JSON)
avisoApuesta_{miId}          → "1" si ya respondió el popup de apuesta
```

---

### APIs serverless `/api/`
| Archivo | Función |
|---------|---------|
| `noticias.js` | RSS proxy con filtro Mundial. Cache 5min |
| `fotmob.js` | Proxy ESPN API — marcadores y tabla de grupos |
| `calendar.ics.js` | Genera `.ics` filtrado por equipos |
| `wa-send.js` | Envío WA individual + templates via Meta Cloud API |
| `wa-bienvenida.js` | WA automático al registrarse |
| `wa-password.js` | WA masivo a participantes sin contraseña |
| `wa-quiniela.js` | WA a jugadores que no han llenado su quiniela |
| `wa-broadcast.js` | Cron diario: resumen de partidos + noticias |
| `wa-prematch.js` | Cron: mensajes hype antes de cada partido |
| `analizar-quiniela.js` | POST — análisis divertido con Claude Haiku |
| `recomendar-quiniela.js` | POST — recomendaciones IA para llenar partidos |

### Base de datos Supabase
**Proyecto:** `wvpleipsgidtbynkkmgi` — región us-east-1

**Columnas `participantes`:**
```
id, sala_id, nombre, whatsapp, equipo, flag,
pron_camp, pron_sub, pron_camp_flag, pron_sub_flag,
points, penalties, eliminado, modo_jugador, apuesta,
avatar_url, avatar_emoji, password,
pts_quiniela int DEFAULT 0,
quiniela_publicada bool DEFAULT false,
created_at
```

**Tablas adicionales:**
- `pronosticos_partidos` — pronósticos de partidos por usuario
- `preguntas_bonus` — preguntas bonus configuradas por admin
- `respuestas_bonus` — respuestas de jugadores a preguntas bonus

### Variables de entorno (Vercel + `.env`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_URL=https://quienvaaganar.vercel.app
WA_PHONE_NUMBER_ID=1119400971261955
WA_ACCESS_TOKEN=[expira — renovar en Meta Business Suite]
WA_BUSINESS_ACCOUNT_ID=2646931842371237
CRON_SECRET=qvag_cron_2026
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## WhatsApp (Meta Cloud API)
- **Templates:** `resumen_diario` ✅ Active · `quiniela_invitacion` (puede estar en review)
- **⚠️ Token expira.** Renovar: Meta Business Suite → Usuarios del sistema → token permanente
- Mensajes free-form: solo dentro de 24h de última interacción del usuario

---

## Crons en Vercel
```json
{ "path": "/api/wa-broadcast?secret=qvag_cron_2026&turno=manana", "schedule": "0 14 * * *" }
{ "path": "/api/wa-prematch?secret=qvag_cron_2026", "schedule": "0 20 * * *" }
```

---

## Pendientes conocidos

| Item | Estado |
|------|--------|
| Token WA permanente | ⚠️ Crear System User token en Meta Business Suite |
| ProyeccionQuiniela | ℹ️ Depende de `notes[0].headline` del ESPN API — verificar que traiga grupo |
| RLS en Supabase | ⚠️ Validar Row Level Security |
| Editar perfil / cambiar avatar | 🔜 Los ya registrados no pueden cambiar avatar aún |
| Contraseña en texto plano | ℹ️ Suficiente para app casual |

---

## Deploy
```bash
git add -A && git commit -m "mensaje" && git push
# Vercel detecta el push y despliega automáticamente
```

---

## Repo
```
/Users/roccogarcini/Documents/Proyectos/quienvaaganar/
├── src/App.jsx              # Todo el frontend (~3600 líneas)
├── api/
│   ├── noticias.js
│   ├── fotmob.js
│   ├── calendar.ics.js
│   ├── wa-send.js
│   ├── wa-bienvenida.js
│   ├── wa-password.js
│   ├── wa-quiniela.js
│   ├── wa-broadcast.js
│   ├── wa-prematch.js
│   ├── analizar-quiniela.js
│   └── recomendar-quiniela.js
├── public/
│   ├── manifest.json
│   └── icon-192.svg
├── index.html
├── vercel.json
├── CONTEXTO_V2.md           # Este archivo — checkpoint v2.3
└── .env
```
