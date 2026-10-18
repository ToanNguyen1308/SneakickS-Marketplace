import BrowseGrid from "../components/BrowseGrid.jsx";

const Home = () => (
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

    <BrowseGrid />
  </div>
);

export default Home;
