# Clap YouTube Automation

Automatizacion local para Windows: abre una pagina en Chrome, escucha el microfono y, cuando detecta dos aplausos seguidos, abre una URL de YouTube.

## Como usarlo

1. Ejecuta `start-clap-youtube.bat`.
2. Se abrira Chrome con la app local.
3. En Chrome, presiona `Activar escucha`.
4. Acepta el permiso del microfono.
5. Aplaude dos veces.

## Cambiar la cancion

Abre `config.js` y cambia:

```js
youtubeUrl: "https://www.youtube.com/results?search_query=tu+cancion+favorita",
```

Puedes usar una URL exacta de video, playlist o busqueda de YouTube.

## Ajustar la sensibilidad

En `config.js`, cambia `clapThreshold`.

- Si se activa con ruidos normales, subelo: `0.50`, `0.60`.
- Si no detecta tus aplausos, bajalo: `0.35`, `0.30`.

## Nota

El navegador exige que hagas clic una vez en `Activar escucha` para permitir el microfono. Despues de eso, la automatizacion queda escuchando mientras la ventana siga abierta.

El archivo `start-clap-youtube.bat` levanta un servidor local temporal con Node.js en `127.0.0.1`. No usa internet salvo cuando abre YouTube.
