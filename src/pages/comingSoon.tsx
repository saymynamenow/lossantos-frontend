import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

const ComingSoon: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="space-y-8">
          {/* Simple icon */}
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl text-white">⚡</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              Coming Soon
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              We're working on something amazing. Stay tuned for updates!
            </p>
          </div>

          {/* Email signup */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Get Notified
              </h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Notify Me
                </button>
              </div>
            </div>
          </div>

          {/* Launch date */}
          <div className="pt-4">
            <p className="text-gray-500 text-sm">
              Expected Launch: Summer 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
