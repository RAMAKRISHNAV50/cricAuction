import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-2xl py-32 sm:py-48">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Future of Cricket Bidding is Here.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              A professional platform where elite players meet world-class franchises. 
              Register today to join the most competitive auction pool in the world.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/signup-player" className="rounded-md bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition">
                Register as Player
              </Link>
              <Link to="/signup-franchise" className="text-lg font-semibold leading-6 text-gray-900 hover:text-blue-600 transition">
                Register Franchise <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;