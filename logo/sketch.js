let showWhiteBackground = false;

function setup() {
  createCanvas(400, 400);
  noLoop();
}

function draw() {
  // Gray background when white circle is shown, otherwise transparent
  if (showWhiteBackground) {
    background(80);
  } else {
    clear();
  }

  let cx = width / 2;
  let cy = height / 2;

  // Lumio palette - 3 colors
  let amber = color(255, 167, 38);
  let coral = color(255, 112, 97);
  let violet = color(156, 104, 212);

  let colors = [amber, coral, violet];

  noStroke();

  // White circle background (toggle with 'b' key)
  if (showWhiteBackground) {
    fill(255);
    ellipse(cx, cy, 380, 380);
  }

  // === ROBOTIC HAND (scaled 120%) ===
  let scale = 1.2;

  // Palm - hexagonal shape
  let palmW = 90 * scale;
  let palmH = 100 * scale;

  // Outer palm - amber
  fill(amber);
  beginShape();
  vertex(cx - palmW/2 + 10*scale, cy - palmH/2 + 20*scale);
  vertex(cx + palmW/2 - 10*scale, cy - palmH/2 + 20*scale);
  vertex(cx + palmW/2, cy);
  vertex(cx + palmW/2 - 5*scale, cy + palmH/2);
  vertex(cx - palmW/2 + 5*scale, cy + palmH/2);
  vertex(cx - palmW/2, cy);
  endShape(CLOSE);

  // Inner palm detail - coral
  fill(coral);
  let innerScale = 0.6;
  beginShape();
  vertex(cx - palmW/2 * innerScale + 8*scale, cy - palmH/2 * innerScale + 15*scale);
  vertex(cx + palmW/2 * innerScale - 8*scale, cy - palmH/2 * innerScale + 15*scale);
  vertex(cx + palmW/2 * innerScale, cy);
  vertex(cx + palmW/2 * innerScale - 4*scale, cy + palmH/2 * innerScale);
  vertex(cx - palmW/2 * innerScale + 4*scale, cy + palmH/2 * innerScale);
  vertex(cx - palmW/2 * innerScale, cy);
  endShape(CLOSE);

  // Core - AI indicator
  fill(violet);
  rect(cx - 12*scale, cy - 5*scale, 24*scale, 18*scale, 4*scale);

  // 5 Fingers - with GAP from palm (like Lumio rays)
  let fingerGap = 15 * scale;

  let fingerConfigs = [
    { angle: -90, length: 80*scale, width: 20*scale, ox: 0, oy: -palmH/2 - fingerGap + 10*scale },
    { angle: -108, length: 70*scale, width: 18*scale, ox: -18*scale, oy: -palmH/2 - fingerGap + 18*scale },
    { angle: -72, length: 70*scale, width: 18*scale, ox: 18*scale, oy: -palmH/2 - fingerGap + 18*scale },
    { angle: -130, length: 55*scale, width: 16*scale, ox: -35*scale, oy: -palmH/2 - fingerGap + 30*scale },
    { angle: -20, length: 55*scale, width: 18*scale, ox: palmW/2 + fingerGap - 5*scale, oy: 5*scale },
  ];

  let jointRadius = 7 * scale;

  for (let i = 0; i < fingerConfigs.length; i++) {
    let f = fingerConfigs[i];
    let col = colors[i % 3];

    push();
    translate(cx + f.ox, cy + f.oy);
    rotate(radians(f.angle));

    // Finger segment 1
    fill(col);
    let seg1Length = f.length * 0.5;
    rect(0, -f.width/2, seg1Length, f.width, 4*scale);

    // Joint
    fill(255, 200);
    ellipse(seg1Length, 0, jointRadius * 2, jointRadius * 2);

    // Finger segment 2 (tip)
    fill(col);
    let seg2Start = seg1Length + jointRadius * 0.5;
    let seg2Length = f.length * 0.4;
    rect(seg2Start, -f.width/2 + 2*scale, seg2Length, f.width - 4*scale, 6*scale);

    // Fingertip glow
    fill(255, 100);
    ellipse(seg2Start + seg2Length - 4*scale, 0, 8*scale, 8*scale);

    pop();
  }

  // Wrist connector
  fill(violet);
  rect(cx - 28*scale, cy + palmH/2 + 8*scale, 56*scale, 22*scale, 6*scale);

  // Wrist detail lines
  stroke(255, 150);
  strokeWeight(2*scale);
  line(cx - 18*scale, cy + palmH/2 + 15*scale, cx + 18*scale, cy + palmH/2 + 15*scale);
  line(cx - 12*scale, cy + palmH/2 + 22*scale, cx + 12*scale, cy + palmH/2 + 22*scale);
  noStroke();

  // Signature line - inside white circle
  stroke(40);
  strokeWeight(6);
  strokeCap(ROUND);
  line(100, 330, 300, 330);
}

function keyPressed() {
  if (key === 'b' || key === 'B') {
    showWhiteBackground = !showWhiteBackground;
    redraw();
  }
}
