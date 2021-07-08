
Megaplot is a TypeScript + WebGL engine for implementing high-performance,
large-scale, interactive data visualizations.

Visualizations rendered with Megaplot are:

* Smooth — Visualizations should not be jittery or laggy and should respond
  quickly to user interaction. The API should make it easy for developers to
  carry out expensive operations without locking up.
* Beautiful — Elements should be superbly designed and rendered with the
  greatest fidelity afforded by the platform.
* Fast — Operations should be performed as quickly as possible without
  sacrificing the quality of the user experience.
* Big — The engine should be able to handle as much data as the browser can
  receive and process. Data points should be able to number into the hundreds
  of thousands without significant degradation.
* Accessible — Different viewers have different needs. Visualizations made with
  Megaplot should work for as many users as possible. While ultimately the
  appearance and functionality of a visualization made with Megaplot
  depends on the implementer, Megaplot should provide functionality to make
  it easy for implementers to make visualizations that are widely accessible.

## Megaplot Benefits

Compared to other web-based, data visualization rendering options, Megaplot
offers these unique benefits:

* Integrated Coordinate Systems — Many rendering environments assume a
  particular coordinate system (such as 2D pixel space or 3D world coordinates).
  Megaplot combines world coordinates and pixel coordinates. Objects can
  have positions in both systems, and these are additive. This allows the
  developer to achieve previously challenging effects such labels with fixed
  pixel offsets from particular world coordinates, or size minimums/maximums
  specified in pixels.
* Interactive Vector Graphics at Scale — Megaplot is designed to render hundreds
  of thousands of data objects while still responding to user input. Data is
  expected to change in response to user interactions.
* Ubiquitous Interruptible Animations — Sprite attributes are interpolated on
  the GPU for smooth animations frame-by-frame. Animations are interruptible,
  with most attributes preserving momentum between changes (no abrupt stop and
  restart).

In addition to those benefits, Megaplot offers these features:

* Scale - Render hundreds of thousands of datapoints.
* High Fidelity — Objects rendered by Megaplot have shapes and borders computed
  on the GPU with vector-graphic precision. No pixelation of curves and other
  shapes when zoomed.
* Declarative, Attribute-based API — Each Sprite has a number of attributes
  which can be set to define its position and appearance.
* Hit Testing — To support mouse/touch interactivity, Megaplot provides a hit
  testing API wherein the developer can probe for which objects intersect a
  particular pixel coordinate of interest.
* High-Performance Text — In a DOM context, glyphs of text are tiny vector
  images. While text with fixed coordinates can often be rendered quickly, text
  that moves can be slow. Megaplot uses a generated Signed Distance Field (SDF)
  texture for rendering glyphs efficiently at scale, commingled with other
  visual elements.

This is not an officially supported Google product.
