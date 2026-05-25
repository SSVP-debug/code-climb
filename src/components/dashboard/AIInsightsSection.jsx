import {
    getWeakestTopic,
    getStrongestTopic,
    getAcceptanceRate,
} from "../../utils/analyticsUtils";

function AIInsightsSection() {

    const weakestTopic =
        getWeakestTopic();

    const strongestTopic =
        getStrongestTopic();

    const acceptanceRate =
        getAcceptanceRate();

    return (

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <h2 className="text-2xl font-semibold mb-6">

                AI Learning Insights

            </h2>

            <div className="space-y-4">

                <div className="bg-zinc-800 rounded-xl p-4">

                    <p className="text-zinc-400 text-sm">

                        Strongest Topic

                    </p>

                    <h3 className="text-xl font-bold mt-2">

                        {strongestTopic}

                    </h3>

                </div>

                <div className="bg-zinc-800 rounded-xl p-4">

                    <p className="text-zinc-400 text-sm">

                        Weakest Topic

                    </p>

                    <h3 className="text-xl font-bold mt-2">

                        {weakestTopic}

                    </h3>

                </div>

                <div className="bg-zinc-800 rounded-xl p-4">

                    <p className="text-zinc-400 text-sm">

                        Recommendation

                    </p>

                    <h3 className="text-lg font-semibold mt-2">

                        {acceptanceRate < 50
                            ? `Practice more ${weakestTopic} problems.`
                            : `Great progress. Push harder on medium and hard problems.`}

                    </h3>

                </div>

            </div>

        </div>

    );
}

export default AIInsightsSection;