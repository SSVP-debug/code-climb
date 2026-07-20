import { SITE_URL } from "../../../config/site.js";
import LinkedInShareButton from "../../common/LinkedInShareButton";

function PublicProfileHeader({ profile }) {
  const snapshot = profile.recruiterSnapshot;
  const subline = [
    snapshot?.preferredRole,
    snapshot?.expectedGraduation && `Graduating ${snapshot.expectedGraduation}`,
  ].filter(Boolean).join(" · ");

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-4xl font-bold">{profile.displayName}</h1>
          {snapshot?.availableForWork && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Available for opportunities
            </span>
          )}
        </div>

        <p className="text-zinc-400 mt-2">@{profile.username}</p>

        {subline && <p className="text-zinc-500 text-sm mt-1">{subline}</p>}
      </div>

      <LinkedInShareButton url={`${SITE_URL}/u/${profile.username}`} />
    </div>
  );
}

export default PublicProfileHeader;
