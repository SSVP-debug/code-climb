import { useMemo } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
 Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getTopicStats,
} from "../../utils/analyticsUtils";

function TopicMasteryChart() {

  const topicStats =
    useMemo(
      () => getTopicStats(),
      []
    );

  const data = useMemo(
    () =>
      Object.entries(topicStats)
        .map(
          ([topic, solved]) => ({
            topic,
            solved,
          })
        ),
    [topicStats]
  );

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <h2 className="text-2xl font-semibold mb-6">

        Topic Mastery

      </h2>

      {data.length === 0 ? (

        <p className="text-zinc-400">

          Solve problems to build mastery.

        </p>

      ) : (

        <div className="h-[350px]">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart data={data}>

              <XAxis dataKey="topic" />

              <YAxis />

              <Tooltip />

              <Bar dataKey="solved" />

            </BarChart>

          </ResponsiveContainer>

        </div>

      )}

    </div>

  );
}

export default TopicMasteryChart;