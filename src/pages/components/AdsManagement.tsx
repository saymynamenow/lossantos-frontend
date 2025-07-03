import { useState, useEffect } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  TrashIcon,
  EyeOpenIcon,
  BarChartIcon,
  PlayIcon,
  PauseIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  targetUrl: string;
  advertiser: {
    name: string;
    email: string;
    company: string;
  };
  campaign: {
    budget: number;
    spentBudget: number;
    startDate: string;
    endDate: string;
    targetAudience: string;
  };
  status: "active" | "paused" | "completed" | "draft";
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number; // click-through rate
  };
  placement: "sidebar" | "feed" | "banner" | "popup";
  createdAt: string;
}

export default function AdsManagement() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlacement, setFilterPlacement] = useState<string>("all");

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockData: Advertisement[] = [
        {
          id: "1",
          title: "Premium Software Suite",
          description:
            "Boost your productivity with our all-in-one software solution",
          imageUrl: "https://via.placeholder.com/300x200",
          targetUrl: "https://example.com/software",
          advertiser: {
            name: "John Smith",
            email: "john@softwarecom.com",
            company: "SoftwareCom Inc.",
          },
          campaign: {
            budget: 10000,
            spentBudget: 6500,
            startDate: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              Date.now() + 23 * 24 * 60 * 60 * 1000
            ).toISOString(),
            targetAudience: "Business professionals, 25-45",
          },
          status: "active",
          metrics: {
            impressions: 45000,
            clicks: 1250,
            conversions: 89,
            ctr: 2.78,
          },
          placement: "sidebar",
          createdAt: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          id: "2",
          title: "Fitness Equipment Sale",
          description: "Get fit with our premium home gym equipment - 30% off!",
          targetUrl: "https://example.com/fitness",
          advertiser: {
            name: "Sarah Wilson",
            email: "sarah@fitnessgear.com",
            company: "FitnessGear Pro",
          },
          campaign: {
            budget: 5000,
            spentBudget: 2100,
            startDate: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            endDate: new Date(
              Date.now() + 27 * 24 * 60 * 60 * 1000
            ).toISOString(),
            targetAudience: "Fitness enthusiasts, 20-50",
          },
          status: "paused",
          metrics: {
            impressions: 18500,
            clicks: 420,
            conversions: 32,
            ctr: 2.27,
          },
          placement: "feed",
          createdAt: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ];

      setAdvertisements(mockData);
    } catch (error) {
      console.error("Failed to fetch advertisements", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case "sidebar":
        return "bg-purple-100 text-purple-800";
      case "feed":
        return "bg-blue-100 text-blue-800";
      case "banner":
        return "bg-orange-100 text-orange-800";
      case "popup":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAds = advertisements.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.advertiser.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ad.status === filterStatus;
    const matchesPlacement =
      filterPlacement === "all" || ad.placement === filterPlacement;
    return matchesSearch && matchesStatus && matchesPlacement;
  });

  const handleToggleStatus = async (adId: string) => {
    try {
      setAdvertisements((prev) =>
        prev.map((ad) => {
          if (ad.id === adId) {
            const newStatus = ad.status === "active" ? "paused" : "active";
            return { ...ad, status: newStatus as Advertisement["status"] };
          }
          return ad;
        })
      );
    } catch (error) {
      console.error("Failed to toggle ad status", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Advertisement Management
        </h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Advertisement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Revenue", value: "$24,580", color: "green" },
          { title: "Active Campaigns", value: "12", color: "blue" },
          { title: "Total Impressions", value: "2.1M", color: "purple" },
          { title: "Avg. CTR", value: "2.8%", color: "orange" },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search advertisements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Placements</option>
            <option value="sidebar">Sidebar</option>
            <option value="feed">Feed</option>
            <option value="banner">Banner</option>
            <option value="popup">Popup</option>
          </select>
        </div>
      </div>

      {/* Advertisements List */}
      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No advertisements found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <div key={ad.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {ad.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        ad.status
                      )}`}
                    >
                      {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPlacementColor(
                        ad.placement
                      )}`}
                    >
                      {ad.placement.charAt(0).toUpperCase() +
                        ad.placement.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{ad.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-500">
                        Advertiser:
                      </span>
                      <p className="text-gray-900">{ad.advertiser.company}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Budget:</span>
                      <p className="text-gray-900">
                        ${ad.campaign.spentBudget.toLocaleString()} / $
                        {ad.campaign.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Impressions:
                      </span>
                      <p className="text-gray-900">
                        {ad.metrics.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">CTR:</span>
                      <p className="text-gray-900">{ad.metrics.ctr}%</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span>{ad.metrics.clicks.toLocaleString()} clicks</span>
                    <span>
                      {ad.metrics.conversions.toLocaleString()} conversions
                    </span>
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(ad.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(ad.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      ad.status === "active"
                        ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50"
                    }`}
                    title={ad.status === "active" ? "Pause" : "Resume"}
                  >
                    {ad.status === "active" ? (
                      <PauseIcon className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeOpenIcon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar for budget */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Budget Progress</span>
                  <span>
                    {Math.round(
                      (ad.campaign.spentBudget / ad.campaign.budget) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (ad.campaign.spentBudget / ad.campaign.budget) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
