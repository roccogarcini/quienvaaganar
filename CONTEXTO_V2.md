# QuiénVaAGanar — Contexto v2.2

## App en producción
**URL:** https://quienvaaganar.vercel.app  
**Sala global única:** `mundial2026` (hardcodeada en `SALA_GLOBAL_ID`)  
**Stack:** React + Vite (single file `/src/App.jsx`) · Supabase PostgreSQL · Vercel serverless functions  
**Reset de sesión (testing):** `quienvaaganar.vercel.app?test` — limpia todo el localStorage

---

## Flujo completo de usuario nuevo

```
1. Onboarding (4 ecards deslizables)
        ↓
2. Registro wizard — 3 pasos:
   Paso 1: Avatar (foto o emoji)
   Paso 2: Nombre + WhatsApp + Contraseña
   Paso 3: Equipo + Pronóstico → Entrar
        ↓
3. Sala principal (5 tabs) — directo, sin pasos intermedios
        ↓
   [A los 30s + primer cambio de tab]
4. Popup calendario (una sola vez)
```

### Usuario ya registrado
→ Auto-login por `miId_mundial2026` en localStorage  
→ Si no hay ID pero sí WA guardado → auto-login por WA  
→ Si escribe su WA en Paso 2 y ya existe → pide contraseña para entrar

### Botón "Salir" (header)
→ Limpia `miId_mundial2026`, `quiniela_wa`, `quiniela_nombre`, `vioIntro` → regresa al onboarding

---

## Tabs de la sala
| Tab | Contenido |
|-----|-----------|
| ⚽ Mundial | Marcadores del día (hoy/ayer/mañana con ‹ ›), tabla de grupos |
| Noticias 📰 | Feed RSS filtrado por keywords del Mundial. Con imágenes. Filtrable por fuente |
| Tips 🧠 | Cards con tips: offside, tarjetas, VAR, penal, formato Mundial 2026 |
| Tabla | Ranking + Avatar + card "💀 Último lugar" + botón 😈 castigo (admin) + card de jugadores sin contraseña (admin) |
| Pronósticos | Acumulado en grande + lista con Avatar + pronósticos |

### Header siempre visible
- Título: **Mundial 2026**
- Badge azul: `⚽ ~X partidos por jugar`
- Badge verde: `🏆 Final en X días`
- **Acumulado:** `$X,XXX MXN · X jugadores × $250` — barra morada siempre visible
- Botones: Invitar (WA) · Copiar link · Salir

---

## Onboarding (4 ecards antes del registro)

| Card | Título | Color |
|------|--------|-------|
| 1 | ¡El calendario más divertido del Mundial! | Morado → Azul |
| 2 | PASO 1 · Elige tu equipo | Rojo → Naranja |
| 3 | PASO 2 · Agrega el calendario | Azul → Verde |
| 4 | El acumulado crece con cada jugador | Morado → Rosa |

- Swipeable (touch izq/der) · Dots animados · "Saltar intro" desde card 1-3
- Se guarda en `localStorage("vioIntro")` — solo se muestra una vez

---

## Registro (wizard 3 pasos)

### Paso 1 — Avatar (opcional)
- Tab **📷 Foto** (default): botón grande → abre galería → preview circular 100px
- Tab **😀 Emoji**: grid de 30 emojis divertidos → preview inmediato
- "Saltar este paso →" si no quieren nada · botón ✕ para limpiar

### Paso 2 — Nombre + WhatsApp + Contraseña
- Mini-avatar (44px) + botón "Cambiar" para regresar al paso 1
- Campo **nombre** (requerido)
- Campo **WhatsApp** (opcional) — con auto-detección de cuenta existente
- Campo **🔒 Contraseña** (requerido) — con botón 👁️ mostrar/ocultar
- "Solo tú la sabrás — la necesitarás para volver a entrar"
- Si el WA ya existe → aparece card de login con el participante encontrado + campo de contraseña para confirmar identidad

#### Login con WA existente
```
Escribe WA → detecta cuenta existente → muestra:
  [Avatar] Nombre · Equipo
  "Este número ya está registrado. Escribe tu contraseña para entrar."
  [Campo contraseña] + [Entrar →] [No soy yo]
  Si contraseña incorrecta → ❌ "Contraseña incorrecta"
  Cuentas sin contraseña (antiguas) → entran directo
```

