// rails.js — czysta logika kształtu torów i skrętów wagonika.
// BEZ importu three / DOM, aby dało się to testować w Node (node --test).
//
// Konwencja kierunków sąsiadów (czy w danej komórce jest tor):
//   west  = sąsiad -x
//   east  = sąsiad +x
//   north = sąsiad -z
//   south = sąsiad +z
//
// orient:
//   prosty: 'ns' (wzdłuż osi Z) | 'ew' (wzdłuż osi X)
//   łuk:    'ne' | 'es' | 'sw' | 'wn'  (para ŁĄCZONYCH krawędzi)

// Kształt toru do wyrenderowania. canCurve = czy blok potrafi zakręcać (tylko zwykły RAIL).
export function railShape(west, east, north, south, canCurve = true) {
  const nx = (west ? 1 : 0) + (east ? 1 : 0);
  const nz = (north ? 1 : 0) + (south ? 1 : 0);

  // Łuk tylko gdy dokładnie jedna oś X i jedna oś Z ma sąsiada (klasyczne L),
  // albo przy złączu (deterministyczny priorytet narożników).
  if (canCurve && nx >= 1 && nz >= 1) {
    if (north && east) return { shape: 'curve', orient: 'ne' };
    if (east && south) return { shape: 'curve', orient: 'es' };
    if (south && west) return { shape: 'curve', orient: 'sw' };
    if (west && north) return { shape: 'curve', orient: 'wn' };
  }

  // Prosty: wybierz oś. Przy przelocie/złączu preferuj oś z parą sąsiadów.
  if (nx > 0 && nz === 0) return { shape: 'straight', orient: 'ew' };
  if (nz > 0 && nx === 0) return { shape: 'straight', orient: 'ns' };
  if (nx === 2 && nz !== 2) return { shape: 'straight', orient: 'ew' };
  if (nz === 2 && nx !== 2) return { shape: 'straight', orient: 'ns' };
  return { shape: 'straight', orient: 'ns' };   // izolowany / symetryczne złącze
}

// Skręt wagonika na końcu bieżącego odcinka: dokąd pojechać dalej.
// axis = 'x'|'z', dir = +1|-1 (bieżący ruch). Zwraca { axis, dir } albo null (brak toru).
export function railTurn(axis, dir, west, east, north, south) {
  if (axis === 'x') {
    // jechaliśmy wzdłuż X → szukaj kontynuacji na Z (zakręt)
    if (south) return { axis: 'z', dir: 1 };
    if (north) return { axis: 'z', dir: -1 };
  } else {
    if (east) return { axis: 'x', dir: 1 };
    if (west) return { axis: 'x', dir: -1 };
  }
  return null;
}
