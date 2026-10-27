import{c as x,g as f}from"./shell-Cdyk8OT_.js";import{j as i}from"./preload-helper-CkyS6jwL.js";const c={name:"play",size:24,node:[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]};c.node;const S=x(c),d=["let","letrec","in","fn","if","then","else","true","false"],p=["dot","transpose","reshape","exp","log","sqrt","relu","step","grad"],u=["int","float","bool","string","tensor"],h=[["comment",/^\/\/[^\n]*/],["comment",/^\/\*[\s\S]*?(\*\/|$)/],["string",/^"(?:[^"\\\n]|\\.)*"?/],["number",/^\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/],["type",/^'[A-Za-z_]\w*/],["operator",/^(?:->|==|!=|<=|>=|&&|\|\||[-+*/<>=!:])/]],m=/^[A-Za-z_]\w*/;function g(t){for(const[e,o]of h){const r=o.exec(t);if(r)return{type:e,length:r[0].length}}const n=m.exec(t);if(n){const e=n[0];return{type:d.includes(e)?"keyword":p.includes(e)?"builtin":u.includes(e)?"type":"text",length:e.length}}return{type:"text",length:1}}function w(t){const n=[];let e=0;for(;e<t.length;){const{type:o,length:r}=g(t.slice(e)),a=t.slice(e,e+r),s=n[n.length-1];s&&s.type===o&&o==="text"?s.text+=a:n.push({type:o,text:a}),e+=r}return n}const l={keyword:"tok-keyword",builtin:"tok-macroName",type:"tok-typeName",number:"tok-number",string:"tok-string",comment:"tok-comment",operator:"tok-operator",text:""};function j({source:t,className:n}){return i.jsx("pre",{className:f("m-0 overflow-x-auto px-5 py-3.5 font-mono text-[max(16px,0.9375rem)] leading-[1.6]",n),children:i.jsx("code",{children:w(t).map((e,o)=>l[e.type]?i.jsx("span",{className:l[e.type],children:e.text},o):e.text)})})}const y={literals:{source:`/* a program is one expression */
42  // the answer`,expect:"= 42 : int"},bindings:{source:`let x = 5 in
let y = x * 2 in
x + y`,expect:"= 15 : int"},functions:{source:`let add = fn x -> fn y -> x + y in
let add3 = add 3 in   // partial application
add3 4`,expect:"= 7 : int"},recursion:{source:`letrec fact = fn n ->
  if n == 0 then 1
  else n * fact (n - 1)
in fact 10`,expect:"= 3628800 : int"},conditionals:{source:'if 3 > 2 && !(1 == 2) then "yes" else "no"',expect:'= "yes" : string'},inference:{source:`let id = fn x -> x in
if id true then id 1 else id 2   // one id, used at bool and int`,expect:"= 1 : int"},"occurs-check":{source:"fn x -> x x",expect:"error: Recursive type detected"},numerics:{source:`let f = fn x -> (x + x) + 1.0 in   // the later 1.0 wins; f is float -> float
f 2.0`,expect:"= 5. : float"},annotations:{source:`let m: tensor<float>['n,'n] = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
m   // 2x3 into a square annotation: rejected`,expect:"error: Dimension mismatch: 2 vs 3"},"tensor-literals":{source:"transpose([[1.0, 2.0, 3.0]])   // 1x3 matrix -> 3x1",expect:"= [[1], [2], [3]] : tensor<float>[3, 1]"},dot:{source:`let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in   // 2x3
let b = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]] in  // 3x2
dot(a, b)`,expect:"= [[22, 28], [49, 64]] : tensor<float>[2, 2]"},elementwise:{source:`let v = [1.0, 2.0, 3.0] in
2.0 * v + [10.0, 20.0, 30.0]`,expect:"= [12, 24, 36] : tensor<float>[3]"},shapes:{source:`let f = fn a -> dot(a, [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]) in
f [[1.0, 2.0]]   // 1x2 . 3x2: inner dimensions disagree`,expect:"error: Dimension mismatch: 3 vs 2"},math:{source:"relu([-1.5, 0.0, 2.5]) + exp([0.0, 0.0, 0.0])",expect:"= [1, 1, 3.5] : tensor<float>[3]"},"math-domain":{source:"log(0.0)",expect:"runtime error: log of a non-positive number: 0"},"grad-scalar":{source:`let d = grad (fn x -> exp(x * x)) in
d 1.0   // d/dx e^(x^2) = 2x e^(x^2) = 2e at x=1`,expect:"= 5.43656365692 : float"},newton:{source:`let f  = fn x -> x * x - 2.0 in
let df = grad (fn x -> x * x - 2.0) in
letrec newton = fn n ->
  if n < 0.5 then 1.0 else
  let x = newton (n - 1.0) in
  x - f x / df x