### Paso 3 — Equipo + Pronóstico
- Resumen: avatar + nombre + botón "Cambiar"
- Selector de equipo (requerido)
- Campeón/Subcampeón (opcional) → tarjeta canvas para compartir
- "Entrar a la quiniela →" → **va directo a la sala**
- "📤 Compartir pronóstico por WhatsApp" (si hay pronóstico)

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
- Campo obligatorio en Paso 2
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
- Mensaje: *"Para que nadie más pueda entrar con tu número, ahora la quiniela tiene contraseña 🛡️"*
- Botón admin en tab Tabla: `📲 Avisar a X por WhatsApp` (solo aparece si hay jugadores sin contraseña)

---

## Avatares

### Componente `Avatar({ p, size })`
Jerarquía de fallback:
1. `p.avatar_url` → foto subida (Supabase Storage)
2. `p.avatar_emoji` → círculo morado/azul con emoji
3. `p.flag` → bandera del equipo (default)

### Dónde aparece
- Tabla (size 38) · Pronósticos (size 42) · Cuentas (size 34)
- Registro: preview 100px (paso 1), mini 44px (paso 2), mini 36px (paso 3)

### Supabase Storage
- Bucket: `avatars` (público) · Path: `{timestamp}-{random}.{ext}`
- Políticas: insert abierto + select público

### Emojis disponibles (30)
```js
["😎","🤩","🥷","🦁","🐯","🦊","🐺","🐸","🐧","🦄",
 "👻","🤖","💀","🎃","🔥","⚡","🌈","🎯","🏆","👑",
 "🍕","🌮","🎸","🚀","💎","🐉","🦅","🐻","🤠","😈"]
```

---

## Acumulado ($250 por jugador)
- Visible en **header** (barra morada siempre)
- Visible en **tab Pronósticos** (card grande morado→rosa "🎰 Acumulado")
- Fórmula: `participantes.length × 250`
- Texto en toda la app: "acumulado" (no "bote")
- Tiempo real via Supabase Realtime

---

## Banner carrusel (InstallBanner)
- Aparece para **todos** (Android, iOS, cualquier navegador) salvo modo standalone
- Se oculta permanentemente si: tocó ✕ o tocó "Ya la agregué →" en PasoInstall
- 4 slides que rotan cada **15 segundos**:

| # | Emoji | Mensaje | Color |
|---|-------|---------|-------|
| 1 | 📲 | Agregar a pantalla de inicio | Morado → Azul |
| 2 | 📅 | ¿Ya tienes el calendario? | Azul → Verde |
| 3 | 💰 | Acumulado: $X,XXX MXN | Rojo → Naranja |
| 4 | 🏆 | ¿Quién va a ganar? | Morado → Rosa |

- Dots clickeables · Barra de progreso 15s · ✕ para cerrar permanentemente
- localStorage: `vioInstallBanner`

---

## Popup de calendario (`CalendarioPopup`)
- Solo aparece **una vez**, cuando se cumplen AMBAS condiciones:
  1. ⏱️ Mínimo **30 segundos** en la app
  2. 👆 Usuario cambió de tab al menos una vez
- Sheet desde abajo con handle gris
- Chip selector: 🌍 Todos los partidos / 🏳️ Solo tu equipo (pre-seleccionado)
- Botones: 🍎 Apple Calendar · 📆 Google Calendar · ✅ Ya lo hice · Saltar por ahora
- Todos cierran el popup y guardan `vioCalendarioPopup` en localStorage

---

## PWA / Ícono
- `public/manifest.json` — nombre: "Mundial 2026", theme: `#7c3aed`
- `public/icon-192.svg` — calendario con balón grande centrado, fondo morado→azul
- `index.html` — `apple-touch-icon`, `manifest`, `apple-mobile-web-app-capable`
- Para actualizar ícono en iPhone: eliminar app y volver a agregar (iOS cachea el ícono)

---

## Paso Install (accesible desde banner)
- Detecta navegador: tabs **🧭 Safari** / **🌐 Chrome** en iOS
- Default: tab según `CriOS` en UA
- **Safari iOS:** ⬆️ SVG exacto → "Agregar a pantalla de inicio" → "Agregar"
- **Chrome iOS:** ··· tres puntos → ⬆️ Compartir → "Agregar" 
- **Android:** prompt nativo `beforeinstallprompt` o instrucciones manuales
- "Ya la agregué →" → guarda `vioInstallBanner=1` → banner no aparece en sala

---

## Arquitectura

### Frontend `/src/App.jsx` (~2400+ líneas)

