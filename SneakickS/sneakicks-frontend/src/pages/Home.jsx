import BrowseGrid from "../components/BrowseGrid.jsx";
import RecRow from "../components/RecRow.jsx";
import * as recApi from "../api/recommendations";
import { flush, getSessionId } from "../lib/tracking";
import { useAuth } from "../contexts/AuthContext.jsx";

const loadRecentlyViewed = async () => {
  await flush();
  return recApi.getRecentlyViewed({ session_id: getSessionId(), limit: 12 });
};

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-ink text-white px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Buy &amp; sell the latest sneakers
        </h1>
        <p className="text-slate-300 mt-2 max-w-xl">
          A live marketplace for sneakers, streetwear and collectibles. Every item is authenticated
          before it ships.
        </p>
      </div>

      <RecRow
        title="Trending now"
        subtitle="Most viewed, followed and traded this week"
        source="rec_trending"
        load={() => recApi.getTrending({ limit: 12 })}
      />

      <RecRow
        title="Recently viewed"
        source="rec_recent"
        load={loadRecentlyViewed}
        deps={[user?.id]}
        hideWhenEmpty
      />

      <BrowseGrid />
    </div>
  );
};

export default Home;
