import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../components/ui/Button";
import {
  BookOpen,
  Target,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Mail,
  UserPlus,
  Zap,
  CheckCircle,
  Quote,
} from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Senior Lecturer",
      content:
        "The AI assessment generator has saved me hours of manual work. The quality of questions is surprisingly high and aligns perfectly with my curriculum.",
      avatar: "SJ",
    },
    {
      name: "Mark Thompson",
      role: "LMS Administrator",
      content:
        "Transitioning to this platform was the best decision for our institution. The role-based control is granular and incredibly easy to manage.",
      avatar: "MT",
    },
    {
      name: "Elena Rodriguez",
      role: "Student",
      content:
        "The lesson planning interface is so intuitive. I can track my progress and understand what's coming next with zero confusion. Highly recommend!",
      avatar: "ER",
    },
  ];

  const faqs = [
    {
      question: "How does the AI lesson planner work?",
      answer:
        "Our AI analyzes your course objectives and topic requirements to generate structured modules, learning outcomes, and suggested content in seconds.",
    },
    {
      question: "Is the platform mobile-responsive?",
      answer:
        "Yes, the LMS is fully optimized for all devices, including smartphones and tablets, ensuring a seamless learning experience on the go.",
    },
    {
      question: "Can I customize the assessment types?",
      answer:
        "Absolutely! You can choose from multiple choice, short answer, and essay formats, or let the AI suggest the best format based on your content.",
    },
  ];

  const nextTestimonial = () =>
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () =>
    setActiveTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold gradient-text">Lumina LMS</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Features
            </a>
            <button
              onClick={() => navigate("/about")}
              className="font-medium text-gray-600 hover:text-primary transition-colors"
            >
              About
            </button>
            <Button
              className="btn-primary py-2.5! px-6 w-auto!"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-3/5 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Education for the Future
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-8">
                Learn Smarter with the{" "}
                <span className="gradient-text">Power of AI</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl lg:mx-0 mx-auto mb-10 leading-relaxed font-light">
                Smart lesson planning, automated assessments, and analytics
                seamlessly integrated into one powerful platform.
              </p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Button
                  className="btn-primary py-4! px-8 w-auto! text-lg flex items-center justify-center group"
                  onClick={() => navigate("/login")}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  className="bg-white text-gray-900 border border-gray-200 py-4! px-8 w-auto! text-lg hover:bg-gray-50"
                  onClick={() => navigate("/about")}
                >
                  Learn More
                </Button>
              </div>
            </div>

            <div className="lg:w-2/5 w-full max-w-[400px] lg:max-w-none">
              <div className="relative">
                <div className="absolute -inset-4 bg-linear-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                  {/* Mock UI snippet for visual interest */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">
                        My Dashboard
                      </h3>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                        disabled
                      />
                      <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          Enrolled
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          8 Courses
                        </div>
                      </div>
                      <div className="bg-accent/5 rounded-2xl border border-accent/10 p-4">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
                          <CheckCircle className="w-4 h-4 text-accent" />
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          Completed
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          16 Tasks
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold text-gray-900">
                          Software Engineering-SE1101
                        </div>
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          75%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Next: Module - Data Structures & Algorithms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Students", value: "25k+" },
              { label: "Courses Created", value: "1.2k+" },
              { label: "AI Assessments", value: "150k+" },
              { label: "Global Mentors", value: "500+" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl lg:text-4xl font-black text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-500 font-light">
              Get started with our AI-powered platform in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection line (hidden on mobile) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

            {[
              {
                icon: UserPlus,
                title: "Create Account",
                desc: "Sign up as a student or lecturer to get started.",
              },
              {
                icon: Zap,
                title: "Generate Content",
                desc: "Use AI to create lesson plans and assessments instantly.",
              },
              {
                icon: CheckCircle,
                title: "Master Goals",
                desc: "Track progress and achieve your learning objectives.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative z-10 flex flex-col items-center text-center bg-white p-6 rounded-3xl"
              >
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mb-6 border-8 border-gray-50">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-500 font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="bg-gray-50 py-24 border-y border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Revolutionizing Modern Education
            </h2>
            <p className="text-lg text-gray-500 font-light leading-relaxed">
              Discover features designed to empower educators and inspire
              students through intelligent automation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                color: "text-blue-500",
                bg: "bg-blue-50",
                title: "AI Lesson Planner",
                desc: "Generate high-quality, structured lesson plans in seconds with our advanced AI tools.",
              },
              {
                icon: Target,
                color: "text-emerald-500",
                bg: "bg-emerald-50",
                title: "Smart Assessments",
                desc: "Automatically create quizzes and exams tailored to your specific curriculum and goals.",
              },
              {
                icon: ShieldCheck,
                color: "text-purple-500",
                bg: "bg-purple-50",
                title: "Role-Based Access",
                desc: "Secure, granular permissions for Admins, Lecturers, and Students to ensure data integrity.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-3xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed font-light">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-500 font-light">
              Join thousands of satisfied users reshaping education.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[3rem] p-12 lg:p-20 relative shadow-inner">
            <Quote className="absolute top-10 left-10 w-20 h-20 text-primary/5 -z-1" />

            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-8 border-4 border-white shadow-lg">
                {testimonials[activeTestimonial].avatar}
              </div>
              <p className="text-2xl lg:text-3xl font-light text-gray-700 italic mb-10 leading-relaxed">
                "{testimonials[activeTestimonial].content}"
              </p>
              <div>
                <h4 className="text-xl font-bold text-gray-900">
                  {testimonials[activeTestimonial].name}
                </h4>
                <p className="text-primary font-medium">
                  {testimonials[activeTestimonial].role}
                </p>
              </div>

              {/* Slider Controls */}
              <div className="flex items-center space-x-6 mt-12">
                <button
                  onClick={prevTestimonial}
                  className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex space-x-2">
                  {testimonials.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${activeTestimonial === idx ? "bg-primary w-6" : "bg-gray-300"}`}
                    ></div>
                  ))}
                </div>
                <button
                  onClick={nextTestimonial}
                  className="w-12 h-12 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Common Questions
            </h2>
            <p className="text-lg text-gray-500 font-light leading-relaxed">
              Everything you need to know about our LMS.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <span className="text-lg font-bold text-gray-900">
                    {faq.question}
                  </span>
                  {activeFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <div
                  className={`px-8 transition-all duration-300 ease-in-out ${activeFaq === idx ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                >
                  <p className="text-gray-500 font-light leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary/5 rounded-[3rem] p-12 lg:p-20 flex flex-col lg:flex-row items-center justify-between gap-12 border border-primary/10">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Stay in the Loop
              </h2>
              <p className="text-lg text-gray-500 font-light">
                Get the latest updates on new AI features and platform
                improvements.
              </p>
            </div>
            <div className="lg:w-1/2 w-full max-w-md">
              <form className="relative" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-6 pr-40 py-5 bg-white border border-gray-200 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
                <button className="absolute right-2 top-2 bottom-2 bg-primary text-white px-8 rounded-xl font-bold hover:bg-primary-600 transition-all">
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-4 text-center lg:text-left">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="pb-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-gray-900 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-primary/20 to-accent/20 opacity-50 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">
                Ready to Start Learning?
              </h2>
              <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto font-light">
                Join the community of forward-thinking educators and students
                who are reshaping the future of learning together.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  className="btn-primary text-white border border-white/10 py-4! px-10 w-auto! text-lg hover:bg-white/20"
                  onClick={() => navigate("/about")}
                >
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div
            className="flex items-center space-x-2 grayscale opacity-70 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-xl font-bold">Lumina LMS</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 AI-Powered LMS. All rights reserved. Designed for Excellence.
          </p>
          <div className="flex space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
