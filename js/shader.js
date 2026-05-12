function initShader(canvas, isDark) {
  if (!canvas || !window.THREE) return null;
  var scene = new THREE.Scene();
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1);
  var uniforms = {
    resolution: { value: [window.innerWidth, window.innerHeight] },
    time: { value: 0.0 }, xScale: { value: 1.0 }, yScale: { value: 0.35 },
    distortion: { value: 0.06 }, isDark: { value: isDark ? 1.0 : 0.0 }
  };
  var vs = 'attribute vec3 position;\nvoid main(){gl_Position=vec4(position,1.0);}';
  var fs = [
    'precision highp float;',
    'uniform vec2 resolution;uniform float time;uniform float xScale;uniform float yScale;uniform float distortion;uniform float isDark;',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/resolution;vec2 p=(gl_FragCoord.xy*2.0-resolution)/min(resolution.x,resolution.y);',
    '  vec3 bgT=mix(vec3(0.82,0.92,0.96),vec3(0.06,0.12,0.22),isDark);',
    '  vec3 bgB=mix(vec3(0.76,0.88,0.93),vec3(0.03,0.08,0.16),isDark);',
    '  vec3 bg=mix(bgB,bgT,uv.y);',
    '  float d=length(p)*distortion;float rx=p.x*(1.0+d);float gx=p.x;float bx=p.x*(1.0-d);',
    '  float w1r=0.04/abs(p.y+sin((rx+time)*xScale)*yScale);',
    '  float w1g=0.04/abs(p.y+sin((gx+time)*xScale)*yScale);',
    '  float w1b=0.04/abs(p.y+sin((bx+time)*xScale)*yScale);',
    '  float w2r=0.025/abs(p.y+0.15+sin((rx+time*0.7+1.5)*xScale*0.8)*yScale*0.6);',
    '  float w2g=0.025/abs(p.y+0.15+sin((gx+time*0.7+1.5)*xScale*0.8)*yScale*0.6);',
    '  float w2b=0.025/abs(p.y+0.15+sin((bx+time*0.7+1.5)*xScale*0.8)*yScale*0.6);',
    '  float w3=0.015/abs(p.y-0.2+sin((p.x+time*0.5+3.0)*xScale*1.2)*yScale*0.4);',
    '  vec3 c1=mix(vec3(0.18,0.58,0.78),vec3(0.35,0.69,0.84),isDark);',
    '  vec3 c2=mix(vec3(0.12,0.45,0.65),vec3(0.25,0.55,0.75),isDark);',
    '  vec3 c3=mix(vec3(0.15,0.50,0.60),vec3(0.30,0.65,0.72),isDark);',
    '  vec3 waves=(vec3(w1r,w1g,w1b)*c1+vec3(w2r,w2g,w2b)*c2+vec3(w3)*c3)*mix(0.7,1.0,isDark);',
    '  float vig=1.0-smoothstep(0.4,1.5,length(p));',
    '  gl_FragColor=vec4(clamp(bg+waves*vig,0.0,1.0),1.0);',
    '}'
  ].join('\n');
  var positions = new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,-1,0,-1,1,0,1,1,0]);
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var mat = new THREE.RawShaderMaterial({ vertexShader:vs, fragmentShader:fs, uniforms:uniforms, side:THREE.DoubleSide });
  var mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
  var animId = null;
  function resize(){var w=window.innerWidth,h=window.innerHeight;renderer.setSize(w,h,false);uniforms.resolution.value=[w,h]}
  function animate(){uniforms.time.value+=0.008;renderer.render(scene,camera);animId=requestAnimationFrame(animate)}
  resize();animate();window.addEventListener('resize',resize);
  return {
    setDark:function(d){uniforms.isDark.value=d?1.0:0.0},
    destroy:function(){if(animId)cancelAnimationFrame(animId);window.removeEventListener('resize',resize);scene.remove(mesh);geo.dispose();mat.dispose();renderer.dispose()}
  };
}
window._initShader = initShader;
