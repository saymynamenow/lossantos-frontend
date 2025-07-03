import * as React from "react";
import { useState, useEffect } from "react";
import { Label } from "@radix-ui/react-label";
import { Button, Flex, Text, Heading } from "@radix-ui/themes";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/authContext";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    bio: "",
    birthDate: "",
    gender: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const [agreement, setAgreement] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/timeline");
    }
  }, [isAuthenticated, loading]);
  if (loading) return;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (
      step === 1 &&
      (!form.username ||
        !form.email ||
        !form.password ||
        form.password !== form.confirmPassword)
    ) {
      toast.error("Please complete all fields in Step 1 correctly.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${apiUrl}/auth/register`,
        {
          username: form.username,
          email: form.email,
          password: form.password,
          name: form.name,
          bio: form.bio ? form.bio : null,
          birthdate: form.birthDate ? form.birthDate : null,
          gender: form.gender ? form.gender : null,
        },
        {
          withCredentials: true,
        }
      );
      if (response.status === 201) {
        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        setForm({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          name: "",
          bio: "",
          birthDate: "",
          gender: "",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Registration failed", error);
      toast.error("Registration failed. Please try again.");
      return;
    }
  };

  const steps = [
    {
      id: 1,
      title: "General Information",
      description: "Basic account details",
    },
    { id: 2, title: "Profile", description: "Personal information" },
  ];

  return (
    <Flex
      direction="column"
      justify="center"
      align="center"
      className="min-h-screen text-white px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
    >
      <Flex direction="column" align="center" pt="6" pb="8">
        <Text
          size="8"
          weight="bold"
          mb="1"
          className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
        >
          Los Santos Media
        </Text>
      </Flex>
      <Heading as="h1" size="6" align="center" mb="8" className="text-gray-100">
        Create an Account
      </Heading>
      <div className="w-full max-w-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-center items-center gap-4">
            {steps.map((stepItem, index) => (
              <React.Fragment key={stepItem.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      step >= stepItem.id
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                        : "bg-gray-700 text-gray-400 border-2 border-gray-600"
                    }`}
                  >
                    {stepItem.id}
                  </div>
                  <Text
                    size="2"
                    className={`mt-2 text-center transition-colors duration-300 ${
                      step >= stepItem.id ? "text-yellow-400" : "text-gray-400"
                    }`}
                  >
                    {stepItem.title}
                  </Text>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 transition-all duration-500 ${
                      step > stepItem.id
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                        : "bg-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <Heading
                as="h2"
                size="4"
                mb="4"
                className="text-gray-100 text-center"
              >
                General Information
              </Heading>
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300"
                >
                  Username
                </Label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  placeholder="Your username"
                  autoComplete="username"
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300"
                >
                  Email
                </Label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Password
                </Label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="Password"
                    autoComplete="new-password"
                    className="w-full px-4 py-4 pr-12 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOpenIcon className="w-5 h-5" />
                    ) : (
                      <EyeClosedIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300"
                >
                  Confirm Password
                </Label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <Heading
                as="h2"
                size="4"
                mb="4"
                className="text-gray-100 text-center"
              >
                Profile Information
              </Heading>
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-300"
                >
                  Full Name
                </Label>
                <input
                  type="text"
                  id="fullName"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-300"
                >
                  Bio
                </Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself (optional)"
                  rows={4}
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-gray-300"
                >
                  Birth Date
                </Label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={form.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="block text-sm font-medium text-gray-300"
                >
                  Gender
                </Label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-4 bg-transparent border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:border-yellow-400 transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-gray-300">
                    Select your gender
                  </option>
                  <option value="male" className="bg-gray-800 text-gray-300">
                    Male
                  </option>
                  <option value="female" className="bg-gray-800 text-gray-300">
                    Female
                  </option>
                  <option value="other" className="bg-gray-800 text-gray-300">
                    Other
                  </option>
                  <option
                    value="prefer-not-to-say"
                    className="bg-gray-800 text-gray-300"
                  >
                    Prefer not to say
                  </option>
                </select>
              </div>
              <div className="pt-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="agreement"
                    name="agreement"
                    required
                    className="mt-1 w-5 h-5 text-yellow-400 bg-transparent border-2 border-gray-600 rounded focus:ring-yellow-400 focus:ring-2"
                    checked={agreement}
                    onChange={(e) => setAgreement(e.target.checked)}
                  />
                  <Text size="3" className="text-gray-300 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="text-yellow-400 hover:text-yellow-300 underline transition-colors duration-200"
                    >
                      Terms and Conditions
                    </a>
                  </Text>
                </label>
              </div>
            </div>
          )}
          <div className="flex justify-between pt-8">
            {step > 1 && (
              <Button
                onClick={handlePreviousStep}
                size="3"
                variant="outline"
                className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white rounded-xl transition-all duration-300"
              >
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button
                onClick={handleNextStep}
                size="3"
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 ml-auto"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                size="3"
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                disabled={!agreement || !form.name || isLoading}
              >
                Create Account
              </Button>
            )}
          </div>
        </form>
      </div>
    </Flex>
  );
}
