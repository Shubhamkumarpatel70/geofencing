import { Outlet, Link } from "react-router-dom";
import { HiOutlineShieldCheck } from "react-icons/hi";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-secondary p-12 flex-col justify-between">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">GuardianPath</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Keep your family safe,
            <br />
            always connected.
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            Real-time location tracking, geofence alerts, and emergency SOS -
            everything you need for your family's safety in one app.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-white/70">Families Protected</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-white/70">Uptime</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-white/60 text-sm">
          <a href="#" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Support
          </a>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 sm:mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center">
                <HiOutlineShieldCheck className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-text">
                GuardianPath
              </span>
            </Link>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
