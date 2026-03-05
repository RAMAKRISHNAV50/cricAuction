const About = () => {
  return (
    <div className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">About CricAuction</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Streamlining the Auction Process
          </p>
        </div>
        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <dt className="text-lg leading-6 font-medium text-gray-900">Real-time Bidding</dt>
              <dd className="mt-2 text-base text-gray-500">
                Our React-based frontend communicates directly with Spring Boot REST APIs to provide 
                instant updates when a player is sold.
              </dd>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <dt className="text-lg leading-6 font-medium text-gray-900">Secure Database</dt>
              <dd className="mt-2 text-base text-gray-500">
                Utilizing H2 Database technology to ensure player data and franchise net worth 
                are calculated accurately during every bid.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default About;