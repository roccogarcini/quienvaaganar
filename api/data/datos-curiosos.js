export const DATOS = [
  {
    tag: "🏆 Récord histórico",
    color: "#7F77DD",
    num: "6",
    titulo: "Messi, Cristiano y Ochoa. Seis Mundiales cada uno.",
    cuerpo: "Nadie en la historia del fútbol lo había hecho antes. Tres generaciones distintas, el mismo escenario, por sexta vez.",
  },
  {
    tag: "🌍 Geopolítica del fútbol",
    color: "#1D9E75",
    titulo: "Curazao: 185,000 habitantes, 26 jugadores convocados.",
    cuerpo: "Solo uno nació en la isla. Los otros 25 nacieron en Países Bajos. El país tiene casi los mismos habitantes que Badajoz, España. Y está en el Mundial.",
  },
  {
    tag: "⚡ Extremos de edad",
    color: "#D85A30",
    num: "43 vs 17",
    titulo: "El mayor y el menor del torneo.",
    cuerpo: "Craig Gordon (Escocia) y Gilberto Mora (México). 25 años de diferencia en el mismo Mundial.",
  },
  {
    tag: "📏 Extremos de altura",
    color: "#D85A30",
    num: "2.05 vs 1.60",
    titulo: "Casi medio metro de diferencia.",
    cuerpo: "Wiegele (Austria) vs Yanis (Panamá). Los dos extremos de altura de todo el torneo.",
  },
  {
    tag: "📊 Estadística",
    color: "#378ADD",
    num: "891 / 1,248",
    titulo: "Casi 3 de cada 4 jugadores debutan en un Mundial.",
    cuerpo: "El torneo más grande de la historia (48 equipos) también es el más virgen. El 71% de los jugadores nunca habían pisado este escenario.",
  },
  {
    tag: "🟡 El drama",
    color: "#BA7517",
    titulo: "Senegal quedó eliminado… por tarjetas amarillas.",
    cuerpo: "En 2018, Senegal y Japón estaban empatados en todo: puntos, goles, diferencia. El desempate fue la disciplina. Senegal tenía más amarillas. Afuera.",
  },
  {
    tag: "🏟 Icono",
    color: "#1D9E75",
    titulo: "El Estadio Azteca es único en la historia del mundo.",
    cuerpo: "Es el único estadio que ha albergado tres partidos inaugurales de Copa del Mundo: 1970, 1986 y 2026. No existe otro caso igual.",
  },
  {
    tag: "👨‍👦 Familia",
    color: "#D4537E",
    titulo: "8 pares de hermanos. 4 de ellos en selecciones distintas.",
    cuerpo: "Los Timber en Holanda, los Duarte en Cabo Verde, los Bacuna en Curazao. Los hermanos Xhaka: uno con Suiza y otro con Albania, enfrentándose en la Eurocopa anterior.",
  },
  {
    tag: "🏴 Racha",
    color: "#378ADD",
    titulo: "Países Bajos no pierde un partido mundialista desde 2010.",
    cuerpo: "La última derrota fue la final de Sudáfrica: España 1-0. Desde entonces, 16 años sin perder en fase de grupos o eliminatorias mundialistas.",
  },
  {
    tag: "🔴 La más violenta",
    color: "#D85A30",
    titulo: "La Batalla de Núremberg, 2006.",
    cuerpo: "Portugal vs Países Bajos: 16 amarillas, 4 rojas, cuatro expulsados en un solo partido. Portugal ganó 1-0 en octavos. Fue fútbol… en el sentido más amplio de la palabra.",
  },
  {
    tag: "⏳ Sequía",
    color: "#BA7517",
    titulo: "Brasil lleva 24 años sin ganar un Mundial.",
    cuerpo: "Es el único país presente en todos los Mundiales de la historia. Tiene 5 títulos. Pero el último fue en 2002, en Corea-Japón. La espera se alarga.",
  },
  {
    tag: "🔴 Maldición",
    color: "#7F77DD",
    titulo: "Suiza pasa la fase de grupos. Y ahí se queda.",
    cuerpo: "Tres Mundiales seguidos clasificando. Tres veces eliminada en octavos. No llegan a cuartos de final desde 1954. 72 años de frustración puntual.",
  },
  {
    tag: "📡 Tecnología",
    color: "#1D9E75",
    titulo: "El Mundial 2026 tiene IA integrada en el arbitraje.",
    cuerpo: "Sensores en los balones, cámaras especiales, avatares 3D hiperrealistas y sistemas automatizados de decisión. La FIFA apostó todo a eliminar el error humano. O intentarlo.",
  },
];

// Día 0 = 11 jun 2026
const INICIO = new Date("2026-06-11T00:00:00-06:00");
export function datoDia(fecha = new Date()) {
  const dias = Math.floor((fecha - INICIO) / 86400000);
  return DATOS[Math.max(0, dias) % DATOS.length];
}
