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
    idCard: null as File | null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);

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

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, or GIF)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setForm({ ...form, idCard: file });

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setIdCardPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    if (step === 2 && !form.name) {
      toast.error("Please enter your full name.");
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.idCard) {
      toast.error("Please upload your ID card to complete registration.");
      return;
    }

    try {
      setIsLoading(true);

      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("name", form.name);
      if (form.bio) formData.append("bio", form.bio);
      if (form.birthDate) formData.append("birthdate", form.birthDate);
      if (form.gender) formData.append("gender", form.gender);
      formData.append("idCard", form.idCard);

      const response = await axios.post(`${apiUrl}/auth/register`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
          idCard: null,
        });
        setIdCardPreview(null);
        navigate("/");
      }
    } catch (error) {
      console.error("Registration failed", error);
      toast.error("Registration failed. Please try again.");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "General Information",
      description: "Basic account details",
    },
    { id: 2, title: "Profile", description: "Personal information" },
    { id: 3, title: "OOC Verification", description: "ID card upload" },
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
          {step === 3 && (
            <div className="space-y-6">
              <Heading
                as="h2"
                size="4"
                mb="4"
                className="text-gray-100 text-center"
              >
                OOC Verification
              </Heading>

              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-lg">⚠️</span>
                  <Text size="3" className="text-yellow-200 font-medium">
                    Important Notice
                  </Text>
                </div>
                <Text size="2" className="text-yellow-100 mt-2">
                  To maintain the integrity of our roleplay community, we
                  require ID verification. Your ID will be securely stored and
                  only used for verification purposes.
                </Text>
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="idCard"
                  className="block text-sm font-medium text-gray-300"
                >
                  Upload ID Card *
                </Label>

                {!form.idCard ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
                    <div className="space-y-4">
                      <div className="text-4xl">🆔</div>
                      <div>
                        <Text size="3" className="text-gray-300 font-medium">
                          Upload your ID Card
                        </Text>
                        <Text size="2" className="text-gray-400 mt-1">
                          Please ensure your ID is clearly visible and readable
                        </Text>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="idCard"
                          name="idCard"
                          accept="image/*"
                          onChange={handleIdCardUpload}
                          required
                          className="hidden"
                        />
                        <label
                          htmlFor="idCard"
                          className="cursor-pointer inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
                        >
                          Choose ID Card
                        </label>
                        <Text size="1" className="text-gray-500 block">
                          Accepted formats: JPEG, PNG, GIF (Max 5MB)
                        </Text>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Text size="3" className="text-gray-300 font-medium">
                          ID Card Preview
                        </Text>
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, idCard: null });
                            setIdCardPreview(null);
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove
                        </button>
                      </div>

                      {idCardPreview && (
                        <div className="relative max-w-md mx-auto">
                          <img
                            src={idCardPreview}
                            alt="ID Card Preview"
                            className="w-full h-auto rounded-lg border border-gray-600"
                          />
                        </div>
                      )}

                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-green-400">✓</span>
                        <Text size="2" className="text-green-300">
                          {form.idCard.name} (
                          {(form.idCard.size / 1024 / 1024).toFixed(2)} MB)
                        </Text>
                      </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 text-lg">ℹ️</span>
                        <Text size="3" className="text-blue-200 font-medium">
                          Verification Process
                        </Text>
                      </div>
                      <Text size="2" className="text-blue-100 mt-2">
                        Your ID will be reviewed by our staff team. This process
                        may take 24-48 hours. You'll receive an email
                        notification once your account is verified.
                      </Text>
                    </div>
                  </div>
                )}
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
                    </a>{" "}
                    and consent to ID verification for roleplay purposes.
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
            {step < 3 ? (
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
                disabled={!agreement || !form.name || !form.idCard || isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Flex>
  );
}
