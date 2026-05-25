import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import {
    getLanguageStats,
} from "../../utils/analyticsUtils";

import { useMemo } from "react";

function LanguageChart() {

    const languageStats =
        getLanguageStats();

    const data = useMemo(
        () =>
            Object.entries(languageStats)
                .map(
                    ([language, count]) => ({
                        name: language,
                        value: count,
                    })
                ),
        [languageStats]
    );

    const COLORS = [
        "#22c55e",
        "#3b82f6",
        "#eab308",
        "#ef4444",
        "#a855f7",
    ];

    return (

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-2xl font-semibold mb-6">

                Language Usage

            </h2>

            {data.length === 0 ? (

                <p className="text-zinc-400">
                    No submissions yet.
                </p>

            ) : (

                <div className="h-[300px]">

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <PieChart>

                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={100}
                                label
                            >

                                {data.map(
                                    (entry, index) => (

                                        <Cell
                                            key={index}
                                            fill={
                                                COLORS[
                                                index %
                                                COLORS.length
                                                ]
                                            }
                                        />

                                    )
                                )}

                            </Pie>

                            <Tooltip />

                        </PieChart>

                    </ResponsiveContainer>

                </div>

            )}

        </div>

    );
}

export default LanguageChart;