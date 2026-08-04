// Simplex Noise 2D — Stefan Gustavson algorithm, seeded version
export class SimplexNoise {
  constructor(seed = 0) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = (seed ^ 0xDEADBEEF) >>> 0;
    const rand = () => { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return (s >>> 0) / 0x100000000; };
    for (let i = 255; i > 0; i--) { const j = (rand() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { this.perm[i] = p[i & 255]; this.permMod12[i] = this.perm[i] % 12; }
  }

  noise2D(x, y) {
    const G = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const [i1, j1] = x0 > y0 ? [1, 0] : [0, 1];
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2*G2, y2 = y0 - 1 + 2*G2;
    const ii = i & 255, jj = j & 255;
    const { perm, permMod12 } = this;
    const gi0 = permMod12[ii + perm[jj]];
    const gi1 = permMod12[ii + i1 + perm[jj + j1]];
    const gi2 = permMod12[ii + 1 + perm[jj + 1]];
    const n = (gx, gy, vx, vy) => {
      let t = 0.5 - vx*vx - vy*vy;
      if (t < 0) return 0;
      t *= t; return t * t * (G[gx][0]*vx + G[gx][1]*vy);
    };
    return 70 * (n(gi0,0,x0,y0) + n(gi1,0,x1,y1) + n(gi2,0,x2,y2));
  }

  octave(x, y, oct, pers = 0.5, lac = 2.0) {
    let v = 0, a = 1, f = 1, m = 0;
    for (let i = 0; i < oct; i++) { v += this.noise2D(x*f, y*f) * a; m += a; a *= pers; f *= lac; }
    return v / m;
  }
}
