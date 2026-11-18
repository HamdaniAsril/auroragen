#version 300 es
precision highp float;

// uMode 0: threshold + 2x downsample, 1: 2x downsample, 2: tent upsample added onto uBase.
uniform sampler2D uSrc;
uniform sampler2D uBase;
uniform vec2 uSrcTexel;
uniform vec2 uDstSize;
uniform int uMode;
uniform float uThreshold;

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uDstSize;
  vec2 t = uSrcTexel;
  if (uMode == 2) {
    vec3 c = texture(uSrc, uv).rgb * 4.0;
    c += (texture(uSrc, uv + vec2(t.x, 0.0)).rgb + texture(uSrc, uv - vec2(t.x, 0.0)).rgb
        + texture(uSrc, uv + vec2(0.0, t.y)).rgb + texture(uSrc, uv - vec2(0.0, t.y)).rgb) * 2.0;
    c += texture(uSrc, uv + t).rgb + texture(uSrc, uv - t).rgb
       + texture(uSrc, uv + vec2(t.x, -t.y)).rgb + texture(uSrc, uv + vec2(-t.x, t.y)).rgb;
    outColor = vec4(c / 16.0 + texture(uBase, uv).rgb, 1.0);
    return;
  }
  vec3 c = 0.25 * (texture(uSrc, uv + vec2(-t.x, -t.y)).rgb + texture(uSrc, uv + vec2(t.x, -t.y)).rgb
                 + texture(uSrc, uv + vec2(-t.x, t.y)).rgb + texture(uSrc, uv + vec2(t.x, t.y)).rgb);
  if (uMode == 0) {
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c *= max(l - uThreshold, 0.0) / max(l, 1e-4);
  }
  outColor = vec4(c, 1.0);
}
