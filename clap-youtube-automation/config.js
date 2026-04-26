window.CLAP_AUTOMATION_CONFIG = {
  // Cambia esta URL por la cancion exacta que quieras abrir.
  youtubeUrl: "https://www.youtube.com/results?search_query=tu+cancion+favorita",

  // Dos aplausos deben ocurrir dentro de este tiempo.
  doubleClapWindowMs: 900,

  // Sube este valor si se activa con ruidos normales. Bajalo si no detecta tus aplausos.
  clapThreshold: 0.42,

  // Tiempo minimo entre aplausos para evitar contar un solo aplauso dos veces.
  minGapBetweenClapsMs: 140,

  // Tiempo de espera despues de abrir YouTube para no repetir la accion.
  cooldownMs: 4500
};
