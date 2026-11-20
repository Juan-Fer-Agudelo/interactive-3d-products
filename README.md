# La pradera de Juan Fer · Portafolio 3D

Portafolio interactivo: una pradera en 3D que se recorre caminando. Empieza en una isla flotante con el nombre en letras de piedra y musgo; la cámara sigue una semilla de diente de león que baja entre las nubes hasta el campamento. Desde ahí salen senderos hacia cada sección.

La idea y el formato vienen del portafolio de Vipin Pathak, [curllmooha.com](https://www.curllmooha.com/). Todo lo que se ve aquí está dibujado con código propio: no se usan sus modelos, texturas ni textos.

## Qué hay en la pradera

| Lugar | Qué abre |
| --- | --- |
| Campamento (fogata) | Punto de partida. Descansar junto al fuego hace caer la noche. |
| Claro de televisores | Siete proyectos, cada uno en la pantalla de un televisor retro. |
| Tablero de madera | Sobre mí y resultados. |
| Papeles colgados | Habilidades. |
| Estanque y buzón | Contacto. |

Además: clima soleado o lluvia, cámara en tercera o primera persona, tres niveles de gráficos, sonido sintetizado, pasto que se dobla al pasar y queda aplastado por donde caminaste, y una versión plana de respaldo (`?plano`) para navegadores sin WebGL.

## Stack

- **React 19** + **react-three-fiber** como anfitrión del lienzo
- **Three.js** con shaders propios (pasto, hojas, cielo, agua, letras con musgo)
- **GSAP** para la intro, el clima y el paso de día a noche
- **Rapier** (`@dimforge/rapier3d-compat`) para el personaje y las colisiones
- **Web Audio API** para todo el sonido
- **Vite**

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Controles

| Tecla | Acción |
| --- | --- |
| W A S D o flechas | Caminar |
| Shift | Correr |
| Espacio | Saltar |
| Arrastrar | Mirar alrededor |
| E o clic | Abrir lo que tengas cerca |
| G | Menú de trabajo y lugares |
| C | Cambiar de cámara |
| Esc | Cerrar o saltar la intro |

En pantallas táctiles la mitad izquierda es la palanca para caminar y la derecha mueve la cámara.

## Estructura

```
src/
  main.jsx, App.jsx        arranque: tipografía, terreno, física y primer cuadro
  store.js, actions.js     estado de la interfaz y lo que pueden pedir botones y teclas
  data/profile.js          todo el contenido (edita aquí textos y proyectos)
  lib/                     física (Rapier), entrada (teclado, ratón, táctil) y audio
  world/
    terrain.js             forma del terreno, lugares y senderos
    layout.js              dónde va cada árbol, roca, farol, tablero y colisión
    shared.js              uniforms comunes, clima y niebla para los shaders
    vegetation.js          pasto, árboles y rastro de pasto pisado
    scenery.js             suelo, rocas, faroles, campamento, tableros, estanque
    atmosphere.js          cielo, luces, lluvia, semillas, pájaros, luciérnagas
    player.js              personaje, movimiento y cámara
    opening.js             isla flotante y recorrido de cámara de la intro
    Experience.jsx         lienzo y bucle de animación
  ui/                      barra de carga, HUD, paneles, versión plana
```

## Parámetros de URL

- `?entrar` salta la intro.
- `?plano` muestra la versión plana.
