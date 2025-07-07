import { useState } from "react";
import {
  CheckCircledIcon,
  FileTextIcon,
  Cross2Icon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import apiService from "../../services/api";

interface VerificationRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function VerificationRequestForm({
  onSuccess,
  onCancel,
}: VerificationRequestFormProps) {
  const requestType = "verified"; // Only support verification requests
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments((prev) => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for your verification request");
      return;
    }

    if (reason.trim().length < 100) {
      setError(
        "Reason must be at least 100 characters long to provide sufficient detail"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await apiService.verification.submitRequest({
        requestType,
        reason,
        documents: documents.length > 0 ? documents : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Failed to submit verification request:", error);

      // Check if the error is about already having a pending request
      const errorMessage =
        error?.response?.data?.message || error?.message || "";

      if (errorMessage === "You already have a pending verification request") {
        setError(
          "You already have a pending verification request. Please wait for it to be reviewed before submitting a new one."
        );
      } else {
        setError("Failed to submit verification request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <CheckCircledIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Request Submitted Successfully!
        </h3>
        <p className="text-gray-600 mb-4">
          Your verification request has been submitted for review. You'll be
          notified once it's been processed.
        </p>
        <button
          onClick={onSuccess}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Submit Verification Request
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reason */}
        <div>
          <label
            htmlFor="reason"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reason for Request *
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Explain why you should be verified (e.g., public figure, content creator, business representative)"
            required
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              Minimum 100 characters required
            </p>
            <p
              className={`text-xs ${
                reason.length < 100 ? "text-red-500" : "text-green-600"
              }`}
            >
              {reason.length}/100 characters
            </p>
          </div>
        </div>

        {/* Documents */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Documents (Optional)
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="documents"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileTextIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, JPG, PNG (MAX. 10MB each)
                  </p>
                </div>
                <input
                  id="documents"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleDocumentSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileTextIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1 text-red-600 hover:text-red-800 rounded"
                    >
                      <Cross2Icon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={
              isSubmitting || !reason.trim() || reason.trim().length < 100
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <PaperPlaneIcon className="w-4 h-4" />
                <span>Submit Request</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
