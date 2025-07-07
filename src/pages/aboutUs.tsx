import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";

export default function AboutUs() {
  const navigate = useNavigate();

  useEffect(() => {
    // Set page title
    document.title = "About Us - Los Santos Media";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                Los Santos Media
              </span>
            </h1>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-red-100 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-orange-100 rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connecting communities, sharing stories, and building relationships
            in the digital age.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100 to-orange-100 rounded-full transform translate-x-32 -translate-y-32 opacity-50"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Who We Are
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Los santos media is a social media platform in San Andreas held
                by Senora Prime Tech by Senora Prime Group. We provide a
                platform for everyone to express themselves and create here.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We're committed to building a safe, inclusive, and vibrant
                community where creativity flourishes and relationships thrive.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            What Makes Us Different
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Community First
              </h3>
              <p className="text-gray-600">
                We prioritize building genuine connections and fostering a
                supportive community environment.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Privacy & Security
              </h3>
              <p className="text-gray-600">
                Your data is protected with industry-leading security measures
                and transparent privacy policies.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Innovation
              </h3>
              <p className="text-gray-600">
                Constantly evolving with cutting-edge features and user-centered
                design improvements.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-20">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
                <div className="text-red-100">Active Users</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">1M+</div>
                <div className="text-red-100">Posts Shared</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
                <div className="text-red-100">Communities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Authenticity
                  </h3>
                  <p className="text-gray-600">
                    We encourage genuine self-expression and authentic
                    storytelling.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Inclusivity
                  </h3>
                  <p className="text-gray-600">
                    Everyone deserves a voice and a place to belong in our
                    community.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Creativity
                  </h3>
                  <p className="text-gray-600">
                    We celebrate creative expression in all its forms.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Respect
                  </h3>
                  <p className="text-gray-600">
                    Mutual respect and understanding form the foundation of our
                    interactions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Growth
                  </h3>
                  <p className="text-gray-600">
                    We support personal and community growth through meaningful
                    connections.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Innovation
                  </h3>
                  <p className="text-gray-600">
                    We continuously innovate to enhance user experience and
                    community value.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            LSM Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Team Member 1 - Marko Yoshimuri */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group cursor-pointer">
              <div className="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 relative group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-green-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">MY</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Cho Daesung
              </h3>
              <p className="text-red-600 font-medium mb-3">CEO & Founder</p>
              <p className="text-gray-600 text-sm">
                Passionate about building communities and connecting people
                through technology.
              </p>
            </div>

            {/* Team Member 2 - Daniel Yoshimuri */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group cursor-pointer">
              <div className="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 relative group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-green-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">DY</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Meriadoc Osint
              </h3>
              <p className="text-blue-600 font-medium mb-3">
                Head Of Technology & Board Of Director
              </p>
              <p className="text-gray-600 text-sm">
                Focused on operational excellence and building scalable business
                processes.
              </p>
            </div>

            {/* Team Member 3 - Joshua Okimoto */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group cursor-pointer">
              <div className="w-32 h-32 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 relative group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-green-400 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">JO</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                Efren Bolster
              </h3>
              <p className="text-green-600 font-medium mb-3">
                Head of Moderator
              </p>
              <p className="text-gray-600 text-sm">
                Driving innovation and ensuring technical excellence across all
                our projects.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-3xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Join Our Community?
            </h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Be part of something bigger. Connect, share, and grow with Los
              Santos Media.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-red-50 transition-colors"
              >
                Get Started Today
              </button>
              <button
                onClick={() => navigate("/")}
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-red-600 transition-colors"
              >
                Explore Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
