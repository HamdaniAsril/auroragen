#version 300 es
precision highp float;
precision highp int;

// Units: 1 = 100 km. Camera stands at the lake shore (y = 0).
uniform vec2 uFullRes;
uniform vec2 uTileOrigin;
uniform float uTime;
uniform int uSteps;
uniform float uJitter;
uniform float uHdrOut;

uniform int uLayerCount;
uniform int uLayerType[4];
uniform float uLayerSeed[4];
uniform vec4 uLayerGeom[4];  // distance, azimuthRad, foldAmount, foldDensity
uniform vec4 uLayerRays[4];  // baseAltitude, rayHeight, rayDensity, rayContrast
uniform vec4 uLayerMisc[4];  // brightness, length, speed, fringe
uniform vec3 uLayerColBottom[4];
uniform vec3 uLayerColBody[4];
uniform vec3 uLayerColTop[4];
uniform vec3 uFringe;

uniform vec3 uSkyZenith;
uniform vec3 uSkyHorizon;
uniform vec2 uStars;        // density, brightness
uniform float uAuroraGlow;
uniform vec4 uMoon;         // enabled, azimuthRad, elevationRad, brightness
uniform vec4 uLand;         // type, seed, height, roughness
uniform vec3 uLandColor;
uniform vec3 uWater;        // enabled, ripple, reflection
uniform vec4 uCam;          // pitchRad, yawRad, tanHalfX, tanHalfY

out vec4 outColor;

const int TIRAI = 0;
const int BUSUR = 1;
const int KORONA = 2;
const int PILAR = 3;
const int PUSARAN = 4;

float h21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p = p * 2.07 + vec2(17.1, 9.3); a *= 0.5; }
  return v / 0.875;
}

// ---- current layer (set by setLayer) ----
int Ltype;
float LS, Lt, Ldist, LfoldAmp, LfoldFreq, Lbase, LrayH, LrayD, Lcontrast, Lbright, Lhalf, Lfringe;
vec2 Lrot;
vec3 Lbottom, Lbody, Ltop;

void setLayer(int i) {
  Ltype = uLayerType[i];
  LS = uLayerSeed[i];
  Ldist = uLayerGeom[i].x;
  Lrot = vec2(cos(uLayerGeom[i].y), sin(uLayerGeom[i].y));
  LfoldAmp = uLayerGeom[i].z * 2.0;
  LfoldFreq = 0.5 + uLayerGeom[i].w;
  Lbase = uLayerRays[i].x;
  LrayH = uLayerRays[i].y * 2.0;
  LrayD = 0.4 + 1.2 * uLayerRays[i].z;
  Lcontrast = uLayerRays[i].w * 1.25;
  Lbright = uLayerMisc[i].x;
  float len = uLayerMisc[i].y;
  Lhalf = len >= 0.999 ? 1e4 : mix(0.8, 12.0, len * len);
  Lt = uTime * uLayerMisc[i].z;
  Lfringe = uLayerMisc[i].w;
  Lbottom = uLayerColBottom[i];
  Lbody = uLayerColBody[i];
  Ltop = uLayerColTop[i];
}

// Signed horizontal distance to curtain k of the current layer, and the coordinate along it.
vec2 curtain(vec2 q, float k) {
  vec2 p = vec2(q.x * Lrot.x - q.y * Lrot.y, q.x * Lrot.y + q.y * Lrot.x);
  float x = p.x;
  float fq = LfoldFreq;
  if (Ltype == BUSUR) {
    float g = Ldist - 0.6 + k * 1.3
      + LfoldAmp * (0.25 * sin(x * 0.12 * fq + LS * 6.28 + k) + 0.3 * (fbm3(vec2(x * 0.08 * fq + LS * 9.0, Lt * 0.01)) - 0.5));
    return vec2(p.y - g, x);
  }
  if (Ltype == KORONA) {
    float g = Ldist - 2.75 + k * 0.85
      + LfoldAmp * (0.45 * sin(x * 1.1 * fq + LS * 6.28 + Lt * 0.05 + k * 2.0) + 0.7 * (fbm3(vec2(x * 0.5 * fq + LS * 13.0 + k * 5.0, Lt * 0.03)) - 0.5));
    return vec2(p.y - g, x);
  }
  if (Ltype == PUSARAN) {
    vec2 c = vec2(-1.5 + 3.0 * LS, Ldist + 3.2);
    vec2 v = p - c;
    float r = length(v);
    float th = atan(v.y, v.x) + Lt * 0.03;
    float a = 0.4, b = 0.42 * (1.5 - (LfoldFreq - 0.5));
    float n = floor((r - a) / (b * 6.2832) - th / 6.2832 + 0.5);
    float tt = th + 6.2832 * n;
    float rs = a + b * tt;
    float turns = tt / 6.2832;
    float maxTurns = Lhalf > 1e3 ? 2.1 : mix(0.6, 2.1, clamp(Lhalf / 12.0, 0.0, 1.0));
    float on = step(-0.1, turns) * (1.0 - smoothstep(maxTurns - 0.6, maxTurns, turns));
    return vec2((r - rs) + (1.0 - on) * 50.0, 0.5 * b * tt * tt + a * tt + 7.0);
  }
  // tirai & pilar: folding curtain
  float g = Ldist + k * 1.9
    + LfoldAmp * (0.8 * sin(x * 0.5 * fq + LS * 6.28 + k * 2.1 + Lt * 0.04)
                + 1.9 * (fbm3(vec2(x * 0.28 * fq + LS * 13.0 + k * 7.0, Lt * 0.02 + k)) - 0.5));
  return vec2(p.y - g, x);
}

