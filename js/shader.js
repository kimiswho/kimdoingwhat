/* ═══════════════════════════════════════
   kim.dev — WebGL Shader Background
   Blue-themed chromatic wave
═══════════════════════════════════════ */

function initShader(canvas, isDark) {
  if (!canvas || !window.THREE) return null;

  var scene = new THREE.Scene();
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);

  var uniforms = {
    resolution: { value: [window.innerWidth, window.innerHeight] },
    time:       { value: 0.0 },
    xScale:     { value: 1.0 },
    yScale:     { value: 0.35 },
    distortion: { value: 0.06 },
    isDark:     { value: isDark ? 1.0 : 0.0 }
  };

  var vertexShader =
    'attribute vec3 position;\n' +
    'void main() { gl_Position = vec4(position, 1.0); }';

  var fragmentShader = [
    'precision highp float;',
    'uniform vec2 resolution;',
    'uniform float time;',
    'uniform float xScale;',
    'uniform float yScale;',
    'uniform float distortion;',
    'uniform float isDark;',
    '',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / resolution;',
    '  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);',
    '',
    '  vec3 bgTop    = mix(vec3(0.82, 0.92, 0.96), vec3(0.06, 0.12, 0.22), isDark);',
    '  vec3 bgBottom = mix(vec3(0.76, 0.88, 0.93), vec3(0.03, 0.08, 0.16), isDark);',
    '  vec3 bg = mix(bgBottom, bgTop, uv.y);',
    '',
    '  float d = length(p) * distortion;',
    '  float rx = p.x * (1.0 + d);',
    '  float gx = p.x;',
    '  float bx = p.x * (1.0 - d);',
    '',
    '  float wave1r = 0.04 / abs(p.y + sin((rx + time) * xScale) * yScale);',
    '  float wave1g = 0.04 / abs(p.y + sin((gx + time) * xScale) * yScale);',
    '  float wave1b = 0.04 / abs(p.y + sin((bx + time) * xScale) * yScale);',
    '',
    '  float wave2r = 0.025 / abs(p.y + 0.15 + sin((rx + time * 0.7 + 1.5) * xScale * 0.8) * yScale * 0.6);',
    '  float wave2g = 0.025 / abs(p.y + 0.15 + sin((gx + time * 0.7 + 1.5) * xScale * 0.8) * yScale * 0.6);',
    '  float wave2b = 0.025 / abs(p.y + 0.15 + sin((bx + time * 0.7 + 1.5) * xScale * 0.8) * yScale * 0.6);',
    '',
    '  float wave3 = 0.015 / abs(p.y - 0.2 + sin((p.x + time * 0.5 + 3.0) * xScale * 1.2) * yScale * 0.4);',
    '',
    '  vec3 color1 = mix(vec3(0.18, 0.58, 0.78), vec3(0.35, 0.69, 0.84), isDark);',
    '  vec3 color2 = mix(vec3(0.12, 0.45, 0.65), vec3(0.25, 0.55, 0.75), isDark);',
    '  vec3 color3 = mix(vec3(0.15, 0.50, 0.60), vec3(0.30, 0.65, 0.72), isDark);',
    '',
    '  vec3 w1 = vec3(wave1r, wave1g, wave1b) * color1;',
    '  vec3 w2 = vec3(wave2r, wave2g, wave2b) * color2;',
    '  vec3 w3 = vec3(wave3) * color3;',
    '',
    '  float intensity = mix(0.7, 1.0, isDark);',
    '  vec3 waves = (w1 + w2 + w3) * intensity;',
    '',
    '  float vig = 1.0 - smoothstep(0.4, 1.5, length(p));',
    '',
    '  vec3 final = bg + waves * vig;',
    '  final = clamp(final, 0.0, 1.0);',
    '',
    '  gl_FragColor = vec4(final, 1.0);',
    '}'
  ].join('\n');

  var positions = new Float32Array([
    -1, -1, 0,  1, -1, 0,  -1, 1, 0,
     1, -1, 0, -1,  1, 0,   1, 1, 0
  ]);
  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  var material = new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: uniforms,
    side: THREE.DoubleSide
  });

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  var animId = null;

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    uniforms.resolution.value = [w, h];
  }
  function animate() {
    uniforms.time.value += 0.008;
    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  resize(); animate();
  window.addEventListener('resize', resize);

  return {
    setDark: function(dark) { uniforms.isDark.value = dark ? 1.0 : 0.0; },
    destroy: function() {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      scene.remove(mesh); geometry.dispose(); material.dispose(); renderer.dispose();
    }
  };
}
window._initShader = initShader;
