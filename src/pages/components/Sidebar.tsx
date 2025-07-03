import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-96 ml-52 my-8 rounded-xl bg-white shadow-lg p-8 flex flex-col h-fit sticky top-16">
      <nav>
        <ul className="">
          {/* News Feed */}
          <li>
            <button
              onClick={() => navigate("/timeline")}
              className="flex items-center px-4 py-3 rounded-lg bg-gray-100 text-red-600 font-semibold text-lg w-full text-left"
            >
              <span className="mr-4">
                {/* News Feed Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10M7 12h10M7 16h6" />
                </svg>
              </span>
              News Feed
            </button>
          </li>
          {/* Saved Posts */}
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Saved Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              Saved Posts
            </a>
          </li>
          {/* Memories */}
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Memories Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M8 2v4M16 2v4" />
                </svg>
              </span>
              Memories
            </a>
          </li>
        </ul>
        {/* Advertising Section */}
        <div className="mt-8 mb-2 text-xs text-gray-400 font-semibold tracking-wider">
          ADVERTISING
        </div>
        <ul className="space-y-1">
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Ads Manager Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
              </span>
              Ads Manager
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Wallet Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3v4" />
                </svg>
              </span>
              Wallet
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Boosted Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l4 8H8l4-8zm0 20v-8m0 0l-4 8m4-8l4 8" />
                </svg>
              </span>
              Boosted
              <svg
                className="ml-auto"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </li>
        </ul>
        {/* Explore Section */}
        <div className="mt-8 mb-2 text-xs text-gray-400 font-semibold tracking-wider">
          EXPLORE
        </div>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => navigate("/people")}
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg w-full text-left"
            >
              <span className="mr-4">
                {/* People Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a7.5 7.5 0 0 1 13 0" />
                </svg>
              </span>
              People
            </button>
          </li>
          <li>
            <button
              onClick={() => navigate("/pages")}
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg w-full text-left"
            >
              <span className="mr-4">
                {/* Pages Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h10" />
                </svg>
              </span>
              Pages
            </button>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Groups Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="7" cy="7" r="3" />
                  <circle cx="17" cy="7" r="3" />
                  <circle cx="12" cy="17" r="3" />
                </svg>
              </span>
              Groups
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Events Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M16 2v4M8 2v4" />
                </svg>
              </span>
              Events
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Blogs Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path d="M8 8h8M8 12h8M8 16h4" />
                </svg>
              </span>
              Blogs
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Marketplace Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M16 3v4M8 3v4" />
                </svg>
              </span>
              Marketplace
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Offers Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 13.35V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7.35a2 2 0 0 0 .59 1.42l7 7a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 .59-1.42z" />
                </svg>
              </span>
              Offers
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center px-4 py-3 rounded-lg text-red-500 hover:bg-gray-100 text-lg"
            >
              <span className="mr-4">
                {/* Jobs Icon */}
                <svg
                  width="26"
                  height="26"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 3v4" />
                </svg>
              </span>
              Jobs
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