vec3 emission(float s, float alt, float k, bool fine) {
  float coarse = vnoise(vec2(s * 0.28 + LS * 20.0 + k * 3.0, Lt * 0.07));
  float r = pow(coarse, 2.2) * 2.3 + 0.06;
  float contrast = Lcontrast * (Ltype == BUSUR ? 0.2 : 1.0);
  if (fine) {
    float rayFreq = (Ltype == BUSUR ? 2.0 : 10.0) * LrayD;
    float f = fbm3(vec2(s * rayFreq + LS * 50.0 + k * 11.0, Lt * 0.22));
    r *= mix(1.0, pow(f, 2.0) * 2.5, contrast * 0.85);
  }
  float hn = vnoise(vec2(s * 1.6 + LS * 70.0 + k * 4.0, Lt * 0.1));
  if (Ltype == PILAR) r *= smoothstep(0.5, 0.78, vnoise(vec2(s * 0.9 + LS * 30.0, Lt * 0.12))) * 1.8;
  if (Ltype != PUSARAN) r *= 1.0 - smoothstep(Lhalf * 0.7, Lhalf, abs(s));
  float hMul = (Ltype == BUSUR ? 0.5 : (Ltype == PILAR ? 1.7 : (Ltype == KORONA ? 1.3 : 1.0))) * LrayH;
  float H0 = Lbase + 0.2 * vnoise(vec2(s * 0.15 + k * 5.0, Lt * 0.05));
  float a = alt - H0;
  float hgt = max(mix(0.1, 0.85, hn * hn) * mix(0.7, 1.2, clamp(r * 0.5, 0.0, 1.0)) * hMul, 0.02);
  float prof = smoothstep(-0.025, 0.012, a) * exp(-max(a, 0.0) / hgt);
  vec3 c = mix(Lbottom, mix(Lbody, Ltop, smoothstep(0.5, 1.7, a)), smoothstep(0.1, 0.75, a));
  c = mix(c, uFringe, (1.0 - smoothstep(-0.02, 0.04, a)) * 0.5 * Lfringe);
  return c * r * prof * Lbright;
}

// March along the ray's ground track through the aurora altitude band.
vec3 auroraLayer(vec3 rd, float jit) {
  float hl = max(length(rd.xz), 1e-4);
  float tanEl = rd.y / hl;
  vec2 dir = rd.xz / hl;
  vec3 acc = vec3(0.0);
  int nC = (Ltype == PUSARAN) ? 1 : 2;
  float glowAmt = (Ltype == BUSUR) ? 0.9 : 0.5;
  float maxJump = (Ltype == PUSARAN) ? 1.2 : 1e4;
  float t0 = (Lbase - 0.03) / tanEl;
  float t1 = min((Lbase + 3.0) / tanEl, 55.0);
  if (t0 > 55.0) return acc;
  float dt = (t1 - t0) / float(uSteps);
  for (int k = 0; k < 2; k++) {
    if (k >= nC) break;
    float fk = float(k);
    float wk = (k == 0 ? 1.0 : 0.65);
    float t = t0 + dt * jit;
    vec2 prev = curtain(dir * t, fk);
    float tprev = t;
    for (int i = 0; i < uSteps; i++) {
      t += dt;
      vec2 cur = curtain(dir * t, fk);
      float fade = exp(-t * 0.028);
      if (prev.x * cur.x <= 0.0 && abs(prev.x) + abs(cur.x) < maxJump) {
        float w = prev.x / (prev.x - cur.x + 1e-6);
        float tc = mix(tprev, t, w);
        float s = mix(prev.y, cur.y, w);
        vec2 qc = dir * tc;
        float e = 0.01;
        vec2 gr = vec2(curtain(qc + vec2(e, 0.0), fk).x - curtain(qc - vec2(e, 0.0), fk).x,
                       curtain(qc + vec2(0.0, e), fk).x - curtain(qc - vec2(0.0, e), fk).x);
        vec2 n = normalize(gr + 1e-6);
        float c = abs(dot(rd.xz, n));
        float edge = 1.0 / sqrt(c * c + 0.02);
        acc += emission(s, tc * tanEl, fk, true) * edge * fade * 0.22 * wk;
      }
      float gw = exp(-cur.x * cur.x / 0.25);
      if (gw > 0.02) acc += emission(cur.y, t * tanEl, fk, false) * gw * dt * fade * glowAmt * wk;
      prev = cur;
      tprev = t;
    }
  }
  return acc;
}