**Flujo de componentes:**
```
Onboarding → Unirse (3 pasos) → Sala
                                  ↓ (30s + tab change)
                              CalendarioPopup (1 vez)
                                  ↓ (overlay fijo)
                              InstallBanner (carrusel)
                                  ↓ (2s, sin password)
                              PasswordPrompt
```

**Componentes:**
- `Avatar` — foto/emoji/bandera con fallback jerárquico
- `Onboarding` — 4 ecards swipeables
- `Unirse` — wizard 3 pasos
- `Sala` — pantalla principal con 5 tabs + prop `onFirstTabChange`
- `CalendarioPopup` — modal de calendario (30s + tab change, 1 vez)
- `InstallBanner` — carrusel rotativo 4 slides × 15s
- `PasswordPrompt` — sheet para crear contraseña (cuentas antiguas)

**Estado global en `App`:**
```js
miId              // ID del participante logueado
sala              // datos de la sala mundial2026
participantes     // array en tiempo real
vioIntro          // bool — controla onboarding
showInstall       // bool — controla InstallBanner
bannerIdx         // índice del slide activo
showCalPopup      // bool — controla CalendarioPopup
calTimerReady     // bool — pasaron 30s
calTabReady       // bool — usuario cambió de tab
showPasswordPrompt // bool — prompt de contraseña
```

**localStorage keys:**
```
miId_mundial2026          → ID del participante
quiniela_wa               → WA guardado (auto-login)
quiniela_nombre           → Nombre guardado
vioIntro                  → "1" si ya vio onboarding
vioInstallBanner          → "1" si cerró banner o instaló
vioCalendarioPopup        → "1" si ya interactuó con popup calendario
skipPasswordPrompt_{miId} → "1" si tocó "Ahora no" en PasswordPrompt
```

---

### APIs serverless `/api/`
| Archivo | Función |
|---------|---------|
| `noticias.js` | RSS proxy con filtro Mundial. Cache 5min. Extrae imágenes |
| `fotmob.js` | Proxy ESPN API — marcadores y tabla de grupos |
| `calendar.ics.js` | Genera `.ics` filtrado por equipos (`?teams=México,Argentina`) |
| `wa-send.js` | Envío WA individual via Meta Cloud API |
| `wa-bienvenida.js` | WA automático al registrarse |
| `wa-password.js` | WA masivo a participantes sin contraseña (`?secret=`) |
| `wa-broadcast.js` | Cron diario: resumen de partidos + noticias |
| `wa-prematch.js` | Cron: mensajes hype antes de cada partido |
| `wa-castigo.js` | Castigo al último lugar (valida en Supabase) |

### Base de datos Supabase
**Proyecto:** `wvpleipsgidtbynkkmgi` — región us-east-1

**Columnas `participantes`:**
```
id, sala_id, nombre, whatsapp, equipo, flag,
pron_camp, pron_sub, pron_camp_flag, pron_sub_flag,
points, penalties, eliminado, modo_jugador, apuesta,
avatar_url,    ← URL pública Supabase Storage "avatars"
avatar_emoji,  ← emoji elegido
password,      ← contraseña en texto plano
created_at
```

**Supabase Storage:**
- Bucket: `avatars` (público) — insert abierto, select público

