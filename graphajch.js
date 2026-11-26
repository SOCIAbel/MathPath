'use strict';

const graphColors = ['#1467ac', '#ad4a32', '#715aa9'];
const graphExamples = {
  2: [['Parábola', ['x^2-4']], ['Seno y coseno', ['sin(x)', 'cos(x)']]],
  3: [['Silla de montar', ['x^2-y^2']], ['Superficie ondulada', ['sin(x)*cos(y)']]],
};
const clampGraph = (number, min, max) => Math.min(max, Math.max(min, number));
const graphNumber = value => {
  const absolute = Math.abs(value);
  if (absolute < 1e-12) return '0';
  if (absolute >= 10000 || absolute < .001) return value.toExponential(2);
  return Number(value.toPrecision(5)).toString();
};

function graphTicksAjch(min, max, count) {
  const raw = (max-min)/count;
  const power = 10**Math.floor(Math.log10(raw));
  const ratio = raw/power;
  const step = power*(ratio < 1.5 ? 1 : ratio < 3 ? 2 : ratio < 7 ? 5 : 10);
  const first = Math.ceil(min/step);
  const last = Math.floor(max/step);
  return Array.from({length: Math.max(0,last-first+1)}, (_, index) => step*(first+index));
}

function traceGraphLineAjch(ctx, from, to, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(from[0],from[1]);
  ctx.lineTo(to[0],to[1]);
  ctx.stroke();
}

