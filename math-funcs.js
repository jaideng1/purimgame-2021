
function createVector(x, y, z=0) {
  return {
    x,
    y,
    z,
  }
}

function dist(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

//Thank you math class :P
function getCircumcenter(a_, b_, c_) {
  let x1 = a_.x;
  let y1 = a_.y;
  let x2 = b_.x;
  let y2 = b_.y;
  let x3 = c_.x;
  let y3 = c_.y;

  // x1 + x2 / 2, y1 + y2 / 2
  let M_AB = createVector((x1 + x2) / 2, (y1 + y2) / 2);
  // console.log("M_AB: ", M_AB)
  //rise / run, (y2 - y1) / (x2 - x1)
  let m_AB = (y2 - y1) / (x2 - x1);
  let mp_AB = -(x2 - x1) / (y2 - y1);
  // console.log("slopes of AB: " + m_AB + ", prime: " + mp_AB)
  //y = mx + b - solve for b
  //y - mx = b
  let b_eq_AB = M_AB.y - (mp_AB * M_AB.x);
  // console.log("base of AB: " + b_eq_AB)

  // x1 + x2 / 2, y1 + y2 / 2
  let M_CB = createVector((x2 + x3) / 2, (y2 + y3) / 2);
  // console.log("M_CB: ", M_CB)
  //rise / run, (x2 - x1) / (y2 - y1)
  let m_CB = (y3 - y2) / (x3 - x2);
  let mp_CB = -(x3 - x2) / (y3 - y2);
  // console.log("slopes of CB: " + m_CB + ", prime: " + mp_CB)
  //y = mx + b - solve for b
  //y - mx = b
  let b_eq_CB = M_CB.y - (mp_CB * M_CB.x);
  // console.log("base of CB: " + b_eq_CB)

  //subsitution - solving for x
  //mx + b = mx + b
  //m1(x) + b1 = m2(x) + b2
  //(m1 - m2)(x) = (b2 - b1)
  //get reciprocal - x * 1/x
  //x = RCPCAL(b2 - b1)
  let base_eqs = b_eq_CB - b_eq_AB; //b2 - b1
  let x_rcpl = 1/(mp_AB - mp_CB);
  let x_answer = x_rcpl * base_eqs;

  //M_.y = mp_ * (x_answer) + b_eq
  let y_answer = mp_AB * x_answer + b_eq_AB;

  return createVector(x_answer, y_answer)
}

function getShorterLinePoints(x1, x2, y1, y2, lineLen=75) {
  //http://jsfiddle.net/3SY8v/
  let deltaX = x2 - x1;
  let deltaY = y2 - y1;
  let hlen = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
  let ratio = lineLen / hlen; //lineLen is how long the line would be
  let smallerXLen = deltaX * ratio;
  let smallerYLen = deltaY * ratio;
  let smallerX = x1 + smallerXLen;
  let smallerY = y1 + smallerYLen;
  return {
    x: smallerX,
    y: smallerY
  }
}

module.exports = { createVector, getShorterLinePoints, getCircumcenter, dist}
