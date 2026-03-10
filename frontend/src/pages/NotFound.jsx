import { Link } from "react-router-dom";
import { HiOutlineHome, HiOutlineExclamationCircle } from "react-icons/hi";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiOutlineExclamationCircle className="w-12 h-12 text-danger" />
        </div>

        <h1 className="text-6xl font-bold text-text mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text mb-2">
          Page Not Found
        </h2>
        <p className="text-muted mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 btn btn-primary px-6 py-3"
        >
          <HiOutlineHome className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="mt-12 text-sm text-muted">
          <p>Need help? Contact support at</p>
          <a
            href="mailto:support@guardianpath.com"
            className="text-primary hover:underline"
          >
            support@guardianpath.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
