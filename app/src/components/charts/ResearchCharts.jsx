import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ErrorBar,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from "recharts";
import {
  evalModes,
  mnistBackgrounds,
  models,
  modelOrder,
  noiseSweep,
  rankSweep,
  rankSweepMeta,
  stability
} from "../../data/results.js";
import { ChartTooltip } from "../ui/ChartFrame.jsx";
import { fmtMSE, logTick } from "../../lib/format.js";

export { fmtMSE } from "../../lib/format.js";

const axis = { stroke: "rgba(255,255,255,0.16)", tickLine: false };

/* Bottom of the log axis in the noise-sweep chart. Several points have a
   standard deviation larger than the mean (e.g. 0.0021 ± 0.0026), and a
   symmetric whisker would reach a negative value — undefined on a log scale.
   The lower whisker is clipped at the axis floor instead; the upper one is
   always the true ±1 std. */
const MSE_FLOOR = 0.001;
const clipErr = (value, std) =>
  typeof std === "number" ? [Math.max(0, Math.min(std, value - MSE_FLOOR)), std] : null;

/* ---------------------------------------------------------------- noise sweep */
export function NoiseSweepChart({ visible = modelOrder, metric = "mse" }) {
  const isGap = metric === "gap";
  const data = noiseSweep.map((row) => {
    const point = { ntr: row.ntr };
    modelOrder.forEach((key) => {
      point[key] = isGap ? row[`${key}_gap`] : row[key];
      point[`${key}_std`] = row[`${key}_std`];
      point[`${key}_err`] = clipErr(row[key], row[`${key}_std`]);
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ntr"
          type="number"
          scale="log"
          domain={["dataMin", "dataMax"]}
          ticks={[25, 50, 100, 200, 400]}
          {...axis}
        />
        <YAxis
          scale={isGap ? "linear" : "log"}
          domain={isGap ? [0, "auto"] : [0.001, 0.1]}
          ticks={isGap ? undefined : [0.001, 0.01, 0.1]}
          tickFormatter={isGap ? (v) => v.toFixed(3) : logTick}
          width={52}
          {...axis}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          content={<ChartTooltip labelPrefix="Ntr = " format={fmtMSE} />}
        />
        {modelOrder
          .filter((key) => visible.includes(key))
          .map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={models[key].label}
              stroke={models[key].color}
              strokeWidth={2.2}
              dot={{ r: 3.2, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive
              animationDuration={700}
            >
              {isGap ? null : (
                <ErrorBar
                  dataKey={`${key}_err`}
                  width={4}
                  strokeWidth={1.1}
                  stroke={models[key].color}
                  opacity={0.55}
                />
              )}
            </Line>
          ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------------- rank sweep */
export function RankSweepChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rankSweep} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="k"
          type="number"
          scale="log"
          domain={["dataMin", "dataMax"]}
          ticks={[2, 4, 8, 16, 32]}
          {...axis}
        />
        <YAxis
          scale="log"
          domain={[0.0001, 0.1]}
          ticks={[0.0001, 0.001, 0.01, 0.1]}
          tickFormatter={logTick}
          width={52}
          {...axis}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.2)" }}
          content={<ChartTooltip labelPrefix="rank k = " format={fmtMSE} />}
        />
        <ReferenceLine
          y={rankSweepMeta.bnReference}
          stroke={models.OA_BN.color}
          strokeDasharray="5 5"
          strokeWidth={1.4}
          label={{
            value: `BatchNorm ${rankSweepMeta.bnReference}`,
            position: "insideTopRight",
            fill: models.OA_BN.color,
            fontSize: 11
          }}
        />
        <ReferenceLine
          x={rankSweepMeta.chosenRank}
          stroke="rgba(255,255,255,0.35)"
          strokeDasharray="3 4"
          label={{ value: "chosen", position: "top", fill: "#9aa6bf", fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="mse"
          name="SVD layer"
          stroke={models.OA_RR.color}
          strokeWidth={2.4}
          dot={{ r: 3.6, strokeWidth: 0 }}
          activeDot={{ r: 5.4 }}
          animationDuration={700}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ---------------------------------------------------------------- bar charts */
function ModelBarChart({ data, domain, ticks, showError = true }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 4, left: -8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axis} interval={0} />
        <YAxis
          scale="log"
          domain={domain}
          ticks={ticks}
          tickFormatter={logTick}
          width={52}
          {...axis}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={<ChartTooltip format={fmtMSE} />}
        />
        <Bar dataKey="mse" name="test MSE" radius={[6, 6, 0, 0]} animationDuration={700}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.color} />
          ))}
          {showError ? (
            <ErrorBar dataKey="std" width={5} strokeWidth={1.2} stroke="rgba(255,255,255,0.55)" />
          ) : null}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MnistChart() {
  const data = mnistBackgrounds.map((row) => ({
    label: models[row.model].label,
    mse: row.mse,
    std: row.std,
    color: models[row.model].color
  }));
  return <ModelBarChart data={data} domain={[0.001, 0.1]} ticks={[0.001, 0.01, 0.1]} />;
}

export function StabilityChart() {
  // The plain network's 0.0000 cannot be drawn on a log axis; it is called out in text.
  const data = stability.nativeBackend
    .filter((row) => row.mse > 0)
    .map((row) => ({
      label: models[row.model].label,
      mse: row.mse,
      std: row.std ?? 0,
      color: models[row.model].color
    }));
  return <ModelBarChart data={data} domain={[0.0001, 0.01]} ticks={[0.0001, 0.001, 0.01]} />;
}

export function EvalModesChart() {
  const data = evalModes.map((row) => ({
    label: row.short,
    mse: row.mse,
    color: models.OA_RR.color
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 4, left: -6 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...axis} interval={0} />
        <YAxis
          domain={[0, 0.001]}
          ticks={[0, 0.00025, 0.0005, 0.00075, 0.001]}
          tickFormatter={(v) => v.toFixed(4)}
          width={58}
          {...axis}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={<ChartTooltip format={fmtMSE} />}
        />
        <Bar dataKey="mse" name="test MSE" radius={[6, 6, 0, 0]} animationDuration={700}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------- train vs test (the gap) */
/* Each point is one training-set size. Distance above the dashed y = x line is
   the generalization gap; a point sitting on the left edge trained to zero
   error and learned the noise. All values from Table 1. */
export function TrainTestScatter({ visible = modelOrder }) {
  const series = modelOrder
    .filter((key) => visible.includes(key))
    .map((key) => ({
      key,
      points: noiseSweep.map((row) => ({
        train: row[`${key}_train`],
        test: row[key],
        ntr: row.ntr,
        model: models[key].label
      }))
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 10, right: 14, bottom: 6, left: -6 }}>
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="train"
          name="train MSE"
          domain={[0, 0.06]}
          ticks={[0, 0.02, 0.04, 0.06]}
          tickFormatter={(v) => v.toFixed(2)}
          {...axis}
        />
        <YAxis
          type="number"
          dataKey="test"
          name="test MSE"
          domain={[0, 0.08]}
          ticks={[0, 0.02, 0.04, 0.06, 0.08]}
          tickFormatter={(v) => v.toFixed(2)}
          width={46}
          {...axis}
        />
        <ZAxis type="number" dataKey="ntr" range={[45, 190]} name="Ntr" />
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: 0.06, y: 0.06 }
          ]}
          stroke="rgba(255,255,255,0.28)"
          strokeDasharray="4 5"
          ifOverflow="hidden"
        />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
          content={<ChartTooltip format={fmtMSE} />}
        />
        {series.map(({ key, points }) => (
          <Scatter
            key={key}
            data={points}
            name={models[key].label}
            fill={models[key].color}
            fillOpacity={0.72}
            stroke={models[key].color}
            animationDuration={600}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------ head-to-head */
/* Ratio between two selected models at each training-set size, computed live
   from the same Table 1 numbers. */
export function HeadToHeadChart({ a, b }) {
  const data = noiseSweep.map((row) => ({
    ntr: `Ntr ${row.ntr}`,
    ratio: Number((row[b] / row[a]).toFixed(2)),
    a: row[a],
    b: row[b]
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 10, bottom: 4, left: -14 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="ntr" interval={0} {...axis} />
        <YAxis
          domain={[0, "dataMax"]}
          tickFormatter={(v) => `${v}×`}
          width={48}
          {...axis}
        />
        <ReferenceLine y={1} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 5" />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={
            <ChartTooltip
              format={(v, row) =>
                `${v}×  (${fmtMSE(row.a)} vs ${fmtMSE(row.b)})`
              }
            />
          }
        />
        <Bar
          dataKey="ratio"
          name={`${models[b].label} ÷ ${models[a].label}`}
          radius={[6, 6, 0, 0]}
          animationDuration={650}
        >
          {data.map((row) => (
            <Cell
              key={row.ntr}
              fill={row.ratio >= 1 ? models[a].color : models[b].color}
              fillOpacity={0.85}
            />
          ))}
          <LabelList
            dataKey="ratio"
            position="top"
            formatter={(v) => `${v}×`}
            style={{ fill: "#9aa6bf", fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export const chartRegistry = {
  noiseSweep: NoiseSweepChart,
  rankSweep: RankSweepChart,
  mnist: MnistChart,
  evalModes: EvalModesChart,
  stability: StabilityChart
};
