import React from "react";
import { interpolate } from "remotion";
import { T } from "../theme";

interface Props { frame: number; duration: number; keyTerms?: string[] }

const W = 1080, H = 700;

function p(frame: number, duration: number, s: number, e: number) {
  const d = Math.max(1, duration - 60);
  return interpolate(frame, [d * s, d * e], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
}

const THOUGHT_X = 540, THOUGHT_Y = 88;
const ACTION_X  = 820, ACTION_Y  = 390;
const OBS_X     = 260, OBS_Y     = 390;
const BOX_W = 220, BOX_H = 100;

const ITERS = [
  { thought: "Search for Tokyo weather", action: `search("Tokyo weather")`,  observation: "Tokyo: 72°F, clear" },
  { thought: "Got it — now format it",   action: `format("72°F, clear")`,    observation: "Formatted: 72°F, clear" },
];

// Quadratic bezier point at t
function bpt(x1:number,y1:number,cx:number,cy:number,x2:number,y2:number,t:number){
  const m=1-t;
  return { x:m*m*x1+2*m*t*cx+t*t*x2, y:m*m*y1+2*m*t*cy+t*t*y2 };
}

// arcPath matches the control-point formula used for the arrow paths below
function arcCtrl(x1:number,y1:number,x2:number,y2:number,sweep:number){
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  return { cx:mx+(y2-y1)*0.2*sweep, cy:my-(x2-x1)*0.2*sweep };
}

// Arrow endpoints
const TA = { x1:THOUGHT_X+BOX_W/2, y1:THOUGHT_Y+BOX_H, x2:ACTION_X-BOX_W/2, y2:ACTION_Y, sweep:1 };
const AO = { x1:ACTION_X-BOX_W/2,  y1:ACTION_Y+BOX_H/2, x2:OBS_X+BOX_W/2,   y2:OBS_Y+BOX_H/2, sweep:-1 };
const OT = { x1:OBS_X,             y1:OBS_Y,             x2:THOUGHT_X-BOX_W/2, y2:THOUGHT_Y+BOX_H, sweep:1 };

function arrowPath(a:{x1:number,y1:number,x2:number,y2:number,sweep:number}){
  const {cx,cy}=arcCtrl(a.x1,a.y1,a.x2,a.y2,a.sweep);
  return `M ${a.x1} ${a.y1} Q ${cx} ${cy} ${a.x2} ${a.y2}`;
}

export const ReActDiagram: React.FC<Props> = ({ frame, duration, keyTerms = [] }) => {
  const hi = (t: string) => keyTerms.map(k => k.toUpperCase()).includes(t);

  // Each phase gets its own progress value — wider windows = slower animation
  const introIn = p(frame, duration, 0.00, 0.12);
  const t1In    = p(frame, duration, 0.12, 0.30); // THOUGHT 1  (~1.1s at 8s duration)
  const a1In    = p(frame, duration, 0.30, 0.47); // ACTION 1
  const o1In    = p(frame, duration, 0.47, 0.63); // OBSERVATION 1
  const t2In    = p(frame, duration, 0.63, 0.74); // THOUGHT 2
  const a2In    = p(frame, duration, 0.74, 0.83); // ACTION 2
  const o2In    = p(frame, duration, 0.83, 0.90); // OBSERVATION 2
  const finalIn = p(frame, duration, 0.90, 1.00);

  const hiThought = hi("THOUGHT");
  const hiAction  = hi("ACTION");
  const hiObs     = hi("OBSERVATION");

  // Derive current phase
  const phase =
    finalIn > 0.05 ? 'final' :
    o2In    > 0.05 ? 'obs2'  :
    a2In    > 0.05 ? 'act2'  :
    t2In    > 0.05 ? 'tht2'  :
    o1In    > 0.05 ? 'obs1'  :
    a1In    > 0.05 ? 'act1'  :
    t1In    > 0.05 ? 'tht1'  :
                     'intro';

  const isIter2  = ['tht2','act2','obs2','final'].includes(phase);
  const iter     = isIter2 ? ITERS[1] : ITERS[0];
  const loopNum  = isIter2 ? 'LOOP 2' : phase !== 'intro' ? 'LOOP 1' : '';

  const thtActive = phase === 'tht1' || phase === 'tht2';
  const actActive = phase === 'act1' || phase === 'act2';
  const obsActive = phase === 'obs1' || phase === 'obs2';

  const phaseP =
    phase === 'tht1' ? t1In : phase === 'act1' ? a1In : phase === 'obs1' ? o1In :
    phase === 'tht2' ? t2In : phase === 'act2' ? a2In : phase === 'obs2' ? o2In : finalIn;

  // Traveling dots: appear in first 40% of the *destination* phase
  const taDotP = (phase === 'act1' || phase === 'act2')
    ? Math.min(1, (phase === 'act1' ? a1In : a2In) * 2.5) : -1;
  const aoDotP = (phase === 'obs1' || phase === 'obs2')
    ? Math.min(1, (phase === 'obs1' ? o1In : o2In) * 2.5) : -1;
  const otDotP = phase === 'tht2'
    ? Math.min(1, t2In * 2.5) : -1;

  const boxOp = (isActive: boolean, isHi: boolean): number => {
    if (phase === 'intro') return introIn;
    if (isHi || isActive) return 1;
    return 0.35;
  };

  function dotCircle(a:{x1:number,y1:number,x2:number,y2:number,sweep:number}, t:number, color:string){
    if (t < 0 || t >= 1) return null;
    const {cx,cy} = arcCtrl(a.x1,a.y1,a.x2,a.y2,a.sweep);
    const pt = bpt(a.x1,a.y1,cx,cy,a.x2,a.y2,t);
    return <circle cx={pt.x} cy={pt.y} r={9} fill={color} opacity={0.9} filter="url(#react-glow-sm)" />;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      <defs>
        <filter id="react-glow">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="react-glow-sm">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <marker id="react-arr-v" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.violet} />
        </marker>
        <marker id="react-arr-a" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.amber} />
        </marker>
        <marker id="react-arr-m" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={T.mint} />
        </marker>
      </defs>

      {/* Title */}
      <text x={W/2} y={46} textAnchor="middle"
        fill={T.textDim} fontFamily={T.sans} fontSize="13" fontWeight="700" letterSpacing="3"
        opacity={introIn}>
        REASON + ACT · ITERATE UNTIL TASK COMPLETE
      </text>

      {/* Loop counter in center of triangle */}
      {loopNum && (
        <text x={W/2} y={312} textAnchor="middle"
          fill={T.textDim} fontFamily={T.sans} fontSize="12" fontWeight="700" letterSpacing="2"
          opacity={introIn}>
          {loopNum}
        </text>
      )}

      {/* Static dim arrows — always visible once boxes are in */}
      {introIn > 0.6 && (
        <g opacity={0.28}>
          <path d={arrowPath(TA)} fill="none" stroke={T.violet} strokeWidth="2" markerEnd="url(#react-arr-v)" />
          <path d={arrowPath(AO)} fill="none" stroke={T.amber}  strokeWidth="2" markerEnd="url(#react-arr-a)" />
          <path d={arrowPath(OT)} fill="none" stroke={T.mint}   strokeWidth="2" markerEnd="url(#react-arr-m)" />
        </g>
      )}

      {/* Traveling dots */}
      {dotCircle(TA, taDotP, T.violet)}
      {dotCircle(AO, aoDotP, T.amber)}
      {dotCircle(OT, otDotP, T.mint)}

      {/* THOUGHT box */}
      <g opacity={boxOp(thtActive, hiThought)}>
        <rect x={THOUGHT_X-BOX_W/2} y={THOUGHT_Y} width={BOX_W} height={BOX_H} rx="16"
          fill={T.violet} fillOpacity={thtActive ? 0.24 : 0.10}
          stroke={T.violet} strokeWidth={thtActive || hiThought ? 3 : 1.5}
          filter={(thtActive || hiThought) ? "url(#react-glow-sm)" : undefined}
        />
        <text x={THOUGHT_X} y={THOUGHT_Y+30} textAnchor="middle"
          fill={T.violet} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1.5">
          THOUGHT
        </text>
        {thtActive && phaseP > 0.35 && (
          <text x={THOUGHT_X} y={THOUGHT_Y+62} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
            opacity={Math.min(1, (phaseP - 0.35) * 5)}>
            {iter.thought}
          </text>
        )}
      </g>

      {/* ACTION box */}
      <g opacity={boxOp(actActive, hiAction)}>
        <rect x={ACTION_X-BOX_W/2} y={ACTION_Y} width={BOX_W} height={BOX_H} rx="16"
          fill={T.amber} fillOpacity={actActive ? 0.24 : 0.10}
          stroke={T.amber} strokeWidth={actActive || hiAction ? 3 : 1.5}
          filter={(actActive || hiAction) ? "url(#react-glow-sm)" : undefined}
        />
        <text x={ACTION_X} y={ACTION_Y+30} textAnchor="middle"
          fill={T.amber} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1.5">
          ACTION
        </text>
        {actActive && phaseP > 0.35 && (
          <text x={ACTION_X} y={ACTION_Y+62} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
            opacity={Math.min(1, (phaseP - 0.35) * 5)}>
            {iter.action}
          </text>
        )}
      </g>

      {/* OBSERVATION box */}
      <g opacity={boxOp(obsActive, hiObs)}>
        <rect x={OBS_X-BOX_W/2} y={OBS_Y} width={BOX_W} height={BOX_H} rx="16"
          fill={T.mint} fillOpacity={obsActive ? 0.24 : 0.10}
          stroke={T.mint} strokeWidth={obsActive || hiObs ? 3 : 1.5}
          filter={(obsActive || hiObs) ? "url(#react-glow-sm)" : undefined}
        />
        <text x={OBS_X} y={OBS_Y+30} textAnchor="middle"
          fill={T.mint} fontFamily={T.sans} fontSize="15" fontWeight="800" letterSpacing="1.5">
          OBSERVATION
        </text>
        {obsActive && phaseP > 0.35 && (
          <text x={OBS_X} y={OBS_Y+62} textAnchor="middle"
            fill={T.textSecondary} fontFamily={T.mono} fontSize="11"
            opacity={Math.min(1, (phaseP - 0.35) * 5)}>
            {iter.observation}
          </text>
        )}
      </g>

      {/* Final answer */}
      {finalIn > 0 && (
        <g opacity={finalIn}>
          <rect x={W/2-200} y={555} width={400} height={56} rx="28"
            fill={T.mint} fillOpacity={0.15}
            stroke={T.mint} strokeWidth="2"
            filter="url(#react-glow)"
          />
          <text x={W/2} y={580} textAnchor="middle"
            fill={T.mint} fontFamily={T.sans} fontSize="13" fontWeight="800" letterSpacing="1">
            ANSWER: Tokyo is 72°F
          </text>
          <text x={W/2} y={598} textAnchor="middle"
            fill={T.textDim} fontFamily={T.sans} fontSize="11" letterSpacing="2">
            TASK COMPLETE
          </text>
        </g>
      )}
    </svg>
  );
};