vec3 aurora(vec3 rd, float jit) {
  if (rd.y <= 0.002) return vec3(0.0);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= uLayerCount) break;
    setLayer(i);
    acc += auroraLayer(rd, jit);
  }
  return acc * smoothstep(0.0, 0.05, rd.y);
}

float stars(vec3 rd) {
  vec2 sp = rd.xz / (1.0 + max(rd.y, 0.0)) * 240.0;
  vec2 id = floor(sp), f = fract(sp);
  float h = h21(id);
  if (h < 1.0 - 0.08 * uStars.x) return 0.0;
  vec2 pos = vec2(h21(id + 1.7), h21(id + 9.2)) * 0.6 + 0.2;
  float d = length(f - pos);
  float br = pow(h21(id + 4.4), 5.0) * 1.4 + 0.12;
  float tw = 0.75 + 0.25 * sin(uTime * (1.0 + 3.0 * h21(id + 2.0)) + h * 40.0);
  return br * tw * smoothstep(0.14, 0.0, d) * (uStars.y / 0.6);
}

vec3 sky(vec3 rd, float jit) {
  float e = max(rd.y, 0.0);
  vec3 c = mix(uSkyHorizon, uSkyZenith, pow(e, 0.45));
  vec3 au = aurora(rd, jit);
  c += 0.06 * au.g * vec3(0.2, 0.6, 0.45) * (uAuroraGlow / 0.5);
  c += vec3(stars(rd)) * (1.0 - clamp(length(au) * 0.6, 0.0, 0.8));
  return c + au;
}

float ridge(float az) {
  float L = uLand.y;
  float m = fbm3(vec2(az * (2.2 + 2.5 * fract(L * 3.7)) + L * 97.0, 1.3 + L * 13.0));
  float base = (0.07 + 0.16 * fract(L * 7.13)) * m * m * m * (uLand.z * 2.0);
  return 0.006 + base + 0.012 * (uLand.w * 2.0) * vnoise(vec2(az * 26.0 + L * 41.0, 4.0));
}

void main() {
  vec2 fc = gl_FragCoord.xy + uTileOrigin;
  vec2 ndc = fc / uFullRes * 2.0 - 1.0;
  float pitch = uCam.x, yaw = uCam.y;
  vec3 fw = vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch));
  vec3 rt = normalize(vec3(cos(yaw), 0.0, -sin(yaw)));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw + ndc.x * uCam.z * rt + ndc.y * uCam.w * up);
  float jit = uJitter > 0.5 ? h21(fc + fract(uTime * 7.0) * vec2(91.0, 37.0)) : 0.5;

  float az = atan(rd.x, rd.z);
  float el = asin(clamp(rd.y, -1.0, 1.0));
  float rg = ridge(az);
  vec3 col;
  if (el >= 0.0) {
    if (el < rg) {
      col = uLandColor + 0.01 * vec3(0.1, 0.5, 0.35) * smoothstep(0.0, rg, el);
    } else {
      col = sky(rd, jit);
    }
  } else {
    vec2 g = rd.xz / max(-rd.y, 0.002);
    float rip = (vnoise(g * vec2(0.8, 5.0) + vec2(0.0, uTime * 0.25)) - 0.5) * 0.02 * uWater.y;
    vec3 rr = normalize(vec3(rd.x + rip * 0.3, -rd.y + rip, rd.z));
    float rel = asin(clamp(rr.y, -1.0, 1.0));
    vec3 rc = (rel < ridge(atan(rr.x, rr.z))) ? uLandColor * 0.7 : sky(rr, jit);
    float fres = mix(0.92, 0.5, smoothstep(0.0, 0.4, -rd.y)) * (uWater.z / 0.7);
    col = rc * fres + vec3(0.002, 0.004, 0.006);
  }
  outColor = vec4(col * uHdrOut, 1.0);
}