### Variables de entorno (Vercel)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
WA_PHONE_NUMBER_ID=1119400971261955
WA_ACCESS_TOKEN=[expira — renovar en Meta Business Suite]
WA_BUSINESS_ACCOUNT_ID=2646931842371237
CRON_SECRET=qvag_cron_2026
```

---

## WhatsApp (Meta Cloud API)
- **Templates:** `resumen_diario` ✅ Active · `prepartido_hype` ⏳ In review
- **⚠️ Token expira.** Renovar: Meta Business Suite → Usuarios del sistema → token permanente
- **Nota:** mensajes free-form solo funcionan dentro de 24h de la última interacción del usuario. Fuera de esa ventana se requiere template aprobado.

**Mensajes automáticos:**
- `wa-bienvenida` → al registrarse
- `wa-password` → admin lo dispara desde Tabla (solo a cuentas sin contraseña)
- `wa-castigo` → admin lo dispara desde Tabla

### Crons en Vercel
```json
{ "path": "/api/wa-broadcast?secret=qvag_cron_2026&turno=manana", "schedule": "0 14 * * *" }
{ "path": "/api/wa-prematch?secret=qvag_cron_2026", "schedule": "0 20 * * *" }
```

---

## Decisiones de diseño

### ✅ Registro en 3 pasos → sala directo
Sin pasos intermedios de calendario ni install. El calendario se ofrece vía popup inteligente.

### ✅ Contraseña simple (texto plano)
App casual entre amigos. No hay datos financieros críticos. La contraseña protege contra suplantación por número de WA.

### ✅ Popup de calendario con condiciones
Solo aparece si llevas 30s en la app Y cambiaste de tab. No interrumpe al entrar.

### ✅ Banner carrusel para todos
No solo iOS — cualquier usuario ve el banner. Fácil de ampliar: agregar objeto a `BANNER_SLIDES`.

### ✅ "Ya lo hice" en popup calendario
Evita que el popup vuelva a aparecer sin tener que agregar el calendario.

### ✅ Acumulado (no "bote")
Término "acumulado" en toda la app — onboarding, tabs, banner, pronósticos.

### ✅ Ícono PWA con balón grande
Balón de fútbol prominente (r=34) centrado en la parte inferior del calendario.

---

## Pendientes conocidos

| Item | Estado |
|------|--------|
| Token WA permanente | ⚠️ Crear System User token en Meta Business Suite |
| Template `prepartido_hype` | ⏳ En revisión en Meta |
| RLS en Supabase | ⚠️ Validar Row Level Security |
| Editar perfil / cambiar avatar | 🔜 Los ya registrados no pueden cambiar avatar aún |
| Contraseña en texto plano | ℹ️ Suficiente para app casual; upgradar a hash si se escala |

---

## Deploy
```bash
cd /Users/roccogarcini/Documents/Proyectos/quienvaaganar
npx vercel --prod --yes
```

---

## Pruebas manuales

### Reset completo
```
quienvaaganar.vercel.app?test
```

### Flujo nuevo usuario
- [ ] 4 ecards onboarding (swipeable)
- [ ] Paso 1: elegir emoji o foto
- [ ] Paso 2: nombre + WA + contraseña → "Siguiente →"
- [ ] Paso 3: equipo + pronóstico → "Entrar a la quiniela →"
- [ ] Entra directo a sala (sin pasos intermedios)
- [ ] A los 30s + cambiar tab → popup calendario
- [ ] Popup: chip equipo pre-seleccionado · Apple/Google · "✅ Ya lo hice"

### Login con WA existente
- [ ] Paso 2: escribir WA de alguien → aparece card con su nombre
- [ ] Contraseña correcta → entra ✅
- [ ] Contraseña incorrecta → ❌ mensaje de error
- [ ] "No soy yo" → cierra sugerencia

### Cuentas sin contraseña
- [ ] Al entrar (2s delay) → sheet "🔒 Crea tu contraseña"
- [ ] Guardar → se actualiza en Supabase
- [ ] "Ahora no" → no vuelve a aparecer en ese dispositivo
- [ ] Admin en Tabla → card dorada con conteo → botón WA

### Avatares
- [ ] Foto → aparece en Tabla y Pronósticos
- [ ] Emoji → círculo morado
- [ ] Sin avatar → bandera del equipo

### Banner carrusel
- [ ] Aparece en sala (no en registro/onboarding)
- [ ] Rota cada 15s · dots clickeables · barra de progreso
- [ ] ✕ cierra permanentemente

### Tab Tabla (admin)
- [ ] Avatar circular antes del nombre
- [ ] Card "💀 Último lugar"
- [ ] Card dorada "🔒 X jugadores sin contraseña" (si aplica)
- [ ] Botón "📲 Avisar por WA" dispara `/api/wa-password`

### Ícono PWA
- [ ] Agregar a pantalla de inicio → ícono calendario con balón grande
- [ ] Para actualizar: eliminar app y volver a agregar

### Calendario ICS
```bash
curl "https://quienvaaganar.vercel.app/api/calendar.ics" | head -20
curl "https://quienvaaganar.vercel.app/api/calendar.ics?teams=México" | grep SUMMARY
```

---

## Repo
```
/Users/roccogarcini/Documents/Proyectos/quienvaaganar/
├── src/App.jsx              # Todo el frontend (~2400 líneas)
├── api/
│   ├── noticias.js
│   ├── fotmob.js
│   ├── calendar.ics.js
│   ├── wa-send.js
│   ├── wa-bienvenida.js
│   ├── wa-password.js       ← NUEVO: WA masivo a cuentas sin contraseña
│   ├── wa-broadcast.js
│   ├── wa-prematch.js
│   └── wa-castigo.js
├── public/
│   ├── manifest.json
│   └── icon-192.svg         # Balón grande (r=34) centrado
├── index.html
├── vercel.json
├── CONTEXTO_V2.md           # Este archivo — checkpoint v2.2
└── .env
```
