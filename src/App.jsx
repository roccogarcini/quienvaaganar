// ============================================
// quienvaaganar.mx
// Stack: React + Vite + Supabase + Vercel
//
// SETUP:
// 1. npm create vite@latest quienvaaganar -- --template react
// 2. cd quienvaaganar && npm install @supabase/supabase-js react-router-dom
// 3. Crea .env con tus keys de Supabase
// 4. Reemplaza este archivo como src/App.jsx
// 5. npm run dev
// ============================================

// ── src/lib/supabase.js ──────────────────────
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// )

// ── src/App.jsx ──────────────────────────────
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURA AQUÍ ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://TU_PROYECTO.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "TU_ANON_KEY";
const APP_URL = import.meta.env.VITE_APP_URL || "https://quienvaaganar.vercel.app";
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
  const [nombre] = useState("Quiniela Mundial 2026");
  const [modo, setModo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cuota, setCuota] = useState(100);
  const [castigos, setCastigos] = useState([...DEF_CASTIGOS]);
  const [newC, setNewC] = useState("");
  const [step, setStep] = useState(1); // 1=modo, 2=config, 3=castigos, 4=invitar
  const [loading, setLoading] = useState(false);
  const [salaId, setSalaId] = useState(null);
  const [invitados, setInvitados] = useState([]); // [{nombre, wa}]
  const [newInvNombre, setNewInvNombre] = useState("");
  const [newInvWa, setNewInvWa] = useState("");

  async function crear() {
    if (!nombre.trim() || !modo) return;
    setLoading(true);
    const id = Math.random().toString(36).substr(2, 8);
    const { error } = await supabase.from("salas").insert({
      id, nombre, modo, cuota: modo === "dinero" ? cuota : modo === "hibrido" ? 250 : 0,
      castigos, flash: [], stage: "Grupos"
    });
    if (!error) {
      setSalaId(id);
      if (modo === "dinero") { setStep(4); setLoading(false); }
      else onCreate(id);
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
            Un juego hecho para tenerte al día con el Mundial 2026 de una manera divertida. <strong style={{color:"#a78bfa"}}>Tú decides</strong> si le entras a la apuesta o solo entras a divertirte.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["📅","Calendario del Mundial","Todos los partidos y horarios","calendario"],
              ["⚽","Marcadores en vivo","Resultados al momento","marcadores"],
              ["🧠","Tips de football","Para entender el juego aunque no sepas nada","tips"],
              ["🏆","Apuestas con amigos","Dinero o retos — tú decides","apuestas"],
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
            disabled={!modo} onClick={() => setStep(modo==="dinero" ? 2 : 3)}>
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
              const link = `${APP_URL}/sala/${salaId}`;
              const texto = `Hey ${inv.nombre} 👋\n\n💰 Te invito a una apuesta del Mundial 2026\n\nEl monto es de *$${cuota} pesos* — el que pierda paga.\n\n👉 Entra aquí: ${link}`;
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

// ── PANTALLA: UNIRSE ──────────────────────────
function Unirse({ sala, participantes, onJoin }) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState(() => localStorage.getItem("quiniela_wa") || "");
  const [equipo, setEquipo] = useState("");
  const [modoJugador, setModoJugador] = useState(sala.modo === "hibrido" ? "dinero" : sala.modo);
  const [apuesta, setApuesta] = useState(sala.cuota > 0 ? sala.cuota : 100);
  const [pronCamp, setPronCamp] = useState("");
  const [pronSub, setPronSub] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const usados = participantes.map(p => p.equipo);
  const disponibles = TEAMS.filter(t => !usados.includes(t.n));

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
    ctx.fillText(`${APP_URL}/sala/${sala.id}`,W/2,264);
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
    ctx.fillText("Calendario · Marcadores · Tips de football · Apuestas con amigos",W/2+60,354);
    ctx.fillStyle="#4b5563"; ctx.font="10px sans-serif";
    ctx.fillText("Únete solo a divertirte o entra a la apuesta — tú decides 🏆",W/2+60,371);
    ctx.fillStyle="#374151"; ctx.font="9px sans-serif";
    ctx.fillText("quienvaaganar.vercel.app",W/2+60,390);
  }

  async function unirse() {
    if (!nombre.trim() || !equipo) return;
    setLoading(true);
    const t = TEAMS.find(x => x.n === equipo);
    const { data, error } = await supabase.from("participantes").insert({
      sala_id: sala.id, nombre: nombre.trim(), whatsapp: whatsapp.trim() || null, equipo, flag: t.f,
      modo_jugador: modoJugador || sala.modo,
      apuesta: modoJugador === "dinero" ? (sala.modo === "hibrido" ? 250 : Math.min(apuesta, 500)) : 0,
      points: 0, penalties: 0, eliminado: false,
      pron_camp: pronCamp || null, pron_camp_flag: pronCamp ? TEAMS.find(x=>x.n===pronCamp)?.f : null,
      pron_sub: pronSub || null, pron_sub_flag: pronSub ? TEAMS.find(x=>x.n===pronSub)?.f : null,
    }).select().single();
    if (!error && data) onJoin(data);
    else { alert("Error: " + (error?.message || "intenta de nuevo")); setLoading(false); }
  }

  function compartirWA() {
    const canvas = canvasRef.current;
    const tc = TEAMS.find(x=>x.n===pronCamp), ts = TEAMS.find(x=>x.n===pronSub);
    const tEquipo = TEAMS.find(x=>x.n===equipo);
    const text = [
      `🏳️ Mi equipo: *${tEquipo?.f||""} ${equipo}*`,
      `🏆 Mi apuesta: *${tc?.f||""} ${pronCamp}* campeón · 🥈 *${ts?.f||""} ${pronSub}* subcampeón`,
      ``,
      `¿Cuál es tu pronóstico? Únete a "${sala.nombre}":`,
      `${APP_URL}/sala/${sala.id}`,
    ].join("\n");
    if (!canvas) { window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank"); return; }
    canvas.toBlob(async blob => {
      if (navigator.share && blob) {
        try {
          const file = new File([blob],"pronostico.png",{type:"image/png"});
          if (navigator.canShare?.({files:[file]})) { await navigator.share({title:"Mi pronóstico",text,files:[file]}); return; }
        } catch(e) {}
      }
      const a=document.createElement("a");a.href=canvas.toDataURL("image/png");a.download="pronostico-mundial.png";a.click();
      setTimeout(()=>window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank"),600);
    },"image/png");
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", padding:"24px 20px" }}>
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:40 }}>⚽</div>
          <h1 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"8px 0 4px" }}>{sala.nombre}</h1>
          <p style={{ color:C.muted, fontSize:13 }}>Regístrate para ver la tabla y participar.</p>
        </div>

        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tu nombre</div>
        <input style={{ ...inp, marginBottom:16 }} placeholder="¿Cómo te llamas?" value={nombre} onChange={e=>setNombre(e.target.value)} />

        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tu WhatsApp</div>
        <input style={{ ...inp, marginBottom:16 }} placeholder="Ej: +52 55 1234 5678" type="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} />

        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>Tu equipo</div>
        <select style={{ ...inp, marginBottom:20 }} value={equipo} onChange={e=>setEquipo(e.target.value)}>
          <option value="">— Elige tu equipo —</option>
          {disponibles.map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
        </select>

        <div style={{ color:C.muted, fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>
          Tu pronóstico (opcional)
        </div>
        <p style={{ color:C.muted, fontSize:12, marginBottom:10 }}>Predice campeón y subcampeón. Se genera una tarjeta para compartir.</p>
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

        {pronCamp && pronSub && pronCamp!==pronSub && <>
          <canvas ref={canvasRef} style={{ width:"100%", borderRadius:10, display:"block", marginBottom:10 }} />
          <button onClick={compartirWA} style={{ ...Btn({ width:"100%", padding:10, background:"#25D366", color:"#fff", border:"none", fontWeight:600, fontSize:14, marginBottom:16 }) }}>
            Compartir pronóstico por WhatsApp
          </button>
        </>}

        {sala.modo === "hibrido" && (
          <div style={{ ...cardStyle, marginBottom:16, background:"#fbbf2411", border:"1px solid #fbbf2444" }}>
            <div style={{ color:"#fbbf24", fontSize:16, fontWeight:700, marginBottom:6 }}>🔥 Quiniela Híbrida · $250 pesos</div>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.6, marginBottom:8 }}>
              Al unirte te comprometes a pagar <strong style={{color:"#fbbf24"}}>$250 pesos</strong> si quedas último o tu equipo es eliminado.
            </p>
            <p style={{ color:C.muted, fontSize:12, lineHeight:1.5 }}>
              💳 El admin te avisará cuándo y a quién pagarle. El pago se hace conforme los equipos van saliendo del torneo.
            </p>
          </div>
        )}

        {sala.modo === "dinero" && (
          <div style={{ ...cardStyle, marginBottom:16, background:"#fbbf2411", border:"1px solid #fbbf2444" }}>
            <div style={{ color:"#fbbf24", fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>💰 Tu apuesta</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <input type="range" min={10} max={500} step={10} value={apuesta}
                onChange={e => setApuesta(Number(e.target.value))}
                style={{ flex:1, accentColor:"#fbbf24" }} />
              <div style={{ color:"#fbbf24", fontWeight:700, fontSize:22, minWidth:60, textAlign:"right" }}>${apuesta}</div>
            </div>
            <p style={{ color:C.muted, fontSize:11, marginTop:8 }}>
              Si quedas último, pagas <strong style={{color:"#fbbf24"}}>${apuesta} pesos</strong> cuando el admin lo indique. 🤝
            </p>
          </div>
        )}

        <button style={{ ...BtnP, width:"100%", padding:12, fontSize:15, opacity:(!nombre.trim()||!equipo)?0.4:1 }}
          disabled={!nombre.trim()||!equipo||loading} onClick={unirse}>
          {loading ? "Entrando..." : "Entrar a la quiniela →"}
        </button>
      </div>
    </div>
  );
}

// ── PANTALLA: TABLA PRINCIPAL ─────────────────
function Sala({ sala, miId }) {
  const [participantes, setParticipantes] = useState([]);
  const [tab, setTab] = useState("tabla");
  const [sorteoP, setSorteoP] = useState(null);
  const [sorteoOpts, setSorteoOpts] = useState([]);
  const [sorteoChosen, setSorteoChosen] = useState(null);
  const [stage, setStage] = useState(sala.stage || "Grupos");
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState(sala.flash || []);

  const salaLink = `${APP_URL}/sala/${sala.id}`;
  const yo = participantes.find(p => p.id === miId);
  const esAdmin = participantes.length > 0 && participantes[0]?.id === miId;

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
    const modoTag  = yo?.modo_jugador==="dinero" ? `🤑 ¡Hay Trato! $${yo.apuesta||250}` : sala.modo==="dinero" ? `🤑 ¡Hay Trato! $${yo?.apuesta||sala.cuota}` : `🎲 retos`;
    const lines = [
      `⚽ *${nombre}* te está invitando a una apuesta del Mundial 2026`,
      ``,
      equipo   ? `🏳️ Mi equipo: *${equipo}*` : ``,
      pronCamp ? `🏆 Mi apuesta: *${pronCamp}* campeón · 🥈 *${pronSub}* subcampeón` : ``,
      `Modo: ${modoTag}`,
      ``,
      `¿Y tú? El que quede último paga un castigo 😈`,
      ``,
      `👉 Únete: ${salaLink}`,
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
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"Inter,sans-serif" }}>
      {/* Header */}
      <div style={{ background:"#0f1829", padding:"16px 20px 0", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ color:C.text, fontSize:17, fontWeight:600 }}>{sala.nombre}</div>
            <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
              <span style={{ background:"#1d4ed833", color:"#60a5fa", fontSize:11, padding:"2px 8px", borderRadius:20 }}>
                {sala.modo==="dinero"?"💰 Con dinero":"🎲 Con retos"}
              </span>
              {sala.modo==="dinero" && <span style={{ background:C.gold+"22", color:C.gold, fontSize:11, padding:"2px 8px", borderRadius:20 }}>${sala.cuota} por castigo</span>}
              <span style={{ background:C.green+"22", color:C.green, fontSize:11, padding:"2px 8px", borderRadius:20 }}>{participantes.length} jugadores</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button style={{ ...Btn({fontSize:12}), background:"#25D366", color:"#fff", border:"none" }} onClick={compartirWA}>Invitar</button>
            <button style={{ ...Btn({fontSize:12}) }} onClick={copiarLink}>{copied?"¡Copiado!":"Copiar link"}</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:0, marginTop:14, overflowX:"auto" }}>
          {[["tabla","Tabla"],["flash","Apuestas"],["castigos","Castigos"],["prons","Pronósticos"],["cuentas","Cuentas"],["calendario","⚽ Mundial"]].map(([k,l])=>(
            <button key={k} style={tabStyle(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"20px 16px", maxWidth:600, margin:"0 auto" }}>

        {tab==="tabla" && <>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
            {STAGES.map(s=>(
              <button key={s.n} style={stage===s.n?{...BtnP,fontSize:12}:{...Btn(),fontSize:12}} onClick={()=>updateStage(s.n)}>
                {s.n} ({s.p}pt)
              </button>
            ))}
          </div>
          {sorted.map((p,i)=>(
            <div key={p.id} style={{ ...cardStyle, opacity:p.eliminado?0.55:1, border:`0.5px solid ${p.id===miId?C.blue:C.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:14, minWidth:22 }}>{medals[i]||i+1}</span>
                  <span style={{ fontSize:26 }}>{p.flag}</span>
                  <div>
                    <div style={{ color:C.text, fontWeight:500, fontSize:14 }}>
                      {p.nombre}
                      {p.id===miId && <span style={{ background:C.blue+"33",color:C.blue,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>Tú</span>}
                      {(sala.modo==="hibrido"||sala.modo==="dinero") && p.modo_jugador==="dinero" && <span style={{ fontSize:11, marginLeft:5, color:"#fbbf24" }}>💰${p.apuesta||0}</span>}
                      {sala.modo==="hibrido" && p.modo_jugador!=="dinero" && <span style={{ fontSize:12, marginLeft:5 }}>🎲</span>}
                      {p.eliminado && <span style={{ background:C.red+"22",color:C.red,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>Eliminado</span>}
                      {!p.eliminado&&p.penalties>0 && <span style={{ background:C.red+"22",color:C.red,fontSize:10,padding:"2px 6px",borderRadius:10,marginLeft:6 }}>{p.penalties} castigo{p.penalties>1?"s":""}</span>}
                    </div>
                    <div style={{ color:C.muted, fontSize:12 }}>
                      {p.equipo}
                      {p.pron_camp && <span style={{ marginLeft:6, fontSize:11, color:"#60a5fa" }}>🏆{p.pron_camp_flag} vs 🥈{p.pron_sub_flag}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:700, color:i===0&&p.points>0?C.gold:C.text }}>{p.points}</div>
                  <div style={{ color:C.muted, fontSize:10 }}>pts</div>
                </div>
              </div>
              {/* Controles solo para admin o para el propio jugador */}
              {(esAdmin || p.id===miId) && (
                <div style={{ display:"flex", gap:6, marginTop:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                  <button style={{...BtnG,fontSize:12}} onClick={()=>modPts(p.id,curPts)}>+{curPts}</button>
                  <button style={{...BtnR,fontSize:12}} onClick={()=>modPts(p.id,-curPts)}>−{curPts}</button>
                  {esAdmin && <button style={{...Btn(),fontSize:12}} onClick={()=>toggleElim(p.id)}>{p.eliminado?"Reactivar":"Elim. equipo"}</button>}
                  {(sala.modo==="dinero"||(sala.modo==="hibrido"&&p.modo_jugador==="dinero")) && esAdmin && <button style={{...BtnW,fontSize:12}} onClick={()=>addPen(p.id)}>+castigo 💰</button>}
                </div>
              )}
            </div>
          ))}
          {participantes.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⏳</div>
              <p style={{ color:C.muted }}>Aún no hay participantes. Comparte el link para que entren.</p>
              <button style={{ ...Btn({background:"#25D366",color:"#fff",border:"none",marginTop:12,padding:"10px 24px"}) }} onClick={compartirWA}>
                Compartir por WhatsApp
              </button>
            </div>
          )}
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

        {tab==="prons" && <>
          <p style={{ color:C.muted,fontSize:13,marginBottom:12 }}>Pronósticos de todos los participantes.</p>
          {participantes.map(p=>(
            <div key={p.id} style={{ ...cardStyle, display:"flex",alignItems:"center",gap:10 }}>
              <span style={{ fontSize:22 }}>{p.flag}</span>
              <div style={{ flex:1 }}>
                <div style={{ color:C.text,fontWeight:500,fontSize:14 }}>{p.nombre}</div>
                <div style={{ color:C.muted,fontSize:12 }}>
                  {p.pron_camp
                    ? <span>🏆 {p.pron_camp_flag} {p.pron_camp} &nbsp;·&nbsp; 🥈 {p.pron_sub_flag} {p.pron_sub}</span>
                    : "Sin pronóstico aún"
                  }
                </div>
              </div>
            </div>
          ))}
        </>}

        {tab==="cuentas" && <>
          {sala.modo!=="dinero"
            ? <p style={{ color:C.muted,fontSize:13 }}>Esta quiniela es de retos, sin dinero.</p>
            : <>
              <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>Solo referencia. El dinero lo mueven ustedes.</p>
              {participantes.map(p=>{
                const v=Math.round(balances[p.id]||0);
                return(
                  <div key={p.id} style={{ ...cardStyle, display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:20 }}>{p.flag}</span>
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

        {tab==="calendario" && <Calendario salaLink={salaLink} yo={yo} />}

      </div>
    </div>
  );
}

// ── PESTAÑA: CALENDARIO MUNDIAL ───────────────
function Calendario({ salaLink, yo }) {
  const [scoreboard, setScoreboard] = useState(null);
  const [standings,  setStandings]  = useState(null);
  const [loadSb,     setLoadSb]     = useState(true);
  const [loadSt,     setLoadSt]     = useState(true);
  const [tab,        setTabCal]     = useState("resumen");
  const [dateOff,    setDateOff]    = useState(0);
  const [showCal,    setShowCal]    = useState(false);
  const [showShare,  setShowShare]  = useState(false);
  const [shareNombre,setShareNombre]= useState(yo?.nombre||"");
  const [shareWA,    setShareWA]    = useState(yo?.whatsapp||"");
  const [shareEquipo,setShareEquipo]= useState(yo?.equipo||"");
  const [nextMap,    setNextMap]    = useState({});
  const standingsCache = useRef(null);
  const nextCache      = useRef(null);

  function dateStr(off=0) {
    const d=new Date(); d.setDate(d.getDate()+off);
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
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
    setLoadSb(true);
    fetch(`/api/fotmob?endpoint=scoreboard&dates=${dateStr(dateOff)}`).then(r=>r.json())
      .then(d=>{ setScoreboard(d); setLoadSb(false); }).catch(()=>setLoadSb(false));
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
    if (events.length===0) return <p style={{color:C.muted,textAlign:"center",padding:24,fontSize:13}}>Sin partidos este día.</p>;
    // Agrupar por Ayer/Hoy/Mañana
    const byDay={};
    events.forEach(ev=>{
      const d=new Date(ev.date),hoy=new Date(),ayer=new Date(),man=new Date();
      ayer.setDate(hoy.getDate()-1); man.setDate(hoy.getDate()+1);
      const lbl=d.toDateString()===hoy.toDateString()?"Hoy":d.toDateString()===ayer.toDateString()?"Ayer":d.toDateString()===man.toDateString()?"Mañana":d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});
      if(!byDay[lbl])byDay[lbl]=[];byDay[lbl].push(ev);
    });
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
            return (
              <div key={i} style={{
                display:"grid",gridTemplateColumns:"44px 1fr auto 1fr",
                alignItems:"center",gap:6,padding:"10px 10px",
                borderBottom:i<evs.length-1?`1px solid ${C.border}20`:undefined,
                borderLeft:`3px solid ${live?"#10b981":"transparent"}`,
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
        {[["resumen","Resumen"],["tabla","Tabla"],["partidos","Partidos"],["tips","Tips 🧠"]].map(([k,l])=>(
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
                      {icon:"🪟",label:"Outlook",  url:ics.replace("webcal://","https://")},
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
                  placeholder="Tu nombre" style={{...Input(),marginBottom:8}} />
                <select value={shareEquipo} onChange={e=>setShareEquipo(e.target.value)} style={{...Input(),marginBottom:16}}>
                  <option value="">— Tu equipo favorito —</option>
                  {TEAMS.map(t=><option key={t.n} value={t.n}>{t.f} {t.n}</option>)}
                </select>
                <a href={()=>{}} onClick={(e)=>{
                  e.preventDefault();
                  const t=TEAMS.find(x=>x.n===shareEquipo);
                  const lines=[
                    `⚽ *${shareNombre||"Alguien"}* te invita a seguir el Mundial 2026`,
                    t ? `🏳️ Le voy al: *${t.f} ${t.n}*` : "",
                    ``,
                    `📊 Mira la tabla de grupos, marcadores en vivo y el calendario completo:`,
                    `👉 ${salaLink}`,
                    ``,
                    `¡Entra y haz tu quiniela! 🏆`,
                  ].filter(l=>l!==undefined);
                  window.location.href=`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
                }} style={{
                  display:"block",background:"#25d366",color:"#fff",textAlign:"center",
                  padding:"13px",borderRadius:10,fontSize:14,fontWeight:700,
                  textDecoration:"none",cursor:"pointer",
                }}>
                  Enviar por WhatsApp 💬
                </a>
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

      {/* ── TIPS ── */}
      {tab==="tips" && (
        <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:12}}>

          {/* Sección: Reglas básicas */}
          <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"0 2px"}}>
            Reglas básicas ⚽
          </div>
          {[
            {emoji:"🚩", titulo:"Fuera de juego (Offside)", texto:"Si un atacante está más cerca del arco rival que el último defensa en el momento del pase, el árbitro marca offside. El VAR lo confirma con una línea."},
            {emoji:"🟨", titulo:"Tarjetas", texto:"Amarilla = amonestación. Dos amarillas en el mismo partido = roja automática. Roja directa = expulsión inmediata. El jugador expulsado no juega el siguiente partido."},
            {emoji:"📺", titulo:"VAR (Video Assistant Referee)", texto:"Un árbitro en una sala de video revisa goles, penales, tarjetas rojas y confusiones de identidad. El árbitro en cancha puede ir a revisar la pantalla del VAR antes de decidir."},
            {emoji:"🥅", titulo:"Penal", texto:"Si un jugador comete una falta dentro del área grande de su propio arco, el árbitro marca penal. El tiro se lanza desde el punto blanco a 11 metros del arco."},
          ].map((t,i)=>(
            <div key={i} style={{background:C.card,borderRadius:12,padding:"13px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{t.emoji}</span>
              <div>
                <div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:4}}>{t.titulo}</div>
                <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.65}}>{t.texto}</div>
              </div>
            </div>
          ))}

          {/* Sección: Formato del torneo */}
          <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"4px 2px 0"}}>
            Formato del Mundial 2026 🏆
          </div>
          {[
            {emoji:"🌎", titulo:"48 equipos — el más grande de la historia", texto:"Por primera vez participan 48 selecciones divididas en 12 grupos de 4. Clasifican los 2 primeros de cada grupo + los 8 mejores terceros lugares."},
            {emoji:"📐", titulo:"¿Cómo se desempata en la tabla?", texto:"1° Puntos → 2° Diferencia de goles → 3° Goles anotados → 4° Resultado entre ellos → 5° Fair play (menos tarjetas) → 6° Sorteo FIFA."},
            {emoji:"🏟️", titulo:"Sedes: USA, México y Canadá", texto:"Partidos en 16 ciudades de 3 países. La final será en el MetLife Stadium de Nueva York/Nueva Jersey. México tiene sede en CDMX (Estadio Azteca), Guadalajara y Monterrey."},
            {emoji:"🥇", titulo:"Campeones vigentes: Argentina", texto:"La Albiceleste ganó el Mundial Qatar 2022 en penales contra Francia 3-3 (4-2 en penales). Messi levantó por fin el único título que le faltaba."},
          ].map((t,i)=>(
            <div key={i} style={{background:C.card,borderRadius:12,padding:"13px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{t.emoji}</span>
              <div>
                <div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:4}}>{t.titulo}</div>
                <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.65}}>{t.texto}</div>
              </div>
            </div>
          ))}

          {/* Sección: Para la quiniela */}
          <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"4px 2px 0"}}>
            Tips para tu quiniela 🎯
          </div>
          {[
            {emoji:"📊", titulo:"Fíjate en la diferencia de goles (DG)", texto:"En la fase de grupos dos equipos pueden empatar en puntos. El que gana más por diferencia de goles avanza. Vale la pena apostar a que tu equipo no solo gane, sino que gane bien."},
            {emoji:"🌡️", titulo:"Los favoritos no siempre ganan", texto:"En Qatar 2022 Arabia Saudita venció a Argentina, Japón a Alemania y Marruecos llegó a semis. En los Mundiales las sorpresas son parte del juego — toma riesgos en tu quiniela."},
            {emoji:"🔥", titulo:"El factor local es real", texto:"Con sede en México, la presión de la afición puede ser decisiva. Históricamente los equipos locales llegan lejos. ¿Le vas a México? Esta es su mejor oportunidad en décadas."},
          ].map((t,i)=>(
            <div key={i} style={{background:"linear-gradient(135deg,#7c3aed12,#1d4ed812)",border:"1px solid #7c3aed22",borderRadius:12,padding:"13px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22,flexShrink:0,marginTop:1}}>{t.emoji}</span>
              <div>
                <div style={{color:C.text,fontSize:13,fontWeight:600,marginBottom:4}}>{t.titulo}</div>
                <div style={{color:"#9ca3af",fontSize:12,lineHeight:1.65}}>{t.texto}</div>
              </div>
            </div>
          ))}

          <p style={{color:"#7c3aed",fontSize:11,textAlign:"center",padding:"4px 0 8px"}}>
            MarketerIA · más tips cada jornada 🚀
          </p>
        </div>
      )}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────