function drawSurfacePlotAjch(ctx, width, height, view, trail = []) {
  const data = view.data;
  const plotStyle = getComputedStyle(document.documentElement);
  const palette = {
    grid: plotStyle.getPropertyValue('--plot-major-grid').trim() || '#c5d5e7',
    axis: plotStyle.getPropertyValue('--plot-axis').trim() || '#37619b',
    label: plotStyle.getPropertyValue('--plot-label').trim() || '#53667b',
  };
  ctx.font = '14px "Segoe UI", sans-serif';
  const line = (from,to,color) => traceGraphLineAjch(ctx,from,to,color);
  const [xmin,xmax,ymin,ymax] = view.bounds;
  const [zmin,zmax] = data?.zRange || [0,0];
  const halfXY = Math.max(xmax-xmin,ymax-ymin)/2;
  const halfZ = Math.max(halfXY,(zmax-zmin)/2);
  const xCenter = (xmax+xmin)/2, yCenter = (ymax+ymin)/2, zCenter = (zmax+zmin)/2;
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw);
  const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
  const rotate = (x,y,z) => {
    const dx = (x-xCenter)/halfXY, dy = (y-yCenter)/halfXY, dz = (z-zCenter)/halfZ;
    const depth = dx*sy+dy*cy;
    return [dx*cy-dy*sy,depth*sp-dz*cp,depth*cp+dz*sp];
  };
  const base = zmin-.12*halfZ;
  const axes = [[xmax+.14*halfXY,ymin,base,'x',palette.axis],[xmin,ymax+.14*halfXY,base,'y',palette.axis],
    [xmin,ymin,zmax+.22*halfZ,'z',palette.axis]];
  const corners = [xmin,xmax].flatMap(x=>[ymin,ymax].flatMap(y=>[base,zmax].map(z=>rotate(x,y,z))));
  const frame = corners.concat(axes.map(([x,y,z])=>rotate(x,y,z)));
  const horizontal = frame.map(point=>point[0]), vertical = frame.map(point=>point[1]);
  const left = Math.min(...horizontal), right = Math.max(...horizontal);
  const top = Math.min(...vertical), bottom = Math.max(...vertical);
  const scale = Math.min(Math.max(1,width-34)/(right-left),Math.max(1,height-34)/(bottom-top))*view.zoom;
  const project = (x,y,z) => {
    const [across,down,depth] = rotate(x,y,z);
    return [width/2+(across-(left+right)/2)*scale,height/2+(down-(top+bottom)/2)*scale,depth];
  };
  for (let index=0;view.showGrid!==false&&index<=8;index++) {
    const x = xmin+(xmax-xmin)*index/8;
    const y = ymin+(ymax-ymin)*index/8;
    line(project(x,ymin,base),project(x,ymax,base),palette.grid);
    line(project(xmin,y,base),project(xmax,y,base),palette.grid);
  }
  const origin = project(xmin,ymin,base);
  for (const [x,y,z,axis,color] of axes) {
    const point = project(x,y,z);
    if(view.showAxes!==false)line(origin,point,color);
  }
  const labelAxes = () => {
    if(view.showAxes===false)return;
    ctx.textAlign = 'center';
    for (const [x,y,z,axis,color] of axes) {
      const point = project(x,y,z);
      ctx.fillStyle = palette.label;
      ctx.fillText(axis,point[0],point[1]-5);
    }
  };
  if (!data?.hasValues) {labelAxes();return null;}

  const mesh = data.mesh;
  const steps = mesh.length-1;
  const points = mesh.map((row,j) => row.map((z,i) => z===null?null:
    project(xmin+(xmax-xmin)*i/steps,ymin+(ymax-ymin)*j/steps,z)));
  const faces = [];
  for (let row=0;row<steps;row++) {
    for (let col=0;col<steps;col++) {
      const corners = [points[row][col],points[row][col+1],points[row+1][col+1],points[row+1][col]];
      if (corners.some(point => !point)) continue;
      const depth = corners.reduce((total,point)=>total+point[2],0);
      const height = (mesh[row][col]+mesh[row][col+1]+mesh[row+1][col+1]+mesh[row+1][col])/4;
      faces.push({corners,depth,height});
    }
  }
  faces.sort((a,b) => a.depth-b.depth);
  ctx.lineWidth = .7;
  ctx.strokeStyle = '#23476665';
  for (const face of faces) {
    const color = zmax===zmin ? .5 : (face.height-zmin)/(zmax-zmin);
    ctx.fillStyle = 'hsl('+(226-61*color)+' 68% '+(39+23*color)+'%)';
    ctx.beginPath();
    ctx.moveTo(face.corners[0][0],face.corners[0][1]);
    for (const point of face.corners.slice(1)) ctx.lineTo(point[0],point[1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const path = trail.filter(([x,y]) => x>=xmin && x<=xmax && y>=ymin && y<=ymax)
    .map(point => project(...point));
  if (path.length) {
    ctx.beginPath();
    ctx.moveTo(path[0][0],path[0][1]);
    for (const [x,y] of path.slice(1)) ctx.lineTo(x,y);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#f7c960';
    ctx.stroke();
    for (const [index,[x,y]] of path.entries()) {
      ctx.beginPath();
      ctx.arc(x,y,index===path.length-1?5:2.6,0,Math.PI*2);
      ctx.fillStyle = '#ffdb76';
      ctx.fill();
      ctx.strokeStyle = '#604624';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  labelAxes();
  return [zmin,zmax];
}

class AbelGraphWorkspace {
  constructor(dialog, call) {
    this.dialog = dialog;
    this.call = call;
    this.form = dialog.querySelector('#plot-controls');
    this.canvas = dialog.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.inputs = [0,1,2].map(index => this.form.elements.namedItem('curve'+index));
    this.ranges = ['xmin','xmax','ymin','ymax'].map(name => this.form.elements.namedItem(name));
    this.status = dialog.querySelector('[data-plot-status]');
    this.readout = dialog.querySelector('[data-plot-readout]');
    this.resetWorkspace();
    this.frame = 0;

    this.form.addEventListener('submit', event => {event.preventDefault(); this.submit();});
    dialog.addEventListener('click', event => this.click(event));
    dialog.addEventListener('close', () => {
      this.drag = null;
      clearTimeout(this.sampleTimer);
    });
    const resize = new ResizeObserver(() => this.requestPaint());
    resize.observe(this.canvas);
    const theme = new MutationObserver(() => this.requestPaint());
    theme.observe(document.documentElement, {attributes:true, attributeFilter:['data-mode','data-accent']});
    this.canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.zoom(Math.exp(-clampGraph(event.deltaY,-160,160)*.0025),event.clientX-rect.left,event.clientY-rect.top);
    }, {passive:false});
    this.canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || this.drag) return;
      this.drag = {id:event.pointerId, x:event.clientX, y:event.clientY};
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => this.movePointer(event));
    for (const type of ['pointerup','pointercancel','lostpointercapture']) {
      this.canvas.addEventListener(type, event => {
        if (this.drag?.id !== event.pointerId) return;
        this.drag = null;
        if (this.mode === 2) this.requestSamples();
      });
    }
    this.canvas.addEventListener('keydown', event => this.keyControl(event));
  }

  newView(mode, expressions, spec = {}) {
    const bounds = spec.bounds || (mode===2 ? [-7,7,-5,5] : [-4,4,-4,4]);
    return {
      expressions, bounds:[...bounds], home:[...bounds], data:null, title:spec.title || '',
      interval:spec.interval, yaw:spec.camera?.[0]??-Math.PI/5, pitch:spec.camera?.[1]??.51,
      zoom:spec.camera?.[2]??1, version:0,
    };
  }

  get active() { return this.views[this.mode]; }

  resetWorkspace() {
    this.mode = 2;
    this.views = {2:this.newView(2,['sin(x)']),3:this.newView(3,['x^2-y^2'])};
  }

  open(spec) {
    if (spec) {
      this.mode = spec.mode;
      this.views[this.mode] = this.newView(this.mode,spec.expressions,spec);
    }
    if (!this.dialog.open) this.dialog.showModal();
    this.syncControls();
    this.requestPaint();
    this.requestSamples({fitY:spec?.fitY===true, home:Boolean(spec)});
  }

  capture() {
    const view = this.active;
    if (!view.data?.hasValues || !this.canvas.width) return null;
    this.paint();
    const thumbnail = document.createElement('canvas');
    const scale = Math.min(1,480/this.canvas.width,320/this.canvas.height);
    thumbnail.width = Math.max(1,Math.round(this.canvas.width*scale));
    thumbnail.height = Math.max(1,Math.round(this.canvas.height*scale));
    thumbnail.getContext('2d').drawImage(this.canvas,0,0,thumbnail.width,thumbnail.height);
    return {
      mode:this.mode, expressions:[...view.expressions], bounds:[...view.bounds], title:view.title,
      interval:view.interval, camera:[view.yaw,view.pitch,view.zoom],
      image:thumbnail.toDataURL('image/jpeg',.8),
    };
  }

  syncControls() {
    const surface = this.mode===3;
    const context = this.dialog.querySelector('[data-plot-context]');
    context.textContent = this.active.title;
    context.hidden = !this.active.title;
    for (const button of this.dialog.querySelectorAll('[data-plot-mode]')) {
      button.setAttribute('aria-pressed',String(Number(button.dataset.plotMode)===this.mode));
    }
    for (const element of this.form.querySelectorAll('[data-curve-only]')) element.hidden = surface;
    this.form.querySelector('[data-plot-first-label]').textContent = surface?'z = f(x, y)':'f(x)';
    this.inputs[0].placeholder = surface?'Ej. x^2-y^2':'Ej. sin(x)';
    for (const [index,input] of this.inputs.entries()) input.value = this.active.expressions[index] || '';
    for (const button of this.form.querySelectorAll('[data-plot-example]')) {
      button.textContent = graphExamples[this.mode][Number(button.dataset.plotExample)][0];
    }
    const instructions = surface?'Arrastra para girar. Usa la rueda o + y − para hacer zoom.':
      'Arrastra para mover el plano. Usa la rueda o + y − para hacer zoom.';
    this.dialog.querySelector('[data-plot-instructions]').textContent = instructions;
    this.canvas.setAttribute('aria-label',(surface?'Superficie 3D. ':'Plano 2D. ')+
      'Usa las flechas para mover la vista, + y − para el zoom e Inicio para restablecerla.');
    this.readout.textContent = '';
    this.syncRanges();
  }

  syncRanges() {
    for (const [index,input] of this.ranges.entries()) input.value = Number(this.active.bounds[index].toPrecision(9));
  }

  click(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.plotMode) {
      const mode = Number(button.dataset.plotMode);
      if (mode===this.mode) return;
      this.mode = mode;
      this.drag = null;
      this.syncControls();
      this.requestPaint();
      this.requestSamples();
    } else if (button.dataset.plotExample !== undefined) {
      const [,expressions] = graphExamples[this.mode][Number(button.dataset.plotExample)];
      this.views[this.mode] = this.newView(this.mode,expressions);
      this.syncControls();
      this.requestSamples();
    } else if (button.dataset.plotZoom) {
      this.zoom(button.dataset.plotZoom==='in'?1.25:.8);
    } else if (button.hasAttribute('data-plot-reset')) {
      this.reset();
    }
  }

  submit() {
    const view = this.active;
    const expressions = this.inputs.slice(0,this.mode===3?1:3).map(input => input.value.trim()).filter(Boolean);
    const bounds = this.ranges.map(input => input.valueAsNumber);
    if (!expressions.length) {
      this.setStatus('Escribe una expresión para graficar.',true);
      this.inputs[0].focus();
      return;
    }
    if (expressions.join('\n') !== view.expressions.join('\n')) {
      view.title = '';
      view.interval = null;
      this.dialog.querySelector('[data-plot-context]').hidden = true;
    }
    view.expressions = expressions;
    view.bounds = bounds;
    view.data = null;
    this.requestSamples({home:true});
  }

  setStatus(message, error = false) {
    this.status.textContent = message;
    this.status.classList.toggle('plot-error',error);
  }

  async requestSamples({fitY=false, home=false, quiet=false} = {}) {
    clearTimeout(this.sampleTimer);
    const mode = this.mode, view = this.active, version = ++view.version;
    if (!quiet) this.setStatus('Graficando…');
    this.requestPaint();
    try {
      const data = await this.call('graph',{mode,expressions:view.expressions,bounds:view.bounds,fitY});
      if (version!==view.version || this.views[mode]!==view) return;
      view.data = data;
      view.bounds = data.bounds;
      if (home) view.home = [...data.bounds];
      if (this.active===view && this.dialog.open) {
        this.setStatus(data.hasValues?'':'Sin valores reales en el rango indicado.');
        this.syncRanges();
        this.requestPaint();
      }
    } catch (error) {
      if (version!==view.version || this.active!==view || !this.dialog.open) return;
      view.data = null;
      if (!this.validBounds(view.bounds)) view.bounds = [...view.home];
      this.setStatus(String(error.message||error).replace(/^Error invoking remote method '[^']+': (Error: )?/,''),true);
      this.requestPaint();
    }
  }

  validBounds(bounds) {
    return bounds.every(value => Number.isFinite(value)&&Math.abs(value)<=1e6)&&
      bounds[1]-bounds[0]>=.0001&&bounds[3]-bounds[2]>=.0001;
  }

  setBounds(bounds) {
    if (!this.validBounds(bounds)) return;
    this.active.bounds = bounds;
    this.active.version++;
    this.syncRanges();
    this.requestPaint();
  }

  plotRect(width, height) {
    return {left:50, top:18, width:Math.max(1,width-68), height:Math.max(1,height-49)};
  }

  zoom(multiplier, mouseX, mouseY) {
    const view = this.active;
    if (this.mode===3) {
      view.zoom = clampGraph(view.zoom*multiplier,.45,3.5);
      this.requestPaint();
      return;
    }
    const rect = this.plotRect(this.canvas.clientWidth,this.canvas.clientHeight);
    const u = mouseX===undefined ? .5 : clampGraph((mouseX-rect.left)/rect.width,0,1);
    const v = mouseY===undefined ? .5 : clampGraph(1-(mouseY-rect.top)/rect.height,0,1);
    const [xmin,xmax,ymin,ymax] = view.bounds;
    const x = xmin+u*(xmax-xmin);
    const y = ymin+v*(ymax-ymin);
    this.setBounds([x+(xmin-x)/multiplier,x+(xmax-x)/multiplier,y+(ymin-y)/multiplier,y+(ymax-y)/multiplier]);
    this.scheduleSamples();
  }

  reset() {
    const view = this.active;
    view.bounds = [...view.home];
    view.zoom = 1;
    view.yaw = -Math.PI/5;
    view.pitch = .51;
    this.syncRanges();
    this.requestSamples();
  }

  scheduleSamples() {
    clearTimeout(this.sampleTimer);
    this.sampleTimer = setTimeout(() => this.requestSamples({quiet:true}),140);
  }

  moveView(dx, dy) {
    const view = this.active;
    if (this.mode===3) {
      view.yaw = (view.yaw+dx*.012)%(2*Math.PI);
      view.pitch = clampGraph(view.pitch+dy*.009,.11,1.47);
      this.requestPaint();
      return;
    }
    const rect = this.plotRect(this.canvas.clientWidth,this.canvas.clientHeight);
    const [xmin,xmax,ymin,ymax] = view.bounds;
    const x = dx*(xmax-xmin)/rect.width;
    const y = dy*(ymax-ymin)/rect.height;
    this.setBounds([xmin-x,xmax-x,ymin+y,ymax+y]);
  }

  movePointer(event) {
    if (this.drag?.id === event.pointerId) {
      this.moveView(event.clientX-this.drag.x,event.clientY-this.drag.y);
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
    }
    if (this.mode!==2) return;
    const box = this.canvas.getBoundingClientRect();
    const rect = this.plotRect(box.width,box.height);
    const u = clampGraph((event.clientX-box.left-rect.left)/rect.width,0,1);
    const v = clampGraph((event.clientY-box.top-rect.top)/rect.height,0,1);
    const [xmin,xmax,ymin,ymax] = this.active.bounds;
    this.readout.textContent = 'x = '+graphNumber(xmin+u*(xmax-xmin))+'   ·   y = '+graphNumber(ymax-v*(ymax-ymin));
  }

  keyControl(event) {
    const vectors = {ArrowLeft:[-36,0],ArrowRight:[36,0],ArrowUp:[0,-30],ArrowDown:[0,30]};
    if (Object.hasOwn(vectors,event.key)) {
      this.moveView(...vectors[event.key]);
      if (this.mode===2) this.scheduleSamples();
    } else if (event.key==='+' || event.key==='=') this.zoom(1.25);
    else if (event.key==='-' || event.key==='−') this.zoom(.8);
    else if (event.key==='Home') this.reset();
    else return;
    event.preventDefault();
  }

  requestPaint() {
    if (!this.dialog.open || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }

  paint() {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight;
    if (!this.dialog.open || !width || !height) return;
    const ratio = Math.min(2,window.devicePixelRatio||1);
    const pixelWidth = Math.round(width*ratio), pixelHeight = Math.round(height*ratio);
    if (this.canvas.width!==pixelWidth || this.canvas.height!==pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--plot-bg').trim() || '#f8fbfe';
    this.ctx.fillRect(0,0,width,height);
    this.ctx.font = '14px "Segoe UI", sans-serif';
    this.ctx.lineWidth = 1;
    if (!this.validBounds(this.active.bounds)) return;
    if (this.mode===2) this.drawCurves(width,height);
    else this.drawSurface(width,height);
  }

  segment(from, to, color) {
    traceGraphLineAjch(this.ctx,from,to,color);
  }

  drawCurves(width, height) {
    const ctx = this.ctx, view = this.active;
    const plotStyle = getComputedStyle(document.documentElement);
    const palette = {
      grid: plotStyle.getPropertyValue('--plot-major-grid').trim() || '#dce6ef',
      axis: plotStyle.getPropertyValue('--plot-axis').trim() || '#7793af',
      label: plotStyle.getPropertyValue('--plot-label').trim() || '#53667b',
    };
    const [xmin,xmax,ymin,ymax] = view.bounds;
    const plot = this.plotRect(width,height);
    const right = plot.left+plot.width, bottom = plot.top+plot.height;
    const x = value => plot.left+(value-xmin)/(xmax-xmin)*plot.width;
    const y = value => bottom-(value-ymin)/(ymax-ymin)*plot.height;
    ctx.fillStyle = palette.label;
    ctx.textAlign = 'center';
    for (const value of graphTicksAjch(xmin,xmax,Math.max(3,Math.floor(plot.width/84)))) {
      const px = x(value);
      this.segment([px,plot.top],[px,bottom],Math.abs(value)<1e-12?palette.axis:palette.grid);
      ctx.fillText(graphNumber(value),px,bottom+16);
    }
    ctx.textAlign = 'right';
    for (const value of graphTicksAjch(ymin,ymax,Math.max(3,Math.floor(plot.height/55)))) {
      const py = y(value);
      this.segment([plot.left,py],[right,py],Math.abs(value)<1e-12?palette.axis:palette.grid);
      ctx.fillText(graphNumber(value),plot.left-7,py+4);
    }
    ctx.fillStyle = palette.label;
    ctx.fillText('x',right+11,bottom+17);
    ctx.fillText('y',plot.left-7,plot.top-5);
    if (!view.data) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.left,plot.top,plot.width,plot.height);
    ctx.clip();
    if (view.interval) this.fillInterval(view.data.paths,view.interval,x,y);
    for (const [index,path] of view.data.paths.entries()) {
      ctx.beginPath();
      let started = false;
      for (const [px,py] of path) {
        if (py===null) {started=false;continue;}
        const yPixel = clampGraph(y(py),-height*25,height*25);
        if (started) ctx.lineTo(x(px),yPixel);
        else {ctx.moveTo(x(px),yPixel);started=true;}
      }
      ctx.strokeStyle = graphColors[index];
      ctx.lineWidth = 2.25;
      ctx.stroke();
    }
    ctx.restore();
  }

  fillInterval(paths, [start,end], x, y) {
    const ctx = this.ctx;
    const range = points => points.filter(([px,py]) => px>=start&&px<=end&&py!==null);
    const first = range(paths[0]);
    if (first.length<2) return;
    const second = paths[1]?range(paths[1]):first.map(([px])=>[px,0]);
    if (second.length<2) return;
    ctx.beginPath();
    ctx.moveTo(x(first[0][0]),y(first[0][1]));
    for (const [px,py] of first.slice(1)) ctx.lineTo(x(px),y(py));
    for (const [px,py] of second.reverse()) ctx.lineTo(x(px),y(py));
    ctx.closePath();
    ctx.fillStyle = '#438ac738';
    ctx.fill();
  }

  drawSurface(width, height) {
    const heights = drawSurfacePlotAjch(this.ctx,width,height,this.active);
    this.readout.textContent = heights ? 'Altura en la malla de '+heights.map(graphNumber).join(' a ') : '';
  }
}
