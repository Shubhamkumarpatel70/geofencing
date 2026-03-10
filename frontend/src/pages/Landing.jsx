import { Link } from "react-router-dom";
import {
  HiOutlineShieldCheck,
  HiOutlineLocationMarker,
  HiOutlineBell,
  HiOutlineLightningBolt,
  HiOutlineDeviceMobile,
  HiOutlineUserGroup,
  HiOutlineCheck,
  HiOutlineArrowRight,
} from "react-icons/hi";

const Landing = () => {
  const features = [
    {
      icon: HiOutlineLocationMarker,
      title: "Real-Time Tracking",
      description:
        "Know where your children are at all times with accurate GPS tracking updated in real-time.",
    },
    {
      icon: HiOutlineBell,
      title: "Geofence Alerts",
      description:
        "Create safe zones and get instant notifications when your child enters or leaves them.",
    },
    {
      icon: HiOutlineLightningBolt,
      title: "Emergency SOS",
      description:
        "One-tap SOS button that instantly alerts parents with location in emergencies.",
    },
    {
      icon: HiOutlineDeviceMobile,
      title: "Battery Monitoring",
      description:
        "Stay informed about your child's device battery level and connection status.",
    },
    {
      icon: HiOutlineUserGroup,
      title: "Multi-Child Support",
      description:
        "Track multiple children from a single dashboard with individual profiles.",
    },
    {
      icon: HiOutlineShieldCheck,
      title: "Privacy First",
      description:
        "End-to-end encryption ensures your family's location data stays private.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center">
                <HiOutlineShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-text">
                GuardianPath
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="text-sm sm:text-base text-muted hover:text-text transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <HiOutlineShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
              Trusted by 10,000+ families
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text leading-tight mb-4 sm:mb-6">
              Keep Your Family{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Safe & Connected
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Real-time location tracking, smart geofence alerts, and instant
              SOS notifications. Give your family the protection they deserve.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/signup"
                className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto"
              >
                Start Free Trial
                <HiOutlineArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="btn btn-outline text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-10 sm:mt-16 relative">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl p-1 max-w-4xl mx-auto shadow-2xl">
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-8">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <HiOutlineLocationMarker className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <p className="text-sm sm:text-base text-muted">
                      Interactive Map Dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text mb-3 sm:mb-4">
              Everything You Need for Family Safety
            </h2>
            <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto px-2">
              Comprehensive features designed to give parents peace of mind
              while respecting children's growing independence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 card-hover"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text mb-1 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text mb-3 sm:mb-4">
              Getting Started is Easy
            </h2>
            <p className="text-base sm:text-lg text-muted">
              Set up in minutes, protection for life
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up as a parent and set up your family profile in seconds.",
              },
              {
                step: "02",
                title: "Add Children",
                desc: "Create child accounts or link existing ones using a secure code.",
              },
              {
                step: "03",
                title: "Start Tracking",
                desc: "View real-time locations and set up geofence zones instantly.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-secondary rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-xl sm:text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text mb-1 sm:mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Protect Your Family?
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-6 sm:mb-8 px-2">
            Join thousands of parents who trust GuardianPath for their family's
            safety.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/signup"
              className="btn bg-white text-primary hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 w-full sm:w-auto"
            >
              Create Free Account
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <HiOutlineCheck className="w-4 h-4" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-2">
              <HiOutlineCheck className="w-4 h-4" /> No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 bg-text safe-bottom">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-lg sm:rounded-xl flex items-center justify-center">
                <HiOutlineShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">
                GuardianPath
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-500 text-xs sm:text-sm">
            © 2024 GuardianPath. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