export default function App() {
  const [sala, setSala] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [miId, setMiId] = useState(() => localStorage.getItem("miId_"+getSalaIdFromURL()) || null);
  const [loading, setLoading] = useState(true);
  const salaId = getSalaIdFromURL();

  useEffect(() => {
    if (!salaId) { setLoading(false); return; }
    supabase.from("salas").select("*").eq("id", salaId).single()
      .then(({ data }) => {
        if (data) setSala(data);
        setLoading(false);
      });
    supabase.from("participantes").select("*").eq("sala_id", salaId).order("created_at")
      .then(({ data }) => {
        if (!data) return;
        setParticipantes(data);
        // Auto-login por WhatsApp: si no tengo miId guardado,
        // busco si mi número WA ya está en la sala
        if (!localStorage.getItem("miId_"+salaId)) {
          const miWA = localStorage.getItem("quiniela_wa");
          if (miWA) {
            const yaEstoy = data.find(p => p.whatsapp === miWA);
            if (yaEstoy) {
              localStorage.setItem("miId_"+salaId, yaEstoy.id);
              setMiId(yaEstoy.id);
            }
          }
        }
      });
  }, [salaId]);

  function onCrear(id) {
    window.location.href = `/sala/${id}`;
  }

  function onUnirse(participante) {
    localStorage.setItem("miId_"+salaId, participante.id);
    // Guardar WA globalmente para auto-login en otras salas
    if (participante.whatsapp) localStorage.setItem("quiniela_wa", participante.whatsapp);
    setParticipantes(prev => [...prev, participante]);
    setMiId(participante.id);
  }

  const Footer = () => (
    <div style={{
      textAlign:"center", padding:"16px 20px 24px",
      borderTop:`1px solid ${C.border}22`,
      marginTop:8,
    }}>
      <span style={{
        background:"linear-gradient(90deg,#7c3aed,#1d4ed8)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        fontWeight:700, fontSize:12,
      }}>MarketerIA</span>
      <span style={{color:C.muted, fontSize:12}}> · Desarrollado por </span>
      <span style={{color:C.muted, fontSize:12, fontWeight:600}}>Rocco Garcini</span>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif" }}>
      <div style={{ color:C.muted,fontSize:16 }}>Cargando...</div>
    </div>
  );

  // Sin sala en URL → pantalla de crear
  if (!salaId || !sala) return <><CrearSala onCreate={onCrear} /><Footer /></>;

  // Con sala → ¿ya entré?
  if (!miId || !participantes.find(p=>p.id===miId)) {
    return <><Unirse sala={sala} participantes={participantes} onJoin={onUnirse} /><Footer /></>;
  }

  return <><Sala sala={sala} miId={miId} /><Footer /></>;
}
