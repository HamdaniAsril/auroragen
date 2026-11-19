#version 300 es
precision highp float;

uniform sampler2D uHdr;
uniform sampler2D uBloom; // covers the full image, low resolution
uniform vec2 uFullRes;
uniform vec2 uTileOrigin;
uniform float uTime;
uniform float uFx[5]; // exposureEV, bloom, saturation, grain, vignette
uniform float uHdrScale;
uniform float uAuroraOnly;

out vec4 outColor;

float h21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec3 col = texelFetch(uHdr, ivec2(gl_FragCoord.xy), 0).rgb * uHdrScale;
  vec2 fc = gl_FragCoord.xy + uTileOrigin;
  vec2 uv = (fc - 0.5 * uFullRes) / (0.5 * uFullRes.x);

  col += texture(uBloom, fc / uFullRes).rgb * uHdrScale * uFx[1] * 0.8;
  col = 1.0 - exp(-col * 1.9 * exp2(uFx[0]));
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uFx[2]);
  if (uAuroraOnly > 0.5) {
    // No vignette or grain on a cut-out. Brightness becomes alpha and the colour is kept at
    // full strength, so the file laid over black looks exactly like the preview.
    col = pow(max(col, 0.0), vec3(0.92));
    float a = max(max(col.r, col.g), col.b);
    outColor = a > 0.0 ? vec4(col / a, a) : vec4(0.0);
    return;
  }
  col *= 1.0 - 0.7 * uFx[4] * dot(uv, uv);
  col += (h21(fc * 1.7 + uTime) - 0.5) * 0.04 * uFx[3];
  col = pow(max(col, 0.0), vec3(0.92));
  outColor = vec4(col, 1.0);
}
