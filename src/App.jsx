// quienvaaganar · Stack: React + Vite + Supabase + Vercel
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURA AQUÍ ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://TU_PROYECTO.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "TU_ANON_KEY";
const APP_URL = import.meta.env.VITE_APP_URL || "https://quienvaaganar.vercel.app";
const SALA_GLOBAL_ID = "mundial2026"; // Sala única — todos los usuarios entran aquí
const MARKETERIA_ID = "1b3d7ee1-c448-426e-8f22-7d2724f713db";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ----------------------

const TEAMS=[{n:"México",f:"🇲🇽"},{n:"Argentina",f:"🇦🇷"},{n:"Brasil",f:"🇧🇷"},{n:"España",f:"🇪🇸"},{n:"Francia",f:"🇫🇷"},{n:"Alemania",f:"🇩🇪"},{n:"Inglaterra",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{n:"Portugal",f:"🇵🇹"},{n:"Países Bajos",f:"🇳🇱"},{n:"Uruguay",f:"🇺🇾"},{n:"Colombia",f:"🇨🇴"},{n:"Japón",f:"🇯🇵"},{n:"Marruecos",f:"🇲🇦"},{n:"Senegal",f:"🇸🇳"},{n:"Croacia",f:"🇭🇷"},{n:"Ecuador",f:"🇪🇨"},{n:"Bélgica",f:"🇧🇪"},{n:"Chile",f:"🇨🇱"},{n:"Suiza",f:"🇨🇭"},{n:"Turquía",f:"🇹🇷"},{n:"Canadá",f:"🇨🇦"},{n:"EUA",f:"🇺🇸"},{n:"Australia",f:"🇦🇺"},{n:"Serbia",f:"🇷🇸"},{n:"Paraguay",f:"🇵🇾"},{n:"Corea del Sur",f:"🇰🇷"},{n:"Dinamarca",f:"🇩🇰"},{n:"Arabia Saudita",f:"🇸🇦"},{n:"Polonia",f:"🇵🇱"},{n:"Camerún",f:"🇨🇲"},{n:"Irán",f:"🇮🇷"},{n:"Ghana",f:"🇬🇭"}];
const STAGES=[{n:"Grupos",p:1},{n:"Octavos",p:2},{n:"Cuartos",p:3},{n:"Semis",p:5},{n:"Final",p:10}];
const DEF_CASTIGOS=["Foto de perfil ridícula 24h","Invitar tacos al grupo","Audio cantando el himno del ganador","Story confesando que perdió","Pagar la próxima ronda","Meme de su propio fracaso","Elogio escrito al equipo que lo eliminó","Cambiar nombre en el grupo 1 semana"];

// ── UTILIDADES ────────────────────────────────
function getSalaIdFromURL(){
  const path = window.location.pathname;
  const match = path.match(/\/sala\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

function calcPagos(participantes, cuotaFallback){
  const n = participantes.length;
  const bal = {};
  participantes.forEach(p => { bal[p.id] = 0; });
  participantes.forEach(p => {
    if ((p.penalties || 0) > 0) {
      const cuota = (p.apuesta && p.apuesta > 0) ? p.apuesta : (cuotaFallback || 0);
      const deuda = p.penalties * cuota;
      bal[p.id] -= deuda;
      participantes.forEach(o => { if (o.id !== p.id) bal[o.id] += deuda / (n - 1); });
    }
  });
  const deu = [], acr = [];
  Object.entries(bal).forEach(([id, v]) => {
    const r = Math.round(v);
    if (r < 0) deu.push({ id, amt: -r });
    else if (r > 0) acr.push({ id, amt: r });
  });
  deu.sort((a, b) => b.amt - a.amt);
  acr.sort((a, b) => b.amt - a.amt);
  const res = []; let i = 0, j = 0;
  while (i < deu.length && j < acr.length) {
    const d = deu[i], a = acr[j], amt = Math.min(d.amt, a.amt);
    if (amt > 0) res.push({ from: d.id, to: a.id, amt });
    d.amt -= amt; a.amt -= amt;
    if (d.amt === 0) i++;
    if (a.amt === 0) j++;
  }
  return res.map(pg => ({
    ...pg,
    fromP: participantes.find(x => x.id === pg.from),
    toP: participantes.find(x => x.id === pg.to),
  }));
}

// ── ESTILOS ───────────────────────────────────
const C = { bg:"#0a0e1a", card:"#111827", border:"#1f2937", text:"#f9fafb", muted:"#6b7280", green:"#10b981", red:"#ef4444", gold:"#fbbf24", blue:"#3b82f6" };
const inp = { width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", color:C.text, fontSize:14, fontFamily:"inherit" };
const cardStyle = { background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:8 };
const Btn = (extra={}) => ({ cursor:"pointer", fontFamily:"inherit", fontSize:13, borderRadius:8, border:`0.5px solid ${C.border}`, background:C.card, color:C.text, padding:"8px 14px", ...extra });
const BtnP = Btn({ background:"#1d4ed8", border:"none", fontWeight:600, color:"#fff" });
const BtnG = Btn({ background:C.green+"22", color:C.green, border:`1px solid ${C.green}44` });
const BtnR = Btn({ background:C.red+"22", color:C.red, border:`1px solid ${C.red}44` });
const BtnW = Btn({ background:C.gold+"22", color:C.gold, border:`1px solid ${C.gold}44` });

// ── AVATAR ────────────────────────────────────
const AVATAR_EMOJIS = ["😎","🤩","🥷","🦁","🐯","🦊","🐺","🐸","🐧","🦄","👻","🤖","💀","🎃","🔥","⚡","🌈","🎯","🏆","👑","🍕","🌮","🎸","🚀","💎","🐉","🦅","🐻","🤠","😈"];

function Avatar({ p, size = 40 }) {
  const bdr = { width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 };
  if (p?.avatar_url) {
    return <img src={p.avatar_url} alt={p.nombre} style={bdr} />;
  }
  const bg = p?.avatar_emoji
    ? "linear-gradient(135deg,#7c3aed,#1d4ed8)"
    : `${C.card}`;
  const content = p?.avatar_emoji
    ? <span style={{ fontSize: size * 0.48, lineHeight: 1 }}>{p.avatar_emoji}</span>
    : <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{p?.flag || "⚽"}</span>;
  return (
    <div style={{ ...bdr, background: bg, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {content}
    </div>
  );
}

// ── PANTALLA: CREAR SALA ──────────────────────
function PreviewModal({ tipo, onClose }) {
  const previews = {
    calendario: {
      title:"📅 Calendario del Mundial",
      content: (
        <div>
          <p style={{color:C.muted,fontSize:12,marginBottom:12}}>Navega por todos los partidos día a día con marcadores en vivo.</p>
          {[
            {hora:"TC", local:"México 🇲🇽",    score:"2 - 0", visit:"🇿🇦 Sudáfrica", done:true},
            {hora:"TC", local:"Corea del Sur 🇰🇷",score:"2 - 1",visit:"🇨🇿 Chequia", done:true},
            {hora:"19:00",local:"Canadá 🇨🇦",  score:"vs",    visit:"🇧🇦 Bosnia",    done:false},
            {hora:"21:00",local:"EE.UU. 🇺🇸",  score:"vs",    visit:"🇵🇾 Paraguay",  done:false},
          ].map((m,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"44px 1fr 54px 1fr",alignItems:"center",gap:6,padding:"9px 0",borderBottom:`1px solid ${C.border}20`}}>
              <span style={{background:m.done?"#ffffff15":"transparent",color:m.done?C.muted:"#60a5fa",fontSize:10,fontWeight:700,textAlign:"center",borderRadius:4,padding:"2px 4px"}}>{m.hora}</span>
              <span style={{color:C.text,fontSize:12,textAlign:"right"}}>{m.local}</span>
              <span style={{color:m.done?C.text:C.muted,fontSize:m.done?15:11,fontWeight:m.done?800:400,textAlign:"center"}}>{m.score}</span>
              <span style={{color:C.text,fontSize:12}}>{m.visit}</span>
            </div>
          ))}
        </div>
      )
    },
    marcadores: {
      title:"⚽ Marcadores en vivo",
      content: (
        <div>
          <p style={{color:C.muted,fontSize:12,marginBottom:12}}>Partidos en curso con el minuto exacto, actualizados en tiempo real.</p>
          <div style={{background:"#10b98112",border:"1px solid #10b98133",borderRadius:10,padding:14,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{background:"#10b981",color:"#000",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4}}>● EN VIVO  67′</span>
              <span style={{color:C.muted,fontSize:10}}>Grp. A · Jornada 2</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",alignItems:"center",gap:4}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:22}}>🇲🇽</div>
                <div style={{color:C.text,fontSize:12,fontWeight:600}}>México</div>
              </div>
              <div style={{textAlign:"center",color:C.text,fontSize:22,fontWeight:800}}>1 - 0</div>
              <div>
                <div style={{fontSize:22}}>🇨🇿</div>
                <div style={{color:C.text,fontSize:12,fontWeight:600}}>Chequia</div>
              </div>
            </div>
          </div>
          <p style={{color:C.muted,fontSize:11,textAlign:"center"}}>La app se actualiza automáticamente cada 60 segundos ⚡</p>
        </div>
      )
    },
    tips: {
      title:"🧠 Tips de Football",
      content: (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <p style={{color:C.muted,fontSize:12,marginBottom:4}}>No sabes nada de football? No importa, con estos tips serás el centro de la plática. 😎</p>
          {[
            {emoji:"⚽",tip:"El offside (fuera de juego): si un atacante está más cerca del arco rival que el último defensa cuando le pasan el balón, es falta."},
            {emoji:"🟨",tip:"Tarjeta amarilla = amonestación. Dos amarillas = roja automática y el jugador es expulsado."},
            {emoji:"🥅",tip:"El VAR (Video Assistant Referee) revisa goles, penales y tarjetas rojas con videoreplay para evitar errores graves."},
            {emoji:"📐",tip:"En la fase de grupos, si dos equipos empatan en puntos, se desempata por diferencia de goles (DG)."},
          ].map((t,i)=>(
            <div key={i} style={{background:C.card,borderRadius:10,padding:"10px 12px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:20,flexShrink:0}}>{t.emoji}</span>
              <span style={{color:C.text,fontSize:12,lineHeight:1.6}}>{t.tip}</span>
            </div>
          ))}
          <p style={{color:"#a78bfa",fontSize:11,textAlign:"center",marginTop:4}}>Próximamente: más tips y datos curiosos cada jornada 🚀</p>
        </div>
      )
    },
    apuestas: {
      title:"🏆 Apuestas con amigos",
      content: (
        <div>
          <p style={{color:C.muted,fontSize:12,marginBottom:12}}>Crea tu quiniela, elige el modo y comparte el link. Así se ve la tabla:</p>
          <div style={{background:C.card,borderRadius:10,overflow:"hidden",marginBottom:10}}>
            {[
              {pos:1,nombre:"Rocco",equipo:"🇲🇽",pts:18,modo:"💰$250",adv:true},
              {pos:2,nombre:"Fer",  equipo:"🇧🇷",pts:15,modo:"💰$250",adv:true},
              {pos:3,nombre:"Gaby", equipo:"🇦🇷",pts:12,modo:"🎲",adv:false},
              {pos:4,nombre:"Luis", equipo:"🇫🇷",pts:9, modo:"🎲",adv:false},
            ].map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:i<3?`1px solid ${C.border}20`:undefined}}>
                <span style={{color:p.adv?"#f59e0b":C.muted,fontSize:13,fontWeight:700,width:18,textAlign:"center"}}>{p.pos}</span>
                <span style={{fontSize:20}}>{p.equipo}</span>
                <span style={{color:C.text,fontSize:13,flex:1}}>{p.nombre}</span>
                <span style={{color:C.muted,fontSize:11}}>{p.modo}</span>
                <span style={{color:C.text,fontSize:13,fontWeight:700,minWidth:30,textAlign:"right"}}>{p.pts}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{icon:"🤑",label:"¡Hay Trato!",desc:"Privado, tú decides el monto"},{icon:"🎲",label:"Con Retos",desc:"Castigos divertidos, sin dinero"},{icon:"🔥",label:"Híbrido",desc:"Abierto, todos en $250"}].map(m=>(
              <div key={m.label} style={{flex:1,background:C.card,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                <div style={{fontSize:18}}>{m.icon}</div>
                <div style={{color:C.text,fontSize:10,fontWeight:600}}>{m.label}</div>
                <div style={{color:C.muted,fontSize:9,lineHeight:1.4,marginTop:2}}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  };
  const p = previews[tipo];
  if (!p) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:C.bg,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto",padding:"20px 20px 36px"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{color:C.text,fontSize:16,fontWeight:700,margin:0}}>{p.title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
        </div>
        {p.content}
      </div>
    </div>
  );
}

function CrearSala({ onCreate }) {
  const [nombre] = useState("Mundial 2026");
  const [modo, setModo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [creadorNombre, setCreadorNombre] = useState(() => localStorage.getItem("quiniela_nombre") || "");
  const [creadorWA, setCreadorWA] = useState(() => localStorage.getItem("quiniela_wa") || "");
  const [buscando, setBuscando] = useState(false);
  const [cuota, setCuota] = useState(100);
  const [castigos, setCastigos] = useState([...DEF_CASTIGOS]);
  const [newC, setNewC] = useState("");
  // Siempre empieza en paso 0 (Entra al juego)
  const [step, setStep] = useState(0);

  async function verificarWA() {
    const normaliza = v => (v||"").replace(/\D/g,"").slice(-10);
    const wa = normaliza(creadorWA);
    if (!wa) return;
    localStorage.setItem("quiniela_nombre", creadorNombre.trim());
    localStorage.setItem("quiniela_wa", creadorWA.trim());
    setBuscando(true);
    const { data } = await supabase.from("participantes")
      .select("sala_id, whatsapp")
      .ilike("whatsapp", `%${wa}`)
      .order("created_at", { ascending: false })
      .limit(1);
    setBuscando(false);
    if (data && data.length > 0) {
      localStorage.setItem("quiniela_lastSala", data[0].sala_id);
      window.location.href = `/sala/${data[0].sala_id}`;
    } else {
      // No existe → crear sala directamente
      await crear();
    }
  }
  const [loading, setLoading] = useState(false);
  const [salaId, setSalaId] = useState(null);
  const [invitados, setInvitados] = useState([]); // [{nombre, wa}]
  const [newInvNombre, setNewInvNombre] = useState("");
  const [newInvWa, setNewInvWa] = useState("");

  async function crear() {
    if (!nombre.trim()) return;
    setLoading(true);
    const id = Math.random().toString(36).substr(2, 8);
    const { error } = await supabase.from("salas").insert({
      id, nombre, modo: "retos", cuota: 0, castigos: [], flash: [], stage: "Grupos"
    });
    if (!error) {
      setSalaId(id);
      onCreate(id);
    } else { alert("Error al crear sala: " + error.message); setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 20px" }}>
      <div style={{ maxWidth:480, width:"100%" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:52 }}>⚽</div>
          <h1 style={{ color:C.text, fontSize:26, fontWeight:700, margin:"8px 0 4px" }}>¿Quién va a ganar?</h1>
          <p style={{ color:C.muted, fontSize:14 }}>Crea tu quiniela, comparte el link y que cada quien se apunte.</p>
        </div>

        {/* Pitch MarketerIA */}
        <div style={{ background:"linear-gradient(135deg,#7c3aed18,#1d4ed818)", border:"1px solid #7c3aed33", borderRadius:14, padding:"18px 20px", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <span style={{ background:"linear-gradient(90deg,#7c3aed,#1d4ed8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontWeight:700, fontSize:15 }}>MarketerIA</span>
            <span style={{ color:C.muted, fontSize:12 }}>by RoccoGarcini</span>
          </div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.7, marginBottom:12 }}>
            Un juego hecho para tenerte al día con el Mundial 2026 de una manera divertida. <strong style={{color:"#a78bfa"}}>Predice</strong> quién va a ganar, sigue los partidos y compite con tus amigos.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["📅","Calendario del Mundial","Todos los partidos y horarios","calendario"],
              ["⚽","Marcadores en vivo","Resultados al momento","marcadores"],
              ["🧠","Tips y noticias","Para entender el juego y estar al día","tips"],
              ["🏆","Tabla de posiciones","¿Quién lleva la delantera?","tabla"],
            ].map(([icon,title,desc,key])=>(
              <button key={title} onClick={()=>setPreview(key)} style={{
                background:C.card+"88", borderRadius:10, padding:"10px 12px",
                border:`1px solid ${C.border}44`, cursor:"pointer", textAlign:"left",
                fontFamily:"inherit", transition:"border-color .15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#3b82f688"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=`${C.border}44`}>
                <div style={{ fontSize:18, marginBottom:3 }}>{icon}</div>
                <div style={{ color:C.text, fontSize:12, fontWeight:600, marginBottom:2 }}>{title}</div>
                <div style={{ color:C.muted, fontSize:11, lineHeight:1.4 }}>{desc}</div>
                <div style={{ color:"#60a5fa", fontSize:10, marginTop:4 }}>Ver preview →</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── PASO 0: Entra al juego ── */}
        {step === 0 && <>
          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Entra al juego</div>
          <input
            value={creadorNombre} onChange={e=>setCreadorNombre(e.target.value)}
            placeholder="Tu nombre"
            style={{ ...inp, marginBottom:10 }}
          />
          <input
            value={creadorWA} onChange={e=>setCreadorWA(e.target.value)}
            placeholder="Tu WhatsApp (ej: 4431234567)" type="tel"
            style={{ ...inp, marginBottom:20 }}
            onKeyDown={e=>e.key==="Enter"&&creadorNombre.trim()&&creadorWA.trim()&&verificarWA()}
          />
          <button style={{ ...BtnP, width:"100%", padding:12, fontSize:14, opacity:(!creadorNombre.trim()||!creadorWA.trim()||buscando||loading)?0.4:1 }}
            disabled={!creadorNombre.trim()||!creadorWA.trim()||buscando||loading}
            onClick={verificarWA}>
            {buscando||loading ? "Un momento…" : "Entrar al Mundial 🏆"}
          </button>
        </>}

        {/* ── PASO 1: Modo de juego ── */}
        {step === 1 && <>
          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Modo de juego</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
            {[
              { k:"dinero",  icon:"🤑", title:"¡Hay Trato!",  desc:"Sala privada. Tú decides con quién y de cuánto. Solo la ven los que invites." },
              { k:"retos",   icon:"🎲", title:"Con retos",   desc:"Sin dinero. El perdedor sortea 3 castigos del grupo y elige uno." },
              { k:"hibrido", icon:"🔥", title:"Híbrido $250", desc:"Quiniela abierta. Todos entran en $250. Se cobra conforme se eliminan equipos — el admin indica cuándo y a quién pagar." },
            ].map(o => (
              <div key={o.k} onClick={() => setModo(o.k)} style={{ ...cardStyle, cursor:"pointer", marginBottom:0, border:`${modo===o.k?"2px":"0.5px"} solid ${modo===o.k?"#3b82f6":C.border}` }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{o.icon}</div>
                <div style={{ color:C.text, fontWeight:600, fontSize:13, marginBottom:4 }}>{o.title}</div>
                <p style={{ color:C.muted, fontSize:11, lineHeight:1.5 }}>{o.desc}</p>
              </div>
            ))}
          </div>
          <button style={{ ...BtnP, width:"100%", padding:12, fontSize:14, opacity:!modo?0.4:1 }}
            disabled={!modo}
            onClick={() => setStep(modo==="dinero" ? 2 : 3)}>
            Siguiente →
          </button>
        </>}

        {step === 2 && <>
          <div style={{ ...cardStyle, marginBottom:12 }}>
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              {modo === "dinero" ? "🤑 Monto del trato ($MXN)" : "Cuota por castigo ($MXN)"}
            </div>
            <input style={inp} type="number" value={cuota} onChange={e => setCuota(Number(e.target.value))} />
            <p style={{ color:C.muted, fontSize:11, marginTop:6 }}>
              {modo === "dinero"
                ? "El que pierda pagará este monto. Solo lo ven los que tú invites."
                : "Los jugadores que elijan dinero se comprometen a meter esta cantidad cuando se les indique."}
            </p>
          </div>

          {modo === "dinero" && <>
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10, marginTop:4 }}>
              💰 Con quién apuestas
            </div>
            <p style={{ color:C.muted, fontSize:12, marginBottom:10 }}>Agrega a las personas con las que harás la apuesta. Les mandarás el link por WhatsApp al finalizar.</p>
            <div style={{ display:"flex", gap:6, marginBottom:6 }}>
              <input style={{ ...inp, flex:2 }} placeholder="Nombre" value={newInvNombre}
                onChange={e => setNewInvNombre(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter" && newInvNombre.trim()) { setInvitados(v=>[...v,{nombre:newInvNombre.trim(),wa:newInvWa.trim()}]); setNewInvNombre(""); setNewInvWa(""); } }} />
              <input style={{ ...inp, flex:2 }} placeholder="WhatsApp (opcional)" type="tel" value={newInvWa}
                onChange={e => setNewInvWa(e.target.value)} />
              <button style={{...BtnP, flexShrink:0}} onClick={() => { if(newInvNombre.trim()){ setInvitados(v=>[...v,{nombre:newInvNombre.trim(),wa:newInvWa.trim()}]); setNewInvNombre(""); setNewInvWa(""); } }}>+</button>
            </div>
            {invitados.map((inv,i) => (
              <div key={i} style={{ ...cardStyle, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", marginBottom:6 }}>
                <div>
                  <span style={{ color:C.text, fontSize:13, fontWeight:500 }}>👤 {inv.nombre}</span>
                  {inv.wa && <span style={{ color:C.muted, fontSize:11, marginLeft:8 }}>📱 {inv.wa}</span>}
                </div>
                <button onClick={() => setInvitados(v=>v.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16 }}>×</button>
              </div>
            ))}
          </>}

          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button style={Btn()} onClick={() => setStep(1)}>← Volver</button>
            <button style={{ ...BtnP, flex:1, padding:12 }} onClick={() => setStep(3)}>Siguiente →</button>
          </div>
        </>}

        {step === 4 && salaId && <>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
            <h2 style={{ color:C.text, fontSize:20, fontWeight:700, marginBottom:6 }}>¡Quiniela creada!</h2>
            <p style={{ color:C.muted, fontSize:13 }}>Ahora invita a tus apostadores. Solo ellos verán esta sala.</p>
          </div>
          {invitados.length > 0 ? <>
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Mandar invitación por WhatsApp</div>
            {invitados.map((inv,i) => {
              const texto = `Hey ${inv.nombre} 👋\n\n⚽ Te invito a seguir el Mundial 2026 juntos en *${sala?.nombre||"Mundial 2026"}*\n\nCalendario · Resultados · Noticias en vivo 🏆\n\n👉 ${APP_URL}`;
              return (
                <div key={i} style={{ ...cardStyle, display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div>
                    <div style={{ color:C.text, fontSize:14, fontWeight:500 }}>👤 {inv.nombre}</div>
                    {inv.wa && <div style={{ color:C.muted, fontSize:11 }}>📱 {inv.wa}</div>}
                  </div>
                  <button
                    style={{ ...Btn({ background:"#25D366", color:"#fff", border:"none", fontSize:12, padding:"8px 12px" }) }}
                    onClick={() => {
                      const num = inv.wa ? inv.wa.replace(/\D/g,"") : "";
                      window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`,"_blank");
                    }}>
                    📲 Invitar
                  </button>
                </div>
              );
            })}
            <div style={{ height:12 }}/>
          </> : (
            <div style={{ ...cardStyle, marginBottom:12 }}>
              <p style={{ color:C.muted, fontSize:13 }}>Copia el link y compártelo con quien quieras:</p>
              <div style={{ color:"#60a5fa", fontSize:12, marginTop:6, wordBreak:"break-all" }}>{APP_URL}/sala/{salaId}</div>
            </div>
          )}
          <button style={{ ...BtnP, width:"100%", padding:12, fontSize:15 }} onClick={() => onCreate(salaId)}>
            Entrar a mi quiniela →
          </button>
        </>}

        {step === 3 && <>
          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Castigos del grupo</div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:12 }}>Al perder se sortean 3 y el jugador elige uno. Edita la lista a tu gusto.</p>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <input style={{ ...inp, flex:1 }} placeholder="Agrega un castigo..." value={newC} onChange={e => setNewC(e.target.value)}
              onKeyDown={e => e.key==="Enter" && newC.trim() && (setCastigos(c=>[...c,newC.trim()]),setNewC(""))} />
            <button style={BtnP} onClick={() => { if(newC.trim()){setCastigos(c=>[...c,newC.trim()]);setNewC("");} }}>+</button>
          </div>
          <div style={{ maxHeight:220, overflowY:"auto", marginBottom:16 }}>
            {castigos.map((c,i) => (
              <div key={i} style={{ ...cardStyle, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px" }}>
                <span style={{ color:C.text, fontSize:13, flex:1 }}>{c}</span>
                <button onClick={() => setCastigos(cs=>cs.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={Btn()} onClick={() => setStep(modo==="dinero"?2:1)}>← Volver</button>
            <button style={{ ...BtnP, flex:1, padding:12, fontSize:14 }} disabled={loading} onClick={crear}>
              {loading ? "Creando..." : "Crear quiniela →"}
            </button>
          </div>
        </>}
      </div>
      {preview && <PreviewModal tipo={preview} onClose={()=>setPreview(null)} />}
    </div>
  );
}

// ── PANTALLA: ONBOARDING (4 ecards antes del registro) ────────────────
const ONBOARDING_CARDS = [
  {
    emoji: "🎉",
    titulo: "¡El calendario más divertido del Mundial!",
    desc: "¿Te pierdes los partidos? ¿No sabes nada de fut? jaja ¡No importa! Aquí tendrás todo lo que necesitas para estar siempre informado… y si le atinas, podrás ganar el acumulado o parte de él 🏆",
    color1: "#7c3aed", color2: "#1d4ed8",
    detalle: "😄 No depositas nada · confiamos en que lo harás cuando sea el momento",
    detalle2: null,
  },
  {
    emoji: "❤️",
    titulo: "PASO 1 · Elige tu equipo",
    desc: "Selecciona el país con el que está tu corazón, luego el que crees que va a ganar el Mundial (¡puede ser el mismo!) y el subcampeón. Genera tu tarjeta y compártela con todos.",
    color1: "#e11d48", color2: "#f97316",
    detalle: "🏳️ Tu equipo · 🏆 Campeón · 🥈 Subcampeón · 📤 Tarjeta para compartir",
    detalle2: null,
  },
  {
    emoji: "📅",
    titulo: "PASO 2 · Agrega el calendario",
    desc: "Tendrás en tu cel los horarios de TODOS los partidos. El admin suma puntos conforme avanza el torneo — sube en el ranking, mira quién va ganando y quién se queda en último lugar 😈",
    color1: "#0891b2", color2: "#0d9488",
    detalle: "🔔 Notificación antes de cada partido · 📊 Tabla en vivo · 104 partidos",
    detalle2: null,
  },
  {
    emoji: "💰",
    titulo: "El acumulado crece con cada jugador",
    desc: "Cada participante aporta $250 MXN al acumulado. Conforme se une más gente, ¡el acumulado sube! Y conforme avance el Mundial haremos más quinielas para aumentar tus posibilidades de triunfar 🔥",
    color1: "#7c3aed", color2: "#db2777",
    detalle: "💵 $250 por jugador · Entre más jueguen, más crece el acumulado · 🏆 ¡El 1er lugar gana todo!",
    detalle2: null,
  },
  {
    imagen: "/deposito.png",
    titulo: null,
    color1: "#059669", color2: "#7c3aed",
  },
];

function Onboarding({ onTerminar }) {
  const [idx, setIdx] = useState(0);
  const card = ONBOARDING_CARDS[idx];
  const esUltima = idx === ONBOARDING_CARDS.length - 1;

  // Soporte para swipe
  const touchStart = useRef(null);
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -40 && !esUltima) setIdx(i => i + 1);
    if (dx > 40 && idx > 0) setIdx(i => i - 1);
    touchStart.current = null;
  }

  const STEP_LABELS = ["Bienvenida","Tu equipo","Calendario","El acumulado","Depósito"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 20px" }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ maxWidth:420, width:"100%" }}>

        {/* Paso label */}
        <div style={{ textAlign:"center", marginBottom:10, color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.1em" }}>
          {STEP_LABELS[idx]} · {idx+1} de {ONBOARDING_CARDS.length}
        </div>

        {/* Card */}
        {card.imagen
          ? <img src={card.imagen} alt="Depósito" style={{ width:"100%", borderRadius:20, marginBottom:20, display:"block" }} />
          : <div style={{
              background:`linear-gradient(145deg, ${card.color1}44, ${card.color2}22, #0a0e1a)`,
              border:`1.5px solid ${card.color1}77`,
              borderRadius:24, padding:"32px 24px 26px", textAlign:"center",
              marginBottom:20, minHeight:340, display:"flex", flexDirection:"column", justifyContent:"space-between",
              boxShadow:`0 8px 40px ${card.color1}33`,
              transition:"all 0.3s",
            }}>
              <div>
                <div style={{
                  width:90, height:90, borderRadius:"50%", margin:"0 auto 18px",
                  background:`radial-gradient(circle, ${card.color1}55, ${card.color2}22)`,
                  border:`2px solid ${card.color1}88`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:48, boxShadow:`0 0 24px ${card.color1}55`,
                }}>{card.emoji}</div>
                <div style={{ color:"#fff", fontSize:20, fontWeight:800, marginBottom:12, lineHeight:1.3, letterSpacing:"-0.01em" }}>
                  {card.titulo}
                </div>
                <div style={{ color:"#94a3b8", fontSize:13.5, lineHeight:1.7, marginBottom:18 }}>
                  {card.desc}
                </div>
              </div>
              <div style={{
                background:"#ffffff0d", border:`1px solid ${card.color1}33`,
                borderRadius:12, padding:"10px 14px", fontSize:12, color:"#64748b", lineHeight:1.5,
              }}>
                {card.detalle}
              </div>
            </div>
        }

        {/* Dots */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:20 }}>
          {ONBOARDING_CARDS.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i===idx ? 28 : 8, height:8, borderRadius:4,
              background: i===idx ? `linear-gradient(90deg,${card.color1},${card.color2})` : "#334155",
              cursor:"pointer", transition:"all 0.3s",
            }} />
          ))}
        </div>

        {/* Botones */}
        <button onClick={() => esUltima ? onTerminar() : setIdx(i => i+1)}
          style={{ ...BtnP, width:"100%", padding:14, fontSize:15, marginBottom:10,
            background:`linear-gradient(90deg, ${card.color1}, ${card.color2})`,
            boxShadow:`0 4px 20px ${card.color1}55`, border:"none",
          }}>
          {esUltima ? "🚀 ¡Quiero participar!" : "Siguiente →"}
        </button>
        {!esUltima && (
          <button onClick={onTerminar} style={{ ...Btn({width:"100%", padding:10, fontSize:13}), color:C.muted }}>
            Saltar intro
          </button>
        )}
      </div>
    </div>
  );
}

// ── PANTALLA: BIENVENIDA ECARD ────────────────
function Bienvenida({ participante, onContinuar }) {
  const canvasRef = useRef(null);
  const [compartido, setCompartido] = useState(false);

  useEffect(() => {
    // Mandar WA de bienvenida automático
    if (participante.whatsapp) {
      fetch(`/api/wa-bienvenida?participante_id=${participante.id}`).catch(()=>{});
    }
    // Dibujar ecard
    setTimeout(() => dibujar(), 80);
  }, []);

  function dibujar() {
    const canvas = canvasRef.current; if (!canvas) return;
    const W = 640, H = 400;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Fondo oscuro
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, W, H);

    // Franja superior degradada
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "#7c3aed"); g.addColorStop(0.5, "#1d4ed8"); g.addColorStop(1, "#0891b2");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 6);

    // Franja inferior
    ctx.fillStyle = g; ctx.fillRect(0, H - 6, W, 6);

    // Patrón de puntos decorativos
    ctx.fillStyle = "#ffffff08";
    for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    }

    // Trofeo grande
    ctx.font = "80px serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆", W / 2, 110);

    // Título
    ctx.font = "bold 28px Inter, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("¡Bienvenido al Mundial 2026!", W / 2, 155);

    // Nombre grande
    ctx.font = "bold 38px Inter, Arial, sans-serif";
    const grad2 = ctx.createLinearGradient(0, 0, W, 0);
    grad2.addColorStop(0, "#a78bfa"); grad2.addColorStop(1, "#60a5fa");
    ctx.fillStyle = grad2;
    ctx.fillText(participante.nombre, W / 2, 205);

    // Equipo
    ctx.font = "32px serif";
    ctx.fillText(participante.flag, W/2 - 30, 258);
    ctx.font = "bold 22px Inter, Arial, sans-serif";
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(participante.equipo, W/2 + 20, 258);

    // Subtítulo
    ctx.font = "15px Inter, Arial, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("quienvaaganar.vercel.app  ·  Mundial 2026", W / 2, 310);

    // Badge
    ctx.fillStyle = "#7c3aed33";
    ctx.beginPath(); ctx.roundRect(W/2 - 110, 330, 220, 34, 17); ctx.fill();
    ctx.font = "bold 13px Inter, Arial, sans-serif";
    ctx.fillStyle = "#a78bfa";
    ctx.fillText("⚽ Quiniela entre amigos", W/2, 352);
  }

  async function compartir() {
    const canvas = canvasRef.current; if (!canvas) return;
    const text = `⚽ ¡Me uní a la quiniela del Mundial 2026!\n\n${participante.flag} Voy con *${participante.equipo}*\n\n¿Te apuntas? 👇\n${APP_URL}`;
    if (navigator.share) {
      canvas.toBlob(async blob => {
        try {
          const file = new File([blob], "bienvenida-mundial.png", { type:"image/png" });
          await navigator.share({ title:"¡Me uní al Mundial 2026!", text, files:[file] });
          setCompartido(true);
        } catch(e) {
          if (e.name !== "AbortError") window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
        }
      }, "image/png");
    } else {
      window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
      setCompartido(true);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px" }}>
      <div style={{ maxWidth:480, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:4 }}>¡Ya eres parte del grupo!</h1>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Esta es tu tarjeta de jugador. Compártela con tus amigos para presumir tu equipo.</p>

        <canvas ref={canvasRef} style={{ width:"100%", borderRadius:14, display:"block", marginBottom:16, boxShadow:"0 4px 32px #7c3aed33" }} />

        <button onClick={compartir} style={{ ...Btn({ width:"100%", padding:12, background:"#25D366", color:"#fff", border:"none", fontWeight:600, fontSize:15, marginBottom:10 }) }}>
          {compartido ? "¡Compartido! 🎉" : "📤 Compartir por WhatsApp"}
        </button>
        <button onClick={onContinuar} style={{ ...BtnP, width:"100%", padding:12, fontSize:15 }}>
          Entrar a la quiniela →
        </button>
      </div>
    </div>
  );
}

// ── PANTALLA: UNIRSE ──────────────────────────
function Unirse({ sala, participantes, onJoin }) {
  const [paso, setPaso] = useState(1); // 1=nombre+wa, 2=avatar, 3=equipo+pron
  const [nombre, setNombre] = useState(() => localStorage.getItem("quiniela_nombre") || "");
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem("quiniela_wa") || "");
  const [loginSugerido, setLoginSugerido] = useState(null); // participante existente con ese WA
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [equipo, setEquipo] = useState("");
  const [modoJugador, setModoJugador] = useState(sala.modo === "hibrido" ? "dinero" : sala.modo);
  const [apuesta, setApuesta] = useState(sala.cuota > 0 ? sala.cuota : 100);
  const [pronCamp, setPronCamp] = useState("");
  const [pronSub, setPronSub] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  // Avatar
  const [avatarTab, setAvatarTab] = useState("foto"); // "foto" | "emoji"
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef(null);

  const disponibles = TEAMS;

  useEffect(() => {
    if (pronCamp && pronSub && pronCamp !== pronSub) {
      setTimeout(() => dibujarTarjeta(), 80);
    }
  }, [pronCamp, pronSub]);

  function dibujarTarjeta() {
    const canvas = canvasRef.current; if (!canvas) return;
    const tc = TEAMS.find(x => x.n === pronCamp);
    const ts = TEAMS.find(x => x.n === pronSub);
    if (!tc || !ts) return;
    const W=640,H=420; canvas.width=W; canvas.height=H;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle="#0a0e1a"; ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,W,0);
    g.addColorStop(0,"#7c3aed");g.addColorStop(0.5,"#1d4ed8");g.addColorStop(1,"#0891b2");
    ctx.fillStyle=g; ctx.fillRect(0,0,W,5);
    ctx.fillStyle="#6b7280";ctx.font="12px sans-serif";ctx.textAlign="center";
    ctx.fillText("QUINIELA MUNDIAL 2026 · MI PRONÓSTICO",W/2,32);
    ctx.fillStyle="#f9fafb";ctx.font="bold 20px sans-serif";
    ctx.fillText(nombre||"Tu nombre",W/2,62);
    ctx.strokeStyle="#1f2937";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,78);ctx.lineTo(W-40,78);ctx.stroke();
    ctx.fillStyle="#fbbf24";ctx.font="12px sans-serif";ctx.fillText("CAMPEÓN",W/4,105);
    ctx.font="56px sans-serif";ctx.fillText(tc.f,W/4,168);
    ctx.fillStyle="#f9fafb";ctx.font="bold 16px sans-serif";ctx.fillText(tc.n,W/4,196);
    ctx.fillStyle="#374151";ctx.font="bold 24px sans-serif";ctx.fillText("VS",W/2,162);
    ctx.fillStyle="#9ca3af";ctx.font="12px sans-serif";ctx.fillText("SUBCAMPEÓN",3*W/4,105);
    ctx.font="56px sans-serif";ctx.fillText(ts.f,3*W/4,168);
    ctx.fillStyle="#f9fafb";ctx.font="bold 16px sans-serif";ctx.fillText(ts.n,3*W/4,196);
    ctx.strokeStyle="#1f2937";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(40,218);ctx.lineTo(W-40,218);ctx.stroke();
    ctx.fillStyle="#6b7280";ctx.font="12px sans-serif";
    ctx.fillText("¿Cuál es tu pronóstico? Únete:",W/2,244);
    ctx.fillStyle="#60a5fa";ctx.font="bold 13px sans-serif";
    ctx.fillText(APP_URL,W/2,264);
    ctx.fillStyle="#1f2937";
    ctx.beginPath();ctx.roundRect(W/2-100,280,200,34,17);ctx.fill();
    ctx.fillStyle="#9ca3af";ctx.font="12px sans-serif";
    ctx.fillText(`${sala.nombre}`,W/2,302);
    // ── Franja MarketerIA ──
    ctx.fillStyle="#0d1117"; ctx.fillRect(0,332,W,H-332);
    ctx.strokeStyle="#1f2937";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,332);ctx.lineTo(W,332);ctx.stroke();
    // Badge MarketerIA (izquierda)
    const mg=ctx.createLinearGradient(0,0,180,0);
    mg.addColorStop(0,"#7c3aed"); mg.addColorStop(1,"#1d4ed8");
    ctx.fillStyle=mg; ctx.font="bold 13px sans-serif"; ctx.textAlign="left";
    ctx.fillText("MarketerIA",20,358);
    ctx.fillStyle="#4b5563"; ctx.font="10px sans-serif";
    ctx.fillText("by RoccoGarcini",20,374);
    // Descripción (centro-derecha)
    ctx.textAlign="center";
    ctx.fillStyle="#6b7280"; ctx.font="11px sans-serif";
    ctx.fillText("Calendario · Marcadores · Tips de football · Noticias",W/2+60,354);
    ctx.fillStyle="#4b5563"; ctx.font="10px sans-serif";
    ctx.fillText("¿Cuál es tu pronóstico? Únete y compite 🏆",W/2+60,371);
    ctx.fillStyle="#374151"; ctx.font="9px sans-serif";
    ctx.fillText("quienvaaganar.vercel.app",W/2+60,390);
  }

  async function unirse() {
    if (!nombre.trim() || !equipo) return;
    setLoading(true);

    // WA duplicado ya se maneja en paso 2 con loginSugerido

    // Subir foto si la eligieron
    let avatarUrl = null;
    if (avatarTab === "foto" && avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { contentType: avatarFile.type, upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    const t = TEAMS.find(x => x.n === equipo);
    const { data, error } = await supabase.from("participantes").insert({
      sala_id: sala.id, nombre: nombre.trim(), whatsapp: whatsapp.trim() || null, equipo, flag: t.f,
      modo_jugador: modoJugador || sala.modo,
      apuesta: modoJugador === "dinero" ? (sala.modo === "hibrido" ? 250 : Math.min(apuesta, 500)) : 0,
      points: 0, penalties: 0, eliminado: false,
      pron_camp: pronCamp || null, pron_camp_flag: pronCamp ? TEAMS.find(x=>x.n===pronCamp)?.f : null,
      pron_sub: pronSub || null, pron_sub_flag: pronSub ? TEAMS.find(x=>x.n===pronSub)?.f : null,
      avatar_url: avatarUrl,
      avatar_emoji: avatarTab === "emoji" && avatarEmoji ? avatarEmoji : null,
      password: password.trim() || null,
    }).select().single();
    if (!error && data) onJoin(data);
    else { alert("Error: " + (error?.message || "intenta de nuevo")); setLoading(false); }
  }

  async function compartirWA() {
    const canvas = canvasRef.current;
    const tc = TEAMS.find(x=>x.n===pronCamp), ts = TEAMS.find(x=>x.n===pronSub);
    const tEquipo = TEAMS.find(x=>x.n===equipo);
    const text = [
      `⚽ ¡Estoy siguiendo el Mundial 2026 en *${sala.nombre}*!`,
      ``,
      `🏳️ Mi equipo: *${tEquipo?.f||""} ${equipo}*`,
      pronCamp ? `🏆 Mi pronóstico: *${tc?.f||""} ${pronCamp}* campeón · 🥈 *${ts?.f||""} ${pronSub}* subcampeón` : ``,
      ``,
      `¿Cuál es el tuyo? Únete y compite en la tabla 👇`,
      APP_URL,
      ``,
      `Calendario · Resultados · Noticias del Mundial 2026 🌍🏆`,
    ].filter(Boolean).join("\n");

    // Primero registrar si aún no está registrado
    if (!nombre.trim() || !equipo) { unirse(); return; }

    // Compartir y luego entrar a la quiniela
    const irAQuiniela = () => unirse();

    if (canvas && navigator.share) {
      canvas.toBlob(async blob => {
        try {
          const file = new File([blob], "pronostico-mundial.png", {type:"image/png"});
          await navigator.share({ title:"Mi pronóstico Mundial 2026", text, files:[file] });
        } catch(e) {
          if (e.name !== "AbortError") {
            try { await navigator.share({ title:"Mi pronóstico", text }); } catch(_) {
              window.open("https://wa.me/?text="+encodeURIComponent(text), "_blank");
            }
          }
        }
        irAQuiniela();
      }, "image/png");
      return;
    }
    window.open("https://wa.me/?text="+encodeURIComponent(text), "_blank");
    irAQuiniela();
  }

  // Header de pasos
  const PasoHeader = ({ actual, titulo, subtitulo }) => (
    <div style={{ textAlign:"center", marginBottom:28 }}>
      {/* Dots de progreso */}
      <div style={{ display:"flex", justifyContent:"center", gap:8, marginBottom:18 }}>
        {[1,2,3].map(n => (
          <div key={n} style={{
            width: n === actual ? 24 : 8, height:8, borderRadius:4,
            background: n <= actual ? "linear-gradient(90deg,#7c3aed,#1d4ed8)" : C.border,
            transition:"all 0.3s",
          }} />
        ))}
      </div>
      <h1 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"0 0 6px" }}>{titulo}</h1>
      {subtitulo && <p style={{ color:C.muted, fontSize:13, margin:0 }}>{subtitulo}</p>}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", padding:"32px 20px" }}>
      <div style={{ maxWidth:420, margin:"0 auto" }}>

        {/* ── PASO 2: Avatar ── */}
        {paso === 2 && <>
          <PasoHeader actual={2} titulo="Tu foto de perfil" subtitulo="Opcional — puedes saltarte este paso" />

          {/* Preview grande */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <div style={{ position:"relative" }}>
              <Avatar p={{ avatar_url: avatarPreview, avatar_emoji: avatarEmoji, flag:"⚽" }} size={100} />
              {(avatarEmoji || avatarPreview) && (
                <button onClick={() => { setAvatarEmoji(""); setAvatarFile(null); setAvatarPreview(null); }} style={{ position:"absolute", top:-6, right:-6, width:22, height:22, borderRadius:"50%", background:C.red, border:"none", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            {[{id:"foto",label:"📷 Foto"},{id:"emoji",label:"😀 Emoji"}].map(t=>(
              <button key={t.id} onClick={()=>setAvatarTab(t.id)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background: avatarTab===t.id ? "linear-gradient(90deg,#7c3aed,#1d4ed8)" : C.card, color: avatarTab===t.id ? "#fff" : C.muted }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Foto */}
          {avatarTab === "foto" && (
            <div style={{ textAlign:"center", background:C.card, border:`2px dashed ${C.border}`, borderRadius:14, padding:"28px 20px" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                const f = e.target.files[0]; if (!f) return;
                setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
              }} />
              {avatarPreview
                ? <button onClick={() => fileRef.current.click()} style={{ ...Btn({ padding:"10px 24px", fontSize:13 }) }}>Cambiar foto</button>
                : <>
                    <div style={{ fontSize:40, marginBottom:10 }}>📷</div>
                    <button onClick={() => fileRef.current.click()} style={{ ...BtnP, padding:"12px 28px", fontSize:14 }}>Elegir foto de la galería</button>
                    <div style={{ color:C.muted, fontSize:12, marginTop:10 }}>JPG, PNG o HEIC</div>
                  </>
              }
              {avatarPreview && <div style={{ color:C.green, fontSize:13, marginTop:10 }}>✓ Foto lista</div>}
            </div>
          )}

          {/* Emoji grid */}
          {avatarTab === "emoji" && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px" }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
                {AVATAR_EMOJIS.map(e => (
                  <button key={e} onClick={() => setAvatarEmoji(e)} style={{ width:44, height:44, fontSize:24, background: avatarEmoji===e ? "#7c3aed33" : "transparent", border: avatarEmoji===e ? "2px solid #7c3aed" : `1px solid ${C.border}`, borderRadius:12, cursor:"pointer" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setPaso(3)} style={{ ...BtnP, width:"100%", padding:14, fontSize:15, marginTop:20 }}>
            {avatarPreview || avatarEmoji ? "Siguiente →" : "Saltar este paso →"}
          </button>
          <button onClick={() => setPaso(1)} style={{ ...Btn({ width:"100%", padding:10, fontSize:13, marginTop:8 }), color:C.muted }}>← Atrás</button>
        </>}

        {/* ── PASO 1: Nombre + WA ── */}
        {paso === 1 && <>
          <PasoHeader actual={1} titulo="¿Quién eres?" subtitulo="Con esto te identificamos en la quiniela" />

          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tu nombre</div>
          <input style={{ ...inp, marginBottom:16 }} placeholder="¿Cómo te llamas?" value={nombre} onChange={e=>setNombre(e.target.value)} autoFocus />

          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tu WhatsApp</div>
          <input style={{ ...inp, marginBottom:16 }} placeholder="Ej: 4431234567" type="tel" value={whatsapp} onChange={e=>{ setWhatsapp(e.target.value); setLoginSugerido(null); setLoginError(false); }} />

          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>🔒 Contraseña</div>
          <div style={{ position:"relative", marginBottom:6 }}>
            <input style={{ ...inp }} placeholder="Crea una contraseña" type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} />
            <button onClick={()=>setShowPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          <div style={{ color:C.muted, fontSize:11, marginBottom:24 }}>Solo tú la sabrás — la necesitarás para volver a entrar</div>

          {/* Login sugerido cuando WA ya existe */}
          {loginSugerido && (
            <div style={{ background:"#7c3aed22", border:`1px solid #7c3aed55`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <Avatar p={loginSugerido} size={40} />
                <div>
                  <div style={{ color:C.text, fontWeight:600, fontSize:14 }}>{loginSugerido.nombre}</div>
                  <div style={{ color:C.muted, fontSize:12 }}>{loginSugerido.equipo} {loginSugerido.flag}</div>
                </div>
              </div>
              <div style={{ color:"#c4b5fd", fontSize:13, marginBottom:10 }}>Este número ya está registrado. Escribe tu contraseña para entrar.</div>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input
                  style={{ ...inp, borderColor: loginError ? C.red : C.border }}
                  placeholder="Tu contraseña"
                  type={showLoginPass?"text":"password"}
                  value={loginPassword}
                  onChange={e=>{ setLoginPassword(e.target.value); setLoginError(false); }}
                  autoFocus
                />
                <button onClick={()=>setShowLoginPass(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>
                  {showLoginPass ? "🙈" : "👁️"}
                </button>
              </div>
              {loginError && <div style={{ color:C.red, fontSize:12, marginBottom:10 }}>❌ Contraseña incorrecta. Inténtalo de nuevo.</div>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => {
                  if (!loginSugerido.password) { onJoin(loginSugerido); return; } // cuenta sin contraseña → entrar directo
                  if (loginPassword === loginSugerido.password) { onJoin(loginSugerido); }
                  else { setLoginError(true); }
                }} style={{ ...BtnP, flex:1, padding:10, fontSize:13 }}>
                  Entrar →
                </button>
                <button onClick={() => { setLoginSugerido(null); setLoginPassword(""); setLoginError(false); }} style={{ ...Btn({ padding:10, fontSize:13 }), color:C.muted }}>
                  No soy yo
                </button>
              </div>
            </div>
          )}

          {!loginSugerido && <button onClick={() => {
            if (!nombre.trim()) { alert("Escribe tu nombre para continuar"); return; }
            if (!password.trim()) { alert("Crea una contraseña para proteger tu cuenta"); return; }
            if (whatsapp.trim()) {
              const norm = v => v.replace(/\D/g,"").slice(-10);
              const waNorm = norm(whatsapp.trim());
              const dup = participantes.find(p => norm(p.whatsapp||"") === waNorm);
              if (dup) { setLoginSugerido(dup); return; }
            }
            setPaso(2);
          }} style={{ ...BtnP, width:"100%", padding:14, fontSize:15 }}>
            Siguiente →
          </button>}

        </>}

        {/* ── PASO 3: Equipo + Pronóstico + Entrar ── */}
        {paso === 3 && <>
          <PasoHeader actual={3} titulo="Tu equipo y pronóstico" subtitulo="¿A quién sigue tu corazón?" />

          {/* Resumen pasos anteriores */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px" }}>
            <Avatar p={{ avatar_url: avatarPreview, avatar_emoji: avatarEmoji, flag:"⚽" }} size={36} />
            <div style={{ color:C.text, fontSize:14, fontWeight:500 }}>{nombre}</div>
            <button onClick={() => setPaso(2)} style={{ ...Btn({ padding:"4px 10px", fontSize:11 }), color:C.muted, marginLeft:"auto" }}>Cambiar</button>
          </div>

          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>❤️ Tu equipo · ¿A quién sigue tu corazón?</div>
          <select style={{ ...inp, marginBottom:20 }} value={equipo} onChange={e=>setEquipo(e.target.value)}>
            <option value="">— Elige tu equipo —</option>
            {TEAMS.map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
          </select>

          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>Tu pronóstico</div>
          <p style={{ color:C.muted, fontSize:12, marginBottom:10 }}>¿Quién crees que será el campeón y subcampeón?</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div>
              <div style={{ color:C.muted, fontSize:11, marginBottom:4 }}>🏆 Campeón</div>
              <select style={inp} value={pronCamp} onChange={e=>setPronCamp(e.target.value)}>
                <option value="">— Selecciona —</option>
                {TEAMS.filter(t=>t.n!==pronSub).map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color:C.muted, fontSize:11, marginBottom:4 }}>🥈 Subcampeón</div>
              <select style={inp} value={pronSub} onChange={e=>setPronSub(e.target.value)}>
                <option value="">— Selecciona —</option>
                {TEAMS.filter(t=>t.n!==pronCamp).map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
              </select>
            </div>
          </div>

          {pronCamp && pronSub && pronCamp!==pronSub &&
            <canvas ref={canvasRef} style={{ width:"100%", borderRadius:10, display:"block", marginBottom:12 }} />
          }

          <button style={{ ...BtnP, width:"100%", padding:14, fontSize:15, opacity:(!equipo)?0.4:1, marginBottom:10 }}
            disabled={!equipo||loading} onClick={unirse}>
            {loading ? "Entrando..." : "Entrar a la quiniela →"}
          </button>

          {pronCamp && pronSub && pronCamp!==pronSub && (
            <button onClick={compartirWA} style={{ ...Btn({ width:"100%", padding:11, background:"#25D366", color:"#fff", border:"none", fontWeight:600, fontSize:14 }) }}>
              📤 Compartir pronóstico por WhatsApp
            </button>
          )}

          <button onClick={() => setPaso(2)} style={{ ...Btn({ width:"100%", padding:10, fontSize:13, marginTop:8 }), color:C.muted }}>← Atrás</button>
        </>}

      </div>
    </div>
  );
}

// ── MARKETERIA: DATOS DE FUERZA DE PLANTILLA ─────────────────
const MARKETERIA_TEAMS = [
  { code:"POR", name:"Portugal",            flag:"🇵🇹", score:50.8, avg:40.8, d:5, s3:2  },
  { code:"ARG", name:"Argentina",           flag:"🇦🇷", score:41.3, avg:39.3, d:1, s3:5  },
  { code:"FRA", name:"France",              flag:"🇫🇷", score:40.0, avg:38.0, d:1, s3:2  },
  { code:"TUR", name:"Türkiye",             flag:"🇹🇷", score:38.0, avg:38.0, d:0, s3:3  },
  { code:"NED", name:"Netherlands",         flag:"🇳🇱", score:39.8, avg:37.8, d:1, s3:7  },
  { code:"ESP", name:"Spain",               flag:"🇪🇸", score:43.8, avg:37.8, d:3, s3:5  },
  { code:"GER", name:"Germany",             flag:"🇩🇪", score:43.5, avg:37.5, d:3, s3:4  },
  { code:"URU", name:"Uruguay",             flag:"🇺🇾", score:36.4, avg:36.4, d:0, s3:2  },
  { code:"BRA", name:"Brazil",              flag:"🇧🇷", score:42.3, avg:36.3, d:3, s3:3  },
  { code:"BEL", name:"Belgium",             flag:"🇧🇪", score:42.3, avg:36.3, d:3, s3:3  },
  { code:"ENG", name:"England",             flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", score:38.1, avg:36.1, d:1, s3:3  },
  { code:"COL", name:"Colombia",            flag:"🇨🇴", score:36.0, avg:36.0, d:0, s3:2  },
  { code:"CRO", name:"Croatia",             flag:"🇭🇷", score:38.0, avg:36.0, d:1, s3:5  },
  { code:"USA", name:"USA",                 flag:"🇺🇸", score:35.9, avg:35.9, d:0, s3:2  },
  { code:"SUI", name:"Switzerland",         flag:"🇨🇭", score:35.8, avg:35.8, d:0, s3:4  },
  { code:"KSA", name:"Saudi Arabia",        flag:"🇸🇦", score:35.5, avg:35.5, d:0, s3:4  },
  { code:"AUT", name:"Austria",             flag:"🇦🇹", score:37.4, avg:35.4, d:1, s3:3  },
  { code:"MEX", name:"Mexico",              flag:"🇲🇽", score:34.6, avg:34.6, d:0, s3:2  },
  { code:"CAN", name:"Canada",              flag:"🇨🇦", score:34.5, avg:34.5, d:0, s3:4  },
  { code:"PAN", name:"Panama",              flag:"🇵🇦", score:34.4, avg:34.4, d:0, s3:0  },
  { code:"JPN", name:"Japan",               flag:"🇯🇵", score:34.3, avg:34.3, d:0, s3:3  },
  { code:"NOR", name:"Norway",              flag:"🇳🇴", score:36.3, avg:34.3, d:1, s3:2  },
  { code:"SEN", name:"Senegal",             flag:"🇸🇳", score:34.3, avg:34.3, d:0, s3:2  },
  { code:"ALG", name:"Algeria",             flag:"🇩🇿", score:33.6, avg:33.6, d:0, s3:3  },
  { code:"SCO", name:"Scotland",            flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", score:33.4, avg:33.4, d:0, s3:3  },
  { code:"KOR", name:"Korea Republic",      flag:"🇰🇷", score:32.8, avg:32.8, d:0, s3:5  },
  { code:"QAT", name:"Qatar",               flag:"🇶🇦", score:32.6, avg:32.6, d:0, s3:3  },
  { code:"CIV", name:"Côte D'Ivoire",       flag:"🇨🇮", score:31.6, avg:31.6, d:0, s3:1  },
  { code:"COD", name:"Congo DR",            flag:"🇨🇩", score:31.5, avg:31.5, d:0, s3:1  },
  { code:"ECU", name:"Ecuador",             flag:"🇪🇨", score:30.8, avg:30.8, d:0, s3:2  },
  { code:"SWE", name:"Sweden",              flag:"🇸🇪", score:30.8, avg:30.8, d:0, s3:2  },
  { code:"CZE", name:"Czechia",             flag:"🇨🇿", score:30.7, avg:30.7, d:0, s3:2  },
  { code:"MAR", name:"Morocco",             flag:"🇲🇦", score:32.7, avg:30.7, d:1, s3:2  },
  { code:"IRN", name:"IR Iran",             flag:"🇮🇷", score:30.6, avg:30.6, d:0, s3:1  },
  { code:"EGY", name:"Egypt",               flag:"🇪🇬", score:32.3, avg:30.3, d:1, s3:1  },
  { code:"CPV", name:"Cabo Verde",          flag:"🇨🇻", score:30.3, avg:30.3, d:0, s3:0  },
  { code:"UZB", name:"Uzbekistan",          flag:"🇺🇿", score:30.2, avg:30.2, d:0, s3:1  },
  { code:"PAR", name:"Paraguay",            flag:"🇵🇾", score:29.8, avg:29.8, d:0, s3:0  },
  { code:"CUW", name:"Curaçao",             flag:"🇨🇼", score:29.4, avg:29.4, d:0, s3:0  },
  { code:"NZL", name:"New Zealand",         flag:"🇳🇿", score:29.2, avg:29.2, d:0, s3:1  },
  { code:"HAI", name:"Haiti",               flag:"🇭🇹", score:29.0, avg:29.0, d:0, s3:2  },
  { code:"GHA", name:"Ghana",               flag:"🇬🇭", score:28.5, avg:28.5, d:0, s3:2  },
  { code:"JOR", name:"Jordan",              flag:"🇯🇴", score:28.3, avg:28.3, d:0, s3:1  },
  { code:"AUS", name:"Australia",           flag:"🇦🇺", score:28.3, avg:28.3, d:0, s3:0  },
  { code:"BIH", name:"Bosnia Herzegovina",  flag:"🇧🇦", score:27.7, avg:27.7, d:0, s3:1  },
  { code:"IRQ", name:"Iraq",                flag:"🇮🇶", score:27.4, avg:27.4, d:0, s3:0  },
  { code:"TUN", name:"Tunisia",             flag:"🇹🇳", score:27.0, avg:27.0, d:0, s3:0  },
  { code:"RSA", name:"South Africa",        flag:"🇿🇦", score:25.3, avg:25.3, d:0, s3:0  },
];

const MKTIA_NAME_MAP = {};
MARKETERIA_TEAMS.forEach(t => {
  MKTIA_NAME_MAP[t.name.toLowerCase()] = t;
  MKTIA_NAME_MAP[t.code.toLowerCase()] = t;
});
const MKTIA_ALIASES = {
  "united states": "usa", "estados unidos": "usa", "eua": "usa",
  "brasil": "bra", "brazil": "bra",
  "germany": "ger", "alemania": "ger",
  "france": "fra", "francia": "fra",
  "spain": "esp", "españa": "esp",
  "england": "eng", "inglaterra": "eng",
  "mexico": "mex", "méxico": "mex",
  "netherlands": "ned", "países bajos": "ned", "holland": "ned",
  "turkey": "tur", "türkiye": "tur", "turquía": "tur",
  "south korea": "kor", "korea republic": "kor", "corea del sur": "kor",
  "ivory coast": "civ", "côte d'ivoire": "civ", "cote d'ivoire": "civ",
  "dr congo": "cod", "congo dr": "cod",
  "iran": "irn", "ir iran": "irn",
  "saudi arabia": "ksa",
  "switzerland": "sui", "suiza": "sui",
  "canada": "can", "canadá": "can",
  "czechia": "cze", "czech republic": "cze",
  "bosnia & herzegovina": "bih", "bosnia and herzegovina": "bih",
  "new zealand": "nzl",
  "cabo verde": "cpv", "cape verde": "cpv",
  "curaçao": "cuw", "curacao": "cuw",
  "senegal": "sen",
  "norway": "nor", "noruega": "nor",
};

function mkteriaLookup(name) {
  if (!name) return null;
  const low = name.toLowerCase().trim();
  const alias = MKTIA_ALIASES[low];
  return MKTIA_NAME_MAP[alias || low] || null;
}

function mkteriaPredict(localName, awayName) {
  const local = mkteriaLookup(localName);
  const away  = mkteriaLookup(awayName);
  if (!local || !away) return null;
  const diff = local.score - away.score;
  let pred, label;
  if (diff > 5)       { pred = "local";     label = `${local.name} más fuerte (+${diff.toFixed(1)})`; }
  else if (diff > 2)  { pred = "local";     label = `Ligero favorito ${local.name} (+${diff.toFixed(1)})`; }
  else if (diff < -5) { pred = "visitante"; label = `${away.name} más fuerte (${diff.toFixed(1)})`; }
  else if (diff < -2) { pred = "visitante"; label = `Ligero favorito ${away.name} (${diff.toFixed(1)})`; }
  else                { pred = "empate";    label = `Fuerzas similares (dif ${Math.abs(diff).toFixed(1)})`; }
  return { pred, label, localScore: local.score, awayScore: away.score, local, away };
}

// ── MARKETERIA: PÁGINA COMPLETA ───────────────
function MarketerIA({ onClose, matches, asTab, onTabOpen }) {
  const [seccion, setSeccion] = useState("ranking");
  const [chat, setChat] = useState([
    { role:"assistant", content:"Hola, soy MarketerIA 🤖 Pregúntame lo que quieras sobre los equipos, jugadores o partidos del Mundial 2026. Analizo con datos reales de FIFA." }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [chat]);

  useEffect(() => { onTabOpen?.(); }, []);

  const maxScore = Math.max(...MARKETERIA_TEAMS.map(t => t.score));

  async function enviarPregunta() {
    const q = input.trim();
    if (!q || cargando) return;
    const historial = chat.filter(m => m.role !== "system").map(m => ({ role: m.role, content: m.content }));
    setChat(prev => [...prev, { role:"user", content:q }]);
    setInput("");
    setCargando(true);
    try {
      const r = await fetch("/api/ai?type=marketeria", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ pregunta: q, historial }),
      });
      const d = await r.json();
      setChat(prev => [...prev, { role:"assistant", content: d.respuesta || "Sin respuesta" }]);
    } catch {
      setChat(prev => [...prev, { role:"assistant", content:"Error de conexión, intenta de nuevo." }]);
    }
    setCargando(false);
  }

  const pills = [["ranking","Rankings"],["metodo","Metodología"],["predicciones","Predicciones"],["chat","Chat"]];

  return (
    <div style={asTab ? {} : { position:"fixed", inset:0, background:C.bg, zIndex:900, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      {/* Header — solo en overlay */}
      {!asTab && <div style={{ padding:"12px 16px", borderBottom:`0.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={onClose} style={{ ...Btn(), padding:"6px 10px", fontSize:13 }}>← Volver</button>
        <div style={{ flex:1 }}>
          <div style={{ color:C.text, fontWeight:700, fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ background:"#7c3aed33", padding:"2px 8px", borderRadius:20, fontSize:12, color:"#a78bfa", fontWeight:600 }}>IA</span>
            MarketerIA
          </div>
          <div style={{ color:C.muted, fontSize:11 }}>Análisis FIFA · 1,248 jugadores · 48 selecciones</div>
        </div>
        <div style={{ fontSize:26 }}>🤖</div>
      </div>}

      {/* Perfil */}
      <div style={{ padding:"16px 16px 0", maxWidth:600, margin:"0 auto", width:"100%" }}>
        <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:0 }}>
            No adivino. Calculo. Tomo los <strong style={{ color:C.text }}>11 mejores jugadores</strong> de cada selección,
            promedio sus scores FIFA y agrego bonus por tener figuras <strong style={{ color:"#fbbf24" }}>Diamante</strong>.
            Con esa cifra predigo el resultado más probable.
          </p>
        </div>

        {/* Navegación secciones */}
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:14 }}>
          {pills.map(([k,l]) => (
            <button key={k} onClick={() => setSeccion(k)}
              style={{ ...Btn(), fontSize:12, padding:"6px 14px", flexShrink:0,
                background: seccion===k ? "#7c3aed" : C.card,
                color: seccion===k ? "#fff" : C.muted,
                border: seccion===k ? "none" : `0.5px solid ${C.border}` }}>
              {l}
            </button>
          ))}
        </div>

        {/* SECCIÓN: RANKING */}
        {seccion==="ranking" && (
          <div>
            <div style={{ color:C.muted, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
              Ranking de fuerza de plantilla (score = top-11 avg + Diamantes×2)
            </div>
            {MARKETERIA_TEAMS.map((t, i) => (
              <div key={t.code} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <span style={{ fontSize:12, color:C.muted, minWidth:20, textAlign:"right" }}>{i+1}</span>
                <span style={{ fontSize:16 }}>{t.flag}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:13, color:C.text }}>{t.name}
                      {t.d > 0 && <span style={{ fontSize:10, marginLeft:6, background:"#fbbf2422", color:"#fbbf24", padding:"1px 5px", borderRadius:8 }}>{t.d}💎</span>}
                    </span>
                    <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{t.score}</span>
                  </div>
                  <div style={{ background:C.border, borderRadius:4, height:5, overflow:"hidden" }}>
                    <div style={{ width:`${(t.score/maxScore*100).toFixed(0)}%`, height:5, borderRadius:4, background:"#7c3aed" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN: METODOLOGÍA */}
        {seccion==="metodo" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:"#a78bfa", fontSize:13, fontWeight:600, marginBottom:8 }}>1. Categorizo a los 1,248 jugadores</div>
              {[
                ["💎 Diamante","26 jugadores · score 55+","Messi, Cristiano, Mbappé, Haaland, Kane, Salah, Modric, Neuer...","#fbbf24"],
                ["⭐⭐⭐ 3 Estrellas","106 jugadores · score 45-54","Élite de clubes top europeos, alto rendimiento","#60a5fa"],
                ["⭐⭐ 2 Estrellas","254 jugadores · score 35-44","Titulares sólidos en ligas de primer nivel","#34d399"],
                ["⭐ 1 Estrella","862 jugadores · score < 35","Plantilla completa y jugadores en desarrollo","#6b7280"],
              ].map(([cat,sub,ej,col]) => (
                <div key={cat} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`0.5px solid ${C.border}` }}>
                  <div style={{ fontSize:16, minWidth:24 }} />
                  <div>
                    <div style={{ fontSize:13, color:col, fontWeight:600 }}>{cat}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{sub}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2, fontStyle:"italic" }}>{ej}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:"#a78bfa", fontSize:13, fontWeight:600, marginBottom:8 }}>2. Calculo el score por equipo</div>
              <div style={{ background:"#0a0e1a", borderRadius:8, padding:"10px 14px", fontSize:12, color:C.muted, lineHeight:1.8 }}>
                <div><strong style={{ color:C.text }}>Score final</strong> = promedio top-11 + (Diamantes × 2)</div>
              </div>
            </div>
            <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ color:"#a78bfa", fontSize:13, fontWeight:600, marginBottom:8 }}>3. Predigo el resultado</div>
              {[
                ["Diferencia > 5pts","El más fuerte gana con claridad","#10b981"],
                ["Diferencia 2–5pts","Ligero favorito el más fuerte","#60a5fa"],
                ["Diferencia < 2pts","Empate — fuerzas muy similares","#6b7280"],
              ].map(([reg,desc,col]) => (
                <div key={reg} style={{ display:"flex", gap:10, padding:"6px 0", borderBottom:`0.5px solid ${C.border}` }}>
                  <div style={{ fontSize:12, color:col, fontWeight:600, minWidth:120 }}>{reg}</div>
                  <div style={{ fontSize:12, color:C.muted }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: PREDICCIONES */}
        {seccion==="predicciones" && (
          <div>
            {(!matches || matches.length === 0) ? (
              <div style={{ textAlign:"center", padding:"30px 20px", color:C.muted, fontSize:13 }}>
                No hay partidos cargados aún. Ve a la pestaña ⚽ Mundial primero.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {matches.filter(m => {
                  const ln = m.competitions?.[0]?.competitors?.find(c=>c.homeAway==="home")?.team?.displayName || "";
                  const an = m.competitions?.[0]?.competitors?.find(c=>c.homeAway==="away")?.team?.displayName || "";
                  return mkteriaLookup(ln) && mkteriaLookup(an);
                }).map(m => {
                  const comp = m.competitions?.[0];
                  const local = comp?.competitors?.find(c=>c.homeAway==="home")?.team?.displayName || "";
                  const away  = comp?.competitors?.find(c=>c.homeAway==="away")?.team?.displayName || "";
                  const pred = mkteriaPredict(local, away);
                  if (!pred) return null;
                  const predColors = { local:"#10b981", empate:"#6b7280", visitante:"#60a5fa" };
                  const predLabel = { local:"Gana local", empate:"Empate", visitante:"Gana visitante" };
                  return (
                    <div key={m.id} style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ fontSize:14, color:C.text, fontWeight:500 }}>{local} vs {away}</div>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:predColors[pred.pred]+"22", color:predColors[pred.pred], fontWeight:600 }}>
                          {predLabel[pred.pred]}
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:2 }}>
                            <span>{pred.local.flag} {local}</span><span>{pred.localScore}</span>
                          </div>
                          <div style={{ background:C.border, borderRadius:3, height:4 }}>
                            <div style={{ width:`${(pred.localScore/maxScore*100).toFixed(0)}%`, height:4, borderRadius:3, background:"#7c3aed" }} />
                          </div>
                        </div>
                        <span style={{ fontSize:10, color:C.muted }}>vs</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.muted, marginBottom:2 }}>
                            <span>{pred.away.flag} {away}</span><span>{pred.awayScore}</span>
                          </div>
                          <div style={{ background:C.border, borderRadius:3, height:4 }}>
                            <div style={{ width:`${(pred.awayScore/maxScore*100).toFixed(0)}%`, height:4, borderRadius:3, background:"#1d9e75" }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:C.muted }}>{pred.label}</div>
                    </div>
                  );
                })}
                <div style={{ fontSize:11, color:C.muted, textAlign:"center", padding:"8px 0" }}>
                  Solo se muestran partidos con ambos equipos en el dataset FIFA
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN: CHAT */}
        {seccion==="chat" && (
          <div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
              {chat.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role==="user" ? "flex-end" : "flex-start",
                  display:"inline-block",
                  maxWidth:"85%",
                  background: m.role==="user" ? "#1d4ed8" : C.card,
                  border: `0.5px solid ${m.role==="user" ? "transparent" : C.border}`,
                  borderRadius: m.role==="user" ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
                  padding:"10px 14px",
                  fontSize:13,
                  color:C.text,
                  lineHeight:1.5,
                }}>
                  {m.content}
                </div>
              ))}
              {cargando && (
                <div style={{ alignSelf:"flex-start", display:"inline-block", background:C.card, border:`0.5px solid ${C.border}`, borderRadius:"2px 12px 12px 12px", padding:"10px 14px", fontSize:13, color:C.muted }}>
                  Analizando datos…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display:"flex", gap:8, position:"sticky", bottom:0, paddingBottom:20, background:C.bg }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && enviarPregunta()}
                placeholder="¿Quién va a ganar el grupo A? ¿Qué tan fuerte es México?"
                style={{ ...inp, flex:1, fontSize:13 }}
              />
              <button onClick={enviarPregunta} disabled={cargando || !input.trim()}
                style={{ ...BtnP, padding:"10px 16px", opacity: cargando||!input.trim() ? 0.5 : 1 }}>
                →
              </button>
            </div>
          </div>
        )}

        <div style={{ height:30 }} />
      </div>
    </div>
  );
}

// ── PANTALLA: TABLA PRINCIPAL ─────────────────
function Sala({ sala, miId, onFirstTabChange }) {
  const [participantes, setParticipantes] = useState([]);
  const [tab, setTab] = useState("calendario");
  const tabChangedRef = useRef(false);
  function cambiarTab(k) {
    setTab(k);
    if (!tabChangedRef.current && k !== "calendario") {
      tabChangedRef.current = true;
      onFirstTabChange?.();
    }
  }
  const [sorteoP, setSorteoP] = useState(null);
  const [sorteoOpts, setSorteoOpts] = useState([]);
  const [sorteoChosen, setSorteoChosen] = useState(null);
  const [stage, setStage] = useState(sala.stage || "Grupos");
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(sala.flash || []);
  const [castigoSent, setCastigoSent] = useState(false);
  const [castigoLoading, setCastigoLoading] = useState(false);
  const [waPasswordSent, setWaPasswordSent] = useState(false);
  const [waPasswordLoading, setWaPasswordLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMarketerIA, setShowMarketerIA] = useState(false);
  const [marketeriaMatches, setMarketeriaMatches] = useState([]);
  const [playerModal, setPlayerModal] = useState(null); // jugador seleccionado para ver detalle

  const salaLink = `${APP_URL}/sala/${sala.id}`;
  const yo = participantes.find(p => p.id === miId);
  const ADMIN_WA = "4431406867";
  const esAdmin = yo?.whatsapp?.replace(/\D/g,"").endsWith(ADMIN_WA);

  useEffect(() => {
    // Carga inicial
    supabase.from("participantes").select("*").eq("sala_id", sala.id).order("created_at")
      .then(({ data }) => { if(data) setParticipantes(data); });

    // Realtime
    const ch = supabase.channel("sala-"+sala.id)
      .on("postgres_changes", { event:"*", schema:"public", table:"participantes", filter:`sala_id=eq.${sala.id}` },
        () => {
          supabase.from("participantes").select("*").eq("sala_id",sala.id).order("created_at")
            .then(({data})=>{ if(data) setParticipantes(data); });
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [sala.id]);

  // Detectar PWA instalada y dar +3 pts una sola vez
  useEffect(() => {
    if (!miId || !yo) return;
    if (yo.pwa_bonus) return; // ya se dieron los puntos
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (!isStandalone) return;
    // Dar +3 pts y marcar bono
    supabase.from("participantes")
      .update({ pwa_bonus: true, points: (yo.points || 0) + 3 })
      .eq("id", miId)
      .then(() => {
        // Notificación discreta
        const div = document.createElement("div");
        div.textContent = "🏠 +3 pts por agregar al inicio";
        Object.assign(div.style, { position:"fixed", bottom:"80px", left:"50%", transform:"translateX(-50%)", background:"#7c3aed", color:"#fff", padding:"8px 16px", borderRadius:"20px", fontSize:"13px", fontWeight:"600", zIndex:"9999", pointerEvents:"none" });
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
      });
  }, [miId, yo?.pwa_bonus]);

  async function modPts(id, delta) {
    const p = participantes.find(x=>x.id===id);
    if (!p) return;
    await supabase.from("participantes").update({ points: Math.max(0, p.points+delta) }).eq("id", id);
  }

  async function toggleElim(id) {
    const p = participantes.find(x=>x.id===id);
    if (!p) return;
    await supabase.from("participantes").update({ eliminado: !p.eliminado }).eq("id", id);
  }

  async function addPen(id) {
    const p = participantes.find(x=>x.id===id);
    if (!p) return;
    await supabase.from("participantes").update({ penalties: (p.penalties||0)+1 }).eq("id", id);
  }

  async function toggleFlashAnswer(betId, playerId) {
    const b = flash.find(x=>x.id===betId);
    if (!b) return;
    const won = b.answers?.[playerId];
    const newAnswers = { ...(b.answers||{}), [playerId]: !won };
    const newFlash = flash.map(x=>x.id===betId ? {...x,answers:newAnswers} : x);
    setFlash(newFlash);
    await supabase.from("salas").update({ flash: newFlash }).eq("id", sala.id);
    const p = participantes.find(x=>x.id===playerId);
    if (p) await supabase.from("participantes").update({ points: Math.max(0, p.points+(won?-b.pts:b.pts)) }).eq("id",playerId);
  }

  async function toggleFlashActive(betId) {
    const newFlash = flash.map(x=>x.id===betId ? {...x,active:!x.active} : x);
    setFlash(newFlash);
    await supabase.from("salas").update({ flash: newFlash }).eq("id", sala.id);
  }

  async function updateStage(s) {
    setStage(s);
    await supabase.from("salas").update({ stage: s }).eq("id", sala.id);
  }

  function startSorteo(id) {
    const p = participantes.find(x=>x.id===id); if (!p) return;
    const pool = [...sala.castigos];
    const picked = [];
    while(picked.length < Math.min(3,pool.length)){
      const r=pool[Math.floor(Math.random()*pool.length)];
      if(!picked.includes(r)) picked.push(r);
    }
    setSorteoP(p); setSorteoOpts(picked); setSorteoChosen(null);
  }

  function copiarLink() {
    navigator.clipboard.writeText(salaLink).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  }

  function compartirWA() {
    const nombre = yo?.nombre || "Alguien";
    const equipo = yo ? `${yo.flag} ${yo.equipo}` : "";
    const pronCamp = yo?.pron_camp ? `${yo.pron_camp_flag} ${yo.pron_camp}` : null;
    const pronSub  = yo?.pron_sub  ? `${yo.pron_sub_flag} ${yo.pron_sub}`   : null;
    const lines = [
      `⚽ *${nombre}* te invita a seguir el Mundial 2026 juntos 🏆`,
      ``,
      equipo   ? `🏳️ Mi equipo: *${equipo}*` : ``,
      pronCamp ? `🔮 Mi pronóstico: *${pronCamp}* campeón · 🥈 *${pronSub}* subcampeón` : ``,
      ``,
      `¿Cuál es el tuyo? Únete, compite en la tabla y no te pierdas nada del Mundial 👇`,
      `👉 ${APP_URL}`,
    ].filter(Boolean);
    window.open("https://wa.me/?text="+encodeURIComponent(lines.join("\n")),"_blank");
  }

  const sorted = [...participantes].sort((a,b)=>b.points-a.points);
  const medals = ["🥇","🥈","🥉"];
  const curPts = STAGES.find(s=>s.n===stage)?.p||1;
  const jugsDinero = participantes.filter(p => p.modo_jugador==="dinero" || sala.modo==="dinero");
  const pagos = (sala.modo==="dinero"||sala.modo==="hibrido") ? calcPagos(jugsDinero, sala.cuota) : [];
  const balances = (() => {
    const n=participantes.length; const b={};
    participantes.forEach(p=>{b[p.id]=0;});
    participantes.forEach(p=>{ if(p.penalties>0){ const d=p.penalties*sala.cuota; b[p.id]-=d; participantes.forEach(o=>{if(o.id!==p.id)b[o.id]+=d/(n-1);}); } });
    return b;
  })();

  const tabStyle=(on)=>({padding:"8px 10px",fontSize:12,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",color:on?C.text:C.muted,borderBottom:`2px solid ${on?C.text:"transparent"}`,fontWeight:on?600:400});

  if (sorteoP) return (
    <div style={{ minHeight:"100vh", background:C.bg, padding:24, fontFamily:"Inter,sans-serif" }}>
      <button style={Btn()} onClick={()=>setSorteoP(null)}>← Volver</button>
      <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:16, marginBottom:6 }}>Castigo para</div>
      <div style={{ color:C.text, fontSize:18, fontWeight:600, marginBottom:14 }}>{sorteoP.flag} {sorteoP.nombre} — {sorteoP.equipo}</div>
      <p style={{ color:C.muted, fontSize:13, marginBottom:12 }}>Elige uno de los 3 castigos sorteados:</p>
      {sorteoOpts.map((c,i) => (
        <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${sorteoChosen===c?C.green:C.red}`, borderRadius:"0 10px 10px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:C.text, fontSize:14, flex:1 }}>{c}</span>
          {!sorteoChosen && <button style={{...BtnR,fontSize:12}} onClick={()=>{ setSorteoChosen(c); if(sala.modo==="dinero") addPen(sorteoP.id); }}>Elegir</button>}
          {sorteoChosen===c && <span style={{ color:C.green, fontWeight:600, fontSize:13 }}>✓ Elegido</span>}
        </div>
      ))}
      {sorteoChosen && <button style={{ ...BtnG, width:"100%", marginTop:12, padding:12 }} onClick={()=>setSorteoP(null)}>Confirmado →</button>}
    </div>
  );

  return (
    <>
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"#0f1829", padding:"16px 20px 0", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ color:C.text, fontSize:17, fontWeight:600 }}>{sala.nombre}</div>
            <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
              {(() => {
                // Partidos restantes: Mundial 2026 tiene 104 juegos (Jun 11 – Jul 19)
                const FASES = [
                  { hasta: new Date("2026-06-28T23:59:59-06:00"), jugados: 0,  total: 72  }, // Grupos
                  { hasta: new Date("2026-07-04T23:59:59-06:00"), jugados: 72, total: 16  }, // R32
                  { hasta: new Date("2026-07-10T23:59:59-06:00"), jugados: 88, total: 8   }, // R16
                  { hasta: new Date("2026-07-13T23:59:59-06:00"), jugados: 96, total: 4   }, // QF
                  { hasta: new Date("2026-07-16T23:59:59-06:00"), jugados: 100, total: 2  }, // SF
                  { hasta: new Date("2026-07-19T23:59:59-06:00"), jugados: 102, total: 2  }, // 3er+Final
                ];
                const hoy = new Date();
                const fase = FASES.find(f => hoy <= f.hasta) || FASES[FASES.length-1];
                // Estima los jugados dentro de la fase actual (proporcional a los días transcurridos)
                const prev = FASES[FASES.indexOf(fase)-1];
                const inicioFase = prev ? prev.hasta : new Date("2026-06-11");
                const diasFase = (fase.hasta - inicioFase) / 86400000;
                const diasTransc = Math.max(0, (hoy - inicioFase) / 86400000);
                const jugadosFase = Math.min(fase.total, Math.floor(fase.total * diasTransc / diasFase));
                const restantes = 104 - (fase.jugados + jugadosFase);
                // Días para la final
                const final = new Date("2026-07-19T18:00:00-05:00");
                const diasFinal = Math.max(0, Math.ceil((final - hoy) / 86400000));
                return <>
                  <span style={{ background:"#1d4ed833", color:"#60a5fa", fontSize:11, padding:"2px 8px", borderRadius:20 }}>
                    ⚽ ~{restantes} partidos por jugar
                  </span>
                  <span style={{ background:C.green+"22", color:C.green, fontSize:11, padding:"2px 8px", borderRadius:20 }}>
                    🏆 {diasFinal > 0 ? `Final en ${diasFinal} días` : "¡Hoy es la Final!"}
                  </span>
                </>;
              })()}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
            <button style={{ ...Btn({fontSize:12}), background:"#25D366", color:"#fff", border:"none" }} onClick={compartirWA}>Invitar</button>
            <button style={{ ...Btn({fontSize:12}) }} onClick={copiarLink}>{copied?"¡Copiado!":"Copiar link"}</button>
            <button style={{ ...Btn({fontSize:11}), color:C.muted, padding:"4px 8px" }} onClick={() => { localStorage.removeItem("miId_"+SALA_GLOBAL_ID); localStorage.removeItem("quiniela_wa"); localStorage.removeItem("quiniela_nombre"); localStorage.removeItem("vioIntro"); window.location.reload(); }}>Salir</button>
          </div>
        </div>
        {/* Acumulado siempre visible */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0 0", background:"#7c3aed22", border:`1px solid #7c3aed44`, borderRadius:10, padding:"8px 14px" }}>
          <span style={{ fontSize:22 }}>🏆</span>
          <div>
            <div style={{ color:"#c4b5fd", fontSize:15, fontWeight:700 }}>${(participantes.length * 250).toLocaleString("es-MX")} MXN</div>
            <div style={{ color:C.muted, fontSize:11 }}>Acumulado · {participantes.length} jugadores × $250</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, marginTop:10, overflowX:"auto" }}>
          {[["calendario","⚽ Mundial"],["noticias","Noticias 📰"],["tips","Tips 🧠"],["tabla","Tabla"],["marketeria","MarketerIA 🤖"]].map(([k,l])=>(
            <button key={k} style={tabStyle(tab===k)} onClick={()=>cambiarTab(k)}>{l}</button>
          ))}
        </div>
        {/* Botón Quiniela flotante */}
        {(() => {
          const pronLS = miId ? (() => { try { return Object.keys(JSON.parse(localStorage.getItem(`prons_${miId}`) || "{}")); } catch { return []; } })() : [];
          const sinLlenar = pronLS.length === 0;
          const pocoLlenado = pronLS.length > 0 && pronLS.length < 10;
          const pronosticados = pronLS.length;
          const animar = sinLlenar || pocoLlenado;
          return (
            <div style={{ padding:"10px 16px 4px" }}>
              <style>{`
                @keyframes quinielaPulse {
                  0%,100% { transform:scale(1); box-shadow:0 0 0 0 #7c3aed55; }
                  50% { transform:scale(1.03); box-shadow:0 0 0 8px #7c3aed00; }
                }
                @keyframes quinielaShake {
                  0%,100%{transform:translateX(0)}
                  20%{transform:translateX(-4px)}
                  40%{transform:translateX(4px)}
                  60%{transform:translateX(-3px)}
                  80%{transform:translateX(3px)}
                }
              `}</style>
              <button onClick={()=>cambiarTab("quiniela")} style={{
                width:"100%", padding:"13px 16px",
                background: tab==="quiniela"
                  ? "linear-gradient(135deg,#7c3aed,#a855f7)"
                  : sinLlenar
                    ? "linear-gradient(135deg,#dc2626,#7c3aed)"
                    : "linear-gradient(135deg,#4f46e5,#7c3aed)",
                border: tab==="quiniela" ? "2px solid #a78bfa" : sinLlenar ? "2px solid #f87171" : "2px solid #6d28d9",
                borderRadius:14, cursor:"pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                animation: animar && tab!=="quiniela" ? "quinielaPulse 1.8s ease-in-out infinite" : "none",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24, display:"inline-block", animation: sinLlenar && tab!=="quiniela" ? "quinielaShake 2.5s ease-in-out infinite" : "none" }}>🎯</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ color:"#fff", fontWeight:700, fontSize:15 }}>
                      Mi Quiniela
                      {sinLlenar && <span style={{ marginLeft:8, fontSize:10, background:"#f8717133", color:"#fca5a5", padding:"2px 7px", borderRadius:10, fontWeight:600 }}>¡Sin llenar!</span>}
                      {pocoLlenado && <span style={{ marginLeft:8, fontSize:10, background:"#fbbf2433", color:"#fde68a", padding:"2px 7px", borderRadius:10, fontWeight:600 }}>{pronosticados} pronósticos</span>}
                    </div>
                    <div style={{ color: sinLlenar ? "#fca5a5" : "#c4b5fd", fontSize:11 }}>
                      {sinLlenar ? "⚠️ ¡Llena tus pronósticos antes de que inicien!" : pocoLlenado ? "Tienes partidos sin pronosticar" : "Llena tus pronósticos aquí"}
                    </div>
                  </div>
                </div>
                <span style={{ color: sinLlenar ? "#f87171" : "#a78bfa", fontSize:18, fontWeight:700 }}>→</span>
              </button>
            </div>
          );
        })()}
      </div>

      <div style={{ padding:"20px 16px", maxWidth:600, margin:"0 auto" }}>

        {tab==="tabla" && <>
          {esAdmin && <AdminBonusPanel salaId={sala.id} participantes={participantes} />}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {STAGES.map(s=>(
              <button key={s.n} style={stage===s.n?{...BtnP,fontSize:12}:{...Btn(),fontSize:12}} onClick={()=>updateStage(s.n)}>
                {s.n} ({s.p}pt)
              </button>
            ))}
          </div>
          {sorted.map((p,i)=>{
            const esMktIA = p.id === MARKETERIA_ID;
            return (
            <div key={p.id} onClick={()=>setPlayerModal(p)} style={{ ...cardStyle, opacity:p.eliminado?0.55:1,
              border:`0.5px solid ${esMktIA?"#7c3aed66":p.id===miId?C.blue:C.border}`,
              background: esMktIA?"#0d0a1f":C.card, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:14, minWidth:22 }}>{medals[i]||i+1}</span>
                  {esMktIA
                    ? <div style={{ width:38,height:38,borderRadius:"50%",background:"#7c3aed33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>🤖</div>
                    : <Avatar p={p} size={38} />}
                  <div>
                    <div style={{ color:C.text, fontWeight:500, fontSize:14 }}>
                      {p.nombre}
                      {esMktIA && <span style={{ background:"#7c3aed33",color:"#a78bfa",fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6,fontWeight:600 }}>IA</span>}
                      {!esMktIA && p.id===miId && <span style={{ background:C.blue+"33",color:C.blue,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>Tú</span>}
                      {!esMktIA && (sala.modo==="hibrido"||sala.modo==="dinero") && p.modo_jugador==="dinero" && <span style={{ fontSize:11, marginLeft:5, color:"#fbbf24" }}>💰${p.apuesta||0}</span>}
                      {!esMktIA && sala.modo==="hibrido" && p.modo_jugador!=="dinero" && <span style={{ fontSize:10, marginLeft:5, background:"#ffffff15", color:C.muted, padding:"2px 7px", borderRadius:10, border:`0.5px solid ${C.border}` }}>🎲 Sin apuesta</span>}
                      {!esMktIA && p.sellada && <span style={{ background:"#5b21b622",color:"#a78bfa",fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>🔐 Sellada</span>}
                      {!esMktIA && p.eliminado && <span style={{ background:C.red+"22",color:C.red,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>Eliminado</span>}
                      {!esMktIA && !p.eliminado&&p.penalties>0 && <span style={{ background:C.red+"22",color:C.red,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>{p.penalties} castigo{p.penalties>1?"s":""}</span>}
                    </div>
                    <div style={{ color:C.muted, fontSize:12 }}>
                      {p.equipo}
                      {!esMktIA && p.pron_camp && <span style={{ marginLeft:6, fontSize:11, color:"#60a5fa" }}>🏆{p.pron_camp_flag} vs 🥈{p.pron_sub_flag}</span>}
                      {esMktIA && <span style={{ marginLeft:6, fontSize:11, color:"#60a5fa" }}>🏆🇵🇹 vs 🥈🇪🇸</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {esMktIA && <button onClick={()=>cambiarTab("marketeria")} style={{ ...Btn({padding:"4px 10px",fontSize:11,color:"#a78bfa",border:`0.5px solid #7c3aed44`}) }}>Ver análisis →</button>}
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:700, color:i===0&&p.points>0?C.gold:C.text }}>{p.points}</div>
                    <div style={{ color:C.muted, fontSize:10 }}>pts</div>
                  </div>
                </div>
              </div>
              {esAdmin && showAdminPanel && !esMktIA && (
                <div onClick={e=>e.stopPropagation()} style={{ display:"flex", gap:6, marginTop:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                  <button style={{...BtnG,fontSize:12}} onClick={()=>modPts(p.id,curPts)}>+{curPts}</button>
                  <button style={{...BtnR,fontSize:12}} onClick={()=>modPts(p.id,-curPts)}>−{curPts}</button>
                  <button style={{...Btn(),fontSize:12}} onClick={()=>toggleElim(p.id)}>{p.eliminado?"Reactivar":"Elim. equipo"}</button>
                  {(sala.modo==="dinero"||(sala.modo==="hibrido"&&p.modo_jugador==="dinero")) && <button style={{...BtnW,fontSize:12}} onClick={()=>addPen(p.id)}>+castigo 💰</button>}
                </div>
              )}
            </div>
            );
          })}
          {participantes.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
              <p style={{ color:C.muted }}>Aún no hay participantes. Comparte el link para que entren.</p>
              <button style={{ ...Btn({background:"#25D366",color:"#fff",border:"none",marginTop:12,padding:"10px 24px"}) }} onClick={compartirWA}>
                Compartir por WhatsApp
              </button>
            </div>
          )}

          {sorted.length >= 2 && (() => {
            const ultimo = sorted[sorted.length - 1];
            async function mandarCastigo() {
              if (!ultimo.whatsapp) { alert("Este participante no tiene WhatsApp registrado 😅"); return; }
              setCastigoLoading(true);
              try {
                const r = await fetch(`/api/wa-castigo?sala_id=${encodeURIComponent(sala.id)}&participante_id=${encodeURIComponent(ultimo.id)}`);
                const data = await r.json();
                if (data.ok) { setCastigoSent(true); alert(`✅ Castigo enviado a ${ultimo.nombre} por WhatsApp 😈`); }
                else { alert("Hubo un error al enviar el mensaje 😅"); }
              } catch(e) { alert("Error de conexión"); }
              setCastigoLoading(false);
            }
            return (
              <div style={{ marginTop:16, background:"#1a0a0a", border:`1px solid ${C.red}44`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ color:C.red, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>💀 Último lugar</div>
                    <div style={{ color:C.text, fontSize:14, fontWeight:500, marginTop:2 }}>
                      {ultimo.flag} {ultimo.nombre} · {ultimo.points} pts
                    </div>
                    {!ultimo.whatsapp && <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>Sin WhatsApp registrado</div>}
                  </div>
                  {esAdmin && showAdminPanel && (
                    <button
                      style={{ ...BtnR, fontSize:12, opacity:castigoSent||castigoLoading?0.6:1 }}
                      onClick={mandarCastigo}
                      disabled={castigoSent||castigoLoading}
                    >
                      {castigoLoading?"Enviando…":castigoSent?"✓ Enviado":"😈 Mandar castigo"}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

        </>}

        {tab==="flash" && <>
          {!flash.length && <p style={{ color:C.muted, fontSize:13 }}>No hay apuestas flash en esta sala.</p>}
          {flash.map(b=>(
            <div key={b.id} style={{ ...cardStyle, border:b.active?`2px solid ${C.gold}`:`0.5px solid ${C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ flex:1 }}>
                  <span style={{ background:C.gold+"22",color:C.gold,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:600 }}>{b.pts}pts</span>
                  <span style={{ color:C.text,fontSize:13,marginLeft:8 }}>{b.q}</span>
                </div>
                {esAdmin && <button style={{...BtnW,fontSize:12}} onClick={()=>toggleFlashActive(b.id)}>{b.active?"Activa":"Activar"}</button>}
              </div>
              {b.active && <div style={{ marginTop:10 }}>
                <div style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>¿Quién acertó?</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {participantes.map(p=>(
                    <button key={p.id} style={b.answers?.[p.id]?{...BtnG,fontSize:12}:{...Btn(),fontSize:12}} onClick={()=>toggleFlashAnswer(b.id,p.id)}>
                      {p.flag} {p.nombre}{b.answers?.[p.id]?" ✓":""}
                    </button>
                  ))}
                </div>
              </div>}
            </div>
          ))}
        </>}

        {tab==="castigos" && <>
          <p style={{ color:C.muted,fontSize:13,marginBottom:12 }}>Selecciona al jugador que perdió para sortear 3 castigos.</p>
          {participantes.map(p=>(
            <div key={p.id} style={{ ...cardStyle, display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:22 }}>{p.flag}</span>
                <div><div style={{ color:C.text,fontWeight:500,fontSize:14 }}>{p.nombre}</div><div style={{ color:C.muted,fontSize:12 }}>{p.equipo}</div></div>
              </div>
              <button style={{...BtnR,fontSize:12}} onClick={()=>startSorteo(p.id)}>Sortear castigo</button>
            </div>
          ))}
        </>}

        {tab==="quiniela" && (
          <QuinielaTab miId={miId} salaId={sala.id} yo={yo} participantes={participantes} esAdmin={esAdmin} />
        )}

        {tab==="cuentas" && <>
          {sala.modo!=="dinero" && sala.modo!=="hibrido"
            ? <p style={{ color:C.muted,fontSize:13 }}>Esta quiniela es de retos, sin dinero.</p>
            : <>
              <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>Solo referencia. El dinero lo mueven ustedes.</p>
              {participantes.map(p=>{
                const v=Math.round(balances[p.id]||0);
                return(
                  <div key={p.id} style={{ ...cardStyle, display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <Avatar p={p} size={34} />
                      <div><div style={{ color:C.text,fontWeight:500,fontSize:14 }}>{p.nombre}</div><div style={{ color:C.muted,fontSize:12 }}>{p.penalties||0} castigo{p.penalties!==1?"s":""}</div></div>
                    </div>
                    <div style={{ fontSize:16,fontWeight:700,color:v>0?C.green:v<0?C.red:C.muted }}>{v>0?"+":""}{v===0?"—":"$"+Math.abs(v).toLocaleString()}</div>
                  </div>
                );
              })}
              {pagos.length>0 && <>
                <div style={{ color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:"0.08em",margin:"16px 0 10px" }}>Quién le paga a quién</div>
                {pagos.map((pg,i)=>(
                  <div key={i} style={{ ...cardStyle, borderLeft:`3px solid ${C.red}`,borderRadius:"0 10px 10px 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ fontSize:14,color:C.text }}>
                      <span style={{ fontWeight:600 }}>{pg.fromP?.flag} {pg.fromP?.nombre}</span>
                      <span style={{ color:C.muted }}> le paga a </span>
                      <span style={{ fontWeight:600 }}>{pg.toP?.flag} {pg.toP?.nombre}</span>
                    </div>
                    <div style={{ fontSize:18,fontWeight:700,color:C.red }}>${Math.round(pg.amt).toLocaleString()}</div>
                  </div>
                ))}
                <p style={{ color:C.muted,fontSize:11,marginTop:8 }}>Efectivo, transferencia, lo que quieran.</p>
              </>}
              {!pagos.length && <p style={{ color:C.muted,fontSize:13,marginTop:8 }}>Nadie debe nada aún.</p>}
            </>
          }
        </>}

        {tab==="calendario" && <Calendario salaLink={salaLink} yo={yo} miId={miId} salaId={sala.id} />}

        {tab==="noticias" && <Noticias />}

        {playerModal && (
          {bonusPopup && (() => {
            const now = new Date();
            const sinResponder = bonusPreguntas.filter(q => q.activa && !q.respuesta_correcta && (!q.fecha_cierre || new Date(q.fecha_cierre) > now) && !misRespBonus[q.id]);
            if (!sinResponder.length) return null;
            return (
              <div style={{ position:"fixed", inset:0, background:"#000a", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
                <div style={{ background:C.card, borderRadius:20, padding:24, width:"100%", maxWidth:400, border:`1px solid #7c3aed55` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <span style={{ fontWeight:700, fontSize:16, color:C.text }}>⭐ Pregunta bonus</span>
                    <button onClick={() => setBonusPopup(false)} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
                  </div>
                  {sinResponder.map(q => (
                    <BonusCard key={q.id} q={q} yaRespondida={misRespBonus[q.id]} onGuardar={async (id, resp) => {
                      await guardarRespBonus(id, resp);
                      setBonusPopup(false);
                    }} />
                  ))}
                </div>
              </div>
            );
          })()}
          <PlayerModal
            jugador={playerModal}
            salaId={sala.id}
            matches={marketeriaMatches}
            onClose={()=>setPlayerModal(null)}
            loadMatches={async () => {
              if (!marketeriaMatches.length) {
                try {
                  const r = await fetch(`/api/fotmob?endpoint=scoreboard&dates=20260611-20260701`);
                  const d = await r.json();
                  setMarketeriaMatches(d.events || []);
                } catch {}
              }
            }}
          />
        )}
        {tab==="tips" && <TipsInfo />}

        {tab==="marketeria" && <MarketerIA asTab matches={marketeriaMatches} onTabOpen={async () => {
          if (!marketeriaMatches.length) {
            try {
              // Cargar todos los partidos de la fase de grupos (11 Jun – 1 Jul 2026)
              const r = await fetch(`/api/fotmob?endpoint=scoreboard&dates=20260611-20260701`);
              const d = await r.json();
              setMarketeriaMatches(d.events || []);
            } catch {}
          }
        }} />}

      </div>
    </div>
    {showMarketerIA && (
      <MarketerIA onClose={() => setShowMarketerIA(false)} matches={marketeriaMatches} />
    )}
    </>
  );
}

// ── TAB: QUINIELA ─────────────────────────────
function LlenarConIA({ miId, salaId, matches, misProns, lsKey, tipsUsados, isPlaceholder, onDone }) {
  const [llenando, setLlenando] = useState(false);

  async function llenar() {
    if (!miId || llenando) return;
    setLlenando(true);
    const pendientes = matches.filter(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const homeName = home?.team?.shortDisplayName || home?.team?.location || "";
      const awayName = away?.team?.shortDisplayName || away?.team?.location || "";
      const state = comp?.status?.type?.state;
      const locked = state === "in" || state === "post" || new Date(ev.date) <= new Date();
      return !locked && !isPlaceholder(homeName) && !isPlaceholder(awayName) && !misProns[ev.id];
    }).map(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      return { id: ev.id, local: home?.team?.shortDisplayName || home?.team?.location || "?", away: away?.team?.shortDisplayName || away?.team?.location || "?" };
    });

    // Si no hay pendientes, pedir revisión de partidos futuros ya llenos
    const objetivo = pendientes.length ? pendientes : matches.filter(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      const homeName = home?.team?.shortDisplayName || home?.team?.location || "";
      const awayName = away?.team?.shortDisplayName || away?.team?.location || "";
      const state = comp?.status?.type?.state;
      const locked = state === "in" || state === "post" || new Date(ev.date) <= new Date();
      return !locked && !isPlaceholder(homeName) && !isPlaceholder(awayName);
    }).slice(0,20).map(ev => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      return { id: ev.id, local: home?.team?.shortDisplayName || home?.team?.location || "?", away: away?.team?.shortDisplayName || away?.team?.location || "?" };
    });
    if (!objetivo.length) { setLlenando(false); return; }
    const soloRevision = !pendientes.length;

    try {
      let nuevasProns = { ...misProns };
      const sugerencias = {};
      for (let i = 0; i < objetivo.length; i += 30) {
        const lote = objetivo.slice(i, i + 30);
        const r = await fetch("/api/ai?type=recomendar", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ partidos: lote }) });
        const data = await r.json();
        if (!data.predicciones) continue;
        for (const p of data.predicciones) {
          if (soloRevision) {
            sugerencias[p.id] = p.pred;
          } else {
            nuevasProns[p.id] = p.pred;
          }
        }
      }
      if (soloRevision) {
        // Mostrar cuántos coinciden vs difieren
        const difs = Object.entries(sugerencias).filter(([id, pred]) => misProns[id] && misProns[id] !== pred).length;
        const coinciden = Object.entries(sugerencias).filter(([id, pred]) => misProns[id] && misProns[id] === pred).length;
        alert(`🤖 Revisión IA de tus próximos partidos:\n✅ ${coinciden} coinciden con tu quiniela\n⚠️ ${difs} difieren de tu quiniela\n\nLa IA no cambia tus pronósticos existentes — solo te da contexto.`);
      } else {
        try { localStorage.setItem(lsKey, JSON.stringify(nuevasProns)); } catch {}
        const rows = Object.entries(nuevasProns)
          .filter(([id]) => objetivo.find(p => String(p.id) === String(id)))
          .map(([match_id, prediccion]) => ({ participante_id: miId, sala_id: salaId, match_id, prediccion, usa_ia: true }));
        if (rows.length) await supabase.from("pronosticos_partidos").upsert(rows, { onConflict:"participante_id,match_id" });
        onDone(nuevasProns);
      }
    } catch(e) { console.error(e); }
    setLlenando(false);
  }

  const pendientesCount = matches.filter(ev => {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === "home");
    const away = comp?.competitors?.find(c => c.homeAway === "away");
    const homeName = home?.team?.shortDisplayName || home?.team?.location || "";
    const awayName = away?.team?.shortDisplayName || away?.team?.location || "";
    const state = comp?.status?.type?.state;
    const locked = state === "in" || state === "post" || new Date(ev.date) <= new Date();
    return !locked && !isPlaceholder(homeName) && !isPlaceholder(awayName) && !misProns[ev.id];
  }).length;

  return (
    <button onClick={llenar} disabled={llenando}
      style={{ width:"100%", padding:"12px", borderRadius:10, border:`1px solid #7c3aed55`,
        background: llenando ? "#7c3aed22" : "linear-gradient(90deg,#7c3aed22,#1d4ed822)",
        color:"#a78bfa", fontFamily:"inherit", fontSize:13, fontWeight:600,
        cursor: llenando ? "wait" : "pointer", marginBottom:4,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      {llenando
        ? <><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⚙️</span> {pendientesCount > 0 ? `Llenando ${pendientesCount} partidos…` : "Cargando sugerencias…"}</>
        : pendientesCount > 0
          ? <>🤖 Llenar {pendientesCount} partidos con IA</>
          : <>🤖 Pedir ayuda de MarketerIA</>}
    </button>
  );
}

function pronSello(misProns) {
  // Sello único basado en las predicciones actuales — cambia si editas cualquier pronóstico
  return Object.entries(misProns).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}:${v}`).join("|");
}

function AnalisisIA({ misProns, matches, nombre, cacheKey }) {
  const lsKey = cacheKey ? `analisis_${cacheKey}` : null;

  function leerCache() {
    if (!lsKey) return null;
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const { sello, texto } = JSON.parse(raw);
      if (sello !== pronSello(misProns)) return null; // predicciones cambiaron
      return texto;
    } catch { return null; }
  }

  const cached = leerCache();
  const [analisis, setAnalisis] = useState(cached);
  const [loading, setLoading] = useState(false);

  // Si las predicciones cambian y el cache ya no es válido, limpiar
  useEffect(() => {
    if (analisis && lsKey && !leerCache()) setAnalisis(null);
  }, [pronSello(misProns)]);

  async function analizar() {
    setLoading(true);
    const predicciones = Object.entries(misProns).map(([matchId, pred]) => {
      const ev = matches.find(e => String(e.id) === String(matchId));
      const comp = ev?.competitions?.[0];
      const home = comp?.competitors?.find(c => c.homeAway === "home");
      const away = comp?.competitors?.find(c => c.homeAway === "away");
      return {
        local: home?.team?.shortDisplayName || home?.team?.location || "?",
        away: away?.team?.shortDisplayName || away?.team?.location || "?",
        pred,
      };
    }).filter(p => p.local !== "?");

    try {
      const r = await fetch("/api/ai?type=analizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, predicciones }),
      });
      const data = await r.json();
      const texto = data.analisis || "No se pudo generar el análisis.";
      setAnalisis(texto);
      if (lsKey) {
        try { localStorage.setItem(lsKey, JSON.stringify({ sello: pronSello(misProns), texto })); } catch {}
      }
    } catch {
      setAnalisis("Hubo un error al conectar con la IA. Intenta de nuevo.");
    }
    setLoading(false);
  }

  return (
    <div style={{ marginBottom:16 }}>
      {!analisis && !loading
        ? <div>
            <button onClick={analizar}
              style={{ width:"100%", padding:"10px", borderRadius:10, border:`1px solid #7c3aed44`, background:"#7c3aed0a", color:"#a78bfa", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              ✨ Analizar mi quiniela con IA
            </button>
            <div style={{ color:"#6b7280", fontSize:10, textAlign:"center", marginTop:4 }}>Solo por diversión · no afecta tus puntos</div>
          </div>
        : <div style={{ ...cardStyle, border:`1px solid #7c3aed44`, background:"#7c3aed08" }}>
            <div style={{ fontSize:11, color:"#a78bfa", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>✨ Análisis IA de tu quiniela</div>
            {loading
              ? <div style={{ display:"flex", alignItems:"center", gap:8, color:C.muted, fontSize:13 }}>
                  <span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⚙️</span> Analizando tus pronósticos…
                </div>
              : <p style={{ color:C.text, fontSize:13, lineHeight:1.65, margin:0 }}>{analisis}</p>
            }
          </div>
      }
    </div>
  );
}

function JerseyCard({ onGuardar, saving }) {
  const [gLocal, setGLocal] = useState("");
  const [gVisit, setGVisit] = useState("");
  return (
    <div style={{ marginBottom:16, borderRadius:20, overflow:"hidden", border:"2px solid #16a34a88", background:"#052e16" }}>
      <img src="/jersey.png" alt="Jersey" style={{ width:"100%", display:"block" }} />
      <div style={{ padding:"14px 16px" }}>
        <div style={{ color:"#86efac", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>🏆 Concurso · Gana un Jersey</div>
        <div style={{ color:"#fff", fontSize:13, fontWeight:600, marginBottom:12 }}>¿Cuál será el marcador exacto de México vs Korea? Acierta y participas en la rifa de un jersey de la Selección Mexicana.</div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ color:"#86efac", fontSize:11, marginBottom:4 }}>México</div>
            <input type="number" min="0" max="20" value={gLocal} onChange={e=>setGLocal(e.target.value)}
              style={{ ...inp, textAlign:"center", fontSize:22, fontWeight:800, padding:"8px", color:"#fff", background:"#0f3a1f" }} placeholder="0" />
          </div>
          <span style={{ color:"#4ade80", fontSize:22, fontWeight:800 }}>-</span>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ color:"#86efac", fontSize:11, marginBottom:4 }}>Korea</div>
            <input type="number" min="0" max="20" value={gVisit} onChange={e=>setGVisit(e.target.value)}
              style={{ ...inp, textAlign:"center", fontSize:22, fontWeight:800, padding:"8px", color:"#fff", background:"#0f3a1f" }} placeholder="0" />
          </div>
        </div>
        <button onClick={() => { if(gLocal===""||gVisit==="") return; onGuardar(gLocal,gVisit); }}
          disabled={saving || gLocal==="" || gVisit===""}
          style={{ width:"100%", padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(90deg,#16a34a,#15803d)", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", opacity:(saving||gLocal===""||gVisit==="")?0.6:1 }}>
          {saving ? "Guardando…" : "⚽ Confirmar marcador"}
        </button>
        <div style={{ color:"#4ade8066", fontSize:10, textAlign:"center", marginTop:8 }}>Cierra 15 min antes del partido · Jue 18 jun 6:45pm</div>
      </div>
    </div>
  );
}

function BonusCard({ q, yaRespondida, onGuardar }) {
  const initResp = () => {
    if (yaRespondida?.respuesta) return typeof yaRespondida.respuesta === "object" ? yaRespondida.respuesta : { texto: String(yaRespondida.respuesta) };
    return q.tipo === "marcador" ? { local:"", visitante:"" } : q.tipo === "sino" ? { texto:"" } : { texto:"" };
  };
  const [resp, setResp] = useState(initResp);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!yaRespondida);

  async function confirmar() {
    setSaving(true);
    await onGuardar(q.id, resp);
    setSaving(false);
    setSaved(true);
  }

  return (
    <div style={{ ...cardStyle, border:`1px solid #7c3aed44`, background:"#7c3aed08", marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <span style={{ background:"#7c3aed", color:"#e9d5ff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:5, letterSpacing:"0.05em" }}>
          {yaRespondida?.pts_obtenidos != null ? `+${yaRespondida.pts_obtenidos} PTS OBTENIDOS` : "BONUS"}
        </span>
        <span style={{ fontSize:16, fontWeight:700, color:"#a78bfa" }}>+{q.pts}<span style={{ fontSize:10, color:"#7c3aed", fontWeight:400 }}> pts</span></span>
      </div>
      <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:10, lineHeight:1.4 }}>{q.pregunta}</div>
      {saved
        ? <div style={{ fontSize:12, color: yaRespondida?.pts_obtenidos > 0 ? C.green : "#60a5fa" }}>
            {yaRespondida?.pts_obtenidos != null ? `¡Correcto! +${yaRespondida.pts_obtenidos} pts` : "✓ Respuesta guardada"}
          </div>
        : <>
          {q.tipo === "marcador"
            ? <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <input type="number" min="0" max="20" value={resp.local}
                  onChange={e => setResp(p => ({...p, local:e.target.value}))}
                  style={{ ...inp, width:50, textAlign:"center", fontSize:18, fontWeight:700, padding:"6px" }} placeholder="0" />
                <span style={{ color:C.muted, fontSize:16 }}>-</span>
                <input type="number" min="0" max="20" value={resp.visitante}
                  onChange={e => setResp(p => ({...p, visitante:e.target.value}))}
                  style={{ ...inp, width:50, textAlign:"center", fontSize:18, fontWeight:700, padding:"6px" }} placeholder="0" />
              </div>
            : q.tipo === "numero"
            ? <input type="number" value={resp.texto||""} onChange={e => setResp(p => ({...p, texto:e.target.value}))}
                placeholder="Tu número…" style={{ ...inp, marginBottom:10 }} />
            : q.tipo === "sino"
            ? <div style={{ display:"flex", gap:10, marginBottom:10 }}>
                {["Sí","No"].map(op => (
                  <button key={op} onClick={() => setResp({ texto:op })}
                    style={{ flex:1, padding:"10px", borderRadius:10, border:`2px solid ${resp.texto===op?"#7c3aed":"#333"}`, background:resp.texto===op?"#7c3aed22":"transparent", color:resp.texto===op?"#a78bfa":C.muted, fontWeight:700, fontSize:15, cursor:"pointer" }}>
                    {op}
                  </button>
                ))}
              </div>
            : <input type="text" value={resp.texto||""} onChange={e => setResp(p => ({...p, texto:e.target.value}))}
                placeholder="Tu respuesta…" style={{ ...inp, marginBottom:10 }} />
          }
          <button onClick={confirmar} disabled={saving}
            style={{ ...BtnP, width:"100%", fontSize:12, padding:"8px", opacity:saving?0.7:1 }}>
            {saving ? "Guardando…" : "Confirmar pronóstico"}
          </button>
        </>
      }
    </div>
  );
}

function QuinielaTab({ miId, salaId, yo, participantes, esAdmin }) {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [misProns, setMisProns] = useState({});
  const [pronsPts, setPronsPts] = useState({});
  const [bonusPreguntas, setBonusPreguntas] = useState([]);
  const [misRespBonus, setMisRespBonus] = useState({});
  const [bonusPopup, setBonusPopup] = useState(false);
  const [respBonusLoaded, setRespBonusLoaded] = useState(false);
  const JERSEY_CIERRE = new Date("2026-06-18T23:45:00Z");
  const jerseyActivo = new Date() < JERSEY_CIERRE;
  const [jerseyResp, setJerseyResp] = useState(() => { try { return JSON.parse(localStorage.getItem("jersey_resp_"+miId)||"null"); } catch { return null; } });
  const [jerseySaving, setJerseySaving] = useState(false);
  const [savingPron, setSavingPron] = useState(null);
  const [tipsIA, setTipsIA] = useState({});   // { matchId: { loading, pred, razon } }
  const [tipsUsados, setTipsUsados] = useState({}); // { matchId: true } — tip visto
  const [publicando, setPublicando] = useState(false);
  const [quinielaPublicada, setQuinielaPublicada] = useState(() => !!yo?.quiniela_publicada);
  const matchesCache = useRef(null);

  useEffect(() => {
    if (matchesCache.current) { setMatches(matchesCache.current); setLoadingMatches(false); return; }
    Promise.all([
      fetch("/api/fotmob?endpoint=schedule&dates=20260611-20260624").then(r=>r.json()).catch(()=>({events:[]})),
      fetch("/api/fotmob?endpoint=schedule&dates=20260625-20260708").then(r=>r.json()).catch(()=>({events:[]})),
      fetch("/api/fotmob?endpoint=schedule&dates=20260709-20260719").then(r=>r.json()).catch(()=>({events:[]})),
    ]).then(results => {
      const seen = new Set();
      const all = results.flatMap(r => r.events || []).filter(ev => {
        if (seen.has(ev.id)) return false;
        seen.add(ev.id);
        return true;
      }).sort((a,b) => new Date(a.date) - new Date(b.date));
      matchesCache.current = all;
      setMatches(all);
      setLoadingMatches(false);
    });
  }, []);

  const lsKey = miId ? `prons_${miId}` : null;

  useEffect(() => {
    if (!miId) return;
    // Carga local primero para respuesta inmediata
    try {
      const local = JSON.parse(localStorage.getItem(lsKey) || "{}");
      if (Object.keys(local).length) setMisProns(local);
    } catch {}
    // Luego Supabase (fuente de verdad)
    supabase.from("pronosticos_partidos").select("*").eq("participante_id", miId)
      .then(({ data }) => {
        if (!data) return;
        const pm = {}, ptm = {};
        data.forEach(p => {
          pm[p.match_id] = p.prediccion;
          if (p.pts_obtenidos != null) ptm[p.match_id] = p.pts_obtenidos;
        });
        setMisProns(pm);
        setPronsPts(ptm);
        localStorage.setItem(lsKey, JSON.stringify(pm));
      });
  }, [miId]);

  useEffect(() => {
    if (!salaId) return;
    supabase.from("preguntas_bonus").select("*").eq("sala_id", salaId).order("created_at")
      .then(({ data }) => { if (data) setBonusPreguntas(data); });
    if (miId) {
      supabase.from("respuestas_bonus").select("*").eq("participante_id", miId)
        .then(({ data }) => {
          if (!data) return;
          const m = {};
          (data || []).forEach(r => { m[r.pregunta_id] = r; });
          setMisRespBonus(m);
          setRespBonusLoaded(true);
        });
    }
  }, [salaId, miId]);

  useEffect(() => {
    if (!bonusPreguntas.length || !respBonusLoaded) return;
    const now = new Date();
    const sinResponder = bonusPreguntas.filter(q => q.activa && !q.respuesta_correcta && (!q.fecha_cierre || new Date(q.fecha_cierre) > now) && !misRespBonus[q.id]);
    if (sinResponder.length > 0) setBonusPopup(true);
  }, [bonusPreguntas, misRespBonus, respBonusLoaded]);

  function isPlaceholder(name) {
    if (!name) return true;
    // Filtra: "RD32 W1", "RD16 W2", "QF W1", "SF L1", "SF W2", "W1", "2A", "1C", "3RD A/B/F", "TBD"
    return /^(RD\d|QF|SF|W\d|\d[A-Z]|3RD|TBD)/i.test(name.trim());
  }

  async function guardarPron(matchId, pred) {
    if (!miId) return;
    setSavingPron(matchId);
    setMisProns(prev => {
      const next = { ...prev, [matchId]: pred };
      try { localStorage.setItem(lsKey, JSON.stringify(next)); } catch {}
      return next;
    });
    const usaIA = !!tipsUsados[matchId];
    await supabase.from("pronosticos_partidos")
      .upsert({ participante_id: miId, sala_id: salaId, match_id: matchId, prediccion: pred, usa_ia: usaIA }, { onConflict: "participante_id,match_id" });
    setSavingPron(null);
  }

  async function pedirTipIA(ev) {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === "home");
    const away = comp?.competitors?.find(c => c.homeAway === "away");
    const local = home?.team?.shortDisplayName || home?.team?.location || "?";
    const awayName = away?.team?.shortDisplayName || away?.team?.location || "?";
    const matchId = ev.id;

    setTipsIA(prev => ({ ...prev, [matchId]: { loading: true } }));
    setTipsUsados(prev => ({ ...prev, [matchId]: true }));

    // Descuenta 1pt inmediatamente por usar la IA
    if (miId) {
      const yo = participantes.find(p => p.id === miId);
      const ptsActuales = yo?.pts_quiniela || 0;
      await supabase.from("participantes").update({ pts_quiniela: Math.max(0, ptsActuales - 1) }).eq("id", miId);
    }

    try {
      const r = await fetch("/api/ai?type=recomendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partidos: [{ id: matchId, local, away: awayName }] }),
      });
      const data = await r.json();
      const tip = data.predicciones?.[0];
      setTipsIA(prev => ({ ...prev, [matchId]: { loading: false, pred: tip?.pred, razon: tip?.razon || "Sin razón disponible" } }));
    } catch {
      setTipsIA(prev => ({ ...prev, [matchId]: { loading: false, razon: "Error al obtener tip" } }));
    }
  }

  async function guardarJersey(local, visitante) {
    if (!miId || jerseySaving) return;
    setJerseySaving(true);
    const resp = { local, visitante };
    setJerseyResp(resp);
    localStorage.setItem("jersey_resp_"+miId, JSON.stringify(resp));
    await supabase.from("respuestas_bonus")
      .upsert({ participante_id: miId, pregunta_id: "jersey_mexico_korea", respuesta: resp, sala_id: salaId }, { onConflict: "participante_id,pregunta_id" });
    setJerseySaving(false);
  }

  async function guardarRespBonus(preguntaId, respuesta) {
    if (!miId) return;
    setMisRespBonus(prev => ({ ...prev, [preguntaId]: { respuesta } }));
    await supabase.from("respuestas_bonus")
      .upsert({ participante_id: miId, pregunta_id: preguntaId, respuesta }, { onConflict: "participante_id,pregunta_id" });
  }

  function getPhase(dateStr) {
    const d = new Date(dateStr);
    if (d <= new Date("2026-06-27T23:59:59Z")) return "Fase de Grupos";
    if (d <= new Date("2026-07-04T23:59:59Z")) return "Ronda de 32";
    if (d <= new Date("2026-07-09T23:59:59Z")) return "Ronda de 16";
    if (d <= new Date("2026-07-12T23:59:59Z")) return "Cuartos de Final";
    if (d <= new Date("2026-07-16T23:59:59Z")) return "Semifinales";
    return "Final";
  }

  // Lock global: arrancan partidos de Ronda de 32 el 27 jun CDMX = 05:00 UTC
  const LOCK_RONDA32 = new Date("2026-06-27T05:00:00Z");
  const globalLock = new Date() >= LOCK_RONDA32;
  const sellada = !!yo?.sellada;

  function isLocked(ev) {
    if (globalLock || sellada) return true;
    if (quinielaPublicada) return true;
    const state = ev.competitions?.[0]?.status?.type?.state;
    return state === "in" || state === "post" || new Date(ev.date) <= new Date();
  }

  function getResult(ev) {
    const comp = ev.competitions?.[0];
    if (comp?.status?.type?.state !== "post") return null;
    const home = comp.competitors?.find(c => c.homeAway === "home");
    const away = comp.competitors?.find(c => c.homeAway === "away");
    const sH = parseInt(home?.score ?? -1), sA = parseInt(away?.score ?? -1);
    if (sH > sA) return "local";
    if (sA > sH) return "visitante";
    return "empate";
  }

  const pronosticados = Object.keys(misProns).length;
  const misPtsQ = Object.values(pronsPts).reduce((a,b) => a + b, 0);
  const aciertos = Object.values(pronsPts).filter(p => p > 0).length;
  const sorted = [...participantes].sort((a,b) => (b.pts_quiniela||0) - (a.pts_quiniela||0));
  const miLugar = miId ? sorted.findIndex(p => p.id === miId) + 1 : 0;

  const now = new Date();
  const activeBonus = bonusPreguntas.filter(q => {
    const abierta = !q.fecha_apertura || new Date(q.fecha_apertura) <= now;
    const noCerrada = !q.fecha_cierre || new Date(q.fecha_cierre) > now;
    return q.activa && abierta && noCerrada;
  });
  const proximasBonus = bonusPreguntas.filter(q => q.activa && q.fecha_apertura && new Date(q.fecha_apertura) > now);

  const byPhase = {};
  matches.forEach(ev => {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === "home");
    const away = comp?.competitors?.find(c => c.homeAway === "away");
    const homeName = home?.team?.shortDisplayName || home?.team?.location || "";
    const awayName = away?.team?.shortDisplayName || away?.team?.location || "";
    // Ocultar si alguno de los equipos aún es un placeholder (ej. "2A", "3RD B/E/F")
    if (isPlaceholder(homeName) || isPlaceholder(awayName)) return;
    const ph = getPhase(ev.date);
    if (!byPhase[ph]) byPhase[ph] = [];
    byPhase[ph].push(ev);
  });

  return (
    <div>
      {/* Tarjeta jersey México vs Korea */}
      {jerseyActivo && !jerseyResp && (
        <JerseyCard onGuardar={guardarJersey} saving={jerseySaving} />
      )}
      {jerseyActivo && jerseyResp && (
        <div style={{ ...cardStyle, marginBottom:16, border:"1px solid #16a34a44", background:"#052e1666", textAlign:"center", padding:"14px 16px" }}>
          <div style={{ fontSize:24, marginBottom:4 }}>🎽</div>
          <div style={{ color:"#4ade80", fontWeight:700, fontSize:14 }}>¡Marcador registrado!</div>
          <div style={{ color:"#86efac", fontSize:22, fontWeight:800, margin:"6px 0" }}>México {jerseyResp.local} - {jerseyResp.visitante} Korea</div>
          <div style={{ color:"#4ade8099", fontSize:11 }}>Si aciertas, participas en la rifa del jersey 🏆</div>
        </div>
      )}

      {/* Reglas de la quiniela */}
      <div style={{ background:"#0a0e1a", border:"1px solid #7c3aed44", borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
        <div style={{ color:"#a78bfa", fontSize:12, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" }}>📋 Reglas</div>
        {[
          { icon:"🎯", text:"Llenar tu quiniela te da 5 puntos automáticamente." },
          { icon:"✏️", text:"Puedes editar tus pronósticos hasta 15 minutos antes de cada inicio de partido y hasta que arranque la Ronda de 32 (27 jun)." },
          { icon:"🔐", text:"Si publicas tu quiniela y no la editas en ningún momento, serás acreedor de 5 pts extra. También puedes sellarla voluntariamente antes del 27 jun para asegurarlos." },
          { icon:"⚽", text:"Acertar un partido vale 3 pts (Grupos, Octavos y Cuartos), 5 pts en Semis y 10 pts en la Final." },
          { icon:"⭐", text:"Responder las preguntas bonus te da puntos extra y más posibilidades de ganar." },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
            <span style={{ fontSize:14, flexShrink:0 }}>{icon}</span>
            <span style={{ color:C.muted, fontSize:12, lineHeight:1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Acumulado */}
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#db2777)", borderRadius:16, padding:"18px 16px", textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:12, color:"#f9a8d4", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:2 }}>🎰 Acumulado</div>
        <div style={{ fontSize:36, fontWeight:900, color:"#fff" }}>
          ${(participantes.length * 250).toLocaleString("es-MX")}<span style={{ fontSize:14, fontWeight:400, marginLeft:4 }}>MXN</span>
        </div>
        <div style={{ color:"#f9a8d4", fontSize:12, marginTop:2 }}>{participantes.length} jugadores × $250</div>
      </div>

      {/* Mini dashboard */}
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        {[
          { label:"mis pts quiniela", val: misPtsQ, color:C.text },
          { label:"aciertos", val: aciertos, color:C.green },
          { label:"lugar", val: miLugar ? `#${miLugar}/${participantes.length}` : "—", color:"#a78bfa" },
        ].map(({label,val,color}) => (
          <div key={label} style={{ flex:1, background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:700, color }}>{val}</div>
            <div style={{ fontSize:9, color:C.muted, marginTop:2, lineHeight:1.3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:C.muted }}>Pronósticos llenados</span>
        <span style={{ fontSize:11, color:C.muted }}>{pronosticados} / {matches.length || "…"}</span>
      </div>
      <div style={{ height:4, background:C.border, borderRadius:2, marginBottom:16 }}>
        <div style={{ height:"100%", background:"linear-gradient(90deg,#7c3aed,#818cf8)", borderRadius:2, width: matches.length ? `${Math.min(100,(pronosticados/matches.length)*100)}%` : "0%" }} />
      </div>

      {/* Info tip IA + botón llenar */}
      {!loadingMatches && matches.length > 0 && (
        <>
          <div style={{ ...cardStyle, fontSize:11, color:C.muted, display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:16 }}>💡</span>
            <span>Puedes pedir un <strong style={{color:"#a78bfa"}}>tip de IA</strong> por partido para que MarketerIA llene tu pronóstico.</span>
          </div>
          <LlenarConIA miId={miId} salaId={salaId} matches={matches} misProns={misProns} lsKey={lsKey}
            tipsUsados={tipsUsados} isPlaceholder={isPlaceholder}
            onDone={(nuevasProns, nuevasRazones) => {
              setMisProns(nuevasProns);
            }} />
        </>
      )}

      {/* Análisis IA (diversión, sin costo) */}
      {pronosticados >= 5 && (
        <div style={{ marginTop:8 }}>
          <AnalisisIA misProns={misProns} matches={matches} nombre={yo?.nombre} cacheKey={miId} />
        </div>
      )}

      {/* Bonus activas */}
      {activeBonus.length > 0 && <>
        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8, fontWeight:600 }}>Preguntas bonus · activas ahora</div>
        {activeBonus.map(q => (
          <BonusCard key={q.id} q={q} yaRespondida={misRespBonus[q.id]} onGuardar={guardarRespBonus} />
        ))}
      </>}

      {/* Bonus próximas */}
      {proximasBonus.length > 0 && <>
        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", margin:"16px 0 8px", fontWeight:600 }}>Próximas preguntas bonus</div>
        {proximasBonus.map(q => (
          <div key={q.id} style={{ ...cardStyle, display:"flex", alignItems:"center", gap:10, opacity:0.65 }}>
            <span style={{ background:"#7c3aed22", color:"#a78bfa", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:6, border:`0.5px solid #7c3aed44`, whiteSpace:"nowrap" }}>+{q.pts} pts</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#9ca3af" }}>{q.pregunta}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>
                Se abre {new Date(q.fecha_apertura).toLocaleDateString("es-MX",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
            <span style={{ fontSize:12 }}>🔒</span>
          </div>
        ))}
      </>}

      {/* Lista de partidos */}
      {loadingMatches && <p style={{ color:C.muted, textAlign:"center", padding:24, fontSize:13 }}>Cargando partidos…</p>}
      {!loadingMatches && matches.length === 0 && <p style={{ color:C.muted, textAlign:"center", padding:24, fontSize:13 }}>No se pudieron cargar los partidos.</p>}
      {Object.entries(byPhase).map(([phase, evs]) => (
        <div key={phase}>
          <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", margin:"16px 0 8px", fontWeight:600 }}>{phase}</div>
          {evs.map(ev => {
            const comp = ev.competitions?.[0];
            const home = comp?.competitors?.find(c => c.homeAway === "home");
            const away = comp?.competitors?.find(c => c.homeAway === "away");
            const homeName = home?.team?.shortDisplayName || home?.team?.location || "—";
            const awayName = away?.team?.shortDisplayName || away?.team?.location || "—";
            const homeLogo = home?.team?.logo;
            const awayLogo = away?.team?.logo;
            const locked = isLocked(ev);
            const state = comp?.status?.type?.state;
            const live = state === "in";
            const done = state === "post";
            const result = getResult(ev);
            const miPred = misProns[ev.id];
            const miPts = pronsPts[ev.id];

            const btnStyle = (tipo) => {
              const sel = miPred === tipo;
              if (done && sel && result === tipo) return { background:"#10b98122", color:"#34d399", border:`0.5px solid #10b98144` };
              if (done && sel && result !== tipo) return { background:"#ef444422", color:"#f87171", border:`0.5px solid #ef444444` };
              if (sel) return { background:"#1d4ed822", color:"#60a5fa", border:`0.5px solid #1d4ed844` };
              return { background:C.bg, color:C.muted, border:`0.5px solid ${C.border}` };
            };

            return (
              <div key={ev.id} style={{ ...cardStyle, marginBottom:6, opacity: done && !miPred ? 0.45 : 1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:500, overflow:"hidden" }}>
                    {homeLogo && <img src={homeLogo} style={{width:16,height:16,objectFit:"contain",flexShrink:0}} onError={e=>e.target.style.display="none"} />}
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:72 }}>{homeName}</span>
                    <span style={{ color:C.muted, fontSize:10, flexShrink:0 }}>vs</span>
                    {awayLogo && <img src={awayLogo} style={{width:16,height:16,objectFit:"contain",flexShrink:0}} onError={e=>e.target.style.display="none"} />}
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:72 }}>{awayName}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                    {done && miPts != null && (
                      <span style={{ fontSize:11, fontWeight:700, color: miPts > 0 ? C.green : C.muted }}>{miPts > 0 ? `+${miPts}` : "0"}pts</span>
                    )}
                    {live && <span style={{ fontSize:9, padding:"2px 5px", background:"#10b98122", color:"#10b981", borderRadius:4, fontWeight:700 }}>EN VIVO</span>}
                    {!live && !done && <span style={{ fontSize:10, color:C.muted }}>{new Date(ev.date).toLocaleDateString("es-MX",{month:"short",day:"numeric"})}</span>}
                    {done && <span style={{ fontSize:10, color:C.muted, background:C.border+"55", padding:"2px 5px", borderRadius:4 }}>TC {parseInt(home?.score)}-{parseInt(away?.score)}</span>}
                  </div>
                </div>
                {locked
                  ? <div style={{ fontSize:11, color:C.muted, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                      <span>🔒 {live ? "Partido en curso" : done ? "Terminado" : "Bloqueado"}</span>
                      {miPred && <span style={{ color:"#60a5fa" }}>· Tu pronóstico: <strong>{miPred==="local" ? homeName : miPred==="visitante" ? awayName : "Empate"}</strong></span>}
                    </div>
                  : <>
                  <div style={{ display:"flex", gap:5 }}>
                      {[["local",homeName],["empate","Empate"],["visitante",awayName]].map(([tipo,label]) => (
                        <button key={tipo} disabled={!!savingPron}
                          style={{ flex:1, padding:"6px 2px", borderRadius:7, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:500, textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", ...btnStyle(tipo) }}
                          onClick={() => guardarPron(ev.id, tipo)}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {/* Tip IA */}
                    {(() => {
                      const tip = tipsIA[ev.id];
                      if (tip?.loading) return <div style={{ fontSize:10, color:"#a78bfa", marginTop:5 }}>⚙️ Consultando IA…</div>;
                      if (tip?.razon) return (
                        <div style={{ marginTop:5, padding:"5px 8px", background:"#7c3aed15", borderRadius:6, border:"0.5px solid #7c3aed33" }}>
                          <span style={{ fontSize:10, color:"#a78bfa", fontWeight:600 }}>💡 Tip IA: </span>
                          <span style={{ fontSize:10, color:C.muted }}>
                            {tip.pred === "local" ? homeName : tip.pred === "visitante" ? awayName : "Empate"} — {tip.razon}
                          </span>
                        </div>
                      );
                      return (
                        <button onClick={() => pedirTipIA(ev)}
                          style={{ marginTop:5, fontSize:10, color:"#a78bfa", background:"none", border:"0.5px solid #7c3aed44", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                          💡 Pedir tip IA
                        </button>
                      );
                    })()}
                  </>
                }
              </div>
            );
          })}
        </div>
      ))}

      {/* Proyección siguiente ronda */}
      <ProyeccionQuiniela misProns={misProns} matches={matches} />

      {/* Botón publicar / sellar quiniela */}
      <div style={{ marginTop:24, textAlign:"center" }}>
        {globalLock && !sellada && (
          <div style={{ background:"#1a0a00", border:"1px solid #f97316aa", borderRadius:12, padding:"14px 20px", display:"inline-flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🔒</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ color:"#fb923c", fontWeight:700, fontSize:13 }}>Quiniela bloqueada</div>
              <div style={{ color:"#fdba74", fontSize:11 }}>Arrancó la Ronda de 32 — ya no se puede editar</div>
            </div>
          </div>
        )}
        {sellada && (
          <div style={{ background:"#0c0a1e", border:"1px solid #7c3aedaa", borderRadius:12, padding:"14px 20px", display:"inline-flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🔐</span>
            <div style={{ textAlign:"left" }}>
              <div style={{ color:"#a78bfa", fontWeight:700, fontSize:13 }}>Quiniela sellada · +5 pts ganados</div>
              <div style={{ color:"#c4b5fd", fontSize:11 }}>Tu quiniela está sellada permanentemente</div>
            </div>
          </div>
        )}
        {!globalLock && !sellada && quinielaPublicada && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ background:"#052e16", border:"1px solid #16a34a44", borderRadius:12, padding:"14px 20px", display:"inline-flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>🔒</span>
              <div style={{ textAlign:"left" }}>
                <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>Quiniela publicada</div>
                <div style={{ color:"#86efac", fontSize:11 }}>Tus pronósticos quedaron guardados al 100</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
              <button
                style={{ background:"#1f2937", border:"1px solid #374151", borderRadius:12, padding:"12px 18px", color:"#d1d5db", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                onClick={async () => {
                  if (!window.confirm("¿Editar tu quiniela? Los partidos ya iniciados seguirán bloqueados.")) return;
                  await supabase.from("participantes").update({ quiniela_publicada: false }).eq("id", miId);
                  setQuinielaPublicada(false);
                }}
              >✏️ Editar</button>
              <button
                style={{ background:"linear-gradient(135deg,#5b21b6,#7c3aed)", border:"none", borderRadius:12, padding:"12px 18px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 16px #7c3aed44" }}
                onClick={async () => {
                  if (!window.confirm("¿Sellar tu quiniela? Ganarás +5 pts extra pero ya no podrás editarla nunca. ¿Confirmar?")) return;
                  const p = participantes.find(x => x.id === miId);
                  await supabase.from("participantes").update({ sellada: true, sellada_at: new Date().toISOString(), points: (p?.points||0)+5 }).eq("id", miId);
                }}
              >🔐 Sellar · +5 pts</button>
            </div>
            <div style={{ color:"#6b7280", fontSize:10 }}>Sellar = bloqueo permanente a cambio de 5 pts extra</div>
          </div>
        )}
        {!globalLock && !sellada && !quinielaPublicada && (
          <div>
            <button
              style={{ background: publicando ? "#374151" : "linear-gradient(135deg,#16a34a,#15803d)", color:"#fff", border:"none", borderRadius:12, padding:"14px 28px", fontSize:15, fontWeight:700, cursor: publicando ? "default" : "pointer", opacity: publicando ? 0.7 : 1, fontFamily:"inherit", boxShadow:"0 4px 16px #16a34a44" }}
              disabled={publicando}
              onClick={async () => {
                if (!window.confirm("Recuerda que podrás editar tu quiniela hasta que empiece la Ronda de 32 (27 jun). ¿Publicar ahora?")) return;
                setPublicando(true);
                await supabase.from("participantes").update({ quiniela_publicada: true }).eq("id", miId);
                setQuinielaPublicada(true);
                setPublicando(false);
              }}
            >{publicando ? "Publicando…" : "🔒 Publicar mi quiniela"}</button>
            <div style={{ color:"#6b7280", fontSize:11, marginTop:6 }}>Sella antes del 27 jun para ganar +5 pts extra</div>
          </div>
        )}
      </div>

      {/* Pronósticos de campeón */}
      {participantes.some(p => p.pron_camp) && <>
        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", margin:"24px 0 10px", fontWeight:600 }}>🔮 Pronósticos de campeón</div>
        {participantes.filter(p => p.pron_camp).map(p => (
          <div key={p.id} style={{ ...cardStyle, display:"flex", alignItems:"center", gap:12, padding:"10px 14px" }}>
            <Avatar p={p} size={38} />
            <div style={{ flex:1 }}>
              <div style={{ color:C.text, fontWeight:600, fontSize:13 }}>{p.nombre}</div>
              <div style={{ color:C.muted, fontSize:12 }}>🏆 {p.pron_camp_flag} {p.pron_camp} · 🥈 {p.pron_sub_flag} {p.pron_sub}</div>
            </div>
            {(p.points || 0) > 0 && <span style={{ background:C.blue+"22", color:C.blue, fontSize:12, fontWeight:700, padding:"3px 8px", borderRadius:16 }}>{p.points}pts</span>}
          </div>
        ))}
      </>}
    </div>
  );
}

function ProyeccionQuiniela({ misProns, matches }) {
  // Solo partidos de fase de grupos (antes del 28 jun)
  const grupoMatches = matches.filter(ev => new Date(ev.date) <= new Date("2026-06-27T23:59:59Z"));

  // Extraer info de equipos de TODOS los partidos de grupo (no solo los pronosticados)
  const teamInfo = {}; // { name: { logo } }
  const matchPairs = []; // [{ home, away, homeLog, awayLogo }]

  for (const ev of grupoMatches) {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === "home");
    const away = comp?.competitors?.find(c => c.homeAway === "away");
    const h = home?.team?.shortDisplayName || home?.team?.location || "";
    const a = away?.team?.shortDisplayName || away?.team?.location || "";
    if (!h || !a || h.length < 2 || a.length < 2) continue;
    if (/^(RD|QF|SF|W\d|\d[A-Z]|3RD|TBD)/i.test(h) || /^(RD|QF|SF|W\d|\d[A-Z]|3RD|TBD)/i.test(a)) continue;
    teamInfo[h] = { logo: home?.team?.logo };
    teamInfo[a] = { logo: away?.team?.logo };
    matchPairs.push({ id: String(ev.id), home: h, away: a });
  }

  const conPred = matchPairs.filter(m => misProns[m.id]);
  if (conPred.length < 6) return null;

  // Union-Find para agrupar equipos que juegan entre sí
  const parent = {};
  const find = t => { if (parent[t] === undefined) parent[t] = t; if (parent[t] !== t) parent[t] = find(parent[t]); return parent[t]; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent[rb] = ra; };

  // Conectar todos los pares de grupo (incluso sin predicción) para detectar grupos correctamente
  for (const m of matchPairs) union(m.home, m.away);

  // Calcular standings solo con los partidos pronosticados
  const standings = {}; // { teamName: { pts, gf, ga } }
  const init = t => { if (!standings[t]) standings[t] = { pts:0, gf:0, ga:0 }; };

  for (const m of conPred) {
    const pred = misProns[m.id];
    init(m.home); init(m.away);
    if (pred === "local") {
      standings[m.home].pts += 3; standings[m.home].gf += 2; standings[m.away].ga += 2;
    } else if (pred === "visitante") {
      standings[m.away].pts += 3; standings[m.away].gf += 2; standings[m.home].ga += 2;
    } else {
      standings[m.home].pts += 1; standings[m.home].gf += 1; standings[m.home].ga += 1;
      standings[m.away].pts += 1; standings[m.away].gf += 1; standings[m.away].ga += 1;
    }
  }

  // Agrupar equipos por su raíz (union-find)
  const grupos = {};
  for (const team of Object.keys(teamInfo)) {
    const root = find(team);
    if (!grupos[root]) grupos[root] = [];
    grupos[root].push(team);
  }

  // Ordenar grupos de ≥3 equipos por standings
  const sortTeams = teams => teams
    .map(name => ({ name, logo: teamInfo[name]?.logo, ...(standings[name] || { pts:0, gf:0, ga:0 }), dg: (standings[name]?.gf||0) - (standings[name]?.ga||0) }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);

  const gruposList = Object.entries(grupos)
    .filter(([, teams]) => teams.length >= 3)
    .map(([, teams], i) => ({ nombre: `Grupo ${String.fromCharCode(65 + i)}`, equipos: sortTeams(teams) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (!gruposList.length) return null;

  return (
    <div style={{ marginTop:24, marginBottom:8 }}>
      <div style={{ color:"#60a5fa", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, fontWeight:700 }}>
        🔮 Según tu quiniela, así sería la siguiente ronda
      </div>
      <div style={{ color:C.muted, fontSize:11, marginBottom:12 }}>
        Proyección de clasificados — fase de grupos · {conPred.length} partidos pronosticados
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {gruposList.map(({ nombre, equipos }) => (
          <div key={nombre} style={{ background:"#0a1628", border:"1px solid #1d4ed822", borderRadius:10, padding:"10px 12px" }}>
            <div style={{ color:"#3b82f6", fontSize:10, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.06em" }}>{nombre}</div>
            {equipos.map((t, i) => (
              <div key={t.name} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:i<equipos.length-1?4:0, opacity: i >= 2 ? 0.38 : 1 }}>
                <span style={{ fontSize:9, fontWeight:700, width:10, color: i===0?"#fbbf24": i===1?"#9ca3af":"#4b5563" }}>{i+1}</span>
                {t.logo
                  ? <img src={t.logo} style={{ width:14, height:14, objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} />
                  : <span style={{ fontSize:12, flexShrink:0 }}>🏳️</span>}
                <span style={{ fontSize:11, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  color: i===0 ? C.text : i===1 ? "#d1d5db" : "#6b7280",
                  fontWeight: i < 2 ? 600 : 400 }}>{t.name}</span>
                <span style={{ fontSize:9, color:"#6b7280", flexShrink:0 }}>{t.pts}p</span>
              </div>
            ))}
            <div style={{ marginTop:6, borderTop:"0.5px solid #1d4ed822", paddingTop:5, display:"flex", gap:4, flexWrap:"wrap" }}>
              <span style={{ fontSize:9, color:"#4ade80", fontWeight:600 }}>✓</span>
              <span style={{ fontSize:9, color:"#86efac" }}>{equipos[0]?.name}</span>
              {equipos[1] && <><span style={{ fontSize:9, color:"#4b5563" }}>·</span><span style={{ fontSize:9, color:"#86efac" }}>{equipos[1]?.name}</span></>}
            </div>
          </div>
        ))}
      </div>

      {/* Cruces Ronda de 32 */}
      {gruposList.length >= 2 && (() => {
        // Bracket: 1A vs 2B, 1C vs 2D... y 1B vs 2A, 1D vs 2C...
        const cruces = [];
        for (let i = 0; i < gruposList.length; i += 2) {
          const g1 = gruposList[i];
          const g2 = gruposList[i + 1];
          if (!g2) break;
          const w1 = g1.equipos[0], r1 = g1.equipos[1];
          const w2 = g2.equipos[0], r2 = g2.equipos[1];
          if (w1 && r2) cruces.push({ local: w1, visit: r2, label: `1${g1.nombre.slice(-1)} vs 2${g2.nombre.slice(-1)}` });
          if (w2 && r1) cruces.push({ local: w2, visit: r1, label: `1${g2.nombre.slice(-1)} vs 2${g1.nombre.slice(-1)}` });
        }
        if (!cruces.length) return null;
        return (
          <div style={{ marginTop:16 }}>
            <div style={{ color:"#a78bfa", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
              ⚔️ Ronda de 32 · cruces proyectados
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {cruces.map((c, i) => (
                <div key={i} style={{ background:"#0f1423", border:"1px solid #312e5533", borderRadius:9, padding:"8px 12px", display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"flex-end" }}>
                    <span style={{ fontSize:11, color:C.text, fontWeight:600, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.local.name}</span>
                    {c.local.logo ? <img src={c.local.logo} style={{ width:16, height:16, objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} /> : <span>🏳️</span>}
                  </div>
                  <span style={{ color:"#6b7280", fontSize:10, fontWeight:700, flexShrink:0 }}>vs</span>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {c.visit.logo ? <img src={c.visit.logo} style={{ width:16, height:16, objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} /> : <span>🏳️</span>}
                    <span style={{ fontSize:11, color:C.text, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.visit.name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color:"#4b5563", fontSize:10, marginTop:8, textAlign:"center" }}>
              + 4 partidos con los mejores 3ros de grupo (por definirse)
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AdminBonusPanel({ salaId, participantes }) {
  const [preguntas, setPreguntas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ pregunta:"", tipo:"texto", pts:3, fecha_apertura:"", fecha_cierre:"" });
  const [saving, setSaving] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [respuestas, setRespuestas] = useState({}); // { pregunta_id: [{ participante_id, respuesta }] }
  const [showRespDe, setShowRespDe] = useState(null);
  const [jerseyResps, setJerseyResps] = useState(null);
  const [showJersey, setShowJersey] = useState(false);

  useEffect(() => {
    supabase.from("preguntas_bonus").select("*").eq("sala_id", salaId).order("created_at")
      .then(({ data }) => { if (data) setPreguntas(data); });
  }, [salaId]);

  async function cargarJersey() {
    if (showJersey) { setShowJersey(false); return; }
    const { data } = await supabase.from("respuestas_bonus").select("participante_id, respuesta").eq("pregunta_id", "jersey_mexico_korea");
    setJerseyResps(data || []);
    setShowJersey(true);
  }

  async function cargarRespuestas(preguntaId) {
    if (showRespDe === preguntaId) { setShowRespDe(null); return; }
    const { data } = await supabase.from("respuestas_bonus").select("participante_id, respuesta, pts_obtenidos").eq("pregunta_id", preguntaId);
    setRespuestas(prev => ({ ...prev, [preguntaId]: data || [] }));
    setShowRespDe(preguntaId);
  }

  async function crearPregunta() {
    if (!form.pregunta.trim()) return;
    setSaving(true);
    const { data } = await supabase.from("preguntas_bonus").insert({
      sala_id: salaId,
      pregunta: form.pregunta.trim(),
      tipo: form.tipo,
      pts: Number(form.pts),
      fecha_apertura: form.fecha_apertura || null,
      fecha_cierre: form.fecha_cierre || null,
      activa: true,
    }).select().single();
    if (data) setPreguntas(prev => [...prev, data]);
    fetch("/api/wa-broadcast", { method:"POST", headers:{"Content-Type":"application/json","x-cron-secret": import.meta.env.VITE_CRON_SECRET||""}, body: JSON.stringify({ tipo:"bonus", pregunta: form.pregunta.trim(), pts: Number(form.pts) }) }).catch(()=>{});
    setForm({ pregunta:"", tipo:"texto", pts:3, fecha_apertura:"", fecha_cierre:"" });
    setShowForm(false);
    setSaving(false);
  }

  async function toggleActiva(id, activa) {
    await supabase.from("preguntas_bonus").update({ activa }).eq("id", id);
    setPreguntas(prev => prev.map(q => q.id === id ? { ...q, activa } : q));
  }

  async function asignarPts(preguntaId, respuestaCorrecta) {
    const pts = preguntas.find(q => q.id === preguntaId)?.pts || 0;
    await supabase.from("preguntas_bonus").update({ respuesta_correcta: respuestaCorrecta }).eq("id", preguntaId);
    const { data: respuestas } = await supabase.from("respuestas_bonus").select("*").eq("pregunta_id", preguntaId);
    if (!respuestas) return;
    for (const r of respuestas) {
      const texto = typeof r.respuesta === "object" ? JSON.stringify(r.respuesta) : String(r.respuesta);
      const correcto = texto.toLowerCase().includes(respuestaCorrecta.toLowerCase());
      const ptsObtenidos = correcto ? pts : 0;
      await supabase.from("respuestas_bonus").update({ pts_obtenidos: ptsObtenidos }).eq("id", r.id);
      if (correcto) {
        const p = participantes.find(x => x.id === r.participante_id);
        if (p) await supabase.from("participantes").update({ points: (p.points||0) + pts }).eq("id", p.id);
      }
    }
    alert("✅ Puntos bonus asignados");
  }

  async function calcularQuiniela() {
    setCalculando(true);
    try {
      const chunks = await Promise.all([
        fetch("/api/fotmob?endpoint=schedule&dates=20260611-20260624").then(r=>r.json()).catch(()=>({events:[]})),
        fetch("/api/fotmob?endpoint=schedule&dates=20260625-20260708").then(r=>r.json()).catch(()=>({events:[]})),
        fetch("/api/fotmob?endpoint=schedule&dates=20260709-20260719").then(r=>r.json()).catch(()=>({events:[]})),
      ]);
      const seen = new Set();
      const matches = chunks.flatMap(r => r.events || []).filter(ev => { if(seen.has(ev.id)) return false; seen.add(ev.id); return true; });
      const finished = matches.filter(ev => ev.competitions?.[0]?.status?.type?.state === "post");

      let updated = 0;
      for (const ev of finished) {
        const comp = ev.competitions[0];
        const home = comp.competitors?.find(c => c.homeAway === "home");
        const away = comp.competitors?.find(c => c.homeAway === "away");
        const sH = parseInt(home?.score ?? -1), sA = parseInt(away?.score ?? -1);
        const result = sH > sA ? "local" : sA > sH ? "visitante" : "empate";

        const { data: prons } = await supabase.from("pronosticos_partidos").select("*").eq("match_id", ev.id).is("pts_obtenidos", null);
        if (!prons?.length) continue;

        for (const pr of prons) {
          const ptsBase = pr.prediccion === result ? (result === "empate" ? 1 : 2) : 0;
          const ptsReal = ptsBase;
          await supabase.from("pronosticos_partidos").update({ resultado: result, pts_obtenidos: ptsReal }).eq("id", pr.id);
          updated++;
        }
      }
      // Recalcular points totales para cada participante: aciertos + 5 por quiniela publicada
      const { data: allProns } = await supabase.from("pronosticos_partidos").select("participante_id, pts_obtenidos").eq("sala_id", salaId);
      const ptsMap = {};
      for (const pr of (allProns || [])) {
        if (!ptsMap[pr.participante_id]) ptsMap[pr.participante_id] = 0;
        ptsMap[pr.participante_id] += (pr.pts_obtenidos || 0);
      }
      await Promise.all(participantes.map(p => {
        const matchPts = ptsMap[p.id] || 0;
        const quinielaPts = p.quiniela_publicada ? 5 : 0;
        return supabase.from("participantes").update({ points: matchPts + quinielaPts }).eq("id", p.id);
      }));

      alert(`✅ Quiniela calculada: ${updated} pronósticos en ${finished.length} partidos. Puntos actualizados.`);
    } catch(e) {
      alert("Error al calcular: " + e.message);
    }
    setCalculando(false);
  }

  if (!preguntas.length && !showForm) return (
    <div style={{ marginTop:16, background:"#0a0e1a", border:`1px solid #7c3aed33`, borderRadius:12, padding:"12px 16px" }}>
      <div style={{ color:"#a78bfa", fontSize:12, fontWeight:600, marginBottom:8 }}>🎯 Admin · Quiniela</div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <button style={{ ...BtnP, fontSize:12 }} onClick={() => setShowForm(true)}>+ Crear pregunta bonus</button>
        <button style={{ ...Btn(), fontSize:12, opacity:calculando?0.6:1 }} onClick={calcularQuiniela} disabled={calculando}>
          {calculando ? "Calculando…" : "⚽ Calcular quiniela"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop:16, background:"#0a0e1a", border:`1px solid #7c3aed33`, borderRadius:12, padding:"12px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ color:"#a78bfa", fontSize:12, fontWeight:600 }}>🎯 Admin · Quiniela</div>
        <button style={{ ...BtnP, fontSize:11, padding:"4px 10px" }} onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancelar" : "+ Bonus"}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom:12, display:"flex", flexDirection:"column", gap:8 }}>
          <input style={inp} placeholder="Pregunta bonus…" value={form.pregunta} onChange={e => setForm(p => ({...p, pregunta:e.target.value}))} />
          <div style={{ display:"flex", gap:8 }}>
            <select style={{ ...inp, flex:1 }} value={form.tipo} onChange={e => setForm(p => ({...p, tipo:e.target.value}))}>
              <option value="texto">Texto libre</option>
              <option value="numero">Número</option>
              <option value="sino">Sí / No</option>
              <option value="marcador">Marcador exacto</option>
            </select>
            <input type="number" min="1" max="10" style={{ ...inp, width:70 }} placeholder="pts" value={form.pts} onChange={e => setForm(p => ({...p, pts:e.target.value}))} />
          </div>
          <input type="datetime-local" style={inp} value={form.fecha_apertura} onChange={e => setForm(p => ({...p, fecha_apertura:e.target.value}))} />
          <input type="datetime-local" style={inp} value={form.fecha_cierre} onChange={e => setForm(p => ({...p, fecha_cierre:e.target.value}))} placeholder="Cierre (opcional)" />
          <button style={{ ...BtnP, fontSize:12, padding:"8px", opacity:saving?0.7:1 }} onClick={crearPregunta} disabled={saving}>
            {saving ? "Guardando…" : "Guardar pregunta"}
          </button>
        </div>
      )}

      {preguntas.map(q => (
        <div key={q.id} style={{ ...cardStyle, marginBottom:6, padding:"10px 12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.text, fontWeight:500 }}>{q.pregunta}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>+{q.pts}pts · {q.tipo}</div>
            </div>
            <button style={{ ...Btn(), fontSize:11, padding:"3px 8px", color: q.activa ? C.green : C.muted, border:`0.5px solid ${q.activa ? C.green+"44" : C.border}` }}
              onClick={() => toggleActiva(q.id, !q.activa)}>
              {q.activa ? "Activa" : "Inactiva"}
            </button>
          </div>
          {q.activa && !q.respuesta_correcta && (
            <div style={{ marginTop:8, display:"flex", gap:6 }}>
              <input type="text" placeholder="Respuesta correcta para asignar pts…" style={{ ...inp, fontSize:11, padding:"5px 10px" }}
                id={`rc-${q.id}`} />
              <button style={{ ...BtnG, fontSize:11, padding:"5px 10px", whiteSpace:"nowrap" }}
                onClick={() => {
                  const val = document.getElementById(`rc-${q.id}`)?.value;
                  if (val?.trim()) asignarPts(q.id, val.trim());
                }}>Asignar</button>
            </div>
          )}
          {q.respuesta_correcta && <div style={{ fontSize:11, color:C.green, marginTop:6 }}>✓ Resp. correcta: {q.respuesta_correcta}</div>}
          <button onClick={() => cargarRespuestas(q.id)} style={{ ...Btn(), fontSize:10, padding:"2px 8px", marginTop:6 }}>
            {showRespDe === q.id ? "Ocultar respuestas" : "👁 Ver quién contestó"}
          </button>
          {showRespDe === q.id && (
            <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
              {(respuestas[q.id] || []).length === 0
                ? <div style={{ fontSize:11, color:C.muted }}>Nadie ha contestado aún</div>
                : (respuestas[q.id] || []).map(r => {
                    const p = participantes.find(x => x.id === r.participante_id);
                    const respTxt = typeof r.respuesta === "object" ? JSON.stringify(r.respuesta) : String(r.respuesta?.texto || r.respuesta || "—");
                    return (
                      <div key={r.participante_id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.text, background:C.bg, borderRadius:6, padding:"4px 8px" }}>
                        <span>{p?.nombre || "?"}</span>
                        <span style={{ color: r.pts_obtenidos > 0 ? C.green : C.muted }}>{respTxt}</span>
                      </div>
                    );
                  })
              }
            </div>
          )}
        </div>
      ))}

      {/* Concurso Jersey */}
      <div style={{ ...cardStyle, marginTop:8, padding:"10px 12px", border:"1px solid #16a34a44" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"#4ade80", fontWeight:700 }}>🎽 Concurso Jersey · Méx vs Korea</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>Cierra 18 jun 6:45pm</div>
          </div>
          <button onClick={cargarJersey} style={{ ...Btn(), fontSize:11, padding:"3px 8px" }}>
            {showJersey ? "Ocultar" : "👁 Ver respuestas"}
          </button>
        </div>
        {showJersey && (
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:4 }}>
            {(jerseyResps || []).length === 0
              ? <div style={{ fontSize:11, color:C.muted }}>Nadie ha contestado aún</div>
              : (jerseyResps || []).map(r => {
                  const p = participantes.find(x => x.id === r.participante_id);
                  const resp = r.respuesta || {};
                  return (
                    <div key={r.participante_id} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.text, background:C.bg, borderRadius:6, padding:"4px 8px" }}>
                      <span>{p?.nombre || "?"}</span>
                      <span style={{ color:"#4ade80", fontWeight:700 }}>Méx {resp.local} - {resp.visitante} Kor</span>
                    </div>
                  );
                })
            }
            <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Total: {(jerseyResps||[]).length} respuestas</div>
          </div>
        )}
      </div>

      <button style={{ ...Btn(), fontSize:12, width:"100%", marginTop:8, opacity:calculando?0.6:1 }} onClick={calcularQuiniela} disabled={calculando}>
        {calculando ? "Calculando…" : "⚽ Calcular quiniela (partidos terminados)"}
      </button>
    </div>
  );
}

// ── PESTAÑA: TIPS & NOTICIAS ───────────────────
// ── TAB: NOTICIAS ──────────────────────────────
function Noticias() {
  const [noticias, setNoticias] = useState(null);
  const [loadN, setLoadN]       = useState(true);
  const [errN, setErrN]         = useState(null);
  const [filtro, setFiltro]     = useState("all");

  useEffect(() => {
    fetch("/api/noticias")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setNoticias(d.items || []); setLoadN(false); })
      .catch(e => { setErrN(String(e)); setLoadN(false); });
  }, []);

  const fuentes = [
    { id:"all",        label:"Todas" },
    { id:"marca",      label:"Marca" },
    { id:"fifa",       label:"ESPN" },
    { id:"juanfutbol", label:"JuanFútbol" },
  ];

  const visibles = noticias
    ? (filtro === "all" ? noticias : noticias.filter(n => n.source === filtro))
    : [];

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "ahora";
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h/24)}d`;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:14}}>
      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>
        Noticias del Mundial 📰
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {fuentes.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{...Btn(), fontSize:11, padding:"5px 11px",
              background: filtro===f.id ? C.blue : C.card,
              color: filtro===f.id ? "#fff" : C.muted,
              border: filtro===f.id ? `1px solid ${C.blue}` : `1px solid ${C.border}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {loadN && (
        <div style={{textAlign:"center",color:C.muted,fontSize:13,padding:"24px 0"}}>
          Cargando noticias…
        </div>
      )}
      {errN && (
        <div style={{textAlign:"center",color:C.muted,fontSize:12,padding:"16px 0"}}>
          No se pudieron cargar las noticias. Intenta de nuevo más tarde.
        </div>
      )}
      {!loadN && !errN && visibles.length === 0 && (
        <div style={{textAlign:"center",color:C.muted,fontSize:12,padding:"16px 0"}}>
          Sin noticias disponibles en este momento.
        </div>
      )}

      {visibles.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
          style={{textDecoration:"none",display:"block",
            background:C.card, borderRadius:12, overflow:"hidden",
            border:`1px solid ${C.border}`}}>
          {n.image && (
            <img src={n.image} alt="" loading="lazy"
              style={{width:"100%",height:160,objectFit:"cover",display:"block"}}
              onError={e => { e.target.style.display="none"; }} />
          )}
          <div style={{padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{background:n.sourceColor,color:"#fff",fontSize:9,fontWeight:700,
                borderRadius:4,padding:"2px 6px",textTransform:"uppercase",letterSpacing:"0.05em",
                flexShrink:0}}>
                {n.sourceName}
              </span>
              {n.pubDate && (
                <span style={{color:C.muted,fontSize:10}}>{timeAgo(n.pubDate)}</span>
              )}
            </div>
            <div style={{color:C.text,fontSize:13,fontWeight:600,lineHeight:1.45,marginBottom:4}}>
              {n.title}
            </div>
            {n.description && (
              <div style={{color:"#9ca3af",fontSize:11,lineHeight:1.6}}>
                {n.description}{n.description.length >= 200 ? "…" : ""}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ── Componente card de tip con imagen opcional ──
function TipCard({ t, accent }) {
  const base = accent
    ? { background:"linear-gradient(135deg,#7c3aed12,#1d4ed812)", border:"1px solid #7c3aed22" }
    : { background:C.card };
  return (
    <div style={{ ...base, borderRadius:12, overflow:"hidden" }}>
      {t.img && (
        <div style={{ background: t.imgBg||"#0a0f1a", display:"flex", justifyContent:"center", alignItems:"center", padding:"14px 0", minHeight:90 }}>
          <img src={t.img} alt={t.titulo} loading="lazy"
            style={{ maxHeight:90, maxWidth:"80%", objectFit:"contain" }}
            onError={e => { e.target.parentElement.style.display="none"; }} />
        </div>
      )}
      <div style={{ padding:"12px 14px", display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{t.emoji}</span>
        <div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600, marginBottom:4 }}>{t.titulo}</div>
          <div style={{ color:"#9ca3af", fontSize:12, lineHeight:1.65 }}>{t.texto}</div>
        </div>
      </div>
    </div>
  );
}

// ── TAB: TIPS ──────────────────────────────────
// ── MODAL: DETALLE DE PUNTOS DE UN JUGADOR ──────────
function PlayerModal({ jugador, salaId, matches, onClose, loadMatches }) {
  const [prons, setProns] = useState([]);
  const [loading, setLoading] = useState(true);
  const esMktIA = jugador.id === MARKETERIA_ID;

  useEffect(() => {
    if (loadMatches) loadMatches();
    supabase
      .from("pronosticos_partidos")
      .select("match_id, prediccion, resultado, pts_obtenidos")
      .eq("participante_id", jugador.id)
      .eq("sala_id", salaId)
      .then(({ data }) => { setProns(data || []); setLoading(false); });
  }, [jugador.id, salaId]);

  const terminados = prons.filter(p => p.resultado != null).sort((a,b)=>String(a.match_id).localeCompare(String(b.match_id)));
  const pendientes = prons.filter(p => p.resultado == null);
  const aciertos = terminados.filter(p => p.pts_obtenidos > 0).length;
  const sinCalcular = !loading && prons.length > 0 && terminados.length === 0;

  function getMatch(mid) {
    return matches.find(m => String(m.id) === String(mid));
  }
  function teamName(ev, side) {
    const comp = ev?.competitions?.[0]?.competitors?.find(c => c.homeAway === side);
    return comp?.team?.shortDisplayName || comp?.team?.displayName || (side === "home" ? "Local" : "Visit.");
  }
  function predLabel(pred, ev) {
    if (!ev) return pred;
    if (pred === "local") return teamName(ev, "home");
    if (pred === "visitante") return teamName(ev, "away");
    return "Empate";
  }
  function resLabel(res, ev) {
    if (!ev) return res;
    if (res === "local") return teamName(ev, "home");
    if (res === "visitante") return teamName(ev, "away");
    return "Empate";
  }

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:C.bg, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"85vh", overflowY:"auto", padding:"20px 16px 36px" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {esMktIA
              ? <div style={{ width:40,height:40,borderRadius:"50%",background:"#7c3aed33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>🤖</div>
              : <Avatar p={jugador} size={40} />}
            <div>
              <div style={{ color:C.text, fontWeight:600, fontSize:16 }}>{jugador.nombre}</div>
              <div style={{ color:C.muted, fontSize:12 }}>{jugador.equipo}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", padding:"4px 8px" }}>✕</button>
        </div>

        {/* Resumen */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
          {[
            { label:"Puntos", val: loading ? "…" : jugador.points, color: C.gold },
            { label:"Pronósticos", val: loading ? "…" : prons.length, color: C.text },
            { label:"Acertados", val: loading ? "…" : sinCalcular ? "—" : aciertos, color: C.green },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:700, color }}>{val}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading && <div style={{ textAlign:"center", color:C.muted, padding:24 }}>Cargando pronósticos…</div>}

        {!loading && sinCalcular && (
          <div style={{ textAlign:"center", color:C.muted, padding:24, fontSize:13 }}>
            ⏳ Los resultados partido a partido se calculan automáticamente cada mañana.<br/>
            <span style={{ fontSize:11 }}>El admin puede calcularlos ya desde la sección Quiniela.</span>
          </div>
        )}
        {!loading && !sinCalcular && terminados.length === 0 && (
          <div style={{ textAlign:"center", color:C.muted, padding:24 }}>Aún no hay partidos terminados con pronóstico.</div>
        )}

        {!loading && terminados.length > 0 && (
          <>
            <div style={{ color:C.muted, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Partidos jugados</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {terminados.map(pr => {
                const ev = getMatch(pr.match_id);
                const acierto = pr.pts_obtenidos > 0;
                const home = ev ? teamName(ev, "home") : "Local";
                const away = ev ? teamName(ev, "away") : "Visit.";
                return (
                  <div key={pr.match_id} style={{ background:C.card, border:`0.5px solid ${acierto ? C.green+"55" : C.border}`, borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>{acierto ? "✅" : "❌"}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{home} vs {away}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                        Pronóstico: <span style={{ color: acierto ? C.green : C.red }}>{predLabel(pr.prediccion, ev)}</span>
                        {" · "}Resultado: <span style={{ color:C.text }}>{resLabel(pr.resultado, ev)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <span style={{ fontSize:15, fontWeight:700, color: acierto ? C.green : C.muted }}>{acierto ? `+${pr.pts_obtenidos}` : "0"}</span>
                      <span style={{ fontSize:10, color:C.muted }}> pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!loading && pendientes.length > 0 && (
          <div style={{ marginTop:14, color:C.muted, fontSize:12, textAlign:"center" }}>
            {pendientes.length} pronóstico{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""} por jugarse
          </div>
        )}

        {/* Análisis IA de la quiniela de este jugador */}
        {!loading && prons.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ color:C.muted, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:8 }}>Análisis IA de su quiniela</div>
            <AnalisisIA
              misProns={Object.fromEntries(prons.map(p => [p.match_id, p.prediccion]))}
              matches={matches}
              nombre={jugador.nombre}
              cacheKey={jugador.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const DATOS_CURIOSOS = [
  { img:"/datos/v6_story_01.png", tag:"🏆 Récord", titulo:"Messi, Cristiano y Ochoa. Seis Mundiales cada uno.", texto:"Nadie en la historia lo había hecho. Tres generaciones distintas, el mismo escenario, por sexta vez." },
  { img:"/datos/v6_story_02.png", tag:"🌍 Geopolítica", titulo:"Curazao: 185,000 habitantes, 26 jugadores convocados.", texto:"Solo 1 nació en la isla. Los otros 25 nacieron en Países Bajos. El fútbol moderno ya no tiene fronteras." },
  { img:"/datos/v6_story_03.png", tag:"⚡ Edades", titulo:"43 vs 17. El mayor y el menor del torneo.", texto:"Craig Gordon (Escocia) y Gilberto Mora (México). 25 años de diferencia en el mismo Mundial." },
  { img:"/datos/v6_story_04.png", tag:"📏 Alturas", titulo:"2.05 vs 1.60. Casi medio metro de diferencia.", texto:"Wiegele (Austria) vs Yanis (Panamá). El mismo balón. El mismo torneo." },
  { img:"/datos/v6_story_05.png", tag:"📊 Estadística", titulo:"891 de 1,248 jugadores debutan en un Mundial.", texto:"El torneo más grande de la historia también es el más virgen. Casi 3 de cada 4 jugadores nunca habían pisado este escenario." },
  { img:"/datos/v6_story_06.png", tag:"🟡 Drama", titulo:"Senegal eliminado… por tarjetas amarillas.", texto:"En 2018, Senegal y Japón estaban empatados en todo. El desempate fue la disciplina. Afuera." },
  { img:"/datos/v6_story_07.png", tag:"🏟 Icono", titulo:"El Azteca: el único estadio con 3 inaugurales mundiales.", texto:"1970, 1986 y 2026. Tres veces. Tres generaciones. Un solo estadio." },
  { img:"/datos/v6_story_08.png", tag:"👨‍👦 Familia", titulo:"8 pares de hermanos. 4 en selecciones distintas.", texto:"Los Xhaka: Granit con Suiza, Taulant con Albania. Se enfrentaron en la Eurocopa anterior." },
  { img:"/datos/v6_story_09.png", tag:"🏴 Racha", titulo:"Países Bajos no pierde en un Mundial desde 2010.", texto:"16 años sin perder. La final de Sudáfrica fue la última derrota: España 1-0." },
  { img:"/datos/v6_story_10.png", tag:"🔴 Violencia", titulo:"La Batalla de Núremberg, 2006.", texto:"Portugal vs Países Bajos: 16 amarillas, 4 rojas, 4 expulsados en un solo partido." },
  { img:"/datos/v6_story_11.png", tag:"⏳ Sequía", titulo:"Brasil: 5 títulos y 24 años sin ganar.", texto:"El único país en todos los Mundiales de la historia. Pero el último título fue en 2002." },
  { img:"/datos/v6_story_12.png", tag:"🧤 Viral", titulo:"Vozinha: de 50K a 5.7M seguidores en 90 minutos.", texto:"Atajó todo ante España. Cabo Verde empató. Y el mundo entero lo descubrió en vivo." },
  { img:"/datos/v6_story_13.png", tag:"📱 Viral", titulo:"Tim Payne: de 4,715 a 5.8M seguidores sin jugar un minuto.", texto:"Un influencer argentino lanzó una campaña para hacerlo famoso. Resultó." },
  { img:"/datos/v6_story_14.png", tag:"👀 Dato", titulo:"España al Mundial sin ningún jugador del Real Madrid.", texto:"Por primera vez en la historia. Mientras el Madrid manda 10 jugadores a 9 selecciones distintas." },
  { img:"/datos/v6_story_15.png", tag:"📊 Formato", titulo:"104 partidos vs 64 de Qatar. Un 60% más de fútbol.", texto:"Si crees que ya viste todo en un Mundial, este torneo vino a contradecirte." },
  { img:"/datos/v6_story_16.png", tag:"🇺🇸 Anfitrión", titulo:"EE.UU. 4-1 Paraguay. El anfitrión avisó.", texto:"Balogun anotó dos. El país que inventó el Super Bowl descubrió que también sabe jugar fútbol." },
  { img:"/datos/v6_story_17.png", tag:"🇶🇦 Sorpresa", titulo:"Qatar empató con Suiza. Nadie lo vio venir.", texto:"En 2022 perdió todo en casa. En 2026 debutó empatando con Suiza. El fútbol no tiene memoria." },
  { img:"/datos/v6_story_18.png", tag:"🆕 Histórico", titulo:"Dieciseisavos: la ronda que nunca existió.", texto:"Por primera vez en la historia del Mundial hay una ronda de dieciseisavos. El formato que todos criticaron… está funcionando." },
  { img:"/datos/v6_story_19.png", tag:"💸 Precios", titulo:"Boletos del Mundial: de 7 a 200 millones de pesos.", texto:"35% más caros que Qatar 2022. Los estadios están llenos. Porque hay cosas que simplemente las pagas sin chistar." },
];

function TipsInfo() {
  const TIPS_REGLAS = [
    {emoji:"🚩",titulo:"Fuera de juego (Offside)",texto:"Si un atacante está más cerca del arco rival que el último defensa en el momento del pase, el árbitro marca offside. El VAR lo confirma con una línea.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Offsidedrawing.svg/480px-Offsidedrawing.svg.png", imgBg:"#0f2027"},
    {emoji:"🟨",titulo:"Tarjetas: amarilla y roja",texto:"Amarilla = amonestación. Dos amarillas en el mismo partido = roja automática. Roja directa = expulsión inmediata. El jugador expulsado no juega el siguiente partido.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Yellow_card.svg/120px-Yellow_card.svg.png", imgBg:"#1a1200"},
    {emoji:"📺",titulo:"VAR",texto:"Un árbitro en una sala de video revisa goles, penales, tarjetas rojas y confusiones de identidad. El árbitro en cancha puede revisar la pantalla antes de decidir.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/VAR_check_sign.svg/240px-VAR_check_sign.svg.png", imgBg:"#001a0f"},
    {emoji:"🥅",titulo:"Penal",texto:"Falta dentro del área = penal desde el punto blanco a 11 metros del arco. El portero no puede moverse hasta el disparo.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Penalty_kick_soccer.svg/320px-Penalty_kick_soccer.svg.png", imgBg:"#0a0a1a"},
  ];

  const TIPS_MUNDIAL = [
    {emoji:"🌎",titulo:"48 equipos, 12 grupos",texto:"Por primera vez 48 selecciones en 12 grupos de 4. Clasifican los 2 primeros + los 8 mejores terceros.",
     img:"https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/2026_FIFA_World_Cup_logo.svg/320px-2026_FIFA_World_Cup_logo.svg.png", imgBg:"#050510"},
    {emoji:"📐",titulo:"Desempate en tabla",texto:"1° Puntos → 2° DG → 3° Goles anotados → 4° Resultado entre ellos → 5° Fair play → 6° Sorteo FIFA.",
     img:null},
    {emoji:"🏟️",titulo:"Sedes: USA, México y Canadá",texto:"Final en el MetLife Stadium, NY/NJ. México juega en el Azteca, Guadalajara y Monterrey.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/MetLife_Stadium_September_2019.jpg/320px-MetLife_Stadium_September_2019.jpg", imgBg:"#0a1020"},
    {emoji:"🥇",titulo:"Campeones: Argentina",texto:"Qatar 2022: Argentina venció a Francia 3-3 (4-2 en penales). Messi levantó el único título que le faltaba.",
     img:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-soccer-soccer-ball.svg/240px-24701-soccer-soccer-ball.svg.png", imgBg:"#0a1a0a"},
  ];

  const TIPS_QUINIELA = [
    {emoji:"📊",titulo:"Diferencia de goles importa",texto:"En grupos dos equipos pueden empatar puntos. El que gana por más diferencia avanza. Apuesta a que tu equipo gane bien, no solo que gane.",
     img:null},
    {emoji:"🌡️",titulo:"Los favoritos no siempre ganan",texto:"Arabia Saudita venció a Argentina, Japón a Alemania, Marruecos llegó a semis. Las sorpresas son parte del juego — toma riesgos.",
     img:null},
    {emoji:"🔥",titulo:"Factor local es real",texto:"Con sede en México, la presión de la afición puede ser decisiva. Esta es la mejor oportunidad de México en décadas.",
     img:null},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12,paddingTop:14}}>
      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>
        Reglas básicas ⚽
      </div>
      {TIPS_REGLAS.map((t,i)=>(
        <TipCard key={i} t={t} />
      ))}

      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",paddingTop:4}}>
        Formato del Mundial 2026 🏆
      </div>
      {TIPS_MUNDIAL.map((t,i)=>(
        <TipCard key={i} t={t} />
      ))}

      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",paddingTop:4}}>
        Tips para tu quiniela 🎯
      </div>
      {TIPS_QUINIELA.map((t,i)=>(
        <TipCard key={i} t={t} accent />
      ))}

      <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",paddingTop:4}}>
        Datos curiosos del Mundial 🌍
      </div>
      {DATOS_CURIOSOS.map((d,i)=>(
        <div key={i} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
          <img src={d.img} alt={d.titulo} style={{width:"100%",display:"block",borderRadius:"14px 14px 0 0"}} loading="lazy" />
          <div style={{padding:"10px 14px 12px"}}>
            <div style={{fontSize:10,fontWeight:600,color:"#a78bfa",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>{d.tag}</div>
            <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4,lineHeight:1.3}}>{d.titulo}</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{d.texto}</div>
          </div>
        </div>
      ))}

      <p style={{color:"#7c3aed",fontSize:11,textAlign:"center",padding:"4px 0 8px"}}>
        MarketerIA · más tips cada jornada 🚀
      </p>
    </div>
  );
}

// ── PESTAÑA: CALENDARIO MUNDIAL ───────────────
function Calendario({ salaLink, yo, miId, salaId }) {
  const [scoreboard, setScoreboard] = useState(null);
  const [standings,  setStandings]  = useState(null);
  const [loadSb,     setLoadSb]     = useState(true);
  const [loadSt,     setLoadSt]     = useState(true);
  const [tab,        setTabCal]     = useState("resumen");
  const [dateOff,    setDateOff]    = useState(0);
  const [showCal,    setShowCal]    = useState(false);
  const [showShare,  setShowShare]  = useState(false);
  const [shareNombre,setShareNombre]= useState(yo?.nombre||"");
  const [shareEquipo,setShareEquipo]= useState(yo?.equipo||"");
  const [nextMap,    setNextMap]    = useState({});
  const [misProns,   setMisProns]   = useState({});
  const standingsCache = useRef(null);
  const nextCache      = useRef(null);

  function dateStr(off=0) {
    const d=new Date(); d.setDate(d.getDate()+off);
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  }
  // Fecha de un evento en zona horaria México (para agrupar correctamente)
  function fechaMX(utcStr) {
    return new Date(utcStr).toLocaleDateString("en-CA", { timeZone:"America/Mexico_City" }); // "YYYY-MM-DD"
  }
  // Fecha objetivo en zona horaria México para el offset dado
  function targetDateMX(off=0) {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return d.toLocaleDateString("en-CA", { timeZone:"America/Mexico_City" });
  }
  function fmtHour(utc) {
    if (!utc) return "";
    return new Date(utc).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit",timeZone:"America/Mexico_City"});
  }
  function dayLabel(off) {
    if (off===0) return "Hoy"; if (off===-1) return "Ayer"; if (off===1) return "Mañana";
    const d=new Date(); d.setDate(d.getDate()+off);
    return d.toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"});
  }

  useEffect(() => {
    if (!miId) return;
    const lsKey = `prons_${salaId}_${miId}`;
    try { const cached = localStorage.getItem(lsKey); if (cached) setMisProns(JSON.parse(cached)); } catch {}
    supabase.from("pronosticos_partidos").select("match_id,prediccion").eq("participante_id", miId)
      .then(({ data }) => { if (data) setMisProns(Object.fromEntries(data.map(r => [r.match_id, r.prediccion]))); });
  }, [miId]);

  useEffect(() => {
    setLoadSb(true);
    // Pedir también el día siguiente en UTC para capturar partidos nocturnos (ej. 10pm MX = 4am UTC siguiente)
    Promise.all([
      fetch(`/api/fotmob?endpoint=scoreboard&dates=${dateStr(dateOff)}`).then(r=>r.json()).catch(()=>({events:[]})),
      fetch(`/api/fotmob?endpoint=scoreboard&dates=${dateStr(dateOff+1)}`).then(r=>r.json()).catch(()=>({events:[]})),
    ]).then(([d1, d2]) => {
      const target = targetDateMX(dateOff);
      // Combinar y filtrar: solo los eventos cuya hora en México corresponde al día pedido
      const allEvents = [...(d1?.events||[]), ...(d2?.events||[])];
      const filtered = allEvents.filter(ev => ev.date && fechaMX(ev.date) === target);
      // Deduplicar por id
      const seen = new Set();
      const unique = filtered.filter(ev => { if(seen.has(ev.id)) return false; seen.add(ev.id); return true; });
      setScoreboard({ ...(d1||{}), events: unique });
      setLoadSb(false);
    });
  }, [dateOff]);

  useEffect(() => {
    if (standingsCache.current) { setStandings(standingsCache.current); setLoadSt(false); return; }
    fetch("/api/fotmob?endpoint=standings").then(r=>r.json())
      .then(d=>{ standingsCache.current=d; setStandings(d); setLoadSt(false); }).catch(()=>setLoadSt(false));
  }, []);

  // Fetch próximos partidos para columna "Siguiente"
  useEffect(() => {
    if (nextCache.current) { setNextMap(nextCache.current); return; }
    // Pedir los próximos 14 días en un rango de fechas
    const now=new Date(), end=new Date(); end.setDate(now.getDate()+14);
    const fmt=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    fetch(`/api/fotmob?endpoint=schedule&dates=${fmt(now)}-${fmt(end)}`).then(r=>r.json())
      .then(data=>{
        const map={};
        const evts=(data?.events||[]).filter(ev=>{
          const st=ev.competitions?.[0]?.status?.type?.state;
          return st==="pre"; // solo no jugados
        }).sort((a,b)=>new Date(a.date)-new Date(b.date));
        evts.forEach(ev=>{
          const comp=ev.competitions?.[0];
          const home=comp?.competitors?.find(c=>c.homeAway==="home");
          const away=comp?.competitors?.find(c=>c.homeAway==="away");
          if(!home||!away) return;
          // Para cada equipo, guarda su próximo rival (solo si aún no está en el map)
          if(!map[home.team.id]) map[home.team.id]={logo:away.team.logo,name:away.team.shortDisplayName||away.team.location,date:ev.date};
          if(!map[away.team.id]) map[away.team.id]={logo:home.team.logo,name:home.team.shortDisplayName||home.team.location,date:ev.date};
        });
        nextCache.current=map; setNextMap(map);
      }).catch(()=>{});
  }, []);

  const events = scoreboard?.events || [];
  const groups = standings?.children || [];

  const tabStyle = (active) => ({
    background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
    fontSize:13, fontWeight:active?600:400, color:active?C.text:C.muted,
    padding:"10px 14px", borderBottom:`2px solid ${active?"#3b82f6":"transparent"}`,
    transition:"all .15s", whiteSpace:"nowrap",
  });

  // ── Bloque reutilizable: lista de partidos ──────────────────────────────
  function MatchList() {
    if (loadSb) return <p style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Cargando…</p>;
    // Los eventos ya vienen filtrados por fecha en hora México desde el useEffect
    if (events.length===0) return <p style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Sin partidos este día.</p>;
    // Agrupar bajo una sola etiqueta (todos son del mismo día)
    const lbl = dayLabel(dateOff);
    const byDay = { [lbl]: events };
    return <>{Object.entries(byDay).map(([lbl,evs])=>(
      <div key={lbl}>
        <div style={{color:C.muted,fontSize:11,fontWeight:700,padding:"8px 2px 4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{lbl}</div>
        <div style={{background:C.card,borderRadius:10,overflow:"hidden",marginBottom:10}}>
          {evs.map((ev,i)=>{
            const comp=ev.competitions?.[0];
            const home=comp?.competitors?.find(c=>c.homeAway==="home");
            const away=comp?.competitors?.find(c=>c.homeAway==="away");
            const st=comp?.status?.type;
            const live=st?.state==="in", done=st?.state==="post";
            const clock=comp?.status?.displayClock;
            const sH=home?.score??"–", sA=away?.score??"–";
            const homeName=home?.team?.shortDisplayName||home?.team?.location||"—";
            const awayName=away?.team?.shortDisplayName||away?.team?.location||"—";
            const homeLogo=home?.team?.logo, awayLogo=away?.team?.logo;
            const miPred = misProns[String(ev.id)];
            const predLabel = miPred === "local" ? `🏠 ${homeName}` : miPred === "visitante" ? `✈️ ${awayName}` : miPred === "empate" ? "🤝 Empate" : null;
            return (
              <div key={i} style={{
                borderBottom:i<evs.length-1?`1px solid ${C.border}20`:undefined,
                borderLeft:`3px solid ${live?"#10b981":"transparent"}`,
              }}>
                <div style={{
                  display:"grid",gridTemplateColumns:"44px 1fr auto 1fr",
                  alignItems:"center",gap:6,padding:"10px 10px",
                }}>
                  <div style={{textAlign:"center"}}>
                    {live
                      ? <span style={{background:"#10b98122",color:"#10b981",fontSize:9,fontWeight:700,padding:"3px 4px",borderRadius:4}}>{clock?.replace("'","′")||"●"}</span>
                      : done
                        ? <span style={{color:C.muted,fontSize:10,fontWeight:600,background:C.border+"55",padding:"3px 4px",borderRadius:4}}>TC</span>
                        : <span style={{color:C.muted,fontSize:11}}>{fmtHour(ev.date)}</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:5,overflow:"hidden"}}>
                    <span style={{color:done||live?C.text:"#9ca3af",fontSize:12,fontWeight:done||live?500:400,textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{homeName}</span>
                    {homeLogo?<img src={homeLogo} style={{width:20,height:20,objectFit:"contain",flexShrink:0}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:14,flexShrink:0}}>🏳️</span>}
                  </div>
                  <div style={{textAlign:"center",minWidth:36}}>
                    {done||live
                      ? <span style={{color:C.text,fontSize:14,fontWeight:800,letterSpacing:"1px"}}>{sH}-{sA}</span>
                      : <span style={{color:C.muted,fontSize:11}}>vs</span>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5,overflow:"hidden"}}>
                    {awayLogo?<img src={awayLogo} style={{width:20,height:20,objectFit:"contain",flexShrink:0}} onError={e=>e.target.style.display="none"}/>:<span style={{fontSize:14,flexShrink:0}}>🏳️</span>}
                    <span style={{color:done||live?C.text:"#9ca3af",fontSize:12,fontWeight:done||live?500:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{awayName}</span>
                  </div>
                </div>
                {predLabel && (
                  <div style={{padding:"0 10px 8px 54px"}}>
                    <span style={{
                      display:"inline-block",
                      fontSize:10,fontWeight:600,
                      color: done ? (
                        (miPred==="local"&&parseInt(sH)>parseInt(sA)) || (miPred==="visitante"&&parseInt(sA)>parseInt(sH)) || (miPred==="empate"&&sH===sA)
                          ? "#4ade80" : "#f87171"
                      ) : "#a78bfa",
                      background: done ? (
                        (miPred==="local"&&parseInt(sH)>parseInt(sA)) || (miPred==="visitante"&&parseInt(sA)>parseInt(sH)) || (miPred==="empate"&&sH===sA)
                          ? "#052e16" : "#2d0a0a"
                      ) : "#1e1b4b",
                      border:`0.5px solid ${done ? (
                        (miPred==="local"&&parseInt(sH)>parseInt(sA)) || (miPred==="visitante"&&parseInt(sA)>parseInt(sH)) || (miPred==="empate"&&sH===sA)
                          ? "#16a34a55" : "#dc262655"
                      ) : "#7c3aed55"}`,
                      borderRadius:6,padding:"2px 8px",
                    }}>
                      Mi quiniela: {predLabel}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ))}</>;
  }

  // ── Bloque reutilizable: tabla de grupos ────────────────────────────────
  // compact = vista resumida (Resumen tab)  |  full = Tabla tab (más columnas)
  function GroupTable({compact=false}) {
    if (loadSt) return <p style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Cargando…</p>;
    if (groups.length===0) return <p style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Sin datos aún.</p>;

    // Columnas FotMob:
    //  compact: #bar | team | J | +/- | DG | Pts | Sig
    //  full:    #bar | team | J | G | E | P | +/- | DG | Pts | Sig
    const colsCompact = "20px 1fr 22px 30px 26px 26px 28px";
    const colsFull    = "20px 1fr 22px 22px 22px 22px 30px 26px 26px 28px";

    return <>{groups.map((g,gi)=>{
      const entries=g.standings?.entries||[];
      const cols = compact ? colsCompact : colsFull;
      const headers = compact ? ["J","+/-","DG","Pts","Sig"] : ["J","G","E","P","+/-","DG","Pts","Sig"];
      return (
        <div key={gi} style={{marginBottom:12,background:C.card,borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"7px 10px",background:"#161d2e",borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.text,fontSize:11,fontWeight:700}}>{(g.name||"").replace("Group","Grp.")}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:cols,padding:"3px 10px",borderBottom:`1px solid ${C.border}20`}}>
            <span/><span style={{color:C.muted,fontSize:9}}>Equipo</span>
            {headers.map(h=><span key={h} style={{color:C.muted,fontSize:9,textAlign:"center"}}>{h}</span>)}
          </div>
          {entries.map((e,ei)=>{
            const st={}; (e.stats||[]).forEach(s=>{ st[s.name]=s.displayValue??s.value??0; });
            const adv=ei<2, logo=e.team?.logos?.[0]?.href;
            const gp=Number(st.gamesPlayed||0), gw=Number(st.wins||0), gd=Number(st.ties||0), gl=Number(st.losses||0);
            const gf=Number(st.pointsFor||0), ga=Number(st.pointsAgainst||0);
            const marcador=`${gf}-${ga}`;                        // "+/-" = "2-0"
            const dg=(gf-ga>=0?"+":"")+(gf-ga);                  // "DG"  = "+2"
            const pts=Number(st.points||0);
            const teamId = e.team?.id;
            const next = nextMap[teamId];
            const vals = compact
              ? [gp, marcador, dg, pts]
              : [gp, gw, gd, gl, marcador, dg, pts];
            return (
              <div key={ei} style={{display:"grid",gridTemplateColumns:cols,padding:"6px 10px",alignItems:"center",borderBottom:ei<entries.length-1?`1px solid ${C.border}20`:undefined,background:adv?"#10b98108":undefined}}>
                <span style={{width:3,height:16,borderRadius:2,background:adv?"#10b981":"#ffffff15",display:"inline-block",margin:"auto"}}/>
                <div style={{display:"flex",alignItems:"center",gap:6,overflow:"hidden"}}>
                  {logo?<img src={logo} style={{width:18,height:18,objectFit:"contain",flexShrink:0}} onError={ev=>ev.target.style.display="none"}/>:<span style={{fontSize:14}}>🏳️</span>}
                  <span style={{color:adv?C.text:"#9ca3af",fontSize:12,fontWeight:adv?500:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {e.team?.abbreviation||e.team?.shortDisplayName||"—"}
                  </span>
                </div>
                {vals.map((v,vi)=>{
                  const isLast=vi===vals.length-1;
                  const isDG=vi===vals.length-2;
                  const col=isLast?C.text:isDG?(Number(String(v).replace("+",""))>0?"#10b981":Number(String(v).replace("+",""))<0?"#f87171":C.muted):C.muted;
                  return <span key={vi} style={{color:col,fontSize:11,textAlign:"center",fontWeight:isLast?700:400}}>{v}</span>;
                })}
                {/* Siguiente rival */}
                <div style={{display:"flex",justifyContent:"center"}}>
                  {next?.logo
                    ? <img src={next.logo} title={next.name} style={{width:18,height:18,objectFit:"contain"}} onError={e=>e.target.style.display="none"}/>
                    : <span style={{color:C.muted,fontSize:10}}>—</span>}
                </div>
              </div>
            );
          })}
        </div>
      );
    })}</>;
  }

  return (
    <div style={{margin:"0 -4px"}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:0,overflowX:"auto"}}>
        {[["resumen","Resumen"],["tabla","Tabla"],["partidos","Partidos"]].map(([k,l])=>(
          <button key={k} style={tabStyle(tab===k)} onClick={()=>setTabCal(k)}>{l}</button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab==="resumen" && (
        <div style={{marginTop:10}}>

          {/* ── Botones superiores: Calendario + Compartir ── */}
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {/* 📅 Agregar al calendario */}
            <div style={{flex:1}}>
              <button onClick={()=>{ setShowCal(v=>!v); setShowShare(false); }} style={{
                width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,
                background:C.card,color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",
                fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              }}>📅 Agregar al Calendario</button>
              {showCal && (
                <div style={{background:C.card,borderRadius:10,overflow:"hidden",marginTop:4,border:`1px solid ${C.border}`}}>
                  {(()=>{
                    const ics="webcal://ics.fotmob.com/api/calendar/matches?leagueId=77&teamId=-1&timeZone=America%2FMexico_City";
                    return [
                      {icon:"🍎",label:"Apple",    url:ics},
                      {icon:"📅",label:"Google",   url:`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(ics)}`},
                    ];
                  })().map((c,i,arr)=>(
                    <a key={c.label} href={c.url} target="_blank" rel="noreferrer" style={{
                      display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
                      color:C.text,textDecoration:"none",fontSize:13,
                      borderBottom:i<arr.length-1?`1px solid ${C.border}20`:undefined,
                    }}>
                      <span style={{fontSize:20}}>{c.icon}</span>
                      <span>{c.label}</span>
                      <span style={{marginLeft:"auto",color:C.muted}}>›</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            {/* 📤 Compartir */}
            <div style={{flex:1}}>
              <button onClick={()=>setShowShare(true)} style={{
                width:"100%",padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,
                background:C.card,color:C.text,fontSize:12,fontWeight:600,cursor:"pointer",
                fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              }}>📤 Compartir Mundial</button>
            </div>
          </div>

          {/* ── Modal compartir ── */}
          {showShare && (
            <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setShowShare(false)}>
              <div style={{background:C.bg,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:480,padding:"20px 20px 36px"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <h3 style={{color:C.text,fontSize:15,fontWeight:700,margin:0}}>📤 Compartir por WhatsApp</h3>
                  <button onClick={()=>setShowShare(false)} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
                </div>
                <input value={shareNombre} onChange={e=>setShareNombre(e.target.value)}
                  placeholder="Tu nombre" style={{...inp,marginBottom:8}} />
                <select value={shareEquipo} onChange={e=>setShareEquipo(e.target.value)} style={{...inp,marginBottom:16}}>
                  <option value="">— Tu equipo favorito —</option>
                  {TEAMS.map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
                </select>
                {(()=>{
                  const t=TEAMS.find(x=>x.n===shareEquipo);
                  const lines=[
                    `⚽ *${shareNombre||"Alguien"}* te invita a seguir el Mundial 2026`,
                    t ? `🏳️ Le voy al: *${t.f} ${t.n}*` : "",
                    ``,
                    `📊 Calendario · Marcadores en vivo · Noticias del Mundial 2026:`,
                    `👉 ${APP_URL}`,
                    ``,
                    `¡Entra y haz tu pronóstico! 🏆`,
                  ].filter(Boolean);
                  return (
                    <a href={`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`}
                      target="_blank" rel="noreferrer"
                      style={{display:"block",background:"#25d366",color:"#fff",textAlign:"center",
                        padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,textDecoration:"none"}}>
                      Enviar por WhatsApp 💬
                    </a>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Jornada nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 2px",marginBottom:6}}>
            <button onClick={()=>setDateOff(d=>d-1)} style={{...Btn(),padding:"4px 12px",fontSize:20,lineHeight:1}}>‹</button>
            <span style={{color:C.text,fontSize:13,fontWeight:600}}>{dayLabel(dateOff)}</span>
            <button onClick={()=>setDateOff(d=>d+1)} style={{...Btn(),padding:"4px 12px",fontSize:20,lineHeight:1}}>›</button>
          </div>
          <MatchList/>

          {/* Grupos */}
          <div style={{color:C.muted,fontSize:11,fontWeight:700,padding:"8px 2px 4px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Grupos</div>
          <GroupTable compact/>
        </div>
      )}

      {/* ── TABLA completa ── */}
      {tab==="tabla" && <div style={{marginTop:12}}><GroupTable/></div>}

      {/* ── PARTIDOS ── */}
      {tab==="partidos" && (
        <div style={{marginTop:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 2px",marginBottom:6}}>
            <button onClick={()=>setDateOff(d=>d-1)} style={{...Btn(),padding:"4px 12px",fontSize:20,lineHeight:1}}>‹</button>
            <span style={{color:C.text,fontSize:13,fontWeight:600}}>{dayLabel(dateOff)}</span>
            <button onClick={()=>setDateOff(d=>d+1)} style={{...Btn(),padding:"4px 12px",fontSize:20,lineHeight:1}}>›</button>
          </div>
          <MatchList/>
        </div>
      )}

    </div>
  );
}

// ── PANTALLA: AGREGAR CALENDARIO ─────────────
function PasoCalendario({ onContinuar, equipoDefault }) {
  const [seleccion, setSeleccion] = useState("todos"); // "todos" | "mis-equipos"
  const [equiposElegidos, setEquiposElegidos] = useState(
    equipoDefault ? [equipoDefault] : []
  );

  function toggleEquipo(n) {
    setEquiposElegidos(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  }

  function getUrls() {
    const teamsParam = seleccion === "mis-equipos" && equiposElegidos.length
      ? `?teams=${encodeURIComponent(equiposElegidos.join(","))}`
      : "";
    const base = `${APP_URL}/api/calendar.ics${teamsParam}`;
    const webcal = base.replace("https://", "webcal://").replace("http://", "webcal://");
    return {
      apple: webcal,
      google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(base)}`,
    };
  }

  const urls = getUrls();
  const labelCal = seleccion === "mis-equipos" && equiposElegidos.length
    ? `${equiposElegidos.map(n => TEAMS.find(t=>t.n===n)?.f||"").join("")} ${equiposElegidos.join(", ")}`
    : "📅 Todos los partidos del Mundial";

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", padding:"28px 20px", overflowY:"auto" }}>
      <div style={{ maxWidth:420, margin:"0 auto", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:10 }}>📅</div>
        <h1 style={{ color:C.text, fontSize:21, fontWeight:700, marginBottom:6 }}>¡No te pierdas ningún partido!</h1>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, marginBottom:22 }}>
          Agrega el calendario a tu teléfono y recibe notificación antes de cada partido.
        </p>

        <div style={{ color:C.muted, fontSize:12, marginBottom:10 }}>Tú decides qué juegos seguir en tu calendario</div>

        {/* Selector: todos vs filtro */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[["todos","🌍 Todos los partidos"],["mis-equipos","❤️ Mis equipos"]].map(([k,l])=>(
            <button key={k} onClick={()=>setSeleccion(k)} style={{
              flex:1, padding:"10px 8px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
              border:`1.5px solid ${seleccion===k ? C.blue : C.border}`,
              background: seleccion===k ? C.blue+"22" : C.card,
              color: seleccion===k ? C.blue : C.muted,
            }}>{l}</button>
          ))}
        </div>

        {/* Selector de equipos */}
        {seleccion === "mis-equipos" && (
          <div style={{ marginBottom:16, textAlign:"left" }}>
            <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>
              Elige los equipos que te interesan
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {TEAMS.map(t => {
                const sel = equiposElegidos.includes(t.n);
                return (
                  <button key={t.n} onClick={()=>toggleEquipo(t.n)} style={{
                    padding:"6px 12px", borderRadius:20, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                    border:`1.5px solid ${sel ? "#7c3aed" : C.border}`,
                    background: sel ? "#7c3aed33" : C.card,
                    color: sel ? "#c4b5fd" : C.muted,
                    fontWeight: sel ? 600 : 400,
                  }}>
                    {t.f} {t.n}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lo que se va a agregar */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14, textAlign:"left", fontSize:12, color:C.muted }}>
          Se agregará: <span style={{ color:C.text, fontWeight:600 }}>{labelCal}</span>
        </div>

        {/* Botones de agregar */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14 }}>
          {[
            { icon:"🍎", label:"Apple Calendar", url: urls.apple },
            { icon:"📅", label:"Google Calendar", url: urls.google },
          ].map((o, i) => (
            <a key={o.label} href={o.url} target="_blank" rel="noreferrer"
              onClick={() => setTimeout(onContinuar, 1500)}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"15px 18px", color:C.text, textDecoration:"none", fontSize:14, borderBottom: i===0 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize:26 }}>{o.icon}</span>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontWeight:600 }}>{o.label}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Toca para agregar</div>
              </div>
              <span style={{ color:C.muted, fontSize:18 }}>›</span>
            </a>
          ))}
        </div>

        <button onClick={onContinuar} style={{ ...Btn({ width:"100%", padding:12, fontSize:13 }), color:C.muted }}>
          Ya lo tengo / Saltar
        </button>
      </div>
    </div>
  );
}

// ── PANTALLA: AGREGAR A INICIO ────────────────
function PasoInstall({ onContinuar }) {
  const [agregado, setAgregado] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isChromeIOS = isIOS && /CriOS/i.test(navigator.userAgent);
  const [browserTab, setBrowserTab] = useState(isChromeIOS ? "chrome" : "safari");

  useEffect(() => {
    // Android Chrome: capturar el evento de instalación nativa
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function instalarAndroid() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setAgregado(true); setTimeout(onContinuar, 1000); }
    setDeferredPrompt(null);
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:"28px 20px" }}>
      <div style={{ maxWidth:420, width:"100%", textAlign:"center" }}>

        {/* Ícono */}
        <div style={{ marginBottom:16 }}>
          <img src="/icon-192.svg" style={{ width:90, height:90, borderRadius:22, boxShadow:"0 8px 32px #7c3aed55" }} alt="Quiniela Mundial 2026" />
        </div>

        <h1 style={{ color:C.text, fontSize:21, fontWeight:700, marginBottom:6 }}>¡Agrégala a tus apps!</h1>
        <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, marginBottom:20 }}>
          Accede a la quiniela desde tu pantalla de inicio como si fuera una app — sin buscar el link cada vez.
        </p>

        {/* Android con prompt disponible → botón mágico */}
        {isAndroid && deferredPrompt && (
          <button onClick={instalarAndroid} style={{
            ...BtnP, width:"100%", padding:16, fontSize:16, marginBottom:12,
            background:"linear-gradient(90deg,#7c3aed,#1d4ed8)",
            boxShadow:"0 4px 24px #7c3aed55",
          }}>
            📲 Instalar en mi teléfono
          </button>
        )}

        {/* Instrucciones manuales */}
        {(isIOS || (isAndroid && !deferredPrompt)) && (() => {
          // SVG: ícono compartir iOS (flecha arriba saliendo de caja)
          const ShareIcon = () => (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline",verticalAlign:"middle",margin:"0 2px -2px"}}>
              <path d="M12 2l-4 4h3v8h2V6h3l-4-4z"/>
              <path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7"/>
            </svg>
          );
          // SVG: ícono tres puntos horizontal (Chrome iOS barra inferior)
          const DotsIcon = () => (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#60a5fa" style={{display:"inline",verticalAlign:"middle",margin:"0 2px -2px"}}>
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          );

          const instrucciones = {
            safari: [
              { n:"1", jsx: <span>Toca el botón <ShareIcon /> <strong style={{color:C.text}}>Compartir</strong> en la barra de abajo de Safari</span> },
              { n:"2", jsx: <span>Busca y toca <strong style={{color:C.text}}>"Agregar a pantalla de inicio"</strong> ➕</span> },
              { n:"3", jsx: <span>Toca <strong style={{color:C.text}}>"Agregar"</strong> arriba a la derecha ✅</span> },
            ],
            chrome: [
              { n:"1", jsx: <span>Toca el botón <DotsIcon /> <strong style={{color:C.text}}>tres puntos</strong> en la barra de abajo de Chrome</span> },
              { n:"2", jsx: <span>Toca el ícono <ShareIcon /> <strong style={{color:C.text}}>Compartir</strong> en el menú que aparece</span> },
              { n:"3", jsx: <span>Busca y toca <strong style={{color:C.text}}>"Agregar a pantalla de inicio"</strong> ➕ y luego <strong style={{color:C.text}}>"Agregar"</strong> ✅</span> },
            ],
            android: [
              { n:"1", jsx: <span>Toca el menú <strong style={{color:C.text}}>⋮</strong> (tres puntos) arriba a la derecha</span> },
              { n:"2", jsx: <span>Selecciona <strong style={{color:C.text}}>"Agregar a pantalla de inicio"</strong></span> },
              { n:"3", jsx: <span>Toca <strong style={{color:C.text}}>"Agregar"</strong> y ¡listo! ✅</span> },
            ],
          };

          const pasos = isIOS ? instrucciones[browserTab] : instrucciones.android;

          return (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px", marginBottom:16, textAlign:"left" }}>
              {/* Tabs Safari / Chrome (solo iOS) */}
              {isIOS && (
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {[{id:"safari",label:"🧭 Safari"},{id:"chrome",label:"🌐 Chrome"}].map(b => (
                    <button key={b.id} onClick={() => setBrowserTab(b.id)} style={{
                      flex:1, padding:"7px 0", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                      background: browserTab === b.id ? "linear-gradient(90deg,#7c3aed,#1d4ed8)" : C.bg,
                      color: browserTab === b.id ? "#fff" : C.muted,
                      transition:"all 0.2s",
                    }}>{b.label}</button>
                  ))}
                </div>
              )}
              {!isIOS && (
                <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Android · Chrome</div>
              )}
              {pasos.map(s => (
                <div key={s.n} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ minWidth:26, height:26, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{s.n}</div>
                  <div style={{ color:C.text, fontSize:13, lineHeight:1.5, paddingTop:3 }}>{s.jsx}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Preview ícono */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
          <img src="/icon-192.svg" style={{ width:52, height:52, borderRadius:12 }} alt="" />
          <div style={{ textAlign:"left" }}>
            <div style={{ color:C.text, fontWeight:600, fontSize:14 }}>Mundial 2026</div>
            <div style={{ color:C.muted, fontSize:12 }}>quienvaaganar.vercel.app</div>
          </div>
          <div style={{ marginLeft:"auto", fontSize:22 }}>📲</div>
        </div>

        <button onClick={() => {
          localStorage.setItem("vioInstallBanner","1"); // no mostrar banner si ya la agregó
          setAgregado(true);
          setTimeout(onContinuar, 800);
        }} style={{
          ...BtnP, width:"100%", padding:13, fontSize:15, marginBottom:10,
          background: agregado ? "#16a34a" : "linear-gradient(90deg,#7c3aed,#1d4ed8)",
        }}>
          {agregado ? "¡Listo! Entrando... ✅" : "Ya la agregué →"}
        </button>
        <button onClick={onContinuar} style={{ ...Btn({ width:"100%", padding:10, fontSize:13 }), color:C.muted }}>
          Saltar este paso
        </button>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────
export default function App() {
  // Reset de sesión para testing: ?test en la URL
  if (new URLSearchParams(window.location.search).has("test")) {
    localStorage.removeItem("miId_"+SALA_GLOBAL_ID);
    localStorage.removeItem("vioIntro");
    localStorage.removeItem("quiniela_wa");
    localStorage.removeItem("quiniela_nombre");
    window.history.replaceState({}, "", "/");
  }

  const [sala, setSala] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [miId, setMiId] = useState(() => localStorage.getItem("miId_"+SALA_GLOBAL_ID) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sala global
    supabase.from("salas").select("*").eq("id", SALA_GLOBAL_ID).single()
      .then(({ data, error }) => {
        if (error) console.error("Error cargando sala:", error);
        if (data) setSala(data);
        setLoading(false);
      })
      .catch(e => { console.error("Catch sala:", e); setLoading(false); });

    // Cargar participantes + auto-login por WA
    supabase.from("participantes").select("*").eq("sala_id", SALA_GLOBAL_ID).order("created_at")
      .then(({ data, error }) => {
        if (error) console.error("Error cargando participantes:", error);
        if (!data) return;
        setParticipantes(data);
        if (!localStorage.getItem("miId_"+SALA_GLOBAL_ID)) {
          const norm = v => (v||"").replace(/\D/g,"").slice(-10);
          const miWA = norm(localStorage.getItem("quiniela_wa"));
          if (miWA) {
            const ya = data.find(p => norm(p.whatsapp) === miWA);
            if (ya) { localStorage.setItem("miId_"+SALA_GLOBAL_ID, ya.id); setMiId(ya.id); }
          }
        }
      })
      .catch(e => console.error("Catch participantes:", e));
  }, []);

  function onUnirse(participante) {
    localStorage.setItem("miId_"+SALA_GLOBAL_ID, participante.id);
    if (participante.whatsapp) localStorage.setItem("quiniela_wa", participante.whatsapp);
    if (participante.nombre)   localStorage.setItem("quiniela_nombre", participante.nombre);
    setParticipantes(prev => {
      const existe = prev.find(p => p.id === participante.id);
      return existe ? prev : [...prev, participante];
    });
    setMiId(participante.id); // → directo a la sala
  }

  const [vioIntro, setVioIntro] = useState(() => !!localStorage.getItem("vioIntro"));
  const [showDepositoModal, setShowDepositoModal] = useState(() => !localStorage.getItem("vioDeposito"));
  const JERSEY_CIERRE = new Date("2026-06-18T23:45:00Z");
  const [showJerseyPopup, setShowJerseyPopup] = useState(false);
  useEffect(() => {
    if (new Date() >= JERSEY_CIERRE) return;
    if (sessionStorage.getItem("vioJerseyPopup")) return;
    const t = setTimeout(() => { setShowJerseyPopup(true); sessionStorage.setItem("vioJerseyPopup","1"); }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Prompt quiniela — aparece si el usuario tiene 0 pronósticos después de 5s
  const [showQuinielaPrompt, setShowQuinielaPrompt] = useState(false);

  useEffect(() => {
    if (!miId || !participantes.length) return;
    if (localStorage.getItem("skipQuinielaPrompt_"+miId)) return;
    const t = setTimeout(async () => {
      const { count } = await supabase.from("pronosticos_partidos")
        .select("id", { count:"exact", head:true }).eq("participante_id", miId);
      if ((count || 0) === 0) setShowQuinielaPrompt(true);
    }, 5000);
    return () => clearTimeout(t);
  }, [miId, participantes]);

  // Prompt de contraseña para cuentas antiguas sin password
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordShow, setNewPasswordShow] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!miId || !participantes.length) return;
    const yo = participantes.find(p => p.id === miId);
    if (yo && !yo.password && !localStorage.getItem("skipPasswordPrompt_"+miId)) {
      // Mostrar prompt después de 2s para no abrumar
      const t = setTimeout(() => setShowPasswordPrompt(true), 2000);
      return () => clearTimeout(t);
    }
  }, [miId, participantes]);

  async function guardarPassword() {
    if (!newPassword.trim()) return;
    setSavingPassword(true);
    await supabase.from("participantes").update({ password: newPassword.trim() }).eq("id", miId);
    setParticipantes(prev => prev.map(p => p.id === miId ? { ...p, password: newPassword.trim() } : p));
    setSavingPassword(false);
    setShowPasswordPrompt(false);
  }

  // Banner carrusel — visible para todos (no solo iOS) salvo standalone o ya cerrado
  const [showInstall, setShowInstall] = useState(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const yaVio = !!localStorage.getItem("vioInstallBanner");
    return !isStandalone && !yaVio;
  });

  function cerrarInstall() {
    localStorage.setItem("vioInstallBanner", "1");
    setShowInstall(false);
  }

  // Carrusel de banners: publicidad + recordatorios (15s por slide)
  const BANNER_SLIDES = [
    {
      bg:"linear-gradient(135deg,#7c3aed,#1d4ed8)",
      emoji:"📲", shadow:"#7c3aed55",
      titulo:"Agregar a pantalla de inicio",
      desc:"Accede a la quiniela en 1 toque, sin buscar el link",
      cta: null, // sin botón extra, solo el ✕
    },
    {
      bg:"linear-gradient(135deg,#0891b2,#0d9488)",
      emoji:"📅", shadow:"#0891b255",
      titulo:"¿Ya tienes el calendario?",
      desc:"104 partidos del Mundial directo en tu cel con recordatorios antes de cada juego",
      cta: null,
    },
    {
      bg:"linear-gradient(135deg,#e11d48,#f97316)",
      emoji:"💰", shadow:"#e11d4855",
      titulo:`Acumulado: $${(participantes.length * 250).toLocaleString("es-MX")} MXN`,
      desc:`${participantes.length} jugadores ya están adentro — ¿Ya invitaste a tus amigos?`,
      cta: null,
    },
    {
      bg:"linear-gradient(135deg,#7c3aed,#db2777)",
      emoji:"🏆", shadow:"#db277755",
      titulo:"¿Quién va a ganar el Mundial?",
      desc:"Ve tus pronósticos y sube en la tabla · El 1er lugar gana el acumulado",
      cta: null,
    },
  ];

  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => {
    if (!showInstall) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNER_SLIDES.length), 15000);
    return () => clearInterval(t);
  }, [showInstall]);

  // Popup de calendario — aparece solo después de que el usuario cambia de tab (señal de que ya exploró)
  // y mínimo 30s después de entrar, solo una vez
  const [showCalPopup, setShowCalPopup] = useState(false);
  const [calTimerReady, setCalTimerReady] = useState(false);
  const [calTabReady, setCalTabReady] = useState(false);

  useEffect(() => {
    if (!miId) return;
    if (localStorage.getItem("vioCalendarioPopup")) return;
    // Timer: mínimo 30s en la app
    const t = setTimeout(() => setCalTimerReady(true), 30000);
    return () => clearTimeout(t);
  }, [miId]);

  // Se dispara cuando AMBAS condiciones se cumplen: timer + cambió de tab
  useEffect(() => {
    if (calTimerReady && calTabReady && !localStorage.getItem("vioCalendarioPopup")) {
      setShowCalPopup(true);
    }
  }, [calTimerReady, calTabReady]);

  function cerrarCalPopup() {
    localStorage.setItem("vioCalendarioPopup","1");
    setShowCalPopup(false);
  }

  const InstallBanner = () => {
    if (!showInstall) return null;
    const slide = BANNER_SLIDES[bannerIdx];
    return (
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:999,
        background: slide.bg,
        padding:"14px 18px 26px",
        boxShadow:`0 -4px 24px ${slide.shadow}`,
        fontFamily:"Inter,sans-serif",
        transition:"background 0.6s ease",
      }}>
        {/* Cerrar */}
        <button onClick={cerrarInstall} style={{
          position:"absolute", top:10, right:14, background:"none", border:"none",
          color:"#ffffff99", fontSize:20, cursor:"pointer", lineHeight:1,
        }}>✕</button>

        {/* Contenido */}
        <div style={{ display:"flex", alignItems:"center", gap:12, paddingRight:28 }}>
          <span style={{ fontSize:32, lineHeight:1 }}>{slide.emoji}</span>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:700, fontSize:14, marginBottom:2 }}>{slide.titulo}</div>
            <div style={{ color:"#ffffffcc", fontSize:12, lineHeight:1.4 }}>{slide.desc}</div>
          </div>
        </div>

        {/* Dots indicadores */}
        <div style={{ display:"flex", justifyContent:"center", gap:6, marginTop:12 }}>
          {BANNER_SLIDES.map((_,i) => (
            <button key={i} onClick={() => setBannerIdx(i)} style={{
              width: i === bannerIdx ? 18 : 6, height:6, borderRadius:3,
              background: i === bannerIdx ? "#fff" : "#ffffff44",
              border:"none", cursor:"pointer", padding:0,
              transition:"all 0.3s",
            }}/>
          ))}
        </div>

        {/* Barra de progreso 15s */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"#ffffff22", overflow:"hidden" }}>
          <div key={bannerIdx} style={{
            height:"100%", background:"#ffffff88",
            animation:"bannerProgress 15s linear forwards",
          }}/>
        </div>
        <style>{`@keyframes bannerProgress { from{width:0%} to{width:100%} }`}</style>
      </div>
    );
  };

  const Footer = () => (
    <div style={{
      textAlign:"center", padding:"20px 20px 32px",
      borderTop:`1px solid ${C.border}22`,
      marginTop:8,
    }}>
      <div style={{marginBottom:10}}>
        <span style={{
          background:"linear-gradient(90deg,#7c3aed,#1d4ed8)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          fontWeight:700, fontSize:12,
        }}>MarketerIA</span>
        <span style={{color:C.muted, fontSize:12}}> · Desarrollado por </span>
        <span style={{color:C.muted, fontSize:12, fontWeight:600}}>Rocco Garcini</span>
      </div>
      <p style={{color:C.muted, fontSize:11, margin:"0 0 14px", lineHeight:1.6, maxWidth:360, marginLeft:"auto", marginRight:"auto"}}>
        Esta app es un juego entre amigos. No somos una casa de apuestas ni intermediarios de pagos. Los datos que proporcionas (nombre y WhatsApp) se usan únicamente para identificarte dentro de la app.
      </p>
      <p style={{color:C.muted, fontSize:12, margin:"0 0 10px", lineHeight:1.5}}>
        ¿Quieres tu propio desarrollo con IA?<br/>
        <span style={{color:C.text}}>Realizamos tu proyecto a la medida.</span>
      </p>
      <a
        href="https://wa.me/524431406867?text=Hola%20Rocco%2C%20vi%20tu%20app%20del%20Mundial%20y%20me%20interesa%20un%20desarrollo%20con%20IA%20%F0%9F%9A%80"
        target="_blank" rel="noreferrer"
        style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"#25d366", color:"#fff",
          padding:"10px 20px", borderRadius:24,
          fontSize:13, fontWeight:700, textDecoration:"none",
        }}>
        💬 Contáctanos por WhatsApp
      </a>
    </div>
  );


  if (loading) return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif" }}>
      <div style={{ color:C.muted,fontSize:16 }}>Cargando...</div>
    </div>
  );

  // Sala global no cargó (error de red)
  if (!sala) return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",flexDirection:"column",gap:12 }}>
      <div style={{ fontSize:40 }}>⚽</div>
      <div style={{ color:C.muted,fontSize:14 }}>Error al cargar. Intenta de nuevo.</div>
      <button style={Btn()} onClick={()=>window.location.reload()}>Reintentar</button>
    </div>
  );

  // Modal popup de calendario (5s tras entrar a sala)
  const CalendarioPopup = () => {
    if (!showCalPopup) return null;
    const yo = participantes.find(p => p.id === miId);
    const equipoDef = yo?.equipo || "";
    const [sel, setSel] = useState(equipoDef ? [equipoDef] : []);
    const icsUrl = sel.length > 0
      ? `https://quienvaaganar.vercel.app/api/calendar.ics?teams=${encodeURIComponent(sel.join(","))}`
      : "https://quienvaaganar.vercel.app/api/calendar.ics";
    const webcalUrl = icsUrl.replace("https://","webcal://");
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`;
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1100, background:"#000000bb", display:"flex", alignItems:"flex-end", justifyContent:"center", fontFamily:"Inter,sans-serif" }}
        onClick={cerrarCalPopup}>
        <div style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:480 }}
          onClick={e => e.stopPropagation()}>
          {/* Handle */}
          <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 20px" }} />
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
            <div style={{ color:C.text, fontWeight:700, fontSize:18, marginBottom:6 }}>Agrega el calendario del Mundial</div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>104 partidos directo en tu cel · Notificación antes de cada juego</div>
          </div>
          {/* Chip de equipo */}
          {equipoDef && (
            <div style={{ marginBottom:14 }}>
              <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>¿Seguir solo a tu equipo?</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[{label:"🌍 Todos los partidos", val:[]}, {label:`${yo?.flag||""} Solo ${equipoDef}`, val:[equipoDef]}].map((opt,i) => (
                  <button key={i} onClick={() => setSel(opt.val)} style={{
                    padding:"8px 14px", borderRadius:20, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                    background: JSON.stringify(sel)===JSON.stringify(opt.val) ? "linear-gradient(90deg,#7c3aed,#1d4ed8)" : C.bg,
                    color: JSON.stringify(sel)===JSON.stringify(opt.val) ? "#fff" : C.muted,
                  }}>{opt.label}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <a href={webcalUrl} onClick={() => setTimeout(cerrarCalPopup, 1000)} style={{ ...BtnP, display:"block", textAlign:"center", padding:14, fontSize:14, textDecoration:"none", borderRadius:10 }}>
              🍎 Agregar a Apple Calendar
            </a>
            <a href={googleUrl} target="_blank" rel="noreferrer" onClick={() => setTimeout(cerrarCalPopup, 1000)} style={{ ...Btn({ display:"block", textAlign:"center", padding:13, fontSize:14, textDecoration:"none", borderRadius:10 }) }}>
              📆 Agregar a Google Calendar
            </a>
            <button onClick={cerrarCalPopup} style={{ ...Btn({ width:"100%", padding:12, fontSize:14, background:C.green+"22", color:C.green, border:`1px solid ${C.green}44` }) }}>
              ✅ Ya lo hice
            </button>
            <button onClick={cerrarCalPopup} style={{ ...Btn({ width:"100%", padding:10, fontSize:12 }), color:C.muted }}>
              Saltar por ahora
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ¿Ya estoy registrado?
  if (!miId || !participantes.find(p=>p.id===miId)) {
    if (!vioIntro) {
      return <><Onboarding onTerminar={() => { localStorage.setItem("vioIntro","1"); setVioIntro(true); }} /><Footer /></>;
    }
    return <><Unirse sala={sala} participantes={participantes} onJoin={onUnirse} /><Footer /></>;
  }

  // Modal: crear contraseña para cuentas antiguas
  const PasswordPrompt = () => {
    if (!showPasswordPrompt) return null;
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1200, background:"#000000cc", display:"flex", alignItems:"flex-end", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
        <div style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:480 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 18px" }} />
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🔒</div>
            <div style={{ color:C.text, fontWeight:700, fontSize:18, marginBottom:6 }}>Crea tu contraseña</div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.5 }}>La necesitarás para entrar desde otro cel o si borras el historial del navegador.</div>
          </div>
          <div style={{ position:"relative", marginBottom:10 }}>
            <input
              style={{ ...inp }}
              placeholder="Escribe una contraseña"
              type={newPasswordShow ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoFocus
            />
            <button onClick={() => setNewPasswordShow(v=>!v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>
              {newPasswordShow ? "🙈" : "👁️"}
            </button>
          </div>
          <button onClick={guardarPassword} disabled={!newPassword.trim() || savingPassword}
            style={{ ...BtnP, width:"100%", padding:13, fontSize:15, marginBottom:10, opacity: !newPassword.trim() ? 0.4 : 1 }}>
            {savingPassword ? "Guardando..." : "Guardar contraseña →"}
          </button>
          <button onClick={() => { localStorage.setItem("skipPasswordPrompt_"+miId,"1"); setShowPasswordPrompt(false); }}
            style={{ ...Btn({ width:"100%", padding:10, fontSize:13 }), color:C.muted }}>
            Ahora no
          </button>
        </div>
      </div>
    );
  };

  const QuinielaPrompt = () => {
    if (!showQuinielaPrompt) return null;
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1200, background:"#000000cc", display:"flex", alignItems:"flex-end", justifyContent:"center", fontFamily:"Inter,sans-serif" }}>
        <div style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 36px", width:"100%", maxWidth:480 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"0 auto 18px" }} />
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>🎯</div>
            <div style={{ color:C.text, fontWeight:700, fontSize:18, marginBottom:6 }}>¡Llena tu quiniela!</div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>
              Pronostica <strong style={{color:C.text}}>Gana · Empate · Pierde</strong> en cada partido.<br/>
              Gana 2pts · Empate 1pt · Fallo 0pts<br/>
              <span style={{color:"#a78bfa"}}>+ preguntas bonus para sumar extra 🔥</span>
            </div>
          </div>
          <button onClick={() => { setShowQuinielaPrompt(false); }}
            style={{ ...BtnP, width:"100%", padding:13, fontSize:15, marginBottom:10,
              background:"linear-gradient(90deg,#7c3aed,#1d4ed8)" }}>
            Ir a mi quiniela →
          </button>
          <button onClick={() => { localStorage.setItem("skipQuinielaPrompt_"+miId,"1"); setShowQuinielaPrompt(false); }}
            style={{ ...Btn({ width:"100%", padding:10, fontSize:13 }), color:C.muted }}>
            Ahora no
          </button>
        </div>
      </div>
    );
  };

  const AvisoApuesta = () => {
    const key = `avisoApuesta_${miId}`;
    const yo = participantes.find(p => p.id === miId);
    const yaTieneDecision = !!yo?.modo_jugador;
    const [visible, setVisible] = useState(() => !!miId && !localStorage.getItem(key));
    const [eligiendo, setEligiendo] = useState(false);
    // Si ya tiene modo_jugador en BD, guardar en localStorage y no mostrar
    useEffect(() => {
      if (yaTieneDecision && visible) {
        localStorage.setItem(key, "1");
        setVisible(false);
      }
    }, [yaTieneDecision]);
    if (!miId || !visible) return null;
    async function elegir(conLana) {
      setEligiendo(true);
      localStorage.setItem(key, "1");
      await supabase.from("participantes")
        .update({ modo_jugador: conLana ? "dinero" : "retos" })
        .eq("id", miId);
      setVisible(false);
      setEligiendo(false);
    }
    return (
      <div style={{ position:"fixed", inset:0, zIndex:1300, background:"#000000dd", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"Inter,sans-serif" }}>
        <div style={{ background:C.card, borderRadius:20, padding:"28px 22px", width:"100%", maxWidth:400, border:`1px solid #7c3aed44` }}>
          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:44, marginBottom:10 }}>⚽💰</div>
            <div style={{ color:C.text, fontWeight:700, fontSize:17, marginBottom:10, lineHeight:1.4 }}>
              Recuerda que no somos una casa de apuestas
            </div>
            <div style={{ color:C.muted, fontSize:13, lineHeight:1.7 }}>
              Somos una <strong style={{color:C.text}}>quiniela entre amigos</strong>.<br/>
              Los <strong style={{color:"#fbbf24"}}>$250 pesos</strong> se te pedirán en su momento cuando el admin lo indique.<br/><br/>
              ¿Quieres entrar con lana o solo por la gloria? 😄
            </div>
          </div>
          <button onClick={() => elegir(true)} disabled={eligiendo}
            style={{ ...BtnP, width:"100%", padding:13, fontSize:14, marginBottom:10, background:"linear-gradient(90deg,#16a34a,#15803d)", opacity:eligiendo?0.7:1 }}>
            {eligiendo ? "Guardando…" : "💰 Voy con todo — entro con $250"}
          </button>
          <button onClick={() => elegir(false)} disabled={eligiendo}
            style={{ ...Btn({ width:"100%", padding:13, fontSize:13 }), color:C.muted, opacity:eligiendo?0.7:1 }}>
            🎲 Solo por diversión — nada que perder... ni ganar 😅
          </button>
        </div>
      </div>
    );
  };

  return <><Sala sala={sala} miId={miId} onFirstTabChange={() => setCalTabReady(true)} /><Footer /><InstallBanner /><CalendarioPopup /><PasswordPrompt /><QuinielaPrompt /><AvisoApuesta />
    {showJerseyPopup && (
      <div style={{ position:"fixed", inset:0, background:"#000d", zIndex:9200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setShowJerseyPopup(false)}>
        <div style={{ maxWidth:400, width:"100%", position:"relative" }} onClick={e=>e.stopPropagation()}>
          <button onClick={() => setShowJerseyPopup(false)} style={{ position:"absolute", top:10, right:10, background:"#000a", border:"none", color:"#fff", borderRadius:"50%", width:32, height:32, fontSize:18, cursor:"pointer", zIndex:1 }}>×</button>
          <img src="/jersey.png" alt="Jersey" style={{ width:"100%", borderRadius:20, display:"block" }} />
          <button onClick={() => setShowJerseyPopup(false)}
            style={{ marginTop:12, width:"100%", padding:"13px", borderRadius:14, border:"none", background:"linear-gradient(90deg,#16a34a,#15803d)", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>
            ⚽ Ir a mi quiniela y participar
          </button>
        </div>
      </div>
    )}
    {showDepositoModal && (
      <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:9100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ maxWidth:420, width:"100%", position:"relative" }}>
          <img src="/deposito.png" alt="Depósito" style={{ width:"100%", borderRadius:20, display:"block" }} />
          <button onClick={() => { localStorage.setItem("vioDeposito","1"); setShowDepositoModal(false); }}
            style={{ marginTop:14, width:"100%", padding:"13px", borderRadius:14, border:"none", background:"#7c3aed", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>
            Entendido ✓
          </button>
        </div>
      </div>
    )}
  </>;

}