in newton 6.0`,expect:"= 1.41421356237 : float"},"grad-tensor":{source:`let x = [[1.0, 2.0], [3.0, 4.0]] in
let y = [1.0, 2.0] in
grad (fn w: tensor<float>[2] ->
  let e = dot(x, w) - y in dot(e, e)) [0.0, 0.0]   // 2 X^T (Xw - y)`,expect:"= [-14, -20] : tensor<float>[2]"},"train-xor":{source:`let x = [[0.0, 0.0, 0.0],
         [0.0, 1.0, 0.0],
         [1.0, 0.0, 0.0],
         [1.0, 1.0, 1.0]] in
let y = [0.0, 1.0, 1.0, 0.0] in
let dloss = grad (fn w: tensor<float>[3] ->
  let e = dot(x, w) - y in
  dot(e, e)) in
letrec train = fn n ->
  if n < 0.5 then [0.0, 0.0, 0.0] else
  let w = train (n - 1.0) in
  w - 0.1 * dloss w
in train 200.0`,expect:"= [0.999987, 0.999987, -1.99996] : tensor<float>[3]"},pathwise:{source:`let g = [0.8, 1.0, 1.2, 1.4] in
let ones = [1.0, 1.0, 1.0, 1.0] in
grad (fn s: float -> dot(relu(s * g - 1.0), ones) / 4.0) 1.0`,expect:"= 0.65 : float"},"grad-rejected":{source:"grad (fn w -> dot(w, w)) [1.0, 2.0]",expect:"error: grad over tensors requires an annotated parameter: tensor<float>[...] for a tensor, float for a scalar differentiated through tensor code"}},b={hello:{label:"Hello",source:`// A function, a recursive function and a call.
// The result is the sum of the squares from 1 to 10.
let square = fn x -> x * x in
letrec sum = fn n -> if n == 0 then 0 else square n + sum (n - 1)
in sum 10`,expect:"= 385 : int"},shapes:{label:"Shapes",source:`// A tensor's shape is part of its type.
// A 2x3 matrix times a 3x2 matrix is a 2x2 matrix.
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b = [[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]] in
dot(a, b)`,expect:"= [[22, 28], [49, 64]] : tensor<float>[2, 2]"},"shape-error":{label:"Shape error",source:`// This example fails on purpose. The inner
// dimensions disagree (3 vs 2), so the compiler
// rejects it before anything runs.
let a = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]] in
let b = [[1.0, 2.0], [3.0, 4.0]] in
dot(a, b)`,expect:"error: Dimension mismatch: 3 vs 2"},grad:{label:"grad",source:`// grad turns a function into its derivative.
// The derivative of x^3 is 3x^2, so at x = 2 the result is 12.
grad (fn x -> x * x * x) 2.0`,expect:"= 12. : float"},newton:{label:"Newton's method",source:`// Newton's method for the square root of 2.
// grad writes the derivative of f at compile time.
let f  = fn x -> x * x - 2.0 in
let df = grad (fn x -> x * x - 2.0) in
letrec newton = fn n ->
  if n < 0.5 then 1.0 else
  let x = newton (n - 1.0) in
  x - f x / df x
in newton 6.0`,expect:"= 1.41421356237 : float"},"train-xor":{label:"Train XOR",source:`// Gradient descent on XOR, in your browser.
// The compiler writes the gradient of the loss,
// and it checks the shape of every step.
// The exact solution is [1, 1, -2].
let x = [[0.0, 0.0, 0.0],
         [0.0, 1.0, 0.0],
         [1.0, 0.0, 0.0],
         [1.0, 1.0, 1.0]] in
let y = [0.0, 1.0, 1.0, 0.0] in
let dloss = grad (fn w: tensor<float>[3] ->
  let e = dot(x, w) - y in
  dot(e, e)) in
letrec train = fn n ->
  if n < 0.5 then [0.0, 0.0, 0.0] else
  let w = train (n - 1.0) in
  w - 0.1 * dloss w
in train 200.0`,expect:"= [0.999987, 0.999987, -1.99996] : tensor<float>[3]"},markov:{label:"Markov chain",source:`// The steady state of a Markov chain, by power iteration.
// The compiler checks the shape of every dot() in the loop.
let p = [[0.9, 0.1], [0.5, 0.5]] in
letrec iter = fn n ->
  if n < 0.5 then [[1.0, 0.0], [0.0, 1.0]]
  else dot(p, iter (n - 1.0))
in dot([0.5, 0.5], iter 20.0)`,expect:"= [0.833333, 0.166667] : tensor<float>[2]"}},v={shapes:{source:`let a = [[1.0, 2.0, 3.0],
         [4.0, 5.0, 6.0]] in
let b = [[1.0, 2.0],
         [3.0, 4.0]] in
dot(a, b)`,expect:"error: Dimension mismatch: 3 vs 2"},grad:{source:`let x = [[1.0, 2.0], [3.0, 4.0]] in
let y = [1.0, 2.0] in
grad (fn w: tensor<float>[2] ->
  let e = dot(x, w) - y in
  dot(e, e)) [0.0, 0.0]`,expect:"= [-14, -20] : tensor<float>[2]"},inference:{source:`let id = fn x -> x in
if id true then id 1 else id 2`,expect:"= 1 : int"}},q={reference:y,playground:b,home:v};export{S as P,j as S,q as e,g as n};
